/**
 * Admin: 转化 Gate 判定 + 转化健康仪表盘
 * 价格不是用来“救转化”的，是用来“放大稳定转化”的。
 */
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { validateAdminSession } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type GateStatus = 'LOCKDOWN' | 'OBSERVE' | 'GREEN'

interface GateMetrics {
  dailyPaidUsers: number
  consecutiveNoPayDays: number
  paymentFailureRate: number
  taskSuccessToUpgradeRatioPct: number
  upgradeClickToPayStartPct: number | null
  payStartToSuccessPct: number | null
  refundRatePct: number
}

/** 仪表盘 4 块：流量质量 → 使用成功 → 转化意愿 → 支付完成 */
interface DashboardBlock {
  name: string
  fields: Array<{ key: string; label: string; definition: string; healthyRef: string; value: string | number | null }>
}

/** 一眼判断状态灯：task_success + success_to_upgrade + pay_start_to_success */
function computeDashboardStatus(
  taskSuccessRate: number | null,
  successToUpgradeClick: number | null,
  payStartToSuccess: number | null
): GateStatus {
  if (
    (taskSuccessRate != null && taskSuccessRate < 0.7) ||
    (successToUpgradeClick != null && successToUpgradeClick < 0.05)
  ) {
    return 'LOCKDOWN'
  }
  if (payStartToSuccess != null && payStartToSuccess < 0.8) {
    return 'OBSERVE'
  }
  return 'GREEN'
}

export async function GET() {
  try {
    const adminUser = await validateAdminSession()
    if (!adminUser) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const supabase = await createServiceClient()

    // 优先用 Supabase RPC（7 日视图），无数据或未迁移时回退到实时计算
    let dashboardStatusRpc: GateStatus | null = null
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: rpcData, error: rpcError } = await (supabase as any).rpc('rpc_conversion_gate')
      if (!rpcError && (rpcData === 'LOCKDOWN' || rpcData === 'OBSERVE' || rpcData === 'GREEN')) {
        dashboardStatusRpc = rpcData
      }
    } catch {
      // RPC 或 view 不存在时忽略
    }

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 3600 * 1000).toISOString()

    // 今日自然付费用户数（recharge_records completed，今日）
    const { data: todayRecharges } = await supabase
      .from('recharge_records')
      .select('user_id')
      .eq('status', 'completed')
      .gte('created_at', todayStart)

    const dailyPaidUsers = todayRecharges
      ? new Set((todayRecharges as { user_id: string }[]).map((r) => r.user_id)).size
      : 0

    // 最近 7 天每日付费用户（用于连续无付费天数）
    const { data: lastRecharges } = await supabase
      .from('recharge_records')
      .select('created_at, user_id')
      .eq('status', 'completed')
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: false })

    let consecutiveNoPayDays = 7
    if (lastRecharges && (lastRecharges as { created_at: string }[]).length > 0) {
      const lastPayDate = (lastRecharges[0] as { created_at: string }).created_at.slice(0, 10)
      const lastPayTime = new Date(lastPayDate).getTime()
      const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
      consecutiveNoPayDays = Math.floor((todayDate - lastPayTime) / (24 * 3600 * 1000))
      if (consecutiveNoPayDays < 0) consecutiveNoPayDays = 0
    }

    // 支付失败率：最近 30 天内 failed / (completed + failed)
    const { data: recentByStatus } = await supabase
      .from('recharge_records')
      .select('status')
      .gte('created_at', thirtyDaysAgo)
      .in('status', ['completed', 'failed'])

    let completedCount = 0
    let failedCount = 0
    if (recentByStatus) {
      ;(recentByStatus as { status: string }[]).forEach((r) => {
        if (r.status === 'completed') completedCount++
        else if (r.status === 'failed') failedCount++
      })
    }
    const totalAttempts = completedCount + failedCount
    const paymentFailureRate = totalAttempts > 0 ? failedCount / totalAttempts : 0

    // events：用于仪表盘 4 块 + 一眼判断状态灯
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: eventsRows } = await (supabase as any)
      .from('events')
      .select('name, created_at')
      .gte('created_at', thirtyDaysAgo)
      .in('name', [
        'video_page_enter',
        'click_generate',
        'generation_started',
        'generation_success',
        'generation_failed',
        'click_upgrade',
        'view_result_10s',
      ])

    let videoPageEnterCount = 0
    let clickGenerateCount = 0
    let generationStartedCount = 0
    let generationSuccessCount = 0
    let clickUpgradeCount = 0
    let viewResult10sCount = 0
    if (eventsRows) {
      ;(eventsRows as { name: string }[]).forEach((r) => {
        if (r.name === 'video_page_enter') videoPageEnterCount++
        if (r.name === 'click_generate') clickGenerateCount++
        if (r.name === 'generation_started') generationStartedCount++
        if (r.name === 'generation_success') generationSuccessCount++
        if (r.name === 'click_upgrade') clickUpgradeCount++
        if (r.name === 'view_result_10s') viewResult10sCount++
      })
    }
    const taskSuccessToUpgradeRatioPct =
      generationSuccessCount > 0 ? (clickUpgradeCount / generationSuccessCount) * 100 : 0

    // 仪表盘比率（0..1 用于 statusLight）
    const submitTaskRate =
      clickGenerateCount > 0 ? generationStartedCount / clickGenerateCount : null
    const taskSuccessRate =
      generationStartedCount > 0 ? generationSuccessCount / generationStartedCount : null
    const successToUpgradeClick =
      generationSuccessCount > 0 ? clickUpgradeCount / generationSuccessCount : null
    const payStartToSuccessRatio = totalAttempts > 0 ? completedCount / totalAttempts : null
    const upgradeToPayStartRatio =
      clickUpgradeCount > 0 ? Math.min(1, completedCount / clickUpgradeCount) : null
    const timeOnResultRate =
      generationSuccessCount > 0 ? viewResult10sCount / generationSuccessCount : null

    // upgrade_click → pay_start：无 pay_start 事件时用 click_upgrade 与 completed 比例近似
    const upgradeClickToPayStartPct =
      clickUpgradeCount > 0 && completedCount >= 0
        ? Math.min(100, (completedCount / Math.max(1, clickUpgradeCount)) * 100)
        : null

    // pay_start → pay_success：用 completed / (completed + failed) 近似
    const payStartToSuccessPct = totalAttempts > 0 ? (completedCount / totalAttempts) * 100 : null

    // 退款率：refunded / completed（30 天内）
    const { data: refundedRows } = await supabase
      .from('recharge_records')
      .select('id')
      .eq('status', 'refunded')
      .gte('created_at', thirtyDaysAgo)
    const refundedCount = refundedRows?.length ?? 0
    const refundRatePct =
      completedCount > 0 ? (refundedCount / (completedCount + refundedCount)) * 100 : 0

    const metrics: GateMetrics = {
      dailyPaidUsers,
      consecutiveNoPayDays,
      paymentFailureRate,
      taskSuccessToUpgradeRatioPct,
      upgradeClickToPayStartPct,
      payStartToSuccessPct,
      refundRatePct,
    }

    // 判定 Gate（与文档伪代码一致）
    let gate: GateStatus = 'LOCKDOWN'
    if (
      dailyPaidUsers < 3 ||
      consecutiveNoPayDays >= 7 ||
      paymentFailureRate > 0.2 ||
      taskSuccessToUpgradeRatioPct < 5
    ) {
      gate = 'LOCKDOWN'
    } else if (
      dailyPaidUsers >= 3 &&
      (upgradeClickToPayStartPct === null || upgradeClickToPayStartPct >= 30) &&
      paymentFailureRate < 0.15
    ) {
      gate = 'OBSERVE'
    } else if (
      dailyPaidUsers >= 10 &&
      (payStartToSuccessPct === null || payStartToSuccessPct >= 85) &&
      refundRatePct < 3
    ) {
      gate = 'GREEN'
    }

    const rules = {
      LOCKDOWN: '日付费用户 < 3 或 连续 7 天无自然付费 或 支付失败率 > 20% 或 task_success→upgrade_click < 5% → 不允许任何价格/档位调整',
      OBSERVE: '连续 ≥3 天每日 ≥3–5 个自然付费、upgrade_click→pay_start ≥30%、支付失败率 < 15% → 允许调文案/推荐档位置，仍不许改价',
      GREEN: '连续 ≥7 天每日 ≥10 个自然付费、pay_start→pay_success ≥85%、退款率 < 3% → 才允许 A/B 档位、调价、大包',
    }

    // 一眼判断状态灯：RPC（7 日视图）优先，否则用实时计算
    const dashboardStatus =
      dashboardStatusRpc ??
      computeDashboardStatus(
        taskSuccessRate,
        successToUpgradeClick,
        payStartToSuccessRatio
      )

    // 转化健康仪表盘 4 块
    const dashboard: DashboardBlock[] = [
      {
        name: '流量质量',
        fields: [
          {
            key: 'new_users',
            label: 'new_users',
            definition: '新注册/进入 video 页用户数（近似）',
            healthyRef: '上升即可',
            value: videoPageEnterCount,
          },
          {
            key: 'avg_session_time',
            label: 'avg_session_time',
            definition: '新用户平均停留',
            healthyRef: '≥ 40s',
            value: null,
          },
          {
            key: 'bounce_after_landing',
            label: 'bounce_after_landing',
            definition: '首屏即走',
            healthyRef: '≤ 60%',
            value: null,
          },
          {
            key: 'first_page_type',
            label: 'first_page_type',
            definition: '首次访问页分布',
            healthyRef: 'keywords/use-cases 为主',
            value: null,
          },
        ],
      },
      {
        name: '使用成功',
        fields: [
          {
            key: 'submit_task_rate',
            label: 'submit_task_rate',
            definition: 'click_generate → submit',
            healthyRef: '≥ 40%',
            value:
              submitTaskRate != null ? `${(submitTaskRate * 100).toFixed(1)}%` : null,
          },
          {
            key: 'task_success_rate',
            label: 'task_success_rate',
            definition: 'submit → success',
            healthyRef: '≥ 70%',
            value:
              taskSuccessRate != null ? `${(taskSuccessRate * 100).toFixed(1)}%` : null,
          },
          {
            key: 'avg_time_to_success',
            label: 'avg_time_to_success',
            definition: '提交到成功',
            healthyRef: '越低越好',
            value: null,
          },
          {
            key: 'retry_rate',
            label: 'retry_rate',
            definition: '失败后 retry',
            healthyRef: '≥ 30%',
            value: null,
          },
        ],
      },
      {
        name: '转化意愿',
        fields: [
          {
            key: 'success_to_upgrade_click',
            label: 'success_to_upgrade_click',
            definition: '成功 → 点击 Upgrade',
            healthyRef: '≥ 10%',
            value:
              successToUpgradeClick != null
                ? `${(successToUpgradeClick * 100).toFixed(1)}%`
                : null,
          },
          {
            key: 'upgrade_hover_rate',
            label: 'upgrade_hover_rate',
            definition: 'hover Upgrade',
            healthyRef: '≥ 15%',
            value: null,
          },
          {
            key: 'time_on_result',
            label: 'time_on_result',
            definition: '成功页停留 ≥10s 比例',
            healthyRef: '≥ 20s 等价 view_result_10s',
            value:
              timeOnResultRate != null
                ? `${(timeOnResultRate * 100).toFixed(1)}%`
                : null,
          },
          {
            key: 'replay_rate',
            label: 'replay_rate',
            definition: '结果页回放 ≥2 次',
            healthyRef: '≥ 25%',
            value: null,
          },
        ],
      },
      {
        name: '支付完成',
        fields: [
          {
            key: 'upgrade_to_pay_start',
            label: 'upgrade_to_pay_start',
            definition: 'Upgrade → 打开支付页',
            healthyRef: '≥ 60%',
            value:
              upgradeToPayStartRatio != null
                ? `${(upgradeToPayStartRatio * 100).toFixed(1)}%`
                : null,
          },
          {
            key: 'pay_start_to_success',
            label: 'pay_start_to_success',
            definition: '支付页 → 成功',
            healthyRef: '≥ 80%',
            value:
              payStartToSuccessRatio != null
                ? `${(payStartToSuccessRatio * 100).toFixed(1)}%`
                : null,
          },
          {
            key: 'payment_failure_rate',
            label: 'payment_failure_rate',
            definition: '支付失败率',
            healthyRef: '≤ 15%',
            value: `${(paymentFailureRate * 100).toFixed(1)}%`,
          },
          {
            key: 'time_on_payment_page',
            label: 'time_on_payment_page',
            definition: '支付页停留',
            healthyRef: '≥ 10s',
            value: null,
          },
        ],
      },
    ]

    return NextResponse.json({
      success: true,
      gate,
      metrics,
      rules,
      dashboardStatus,
      dashboard,
    })
  } catch (e) {
    console.error('[conversion-gate]', e)
    return NextResponse.json(
      { error: 'conversion_gate_failed', message: e instanceof Error ? e.message : 'Unknown' },
      { status: 500 }
    )
  }
}
