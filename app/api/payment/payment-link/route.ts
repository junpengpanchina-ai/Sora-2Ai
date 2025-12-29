// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { getOrCreateUser } from '@/lib/user'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/service'


// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic'
export const revalidate = 0

const PaymentLinkRequestSchema = z.object({
  payment_link_id: z.string().min(1),
})

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
    const { payment_link_id } = PaymentLinkRequestSchema.parse(body)

    // Look up matching plan by payment link token (stored in payment_plans.stripe_payment_link_id)
    const service = await createServiceClient()
    const { data: plan, error: planError } = await service
      .from('payment_plans')
      .select('id, plan_name, amount, currency, credits, videos, description, stripe_payment_link_id, is_active')
      .eq('stripe_payment_link_id', payment_link_id)
      .eq('is_active', true)
      .maybeSingle()

    if (planError) {
      console.error('Failed to look up payment plan by payment link id:', planError)
      return NextResponse.json(
        { error: 'Failed to look up payment plan', details: planError.message },
        { status: 500 }
      )
    }

    if (!plan) {
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
        amount: plan.amount,
        credits: plan.credits,
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
    const paymentLinkUrl = `https://buy.stripe.com/${payment_link_id}?client_reference_id=${rechargeRecord.id}&prefilled_email=${encodeURIComponent(
      userEmail
    )}&redirect_on_completion=any_hosted_page`

    return NextResponse.json({
      success: true,
      payment_link_url: paymentLinkUrl,
      recharge_id: rechargeRecord.id,
      amount: plan.amount,
      currency: plan.currency,
      credits: plan.credits,
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
export async function GET() {
  try {
    const service = await createServiceClient()
    const { data, error } = await service
      .from('payment_plans')
      .select('plan_name, amount, currency, credits, videos, description, stripe_payment_link_id')
      .eq('is_active', true)
      .not('stripe_payment_link_id', 'is', null)
      .order('amount', { ascending: true })

    if (error) {
      console.error('Failed to fetch payment plans for payment links:', error)
      return NextResponse.json(
        { error: 'Failed to fetch payment links', details: error.message },
        { status: 500 }
      )
    }

    const links = (data || [])
      .filter((row) => row.stripe_payment_link_id)
      .map((row) => ({
        id: row.stripe_payment_link_id,
        url: `https://buy.stripe.com/${row.stripe_payment_link_id}`,
        amount: row.amount,
        currency: row.currency,
        credits: row.credits,
        name: row.plan_name,
        videos: row.videos,
        description: row.description || '',
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

