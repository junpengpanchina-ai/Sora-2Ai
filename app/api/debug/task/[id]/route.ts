import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * 诊断端点：检查任务状态和问题
 */
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

    // Get task from database
    const { data: videoTask, error: taskError } = await supabase
      .from('video_tasks')
      .select('*')
      .eq('id', taskId)
      .single()

    if (taskError || !videoTask) {
      return NextResponse.json({
        success: false,
        error: 'Task not found',
        details: taskError?.message,
        taskId,
      }, { status: 404 })
    }

    // Check consumption record
    const { data: consumptionRecord } = await supabase
      .from('consumption_records')
      .select('*')
      .eq('video_task_id', taskId)
      .single()

    return NextResponse.json({
      success: true,
      task: {
        id: videoTask.id,
        status: videoTask.status,
        grsai_task_id: videoTask.grsai_task_id,
        prompt: videoTask.prompt,
        progress: videoTask.progress,
        video_url: videoTask.video_url,
        error_message: videoTask.error_message,
        created_at: videoTask.created_at,
        completed_at: videoTask.completed_at,
      },
      consumption: consumptionRecord ? {
        id: consumptionRecord.id,
        credits: consumptionRecord.credits,
        status: consumptionRecord.status,
        refunded: consumptionRecord.status === 'refunded',
      } : null,
      diagnostics: {
        hasGrsaiTaskId: !!videoTask.grsai_task_id,
        isFinalStatus: ['succeeded', 'failed'].includes(videoTask.status),
        canRefund: videoTask.status !== 'succeeded' && consumptionRecord?.status !== 'refunded',
      },
    })
  } catch (error) {
    console.error('Diagnostic error:', error)
    return NextResponse.json(
      {
        error: 'Failed to diagnose task',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

