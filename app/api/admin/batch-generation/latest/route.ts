import { NextResponse } from 'next/server'
import { validateAdminSession } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import type { Database } from '@/types/database'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/admin/batch-generation/latest
 * 获取当前用户最近运行的任务（用于恢复任务）
 */
export async function GET() {
  try {
    let adminUser
    try {
      adminUser = await validateAdminSession()
    } catch (error) {
      console.error('[batch-generation/latest] 验证管理员会话失败:', error)
      return NextResponse.json(
        { error: '验证管理员会话失败', details: error instanceof Error ? error.message : '未知错误' },
        { status: 500 }
      )
    }

    if (!adminUser) {
      return NextResponse.json({ error: '未授权，请先登录' }, { status: 401 })
    }

    let supabase
    try {
      supabase = await createServiceClient()
    } catch (error) {
      console.error('[batch-generation/latest] 创建 Supabase 客户端失败:', error)
      return NextResponse.json(
        { 
          error: '数据库连接失败', 
          details: error instanceof Error ? error.message : '未知错误',
          hint: '请检查 SUPABASE_SERVICE_ROLE_KEY 环境变量是否配置正确'
        },
        { status: 500 }
      )
    }

    // 查询当前用户最近运行的任务（状态为 pending, processing, paused）
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: tasks, error } = await (supabase.from('batch_generation_tasks') as any)
      .select('*')
      .eq('admin_user_id', adminUser.id)
      .in('status', ['pending', 'processing', 'paused'])
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) {
      console.error('[batch-generation/latest] 查询失败:', error)
      return NextResponse.json(
        { error: '查询任务失败', details: error.message },
        { status: 500 }
      )
    }

    if (!tasks || tasks.length === 0) {
      return NextResponse.json({
        success: true,
        task: null,
        message: '没有找到正在运行的任务',
      })
    }

    const task = tasks[0] as Database['public']['Tables']['batch_generation_tasks']['Row']

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
        industries: task.industries,
        scenes_per_industry: task.scenes_per_industry,
        use_case_type: task.use_case_type,
        error_message: task.error_message,
        last_error: task.last_error,
        created_at: task.created_at,
        updated_at: task.updated_at,
        started_at: task.started_at,
        completed_at: task.completed_at,
      },
    })
  } catch (error) {
    console.error('[batch-generation/latest] 异常:', error)
    return NextResponse.json(
      {
        error: '获取任务失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    )
  }
}

