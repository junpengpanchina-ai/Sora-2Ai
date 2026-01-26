import { NextResponse } from 'next/server'
import { validateAdminSession } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: Request) {
  try {
    const adminUser = await validateAdminSession()
    if (!adminUser) return NextResponse.json({ ok: false, error: '未授权，请先登录' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const sceneId = searchParams.get('sceneId')?.trim() || ''
    if (!sceneId) return NextResponse.json({ ok: false, error: 'Missing sceneId' }, { status: 400 })

    const supabase = await createServiceClient()

    // Scene gate: compute only (no writeback, no snapshots)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc('rpc_gate_prompts', {
      p_window_days: 7,
      p_writeback: false,
      p_scene_id: sceneId,
    })
    if (error) throw error

    const rows = Array.isArray(data) ? (data as Array<{ gate_status?: string | null }>) : []
    const total = rows.length
    const green = rows.filter((r) => r.gate_status === 'green').length
    const yellow = rows.filter((r) => r.gate_status === 'yellow').length
    const red = rows.filter((r) => r.gate_status === 'red').length

    return NextResponse.json({
      ok: true,
      ran_at: new Date().toISOString(),
      scene_id: sceneId,
      summary: { total, green, yellow, red },
    })
  } catch (e) {
    console.error('[admin/prompts/force-gate-scene] failed:', e)
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'unknown error' }, { status: 500 })
  }
}

