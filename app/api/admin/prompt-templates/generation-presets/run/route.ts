import { NextResponse } from 'next/server'
import { validateAdminSession } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function getSiteUrl() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL
  if (siteUrl) return siteUrl
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}

function getInternalToken() {
  const token = process.env.PROMPT_GEN_INTERNAL_TOKEN
  return typeof token === 'string' && token.trim().length > 0 ? token.trim() : null
}

type PresetConfig = {
  scenes: string[]
  industries: string[]
  generation_plan: { baseline_per_cell: number; variant_per_cell: number }
  model_strategy: { baseline: string; variant: string; fallback: string }
  locale: string
  owner_scope: 'global' | 'scene'
  model_id: string
  baseline_role: string
  variant_role: string
  hard_limits: { max_total_prompts: number; max_active_prompts: number }
  initial_status: { status: 'draft' | 'active' | 'deprecated'; is_published: boolean; rollout_pct: number; weight: number }
}

export async function POST(request: Request) {
  try {
    const adminUser = await validateAdminSession()
    if (!adminUser) return NextResponse.json({ error: '未授权，请先登录' }, { status: 401 })

    const body = await request.json().catch(() => null)
    const presetId = typeof body?.presetId === 'string' ? body.presetId.trim() : ''
    if (!presetId) return NextResponse.json({ error: '缺少 presetId' }, { status: 400 })

    const supabase = await createServiceClient()

    // load preset
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: preset, error: presetErr } = await (supabase as any)
      .from('prompt_generation_presets')
      .select('preset_id,enabled,config')
      .eq('preset_id', presetId)
      .single()
    if (presetErr || !preset) {
      return NextResponse.json({ error: 'Preset 不存在' }, { status: 404 })
    }
    if (preset.enabled === false) {
      return NextResponse.json({ error: 'Preset 已禁用' }, { status: 400 })
    }

    const cfg = preset.config as PresetConfig
    if (!cfg || !Array.isArray(cfg.scenes) || !Array.isArray(cfg.industries)) {
      return NextResponse.json({ error: 'Preset 配置不合法' }, { status: 400 })
    }

    // hard stop: MAX_ACTIVE_PROMPTS
    const maxActive = Number(cfg?.hard_limits?.max_active_prompts ?? 500)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count: activeCount, error: countErr } = await (supabase as any)
      .from('prompt_templates')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
    if (countErr) throw countErr
    if (typeof activeCount === 'number' && activeCount >= maxActive) {
      return NextResponse.json({ error: `已达上限：active prompts=${activeCount} ≥ ${maxActive}，请先清理 RED/低价值` }, { status: 400 })
    }

    const totalCells = cfg.industries.length * cfg.scenes.length
    const baselinePlanned = totalCells * Math.max(1, Number(cfg.generation_plan?.baseline_per_cell ?? 2))
    const variantPlanned = totalCells * Math.max(1, Number(cfg.generation_plan?.variant_per_cell ?? 2))
    const totalPlanned = baselinePlanned + variantPlanned
    const maxTotal = Number(cfg?.hard_limits?.max_total_prompts ?? 300)
    if (totalPlanned > maxTotal) {
      return NextResponse.json({ error: `计划生成 ${totalPlanned} 条，超过上限 ${maxTotal}` }, { status: 400 })
    }

    const initial = cfg.initial_status ?? { status: 'draft', is_published: false, rollout_pct: 100, weight: 100 }

    const rows = [
      {
        requested_by_admin_id: adminUser.id,
        status: 'pending',
        industries: cfg.industries,
        scenes: cfg.scenes,
        scene_ids: [],
        per_cell_count: Math.max(1, Number(cfg.generation_plan?.baseline_per_cell ?? 2)),
        locale: cfg.locale || 'en',
        primary_model: cfg.model_strategy?.baseline ?? 'gemini-2.5-flash',
        secondary_model: cfg.model_strategy?.variant ?? 'gemini-3-flash',
        fallback_model: cfg.model_strategy?.fallback ?? 'gemini-3-pro',
        owner_scope: cfg.owner_scope || 'global',
        model_id: cfg.model_id || 'sora',
        role: cfg.baseline_role || 'default',
        max_total_prompts: maxTotal,
        max_retries_per_cell: 2,
        total_planned: baselinePlanned,
        progress: 0,
        preset_id: presetId,
        initial_status: initial.status,
        initial_is_published: initial.is_published,
        initial_weight: initial.weight,
        initial_rollout_pct: initial.rollout_pct,
      },
      {
        requested_by_admin_id: adminUser.id,
        status: 'pending',
        industries: cfg.industries,
        scenes: cfg.scenes,
        scene_ids: [],
        per_cell_count: Math.max(1, Number(cfg.generation_plan?.variant_per_cell ?? 2)),
        locale: cfg.locale || 'en',
        primary_model: cfg.model_strategy?.variant ?? 'gemini-3-flash',
        secondary_model: cfg.model_strategy?.baseline ?? 'gemini-2.5-flash',
        fallback_model: cfg.model_strategy?.fallback ?? 'gemini-3-pro',
        owner_scope: cfg.owner_scope || 'global',
        model_id: cfg.model_id || 'sora',
        role: cfg.variant_role || 'high_quality',
        max_total_prompts: maxTotal,
        max_retries_per_cell: 2,
        total_planned: variantPlanned,
        progress: 0,
        preset_id: presetId,
        initial_status: initial.status,
        initial_is_published: initial.is_published,
        initial_weight: initial.weight,
        initial_rollout_pct: initial.rollout_pct,
      },
    ]

    // insert both tasks
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: inserted, error: insertErr } = await (supabase as any)
      .from('prompt_generation_tasks')
      .insert(rows)
      .select('id')
    if (insertErr) throw insertErr
    const taskIds: string[] = Array.isArray(inserted)
      ? inserted.map((r: unknown) => String((r as { id: string }).id))
      : []

    // trigger chain start (fire-and-forget)
    const token = getInternalToken()
    const processUrl = `${getSiteUrl()}/api/admin/prompt-templates/batch-generate/process`
    for (const taskId of taskIds) {
      fetch(processUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'x-internal-token': token } : {}),
        },
        body: JSON.stringify({ taskId }),
      }).catch((err) => console.error('[preset run] trigger process failed', { taskId, err }))
    }

    return NextResponse.json({ success: true, presetId, taskIds, planned: totalPlanned })
  } catch (e) {
    console.error('[admin/prompt-templates/generation-presets/run] failed:', e)
    return NextResponse.json({ error: '运行 preset 失败', details: e instanceof Error ? e.message : 'unknown' }, { status: 500 })
  }
}

