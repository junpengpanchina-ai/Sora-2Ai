// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { Database } from '@/types/database'

/**
 * 管理员后台 - 获取所有视频任务
 * 包含用户邮箱信息
 */
export const dynamic = 'force-dynamic'
export const revalidate = 0

type VideoTaskRecord = Database['public']['Tables']['video_tasks']['Row']
type UserSummary = Pick<Database['public']['Tables']['users']['Row'], 'id' | 'email' | 'name'>

export async function GET() {
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
    const tasks = (videoTasks ?? []) as VideoTaskRecord[]
    const userIds = [...new Set(tasks.map((task) => task.user_id))]
    
    // 批量获取用户信息
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, name')
      .in('id', userIds)

    const userMap = new Map<string, { email: string | null; name: string | null }>()
    if (!usersError && users) {
      ;(users as UserSummary[]).forEach((userRecord) => {
        userMap.set(userRecord.id, { email: userRecord.email, name: userRecord.name })
      })
    }

    // 格式化数据，添加用户信息
    const formattedTasks = tasks.map((task) => {
      const userInfo = userMap.get(task.user_id) ?? { email: null, name: null }
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
        user_email: userInfo.email,
        user_name: userInfo.name,
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

