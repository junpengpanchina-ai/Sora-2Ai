import { NextResponse } from 'next/server'
import { validateAdminSession } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import { assertWriteAllowed, getLockdownPhase } from '@/lib/admin-lockdown'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * 批量审核使用场景
 * 支持批量批准、拒绝、标记为待审核
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

    const { ids, action, notes } = payload as {
      ids: string[]
      action: 'approve' | 'reject' | 'needs_review'
      notes?: string
    }

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: '请选择要审核的内容' }, { status: 400 })
    }

    if (!['approve', 'reject', 'needs_review'].includes(action)) {
      return NextResponse.json({ error: '无效的审核操作' }, { status: 400 })
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

    // 确定质量状态
    const qualityStatus = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'needs_review'
    
    // 如果批准，同时发布；如果拒绝或待审核，取消发布
    const isPublished = action === 'approve'

    // 批量更新
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('use_cases')
      .update({
        quality_status: qualityStatus,
        is_published: isPublished,
        reviewed_by_admin_id: adminUser.id,
        reviewed_at: new Date().toISOString(),
        quality_notes: notes || null,
      })
      .in('id', ids)
      .select('id, title, quality_status')

    if (error) {
      console.error('[batch-review] 批量审核失败:', error)
      return NextResponse.json(
        {
          error: '批量审核失败',
          details: error.message,
        },
        { status: 500 }
      )
    }

    const actionLabels = {
      approve: '批准',
      reject: '拒绝',
      needs_review: '标记为待审核',
    }

    return NextResponse.json({
      success: true,
      message: `成功${actionLabels[action]} ${data?.length || 0} 条内容`,
      count: data?.length || 0,
      updated: data,
    })
  } catch (error) {
    console.error('[batch-review] 批量审核异常:', error)
    return NextResponse.json(
      {
        error: '批量审核失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    )
  }
}

