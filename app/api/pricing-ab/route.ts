/**
 * 支付页「低档 only」A/B 分流
 * 优先用 Supabase：rpc_conversion_gate + pricing_experiments.enabled + rpc_pricing_bucket
 * 未迁移或实验关闭时回退到硬编码 50/50。
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { cookies } from 'next/headers'

type GateStatus = 'LOCKDOWN' | 'OBSERVE' | 'GREEN'

export const dynamic = 'force-dynamic'

const COOKIE_NAME = 'pricing_ab'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const fromVideo = searchParams.get('from') === 'video'

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ bucket: 'A', gate: 'LOCKDOWN', inExperiment: false })
    }

    const cookieStore = await cookies()
    const existing = cookieStore.get(COOKIE_NAME)?.value
    if (existing === 'A' || existing === 'B') {
      const service = await createServiceClient()
      const gate = await getGateStatus(service)
      return NextResponse.json({
        bucket: existing,
        gate,
        inExperiment: false,
      })
    }

    const service = await createServiceClient()
    const { count: completedCount } = await service
      .from('recharge_records')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'completed')

    const isFirstPaymentAttempt = (completedCount ?? 0) === 0
    const gate = await getGateStatus(service)
    const inExperiment =
      fromVideo && isFirstPaymentAttempt && gate !== 'GREEN'

    if (!inExperiment) {
      return NextResponse.json({ bucket: 'A', gate, inExperiment: false })
    }

    // 优先用 RPC + pricing_experiments.enabled（表在迁移中，可能不在 generated types）
    let bucket: 'A' | 'B' = 'A'
    type ExperimentRow = { enabled?: boolean }
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: expRaw } = await (service as any)
        .from('pricing_experiments')
        .select('enabled')
        .eq('key', 'first_payment_low_only')
        .single()

      const exp: ExperimentRow | null = expRaw != null ? (expRaw as ExperimentRow) : null
      if (exp?.enabled) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: rpcBucket, error: rpcErr } = await (service as any).rpc('rpc_pricing_bucket', {
          p_user_id: user.id,
          p_is_first_payment: isFirstPaymentAttempt,
          p_is_first_success: fromVideo,
          p_gate: gate,
        })
        if (!rpcErr && (rpcBucket === 'control' || rpcBucket === 'low_only')) {
          bucket = rpcBucket === 'low_only' ? 'B' : 'A'
        }
      } else {
        bucket = Math.random() < 0.5 ? 'A' : 'B'
      }
    } catch {
      bucket = Math.random() < 0.5 ? 'A' : 'B'
    }

    const res = NextResponse.json({ bucket, gate, inExperiment: true })
    res.cookies.set(COOKIE_NAME, bucket, {
      path: '/',
      maxAge: COOKIE_MAX_AGE,
      sameSite: 'lax',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
    })
    return res
  } catch (e) {
    console.error('[pricing-ab]', e)
    return NextResponse.json({ bucket: 'A', gate: 'LOCKDOWN', inExperiment: false })
  }
}

async function getGateStatus(
  supabase: Awaited<ReturnType<typeof createServiceClient>>
): Promise<GateStatus> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rpcData, error: rpcError } = await (supabase as any).rpc('rpc_conversion_gate')
    if (!rpcError && (rpcData === 'LOCKDOWN' || rpcData === 'OBSERVE' || rpcData === 'GREEN')) {
      return rpcData
    }
  } catch {
    // RPC 不存在时回退到实时计算
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: eventsRows } = await (supabase as any)
    .from('events')
    .select('name')
    .gte('created_at', thirtyDaysAgo)
    .in('name', ['generation_started', 'generation_success', 'click_upgrade'])

  let started = 0
  let success = 0
  let upgrade = 0
  if (eventsRows) {
    eventsRows.forEach((r: { name: string }) => {
      if (r.name === 'generation_started') started++
      if (r.name === 'generation_success') success++
      if (r.name === 'click_upgrade') upgrade++
    })
  }

  const { data: rechargeRows } = await supabase
    .from('recharge_records')
    .select('status')
    .gte('created_at', thirtyDaysAgo)
    .in('status', ['completed', 'failed'])

  let completed = 0
  let failed = 0
  if (rechargeRows) {
    rechargeRows.forEach((r: { status: string }) => {
      if (r.status === 'completed') completed++
      else if (r.status === 'failed') failed++
    })
  }
  const totalPay = completed + failed
  const payStartToSuccess = totalPay > 0 ? completed / totalPay : null
  const taskSuccessRate = started > 0 ? success / started : null
  const successToUpgrade = success > 0 ? upgrade / success : null

  if (
    (taskSuccessRate != null && taskSuccessRate < 0.7) ||
    (successToUpgrade != null && successToUpgrade < 0.05)
  ) {
    return 'LOCKDOWN'
  }
  if (payStartToSuccess != null && payStartToSuccess < 0.8) {
    return 'OBSERVE'
  }
  return 'GREEN'
}
