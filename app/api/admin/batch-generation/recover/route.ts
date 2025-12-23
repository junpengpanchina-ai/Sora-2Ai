import { NextRequest, NextResponse } from 'next/server'
import { validateAdminSession } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function getSiteUrl() {
  let siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL
  if (!siteUrl && process.env.VERCEL_URL) siteUrl = `https://${process.env.VERCEL_URL}`
  return siteUrl || 'http://localhost:3000'
}

/**
 * POST /api/admin/batch-generation/recover
 * 尝试恢复“卡住”的任务：当任务长时间未更新时，重新触发 /process 链式调用
 */
export async function POST(request: NextRequest) {
  try {
    const adminUser = await validateAdminSession()
    if (!adminUser) {
      return NextResponse.json({ error: '未授权，请先登录' }, { status: 401 })
    }

    let body: { taskId?: string; force?: boolean } = {}
    try {
      body = await request.json()
    } catch {
      // allow empty body
    }

    const taskId = body.taskId
    const force = !!body.force

    if (!taskId) {
      return NextResponse.json({ error: '缺少 taskId 参数' }, { status: 400 })
    }

    const supabase = await createServiceClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tasksTable = () => supabase.from('batch_generation_tasks') as any

    const { data: task, error } = await tasksTable().select('*').eq('id', taskId).single()
    if (error || !task) {
      return NextResponse.json({ error: '任务不存在', details: error?.message }, { status: 404 })
    }

    if (task.admin_user_id !== adminUser.id && !adminUser.is_super_admin) {
      return NextResponse.json({ error: '无权访问此任务' }, { status: 403 })
    }

    const status: string = task.status
    if (!['pending', 'processing', 'paused'].includes(status)) {
      return NextResponse.json({
        ok: true,
        message: `任务状态为 ${status}，无需恢复`,
        task: { id: task.id, status: task.status, updated_at: task.updated_at },
      })
    }

    const updatedAt = task.updated_at ? new Date(task.updated_at).getTime() : 0
    const minutesSinceUpdate = updatedAt ? (Date.now() - updatedAt) / 60000 : Infinity
    const isStuck = minutesSinceUpdate >= 10

    if (!force && !isStuck) {
      return NextResponse.json({
        ok: true,
        message: `任务最近 ${minutesSinceUpdate.toFixed(1)} 分钟内有更新，暂不恢复（可传 force=true 强制）`,
        task: { id: task.id, status: task.status, updated_at: task.updated_at },
      })
    }

    // touch updated_at to prevent multiple clients spamming recover
    await tasksTable()
      .update({
        updated_at: new Date().toISOString(),
        last_error: task.last_error || null,
      })
      .eq('id', taskId)

    const siteUrl = getSiteUrl()
    const processUrl = `${siteUrl}/api/admin/batch-generation/process`

    // fire-and-forget trigger
    fetch(processUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId }),
    }).catch((e) => {
      console.error('[batch-generation/recover] trigger process failed:', e)
    })

    return NextResponse.json({
      ok: true,
      message: `已触发恢复：${processUrl}`,
      task: { id: task.id, status: task.status, updated_at: task.updated_at, minutesSinceUpdate },
    })
  } catch (error) {
    console.error('[batch-generation/recover] 异常:', error)
    return NextResponse.json(
      { error: '恢复失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}


