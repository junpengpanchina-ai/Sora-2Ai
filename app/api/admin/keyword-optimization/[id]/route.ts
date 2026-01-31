import { NextResponse } from 'next/server'
import { validateAdminSession } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import type { Database } from '@/types/database'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type RouteParams = { params: Promise<{ id: string }> }
type OverrideRow = Database['public']['Tables']['keyword_optimization_overrides']['Row']
type OverrideUpdate = Database['public']['Tables']['keyword_optimization_overrides']['Update']

const PRIORITIES = ['high', 'medium', 'low'] as const
const STATUSES = ['active', 'inactive'] as const

function isValidPriority(v: unknown): v is 'high' | 'medium' | 'low' {
  return typeof v === 'string' && PRIORITIES.includes(v as (typeof PRIORITIES)[number])
}

function isValidStatus(v: unknown): v is 'active' | 'inactive' {
  return typeof v === 'string' && STATUSES.includes(v as (typeof STATUSES)[number])
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const adminUser = await validateAdminSession()
    if (!adminUser) {
      return NextResponse.json({ error: '未授权，请先登录' }, { status: 401 })
    }

    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'Missing ID' }, { status: 400 })
    }

    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const updates: OverrideUpdate = {}

    if (typeof body.keyword === 'string') {
      const trimmed = body.keyword.trim()
      if (trimmed) updates.keyword = trimmed
    }
    if (isValidPriority(body.priority)) updates.priority = body.priority
    if (isValidStatus(body.status)) updates.status = body.status
    if (Object.prototype.hasOwnProperty.call(body, 'adjustment_reason')) {
      updates.adjustment_reason =
        typeof body.adjustment_reason === 'string' && body.adjustment_reason.trim()
          ? body.adjustment_reason.trim()
          : null
    }
    if (Object.prototype.hasOwnProperty.call(body, 'search_volume')) {
      const v = body.search_volume
      updates.search_volume =
        typeof v === 'number' && Number.isFinite(v) ? v : null
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const supabase = await createServiceClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('keyword_optimization_overrides')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      item: data as OverrideRow,
    })
  } catch (error) {
    console.error('Failed to update keyword optimization override:', error)
    return NextResponse.json(
      {
        error: 'Failed to update',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const adminUser = await validateAdminSession()
    if (!adminUser) {
      return NextResponse.json({ error: '未授权，请先登录' }, { status: 401 })
    }

    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'Missing ID' }, { status: 400 })
    }

    const supabase = await createServiceClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('keyword_optimization_overrides')
      .delete()
      .eq('id', id)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete keyword optimization override:', error)
    return NextResponse.json(
      {
        error: 'Failed to delete',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
