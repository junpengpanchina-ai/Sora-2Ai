/**
 * Admin: 写入 conversion_daily_metrics 当日/指定日（供 cron 或手动触发）
 * 从 events + recharge_records 聚合出日粒度指标，供 v_conversion_health_7d 与 rpc_conversion_gate 使用。
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { validateAdminSession } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const adminUser = await validateAdminSession()
    if (!adminUser) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const dayParam = body.day as string | undefined // YYYY-MM-DD
    const day = dayParam || new Date().toISOString().slice(0, 10)
    const dayStart = `${day}T00:00:00.000Z`
    const dayEnd = `${day}T23:59:59.999Z`

    const supabase = await createServiceClient()

    // events 当日（events 表可能不在 generated types 中）
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: eventsRows } = await (supabase as any)
      .from('events')
      .select('name')
      .gte('created_at', dayStart)
      .lte('created_at', dayEnd)
      .in('name', [
        'video_page_enter',
        'click_generate',
        'generation_started',
        'generation_success',
        'generation_failed',
        'click_upgrade',
        'view_result_10s',
      ])

    let videoPageEnter = 0
    let clickGenerate = 0
    let generationStarted = 0
    let generationSuccess = 0
    let clickUpgrade = 0
    let viewResult10s = 0
    if (eventsRows) {
      ;(eventsRows as { name: string }[]).forEach((r) => {
        if (r.name === 'video_page_enter') videoPageEnter++
        if (r.name === 'click_generate') clickGenerate++
        if (r.name === 'generation_started') generationStarted++
        if (r.name === 'generation_success') generationSuccess++
        if (r.name === 'click_upgrade') clickUpgrade++
        if (r.name === 'view_result_10s') viewResult10s++
      })
    }

    const submitTaskRate = clickGenerate > 0 ? generationStarted / clickGenerate : null
    const taskSuccessRate = generationStarted > 0 ? generationSuccess / generationStarted : null
    const successToUpgradeClick = generationSuccess > 0 ? clickUpgrade / generationSuccess : null
    const timeOnResultRate = generationSuccess > 0 ? viewResult10s / generationSuccess : null

    const { data: rechargeRows } = await supabase
      .from('recharge_records')
      .select('status')
      .gte('created_at', dayStart)
      .lte('created_at', dayEnd)
      .in('status', ['completed', 'failed'])

    let completed = 0
    let failed = 0
    if (rechargeRows) {
      ;(rechargeRows as { status: string }[]).forEach((r) => {
        if (r.status === 'completed') completed++
        else if (r.status === 'failed') failed++
      })
    }
    const totalPay = completed + failed
    const payStartToSuccess = totalPay > 0 ? completed / totalPay : null
    const paymentFailureRate = totalPay > 0 ? failed / totalPay : null
    const upgradeToPayStart = clickUpgrade > 0 ? Math.min(1, completed / clickUpgrade) : null

    const metricsRow = {
      day,
      new_users: videoPageEnter,
      avg_session_time_sec: null,
      bounce_after_landing_rate: null,
      submit_task_rate: submitTaskRate,
      task_success_rate: taskSuccessRate,
      avg_time_to_success_sec: null,
      retry_rate: null,
      success_to_upgrade_click: successToUpgradeClick,
      upgrade_hover_rate: null,
      time_on_result_sec: timeOnResultRate != null ? 10 : null,
      replay_rate: null,
      upgrade_to_pay_start: upgradeToPayStart,
      pay_start_to_success: payStartToSuccess,
      payment_failure_rate: paymentFailureRate,
    }

    // conversion_daily_metrics 表在迁移中创建，可能不在 generated types 中
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: upsertErr } = await (supabase as any)
      .from('conversion_daily_metrics')
      .upsert(metricsRow, { onConflict: 'day' })

    if (upsertErr) {
      throw upsertErr
    }

    return NextResponse.json({ success: true, day, row: metricsRow })
  } catch (e) {
    console.error('[conversion-daily]', e)
    return NextResponse.json(
      { error: 'conversion_daily_failed', message: e instanceof Error ? e.message : 'Unknown' },
      { status: 500 }
    )
  }
}
