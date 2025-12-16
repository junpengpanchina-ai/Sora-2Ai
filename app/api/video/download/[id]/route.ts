// API endpoint to get original video download URL (no compression)
// Smart upload: Only upload to R2 when user clicks download (on-demand), not automatically
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

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

    // Smart upload: If video is from API (not R2), upload to R2 on-demand when user downloads
    // This saves storage space - only videos that users actually download are stored in R2
    const isR2Video = task.video_url.includes('r2.dev')
    let downloadUrl = task.video_url

    if (!isR2Video) {
      // Video is from API, upload to R2 on-demand for original quality
      try {
        const { uploadVideoFromUrl } = await import('@/lib/r2/client')
        const r2Key = `videos/${task.id}.mp4`
        
        console.log('[video/download] Uploading video to R2 on-demand (user requested download):', {
          taskId: task.id,
          originalUrl: task.video_url,
          r2Key,
        })
        
        const r2Url = await uploadVideoFromUrl(task.video_url, r2Key)
        
        // Update database with R2 URL for future use
        const updateData: Partial<Database['public']['Tables']['video_tasks']['Update']> = {
          video_url: r2Url,
        }
        await supabase
          .from('video_tasks')
          .update(updateData)
          .eq('id', task.id)
        
        downloadUrl = r2Url
        console.log('[video/download] ✅ Video uploaded to R2 on-demand:', {
          taskId: task.id,
          r2Url,
        })
      } catch (uploadError) {
        // If upload fails, fallback to original API URL
        console.warn('[video/download] ⚠️ Failed to upload to R2, using original URL:', {
          taskId: task.id,
          error: uploadError instanceof Error ? uploadError.message : String(uploadError),
          fallbackUrl: task.video_url,
        })
        // Continue with original URL
      }
    }

    return NextResponse.json({
      success: true,
      downloadUrl,
      taskId: task.id,
      isR2Video: downloadUrl.includes('r2.dev'),
      uploadedOnDemand: !isR2Video && downloadUrl.includes('r2.dev'),
      note: 'This URL points to the original video file with no compression. Video was uploaded to R2 on-demand when you clicked download.',
    })
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

