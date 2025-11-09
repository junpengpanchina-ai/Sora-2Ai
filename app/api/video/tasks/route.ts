import { createClient } from '@/lib/supabase/server'
import { getOrCreateUser } from '@/lib/user'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Verify user authentication
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

    // Get or create user information
    const userProfile = await getOrCreateUser(supabase, user)

    if (!userProfile) {
      return NextResponse.json(
        { error: 'User profile not found or failed to create user' },
        { status: 404 }
      )
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') // Optional: filter by status
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabase
      .from('video_tasks')
      .select('*')
      .eq('user_id', userProfile.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // If status filter is specified
    if (status && ['pending', 'processing', 'succeeded', 'failed'].includes(status)) {
      query = query.eq('status', status)
    }

    const { data: tasks, error } = await query

    if (error) {
      console.error('Failed to fetch task list:', error)
      return NextResponse.json(
        { error: 'Failed to fetch task list', details: error.message },
        { status: 500 }
      )
    }

    // Format response data
    const formattedTasks = tasks?.map(task => ({
      id: task.id,
      grsai_task_id: task.grsai_task_id,
      model: task.model,
      prompt: task.prompt,
      reference_url: task.reference_url,
      aspect_ratio: task.aspect_ratio,
      duration: task.duration,
      size: task.size,
      status: task.status,
      progress: task.progress,
      video_url: task.video_url,
      remove_watermark: task.remove_watermark,
      pid: task.pid,
      failure_reason: task.failure_reason,
      error_message: task.error_message,
      created_at: task.created_at,
      updated_at: task.updated_at,
      completed_at: task.completed_at,
    })) || []

    return NextResponse.json({
      success: true,
      tasks: formattedTasks,
      pagination: {
        limit,
        offset,
        total: formattedTasks.length,
      },
    })
  } catch (error) {
    console.error('Failed to fetch task list:', error)
    return NextResponse.json(
      { error: 'Failed to fetch task list', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}


