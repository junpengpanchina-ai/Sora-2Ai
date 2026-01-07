// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'
import { NextRequest, NextResponse } from 'next/server'
import { addCreditsToWallet } from '@/lib/credit-wallet'


// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic'
export const revalidate = 0

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
        const message =
          sessionError instanceof Error ? sessionError.message : String(sessionError)
        console.log('Not a session, checking other payment types...', message)
      }
    }

    // If payment verified, update database
    if (paymentVerified) {
      const creditsToAdd = rechargeRecord.credits ?? 0

      // 使用钱包系统添加积分（全部作为永久积分；后续可按档位拆分为 permanent + bonus）
      if (creditsToAdd > 0) {
        const walletResult = await addCreditsToWallet(
          supabase,
          rechargeRecord.user_id,
          creditsToAdd,
          0,
          null,
          false
        )

        if (!walletResult.success) {
          console.error('Failed to add credits to wallet in verify-payment:', walletResult.error)
        }
      }

      // 标记充值记录已完成
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

