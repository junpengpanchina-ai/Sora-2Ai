import { createClient } from '@/lib/supabase/server'
import { getOrCreateUser } from '@/lib/user'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Check recharge record status
 * Used for Payment Link payments where we don't have a session_id
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const rechargeId = searchParams.get('recharge_id')

    if (!rechargeId) {
      return NextResponse.json(
        { error: 'Missing recharge_id parameter' },
        { status: 400 }
      )
    }

    // Verify user identity
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

    // Get or create user profile
    const userProfile = await getOrCreateUser(supabase, user)
    if (!userProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Query recharge record
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

    // Verify user owns this recharge record
    if (rechargeRecord.user_id !== userProfile.id) {
      return NextResponse.json(
        { error: 'User mismatch' },
        { status: 403 }
      )
    }

    // Get user current credits
    const { data: userCreditsData } = await supabase
      .from('users')
      .select('credits')
      .eq('id', userProfile.id)
      .single()

    return NextResponse.json({
      success: true,
      recharge_status: rechargeRecord.status,
      recharge_record: rechargeRecord,
      user_credits: userCreditsData?.credits ?? 0,
    })
  } catch (error) {
    console.error('Failed to check recharge status:', error)
    return NextResponse.json(
      { error: 'Failed to check recharge status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

