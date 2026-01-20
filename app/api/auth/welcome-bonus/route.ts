import { createClient } from '@/lib/supabase/server'
import { addWelcomeBonus } from '@/lib/credits'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

/**
 * API endpoint to add welcome bonus credits for new users.
 * Called after user registration/login to ensure new users get 30 free credits.
 * Supports Authorization: Bearer so OAuth callback can call before cookies are ready.
 */
export async function POST() {
  const start = Date.now()
  try {
    const supabase = await createClient()
    const authHeader = (await headers()).get('authorization')
    const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null
    const { data: { user }, error: userError } = bearer
      ? await supabase.auth.getUser(bearer)
      : await supabase.auth.getUser()

    if (userError) {
      console.warn('[welcome-bonus] getUser error', { hasBearer: !!bearer, code: userError.code, message: userError.message })
    }

    if (!user) {
      console.warn('[welcome-bonus] 401 Unauthorized', { hasBearer: !!bearer, duration: Date.now() - start })
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.info('[welcome-bonus] start', { userId: user.id, hasBearer: !!bearer })

    // Check if user already received welcome bonus
    const { data: existingBonus } = await supabase
      .from('recharge_records')
      .select('id')
      .eq('user_id', user.id)
      .eq('payment_method', 'system')
      .eq('metadata->>type', 'welcome_bonus')
      .maybeSingle()

    if (existingBonus) {
      console.info('[welcome-bonus] already granted', { userId: user.id, duration: Date.now() - start })
      return NextResponse.json({
        success: true,
        message: 'Welcome bonus already granted',
        alreadyGranted: true,
      })
    }

    const result = await addWelcomeBonus(supabase, user.id)

    if (!result.success) {
      console.error('[welcome-bonus] addWelcomeBonus failed', { userId: user.id, error: result.error, duration: Date.now() - start })
      return NextResponse.json(
        { error: result.error || 'Failed to add welcome bonus' },
        { status: 500 }
      )
    }

    console.info('[welcome-bonus] success', { userId: user.id, rechargeRecordId: result.rechargeRecordId, duration: Date.now() - start })
    return NextResponse.json({
      success: true,
      message: 'Welcome bonus added successfully',
      rechargeRecordId: result.rechargeRecordId,
    })
  } catch (error) {
    console.error('[welcome-bonus] exception', { error: error instanceof Error ? error.message : String(error), duration: Date.now() - start })
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
