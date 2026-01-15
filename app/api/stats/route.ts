// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { getOrCreateUser } from '@/lib/user'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 30 // Set max duration to 30 seconds

export async function GET(request: NextRequest) {
  try {
    // Add timeout protection
    const timeoutPromise = new Promise<NextResponse>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Request timeout'))
      }, 25000) // 25 seconds timeout
    })

    const statsPromise = (async () => {
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

      // Get all task statistics with timeout protection
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

      // Get recent tasks (max 5) - don't fail if this query fails
      let recentTasks = []
      try {
        const { data } = await supabase
          .from('video_tasks')
          .select('id, prompt, status, created_at, video_url')
          .eq('user_id', userProfile.id)
          .order('created_at', { ascending: false })
          .limit(5)
        recentTasks = data || []
      } catch (recentTasksError) {
        console.warn('Failed to fetch recent tasks (non-critical):', recentTasksError)
        // Continue without recent tasks
      }

      // Get credits from wallet system (new system) instead of old users.credits field
      let credits = 0
      try {
        const { data: creditsData, error: creditsError } = await supabase
          .rpc('get_total_available_credits', { user_uuid: userProfile.id })
        
        if (!creditsError && creditsData !== null) {
          credits = creditsData || 0
        } else {
          // Fallback to old field if RPC fails (for backward compatibility during migration)
          console.warn('Failed to get credits from wallet, falling back to old field:', creditsError)
          credits = userProfile?.credits || 0
        }
      } catch (error) {
        console.warn('Error getting credits from wallet, falling back to old field:', error)
        credits = userProfile?.credits || 0
      }

      return NextResponse.json({
        success: true,
        stats: {
          total,
          succeeded,
          processing,
          failed,
        },
        recentTasks,
        credits,
      })
    })()

    // Race between timeout and actual request
    return await Promise.race([statsPromise, timeoutPromise])
  } catch (error) {
    console.error('Failed to fetch statistics:', error)
    
    // Handle timeout specifically
    if (error instanceof Error && error.message === 'Request timeout') {
      return NextResponse.json(
        { error: 'Request timeout', details: 'The request took too long to complete. Please try again.' },
        { status: 504 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch statistics', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

