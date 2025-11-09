import { createClient } from '@/lib/supabase/server'
import { createSoraVideoTask } from '@/lib/grsai/client'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Request parameter validation schema
const generateVideoSchema = z.object({
  prompt: z.string().min(1, 'Prompt cannot be empty'),
  url: z.string().url().optional().or(z.literal('')),
  aspectRatio: z.enum(['9:16', '16:9']).optional().default('9:16'),
  duration: z.enum(['10', '15']).optional().default('10'),
  size: z.enum(['small', 'large']).optional().default('small'),
  useWebhook: z.boolean().optional().default(false),
})

export async function POST(request: NextRequest) {
  try {
    // Verify user authentication (only verify login, no database needed)
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

    // Parse request body
    const body = await request.json()
    const validatedData = generateVideoSchema.parse(body)

    // Build webhook URL (if using callback)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                    request.headers.get('origin') || 
                    'http://localhost:3000'
    const webhookUrl = validatedData.useWebhook 
      ? `${baseUrl}/api/video/callback`
      : '-1' // Use polling method

    // Call Grsai API
    const grsaiParams = {
      model: 'sora-2',
      prompt: validatedData.prompt,
      url: validatedData.url || undefined,
      aspectRatio: validatedData.aspectRatio,
      duration: parseInt(validatedData.duration) as 10 | 15,
      size: validatedData.size,
      webHook: webhookUrl,
      shutProgress: false,
    }

    const grsaiResponse = await createSoraVideoTask(grsaiParams)

    // Get task ID (for polling)
    let taskId: string | null = null
    if ('data' in grsaiResponse && grsaiResponse.data?.id) {
      // Using polling method, id returned
      taskId = grsaiResponse.data.id
    } else if ('id' in grsaiResponse) {
      // Streaming response or callback method, already has id
      taskId = grsaiResponse.id
    }

    // If using streaming response and completed, return result directly
    if (!validatedData.useWebhook && 'status' in grsaiResponse) {
      if (grsaiResponse.status === 'succeeded' && grsaiResponse.results?.[0]) {
        return NextResponse.json({
          success: true,
          status: 'succeeded',
          video_url: grsaiResponse.results[0].url,
          remove_watermark: grsaiResponse.results[0].removeWatermark,
          pid: grsaiResponse.results[0].pid,
          task_id: taskId,
        })
      } else if (grsaiResponse.status === 'failed') {
        return NextResponse.json({
          success: false,
          status: 'failed',
          error: grsaiResponse.error || grsaiResponse.failure_reason || 'Generation failed',
          task_id: taskId,
        }, { status: 500 })
      }
    }

    // If using polling method, return task ID for frontend polling
    if (taskId) {
      return NextResponse.json({
        success: true,
        status: 'processing',
        task_id: taskId,
        message: 'Video generation in progress, please wait...',
      })
    }

    // If using webhook, return task ID
    return NextResponse.json({
      success: true,
      status: 'processing',
      task_id: taskId,
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


