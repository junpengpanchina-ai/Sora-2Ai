// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { getOrCreateUser } from '@/lib/user'
import { NextResponse } from 'next/server'
import type { Database } from '@/types/database'

export const dynamic = 'force-dynamic'

type VideoTaskRecord = Database['public']['Tables']['video_tasks']['Row']
type ConsumptionRecord = Database['public']['Tables']['consumption_records']['Row']

/**
 * 查询视频生成相关的数据库记录
 * 用于验证：视频任务记录、消费记录、积分扣除情况
 */
export async function GET() {
  try {
    const supabase = await createClient()
    
    // 获取当前用户
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 获取或创建用户记录（使用 getOrCreateUser 确保用户存在）
    const userProfile = await getOrCreateUser(supabase, user)

    if (!userProfile) {
      return NextResponse.json(
        { 
          error: 'Failed to get or create user',
          details: 'User record could not be found or created in users table',
          auth_user_id: user.id,
          auth_user_email: user.email,
        },
        { status: 500 }
      )
    }

    // 获取完整的用户信息（包括 email）
    const { data: fullUserProfile, error: userError } = await supabase
      .from('users')
      .select('id, email, credits, name, google_id')
      .eq('id', userProfile.id)
      .single()

    if (userError || !fullUserProfile) {
      // 如果查询失败，至少返回基本信息
      return NextResponse.json({
        success: true,
        user: {
          id: userProfile.id,
          email: user.email || 'N/A',
          credits: userProfile.credits,
        },
        warning: 'Could not fetch full user profile',
        error_details: userError?.message,
        summary: {
          total_tasks: 0,
          succeeded_tasks: 0,
          failed_tasks: 0,
          processing_tasks: 0,
          total_consumption_records: 0,
          completed_consumption: 0,
          refunded_consumption: 0,
        },
        video_tasks: [],
        consumption_records: [],
        tasks_with_consumption: [],
      })
    }

    // 查询最近的视频任务（最多10条）
    const { data: videoTasksData, error: tasksError } = await supabase
      .from('video_tasks')
      .select('*')
      .eq('user_id', fullUserProfile.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (tasksError) {
      console.error('Failed to fetch video tasks:', tasksError)
    }

    // 查询最近的消费记录（最多10条）
    const { data: consumptionRecordsData, error: consumptionError } = await supabase
      .from('consumption_records')
      .select('*')
      .eq('user_id', fullUserProfile.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (consumptionError) {
      console.error('Failed to fetch consumption records:', consumptionError)
    }

    // 关联查询：视频任务和对应的消费记录
    const videoTasks = (videoTasksData ?? []) as VideoTaskRecord[]
    const consumptionRecords = (consumptionRecordsData ?? []) as ConsumptionRecord[]

    const tasksWithConsumption = videoTasks.map((task) => {
      const consumption = consumptionRecords.find(
        (record) => record.video_task_id === task.id
      )
      return {
        ...task,
        consumption_record: consumption || null,
      }
    })

    return NextResponse.json({
      success: true,
      user: {
        id: fullUserProfile.id,
        email: fullUserProfile.email || user.email || 'N/A',
        credits: fullUserProfile.credits ?? userProfile.credits ?? 0,
        name: fullUserProfile.name,
        google_id: fullUserProfile.google_id,
      },
      summary: {
        total_tasks: videoTasks.length,
        succeeded_tasks: videoTasks.filter((task) => task.status === 'succeeded').length,
        failed_tasks: videoTasks.filter((task) => task.status === 'failed').length,
        processing_tasks: videoTasks.filter(
          (task) => task.status === 'processing' || task.status === 'pending'
        ).length,
        total_consumption_records: consumptionRecords.length,
        completed_consumption: consumptionRecords.filter(
          (record) => record.status === 'completed'
        ).length,
        refunded_consumption: consumptionRecords.filter(
          (record) => record.status === 'refunded'
        ).length,
      },
      video_tasks: videoTasks,
      consumption_records: consumptionRecords,
      tasks_with_consumption: tasksWithConsumption,
      errors: {
        tasks: tasksError?.message,
        consumption: consumptionError?.message,
      },
    })
  } catch (error) {
    console.error('Failed to fetch video records:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch records',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

