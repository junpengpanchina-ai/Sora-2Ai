import { NextResponse } from 'next/server'
import { validateAdminSession } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type RouteParams = { params: { id: string } }

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const adminUser = await validateAdminSession()
    if (!adminUser) {
      return NextResponse.json({ error: '未授权，请先登录' }, { status: 401 })
    }

    const id = params.id
    if (!id) {
      return NextResponse.json({ error: '缺少 prompt_template id' }, { status: 400 })
    }

    const payload = await request.json().catch(() => null)
    if (!payload || typeof payload !== 'object') {
      return NextResponse.json({ error: '请求体格式不正确' }, { status: 400 })
    }

    const updates: Record<string, unknown> = {}
    const allowedKeys = [
      'owner_scope',
      'scene_id',
      'model_id',
      'role',
      'content',
      'variables',
      'version',
      'parent_id',
      'status',
      'is_published',
      'weight',
      'rollout_pct',
      'min_plan',
      'locale',
      'notes',
    ]

    for (const key of allowedKeys) {
      if (key in payload) {
        updates[key] = (payload as Record<string, unknown>)[key]
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: '没有可更新的字段' }, { status: 400 })
    }

    const supabase = await createServiceClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('prompt_templates')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single()

    if (error || !data) {
      throw error ?? new Error('更新失败')
    }

    return NextResponse.json({ success: true, item: data })
  } catch (error) {
    console.error('[admin/prompt-templates/:id] PATCH failed:', error)
    return NextResponse.json(
      { error: '更新 prompt template 失败', details: error instanceof Error ? error.message : '未知错误' },
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

    const id = params.id
    if (!id) {
      return NextResponse.json({ error: '缺少 prompt_template id' }, { status: 400 })
    }

    const supabase = await createServiceClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('prompt_templates')
      .delete()
      .eq('id', id)
      .select('id')
      .maybeSingle()

    if (error) throw error
    if (!data) return NextResponse.json({ error: '未找到记录' }, { status: 404 })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[admin/prompt-templates/:id] DELETE failed:', error)
    return NextResponse.json(
      { error: '删除 prompt template 失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}

