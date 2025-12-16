// API endpoint to get original video download URL (no compression)
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

    // Return the original video URL directly
    // R2 videos are already stored with original quality, and API videos are as-is
    // The client will download directly from this URL without any server-side processing
    return NextResponse.json({
      success: true,
      downloadUrl: task.video_url,
      taskId: task.id,
      isR2Video: task.video_url.includes('r2.dev'),
      note: 'This URL points to the original video file with no compression. Download directly to preserve quality.',
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

