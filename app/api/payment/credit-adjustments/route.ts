import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('credit_adjustments')
      .select(
        'id, delta, adjustment_type, reason, created_at, before_credits, after_credits, related_recharge_id, related_consumption_id'
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) {
      console.error('Failed to load credit adjustments:', error)
      return NextResponse.json(
        { error: 'Failed to load credit adjustments', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      adjustments: data ?? [],
    })
  } catch (error) {
    console.error('Unexpected error while loading credit adjustments:', error)
    return NextResponse.json(
      {
        error: 'Failed to load credit adjustments',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}


