import { NextRequest, NextResponse } from 'next/server'
import { validateAdminSession } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import type { Database } from '@/types/database'
import { assertWriteAllowed, getLockdownPhase } from '@/lib/admin-lockdown'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * POST /api/admin/batch-generation/control
 * 控制任务（暂停/恢复/取消）
 */
export async function POST(request: NextRequest) {
  try {
    const adminUser = await validateAdminSession()
    if (!adminUser) {
      return NextResponse.json({ error: '未授权，请先登录' }, { status: 401 })
    }

    const body = await request.json()
    const { taskId, action } = body

    if (!taskId || !action) {
      return NextResponse.json(
        { error: '缺少 taskId 或 action 参数' },
        { status: 400 }
      )
    }

    if (!['pause', 'resume', 'cancel'].includes(action)) {
      return NextResponse.json(
        { error: '无效的 action，支持: pause, resume, cancel' },
        { status: 400 }
      )
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

    // 获取任务并检查权限
    const { data: task, error: fetchError } = await supabase
      .from('batch_generation_tasks')
      .select('*')
      .eq('id', taskId)
      .single()

    if (fetchError || !task) {
      return NextResponse.json(
        { error: '任务不存在', details: fetchError?.message },
        { status: 404 }
      )
    }

    // TypeScript 类型断言（Supabase 类型推断问题）
    const taskData = task as Database['public']['Tables']['batch_generation_tasks']['Row']
    if (taskData.admin_user_id !== adminUser.id && !adminUser.is_super_admin) {
      return NextResponse.json({ error: '无权操作此任务' }, { status: 403 })
    }

    // 执行操作
    const updateData: {
      updated_at: string
      is_paused?: boolean
      status?: string
      should_stop?: boolean
    } = {
      updated_at: new Date().toISOString(),
    }

    if (action === 'pause') {
      updateData.is_paused = true
      updateData.status = 'paused'
    } else if (action === 'resume') {
      updateData.is_paused = false
      updateData.status = 'processing'
    } else if (action === 'cancel') {
      updateData.should_stop = true
      updateData.status = 'cancelled'
    }

    // 使用类型断言修复 Supabase 类型推断问题
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase.from('batch_generation_tasks') as any)
      .update(updateData)
      .eq('id', taskId)

    if (updateError) {
      console.error('[batch-generation/control] 更新失败:', updateError)
      return NextResponse.json(
        { error: '操作失败', details: updateError.message },
        { status: 500 }
      )
    }

    // 🔥 如果恢复任务，自动触发继续处理
    if (action === 'resume') {
      // 异步触发继续处理，不等待响应（避免阻塞）
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                     (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
      const processUrl = `${siteUrl}/api/admin/batch-generation/process`
      
      console.log('[batch-generation/control] 任务已恢复，触发继续处理:', {
        taskId,
        processUrl,
      })
      
      fetch(processUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId }),
      }).catch((error) => {
        console.error('[batch-generation/control] 触发继续处理失败:', {
          error: error instanceof Error ? error.message : String(error),
          taskId,
          processUrl,
        })
      })
    }

    return NextResponse.json({
      success: true,
      message: `任务已${action === 'pause' ? '暂停' : action === 'resume' ? '恢复' : '取消'}`,
    })
  } catch (error) {
    console.error('[batch-generation/control] 异常:', error)
    return NextResponse.json(
      {
        error: '操作失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    )
  }
}

