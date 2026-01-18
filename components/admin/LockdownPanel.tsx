'use client'

import { useCallback, useEffect, useState } from 'react'
import type {
  LockdownDailyEntry,
  LockdownMetric,
  LockdownStatus,
  MetricStatus,
} from '@/types/admin-lockdown'
import { LockdownHeader } from './LockdownHeader'
import { LockdownMetricsTable } from './LockdownMetricsTable'
import { LockdownActionHint } from './LockdownActionHint'
import { LockdownFooterNote } from './LockdownFooterNote'
import { LockdownForm } from './LockdownForm'

const TREND_DISPLAY: Record<string, string> = {
  up: '↑',
  flat: '→',
  down: '↓',
}

function getTodayLocal(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function deriveFromEntries(entries: LockdownDailyEntry[]): {
  status: LockdownStatus
  metrics: LockdownMetric[]
  lastUpdated: string
} {
  const sorted = [...entries].sort((a, b) => (b.date > a.date ? 1 : -1))
  const latest = sorted[0]
  const last5 = sorted.slice(0, 5)

  if (!latest) {
    return {
      status: 'HOLD',
      lastUpdated: '—',
      metrics: [
        { key: 'crawl', label: '抓取量', value: '—', trend: '—', status: 'WARN' },
        { key: 'indexed', label: '已索引页', value: '—', trend: '—', status: 'WARN' },
        { key: 'discovered', label: '已发现页', value: '—', trend: '—', status: 'WARN' },
        { key: 'sitemap', label: 'Tier1 sitemap', value: '—', status: 'WARN' },
        { key: 'inspect', label: 'URL 抽检', value: '—', status: 'WARN' },
      ],
    }
  }

  const last7 = sorted.slice(0, 7)
  const sevenDaysAgo = last7[last7.length - 1]
  const discoveredDrop =
    sevenDaysAgo && sevenDaysAgo.discovered_total > 0
      ? (sevenDaysAgo.discovered_total - latest.discovered_total) / sevenDaysAgo.discovered_total
      : 0

  // 1. 抓取量
  let crawlStatus: MetricStatus = 'OK'
  if (last5.length >= 5 && last5.every((e) => e.crawl_trend === 'down')) crawlStatus = 'FAIL'
  else if (latest.crawl_trend === 'up' || latest.crawl_trend === 'flat') crawlStatus = 'OK'
  else crawlStatus = 'WARN'

  // 2. 已索引
  let indexedStatus: MetricStatus = 'OK'
  if (last5.length >= 5 && last5.every((e) => e.indexed_trend === 'down')) indexedStatus = 'FAIL'

  // 3. 已发现
  let discoveredStatus: MetricStatus = 'OK'
  if (discoveredDrop > 0.3) discoveredStatus = 'FAIL'
  else if (discoveredDrop > 0.1) discoveredStatus = 'WARN'

  // 4. Sitemap
  const sitemapStatus: MetricStatus =
    latest.sitemap_status !== 'success' ? 'FAIL' : 'OK'

  // 5. URL 抽检
  const inspectStatus: MetricStatus =
    !latest.sample_main_scene_ok || !latest.sample_merged_scene_ok ? 'FAIL' : 'OK'

  const metrics: LockdownMetric[] = [
    {
      key: 'crawl',
      label: '抓取量',
      value: `${Number(latest.crawl_pages_per_day).toLocaleString()} / day`,
      trend: TREND_DISPLAY[latest.crawl_trend] ?? '—',
      status: crawlStatus,
    },
    {
      key: 'indexed',
      label: '已索引页',
      value: String(latest.indexed_total?.toLocaleString() ?? '—'),
      trend: TREND_DISPLAY[latest.indexed_trend] ?? '—',
      status: indexedStatus,
    },
    {
      key: 'discovered',
      label: '已发现页',
      value: String(latest.discovered_total?.toLocaleString() ?? '—'),
      trend: TREND_DISPLAY[latest.discovered_trend] ?? '—',
      status: discoveredStatus,
    },
    {
      key: 'sitemap',
      label: 'Tier1 sitemap',
      value: latest.sitemap_status === 'success' ? '成功' : latest.sitemap_status,
      status: sitemapStatus,
    },
    {
      key: 'inspect',
      label: 'URL 抽检',
      value:
        latest.sample_main_scene_ok && latest.sample_merged_scene_ok ? '4/4 正常' : '有误',
      status: inspectStatus,
    },
  ]

  let status: LockdownStatus = 'HOLD'
  if ([crawlStatus, indexedStatus, discoveredStatus, sitemapStatus, inspectStatus].includes('FAIL'))
    status = 'STOP'
  else if (crawlStatus === 'OK' && indexedStatus === 'OK' && sitemapStatus === 'OK') status = 'EXPAND'

  return {
    status,
    metrics,
    lastUpdated: latest.date,
  }
}

export function LockdownPanel() {
  const [entries, setEntries] = useState<LockdownDailyEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/lockdown-daily?days=14')
      const data = await res.json().catch(() => ({}))
      if (res.ok && Array.isArray(data.entries)) setEntries(data.entries)
      else setEntries([])
    } catch {
      setEntries([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  const { status, metrics, lastUpdated } = deriveFromEntries(entries)
  const today = getTodayLocal()
  const hasToday = entries.some((e) => e.date === today)

  if (loading) {
    return (
      <section className="rounded-xl border border-white/10 bg-black/40 p-6 backdrop-blur">
        <div className="text-white/60">加载锁仓面板…</div>
      </section>
    )
  }

  return (
    <section className="rounded-xl border border-white/10 bg-black/40 p-6 backdrop-blur">
      <LockdownHeader status={status} lastUpdated={lastUpdated} />
      <LockdownMetricsTable metrics={metrics} />
      <LockdownActionHint status={status} />
      <LockdownFooterNote />

      {!hasToday && !showForm && (
        <div className="mt-4 rounded-lg border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200/95">
          今日尚未填报，请完成 GSC 5 指标后点击下方「今日填报」。
        </div>
      )}

      {showForm ? (
        <LockdownForm
          onSuccess={() => {
            setShowForm(false)
            fetchEntries()
          }}
          onCancel={() => setShowForm(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="mt-4 text-sm text-white/60 underline hover:text-white/80"
        >
          今日填报
        </button>
      )}
    </section>
  )
}
