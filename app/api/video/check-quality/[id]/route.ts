// API endpoint to check video quality information
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'


// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    const taskId = params.id

    // Get video task
    const { data: videoTask, error: taskError } = await supabase
      .from('video_tasks')
      .select('id, video_url, user_id, status')
      .eq('id', taskId)
      .single()

    if (taskError || !videoTask) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Type assertion for videoTask
    const task = videoTask as { id: string; video_url: string | null; user_id: string; status: string }

    // Check if user owns this task (or is admin)
    if (task.user_id !== user.id) {
      // Check if user is admin (you can add admin check here)
      return NextResponse.json(
        { error: 'Unauthorized to access this task' },
        { status: 403 }
      )
    }

    if (!task.video_url) {
      return NextResponse.json(
        { error: 'Video URL not available yet' },
        { status: 404 }
      )
    }

    // Check if video is from R2 (our storage) or original API
    const isR2Video = task.video_url.includes('r2.dev')
    const isOriginalApiVideo = !isR2Video

    // Get video file information
    const videoInfo: {
      url: string
      source: 'r2' | 'api'
      size?: number
      contentType?: string
      accessible: boolean
      error?: string
    } = {
      url: task.video_url,
      source: isR2Video ? 'r2' : 'api',
      accessible: false,
    }

    try {
      // Try to fetch video headers to get size and type
      const response = await fetch(task.video_url, { method: 'HEAD' })
      
      if (response.ok) {
        videoInfo.accessible = true
        const contentLength = response.headers.get('content-length')
        const contentType = response.headers.get('content-type')
        
        if (contentLength) {
          videoInfo.size = parseInt(contentLength)
        }
        if (contentType) {
          videoInfo.contentType = contentType
        }
      } else {
        videoInfo.error = `HTTP ${response.status}: ${response.statusText}`
      }
    } catch (fetchError) {
      videoInfo.error = fetchError instanceof Error ? fetchError.message : 'Unknown error'
    }

    // Format response
    const qualityInfo = {
      taskId,
      status: task.status,
      video: videoInfo,
      qualityNotes: {
        isFromR2: isR2Video,
        isFromApi: isOriginalApiVideo,
        recommendation: isR2Video
          ? '✅ Video is stored in R2 with original quality preserved'
          : '⚠️ Video is using original API URL. Consider re-uploading to R2 for better quality control.',
      },
      sizeInfo: videoInfo.size
        ? {
            bytes: videoInfo.size,
            mb: (videoInfo.size / 1024 / 1024).toFixed(2),
            kb: (videoInfo.size / 1024).toFixed(2),
          }
        : null,
    }

    return NextResponse.json({
      success: true,
      ...qualityInfo,
    })
  } catch (error) {
    console.error('Failed to check video quality:', error)
    return NextResponse.json(
      {
        error: 'Failed to check video quality',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

