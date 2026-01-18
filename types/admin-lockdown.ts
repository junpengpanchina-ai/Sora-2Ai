/**
 * Admin Lockdown Panel（14 天只观察不动）
 * 策略见 LOCKDOWN_14DAY_MONITORING.md
 */

export type LockdownStatus = 'EXPAND' | 'HOLD' | 'STOP'

export type MetricStatus = 'OK' | 'WARN' | 'FAIL'

export type Trend = 'up' | 'flat' | 'down'

export type SitemapStatus = 'success' | 'warning' | 'error'

export type Phase = 'HOLD' | 'EXPAND' | 'STOP'

export interface LockdownMetric {
  key: string
  label: string
  value: string
  trend?: string
  status: MetricStatus
}

export interface LockdownPanelProps {
  status: LockdownStatus
  metrics: LockdownMetric[]
  lastUpdated: string
}

/** 每日填报 / 表 admin_lockdown_daily 行 */
export interface LockdownDailyEntry {
  id?: number
  date: string
  phase: Phase

  crawl_pages_per_day: number
  crawl_trend: Trend

  discovered_total: number
  discovered_trend: Trend

  indexed_total: number
  indexed_trend: Trend

  sitemap_status: SitemapStatus
  sitemap_submitted?: number | null
  sitemap_discovered?: number | null
  sitemap_indexed?: number | null

  sample_main_scene_ok: boolean
  sample_merged_scene_ok: boolean

  note?: string | null
  created_at?: string
}

/** 今日填报表单（与 LockdownDailyEntry 对齐，date 可选默认今天） */
export type LockdownDailyForm = Omit<LockdownDailyEntry, 'id' | 'created_at'> & {
  date?: string
}
