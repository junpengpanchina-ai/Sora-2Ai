import { NextResponse } from 'next/server'
import { validateAdminSession } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type GateSummary = {
  total: number
  green: number
  yellow: number
  red: number
  top: number
  inactive: number
  frozen: number
  killed: number
}

type GateChanged = {
  green: number
  yellow: number
  red: number
  top: number
  inactive: number
  frozen: number
  killed: number
}

type CountResult = {
  count: number | null
  error: { message: string } | null
}

async function count(promise: PromiseLike<CountResult>): Promise<number> {
  const { count: c, error } = await promise
  if (error) throw error
  return typeof c === 'number' ? c : 0
}

export async function POST() {
  try {
    const adminUser = await validateAdminSession()
    if (!adminUser) return NextResponse.json({ ok: false, error: '未授权，请先登录' }, { status: 401 })

    const supabase = await createServiceClient()
    const ranAt = new Date()
    const cooldownUntil = new Date(ranAt.getTime() + 60_000)

    // Cooldown: 60s (prevent accidental write amplification)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: latest, error: latestErr } = await (supabase as any)
      .from('prompt_templates')
      .select('last_gated_at')
      .order('last_gated_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (latestErr) throw latestErr
    const last = latest?.last_gated_at ? new Date(latest.last_gated_at).getTime() : 0
    if (last && Date.now() - last < 60_000) {
      return NextResponse.json(
        {
          ok: false,
          error: 'cooldown',
          message: 'Gate was run recently. Try again in a minute.',
          ran_at: ranAt.toISOString(),
          cooldown_until: cooldownUntil.toISOString(),
        },
        { status: 429 }
      )
    }

    // Pre stats (for "changed")
    const nowIsoPre = ranAt.toISOString()
    const pre = await Promise.all([
      count(supabase.from('prompt_templates').select('id', { count: 'exact', head: true }).eq('gate_status', 'green')),
      count(supabase.from('prompt_templates').select('id', { count: 'exact', head: true }).eq('gate_status', 'yellow')),
      count(supabase.from('prompt_templates').select('id', { count: 'exact', head: true }).eq('gate_status', 'red')),
      count(supabase.from('prompt_templates').select('id', { count: 'exact', head: true }).eq('top_prompt', true)),
      count(supabase.from('prompt_templates').select('id', { count: 'exact', head: true }).eq('is_active', false)),
      count(supabase.from('prompt_templates').select('id', { count: 'exact', head: true }).gt('freeze_until', nowIsoPre)),
      count(supabase.from('prompt_templates').select('id', { count: 'exact', head: true }).eq('is_active', false).not('kill_reason', 'is', null)),
    ])

    // 1) Gate (7d, writeback + snapshots)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: gateErr } = await (supabase as any).rpc('rpc_gate_prompts', {
      p_window_days: 7,
      p_writeback: true,
    })
    if (gateErr) throw gateErr

    // 2) Retention
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: retErr } = await (supabase as any).rpc('rpc_apply_prompt_retention', { p_freeze_days: 7 })
    if (retErr) throw retErr

    const nowIso = new Date().toISOString()

    // 3) Summary (count queries to avoid max_rows limits)
    const [total, green, yellow, red, top, inactive, frozen, killed] = await Promise.all([
      count(supabase.from('prompt_templates').select('id', { count: 'exact', head: true })),
      count(supabase.from('prompt_templates').select('id', { count: 'exact', head: true }).eq('gate_status', 'green')),
      count(supabase.from('prompt_templates').select('id', { count: 'exact', head: true }).eq('gate_status', 'yellow')),
      count(supabase.from('prompt_templates').select('id', { count: 'exact', head: true }).eq('gate_status', 'red')),
      count(supabase.from('prompt_templates').select('id', { count: 'exact', head: true }).eq('top_prompt', true)),
      count(supabase.from('prompt_templates').select('id', { count: 'exact', head: true }).eq('is_active', false)),
      count(supabase.from('prompt_templates').select('id', { count: 'exact', head: true }).gt('freeze_until', nowIso)),
      count(supabase.from('prompt_templates').select('id', { count: 'exact', head: true }).eq('is_active', false).not('kill_reason', 'is', null)),
    ])

    const summary: GateSummary = { total, green, yellow, red, top, inactive, frozen, killed }
    const changed: GateChanged = {
      green: green - pre[0],
      yellow: yellow - pre[1],
      red: red - pre[2],
      top: top - pre[3],
      inactive: inactive - pre[4],
      frozen: frozen - pre[5],
      killed: killed - pre[6],
    }

    return NextResponse.json({
      ok: true,
      ran_at: ranAt.toISOString(),
      cooldown_until: cooldownUntil.toISOString(),
      summary,
      changed,
    })
  } catch (e) {
    console.error('[admin/prompts/force-gate] failed:', e)
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'unknown error' },
      { status: 500 }
    )
  }
}

