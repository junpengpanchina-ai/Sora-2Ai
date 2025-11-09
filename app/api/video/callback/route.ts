import { createClient } from '@/lib/supabase/server'
import { refundCreditsByVideoTaskId } from '@/lib/credits'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Webhook callback data validation schema
const webhookCallbackSchema = z.object({
  id: z.string(),
  results: z.array(z.object({
    url: z.string(),
    removeWatermark: z.boolean().optional(),
    pid: z.string().optional(),
  })).optional(),
  progress: z.number().min(0).max(100),
  status: z.enum(['running', 'succeeded', 'failed']),
  failure_reason: z.enum(['output_moderation', 'input_moderation', 'error']).optional(),
  error: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    // Parse callback data
    const body = await request.json()
    const callbackData = webhookCallbackSchema.parse(body)

    const supabase = await createClient()

    // Find task by grsai_task_id
    const { data: videoTask, error: findError } = await supabase
      .from('video_tasks')
      .select('*')
      .eq('grsai_task_id', callbackData.id)
      .single()

    if (findError || !videoTask) {
      console.error('Task not found:', callbackData.id, findError)
      // Return success even if task not found to avoid Grsai duplicate callbacks
      return NextResponse.json({ success: true, message: 'Task not found, but recorded' })
    }

    // Update task status
    const updateData: any = {
      progress: callbackData.progress,
      status: callbackData.status === 'running' ? 'processing' :
              callbackData.status === 'succeeded' ? 'succeeded' :
              callbackData.status === 'failed' ? 'failed' : 'processing',
    }

    // If task completed, update result information
    if (callbackData.status === 'succeeded' && callbackData.results?.[0]) {
      updateData.video_url = callbackData.results[0].url
      updateData.remove_watermark = callbackData.results[0].removeWatermark ?? true
      updateData.pid = callbackData.results[0].pid || null
      updateData.completed_at = new Date().toISOString()
    }

    // If task failed, update error information and refund credits
    if (callbackData.status === 'failed') {
      updateData.failure_reason = callbackData.failure_reason || null
      updateData.error_message = callbackData.error || null
      updateData.completed_at = new Date().toISOString()
      
      // Refund credits when task fails
      const refundResult = await refundCreditsByVideoTaskId(
        supabase,
        videoTask.user_id,
        videoTask.id
      )
      
      if (!refundResult.success) {
        console.error('Failed to refund credits:', refundResult.error)
        // Continue even if refund fails, as the task status is already updated
      }
    }

    // Update database
    const { error: updateError } = await supabase
      .from('video_tasks')
      .update(updateData)
      .eq('id', videoTask.id)

    if (updateError) {
      console.error('Failed to update task status:', updateError)
      return NextResponse.json(
        { error: 'Failed to update task status', details: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Callback processed successfully',
      task_id: videoTask.id,
      status: callbackData.status,
    })
  } catch (error) {
    console.error('Failed to process webhook callback:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Callback data validation failed', details: error.errors },
        { status: 400 }
      )
    }

    // Return success even on error to avoid Grsai duplicate callbacks
    return NextResponse.json({ 
      success: true, 
      message: 'Callback received, but error occurred during processing',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}


