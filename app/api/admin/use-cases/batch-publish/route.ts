import { NextResponse } from 'next/server'
import { validateAdminSession } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import { assertWriteAllowed, getLockdownPhase } from '@/lib/admin-lockdown'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * 批量上架/下架使用场景
 * 只修改 is_published 状态，不影响 quality_status
 */
export async function POST(request: Request) {
  try {
    const adminUser = await validateAdminSession()
    if (!adminUser) {
      return NextResponse.json({ error: '未授权，请先登录' }, { status: 401 })
    }

    const payload = await request.json().catch(() => null)
    if (!payload || typeof payload !== 'object') {
      return NextResponse.json({ error: '请求体格式不正确' }, { status: 400 })
    }

    const { ids, action } = payload as {
      ids: string[]
      action: 'publish' | 'unpublish'
    }

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: '请选择要操作的内容' }, { status: 400 })
    }

    if (!['publish', 'unpublish'].includes(action)) {
      return NextResponse.json({ error: '无效的操作，必须是 publish 或 unpublish' }, { status: 400 })
    }

    const supabase = await createServiceClient()
    try {
      const phase = await getLockdownPhase(supabase)
      assertWriteAllowed(phase)
    } catch (e) {
      return NextResponse.json(
        { error: (e instanceof Error ? e.message : 'System is in LOCKDOWN. Write operations are blocked by design.') },
        { status: 403 }
      )
    }

    // 只更新 is_published 状态，不影响其他字段
    const isPublished = action === 'publish'

    // 批量更新
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('use_cases')
      .update({
        is_published: isPublished,
        updated_at: new Date().toISOString(),
      })
      .in('id', ids)
      .select('id, title, is_published')

    if (error) {
      console.error('[batch-publish] 批量上架/下架失败:', error)
      return NextResponse.json(
        {
          error: '批量操作失败',
          details: error.message,
        },
        { status: 500 }
      )
    }

    const actionLabel = action === 'publish' ? '上架' : '下架'

    return NextResponse.json({
      success: true,
      message: `成功${actionLabel} ${data?.length || 0} 条内容`,
      count: data?.length || 0,
      updated: data,
    })
  } catch (error) {
    console.error('[batch-publish] 批量上架/下架异常:', error)
    return NextResponse.json(
      {
        error: '批量操作失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    )
  }
}

