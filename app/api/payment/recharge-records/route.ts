// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { getOrCreateUser } from '@/lib/user'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Get user's recharge records
 * Used for user profile page
 */
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient(request.headers)
    // 若 session 仅存在客户端（localStorage）未写入 cookie，则用 Authorization: Bearer 取 user
    const authHeader = request.headers.get('authorization')
    const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null
    const { data: { user }, error: userError } = bearer
      ? await supabase.auth.getUser(bearer)
      : await supabase.auth.getUser()

    if (userError || !user) {
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

    // Query recharge records
    const { data: rechargeRecords, error: rechargeError } = await supabase
      .from('recharge_records')
      .select('*')
      .eq('user_id', userProfile.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (rechargeError) {
      console.error('Failed to fetch recharge records:', rechargeError)
      return NextResponse.json(
        { error: 'Failed to fetch recharge records', details: rechargeError.message },
        { status: 500 }
      )
    }

    // P2: 主展示用 wallets；legacy_user_credits 仅对账/排查，后续 Phase 3 可删
    const { data: walletRow, error: walletErr } = await supabase
      .from('wallets')
      .select('permanent_credits, bonus_credits, bonus_expires_at')
      .eq('user_id', userProfile.id)
      .maybeSingle()

    if (walletErr) {
      console.error('Failed to load wallet:', walletErr)
      return NextResponse.json({ error: 'Failed to load wallet', details: walletErr.message }, { status: 500 })
    }

    const permanent = Number(walletRow?.permanent_credits ?? 0)
    const bonus = Number(walletRow?.bonus_credits ?? 0)
    const walletTotal = permanent + bonus

    const { data: userRow } = await supabase
      .from('users')
      .select('credits')
      .eq('id', userProfile.id)
      .maybeSingle()
    const legacyUserCredits = Number(userRow?.credits ?? 0)

    return NextResponse.json({
      success: true,
      records: rechargeRecords || [],
      count: rechargeRecords?.length || 0,
      user_credits: walletTotal,
      wallet_total_credits: walletTotal,
      wallet_permanent_credits: permanent,
      wallet_bonus_credits: bonus,
      permanent_credits: permanent,
      bonus_credits: bonus,
      bonus_expires_at: walletRow?.bonus_expires_at ?? null,
      legacy_user_credits: legacyUserCredits,
    })
  } catch (error) {
    console.error('Failed to get recharge records:', error)
    return NextResponse.json(
      { error: 'Failed to get recharge records', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

