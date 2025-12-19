// API endpoint to download video directly from original API URL
// No R2 storage needed - use original API URL directly, same as the vendor does
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
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

    // Check if user owns this task
    if (task.user_id !== user.id) {
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

    // Download video from API URL and stream it to the client
    // This ensures download works even if the API URL has CORS restrictions
    const videoUrl = task.video_url

    console.log('[video/download] Downloading video from API URL:', {
      taskId: task.id,
      videoUrl,
      note: 'Streaming video through server to ensure download works',
    })

    try {
      // Fetch video from API URL
      const videoResponse = await fetch(videoUrl, {
        headers: {
          'Accept': 'video/mp4,video/*;q=0.9,*/*;q=0.8',
          'Accept-Encoding': 'identity', // Get original quality
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      })

      if (!videoResponse.ok) {
        console.error('[video/download] Failed to fetch video:', {
          status: videoResponse.status,
          statusText: videoResponse.statusText,
          videoUrl,
        })
        return NextResponse.json(
          { error: `Failed to fetch video: ${videoResponse.status} ${videoResponse.statusText}` },
          { status: videoResponse.status }
        )
      }

      // Get video content type and size
      const contentType = videoResponse.headers.get('content-type') || 'video/mp4'
      const contentLength = videoResponse.headers.get('content-length')

      // Stream the video to the client
      const videoBuffer = await videoResponse.arrayBuffer()

      return new NextResponse(videoBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="video-${task.id}.mp4"`,
          'Content-Length': contentLength || videoBuffer.byteLength.toString(),
          'Cache-Control': 'no-cache',
        },
      })
    } catch (fetchError) {
      console.error('[video/download] Error fetching video:', {
        error: fetchError instanceof Error ? fetchError.message : String(fetchError),
        videoUrl,
      })
      return NextResponse.json(
        {
          error: 'Failed to download video',
          details: fetchError instanceof Error ? fetchError.message : 'Unknown error',
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Failed to get download URL:', error)
    return NextResponse.json(
      {
        error: 'Failed to get download URL',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

