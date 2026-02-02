'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components/ui'

interface DashboardField {
  key: string
  label: string
  definition: string
  healthyRef: string
  value: string | number | null
}

interface DashboardBlock {
  name: string
  fields: DashboardField[]
}

interface GateMetrics {
  dailyPaidUsers: number
  consecutiveNoPayDays: number
  paymentFailureRate: number
  taskSuccessToUpgradeRatioPct: number
  upgradeClickToPayStartPct: number | null
  payStartToSuccessPct: number | null
  refundRatePct: number
}

interface GateResponse {
  success: boolean
  gate: 'LOCKDOWN' | 'OBSERVE' | 'GREEN'
  metrics: GateMetrics
  rules: Record<string, string>
  dashboardStatus?: 'LOCKDOWN' | 'OBSERVE' | 'GREEN'
  dashboard?: DashboardBlock[]
}

interface PricingExperimentState {
  enabled: boolean
  loading: boolean
}

export default function AdminConversionGateClient() {
  const [data, setData] = useState<GateResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pricingExp, setPricingExp] = useState<PricingExperimentState>({ enabled: false, loading: false })

  const fetchPricingExperiment = async () => {
    setPricingExp((p) => ({ ...p, loading: true }))
    try {
      const res = await fetch('/api/admin/pricing-experiment')
      if (res.ok) {
        const json = await res.json()
        setPricingExp({ enabled: Boolean(json.enabled), loading: false })
      } else {
        setPricingExp((p) => ({ ...p, loading: false }))
      }
    } catch {
      setPricingExp((p) => ({ ...p, loading: false }))
    }
  }

  const togglePricingExperiment = async (enabled: boolean) => {
    setPricingExp((p) => ({ ...p, loading: true }))
    try {
      const res = await fetch('/api/admin/pricing-experiment', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      })
      if (res.ok) {
        const json = await res.json()
        setPricingExp({ enabled: Boolean(json.enabled), loading: false })
      } else {
        setPricingExp((p) => ({ ...p, loading: false }))
      }
    } catch {
      setPricingExp((p) => ({ ...p, loading: false }))
    }
  }

  const fetchGate = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/conversion-gate')
      if (!res.ok) throw new Error(await res.text())
      const json = await res.json()
      setData(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGate()
  }, [])

  useEffect(() => {
    fetchPricingExperiment()
  }, [])

  const statusLightColors = {
    LOCKDOWN: 'bg-red-500 text-white border-red-700',
    OBSERVE: 'bg-yellow-500 text-white border-yellow-700',
    GREEN: 'bg-green-500 text-white border-green-700',
  }

  const statusLightLabels = {
    LOCKDOWN: '🟥 LOCKDOWN — 不许动价格',
    OBSERVE: '🟨 OBSERVE — 只调展示，不调价格',
    GREEN: '🟩 GREEN — 允许 A/B 档位与价格',
  }

  const gateColors = {
    LOCKDOWN: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 border-red-200 dark:border-red-800',
    OBSERVE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800',
    GREEN: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 border-green-200 dark:border-green-800',
  }

  const gateLabels = {
    LOCKDOWN: '🔒 LOCKDOWN — 不允许任何价格/档位调整',
    OBSERVE: '🟨 OBSERVE — 允许微调文案/推荐档，不许改价',
    GREEN: '🟩 GREEN — 才允许动价格 / A/B 档位 / 大包',
  }

  const statusLight: 'LOCKDOWN' | 'OBSERVE' | 'GREEN' =
    data?.dashboardStatus ?? data?.gate ?? 'LOCKDOWN'

  return (
    <div className="min-h-screen bg-energy-hero dark:bg-energy-hero-dark">
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/80 sticky top-0 z-50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/dashboard" className="text-sm text-gray-600 dark:text-gray-400 hover:text-energy-water">
                ← 总览
              </Link>
              <Link href="/admin/billing" className="text-sm text-gray-600 dark:text-gray-400 hover:text-energy-water">
                计费中心
              </Link>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">转化健康仪表盘</h1>
            </div>
            <Button variant="secondary" size="sm" onClick={fetchGate} disabled={loading}>
              {loading ? '加载中...' : '刷新'}
            </Button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
            {error}
          </div>
        )}

        {loading && !data ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-energy-water" />
          </div>
        ) : data ? (
          <>
            {/* Admin 决策语句 */}
            <blockquote className="mb-6 rounded-xl border border-white/10 bg-white/5 p-4 text-center text-lg italic text-white/90">
              “当用户已经愿意付费时，我们的职责不是卖更多，而是别让他犹豫。”
            </blockquote>
            <blockquote className="mb-8 rounded-xl border border-white/10 bg-white/5 p-4 text-center text-base text-white/80">
              “价格不是营销参数，是系统稳定后的放大器。”
            </blockquote>

            {/* 一眼判断状态灯 */}
            <Card className="mb-8 border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <span>一眼判断</span>
                  <Badge className={`${statusLightColors[statusLight]} border-2 px-4 py-1.5`}>
                    {statusLightLabels[statusLight]}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  判定逻辑：task_success_rate &lt; 70% 或 success_to_upgrade_click &lt; 5% → LOCKDOWN；pay_start_to_success &lt; 80% → OBSERVE；否则 GREEN。
                </p>
              </CardContent>
            </Card>

            {/* 4 块：流量质量 → 使用成功 → 转化意愿 → 支付完成 */}
            {data.dashboard?.map((block) => (
              <Card key={block.name} className="mb-6">
                <CardHeader>
                  <CardTitle>{block.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="py-2 text-left font-medium text-gray-700 dark:text-gray-300">字段</th>
                          <th className="py-2 text-left font-medium text-gray-700 dark:text-gray-300">定义</th>
                          <th className="py-2 text-left font-medium text-gray-700 dark:text-gray-300">健康参考</th>
                          <th className="py-2 text-right font-medium text-gray-700 dark:text-gray-300">当前值</th>
                        </tr>
                      </thead>
                      <tbody>
                        {block.fields.map((f) => (
                          <tr key={f.key} className="border-b border-gray-100 dark:border-gray-800">
                            <td className="py-2 font-mono text-gray-800 dark:text-gray-200">{f.label}</td>
                            <td className="py-2 text-gray-600 dark:text-gray-400">{f.definition}</td>
                            <td className="py-2 text-gray-600 dark:text-gray-400">{f.healthyRef}</td>
                            <td className="py-2 text-right font-mono font-medium">
                              {f.value ?? '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* 支付实验：Admin 可配置开关 */}
            <Card className="mb-8 border-2">
              <CardHeader>
                <CardTitle>支付实验（低档 only）</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Gate = LOCKDOWN / OBSERVE 时可开启；Gate = GREEN 时 RPC 强制 control，不参与实验。
                </p>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pricingExp.enabled}
                    disabled={pricingExp.loading}
                    onChange={(e) => togglePricingExperiment(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-energy-water focus:ring-energy-water"
                  />
                  <span className="text-sm font-medium">
                    Enable first payment low-only experiment
                  </span>
                </label>
                {pricingExp.loading && (
                  <span className="text-xs text-gray-500">保存中…</span>
                )}
              </CardContent>
            </Card>

            {/* 原有 Gate（价格调整许可） */}
            <Card className="mb-8 border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <span>价格/档位 Gate</span>
                  <Badge className={gateColors[data.gate]}>
                    {gateLabels[data.gate]}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  价格不是用来“救转化”的，是用来“放大稳定转化”的。只有在 GREEN 时才允许动价格 / 档位 / 大包。
                </p>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <p><strong className="text-red-600 dark:text-red-400">LOCKDOWN：</strong>{data.rules.LOCKDOWN}</p>
                  <p><strong className="text-yellow-600 dark:text-yellow-400">OBSERVE：</strong>{data.rules.OBSERVE}</p>
                  <p><strong className="text-green-600 dark:text-green-400">GREEN：</strong>{data.rules.GREEN}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>判定规则（价格 Gate 伪代码）</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-xs text-gray-100 font-mono">
{`if (task_success_rate < 0.7 || success_to_upgrade_click < 0.05) {
  status = 'LOCKDOWN'
} else if (pay_start_to_success < 0.8) {
  status = 'OBSERVE'
} else {
  status = 'GREEN'
}`}
                </pre>
              </CardContent>
            </Card>
          </>
        ) : null}
      </main>
    </div>
  )
}
