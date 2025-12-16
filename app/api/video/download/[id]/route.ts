// API endpoint to download video directly from original API URL
// No R2 storage needed - use original API URL directly, same as the vendor does
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

    // Use the original video URL directly - no R2 upload needed!
    // The vendor's API already provides high-quality videos, just like they do
    const downloadUrl = task.video_url

    console.log('[video/download] Direct download from original API URL:', {
      taskId: task.id,
      videoUrl: downloadUrl,
      isR2Video: downloadUrl.includes('r2.dev'),
      note: 'Using original API URL directly, same as vendor - no R2 storage needed',
    })

    // Directly redirect to the video URL for download
    // This allows the browser to handle the download properly
    return NextResponse.redirect(downloadUrl, {
      status: 302,
      headers: {
        'Content-Disposition': `attachment; filename="video-${task.id}.mp4"`,
      },
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

