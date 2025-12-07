import { NextResponse } from 'next/server'
import type { Database } from '@/types/database'
import { createClient } from '@/lib/supabase/server'
import { validateAdminSession } from '@/lib/admin-auth'

type VideoTaskRow = Database['public']['Tables']['video_tasks']['Row']
type VideoTaskUpdate = Database['public']['Tables']['video_tasks']['Update']

const ALLOWED_STATUS: VideoTaskRow['status'][] = [
  'pending',
  'processing',
  'succeeded',
  'failed',
]

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const videoTaskId = params.id
    if (!videoTaskId) {
      return NextResponse.json({ error: '缺少视频任务ID' }, { status: 400 })
    }

    const adminUser = await validateAdminSession()
    if (!adminUser) {
      return NextResponse.json({ error: '未授权，请先登录' }, { status: 401 })
    }

    const supabase = await createClient()
    const payload = (await request.json()) as {
      status?: VideoTaskRow['status']
      progress?: number
      video_url?: string | null
      failure_reason?: string | null
      error_message?: string | null
      prompt?: string
      model?: string
      aspect_ratio?: string
      duration?: number
      size?: string
    }

    if (!payload || Object.keys(payload).length === 0) {
      return NextResponse.json({ error: '没有可更新的字段' }, { status: 400 })
    }

    const updates: VideoTaskUpdate = {}

    if (payload.status !== undefined) {
      if (!ALLOWED_STATUS.includes(payload.status)) {
        return NextResponse.json({ error: '无效的状态值' }, { status: 400 })
      }
      updates.status = payload.status
      if (payload.status === 'succeeded' || payload.status === 'failed') {
        updates.completed_at = new Date().toISOString()
      }
    }

    if (payload.progress !== undefined) {
      const progress = Math.max(0, Math.min(100, Number(payload.progress)))
      if (Number.isFinite(progress)) {
        updates.progress = progress
      }
    }

    if (payload.video_url !== undefined) {
      updates.video_url = payload.video_url
    }

    if (payload.failure_reason !== undefined) {
      updates.failure_reason = payload.failure_reason
    }

    if (payload.error_message !== undefined) {
      updates.error_message = payload.error_message
    }

    if (payload.prompt !== undefined) {
      updates.prompt = payload.prompt
    }

    if (payload.model !== undefined) {
      updates.model = payload.model
    }

    if (payload.aspect_ratio !== undefined) {
      updates.aspect_ratio = payload.aspect_ratio
    }

    if (payload.duration !== undefined) {
      const duration = Number(payload.duration)
      if (Number.isFinite(duration) && duration > 0) {
        updates.duration = duration
      }
    }

    if (payload.size !== undefined) {
      updates.size = payload.size
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: '未提供有效的更新内容' }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updated, error } = await (supabase as any)
      .from('video_tasks')
      .update(updates as VideoTaskUpdate)
      .eq('id', videoTaskId)
      .select('*')
      .single()

    if (error) {
      console.error('更新视频任务失败:', error)
      return NextResponse.json(
        { error: '更新视频任务失败', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      task: updated,
    })
  } catch (error) {
    console.error('更新视频任务失败:', error)
    return NextResponse.json(
      {
        error: '更新视频任务失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const videoTaskId = params.id
    if (!videoTaskId) {
      return NextResponse.json({ error: '缺少视频任务ID' }, { status: 400 })
    }

    const adminUser = await validateAdminSession()
    if (!adminUser) {
      return NextResponse.json({ error: '未授权，请先登录' }, { status: 401 })
    }

    const supabase = await createClient()
    
    // 先检查任务是否存在
    const { data: task, error: fetchError } = await supabase
      .from('video_tasks')
      .select('*')
      .eq('id', videoTaskId)
      .single<VideoTaskRow>()

    if (fetchError || !task) {
      return NextResponse.json({ error: '视频任务不存在' }, { status: 404 })
    }

    // 删除视频任务
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: deleteError } = await (supabase as any)
      .from('video_tasks')
      .delete()
      .eq('id', videoTaskId)

    if (deleteError) {
      console.error('删除视频任务失败:', deleteError)
      return NextResponse.json(
        { error: '删除视频任务失败', details: deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '视频任务已删除',
    })
  } catch (error) {
    console.error('删除视频任务失败:', error)
    return NextResponse.json(
      {
        error: '删除视频任务失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    )
  }
}

