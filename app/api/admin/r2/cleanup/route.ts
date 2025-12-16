// API endpoint to cleanup old videos from R2 storage
// This helps manage storage costs by removing old videos
import { createClient } from '@/lib/supabase/server'
import { deleteR2File } from '@/lib/r2/client'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
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

    // Check if user is admin (you can add your admin check logic here)
    // For now, we'll allow authenticated users to run cleanup

    // Parse request body for cleanup options
    const body = await request.json().catch(() => ({}))
    const {
      daysOld = 30, // Default: delete videos older than 30 days
      dryRun = false, // If true, only list files without deleting
      maxFiles = 100, // Maximum number of files to process
    } = body

    // Get old video tasks from database
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    const { data: oldTasks, error: tasksError } = await supabase
      .from('video_tasks')
      .select('id, video_url, completed_at, created_at')
      .eq('status', 'succeeded')
      .not('video_url', 'is', null)
      .like('video_url', '%r2.dev%') // Only R2 videos
      .lt('completed_at', cutoffDate.toISOString())
      .order('completed_at', { ascending: true })
      .limit(maxFiles)

    if (tasksError) {
      console.error('Failed to query old video tasks:', tasksError)
      return NextResponse.json(
        { error: 'Failed to query old video tasks', details: tasksError.message },
        { status: 500 }
      )
    }

    if (!oldTasks || oldTasks.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No old videos found to cleanup',
        deleted: 0,
        skipped: 0,
        errors: [],
      })
    }

    // Extract R2 keys from video URLs
    const videosToDelete: Array<{ taskId: string; key: string; url: string }> = []
    
    for (const task of oldTasks) {
      const taskWithUrl = task as { id: string; video_url: string | null; completed_at: string | null; created_at: string }
      const videoUrl = taskWithUrl.video_url
      if (!videoUrl || !videoUrl.includes('r2.dev')) continue
      
      // Extract key from URL: https://pub-xxx.r2.dev/videos/task-id.mp4
      const urlMatch = videoUrl.match(/r2\.dev\/(.+)$/)
      if (urlMatch && urlMatch[1]) {
        videosToDelete.push({
          taskId: taskWithUrl.id,
          key: urlMatch[1],
          url: videoUrl,
        })
      }
    }

    const deleted: string[] = []
    const skipped: string[] = []
    const errors: Array<{ taskId: string; error: string }> = []

    if (dryRun) {
      // Dry run: just list files without deleting
      return NextResponse.json({
        success: true,
        message: 'Dry run completed',
        dryRun: true,
        found: videosToDelete.length,
        files: videosToDelete.map(v => ({
          taskId: v.taskId,
          key: v.key,
          url: v.url,
        })),
        note: 'Set dryRun=false to actually delete these files',
      })
    }

    // Delete files from R2
    for (const video of videosToDelete) {
      try {
        await deleteR2File(video.key)
        deleted.push(video.taskId)
        
        // Optionally: Update database to remove video_url or mark as deleted
        // For now, we'll leave the database record but remove the file from R2
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        errors.push({ taskId: video.taskId, error: errorMessage })
        console.error(`Failed to delete video ${video.taskId}:`, errorMessage)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Cleanup completed: ${deleted.length} deleted, ${errors.length} errors`,
      deleted: deleted.length,
      skipped: skipped.length,
      errors: errors.length,
      details: {
        deleted,
        errors,
      },
    })
  } catch (error) {
    console.error('Failed to cleanup old videos:', error)
    return NextResponse.json(
      {
        error: 'Failed to cleanup old videos',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

