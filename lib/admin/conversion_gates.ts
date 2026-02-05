/**
 * Admin Conversion Gates
 * 
 * 约定：Admin 每天/每次打开页面都会拉一个 `metrics7d`（最近 7 天滚动指标）
 * 返回：每个 Gate 的 `{ status, reasons, recommendedActions }`
 */

export type GateStatus = 'GREEN' | 'YELLOW' | 'RED' | 'LOCKDOWN'

export type ShareUnlockMetrics7d = {
  // 基础盘
  paid_without_share_rate: number // baseline paid conversion rate (no unlock users)
  share_unlock_to_paid_rate_48h: number // % of users who claimed unlock and paid within 48h
  download_nowm_via_share_ratio: number // share-based nowm downloads / all nowm downloads

  // 漏斗
  share_click_rate: number // success -> share click
  share_unlock_claim_rate: number // share click -> unlock claimed
  share_unlock_to_download_rate: number // unlock claimed -> nowm download

  // 风险
  share_unlock_daily_p95_hits: number // P95 of daily hits (per user)
  share_unlock_daily_p95_hits_7d_avg: number // 7d avg P95 (baseline)
}

export type GateResult = {
  gateKey: string
  status: GateStatus
  reasons: string[] // human-readable
  recommendedActions: string[] // what to do next (admin ops)
  debug?: Record<string, unknown>
}

function clamp01(x: number): number {
  if (!Number.isFinite(x)) return 0
  return Math.max(0, Math.min(1, x))
}

/**
 * Gate: Share Unlock Conversion Gate
 * 
 * Purpose: ensure share-unlock is not cannibalizing paid conversion.
 * 
 * 判断 Share-Unlock 是否在"促转化"，而不是在"替代付费"
 */
export function evaluateShareUnlockConversionGate(m: ShareUnlockMetrics7d): GateResult {
  const reasons: string[] = []
  const actions: string[] = []

  const paidBase = clamp01(m.paid_without_share_rate)
  const unlockToPaid = clamp01(m.share_unlock_to_paid_rate_48h)
  const viaShareRatio = clamp01(m.download_nowm_via_share_ratio)
  const claimRate = clamp01(m.share_unlock_claim_rate)

  // Cannibalization ratio: unlock pay vs baseline pay
  const cannibalRatio = paidBase > 0 ? unlockToPaid / paidBase : 0

  // Spike detection (rate-limit abuse / viral)
  const p95Spike =
    m.share_unlock_daily_p95_hits_7d_avg > 0
      ? m.share_unlock_daily_p95_hits / m.share_unlock_daily_p95_hits_7d_avg
      : 1

  // --- RED conditions (hard stop) ---
  if (paidBase > 0 && cannibalRatio < 0.5) {
    reasons.push(
      `Unlock→Paid(48h) too low vs baseline (ratio=${cannibalRatio.toFixed(2)} < 0.50)`
    )
  }
  if (viaShareRatio >= 0.6) {
    reasons.push(`Nowm downloads via share too high (${(viaShareRatio * 100).toFixed(0)}% ≥ 60%)`)
  }
  if (p95Spike >= 2) {
    reasons.push(`Share-unlock P95 spike detected (${p95Spike.toFixed(2)}× ≥ 2×)`)
  }

  if (reasons.length > 0) {
    actions.push('Tighten share-unlock: restrict to Veo 8s only')
    actions.push('Reduce eligibility window: 10min → 5min (optional)')
    actions.push('Keep daily limit at 3 or lower; consider 1 for Sora')
    actions.push('Do NOT change prices; only adjust unlock policy + copy')
    return {
      gateKey: 'SHARE_UNLOCK_CONVERSION_GATE',
      status: 'RED',
      reasons,
      recommendedActions: actions,
      debug: { paidBase, unlockToPaid, viaShareRatio, claimRate, cannibalRatio, p95Spike },
    }
  }

  // --- YELLOW conditions (observe, copy-only) ---
  const yellowReasons: string[] = []
  if (paidBase > 0 && cannibalRatio < 0.8) {
    yellowReasons.push(
      `Unlock→Paid(48h) below baseline tolerance (ratio=${cannibalRatio.toFixed(2)} < 0.80)`
    )
  }
  if (viaShareRatio >= 0.4 && viaShareRatio < 0.6) {
    yellowReasons.push(`Nowm via share in watch band (${(viaShareRatio * 100).toFixed(0)}%)`)
  }

  if (yellowReasons.length > 0) {
    actions.push('Copy-only optimization: improve "after unlock" upsell message')
    actions.push('Do NOT increase limits or expand to Sora 15s')
    actions.push('A/B: low-tier-only vs multi-tier on payment page (for first-time pay)')
    return {
      gateKey: 'SHARE_UNLOCK_CONVERSION_GATE',
      status: 'YELLOW',
      reasons: yellowReasons,
      recommendedActions: actions,
      debug: { paidBase, unlockToPaid, viaShareRatio, claimRate, cannibalRatio, p95Spike },
    }
  }

  // --- GREEN (healthy) ---
  actions.push('Keep policy: Veo 8s eligible by default')
  actions.push('Optional test: Sora 10s eligible ONLY when overall gate is GREEN + strict per-day cap')
  actions.push('Optimize share text + upgrade copy; do not touch pricing unless pricing gate is GREEN')

  return {
    gateKey: 'SHARE_UNLOCK_CONVERSION_GATE',
    status: 'GREEN',
    reasons: [
      `Unlock→Paid ratio OK (${cannibalRatio.toFixed(2)} ≥ 0.80)`,
      `Nowm via share controlled (${(viaShareRatio * 100).toFixed(0)}% ≤ 40%)`,
    ],
    recommendedActions: actions,
    debug: { paidBase, unlockToPaid, viaShareRatio, claimRate, cannibalRatio, p95Spike },
  }
}
