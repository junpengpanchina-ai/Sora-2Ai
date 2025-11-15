// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
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

    const taskRecord = videoTask as {
      id: string
      status: string
      grsai_task_id: string | null
      prompt: string
      progress: number
      video_url: string | null
      error_message: string | null
      created_at: string
      completed_at: string | null
    }

    const consumption = consumptionRecord as {
      id: string
      credits: number
      status: 'completed' | 'refunded' | string
    } | null

    return NextResponse.json({
      success: true,
      task: {
        id: taskRecord.id,
        status: taskRecord.status,
        grsai_task_id: taskRecord.grsai_task_id,
        prompt: taskRecord.prompt,
        progress: taskRecord.progress,
        video_url: taskRecord.video_url,
        error_message: taskRecord.error_message,
        created_at: taskRecord.created_at,
        completed_at: taskRecord.completed_at,
      },
      consumption: consumption ? {
        id: consumption.id,
        credits: consumption.credits,
        status: consumption.status,
        refunded: consumption.status === 'refunded',
      } : null,
      diagnostics: {
        hasGrsaiTaskId: !!taskRecord.grsai_task_id,
        isFinalStatus: ['succeeded', 'failed'].includes(taskRecord.status),
        canRefund: taskRecord.status !== 'succeeded' && consumption?.status !== 'refunded',
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

