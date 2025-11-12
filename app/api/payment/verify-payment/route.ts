import { createClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Verify payment status by actively querying Stripe API
 * This endpoint can be called to manually verify pending payments
 * Useful for checking payments that might have been missed by webhook
 */
export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json()
    const { recharge_id } = body

    if (!recharge_id) {
      return NextResponse.json(
        { error: 'Missing recharge_id parameter' },
        { status: 400 }
      )
    }

    // Get recharge record
    const { data: rechargeRecord, error: rechargeError } = await supabase
      .from('recharge_records')
      .select('*')
      .eq('id', recharge_id)
      .single()

    if (rechargeError || !rechargeRecord) {
      return NextResponse.json(
        { error: 'Recharge record not found', details: rechargeError?.message },
        { status: 404 }
      )
    }

    // Only verify pending payments
    if (rechargeRecord.status !== 'pending') {
      return NextResponse.json({
        success: true,
        message: `Recharge already ${rechargeRecord.status}`,
        recharge_status: rechargeRecord.status,
        recharge_record: rechargeRecord,
      })
    }

    // Try to verify payment with Stripe
    let paymentVerified = false
    let paymentStatus = 'unknown'

    if (rechargeRecord.payment_id) {
      try {
        const stripe = getStripe()
        // Try as Checkout Session
        const session = await stripe.checkout.sessions.retrieve(rechargeRecord.payment_id)
        paymentStatus = session.payment_status

        if (session.payment_status === 'paid') {
          paymentVerified = true
        }
      } catch (sessionError) {
        // Not a session, might be payment intent or payment link
        console.log('Not a session, checking other payment types...')
      }
    }

    // If payment verified, update database
    if (paymentVerified) {
      const { data: userProfile } = await supabase
        .from('users')
        .select('credits')
        .eq('id', rechargeRecord.user_id)
        .single()

      const currentCredits = userProfile?.credits ?? 0
      const newCredits = currentCredits + rechargeRecord.credits

      // Update user credits
      await supabase
        .from('users')
        .update({ credits: newCredits })
        .eq('id', rechargeRecord.user_id)

      // Update recharge record
      await supabase
        .from('recharge_records')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', recharge_id)

      return NextResponse.json({
        success: true,
        payment_verified: true,
        recharge_status: 'completed',
        user_credits: newCredits,
        message: 'Payment verified and credits added',
      })
    }

    return NextResponse.json({
      success: true,
      payment_verified: false,
      payment_status: paymentStatus,
      recharge_status: rechargeRecord.status,
      message: 'Payment verification completed, but payment not yet confirmed',
    })
  } catch (error) {
    console.error('Failed to verify payment:', error)
    return NextResponse.json(
      { error: 'Failed to verify payment', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

