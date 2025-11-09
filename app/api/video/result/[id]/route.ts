import { createClient } from '@/lib/supabase/server'
import { getTaskResult } from '@/lib/grsai/client'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify user authentication (only verify login)
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

    const taskId = params.id // Grsai task ID

    // Get task result directly from Grsai API
    try {
      const grsaiResult = await getTaskResult(taskId)

      if (grsaiResult.code === 0 && grsaiResult.data) {
        const data = grsaiResult.data

        if (data.status === 'succeeded' && data.results?.[0]) {
          return NextResponse.json({
            success: true,
            status: 'succeeded',
            progress: data.progress,
            video_url: data.results[0].url,
            remove_watermark: data.results[0].removeWatermark ?? true,
            pid: data.results[0].pid,
            task_id: taskId,
          })
        } else if (data.status === 'failed') {
          return NextResponse.json({
            success: false,
            status: 'failed',
            progress: data.progress,
            error: data.error || data.failure_reason || 'Generation failed',
            task_id: taskId,
          })
        } else {
          // Processing
          return NextResponse.json({
            success: true,
            status: 'processing',
            progress: data.progress,
            task_id: taskId,
          })
        }
      } else if (grsaiResult.code === -22) {
        // Task not found
        return NextResponse.json({
          success: false,
          status: 'failed',
          error: 'Task not found',
          task_id: taskId,
        }, { status: 404 })
      } else {
        return NextResponse.json({
          success: false,
          error: grsaiResult.msg || 'Failed to fetch task result',
          task_id: taskId,
        }, { status: 500 })
      }
    } catch (grsaiError) {
      console.error('Failed to fetch Grsai task result:', grsaiError)
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to fetch task result', 
          details: grsaiError instanceof Error ? grsaiError.message : 'Unknown error',
          task_id: taskId,
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Failed to fetch task result:', error)
    return NextResponse.json(
      { error: 'Failed to fetch task result', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}


