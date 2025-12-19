// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { getOrCreateUser } from '@/lib/user'
import { refundCreditsByVideoTaskId } from '@/lib/credits'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import type { Database } from '@/types/database'


// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic'
type VideoTaskRow = Database['public']['Tables']['video_tasks']['Row']
type UserCreditsRow = Pick<Database['public']['Tables']['users']['Row'], 'credits'>

// 仅在开发环境允许
const isDevelopment = process.env.NODE_ENV === 'development'

// 返还积分请求参数验证
const refundTaskSchema = z.object({
  task_id: z.string().uuid('任务ID必须是有效的UUID'),
})

/**
 * 开发/测试端点：返还指定任务的积分
 * ⚠️ 仅在开发环境使用，用于处理卡住的任务
 */
export async function POST(request: NextRequest) {
  // 检查是否为开发环境
  if (!isDevelopment) {
    return NextResponse.json(
      { error: 'This feature is only available in development environment' },
      { status: 403 }
    )
  }

  try {
    // 验证用户身份
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized, please login first' },
        { status: 401 }
      )
    }

    // 解析请求体
    const body = await request.json()
    const validatedData = refundTaskSchema.parse(body)

    // 获取或创建用户信息
    const userProfile = await getOrCreateUser(supabase, user)

    if (!userProfile) {
      return NextResponse.json(
        { error: 'User not found or failed to create user' },
        { status: 404 }
      )
    }

    // 检查任务是否存在且属于当前用户
    const { data: videoTask, error: taskError } = await supabase
      .from('video_tasks')
      .select('*')
      .eq('id', validatedData.task_id)
      .eq('user_id', userProfile.id)
      .single<VideoTaskRow>()

    if (taskError || !videoTask) {
      return NextResponse.json(
        { 
          error: 'Task not found or does not belong to you',
          details: taskError?.message
        },
        { status: 404 }
      )
    }

    // 检查任务状态
    if (videoTask.status === 'succeeded') {
      return NextResponse.json(
        { 
          error: 'Task already completed successfully, cannot refund credits',
          task_status: videoTask.status
        },
        { status: 400 }
      )
    }

    // 尝试返还积分
    const refundResult = await refundCreditsByVideoTaskId(
      supabase,
      userProfile.id,
      validatedData.task_id
    )

    if (!refundResult.success) {
      return NextResponse.json(
        { 
          error: 'Failed to refund credits',
          details: refundResult.error,
          hint: '可能积分已经返还，或者没有找到消费记录'
        },
        { status: 500 }
      )
    }

    // 更新任务状态为已退款
    await supabase
      .from('video_tasks')
      .update({ 
        status: 'failed',
        error_message: 'Credits manually refunded (task stuck)'
      } as never)
      .eq('id', validatedData.task_id)

    // 获取更新后的积分
    const { data: updatedUser } = await supabase
      .from('users')
      .select('credits')
      .eq('id', userProfile.id)
      .single<UserCreditsRow>()

    return NextResponse.json({
      success: true,
      message: `Successfully refunded credits for task ${validatedData.task_id}`,
      task: {
        id: videoTask.id,
        prompt: videoTask.prompt,
        status: 'failed (refunded)',
        original_status: videoTask.status,
      },
      credits: {
        current: (updatedUser?.credits ?? 0),
        refunded: 10, // CREDITS_PER_VIDEO
      },
    })
  } catch (error) {
    console.error('Failed to refund task credits:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Parameter validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to refund task credits',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

