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
    // Accept both cookie-based auth and Authorization: Bearer <token>
    // (Some browsers / download flows may not include cookies reliably)
    const supabase = await createClient(request.headers)
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

    // Get video task (include grsai_task_id for re-fetching if URL expired)
    const { data: videoTask, error: taskError } = await supabase
      .from('video_tasks')
      .select('id, video_url, user_id, status, grsai_task_id')
      .eq('id', taskId)
      .single()

    if (taskError || !videoTask) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Type assertion for videoTask
    const task = videoTask as { id: string; video_url: string | null; user_id: string; status: string; grsai_task_id: string | null }

    // Check if user owns this task
    if (task.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to access this task' },
        { status: 403 }
      )
    }

    // Helper function to try fetching video from URL
    const tryFetchVideo = async (url: string): Promise<Response> => {
      const videoResponse = await fetch(url, {
        headers: {
          'Accept': 'video/mp4,video/*;q=0.9,*/*;q=0.8',
          'Accept-Encoding': 'identity', // Get original quality
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      })
      return videoResponse
    }

    // Helper function to re-fetch video URL from GRSAI API
    const refetchVideoUrl = async (): Promise<string | null> => {
      if (!task.grsai_task_id) {
        console.warn('[video/download] No grsai_task_id available for re-fetching')
        return null
      }

      try {
        const { getTaskResult } = await import('@/lib/grsai/client')
        const result = await getTaskResult(task.grsai_task_id)
        
        if (result.code === 0 && result.data?.status === 'succeeded' && result.data.results?.[0]?.url) {
          const newVideoUrl = result.data.results[0].url
          
          // Update database with new URL
          await supabase
            .from('video_tasks')
            .update({ video_url: newVideoUrl })
            .eq('id', task.id)
          
          console.log('[video/download] ✅ Re-fetched video URL from GRSAI API:', {
            taskId: task.id,
            newVideoUrl,
          })
          
          return newVideoUrl
        } else {
          console.warn('[video/download] GRSAI API returned non-success status:', {
            code: result.code,
            status: result.data?.status,
          })
          return null
        }
      } catch (refetchError) {
        console.error('[video/download] Failed to re-fetch video URL from GRSAI API:', refetchError)
        return null
      }
    }

    // Try to get video URL (from database or re-fetch from API)
    let videoUrl = task.video_url

    // If no video URL, try to re-fetch from GRSAI API
    if (!videoUrl && task.grsai_task_id) {
      console.log('[video/download] No video URL in database, trying to re-fetch from GRSAI API...')
      videoUrl = await refetchVideoUrl()
    }

    if (!videoUrl) {
      return NextResponse.json(
        { 
          error: 'Video URL not available',
          details: task.grsai_task_id 
            ? 'The video URL has expired and could not be re-fetched. Please try generating the video again.'
            : 'Video URL not available yet. Please wait for the video to finish generating.'
        },
        { status: 404 }
      )
    }

    console.log('[video/download] Downloading video from API URL:', {
      taskId: task.id,
      videoUrl,
      note: 'Streaming video through server to ensure download works',
    })

    try {
      // Fetch video from API URL
      let videoResponse = await tryFetchVideo(videoUrl)

      // If URL expired (404), try to re-fetch from GRSAI API
      if (videoResponse.status === 404 && task.grsai_task_id) {
        console.warn('[video/download] Video URL returned 404, trying to re-fetch from GRSAI API...')
        const newVideoUrl = await refetchVideoUrl()
        
        if (newVideoUrl) {
          videoUrl = newVideoUrl
          videoResponse = await tryFetchVideo(videoUrl)
        }
      }

      if (!videoResponse.ok) {
        console.error('[video/download] Failed to fetch video:', {
          status: videoResponse.status,
          statusText: videoResponse.statusText,
          videoUrl,
          hasGrsaiTaskId: !!task.grsai_task_id,
        })
        
        // Provide helpful error message
        if (videoResponse.status === 404) {
          return NextResponse.json(
            { 
              error: 'Video not found',
              details: 'The video URL has expired (GRSAI videos expire after 2 hours). Please try generating the video again.',
              expired: true
            },
            { status: 404 }
          )
        }
        
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

