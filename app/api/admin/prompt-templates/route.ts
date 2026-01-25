import { NextResponse } from 'next/server'
import { validateAdminSession } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function parseBool(value: string | null): boolean | undefined {
  if (value === null) return undefined
  if (value === 'true' || value === '1') return true
  if (value === 'false' || value === '0') return false
  return undefined
}

export async function GET(request: Request) {
  try {
    const adminUser = await validateAdminSession()
    if (!adminUser) {
      return NextResponse.json({ error: '未授权，请先登录' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)

    const page = Math.max(Number(searchParams.get('page')) || 1, 1)
    const pageSize = Math.min(Math.max(Number(searchParams.get('page_size')) || 50, 1), 200)
    const q = searchParams.get('q')?.trim() || null

    const ownerScope = searchParams.get('owner_scope')?.trim() || null
    const sceneId = searchParams.get('scene_id')?.trim() || null
    const status = searchParams.get('status')?.trim() || null
    const gateOnly = parseBool(searchParams.get('gate_only'))
    const experimentsOnly = parseBool(searchParams.get('experiments_only'))
    const sortBy = searchParams.get('sort_by')?.trim() || 'updated_at'
    const sortDir = (searchParams.get('sort_dir')?.toLowerCase() === 'asc' ? 'asc' : 'desc') as
      | 'asc'
      | 'desc'

    const supabase = await createServiceClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc('rpc_get_prompt_templates_admin_page', {
      page,
      page_size: pageSize,
      q,
      owner_scope_filter: ownerScope,
      scene_id_filter: sceneId,
      status_filter: status,
      gate_only: gateOnly ?? false,
      experiments_only: experimentsOnly ?? false,
      sort_by: sortBy,
      sort_dir: sortDir,
    })

    if (error) {
      throw error
    }

    const row = Array.isArray(data) && data.length > 0 ? data[0] : { total_count: 0, items: [] }

    return NextResponse.json({
      success: true,
      total: row.total_count ?? 0,
      items: row.items ?? [],
      page,
      page_size: pageSize,
    })
  } catch (error) {
    console.error('[admin/prompt-templates] GET failed:', error)
    return NextResponse.json(
      { error: '获取 prompt templates 失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}

