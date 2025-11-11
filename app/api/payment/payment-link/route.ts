import { createClient } from '@/lib/supabase/server'
import { getOrCreateUser } from '@/lib/user'
import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

// Payment Link configuration
const PAYMENT_LINKS: Record<string, { amount: number; currency: string; credits: number; name: string; videos: number; description: string }> = {
  // $39 plan: 50 videos = 500 credits (10 credits/video)
  'dRmcN55nY4k33WXfPa0kE03': {
    amount: 39,
    currency: 'usd',
    credits: 500, // 50 videos * 10 credits/video
    name: 'Basic Plan',
    videos: 50,
    description: 'Perfect for individual users and small projects',
  },
  // $299 plan: 200 videos = 2000 credits (10 credits/video)
  '4gMcN5eYy5o70KLauQ0kE01': {
    amount: 299,
    currency: 'usd',
    credits: 2000, // 200 videos * 10 credits/video
    name: 'Professional Plan',
    videos: 200,
    description: 'Perfect for professional users and large projects',
  },
}

// Credits exchange rate
const CREDITS_PER_USD = 100 // 1 USD = 100 credits

/**
 * Register Payment Link payment
 * Create recharge record before user clicks Payment Link
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

    // Build Payment Link URL (add customer email, client_reference_id, and success page)
    // Note: Stripe Payment Link doesn't support direct metadata, but can use client_reference_id and prefilled_email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const successUrl = `${appUrl}/payment/success?recharge_id=${rechargeRecord.id}`
    const paymentLinkUrl = `https://buy.stripe.com/${payment_link_id}?client_reference_id=${rechargeRecord.id}&prefilled_email=${encodeURIComponent(userEmail)}&redirect_on_completion=any_hosted_page`

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

