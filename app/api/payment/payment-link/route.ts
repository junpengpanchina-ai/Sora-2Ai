import { createClient } from '@/lib/supabase/server'
import { getOrCreateUser } from '@/lib/user'
import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// 初始化 Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

// Payment Link 配置
const PAYMENT_LINKS: Record<string, { amount: number; currency: string; credits: number; name: string; videos: number; description: string }> = {
  // 39 美元套餐：50条视频 = 500积分（10积分/视频）
  'dRmcN55nY4k33WXfPa0kE03': {
    amount: 39,
    currency: 'usd',
    credits: 500, // 50条视频 * 10积分/视频
    name: '基础套餐',
    videos: 50,
    description: '适合个人用户和小型项目',
  },
  // 299 美元套餐：200条视频 = 2000积分（10积分/视频）
  '4gMcN5eYy5o70KLauQ0kE01': {
    amount: 299,
    currency: 'usd',
    credits: 2000, // 200条视频 * 10积分/视频
    name: '专业套餐',
    videos: 200,
    description: '适合专业用户和大型项目',
  },
}

// 积分兑换比例
const CREDITS_PER_USD = 100 // 1 USD = 100 积分

/**
 * 注册 Payment Link 支付
 * 在用户点击 Payment Link 之前，创建充值记录
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
        { error: 'Unauthorized, please login first' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { payment_link_id } = z.object({
      payment_link_id: z.string(),
    }).parse(body)

    // Check Payment Link configuration
    const linkConfig = PAYMENT_LINKS[payment_link_id]
    if (!linkConfig) {
      return NextResponse.json(
        { error: 'Invalid payment link ID' },
        { status: 400 }
      )
    }

    // Get or create user information
    const userProfile = await getOrCreateUser(supabase, user)
    if (!userProfile) {
      return NextResponse.json(
        { error: 'User not found or failed to create user' },
        { status: 404 }
      )
    }

    // Get user email
    const { data: userWithEmail } = await supabase
      .from('users')
      .select('email')
      .eq('id', userProfile.id)
      .single()

    const userEmail = userWithEmail?.email || user.email || ''

    // Create recharge record (status: pending)
    const { data: rechargeRecord, error: rechargeError } = await supabase
      .from('recharge_records')
      .insert({
        user_id: userProfile.id,
        amount: linkConfig.amount,
        credits: linkConfig.credits,
        payment_method: 'stripe_payment_link',
        payment_id: payment_link_id, // Save Payment Link ID
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

    // Build Payment Link URL (add customer email and metadata)
    // Note: Stripe Payment Link doesn't support direct metadata, but can use customer_email parameter
    const paymentLinkUrl = `https://buy.stripe.com/${payment_link_id}?client_reference_id=${rechargeRecord.id}&prefilled_email=${encodeURIComponent(userEmail)}`

    return NextResponse.json({
      success: true,
      payment_link_url: paymentLinkUrl,
      recharge_id: rechargeRecord.id,
      amount: linkConfig.amount,
      currency: linkConfig.currency,
      credits: linkConfig.credits,
      message: 'Payment link registered, redirecting to payment...',
    })
  } catch (error) {
    console.error('Failed to register payment link:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Parameter validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to register payment link', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * Get Payment Link configuration list
 */
export async function GET(request: NextRequest) {
  try {
    const links = Object.entries(PAYMENT_LINKS).map(([id, config]) => ({
      id,
      url: `https://buy.stripe.com/${id}`,
      amount: config.amount,
      currency: config.currency,
      credits: config.credits,
      name: config.name,
      videos: config.videos,
      description: config.description,
    }))

    return NextResponse.json({
      success: true,
      payment_links: links,
    })
  } catch (error) {
    console.error('Failed to fetch payment links:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment links', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

