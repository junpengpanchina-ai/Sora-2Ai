/**
 * Admin: 支付实验配置（first_payment_low_only）
 * GET 返回 enabled + config；PATCH 只更新 enabled（可配置开关）
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { validateAdminSession } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

const EXPERIMENT_KEY = 'first_payment_low_only'

interface PricingExperimentRow {
  key: string
  enabled: boolean
  config: Record<string, unknown>
  updated_at: string | null
}

export async function GET() {
  try {
    const adminUser = await validateAdminSession()
    if (!adminUser) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const supabase = await createServiceClient()
    // pricing_experiments 表在迁移中创建，可能不在 generated types 中
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: raw, error } = await (supabase as any)
      .from('pricing_experiments')
      .select('key, enabled, config, updated_at')
      .eq('key', EXPERIMENT_KEY)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          key: EXPERIMENT_KEY,
          enabled: false,
          config: { ratio: 0.5, buckets: ['control', 'low_only'] },
          updated_at: null,
        })
      }
      throw error
    }

    const data = raw as PricingExperimentRow | null
    return NextResponse.json({
      key: data?.key ?? EXPERIMENT_KEY,
      enabled: Boolean(data?.enabled),
      config: data?.config ?? { ratio: 0.5, buckets: ['control', 'low_only'] },
      updated_at: data?.updated_at ?? null,
    })
  } catch (e) {
    console.error('[pricing-experiment GET]', e)
    return NextResponse.json(
      { error: 'pricing_experiment_failed', message: e instanceof Error ? e.message : 'Unknown' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const adminUser = await validateAdminSession()
    if (!adminUser) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const enabled = Boolean(body.enabled)

    const supabase = await createServiceClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any
    const { data: raw, error } = await sb
      .from('pricing_experiments')
      .update({ enabled, updated_at: new Date().toISOString() })
      .eq('key', EXPERIMENT_KEY)
      .select('key, enabled, config, updated_at')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        await sb.from('pricing_experiments').insert({
          key: EXPERIMENT_KEY,
          enabled,
          config: { ratio: 0.5, buckets: ['control', 'low_only'] },
        })
        return NextResponse.json({
          key: EXPERIMENT_KEY,
          enabled,
          config: { ratio: 0.5, buckets: ['control', 'low_only'] },
          updated_at: new Date().toISOString(),
        })
      }
      throw error
    }

    const data = raw as PricingExperimentRow | null
    return NextResponse.json({
      key: data?.key ?? EXPERIMENT_KEY,
      enabled: Boolean(data?.enabled),
      config: data?.config ?? {},
      updated_at: data?.updated_at ?? null,
    })
  } catch (e) {
    console.error('[pricing-experiment PATCH]', e)
    return NextResponse.json(
      { error: 'pricing_experiment_failed', message: e instanceof Error ? e.message : 'Unknown' },
      { status: 500 }
    )
  }
}
