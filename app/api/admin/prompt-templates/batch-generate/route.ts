import { NextResponse } from 'next/server'
import { validateAdminSession } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Strategy = {
  primary: string
  secondary: string
  fallback: string
}

type PromptGenerationTaskInsert = {
  requested_by_admin_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  industries: string[]
  scenes: string[]
  scene_ids: string[]
  per_cell_count: number
  locale: string
  primary_model: string
  secondary_model: string
  fallback_model: string
  owner_scope: string
  model_id: string
  role: string
  max_total_prompts: number
  max_retries_per_cell: number
  total_planned: number
  progress: number
  preset_id?: string | null
  initial_status?: 'draft' | 'active' | 'deprecated'
  initial_is_published?: boolean
  initial_weight?: number
  initial_rollout_pct?: number
}

type InsertIdResult = {
  data: { id: string } | null
  error: { message?: string } | null
}

type SupabaseInsertIdClient = {
  from: (table: 'prompt_generation_tasks') => {
    insert: (row: PromptGenerationTaskInsert) => {
      select: (columns: 'id') => {
        single: () => Promise<InsertIdResult>
      }
    }
  }
}

function asStringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || value.some((v) => typeof v !== 'string' || v.trim().length === 0)) {
    throw new Error(`${field} must be a non-empty string[]`)
  }
  return value.map((s) => s.trim())
}

function asUuidArray(value: unknown): string[] | null {
  if (value == null) return null
  if (!Array.isArray(value) || value.some((v) => typeof v !== 'string' || v.trim().length === 0)) {
    throw new Error(`sceneIds must be a string[]`)
  }
  return value.map((s) => s.trim())
}

function getSiteUrl() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL
  if (siteUrl) return siteUrl
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}

export async function POST(request: Request) {
  try {
    const adminUser = await validateAdminSession()
    if (!adminUser) {
      return NextResponse.json({ error: '未授权，请先登录' }, { status: 401 })
    }

    const payload = await request.json().catch(() => null)
    if (!payload || typeof payload !== 'object') {
      return NextResponse.json({ error: '请求体格式不正确' }, { status: 400 })
    }

    const p = payload as Record<string, unknown>

    const industries = asStringArray(p.industries, 'industries')
    const scenes = asStringArray(p.scenes, 'scenes')
    const sceneIds = asUuidArray(p.sceneIds)

    const perCellCount = Math.max(Number(p.perCellCount ?? 10), 1)
    const maxTotalPrompts = Math.max(Number(p.maxTotalPrompts ?? 1200), 1)
    const maxRetriesPerCell = Math.max(Number(p.maxRetriesPerCell ?? 2), 1)

    const ownerScope = String(p.ownerScope ?? 'scene')
    const modelId = String(p.modelId ?? 'sora')
    const role = String(p.role ?? 'default')
    const locale = String(p.locale ?? 'en')
    const presetId = typeof p.presetId === 'string' && p.presetId.trim().length > 0 ? p.presetId.trim() : null

    const initialStatusRaw = typeof p.initialStatus === 'string' ? p.initialStatus.trim() : ''
    const initialStatus =
      initialStatusRaw === 'active' || initialStatusRaw === 'deprecated' || initialStatusRaw === 'draft'
        ? (initialStatusRaw as 'draft' | 'active' | 'deprecated')
        : undefined
    const initialIsPublished = typeof p.initialIsPublished === 'boolean' ? p.initialIsPublished : undefined
    const initialWeight = typeof p.initialWeight === 'number' ? Math.max(0, Math.min(1000, p.initialWeight)) : undefined
    const initialRolloutPct =
      typeof p.initialRolloutPct === 'number' ? Math.max(0, Math.min(100, p.initialRolloutPct)) : undefined

    const strategyInput =
      p.strategy && typeof p.strategy === 'object' && p.strategy !== null ? (p.strategy as Partial<Strategy>) : undefined
    const strategy: Strategy = {
      primary: strategyInput?.primary ?? 'gemini-2.5-flash',
      secondary: strategyInput?.secondary ?? 'gemini-3-flash',
      fallback: strategyInput?.fallback ?? 'gemini-3-pro',
    }

    const totalCells = industries.length * scenes.length
    const totalPlanned = totalCells * perCellCount
    if (totalPlanned > maxTotalPrompts) {
      return NextResponse.json(
        { error: `计划生成 ${totalPlanned} 条，超过上限 ${maxTotalPrompts}` },
        { status: 400 }
      )
    }

    const supabase = await createServiceClient()
    const sb = supabase as unknown as SupabaseInsertIdClient

    const { data, error } = await sb
      .from('prompt_generation_tasks')
      .insert({
        requested_by_admin_id: adminUser.id,
        status: 'pending',
        industries,
        scenes,
        scene_ids: sceneIds ?? [],
        per_cell_count: perCellCount,
        locale,
        primary_model: strategy.primary,
        secondary_model: strategy.secondary,
        fallback_model: strategy.fallback,
        owner_scope: ownerScope,
        model_id: modelId,
        role,
        max_total_prompts: maxTotalPrompts,
        max_retries_per_cell: maxRetriesPerCell,
        total_planned: totalPlanned,
        progress: 0,
        preset_id: presetId ?? undefined,
        initial_status: initialStatus,
        initial_is_published: initialIsPublished,
        initial_weight: initialWeight,
        initial_rollout_pct: initialRolloutPct,
      })
      .select('id')
      .single()

    if (error || !data) {
      throw error ?? new Error('创建任务失败')
    }

    const taskId = data.id as string

    // fire-and-forget chain start
    const processUrl = `${getSiteUrl()}/api/admin/prompt-templates/batch-generate/process`
    const internalToken =
      typeof process.env.PROMPT_GEN_INTERNAL_TOKEN === 'string' && process.env.PROMPT_GEN_INTERNAL_TOKEN.trim().length > 0
        ? process.env.PROMPT_GEN_INTERNAL_TOKEN.trim()
        : null
    fetch(processUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(internalToken ? { 'x-internal-token': internalToken } : {}),
      },
      body: JSON.stringify({ taskId }),
    }).catch((err) => {
      console.error('[prompt batch-generate] trigger process failed:', err)
    })

    return NextResponse.json({ success: true, taskId, planned: totalPlanned })
  } catch (error) {
    console.error('[admin/prompt-templates/batch-generate] POST failed:', error)
    return NextResponse.json(
      { error: '创建批量生成任务失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}

