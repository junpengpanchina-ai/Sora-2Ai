import { createClient } from '@/lib/supabase/server'
import { getOrCreateUser } from '@/lib/user'
import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'

// 初始化 Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
})

/**
 * 检查 Stripe Checkout Session 状态
 * 用于支付成功页面验证支付是否真的成功
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing session_id parameter' },
        { status: 400 }
      )
    }

    // 验证用户身份
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

    // 从 Stripe 获取 Session 信息
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    // 检查 Session 状态
    if (session.payment_status !== 'paid') {
      return NextResponse.json({
        success: false,
        payment_status: session.payment_status,
        message: 'Payment not completed',
        session_status: session.status,
      })
    }

    // 从 metadata 获取充值记录ID
    const rechargeId = session.metadata?.recharge_id
    const userId = session.metadata?.user_id

    if (!rechargeId || !userId) {
      return NextResponse.json(
        { error: 'Missing recharge information in session metadata' },
        { status: 400 }
      )
    }

    // 验证用户ID匹配
    const userProfile = await getOrCreateUser(supabase, user)
    if (!userProfile || userProfile.id !== userId) {
      return NextResponse.json(
        { error: 'User mismatch' },
        { status: 403 }
      )
    }

    // 查询充值记录状态
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

    // 获取用户当前积分
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('credits')
      .eq('id', userId)
      .single()

    return NextResponse.json({
      success: true,
      payment_status: session.payment_status,
      session_status: session.status,
      recharge_status: rechargeRecord.status,
      recharge_record: {
        id: rechargeRecord.id,
        amount: rechargeRecord.amount,
        credits: rechargeRecord.credits,
        status: rechargeRecord.status,
        created_at: rechargeRecord.created_at,
        completed_at: rechargeRecord.completed_at,
      },
      user_credits: userData?.credits || 0,
      message: rechargeRecord.status === 'completed' 
        ? 'Payment completed and credits added successfully'
        : rechargeRecord.status === 'pending'
        ? 'Payment received, processing credits...'
        : 'Payment status unknown',
    })
  } catch (error) {
    console.error('Failed to check session:', error)
    return NextResponse.json(
      {
        error: 'Failed to check session',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

