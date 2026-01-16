import { createClient } from '@/lib/supabase/server'
import { addWelcomeBonus } from '@/lib/credits'
import { NextResponse } from 'next/server'

/**
 * API endpoint to add welcome bonus credits for new users
 * Called after user registration/login to ensure new users get 30 free credits
 */
export async function POST() {
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

    // Check if user already received welcome bonus
    const { data: existingBonus } = await supabase
      .from('recharge_records')
      .select('id')
      .eq('user_id', user.id)
      .eq('payment_method', 'system')
      .eq('metadata->>type', 'welcome_bonus')
      .maybeSingle()

    if (existingBonus) {
      // User already received welcome bonus
      return NextResponse.json({
        success: true,
        message: 'Welcome bonus already granted',
        alreadyGranted: true,
      })
    }

    // Add welcome bonus
    const result = await addWelcomeBonus(supabase, user.id)

    if (!result.success) {
      console.error('Failed to add welcome bonus:', result.error)
      return NextResponse.json(
        { error: result.error || 'Failed to add welcome bonus' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Welcome bonus added successfully',
      rechargeRecordId: result.rechargeRecordId,
    })
  } catch (error) {
    console.error('Error in welcome bonus API:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
