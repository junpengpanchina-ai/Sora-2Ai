import { createClient } from '@/lib/supabase/server'
import { getOrCreateUser } from '@/lib/user'
import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
})

// Credits exchange rate
const CREDITS_PER_USD = 100 // 1 USD = 100 credits

/**
 * Sync recent payments from Stripe
 * This API will:
 * 1. Query recent successful payments from Stripe
 * 2. Check if recharge records exist in database
 * 3. Create missing recharge records and update credits
 */
export async function POST(request: NextRequest) {
  try {
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

    // Get user email
    const { data: userWithEmail } = await supabase
      .from('users')
      .select('email')
      .eq('id', userProfile.id)
      .single()

    const userEmail = userWithEmail?.email || user.email

    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      )
    }

    // Query recent checkout sessions from Stripe (last 7 days)
    const sevenDaysAgo = Math.floor(Date.now() / 1000) - 604800
    const sessions = await stripe.checkout.sessions.list({
      limit: 50,
      created: { gte: sevenDaysAgo },
    })

    // Also query Payment Intents (for Payment Links)
    const paymentIntents = await stripe.paymentIntents.list({
      limit: 50,
      created: { gte: sevenDaysAgo },
    })

    const syncedPayments: any[] = []
    const errors: any[] = []

    // Process Checkout Sessions
    for (const session of sessions.data) {
      // Only process paid sessions
      if (session.payment_status !== 'paid') continue

      // Check if customer email matches
      let customerEmailMatches = false
      if (session.customer_email === userEmail) {
        customerEmailMatches = true
      } else if (session.customer) {
        // session.customer can be string (ID), Customer object, or DeletedCustomer
        if (typeof session.customer === 'string') {
          // If it's a string (customer ID), retrieve the customer object
          try {
            const customer = await stripe.customers.retrieve(session.customer)
            // Check if customer is deleted (DeletedCustomer has deleted: true)
            if (customer.deleted !== true && 'email' in customer && customer.email === userEmail) {
              customerEmailMatches = true
            }
          } catch (e) {
            // If retrieval fails, skip this session
            continue
          }
        } else if (typeof session.customer === 'object' && 'email' in session.customer && session.customer.email === userEmail) {
          customerEmailMatches = true
        }
      }
      
      if (!customerEmailMatches) {
        continue
      }

      try {
        // Check if recharge record already exists by session ID
        const { data: existingRecord } = await supabase
          .from('recharge_records')
          .select('*')
          .eq('payment_id', session.id)
          .single()

        // Also check by amount and date (in case payment_id is a Payment Link ID)
        const sessionAmount = session.amount_total ? session.amount_total / 100 : 0
        const sessionDate = new Date(session.created * 1000)
        
        if (!existingRecord) {
          // Try to find by amount and approximate date (within 1 hour)
          const oneHourAgo = new Date(sessionDate.getTime() - 3600000)
          const oneHourLater = new Date(sessionDate.getTime() + 3600000)
          
          const { data: recordsByAmount } = await supabase
            .from('recharge_records')
            .select('*')
            .eq('user_id', userProfile.id)
            .eq('amount', sessionAmount)
            .gte('created_at', oneHourAgo.toISOString())
            .lte('created_at', oneHourLater.toISOString())
            .order('created_at', { ascending: false })
            .limit(1)

          if (recordsByAmount && recordsByAmount.length > 0) {
            const existingRecordByAmount = recordsByAmount[0]
            
            // Update the existing record with the real session ID
            await supabase
              .from('recharge_records')
              .update({
                payment_id: session.id,
                status: 'completed',
                completed_at: new Date().toISOString(),
              })
              .eq('id', existingRecordByAmount.id)

            // Add credits if not already added
            if (existingRecordByAmount.status !== 'completed') {
              const { data: userData } = await supabase
                .from('users')
                .select('credits')
                .eq('id', userProfile.id)
                .single()

              const currentCredits = userData?.credits ?? 0
              const newCredits = currentCredits + existingRecordByAmount.credits

              await supabase
                .from('users')
                .update({ credits: newCredits })
                .eq('id', userProfile.id)
            }

            syncedPayments.push({
              session_id: session.id,
              action: 'matched_and_updated',
              recharge_id: existingRecordByAmount.id,
              amount: sessionAmount,
            })
            continue
          }
        }

        if (existingRecord) {
          // Record exists, check if it needs updating
          if (existingRecord.status !== 'completed') {
            // Update to completed and add credits if not already done
            const { data: userData } = await supabase
              .from('users')
              .select('credits')
              .eq('id', userProfile.id)
              .single()

            const currentCredits = userData?.credits ?? 0
            const newCredits = currentCredits + existingRecord.credits

            await supabase
              .from('users')
              .update({ credits: newCredits })
              .eq('id', userProfile.id)

            await supabase
              .from('recharge_records')
              .update({
                status: 'completed',
                completed_at: new Date().toISOString(),
                payment_id: session.id, // Update with real session ID
              })
              .eq('id', existingRecord.id)

            syncedPayments.push({
              session_id: session.id,
              action: 'updated',
              recharge_id: existingRecord.id,
              amount: sessionAmount,
            })
          } else {
            // Already completed, but update payment_id if it's still a Payment Link ID
            if (existingRecord.payment_id && !existingRecord.payment_id.startsWith('cs_')) {
              await supabase
                .from('recharge_records')
                .update({
                  payment_id: session.id, // Update with real session ID
                })
                .eq('id', existingRecord.id)
            }
          }
        } else {
          // Create new recharge record from actual payment
          const amount = session.amount_total ? session.amount_total / 100 : 0
          const credits = Math.round(amount * CREDITS_PER_USD)

          // Check if we should create a new record (avoid duplicates)
          // Only create if there's no record with this amount in the last hour
          const oneHourAgo = new Date(Date.now() - 3600000)
          const { data: recentRecords } = await supabase
            .from('recharge_records')
            .select('*')
            .eq('user_id', userProfile.id)
            .eq('amount', amount)
            .gte('created_at', oneHourAgo.toISOString())
            .limit(1)

          if (recentRecords && recentRecords.length > 0) {
            // Update existing record with real session ID
            const existingRecord = recentRecords[0]
            await supabase
              .from('recharge_records')
              .update({
                payment_id: session.id,
                status: 'completed',
                completed_at: new Date().toISOString(),
              })
              .eq('id', existingRecord.id)

            // Add credits if not already added
            if (existingRecord.status !== 'completed') {
              const { data: userData } = await supabase
                .from('users')
                .select('credits')
                .eq('id', userProfile.id)
                .single()

              const currentCredits = userData?.credits ?? 0
              const newCredits = currentCredits + existingRecord.credits

              await supabase
                .from('users')
                .update({ credits: newCredits })
                .eq('id', userProfile.id)
            }

            syncedPayments.push({
              session_id: session.id,
              action: 'matched_existing',
              recharge_id: existingRecord.id,
              amount: amount,
            })
          } else {
            // Create new recharge record
            const { data: newRecord, error: createError } = await supabase
              .from('recharge_records')
              .insert({
                user_id: userProfile.id,
                amount: amount,
                credits: credits,
                payment_method: 'stripe_payment_link',
                payment_id: session.id,
                status: 'completed',
                completed_at: new Date().toISOString(),
              })
              .select()
              .single()

            if (newRecord && !createError) {
              // Add credits to user
              const { data: userData } = await supabase
                .from('users')
                .select('credits')
                .eq('id', userProfile.id)
                .single()

              const currentCredits = userData?.credits ?? 0
              const newCredits = currentCredits + credits

              await supabase
                .from('users')
                .update({ credits: newCredits })
                .eq('id', userProfile.id)

              syncedPayments.push({
                session_id: session.id,
                action: 'created',
                recharge_id: newRecord.id,
                amount: amount,
                credits: credits,
              })
            } else {
              errors.push({
                session_id: session.id,
                error: createError?.message || 'Failed to create record',
              })
            }
          }
        }
      } catch (error) {
        errors.push({
          session_id: session.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    // Process Payment Intents (for Payment Links that don't create Checkout Sessions)
    for (const intent of paymentIntents.data) {
      // Only process succeeded intents
      if (intent.status !== 'succeeded') continue

      // Check if customer email matches
      if (intent.receipt_email !== userEmail) {
        // Try to get customer email from customer object
        if (intent.customer) {
          try {
            const customer = await stripe.customers.retrieve(intent.customer as string)
            // Check if customer is deleted (DeletedCustomer has deleted: true)
            if (customer.deleted === true || !('email' in customer) || customer.email !== userEmail) {
              continue
            }
          } catch (e) {
            continue
          }
        } else {
          continue
        }
      }

      try {
        const intentAmount = intent.amount / 100 // Convert from cents
        const intentDate = new Date(intent.created * 1000)

        // Check if record exists by payment intent ID
        const { data: existingRecord } = await supabase
          .from('recharge_records')
          .select('*')
          .eq('payment_id', intent.id)
          .single()

        if (!existingRecord) {
          // Try to find by amount and date
          const oneHourAgo = new Date(intentDate.getTime() - 3600000)
          const oneHourLater = new Date(intentDate.getTime() + 3600000)

          const { data: recordsByAmount } = await supabase
            .from('recharge_records')
            .select('*')
            .eq('user_id', userProfile.id)
            .eq('amount', intentAmount)
            .gte('created_at', oneHourAgo.toISOString())
            .lte('created_at', oneHourLater.toISOString())
            .order('created_at', { ascending: false })
            .limit(1)

          if (recordsByAmount && recordsByAmount.length > 0) {
            const existingRecordByAmount = recordsByAmount[0]
            
            // Update with real payment intent ID
            await supabase
              .from('recharge_records')
              .update({
                payment_id: intent.id,
                status: 'completed',
                completed_at: new Date().toISOString(),
              })
              .eq('id', existingRecordByAmount.id)

            if (existingRecordByAmount.status !== 'completed') {
              const { data: userData } = await supabase
                .from('users')
                .select('credits')
                .eq('id', userProfile.id)
                .single()

              const currentCredits = userData?.credits ?? 0
              const newCredits = currentCredits + existingRecordByAmount.credits

              await supabase
                .from('users')
                .update({ credits: newCredits })
                .eq('id', userProfile.id)
            }

            syncedPayments.push({
              payment_intent_id: intent.id,
              action: 'matched_and_updated',
              recharge_id: existingRecordByAmount.id,
              amount: intentAmount,
            })
          } else {
            // Create new record
            const credits = Math.round(intentAmount * CREDITS_PER_USD)
            const { data: newRecord, error: createError } = await supabase
              .from('recharge_records')
              .insert({
                user_id: userProfile.id,
                amount: intentAmount,
                credits: credits,
                payment_method: 'stripe_payment_link',
                payment_id: intent.id,
                status: 'completed',
                completed_at: new Date().toISOString(),
              })
              .select()
              .single()

            if (newRecord && !createError) {
              const { data: userData } = await supabase
                .from('users')
                .select('credits')
                .eq('id', userProfile.id)
                .single()

              const currentCredits = userData?.credits ?? 0
              const newCredits = currentCredits + credits

              await supabase
                .from('users')
                .update({ credits: newCredits })
                .eq('id', userProfile.id)

              syncedPayments.push({
                payment_intent_id: intent.id,
                action: 'created',
                recharge_id: newRecord.id,
                amount: intentAmount,
                credits: credits,
              })
            }
          }
        }
      } catch (error) {
        errors.push({
          payment_intent_id: intent.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return NextResponse.json({
      success: true,
      synced_payments: syncedPayments,
      errors: errors,
      message: `Synced ${syncedPayments.length} payment(s)`,
    })
  } catch (error) {
    console.error('Failed to sync payments:', error)
    return NextResponse.json(
      {
        error: 'Failed to sync payments',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

