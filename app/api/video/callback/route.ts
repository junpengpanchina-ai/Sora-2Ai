// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { refundCreditsByVideoTaskId } from '@/lib/credits'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import type { Database } from '@/types/database'
import { attributePromptFailure } from '@/lib/prompt-template-events/failure-attribution'


// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Webhook callback data validation schema (supports both Sora and Veo formats)
const webhookCallbackSchema = z.object({
  id: z.string(),
  // Sora format: results array
  results: z.array(z.object({
    url: z.string(),
    removeWatermark: z.boolean().optional(),
    pid: z.string().optional(),
  })).optional(),
  // Veo format: direct url
  url: z.string().optional(),
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
      .select('*, model, prompt_template_id, scene_id, variant_label')
      .eq('grsai_task_id', callbackData.id)
      .single()

    if (findError || !videoTask) {
      console.error('Task not found:', callbackData.id, findError)
      // Return success even if task not found to avoid Grsai duplicate callbacks
      return NextResponse.json({ success: true, message: 'Task not found, but recorded' })
    }

    // Update task status
    const updateData: Partial<Database['public']['Tables']['video_tasks']['Update']> = {
      progress: callbackData.progress,
      status: callbackData.status === 'running' ? 'processing' :
              callbackData.status === 'succeeded' ? 'succeeded' :
              callbackData.status === 'failed' ? 'failed' : 'processing',
    }

    // If task completed, optionally download and upload to R2 to preserve quality
    // Controlled by R2_AUTO_UPLOAD_VIDEOS environment variable (default: false to save storage)
    const isVeoModel = videoTask?.model?.startsWith('veo') || false
    
    // Handle different response formats for Sora vs Veo
    let originalVideoUrl: string | undefined
    let removeWatermark: boolean | undefined
    let pid: string | undefined
    
    if (isVeoModel) {
      // Veo format: direct url
      originalVideoUrl = callbackData.url
    } else {
      // Sora format: results array
      originalVideoUrl = callbackData.results?.[0]?.url
      removeWatermark = callbackData.results?.[0]?.removeWatermark
      pid = callbackData.results?.[0]?.pid
    }
    
    if (callbackData.status === 'succeeded' && originalVideoUrl) {
      const autoUploadToR2 = process.env.R2_AUTO_UPLOAD_VIDEOS === 'true'
      
      if (autoUploadToR2) {
        // Try to download and upload to R2 to preserve original quality
        try {
          const { uploadVideoFromUrl } = await import('@/lib/r2/client')
          const r2Key = `videos/${videoTask.id}.mp4`
          
          console.log('[video/callback] Starting video upload to R2:', {
            taskId: videoTask.id,
            originalUrl: originalVideoUrl,
            r2Key,
          })
          
          const r2Url = await uploadVideoFromUrl(originalVideoUrl, r2Key)
          
          // Use R2 URL instead of original API URL for better quality and persistence
          updateData.video_url = r2Url
          console.log('[video/callback] ✅ Video successfully uploaded to R2 with original quality:', {
            taskId: videoTask.id,
            r2Url,
            originalUrl: originalVideoUrl,
            qualityCheck: 'You can verify quality at /api/video/check-quality/' + videoTask.id,
          })
        } catch (uploadError) {
          // If upload fails, fallback to original URL
          console.warn('[video/callback] ⚠️ Failed to upload video to R2, using original URL:', {
            taskId: videoTask.id,
            error: uploadError instanceof Error ? uploadError.message : String(uploadError),
            fallbackUrl: originalVideoUrl,
          })
          updateData.video_url = originalVideoUrl
        }
      } else {
        // Use original API URL to save R2 storage space
        // Videos can be uploaded to R2 on-demand when user clicks download
        updateData.video_url = originalVideoUrl
        console.log('[video/callback] Using original API URL (R2_AUTO_UPLOAD_VIDEOS=false to save storage):', {
          taskId: videoTask.id,
          originalUrl: originalVideoUrl,
          note: 'Video can be uploaded to R2 on-demand when needed',
        })
      }
      
      // Sora-specific fields
      if (!isVeoModel) {
        updateData.remove_watermark = removeWatermark ?? true
        updateData.pid = pid || null
      }
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

    // Best-effort prompt asset event: success / failure (requires prompt_template_id on task)
    if (videoTask?.prompt_template_id) {
      try {
        const service = await createServiceClient()
        const isFailed = callbackData.status === 'failed'
        // Map failure_reason to a stable failure_type for Gate.
        const att = isFailed
          ? attributePromptFailure({
              failureReason: callbackData.failure_reason ?? null,
              error: callbackData.error ?? null,
            })
          : null

        const eventType = isFailed ? 'failure' : 'success'
        const requestId = `${String(callbackData.id)}:${eventType}`

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (service as any).from('prompt_template_events').insert({
          occurred_at: new Date().toISOString(),
          user_id: videoTask.user_id ?? null,
          session_id: null,
          scene_id: videoTask.scene_id ?? null,
          prompt_template_id: videoTask.prompt_template_id,
          variant_label: videoTask.variant_label ?? null,
          event_type: eventType,
          revenue_cents: 0,
          request_id: requestId,
          props: {
            source: 'video_callback',
            ...(att ? { failure_type: att.failure_type, fail_code: att.fail_code } : {}),
            provider_task_id: String(callbackData.id),
            status: callbackData.status,
            progress: callbackData.progress,
            error: callbackData.error ?? null,
            failure_reason: callbackData.failure_reason ?? null,
          },
        })
      } catch (e) {
        console.warn('[video/callback] prompt event insert failed:', e)
      }
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


