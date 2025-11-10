import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'

// 禁用 Next.js 的 body 解析，因为我们需要原始 body 来验证签名
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// 初始化 Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

// Webhook 签名密钥（从 Stripe Dashboard 获取）
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature provided' },
        { status: 400 }
      )
    }

    // 验证 Webhook 签名
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      )
    }

    // 处理支付成功事件
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session

      // 从 metadata 中获取充值信息（Checkout Session）
      let rechargeId = session.metadata?.recharge_id
      let userId = session.metadata?.user_id
      let amount = parseFloat(session.metadata?.amount || '0')
      let credits = parseInt(session.metadata?.credits || '0')

      const supabase = await createClient()

      // 如果没有 metadata，可能是 Payment Link 支付，尝试通过 client_reference_id 查找
      if (!rechargeId && session.client_reference_id) {
        const { data: rechargeRecord } = await supabase
          .from('recharge_records')
          .select('*')
          .eq('id', session.client_reference_id)
          .single()

        if (rechargeRecord) {
          rechargeId = rechargeRecord.id
          userId = rechargeRecord.user_id
          amount = parseFloat(rechargeRecord.amount.toString())
          credits = rechargeRecord.credits
        }
      }

      // 如果还是没有找到，尝试通过 customer_email 查找最近的 pending 充值记录
      if (!rechargeId && session.customer_email) {
        const { data: userRecord } = await supabase
          .from('users')
          .select('id')
          .eq('email', session.customer_email)
          .single()

        if (userRecord) {
          // 查找最近的 pending 充值记录（Payment Link）
          const { data: recentRecharge } = await supabase
            .from('recharge_records')
            .select('*')
            .eq('user_id', userRecord.id)
            .eq('status', 'pending')
            .eq('payment_method', 'stripe_payment_link')
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          if (recentRecharge) {
            rechargeId = recentRecharge.id
            userId = recentRecharge.user_id
            amount = parseFloat(recentRecharge.amount.toString())
            credits = recentRecharge.credits
          }
        }
      }

      if (!rechargeId || !userId) {
        console.error('Missing recharge information in checkout session:', {
          session_id: session.id,
          client_reference_id: session.client_reference_id,
          customer_email: session.customer_email,
          metadata: session.metadata,
        })
        return NextResponse.json(
          { error: 'Missing required recharge information' },
          { status: 400 }
        )
      }

      // 查找充值记录
      const { data: rechargeRecord, error: findError } = await supabase
        .from('recharge_records')
        .select('*')
        .eq('id', rechargeId)
        .single()

      if (findError || !rechargeRecord) {
        console.error('Recharge record not found:', rechargeId, findError)
        return NextResponse.json(
          { error: 'Recharge record not found' },
          { status: 404 }
        )
      }

      // 检查是否已经处理过
      if (rechargeRecord.status === 'completed') {
        console.log('Recharge already completed:', rechargeId)
        return NextResponse.json({ success: true, message: 'Already processed' })
      }

      // 获取用户当前积分
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('credits')
        .eq('id', userId)
        .single()

      if (userError || !user) {
        console.error('User not found:', userId, userError)
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }

      // 更新用户积分
      const { error: updateError } = await supabase
        .from('users')
        .update({ credits: (user.credits || 0) + credits })
        .eq('id', userId)

      if (updateError) {
        console.error('Failed to update user credits:', updateError)
        return NextResponse.json(
          { error: 'Failed to update user credits', details: updateError.message },
          { status: 500 }
        )
      }

      // 更新充值记录状态
      const { error: recordUpdateError } = await supabase
        .from('recharge_records')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          payment_id: session.id,
        })
        .eq('id', rechargeId)

      if (recordUpdateError) {
        console.error('Failed to update recharge record:', recordUpdateError)
        // 即使更新记录失败，积分已经添加，所以返回成功
      }

      console.log(`Payment successful: Recharge ${rechargeId}, User ${userId}, Credits ${credits}`)
      return NextResponse.json({ success: true, message: 'Payment processed successfully' })
    }

    // 处理支付失败事件
    if (event.type === 'checkout.session.async_payment_failed') {
      const session = event.data.object as Stripe.Checkout.Session
      const rechargeId = session.metadata?.recharge_id

      if (rechargeId) {
        const supabase = await createClient()
        await supabase
          .from('recharge_records')
          .update({ status: 'failed' })
          .eq('id', rechargeId)
      }

      return NextResponse.json({ success: true, message: 'Payment failure recorded' })
    }

    // 其他事件类型，返回成功但不处理
    return NextResponse.json({ success: true, message: 'Event received but not processed' })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

