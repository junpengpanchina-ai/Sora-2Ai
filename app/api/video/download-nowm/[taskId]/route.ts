// No-watermark download: allowed when remove_watermark (paid) OR share-unlock (one-time per video)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const supabase = await createClient(request.headers)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized, please login first' }, { status: 401 })
    }

    const taskId = params.taskId
    const { data: videoTask, error: taskError } = await supabase
      .from('video_tasks')
      .select('id, video_url, user_id, status, grsai_task_id, remove_watermark, share_unlocked_at, share_unlock_expires_at, share_unlock_used')
      .eq('id', taskId)
      .single()

    if (taskError || !videoTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const task = videoTask as {
      id: string
      video_url: string | null
      user_id: string
      status: string
      grsai_task_id: string | null
      remove_watermark: boolean
      share_unlocked_at: string | null
      share_unlock_expires_at: string | null
      share_unlock_used: boolean | null
    }

    if (task.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to access this task' }, { status: 403 })
    }

    const now = new Date().toISOString()
    const allowedByPaid = task.remove_watermark === true
    const allowedByShare =
      task.share_unlocked_at &&
      task.share_unlock_expires_at &&
      now <= task.share_unlock_expires_at &&
      task.share_unlock_used !== true

    if (!allowedByPaid && !allowedByShare) {
      return NextResponse.json(
        { error: 'No-watermark export not available. Share to unlock or upgrade with credits.' },
        { status: 403 }
      )
    }

    const consumedShareUnlock = allowedByShare && !allowedByPaid

    const tryFetchVideo = async (url: string): Promise<Response> => {
      return fetch(url, {
        headers: {
          Accept: 'video/mp4,video/*;q=0.9,*/*;q=0.8',
          'Accept-Encoding': 'identity',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
      })
    }

    const refetchVideoUrl = async (): Promise<string | null> => {
      if (!task.grsai_task_id) return null
      try {
        const { getTaskResult } = await import('@/lib/grsai/client')
        const result = await getTaskResult(task.grsai_task_id)
        if (result.code === 0 && result.data?.status === 'succeeded' && result.data.results?.[0]?.url) {
          const newUrl = result.data.results[0].url
          await supabase.from('video_tasks').update({ video_url: newUrl }).eq('id', task.id)
          return newUrl
        }
      } catch {}
      return null
    }

    let videoUrl = task.video_url
    if (!videoUrl && task.grsai_task_id) {
      videoUrl = await refetchVideoUrl()
    }

    if (!videoUrl) {
      return NextResponse.json(
        { error: 'Video URL not available', details: 'Try generating the video again.' },
        { status: 404 }
      )
    }

    let videoResponse = await tryFetchVideo(videoUrl)
    if (videoResponse.status === 404 && task.grsai_task_id) {
      const newUrl = await refetchVideoUrl()
      if (newUrl) {
        videoUrl = newUrl
        videoResponse = await tryFetchVideo(videoUrl)
      }
    }

    if (!videoResponse.ok) {
      if (videoResponse.status === 404) {
        return NextResponse.json(
          { error: 'Video not found', details: 'The video URL may have expired.' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: `Failed to fetch video: ${videoResponse.status}` },
        { status: videoResponse.status }
      )
    }

    const contentType = videoResponse.headers.get('content-type') || 'video/mp4'
    const contentLength = videoResponse.headers.get('content-length')
    const videoBuffer = await videoResponse.arrayBuffer()

    if (consumedShareUnlock) {
      await supabase
        .from('video_tasks')
        .update({ share_unlock_used: true })
        .eq('id', taskId)
    }

    return new NextResponse(videoBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="video-${task.id}.mp4"`,
        'Content-Length': contentLength || videoBuffer.byteLength.toString(),
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    console.error('[download-nowm] error:', error)
    return NextResponse.json(
      { error: 'Failed to download video', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
