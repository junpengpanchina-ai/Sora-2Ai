import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// 充值请求参数验证
const createCheckoutSchema = z.object({
  amount: z.number().min(0.01, '充值金额必须大于0.01元'),
})

// 积分兑换比例：1元 = 100积分
const CREDITS_PER_YUAN = 100

// 初始化 Stripe（使用环境变量中的密钥）
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized, please login first' },
        { status: 401 }
      )
    }

    // 解析请求体
    const body = await request.json()
    const validatedData = createCheckoutSchema.parse(body)

    // 获取用户信息
    const googleId = user.user_metadata?.provider_id || 
                     user.user_metadata?.sub || 
                     user.app_metadata?.provider_id ||
                     user.id
    
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('google_id', googleId)
      .single()

    if (userError || !userProfile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // 计算获得的积分
    const creditsToAdd = Math.floor(validatedData.amount * CREDITS_PER_YUAN)

    // 创建充值记录（状态为 pending）
    const { data: rechargeRecord, error: rechargeError } = await supabase
      .from('recharge_records')
      .insert({
        user_id: userProfile.id,
        amount: validatedData.amount,
        credits: creditsToAdd,
        payment_method: 'stripe',
        status: 'pending',
      })
      .select()
      .single()

    if (rechargeError || !rechargeRecord) {
      console.error('Failed to create recharge record:', rechargeError)
      return NextResponse.json(
        { error: 'Failed to create recharge record', details: rechargeError?.message },
        { status: 500 }
      )
    }

    // 获取应用基础URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                    request.headers.get('origin') || 
                    'http://localhost:3000'

    // 创建 Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'cny', // 人民币
            product_data: {
              name: '积分充值',
              description: `充值 ${validatedData.amount} 元，获得 ${creditsToAdd} 积分`,
            },
            unit_amount: Math.round(validatedData.amount * 100), // Stripe 使用分为单位
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/payment/cancel`,
      client_reference_id: rechargeRecord.id, // 将充值记录ID传递给 Stripe
      customer_email: userProfile.email,
      metadata: {
        user_id: userProfile.id,
        recharge_id: rechargeRecord.id,
        amount: validatedData.amount.toString(),
        credits: creditsToAdd.toString(),
      },
    })

    // 更新充值记录，保存 Stripe session ID
    await supabase
      .from('recharge_records')
      .update({ payment_id: session.id })
      .eq('id', rechargeRecord.id)

    return NextResponse.json({
      success: true,
      session_id: session.id,
      checkout_url: session.url,
    })
  } catch (error) {
    console.error('Failed to create checkout session:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Parameter validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create checkout session', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

