import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const SHARE_UNLOCK_WINDOW_MINUTES = 10
const DEFAULT_DAILY_LIMIT = 3

/** Ownership: primary by video_tasks.user_id (A). Extend here for wallet/enterprise if needed. */
function isOwnedByUser(row: { user_id?: string }, userId: string) {
  return row?.user_id === userId
}

export async function POST(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const supabase = await createClient(request.headers)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized, please login first' }, { status: 401 })
    }

    const taskId = params.taskId
    if (!taskId) {
      return NextResponse.json({ error: 'Missing task id' }, { status: 400 })
    }

    const { data: task, error: taskError } = await supabase
      .from('video_tasks')
      .select('id, user_id, status, completed_at, remove_watermark, share_unlocked_at, share_unlocked_by, share_unlock_used, share_unlock_expires_at')
      .eq('id', taskId)
      .single()

    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const row = task as {
      id: string
      user_id: string
      status: string
      completed_at: string | null
      remove_watermark: boolean
      share_unlocked_at: string | null
      share_unlocked_by: string | null
      share_unlock_used: boolean | null
      share_unlock_expires_at: string | null
    }

    if (!isOwnedByUser(row, user.id)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    if (row.status !== 'succeeded') {
      return NextResponse.json({ error: 'Task is not completed' }, { status: 400 })
    }

    if (row.remove_watermark === true) {
      return NextResponse.json({
        unlocked: true,
        mode: 'paid',
        expiresAt: null,
      })
    }

    const now = new Date()
    const expiresAt = row.share_unlock_expires_at ? new Date(row.share_unlock_expires_at) : null
    const alreadyUnlockedAndValid =
      row.share_unlocked_at &&
      row.share_unlock_used !== true &&
      (expiresAt ? expiresAt.getTime() > now.getTime() : true)

    if (alreadyUnlockedAndValid) {
      return NextResponse.json({
        unlocked: true,
        mode: 'share',
        alreadyClaimed: true,
        expiresAt: row.share_unlock_expires_at ?? null,
      })
    }

    const completedAt = row.completed_at ? new Date(row.completed_at).getTime() : 0
    const windowMs = SHARE_UNLOCK_WINDOW_MINUTES * 60 * 1000
    if (completedAt && now.getTime() - completedAt > windowMs) {
      return NextResponse.json(
        { error: 'Share unlock expired (claim within 10 minutes of completion)' },
        { status: 410 }
      )
    }

    const dailyLimit = Number(process.env.SHARE_UNLOCK_DAILY_LIMIT ?? DEFAULT_DAILY_LIMIT)
    const platform = request.headers.get('x-share-platform') || null

    // RPC not in generated Database types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: limData, error: limError } = await (supabase as any).rpc('rpc_share_unlock_allow', {
      p_user_id: user.id,
      p_day: now.toISOString().slice(0, 10),
      p_limit: dailyLimit,
      p_task_id: taskId,
      p_platform: platform,
    })

    const limRow = Array.isArray(limData) ? limData[0] : limData
    if (limError || limRow == null) {
      console.error('[share-unlock] limiter error:', limError)
      return NextResponse.json({ error: 'Limiter error' }, { status: 500 })
    }

    const allowed = (limRow as { allowed?: boolean }).allowed
    const hits = (limRow as { hits?: number }).hits ?? 0

    if (!allowed) {
      return NextResponse.json(
        { error: 'Daily limit reached', dailyLimit, hits },
        { status: 429 }
      )
    }

    const exp = new Date(now.getTime() + windowMs)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from('video_tasks')
      .update({
        share_unlocked_at: now.toISOString(),
        share_unlocked_by: user.id,
        share_unlock_used: false,
        share_unlock_expires_at: exp.toISOString(),
      })
      .eq('id', taskId)

    if (updateError) {
      console.error('[share-unlock] update failed:', updateError)
      return NextResponse.json({ error: 'Failed to unlock' }, { status: 500 })
    }

    return NextResponse.json({
      unlocked: true,
      mode: 'share',
      expiresAt: exp.toISOString(),
      dailyLimit,
      hits,
    })
  } catch (e) {
    console.error('[share-unlock] error:', e)
    return NextResponse.json(
      { error: 'Failed to process share unlock' },
      { status: 500 }
    )
  }
}
