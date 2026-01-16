import { getBaseUrl } from '@/lib/utils/url'

export const dynamic = 'force-dynamic'

interface IndexHealthReport {
  week: string
  tier1: {
    count: number
    sitemap_urls: number
    score_p10: number
    score_p50: number
    score_p90: number
    score_avg: number
  }
  serp: {
    checked_count: number
    cited_rate: number
    aio_rate: number
    avg_position: number | null
  }
  thresholds: {
    tier1_min: number
    tier1_max: number
    score_p50_min: number
    score_p90_min: number
    cited_rate_min: number
  }
  actions: string[]
  created_at: string
}

function Metric({ k, v, threshold }: { k: string; v: string | number; threshold?: number }) {
  const isGood = threshold !== undefined ? Number(v) >= threshold : true
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="text-sm text-white/60">{k}</div>
      <div className={`mt-1 text-lg font-semibold ${isGood ? 'text-green-400' : 'text-yellow-400'}`}>
        {typeof v === 'number' ? v.toFixed(1) : String(v)}
      </div>
      {threshold !== undefined && (
        <div className="mt-1 text-xs text-white/40">阈值: {threshold}</div>
      )}
    </div>
  )
}

export default async function IndexHealthPage() {
  const baseUrl = getBaseUrl()

  let report: IndexHealthReport | null = null
  try {
    const res = await fetch(`${baseUrl}/api/reports/index-health`, {
      cache: 'no-store',
    })
    if (res.ok) {
      report = await res.json()
    }
  } catch (error) {
    console.error('[index-health] Error:', error)
  }

  if (!report) {
    return (
      <main className="mx-auto max-w-4xl p-6">
        <h1 className="text-2xl font-bold">Index Health Weekly</h1>
        <p className="mt-4 text-white/60">无法加载报告数据</p>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Index Health Weekly</h1>
        <p className="mt-2 text-sm text-white/60">
          周: {report.week} | 更新时间: {new Date(report.created_at).toLocaleString()}
        </p>
      </div>

      {/* Tier1 统计 */}
      <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="mb-4 text-lg font-semibold">Tier1 统计</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Metric
            k="Tier1 数量"
            v={report.tier1.count}
            threshold={report.thresholds.tier1_min}
          />
          <Metric k="Sitemap URLs" v={report.tier1.sitemap_urls} />
          <Metric
            k="Score P50"
            v={report.tier1.score_p50}
            threshold={report.thresholds.score_p50_min}
          />
          <Metric
            k="Score P90"
            v={report.tier1.score_p90}
            threshold={report.thresholds.score_p90_min}
          />
          <Metric k="Score P10" v={report.tier1.score_p10} />
          <Metric k="Score 平均" v={report.tier1.score_avg} />
        </div>
      </div>

      {/* SERP 监控 */}
      {report.serp.checked_count > 0 && (
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-lg font-semibold">AI SERP 监控（最近 7 天）</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Metric k="检查次数" v={report.serp.checked_count} />
            <Metric
              k="引用率 (%)"
              v={report.serp.cited_rate}
              threshold={report.thresholds.cited_rate_min}
            />
            <Metric k="AI Overview 率 (%)" v={report.serp.aio_rate} />
            {report.serp.avg_position && (
              <Metric k="平均位置" v={report.serp.avg_position} />
            )}
          </div>
        </div>
      )}

      {/* 行动建议 */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="mb-4 text-lg font-semibold">行动建议</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm">
          {report.actions.map((action, i) => (
            <li key={i} className="text-white/80">
              {action}
            </li>
          ))}
        </ul>
      </div>

      {/* JSON 下载链接 */}
      <div className="mt-6 text-center">
        <a
          href={`${baseUrl}/api/reports/index-health`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-white/60 underline hover:text-white/80"
        >
          查看 JSON 数据
        </a>
      </div>
    </main>
  )
}
