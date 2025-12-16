// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { createSoraVideoTask } from '@/lib/grsai/client'
import { formatGrsaiFriendlyError } from '@/lib/grsai/error-utils'
import { deductCredits, refundCredits } from '@/lib/credits'
import { getOrCreateUser } from '@/lib/user'
import { validateOrigin } from '@/lib/csrf'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Request parameter validation schema
const generateVideoSchema = z.object({
  prompt: z.string().min(1, 'Prompt cannot be empty'),
  url: z.string().url().optional().or(z.literal('')),
  aspectRatio: z.enum(['9:16', '16:9']).optional().default('9:16'),
  duration: z.enum(['10', '15']).optional().default('10'),
  // size参数已移除，API只支持small，固定使用small
  useWebhook: z.boolean().optional().default(false),
})

export async function POST(request: NextRequest) {
  // #region agent log
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  const hasCsrfHeader = !!request.headers.get('x-csrf-token') || !!request.headers.get('x-requested-with')
  fetch('http://127.0.0.1:7242/ingest/ef411af9-a357-4528-93a0-017b8708eb6e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/video/generate/route.ts:23',message:'Video generate POST - ENTRY',data:{origin,referer,hasCsrfHeader,method:'POST'},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'D'})}).catch(()=>{});
  // #endregion
  
  // SECURITY FIX: CSRF protection - validate origin/referer
  if (!validateOrigin(request)) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/ef411af9-a357-4528-93a0-017b8708eb6e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/video/generate/route.ts:30',message:'Video generate POST - CSRF REJECTED',data:{origin,referer},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    return NextResponse.json(
      { error: 'Invalid origin' },
      { status: 403 }
    )
  }
  
  try {
    // Verify user authentication (only verify login, no database needed)
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

    // Get or create user profile
    const userProfile = await getOrCreateUser(supabase, user)

    if (!userProfile) {
      console.error('[video/generate] Failed to get or create user:', {
        userId: user.id,
        email: user.email,
        googleId: user.user_metadata?.provider_id || user.user_metadata?.sub || user.id,
      })
      return NextResponse.json(
        { 
          error: 'User not found or failed to create user',
          details: 'Please try logging out and logging back in, or contact support if the issue persists.'
        },
        { status: 404 }
      )
    }

    // Parse request body
    const body = await request.json()
    const validatedData = generateVideoSchema.parse(body)

    // Build webhook URL (if using callback)
    // SECURITY FIX: Only use configured NEXT_PUBLIC_APP_URL, never trust user-controlled Origin header
    // This prevents SSRF attacks via webhook URL hijacking
    // #region agent log
    const originHeader = request.headers.get('origin')
    const envBaseUrl = process.env.NEXT_PUBLIC_APP_URL
    fetch('http://127.0.0.1:7242/ingest/ef411af9-a357-4528-93a0-017b8708eb6e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/video/generate/route.ts:65',message:'Webhook URL construction - BEFORE',data:{originHeader,envBaseUrl,useWebhook:validatedData.useWebhook,userId:user.id},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    // Only allow webhook if NEXT_PUBLIC_APP_URL is configured
    // Never use user-controlled headers to prevent SSRF
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/ef411af9-a357-4528-93a0-017b8708eb6e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/video/generate/route.ts:73',message:'Webhook URL construction - AFTER (FIXED)',data:{baseUrl,webhookUrl:validatedData.useWebhook ? `${baseUrl}/api/video/callback` : '-1',originHeaderRejected:!!originHeader && !envBaseUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    const webhookUrl = validatedData.useWebhook 
      ? `${baseUrl}/api/video/callback`
      : '-1' // Use polling method

    // Create video task record first (before calling API)
    const { data: videoTask, error: taskError } = await supabase
      .from('video_tasks')
      .insert({
        user_id: userProfile.id,
        model: 'sora-2',
        prompt: validatedData.prompt,
        reference_url: validatedData.url || null,
        aspect_ratio: validatedData.aspectRatio,
        duration: parseInt(validatedData.duration),
        size: 'small', // API只支持small，固定值
        status: 'pending',
        webhook_url: webhookUrl !== '-1' ? webhookUrl : null,
      })
      .select()
      .single()

    if (taskError || !videoTask) {
      console.error('Failed to create video task:', taskError)
      return NextResponse.json(
        { error: 'Failed to create video task', details: taskError?.message },
        { status: 500 }
      )
    }

    // Deduct credits before calling API
    const deductResult = await deductCredits(
      supabase,
      userProfile.id,
      videoTask.id,
      `Video generation: ${validatedData.prompt.substring(0, 50)}...`
    )

    if (!deductResult.success) {
      // Delete the task record if credit deduction failed
      await supabase
        .from('video_tasks')
        .delete()
        .eq('id', videoTask.id)
      
      return NextResponse.json(
        { error: deductResult.error || 'Insufficient credits' },
        { status: 400 }
      )
    }

    const consumptionId = deductResult.consumptionId

    // Call Grsai API
    const grsaiParams = {
      model: 'sora-2',
      prompt: validatedData.prompt,
      url: validatedData.url || undefined,
      aspectRatio: validatedData.aspectRatio,
      duration: parseInt(validatedData.duration) as 10 | 15,
      size: 'small' as const, // API只支持small，固定值
      webHook: webhookUrl,
      shutProgress: false,
    }

    let grsaiResponse
    try {
      grsaiResponse = await createSoraVideoTask(grsaiParams)
    } catch (apiError) {
      // Log detailed error for debugging
      const errorMessage = apiError instanceof Error ? apiError.message : 'Unknown error'
      console.error('[video/generate] Grsai API call failed:', {
        error: errorMessage,
        taskId: videoTask.id,
        prompt: validatedData.prompt.substring(0, 50),
        grsaiHost: process.env.GRSAI_HOST || 'https://grsai.dakka.com.cn',
        hasApiKey: !!process.env.GRSAI_API_KEY,
      })
      
      // If API call fails, refund credits and update task status
      if (consumptionId) {
        await refundCredits(supabase, userProfile.id, consumptionId)
      }
      await supabase
        .from('video_tasks')
        .update({ 
          status: 'failed',
          error_message: errorMessage
        })
        .eq('id', videoTask.id)
      
      // Provide more helpful error message
      let userFriendlyError = errorMessage
      if (errorMessage.includes('GRSAI_API_KEY 环境变量未配置')) {
        userFriendlyError = 'API Key 未配置。请检查服务器配置中的 GRSAI_API_KEY 环境变量。'
      } else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        userFriendlyError = 'API Key 无效或已过期。请检查 GRSAI_API_KEY 配置。'
      } else if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
        userFriendlyError = 'API Key 没有权限访问此服务。请检查 API Key 配置。'
      } else if (errorMessage.includes('429') || errorMessage.includes('Rate limit')) {
        userFriendlyError = 'API 请求频率过高，请稍后重试。'
      } else if (errorMessage.includes('500') || errorMessage.includes('502') || errorMessage.includes('503')) {
        userFriendlyError = 'API 服务暂时不可用，请稍后重试。'
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to call video generation API', 
          details: userFriendlyError,
          technicalDetails: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        },
        { status: 500 }
      )
    }

    // Get task ID (for polling)
    let taskId: string | null = null
    if ('data' in grsaiResponse && grsaiResponse.data?.id) {
      // Using polling method, id returned
      taskId = grsaiResponse.data.id
    } else if ('id' in grsaiResponse) {
      // Streaming response or callback method, already has id
      taskId = grsaiResponse.id
    }

    // Update task with grsai_task_id
    await supabase
      .from('video_tasks')
      .update({ grsai_task_id: taskId })
      .eq('id', videoTask.id)

    // If using streaming response and completed, return result directly
    if (!validatedData.useWebhook && 'status' in grsaiResponse) {
      if (grsaiResponse.status === 'succeeded' && grsaiResponse.results?.[0]) {
        const originalVideoUrl = grsaiResponse.results[0].url
        let finalVideoUrl = originalVideoUrl
        
        // Try to download and upload to R2 to preserve original quality (if enabled)
        const autoUploadToR2 = process.env.R2_AUTO_UPLOAD_VIDEOS === 'true'
        if (autoUploadToR2) {
          try {
            const { uploadVideoFromUrl } = await import('@/lib/r2/client')
            const r2Key = `videos/${videoTask.id}.mp4`
            
            console.log('[video/generate] Starting video upload to R2:', {
              taskId: videoTask.id,
              originalUrl: originalVideoUrl,
              r2Key,
            })
            
            finalVideoUrl = await uploadVideoFromUrl(originalVideoUrl, r2Key)
            console.log('[video/generate] ✅ Video successfully uploaded to R2 with original quality:', {
              taskId: videoTask.id,
              r2Url: finalVideoUrl,
              originalUrl: originalVideoUrl,
              qualityCheck: 'You can verify quality at /api/video/check-quality/' + videoTask.id,
            })
          } catch (uploadError) {
            // If upload fails, fallback to original URL
            console.warn('[video/generate] ⚠️ Failed to upload video to R2, using original URL:', {
              taskId: videoTask.id,
              error: uploadError instanceof Error ? uploadError.message : String(uploadError),
              fallbackUrl: originalVideoUrl,
            })
          }
        }
        
        // Update task with result
        await supabase
          .from('video_tasks')
          .update({
            status: 'succeeded',
            video_url: finalVideoUrl,
            remove_watermark: grsaiResponse.results[0].removeWatermark ?? true,
            pid: grsaiResponse.results[0].pid || null,
            completed_at: new Date().toISOString(),
            progress: 100,
          })
          .eq('id', videoTask.id)

        return NextResponse.json({
          success: true,
          status: 'succeeded',
          video_url: finalVideoUrl,
          remove_watermark: grsaiResponse.results[0].removeWatermark,
          pid: grsaiResponse.results[0].pid,
          task_id: videoTask.id,
        })
      } else if (grsaiResponse.status === 'failed') {
        // Log detailed failure information
        console.error('[video/generate] Video generation failed:', {
          taskId: videoTask.id,
          grsaiTaskId: grsaiResponse.id,
          failureReason: grsaiResponse.failure_reason,
          error: grsaiResponse.error,
          prompt: validatedData.prompt.substring(0, 50),
          progress: grsaiResponse.progress,
        })
        
        const friendlyError = formatGrsaiFriendlyError({
          failureReason: grsaiResponse.failure_reason,
          error: grsaiResponse.error,
          fallback: 'Video generation failed because the request was rejected by the upstream service.',
        })
        // Refund credits on failure
        if (consumptionId) {
          await refundCredits(supabase, userProfile.id, consumptionId)
        }
        
        // Update task status
        await supabase
          .from('video_tasks')
          .update({
            status: 'failed',
            failure_reason: grsaiResponse.failure_reason || null,
            error_message: friendlyError.message,
            completed_at: new Date().toISOString(),
          })
          .eq('id', videoTask.id)

        return NextResponse.json({
          success: false,
          status: 'failed',
          error: friendlyError.message,
          violation_type: friendlyError.violationType,
          task_id: videoTask.id,
        }, { status: friendlyError.violationType ? 400 : 500 })
      }
    }

    // Update task status to processing
    await supabase
      .from('video_tasks')
      .update({ status: 'processing' })
      .eq('id', videoTask.id)

    // If using polling method, return task ID for frontend polling
    if (taskId) {
      return NextResponse.json({
        success: true,
        status: 'processing',
        task_id: videoTask.id, // Return our internal task ID
        grsai_task_id: taskId, // Also return grsai task ID
        message: 'Video generation in progress, please wait...',
      })
    }

    // If using webhook, return task ID
    return NextResponse.json({
      success: true,
      status: 'processing',
      task_id: videoTask.id, // Return our internal task ID
      grsai_task_id: taskId, // Also return grsai task ID
      message: 'Video generation in progress, result will be notified via webhook...',
    })
  } catch (error) {
    console.error('Failed to generate video:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Parameter validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to generate video', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}


