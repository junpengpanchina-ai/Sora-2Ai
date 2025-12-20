import { NextRequest, NextResponse } from 'next/server'
import { validateAdminSession } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import type { Database } from '@/types/database'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/admin/batch-generation/status/[taskId]
 * 获取任务状态
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const adminUser = await validateAdminSession()
    if (!adminUser) {
      return NextResponse.json({ error: '未授权，请先登录' }, { status: 401 })
    }

    const { taskId } = params
    const supabase = await createServiceClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: task, error } = await (supabase.from('batch_generation_tasks') as any)
      .select('*')
      .eq('id', taskId)
      .single()

    if (error || !task) {
      return NextResponse.json(
        { error: '任务不存在', details: error?.message },
        { status: 404 }
      )
    }

    // 检查权限（TypeScript 类型断言）
    const taskData = task as Database['public']['Tables']['batch_generation_tasks']['Row']
    if (taskData.admin_user_id !== adminUser.id && !adminUser.is_super_admin) {
      return NextResponse.json({ error: '无权访问此任务' }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      task: {
        id: task.id,
        status: task.status,
        progress: task.progress,
        current_industry_index: task.current_industry_index,
        total_industries: task.total_industries,
        total_scenes_generated: task.total_scenes_generated,
        total_scenes_saved: task.total_scenes_saved,
        error_message: task.error_message,
        last_error: task.last_error,
        created_at: task.created_at,
        updated_at: task.updated_at,
        started_at: task.started_at,
        completed_at: task.completed_at,
      },
    })
  } catch (error) {
    console.error('[batch-generation/status] 异常:', error)
    return NextResponse.json(
      {
        error: '获取任务状态失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    )
  }
}

