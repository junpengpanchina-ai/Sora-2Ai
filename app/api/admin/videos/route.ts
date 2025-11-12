import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * 管理员后台 - 获取所有视频任务
 * 包含用户邮箱信息
 */
export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: '未授权，请先登录' },
        { status: 401 }
      )
    }

    // 获取所有视频任务
    const { data: videoTasks, error: tasksError } = await supabase
      .from('video_tasks')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)

    if (tasksError) {
      console.error('获取视频任务失败:', tasksError)
      return NextResponse.json(
        { error: '获取视频任务失败', details: tasksError.message },
        { status: 500 }
      )
    }

    // 获取所有用户ID
    const userIds = [...new Set((videoTasks || []).map((t: any) => t.user_id))]
    
    // 批量获取用户信息
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, name')
      .in('id', userIds)

    const userMap = new Map()
    if (!usersError && users) {
      users.forEach((u: any) => {
        userMap.set(u.id, { email: u.email, name: u.name })
      })
    }

    // 格式化数据，添加用户信息
    const formattedTasks = (videoTasks || []).map((task: any) => {
      const userInfo = userMap.get(task.user_id) || {}
      return {
        id: task.id,
        user_id: task.user_id,
        grsai_task_id: task.grsai_task_id,
        model: task.model,
        prompt: task.prompt,
        reference_url: task.reference_url,
        aspect_ratio: task.aspect_ratio,
        duration: task.duration,
        size: task.size,
        status: task.status,
        progress: task.progress,
        video_url: task.video_url,
        remove_watermark: task.remove_watermark,
        pid: task.pid,
        failure_reason: task.failure_reason,
        error_message: task.error_message,
        created_at: task.created_at,
        updated_at: task.updated_at,
        completed_at: task.completed_at,
        user_email: userInfo.email || null,
        user_name: userInfo.name || null,
      }
    })

    return NextResponse.json({
      success: true,
      tasks: formattedTasks,
      count: formattedTasks.length,
    })
  } catch (error) {
    console.error('获取视频任务失败:', error)
    return NextResponse.json(
      {
        error: '获取视频任务失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    )
  }
}

