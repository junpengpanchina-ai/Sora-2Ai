// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { getTaskResult } from '@/lib/grsai/client'
import { formatGrsaiFriendlyError } from '@/lib/grsai/error-utils'
import { NextRequest, NextResponse } from 'next/server'


// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify user authentication (only verify login)
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

    const taskIdParam = params.id // Could be either internal task ID (UUID) or Grsai task ID

    // Check if it's a UUID (internal task ID) or Grsai task ID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(taskIdParam)
    
    let grsaiTaskId = taskIdParam
    let internalTaskId = null

    // If it's a UUID, look up the grsai_task_id from database
    if (isUUID) {
      const { data: videoTask, error: taskError } = await supabase
        .from('video_tasks')
        .select('grsai_task_id, status, progress, video_url, error_message, model')
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
        const isVeoModel = videoTask?.model?.startsWith('veo') || false

        // Handle different response formats for Sora vs Veo
        let videoUrl: string | undefined
        let removeWatermark: boolean | undefined
        let pid: string | undefined
        
        if (isVeoModel) {
          // Veo response has url directly
          const veoData = data as { url?: string; status: string; progress: number }
          videoUrl = veoData.url
        } else {
          // Sora response has results array
          const soraData = data as { results?: Array<{ url: string; removeWatermark?: boolean; pid?: string }>; status: string; progress: number }
          videoUrl = soraData.results?.[0]?.url
          removeWatermark = soraData.results?.[0]?.removeWatermark
          pid = soraData.results?.[0]?.pid
        }

        if (data.status === 'succeeded' && videoUrl) {
          const originalVideoUrl = videoUrl
          let finalVideoUrl = originalVideoUrl
          
          // Try to download and upload to R2 to preserve original quality (if enabled)
          const autoUploadToR2 = process.env.R2_AUTO_UPLOAD_VIDEOS === 'true'
          if (internalTaskId && autoUploadToR2) {
            try {
              const { uploadVideoFromUrl } = await import('@/lib/r2/client')
              const r2Key = `videos/${internalTaskId}.mp4`
              
              console.log('[video/result] Starting video upload to R2:', {
                taskId: internalTaskId,
                originalUrl: originalVideoUrl,
                r2Key,
              })
              
              finalVideoUrl = await uploadVideoFromUrl(originalVideoUrl, r2Key)
              console.log('[video/result] ✅ Video successfully uploaded to R2 with original quality:', {
                taskId: internalTaskId,
                r2Url: finalVideoUrl,
                originalUrl: originalVideoUrl,
                qualityCheck: 'You can verify quality at /api/video/check-quality/' + internalTaskId,
              })
            } catch (uploadError) {
              // If upload fails, fallback to original URL
              console.warn('[video/result] ⚠️ Failed to upload video to R2, using original URL:', {
                taskId: internalTaskId,
                error: uploadError instanceof Error ? uploadError.message : String(uploadError),
                fallbackUrl: originalVideoUrl,
              })
            }
          }
          
          // Update database if we have internal task ID
          if (internalTaskId) {
            const updateData: Record<string, unknown> = {
              status: 'succeeded',
              progress: data.progress,
              video_url: finalVideoUrl,
              completed_at: new Date().toISOString(),
            }
            
            // Sora-specific fields
            if (!isVeoModel && removeWatermark !== undefined) {
              updateData.remove_watermark = removeWatermark
            }
            if (!isVeoModel && pid) {
              updateData.pid = pid
            }
            
            await supabase
              .from('video_tasks')
              .update(updateData)
              .eq('id', internalTaskId)
          }

          const responseData: Record<string, unknown> = {
            success: true,
            status: 'succeeded',
            progress: data.progress,
            video_url: finalVideoUrl,
            task_id: internalTaskId || grsaiTaskId,
          }
          
          // Sora-specific fields
          if (!isVeoModel) {
            responseData.remove_watermark = removeWatermark ?? true
            if (pid) responseData.pid = pid
          }
          
          return NextResponse.json(responseData)
        } else if (data.status === 'failed') {
          const friendlyError = formatGrsaiFriendlyError({
            failureReason: data.failure_reason,
            error: data.error,
            fallback: 'Video generation failed because the upstream service rejected the request.',
          })
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
                error_message: friendlyError.message,
                failure_reason: data.failure_reason || null,
                completed_at: new Date().toISOString(),
              })
              .eq('id', internalTaskId)
          }

          return NextResponse.json({
            success: false,
            status: 'failed',
            progress: data.progress,
            error: friendlyError.message,
            violation_type: friendlyError.violationType,
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
        const friendlyError = formatGrsaiFriendlyError({
          grsaiCode: -22,
          fallback: 'Task not found in upstream service.',
        })
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
              error_message: friendlyError.message,
              completed_at: new Date().toISOString(),
            })
            .eq('id', internalTaskId)
        }

        // Task not found
        return NextResponse.json({
          success: false,
          status: 'failed',
          error: friendlyError.message,
          violation_type: friendlyError.violationType,
          task_id: internalTaskId || grsaiTaskId,
        }, { status: 404 })
      } else {
        const friendlyError = formatGrsaiFriendlyError({
          msg: grsaiResult.msg,
          fallback: 'Failed to fetch task result from upstream service.',
        })
        return NextResponse.json({
          success: false,
          error: friendlyError.message,
          violation_type: friendlyError.violationType,
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


