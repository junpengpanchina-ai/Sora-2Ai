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

    // Get current user credits
    const { data: userCreditsData } = await supabase
      .from('users')
      .select('credits')
      .eq('id', userProfile.id)
      .single()

    return NextResponse.json({
      success: true,
      records: rechargeRecords || [],
      count: rechargeRecords?.length || 0,
      user_credits: userCreditsData?.credits ?? 0,
    })
  } catch (error) {
    console.error('Failed to get recharge records:', error)
    return NextResponse.json(
      { error: 'Failed to get recharge records', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

