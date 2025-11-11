import { createClient } from '@/lib/supabase/server'
import { getOrCreateUser } from '@/lib/user'
import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// 初始化 Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

// 充值请求参数验证
const rechargeSchema = z.object({
  amount: z.number().min(0.01, '充值金额必须大于0.01元'),
  payment_method: z.string().optional(),
  payment_id: z.string().optional(),
})

// 积分兑换比例：1元 = 100积分（即1积分 = 0.01元）
// 视频生成消耗：10积分/次（对应￥0.10/次，在￥0.08~￥0.16范围内）
const CREDITS_PER_YUAN = 100
const CREDITS_PER_VIDEO = 10

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
    const validatedData = rechargeSchema.parse(body)

    // 获取或创建用户信息
    const userProfile = await getOrCreateUser(supabase, user)

    if (!userProfile) {
      return NextResponse.json(
        { error: 'User not found or failed to create user' },
        { status: 404 }
      )
    }

    // 获取用户邮箱（用于 Stripe）
    const { data: userWithEmail } = await supabase
      .from('users')
      .select('email')
      .eq('id', userProfile.id)
      .single()

    const userEmail = userWithEmail?.email || user.email || ''

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
              name: 'Credits Recharge',
              description: `Recharge ${validatedData.amount} CNY, get ${creditsToAdd} credits`,
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
      customer_email: userEmail,
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

    // 返回 Stripe Checkout URL，前端将重定向到该URL
    return NextResponse.json({
      success: true,
      checkout_url: session.url,
      session_id: session.id,
    })
  } catch (error) {
    console.error('Failed to process recharge:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Parameter validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to process recharge', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// 获取充值记录
export async function GET(request: NextRequest) {
  try {
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

    // 获取或创建用户信息
    const userProfile = await getOrCreateUser(supabase, user)

    if (!userProfile) {
      return NextResponse.json(
        { error: 'User not found or failed to create user' },
        { status: 404 }
      )
    }

    // 获取查询参数
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // 获取充值记录
    const { data: records, error } = await supabase
      .from('recharge_records')
      .select('*')
      .eq('user_id', userProfile.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Failed to fetch recharge records:', error)
      return NextResponse.json(
        { error: 'Failed to fetch recharge records', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: records || [],
    })
  } catch (error) {
    console.error('Failed to fetch recharge records:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recharge records', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

