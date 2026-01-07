// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { createSoraVideoTask, createVeoVideoTask } from '@/lib/grsai/client'
import { formatGrsaiFriendlyError } from '@/lib/grsai/error-utils'
import { deductCredits, refundCredits, getCreditsForModel, type ModelType } from '@/lib/credits'
import { getOrCreateUser } from '@/lib/user'
import { validateOrigin } from '@/lib/csrf'
import { 
  hasActiveStarterPack, 
  checkDailyLimit, 
  incrementDailyLimit,
  logVeoUsage,
  updateVeoUsageLog
} from '@/lib/starter-pack-limits'
import {
  canUseVeo,
  checkStarterAccessLimits,
  logGeneration,
  checkMultiAccountRisk,
} from '@/lib/starter-access-control'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Helper function to ensure UTF-8 encoding in JSON responses
function jsonResponse<T = unknown>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json(data, {
    ...init,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...init?.headers,
    },
  })
}

// Request parameter validation schema
const generateVideoSchema = z.object({
  prompt: z.string().min(1, 'Prompt cannot be empty'),
  url: z.string().url().optional().or(z.literal('')),
  aspectRatio: z.enum(['9:16', '16:9']).optional().default('9:16'),
  duration: z.enum(['10', '15']).optional().default('10'),
  // size参数已移除，API只支持small，固定使用small
  useWebhook: z.boolean().optional().default(false),
  model: z.enum(['sora-2', 'veo-flash', 'veo-pro']).optional().default('sora-2'),
  firstFrameUrl: z.string().url().optional().or(z.literal('')),
  lastFrameUrl: z.string().url().optional().or(z.literal('')),
  urls: z.array(z.string().url()).optional().default([]),
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
    return jsonResponse(
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
      return jsonResponse(
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
      return jsonResponse(
        { 
          error: 'User not found or failed to create user',
          details: 'Please try logging out and logging back in, or contact support if the issue persists.'
        },
        { status: 404 }
      )
    }

    // Parse request body with UTF-8 encoding
    const body = await request.json()
    
    // Validate and normalize prompt encoding
    if (body.prompt && typeof body.prompt === 'string') {
      // Ensure prompt is valid UTF-8 string
      try {
        // Normalize whitespace and trim
        body.prompt = body.prompt
          .replace(/^create\s+a\s+professional\s+create\s+a\s+professional\s+/i, 'Create a professional ')
          .replace(/\s+/g, ' ')
          .trim()
        
        // Validate UTF-8 encoding (check for invalid characters)
        const utf8Valid = Buffer.from(body.prompt, 'utf8').toString('utf8') === body.prompt
        if (!utf8Valid) {
          console.warn('[video/generate] Potential encoding issue detected in prompt')
        }
      } catch (error) {
        console.error('[video/generate] Error normalizing prompt:', error)
      }
    }
    
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

    // Get client IP and User-Agent for risk control (early, before any checks)
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    // Determine model type
    const model = (validatedData.model || 'sora-2') as ModelType
    const isVeoModel = model.startsWith('veo')
    
    // Check Starter Access limits (7-day access system)
    const starterAccessCheck = await checkStarterAccessLimits(supabase, userProfile.id, model)
    if (!starterAccessCheck.allowed) {
      return jsonResponse(
        { 
          error: starterAccessCheck.message || 'Access limit reached',
          limitReached: true,
          reason: starterAccessCheck.reason,
          expiresAt: starterAccessCheck.expiresAt,
        },
        { status: 429 }
      )
    }
    
    // Check Veo access (Starter Access 期间禁止 Veo)
    if (isVeoModel) {
      const veoAccessCheck = await canUseVeo(supabase, userProfile.id)
      if (!veoAccessCheck.allowed) {
        return jsonResponse(
          { 
            error: veoAccessCheck.message || 'Veo is not available',
            reason: veoAccessCheck.reason,
          },
          { status: 403 }
        )
      }
    }
    
    // Check Starter Pack daily limits for Veo models (legacy system)
    if (isVeoModel) {
      const { hasPack, rechargeRecordId } = await hasActiveStarterPack(supabase, userProfile.id)
      
      if (hasPack && rechargeRecordId) {
        const limitCheck = await checkDailyLimit(supabase, userProfile.id, rechargeRecordId, model)
        
        if (!limitCheck.allowed) {
          return jsonResponse(
            { 
              error: `Daily limit reached for ${model}. You have used ${limitCheck.currentCount}/${limitCheck.maxCount} today. Please try again tomorrow or upgrade to a full pack.`,
              limitReached: true,
              currentCount: limitCheck.currentCount,
              maxCount: limitCheck.maxCount,
            },
            { status: 429 }
          )
        }
      }
    }
    
    // Check multi-account risk (同 IP 多账号检测)
    const multiAccountRisk = await checkMultiAccountRisk(supabase, clientIp)
    if (multiAccountRisk.isRisk && multiAccountRisk.accountCount >= 3) {
      console.warn('[video/generate] Multi-account risk detected:', {
        userId: userProfile.id,
        ip: clientIp,
        accountCount: multiAccountRisk.accountCount,
      })
      // 不直接拒绝，但记录风险标志
      await supabase
        .from('risk_flags')
        .upsert({
          user_id: userProfile.id,
          multi_account_suspected: true,
          note: `Detected ${multiAccountRisk.accountCount} accounts from same IP`,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        })
    }
    
    // Create video task record first (before calling API)
    const { data: videoTask, error: taskError } = await supabase
      .from('video_tasks')
      .insert({
        user_id: userProfile.id,
        model: model,
        prompt: validatedData.prompt,
        reference_url: validatedData.url || null,
        aspect_ratio: validatedData.aspectRatio,
        duration: isVeoModel ? null : parseInt(validatedData.duration), // Veo models don't support duration
        size: isVeoModel ? null : 'small', // Veo models don't support size
        status: 'pending',
        webhook_url: webhookUrl !== '-1' ? webhookUrl : null,
      })
      .select()
      .single()

    if (taskError || !videoTask) {
      console.error('Failed to create video task:', taskError)
      return jsonResponse(
        { error: 'Failed to create video task', details: taskError?.message },
        { status: 500 }
      )
    }

    // Deduct credits before calling API (with model type)
    const deductResult = await deductCredits(
      supabase,
      userProfile.id,
      videoTask.id,
      `Video generation: ${validatedData.prompt.substring(0, 50)}...`,
      model
    )

    if (!deductResult.success) {
      // Delete the task record if credit deduction failed
      await supabase
        .from('video_tasks')
        .delete()
        .eq('id', videoTask.id)
      
      return jsonResponse(
        { error: deductResult.error || 'Insufficient credits' },
        { status: 400 }
      )
    }

    const consumptionId = deductResult.consumptionId

    // Log Veo usage for analytics (only for Veo models)
    let veoUsageLogId: string | undefined
    if (isVeoModel) {
      const { hasPack } = await hasActiveStarterPack(supabase, userProfile.id)
      // 映射到日志使用的模型名称
      const logModelType = model === 'veo-flash' ? 'veo-flash' : 'veo-pro'
      const logResult = await logVeoUsage(
        supabase,
        userProfile.id,
        videoTask.id,
        logModelType as 'veo-flash' | 'veo-pro',
        validatedData.prompt,
        validatedData.aspectRatio,
        consumptionId || null,
        hasPack
      )
      veoUsageLogId = logResult.logId
    }

    // Call Grsai API based on model type
    let grsaiResponse
    try {
      if (isVeoModel) {
        // Veo API parameters
        // 映射到实际的 API 模型名称
        const apiModelName = model === 'veo-flash' ? 'veo3.1-fast' : 'veo3.1-pro'
        const veoParams = {
          model: apiModelName as 'veo3.1-fast' | 'veo3.1-pro',
          prompt: validatedData.prompt,
          aspectRatio: validatedData.aspectRatio as '16:9' | '9:16',
          webHook: webhookUrl,
          shutProgress: false,
          ...(validatedData.firstFrameUrl && { firstFrameUrl: validatedData.firstFrameUrl }),
          ...(validatedData.lastFrameUrl && { lastFrameUrl: validatedData.lastFrameUrl }),
          ...(validatedData.urls && validatedData.urls.length > 0 && { urls: validatedData.urls.slice(0, 3) }), // Max 3 reference images
        }
        grsaiResponse = await createVeoVideoTask(veoParams)
      } else {
        // Sora API parameters
        const soraParams = {
          model: 'sora-2',
          prompt: validatedData.prompt,
          url: validatedData.url || undefined,
          aspectRatio: validatedData.aspectRatio,
          duration: parseInt(validatedData.duration) as 10 | 15,
          size: 'small' as const, // API只支持small，固定值
          webHook: webhookUrl,
          shutProgress: false,
        }
        grsaiResponse = await createSoraVideoTask(soraParams)
      }
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
      if (errorMessage.includes('GRSAI_API_KEY 环境变量未配置') || errorMessage.includes('GRSAI_API_KEY environment variable not configured')) {
        userFriendlyError = 'API Key not configured. Please check the GRSAI_API_KEY environment variable in server configuration.'
      } else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        userFriendlyError = 'API Key is invalid or expired. Please check the GRSAI_API_KEY configuration.'
      } else if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
        userFriendlyError = 'API Key does not have permission to access this service. Please check the API Key configuration.'
      } else if (errorMessage.includes('429') || errorMessage.includes('Rate limit')) {
        userFriendlyError = 'API request rate limit exceeded. Please try again later.'
      } else if (errorMessage.includes('500') || errorMessage.includes('502') || errorMessage.includes('503')) {
        userFriendlyError = 'API service is temporarily unavailable. Please try again later.'
      } else if (
        errorMessage.includes('fetch failed') ||
        errorMessage.includes('连接失败') ||
        errorMessage.includes('连接被重置') ||
        errorMessage.includes('ECONNRESET') ||
        errorMessage.includes('socket hang up') ||
        errorMessage.includes('请求超时') ||
        errorMessage.includes('Connection failed') ||
        errorMessage.includes('Connection reset') ||
        errorMessage.includes('Request timeout')
      ) {
        userFriendlyError = 'Network connection issue. The system has automatically retried. If the problem persists, please check your network connection or try again later.'
      }
      
      return jsonResponse(
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
      // Handle different response formats for Sora vs Veo
      let videoUrl: string | undefined
      if (isVeoModel) {
        // Veo response has url directly
        const veoResponse = grsaiResponse as { url?: string; status: string }
        videoUrl = veoResponse.url
      } else {
        // Sora response has results array
        const soraResponse = grsaiResponse as { results?: Array<{ url: string }>; status: string }
        videoUrl = soraResponse.results?.[0]?.url
      }
      
      if (grsaiResponse.status === 'succeeded' && videoUrl) {
        const originalVideoUrl = videoUrl
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
        const updateData: Record<string, unknown> = {
          status: 'succeeded',
          video_url: finalVideoUrl,
          completed_at: new Date().toISOString(),
          progress: 100,
        }
        
        // Sora-specific fields
        if (!isVeoModel && 'results' in grsaiResponse && grsaiResponse.results?.[0]) {
          updateData.remove_watermark = grsaiResponse.results[0].removeWatermark ?? true
          updateData.pid = grsaiResponse.results[0].pid || null
        }
        
        await supabase
          .from('video_tasks')
          .update(updateData)
          .eq('id', videoTask.id)

        // Update Veo usage log on success
        if (isVeoModel && veoUsageLogId) {
          await updateVeoUsageLog(supabase, veoUsageLogId, 'succeeded')
          
          // Increment daily limit for Starter Pack users
          const { hasPack, rechargeRecordId } = await hasActiveStarterPack(supabase, userProfile.id)
          if (hasPack && rechargeRecordId) {
            await incrementDailyLimit(supabase, userProfile.id, rechargeRecordId, model)
          }
        }
        
        // Log generation success for risk control
        const requiredCredits = getCreditsForModel(model)
        await logGeneration(
          supabase,
          userProfile.id,
          model,
          requiredCredits,
          true,
          clientIp,
          userAgent,
          videoTask.id
        )

        const responseData: Record<string, unknown> = {
          success: true,
          status: 'succeeded',
          video_url: finalVideoUrl,
          task_id: videoTask.id,
        }
        
        // Sora-specific fields
        if (!isVeoModel && 'results' in grsaiResponse && grsaiResponse.results?.[0]) {
          responseData.remove_watermark = grsaiResponse.results[0].removeWatermark
          responseData.pid = grsaiResponse.results[0].pid
        }
        
        return jsonResponse(responseData)
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
        
        // Update Veo usage log on failure (only for Veo Pro, auto-refund)
        if (isVeoModel && veoUsageLogId) {
          await updateVeoUsageLog(
            supabase,
            veoUsageLogId,
            'failed',
            grsaiResponse.failure_reason || grsaiResponse.error || 'Unknown error'
          )
          
          // Veo Pro: Auto-refund on failure
          if (model === 'veo-pro' && consumptionId) {
            await refundCredits(supabase, userProfile.id, consumptionId)
          }
        } else {
          // Other models: Refund credits on failure
          if (consumptionId) {
            await refundCredits(supabase, userProfile.id, consumptionId)
          }
        }
        
        // Log generation failure for risk control
        const requiredCredits = getCreditsForModel(model)
        await logGeneration(
          supabase,
          userProfile.id,
          model,
          requiredCredits,
          false,
          clientIp,
          userAgent,
          videoTask.id
        )
        
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

        return jsonResponse({
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
      return jsonResponse({
        success: true,
        status: 'processing',
        task_id: videoTask.id, // Return our internal task ID
        grsai_task_id: taskId, // Also return grsai task ID
        message: 'Video generation in progress, please wait...',
      })
    }

    // If using webhook, return task ID
    return jsonResponse({
      success: true,
      status: 'processing',
      task_id: videoTask.id, // Return our internal task ID
      grsai_task_id: taskId, // Also return grsai task ID
      message: 'Video generation in progress, result will be notified via webhook...',
    })
  } catch (error) {
    console.error('Failed to generate video:', error)
    
    if (error instanceof z.ZodError) {
      return jsonResponse(
        { error: 'Parameter validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return jsonResponse(
      { error: 'Failed to generate video', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}


