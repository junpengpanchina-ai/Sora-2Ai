'use client'

import { useState } from 'react'
import type { LockdownDailyForm, Trend, SitemapStatus } from '@/types/admin-lockdown'

const TREND_OPTIONS: { value: Trend; label: string }[] = [
  { value: 'up', label: '↑' },
  { value: 'flat', label: '→' },
  { value: 'down', label: '↓' },
]

const SITEMAP_OPTIONS: { value: SitemapStatus; label: string }[] = [
  { value: 'success', label: '成功' },
  { value: 'warning', label: '有警告' },
  { value: 'error', label: '报错' },
]

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

const defaultForm: LockdownDailyForm = {
  date: todayStr(),
  phase: 'HOLD',
  crawl_pages_per_day: 0,
  crawl_trend: 'flat',
  discovered_total: 0,
  discovered_trend: 'flat',
  indexed_total: 0,
  indexed_trend: 'flat',
  sitemap_status: 'success',
  sitemap_submitted: null,
  sitemap_discovered: null,
  sitemap_indexed: null,
  sample_main_scene_ok: true,
  sample_merged_scene_ok: true,
  note: '',
}

export function LockdownForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void
  onCancel: () => void
}) {
  const [form, setForm] = useState<LockdownDailyForm>(defaultForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/lockdown-daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          date: form.date || todayStr(),
          sitemap_submitted: form.sitemap_submitted ?? null,
          sitemap_discovered: form.sitemap_discovered ?? null,
          sitemap_indexed: form.sitemap_indexed ?? null,
          note: form.note || null,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error ?? '提交失败')
        return
      }
      setForm(defaultForm)
      onSuccess()
    } catch (e) {
      setError(e instanceof Error ? e.message : '提交失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mt-4 space-y-3 rounded-lg border border-white/20 bg-black/20 p-4 text-sm">
      <div className="font-medium text-white/90">今日填报</div>
      {error && <div className="text-red-400">{error}</div>}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <label>
          <span className="text-white/60">日期</span>
          <input
            type="date"
            value={form.date || todayStr()}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            className="mt-0.5 w-full rounded border border-white/20 bg-white/5 px-2 py-1 text-white"
          />
        </label>
        <label>
          <span className="text-white/60">抓取量 /day</span>
          <input
            type="number"
            min={0}
            value={form.crawl_pages_per_day || ''}
            onChange={(e) =>
              setForm((f) => ({ ...f, crawl_pages_per_day: Number(e.target.value) || 0 }))
            }
            className="mt-0.5 w-full rounded border border-white/20 bg-white/5 px-2 py-1 text-white"
          />
        </label>
        <label>
          <span className="text-white/60">抓取趋势</span>
          <select
            value={form.crawl_trend}
            onChange={(e) => setForm((f) => ({ ...f, crawl_trend: e.target.value as Trend }))}
            className="mt-0.5 w-full rounded border border-white/20 bg-white/5 px-2 py-1 text-white"
          >
            {TREND_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="text-white/60">已发现</span>
          <input
            type="number"
            min={0}
            value={form.discovered_total || ''}
            onChange={(e) =>
              setForm((f) => ({ ...f, discovered_total: Number(e.target.value) || 0 }))
            }
            className="mt-0.5 w-full rounded border border-white/20 bg-white/5 px-2 py-1 text-white"
          />
        </label>
        <label>
          <span className="text-white/60">已发现趋势</span>
          <select
            value={form.discovered_trend}
            onChange={(e) =>
              setForm((f) => ({ ...f, discovered_trend: e.target.value as Trend }))
            }
            className="mt-0.5 w-full rounded border border-white/20 bg-white/5 px-2 py-1 text-white"
          >
            {TREND_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="text-white/60">已索引</span>
          <input
            type="number"
            min={0}
            value={form.indexed_total || ''}
            onChange={(e) =>
              setForm((f) => ({ ...f, indexed_total: Number(e.target.value) || 0 }))
            }
            className="mt-0.5 w-full rounded border border-white/20 bg-white/5 px-2 py-1 text-white"
          />
        </label>
        <label>
          <span className="text-white/60">已索引趋势</span>
          <select
            value={form.indexed_trend}
            onChange={(e) =>
              setForm((f) => ({ ...f, indexed_trend: e.target.value as Trend }))
            }
            className="mt-0.5 w-full rounded border border-white/20 bg-white/5 px-2 py-1 text-white"
          >
            {TREND_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="text-white/60">Sitemap 状态</span>
          <select
            value={form.sitemap_status}
            onChange={(e) =>
              setForm((f) => ({ ...f, sitemap_status: e.target.value as SitemapStatus }))
            }
            className="mt-0.5 w-full rounded border border-white/20 bg-white/5 px-2 py-1 text-white"
          >
            {SITEMAP_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 pt-6">
          <input
            type="checkbox"
            checked={form.sample_main_scene_ok}
            onChange={(e) =>
              setForm((f) => ({ ...f, sample_main_scene_ok: e.target.checked }))
            }
            className="rounded"
          />
          <span className="text-white/60">主 Scene 抽检 ✓</span>
        </label>
        <label className="flex items-center gap-2 pt-6">
          <input
            type="checkbox"
            checked={form.sample_merged_scene_ok}
            onChange={(e) =>
              setForm((f) => ({ ...f, sample_merged_scene_ok: e.target.checked }))
            }
            className="rounded"
          />
          <span className="text-white/60">被合并页抽检 ✓</span>
        </label>
      </div>

      <label>
        <span className="text-white/60">备注（可选）</span>
        <input
          type="text"
          value={form.note || ''}
          onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
          placeholder="≤1 句"
          className="mt-0.5 w-full rounded border border-white/20 bg-white/5 px-2 py-1 text-white"
        />
      </label>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={submitting}
          className="rounded bg-emerald-600 px-3 py-1.5 text-white disabled:opacity-50"
        >
          {submitting ? '提交中...' : '提交'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-white/30 px-3 py-1.5 text-white/80"
        >
          取消
        </button>
      </div>
    </div>
  )
}
