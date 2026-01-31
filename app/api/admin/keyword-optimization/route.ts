import { NextResponse } from 'next/server'
import { validateAdminSession } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import type { Database } from '@/types/database'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type OverrideRow = Database['public']['Tables']['keyword_optimization_overrides']['Row']
type OverrideInsert = Database['public']['Tables']['keyword_optimization_overrides']['Insert']

const PRIORITIES = ['high', 'medium', 'low'] as const
const STATUSES = ['active', 'inactive'] as const

function isValidPriority(v: unknown): v is 'high' | 'medium' | 'low' {
  return typeof v === 'string' && PRIORITIES.includes(v as (typeof PRIORITIES)[number])
}

function isValidStatus(v: unknown): v is 'active' | 'inactive' {
  return typeof v === 'string' && STATUSES.includes(v as (typeof STATUSES)[number])
}

export async function GET() {
  try {
    const adminUser = await validateAdminSession()
    if (!adminUser) {
      return NextResponse.json({ error: '未授权，请先登录' }, { status: 401 })
    }

    const supabase = await createServiceClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('keyword_optimization_overrides')
      .select('*')
      .order('updated_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      items: (data ?? []) as OverrideRow[],
    })
  } catch (error) {
    console.error('Failed to fetch keyword optimization overrides:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const adminUser = await validateAdminSession()
    if (!adminUser) {
      return NextResponse.json({ error: '未授权，请先登录' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const keyword = typeof body.keyword === 'string' ? body.keyword.trim() : ''
    if (!keyword) {
      return NextResponse.json({ error: '关键词不能为空' }, { status: 400 })
    }

    const priority = isValidPriority(body.priority) ? body.priority : 'medium'
    const status = isValidStatus(body.status) ? body.status : 'active'
    const adjustment_reason =
      typeof body.adjustment_reason === 'string' ? body.adjustment_reason.trim() || null : null
    const search_volume =
      typeof body.search_volume === 'number' && Number.isFinite(body.search_volume)
        ? body.search_volume
        : null

    const insertPayload: OverrideInsert = {
      keyword,
      priority,
      status,
      adjustment_reason,
      source: 'manual',
      search_volume,
    }

    const supabase = await createServiceClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rawData, error } = await (supabase as any)
      .from('keyword_optimization_overrides')
      .insert(insertPayload)
      .select('*')
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: '该关键词已存在，请直接编辑' }, { status: 409 })
      }
      throw error
    }

    return NextResponse.json({
      success: true,
      item: rawData as OverrideRow,
    })
  } catch (error) {
    console.error('Failed to create keyword optimization override:', error)
    return NextResponse.json(
      {
        error: 'Failed to create',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
