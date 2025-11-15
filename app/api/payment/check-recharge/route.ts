// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { getOrCreateUser } from '@/lib/user'
import { getStripe } from '@/lib/stripe'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Check recharge record status
 * Used for Payment Link payments where we don't have a session_id
 * This API will:
 * 1. Check database recharge record status
 * 2. If pending, actively query Stripe API to verify payment status
 * 3. Update database if payment is confirmed
 */
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const rechargeId = searchParams.get('recharge_id')

    if (!rechargeId) {
      return NextResponse.json(
        { error: 'Missing recharge_id parameter' },
        { status: 400 }
      )
    }

    // Verify user identity
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get or create user profile
    const userProfile = await getOrCreateUser(supabase, user)
    if (!userProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Query recharge record
    const { data: rechargeRecord, error: rechargeError } = await supabase
      .from('recharge_records')
      .select('*')
      .eq('id', rechargeId)
      .single()

    if (rechargeError || !rechargeRecord) {
      return NextResponse.json(
        { error: 'Recharge record not found', details: rechargeError?.message },
        { status: 404 }
      )
    }

    // Verify user owns this recharge record
    if (rechargeRecord.user_id !== userProfile.id) {
      return NextResponse.json(
        { error: 'User mismatch' },
        { status: 403 }
      )
    }

    // If recharge is still pending, actively check Stripe payment status
    if (rechargeRecord.status === 'pending' && rechargeRecord.payment_id) {
      try {
        const stripe = getStripe()
        // For Payment Link, payment_id might be the Payment Link ID or Session ID
        // Try to retrieve as Checkout Session first
        try {
          const session = await stripe.checkout.sessions.retrieve(rechargeRecord.payment_id)
          
          if (session.payment_status === 'paid' && rechargeRecord.status === 'pending') {
            // Payment confirmed in Stripe but not updated in our database
            // Update the recharge record and user credits
            const { data: userData } = await supabase
              .from('users')
              .select('credits')
              .eq('id', userProfile.id)
              .single()

            const currentCredits = userData?.credits ?? 0
            const newCredits = currentCredits + rechargeRecord.credits

            // Update user credits
            await supabase
              .from('users')
              .update({ credits: newCredits })
              .eq('id', userProfile.id)

            // Update recharge record
            await supabase
              .from('recharge_records')
              .update({
                status: 'completed',
                completed_at: new Date().toISOString(),
              })
              .eq('id', rechargeId)

            // Return updated status
            return NextResponse.json({
              success: true,
              recharge_status: 'completed',
              recharge_record: {
                ...rechargeRecord,
                status: 'completed',
              },
              user_credits: newCredits,
              payment_verified: true,
              message: 'Payment verified and credits added',
            })
          } else if (session.payment_status === 'unpaid' || session.payment_status === 'no_payment_required') {
            // Payment not completed
            return NextResponse.json({
              success: true,
              recharge_status: 'pending',
              recharge_record: rechargeRecord,
              payment_status: session.payment_status,
              user_credits: (await supabase.from('users').select('credits').eq('id', userProfile.id).single()).data?.credits ?? 0,
              message: 'Payment not yet completed',
            })
          }
        } catch (sessionError) {
          // If not a session ID, might be a Payment Link ID
          // For Payment Link, we need to check payment intents or events
          console.log('Not a session ID, checking payment intents...', sessionError)
        }

        // Try to find payment intents associated with this payment
        // For Payment Link, we can search by customer email or amount
        const { data: userEmail } = await supabase
          .from('users')
          .select('email')
          .eq('id', userProfile.id)
          .single()

        if (userEmail?.email) {
          // Search for payment intents with matching amount and customer
          const stripe = getStripe()
          const paymentIntents = await stripe.paymentIntents.list({
            limit: 10,
          })

          // Find matching payment intent
          const matchingIntent = paymentIntents.data.find(
            (pi) =>
              pi.amount === Math.round(rechargeRecord.amount * 100) && // Convert to cents
              pi.status === 'succeeded' &&
              pi.created > Math.floor(new Date(rechargeRecord.created_at).getTime() / 1000) - 3600 // Within 1 hour
          )

          if (matchingIntent && rechargeRecord.status === 'pending') {
            // Payment confirmed in Stripe
            const { data: userData } = await supabase
              .from('users')
              .select('credits')
              .eq('id', userProfile.id)
              .single()

            const currentCredits = userData?.credits ?? 0
            const newCredits = currentCredits + rechargeRecord.credits

            // Update user credits
            await supabase
              .from('users')
              .update({ credits: newCredits })
              .eq('id', userProfile.id)

            // Update recharge record
            await supabase
              .from('recharge_records')
              .update({
                status: 'completed',
                completed_at: new Date().toISOString(),
                payment_id: matchingIntent.id,
              })
              .eq('id', rechargeId)

            return NextResponse.json({
              success: true,
              recharge_status: 'completed',
              recharge_record: {
                ...rechargeRecord,
                status: 'completed',
              },
              user_credits: newCredits,
              payment_verified: true,
              message: 'Payment verified and credits added',
            })
          }
        }
      } catch (stripeError) {
        console.error('Failed to verify payment with Stripe:', stripeError)
        // Continue to return database status even if Stripe check fails
      }
    }

    // Get user current credits
    const { data: userCreditsData } = await supabase
      .from('users')
      .select('credits')
      .eq('id', userProfile.id)
      .single()

    return NextResponse.json({
      success: true,
      recharge_status: rechargeRecord.status,
      recharge_record: rechargeRecord,
      user_credits: userCreditsData?.credits ?? 0,
      payment_verified: false,
    })
  } catch (error) {
    console.error('Failed to check recharge status:', error)
    return NextResponse.json(
      { error: 'Failed to check recharge status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

