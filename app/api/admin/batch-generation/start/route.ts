import { NextRequest, NextResponse } from 'next/server'
import { validateAdminSession } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * POST /api/admin/batch-generation/start
 * 启动批量生成任务（后台任务）
 */
export async function POST(request: NextRequest) {
  try {
    const adminUser = await validateAdminSession()
    if (!adminUser) {
      return NextResponse.json({ error: '未授权，请先登录' }, { status: 401 })
    }

    const body = await request.json()
    const {
      industries,
      scenesPerIndustry = 100,
      useCaseType = 'social-media',
    } = body

    if (!Array.isArray(industries) || industries.length === 0) {
      return NextResponse.json({ error: '请至少选择一个行业' }, { status: 400 })
    }

    const supabase = await createServiceClient()

    // 创建任务记录
    // 使用类型断言修复 Supabase 类型推断问题
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: task, error: createError } = await (supabase.from('batch_generation_tasks') as any)
      .insert({
        admin_user_id: adminUser.id,
        task_type: 'industry_scenes',
        industries,
        scenes_per_industry: scenesPerIndustry,
        use_case_type: useCaseType,
        status: 'pending',
        total_industries: industries.length,
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (createError || !task) {
      console.error('[batch-generation/start] 创建任务失败:', createError)
      return NextResponse.json(
        { error: '创建任务失败', details: createError?.message },
        { status: 500 }
      )
    }

    // 立即开始处理任务（使用链式调用，避免超时）
    // 通过 API 调用处理第一个行业，然后链式调用处理后续行业
    // 不等待响应，让任务在后台持续运行
    const processUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/admin/batch-generation/process`
    fetch(processUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId: task.id }),
    }).catch((error) => {
      console.error('[batch-generation/start] 启动处理失败:', error)
      // 如果启动失败，更新任务状态（异步，不阻塞）
      createServiceClient().then((supabase) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(supabase.from('batch_generation_tasks') as any)
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : '启动处理失败',
            updated_at: new Date().toISOString(),
          })
          .eq('id', task.id)
          .catch((updateError: unknown) => {
            console.error('[batch-generation/start] 更新任务状态失败:', updateError)
          })
      })
    })

    return NextResponse.json({
      success: true,
      task: {
        id: task.id,
        status: task.status,
        total_industries: task.total_industries,
        created_at: task.created_at,
      },
      message: '任务已启动，将在后台持续运行',
    })
  } catch (error) {
    console.error('[batch-generation/start] 异常:', error)
    return NextResponse.json(
      {
        error: '启动任务失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    )
  }
}


