/**
 * Admin 锁仓规则 · 系统级写操作守卫
 * 规则写死，人无法绕过。见 LOCKDOWN_14DAY_MONITORING.md
 */

import type { LockdownDailyEntry, LockdownPhase } from '@/types/admin-lockdown'

export type { LockdownPhase } from '@/types/admin-lockdown'

/** 第 15 天判定函数：唯一允许从 LOCKDOWN → EXPAND 的门。不可手改、不可 override。 */
export function judgeDay15(rows: LockdownDailyEntry[]): 'HOLD' | 'EXPAND' | 'STOP' {
  const asc = [...rows].sort((a, b) => a.date.localeCompare(b.date))
  const last14 = asc.slice(-14)
  if (last14.length < 14) return 'HOLD'

  const crawlDownDays = last14.filter((r) => r.crawl_trend === 'down').length
  const indexedDownStreak = asc.slice(-5).every((r) => r.indexed_trend === 'down')
  const sitemapError = last14.some((r) => r.sitemap_status === 'error')
  const sampleError = last14.some(
    (r) => !r.sample_main_scene_ok || !r.sample_merged_scene_ok
  )

  if (crawlDownDays >= 5 || indexedDownStreak || sitemapError || sampleError) {
    return 'STOP'
  }

  const last = last14[last14.length - 1]
  if (last && last.crawl_trend !== 'down' && !indexedDownStreak) {
    return 'EXPAND'
  }

  return 'HOLD'
}

/**
 * 所有「新增 / 修改 tier|in_sitemap|noindex / 跑合并 / 改 sitemap / 新 URL」类写操作，
 * 调用前必须经过此函数。phase 非 EXPAND 时抛错，由调用方返回 403。
 */
export function assertWriteAllowed(phase: LockdownPhase): void {
  if (phase === 'LOCKDOWN' || phase === 'HOLD' || phase === 'STOP') {
    throw new Error('System is in LOCKDOWN. Write operations are blocked by design.')
  }
}

/**
 * 服务端：从 admin_lockdown_daily 取最近数据，用 judgeDay15 得出 phase。
 * <14 条则返回 LOCKDOWN。supabase 由调用方传入（createServiceClient）。
 */
export async function getLockdownPhase(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
): Promise<LockdownPhase> {
  const { data } = await supabase
    .from('admin_lockdown_daily')
    .select('*')
    .order('date', { ascending: true })
  const rows = (Array.isArray(data) ? data : []) as LockdownDailyEntry[]
  if (rows.length < 14) return 'LOCKDOWN'
  return judgeDay15(rows)
}
