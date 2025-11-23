// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { getOrCreateUser } from '@/lib/user'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Verify user authentication
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

    // Get or create user information
    const userProfile = await getOrCreateUser(supabase, user)

    if (!userProfile) {
      return NextResponse.json(
        { error: 'User profile not found or failed to create user' },
        { status: 404 }
      )
    }

    // Get all task statistics
    const { data: allTasks, error: allTasksError } = await supabase
      .from('video_tasks')
      .select('status')
      .eq('user_id', userProfile.id)

    if (allTasksError) {
      console.error('Failed to fetch task statistics:', allTasksError)
      return NextResponse.json(
        { error: 'Failed to fetch statistics', details: allTasksError.message },
        { status: 500 }
      )
    }

    // Calculate statistics
    const total = allTasks?.length || 0
    const succeeded = allTasks?.filter(t => t.status === 'succeeded').length || 0
    const processing = allTasks?.filter(t => t.status === 'processing' || t.status === 'pending').length || 0
    const failed = allTasks?.filter(t => t.status === 'failed').length || 0

    // Get recent tasks (max 5)
    const { data: recentTasks } = await supabase
      .from('video_tasks')
      .select('id, prompt, status, created_at, video_url')
      .eq('user_id', userProfile.id)
      .order('created_at', { ascending: false })
      .limit(5)

    return NextResponse.json({
      success: true,
      stats: {
        total,
        succeeded,
        processing,
        failed,
      },
      recentTasks: recentTasks || [],
      credits: userProfile?.credits || 0,
    })
  } catch (error) {
    console.error('Failed to fetch statistics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statistics', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

