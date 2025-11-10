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

    const taskIdParam = params.id // Could be either internal task ID (UUID) or Grsai task ID

    // Check if it's a UUID (internal task ID) or Grsai task ID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(taskIdParam)
    
    let grsaiTaskId = taskIdParam
    let internalTaskId = null

    // If it's a UUID, look up the grsai_task_id from database
    if (isUUID) {
      const { data: videoTask, error: taskError } = await supabase
        .from('video_tasks')
        .select('grsai_task_id, status, progress, video_url, error_message')
        .eq('id', taskIdParam)
        .single()

      if (taskError || !videoTask) {
        return NextResponse.json({
          success: false,
          status: 'failed',
          error: 'Task not found in database',
          task_id: taskIdParam,
        }, { status: 404 })
      }

      // If task already has final status, return it directly
      if (videoTask.status === 'succeeded' && videoTask.video_url) {
        return NextResponse.json({
          success: true,
          status: 'succeeded',
          progress: videoTask.progress || 100,
          video_url: videoTask.video_url,
          task_id: taskIdParam,
        })
      }

      if (videoTask.status === 'failed') {
        return NextResponse.json({
          success: false,
          status: 'failed',
          error: videoTask.error_message || 'Generation failed',
          task_id: taskIdParam,
        })
      }

      // Get grsai_task_id for polling
      if (!videoTask.grsai_task_id) {
        return NextResponse.json({
          success: false,
          status: 'failed',
          error: 'Grsai task ID not found, task may not have been created',
          task_id: taskIdParam,
        }, { status: 404 })
      }

      grsaiTaskId = videoTask.grsai_task_id
      internalTaskId = taskIdParam
    }

    // Get task result directly from Grsai API
    try {
      // Validate grsaiTaskId before calling API
      if (!grsaiTaskId || grsaiTaskId.trim() === '') {
        console.error('[video/result] Invalid grsaiTaskId:', grsaiTaskId)
        if (internalTaskId) {
          // Mark task as failed and refund credits
          const { refundCreditsByVideoTaskId } = await import('@/lib/credits')
          const { getOrCreateUser } = await import('@/lib/user')
          const userProfile = await getOrCreateUser(supabase, user!)
          if (userProfile) {
            await refundCreditsByVideoTaskId(supabase, userProfile.id, internalTaskId)
          }
          await supabase
            .from('video_tasks')
            .update({
              status: 'failed',
              error_message: 'Invalid Grsai task ID',
              completed_at: new Date().toISOString(),
            })
            .eq('id', internalTaskId)
        }
        return NextResponse.json({
          success: false,
          status: 'failed',
          error: 'Invalid task ID',
          task_id: internalTaskId || taskIdParam,
        }, { status: 400 })
      }

      console.log('[video/result] Fetching task result:', { grsaiTaskId, internalTaskId })
      const grsaiResult = await getTaskResult(grsaiTaskId)
      console.log('[video/result] Grsai API response:', { code: grsaiResult.code, hasData: !!grsaiResult.data })

      if (grsaiResult.code === 0 && grsaiResult.data) {
        const data = grsaiResult.data

        if (data.status === 'succeeded' && data.results?.[0]) {
          // Update database if we have internal task ID
          if (internalTaskId) {
            await supabase
              .from('video_tasks')
              .update({
                status: 'succeeded',
                progress: data.progress,
                video_url: data.results[0].url,
                remove_watermark: data.results[0].removeWatermark ?? true,
                pid: data.results[0].pid || null,
                completed_at: new Date().toISOString(),
              })
              .eq('id', internalTaskId)
          }

          return NextResponse.json({
            success: true,
            status: 'succeeded',
            progress: data.progress,
            video_url: data.results[0].url,
            remove_watermark: data.results[0].removeWatermark ?? true,
            pid: data.results[0].pid,
            task_id: internalTaskId || grsaiTaskId,
          })
        } else if (data.status === 'failed') {
          // Update database and refund credits if we have internal task ID
          if (internalTaskId) {
            const { refundCreditsByVideoTaskId } = await import('@/lib/credits')
            const { getOrCreateUser } = await import('@/lib/user')
            const userProfile = await getOrCreateUser(supabase, user!)
            if (userProfile) {
              await refundCreditsByVideoTaskId(supabase, userProfile.id, internalTaskId)
            }

            await supabase
              .from('video_tasks')
              .update({
                status: 'failed',
                progress: data.progress,
                error_message: data.error || data.failure_reason || 'Generation failed',
                completed_at: new Date().toISOString(),
              })
              .eq('id', internalTaskId)
          }

          return NextResponse.json({
            success: false,
            status: 'failed',
            progress: data.progress,
            error: data.error || data.failure_reason || 'Generation failed',
            task_id: internalTaskId || grsaiTaskId,
          })
        } else {
          // Processing - update progress in database
          if (internalTaskId) {
            await supabase
              .from('video_tasks')
              .update({
                status: 'processing',
                progress: data.progress,
              })
              .eq('id', internalTaskId)
          }

          // Processing
          return NextResponse.json({
            success: true,
            status: 'processing',
            progress: data.progress,
            task_id: internalTaskId || grsaiTaskId,
          })
        }
      } else if (grsaiResult.code === -22) {
        // Task not found in Grsai - mark as failed and refund credits
        if (internalTaskId) {
          const { refundCreditsByVideoTaskId } = await import('@/lib/credits')
          const { getOrCreateUser } = await import('@/lib/user')
          const userProfile = await getOrCreateUser(supabase, user!)
          if (userProfile) {
            await refundCreditsByVideoTaskId(supabase, userProfile.id, internalTaskId)
          }

          await supabase
            .from('video_tasks')
            .update({
              status: 'failed',
              error_message: 'Task not found in Grsai API',
              completed_at: new Date().toISOString(),
            })
            .eq('id', internalTaskId)
        }

        // Task not found
        return NextResponse.json({
          success: false,
          status: 'failed',
          error: 'Task not found',
          task_id: internalTaskId || grsaiTaskId,
        }, { status: 404 })
      } else {
        return NextResponse.json({
          success: false,
          error: grsaiResult.msg || 'Failed to fetch task result',
          task_id: internalTaskId || grsaiTaskId,
        }, { status: 500 })
      }
    } catch (grsaiError) {
      console.error('[video/result] Failed to fetch Grsai task result:', {
        error: grsaiError,
        message: grsaiError instanceof Error ? grsaiError.message : 'Unknown error',
        stack: grsaiError instanceof Error ? grsaiError.stack : undefined,
        grsaiTaskId,
        internalTaskId,
      })
      
      // If we have internal task ID and Grsai API fails, mark as failed and refund credits
      if (internalTaskId) {
        try {
          const { refundCreditsByVideoTaskId } = await import('@/lib/credits')
          const { getOrCreateUser } = await import('@/lib/user')
          const userProfile = await getOrCreateUser(supabase, user!)
          if (userProfile) {
            await refundCreditsByVideoTaskId(supabase, userProfile.id, internalTaskId)
          }
          await supabase
            .from('video_tasks')
            .update({
              status: 'failed',
              error_message: `Grsai API error: ${grsaiError instanceof Error ? grsaiError.message : 'Unknown error'}`,
              completed_at: new Date().toISOString(),
            })
            .eq('id', internalTaskId)
        } catch (refundError) {
          console.error('[video/result] Failed to refund credits:', refundError)
        }
      }
      
      return NextResponse.json(
        { 
          success: false,
          status: 'failed',
          error: 'Failed to fetch task result from Grsai API', 
          details: grsaiError instanceof Error ? grsaiError.message : 'Unknown error',
          task_id: internalTaskId || grsaiTaskId,
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('[video/result] Unexpected error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch task result', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}


