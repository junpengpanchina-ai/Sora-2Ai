'use client'

import { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, Input, Button, Badge } from '@/components/ui'
import { PromptGeneratorForm } from '@/app/admin/prompts/components/prompt-generator/PromptGeneratorForm'
import { AssetBadges, GateColorBadge, GateScoreBar, LifecycleBadge, LtvGateBadge } from '@/app/admin/prompts/components/gate/GateWidgets'

interface GlobalPromptsTabProps {
  onShowBanner: (type: 'success' | 'error' | 'info', text: string) => void
}

/**
 * Global Prompts Tab
 * 
 * 全局模板管理
 * - 不绑定场景的全局模板
 * - 用于系统提示、安全模板、结构模板
 * - 由代码组合使用
 */
export default function GlobalPromptsTab({ onShowBanner }: GlobalPromptsTabProps) {
  const [prompts, setPrompts] = useState<Array<{
    id: string
    content?: string
    model_id?: string
    role?: string
    version?: number
    status?: string
    is_published?: boolean
    locale?: string
    owner_scope?: string
    scene_id?: string
    // asset fields (optional)
    is_active?: boolean | null
    top_prompt?: boolean | null
    freeze_until?: string | null
    kill_reason?: string | null
    gate_status?: 'green' | 'yellow' | 'red' | 'unknown' | null
    gate_score?: number | null
    // analytics / gate (optional)
    executions_7d?: number | null
    success_7d?: number | null
    failure_7d?: number | null
    success_rate_7d?: number | null
    delta_cr_7d?: number | null
    roi_value_cents_7d?: number | null
    gate_pass?: boolean | null
    gate_score_7d?: number | null
    gate_color_7d?: 'RED' | 'YELLOW' | 'GREEN' | null
    last_execute_at?: string | null
    ltv_gate_color?: 'RED' | 'YELLOW' | 'GREEN' | null
    lifecycle_recommendation?: 'HARD_KILL' | 'FREEZE' | 'PROMOTE' | 'KEEP' | null
    lifecycle_should_unpublish?: boolean | null
  }>>([])
  const [loading, setLoading] = useState(true)
  const [gateRunning, setGateRunning] = useState(false)
  const [viewFilter, setViewFilter] = useState<'all' | 'attention' | 'green' | 'yellow' | 'red' | 'frozen'>('attention')
  const [sortMode, setSortMode] = useState<'risk' | 'usage' | 'score_desc'>('risk')
  const [searchQuery, setSearchQuery] = useState('')
  const [modelFilter, setModelFilter] = useState<'all' | 'sora' | 'veo_fast' | 'veo_pro' | 'gemini'>('all')
  const [roleFilter, setRoleFilter] = useState<'all' | 'default' | 'fast' | 'high_quality' | 'social' | 'ads' | 'compliance_safe'>('all')


  // 加载全局模板
  const fetchGlobalPrompts = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(
        '/api/admin/prompt-templates?owner_scope=global&page=1&page_size=200&sort_by=updated_at&sort_dir=desc'
      )
      const data = await response.json()
      if (response.ok && data.items) {
        setPrompts(data.items)
      }
    } catch (error) {
      console.error('加载全局模板失败:', error)
      onShowBanner('error', '加载全局模板失败')
    } finally {
      setLoading(false)
    }
  }, [onShowBanner])

  const runForceGate = useCallback(async () => {
    if (gateRunning) return
    setGateRunning(true)
    onShowBanner('info', 'Running Gate (7d)…')
    try {
      const res = await fetch('/api/admin/prompts/force-gate', { method: 'POST' })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.ok) {
        const msg = json?.message || json?.error || `Gate failed (${res.status})`
        onShowBanner(res.status === 429 ? 'info' : 'error', String(msg))
        return
      }
      const s = json.summary as {
        total: number
        green: number
        yellow: number
        red: number
        top: number
        frozen: number
        killed: number
      }
      onShowBanner(
        'success',
        `Gate updated: total=${s.total}, green=${s.green}, yellow=${s.yellow}, red=${s.red}, top=${s.top}, frozen=${s.frozen}, killed=${s.killed}`
      )
      await fetchGlobalPrompts()
    } catch (e) {
      onShowBanner('error', e instanceof Error ? e.message : 'Gate failed')
    } finally {
      setGateRunning(false)
    }
  }, [fetchGlobalPrompts, gateRunning, onShowBanner])


  useEffect(() => {
    fetchGlobalPrompts()
  }, [fetchGlobalPrompts])


  const filteredPrompts = prompts.filter((prompt) => {
    const matchesSearch = searchQuery === '' || 
      prompt.content?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesModel = modelFilter === 'all' || prompt.model_id === modelFilter
    const matchesRole = roleFilter === 'all' || prompt.role === roleFilter
    
    return matchesSearch && matchesModel && matchesRole
  })

  const nowMs = Date.now()
  const filteredByView = filteredPrompts.filter((p) => {
    const frozen = p.freeze_until ? new Date(p.freeze_until).getTime() > nowMs : false
    const active = p.is_active !== false
    const gateStatus = p.gate_status ?? null
    const usage = typeof p.executions_7d === 'number' ? p.executions_7d : 0

    if (viewFilter === 'attention') {
      return gateStatus === 'yellow' && usage >= 10 && active && !frozen
    }
    if (viewFilter === 'frozen') return frozen
    if (viewFilter === 'green' || viewFilter === 'yellow' || viewFilter === 'red') return gateStatus === viewFilter
    return true
  })

  const sortedPrompts = [...filteredByView].sort((a, b) => {
    const scoreA = (typeof a.gate_score === 'number' ? a.gate_score : a.gate_score_7d) ?? null
    const scoreB = (typeof b.gate_score === 'number' ? b.gate_score : b.gate_score_7d) ?? null
    const usageA = typeof a.executions_7d === 'number' ? a.executions_7d : 0
    const usageB = typeof b.executions_7d === 'number' ? b.executions_7d : 0

    if (sortMode === 'usage') return usageB - usageA
    if (sortMode === 'score_desc') {
      if (scoreA == null && scoreB == null) return 0
      if (scoreA == null) return 1
      if (scoreB == null) return -1
      return scoreB - scoreA
    }
    // risk: score asc, usage desc
    if (scoreA == null && scoreB == null) return usageB - usageA
    if (scoreA == null) return 1
    if (scoreB == null) return -1
    if (scoreA !== scoreB) return scoreA - scoreB
    return usageB - usageA
  })

  const ROLE_LABELS: Record<string, string> = {
    default: '默认',
    fast: '快速',
    high_quality: '高质量',
    long_form: '长视频',
    ads: '广告',
    social: '社交媒体',
    compliance_safe: '合规安全',
  }

  const MODEL_LABELS: Record<string, string> = {
    sora: 'Sora',
    veo_fast: 'Veo Fast',
    veo_pro: 'Veo Pro',
    gemini: 'Gemini',
    universal: '通用',
  }

  return (
    <div className="space-y-6">
      <PromptGeneratorForm />

      {/* 说明卡片 */}
      <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="text-amber-600 dark:text-amber-400">ℹ️</div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-1">
                全局模板说明
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-200">
                全局模板不绑定特定场景，用于系统提示、安全模板、结构模板等通用场景。
                这些模板由代码组合使用，不参与 SEO/GEO。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 筛选器 */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>全局模板列表</CardTitle>
            <Button onClick={runForceGate} disabled={gateRunning}>
              {gateRunning ? 'Gating…' : 'Force Re-Gate (7d)'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant={viewFilter === 'all' ? 'primary' : 'secondary'} onClick={() => setViewFilter('all')}>
              All
            </Button>
            <Button
              size="sm"
              variant={viewFilter === 'attention' ? 'primary' : 'secondary'}
              onClick={() => setViewFilter('attention')}
              title="gate_status=yellow AND exec_7d>=10 AND active AND not frozen"
            >
              Needs Attention
            </Button>
            <Button size="sm" variant={viewFilter === 'green' ? 'primary' : 'secondary'} onClick={() => setViewFilter('green')}>
              Green
            </Button>
            <Button size="sm" variant={viewFilter === 'red' ? 'primary' : 'secondary'} onClick={() => setViewFilter('red')}>
              Red
            </Button>
            <Button size="sm" variant={viewFilter === 'frozen' ? 'primary' : 'secondary'} onClick={() => setViewFilter('frozen')}>
              Frozen
            </Button>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-gray-500">Sort:</span>
              <Button size="sm" variant={sortMode === 'risk' ? 'primary' : 'secondary'} onClick={() => setSortMode('risk')}>
                Risk
              </Button>
              <Button size="sm" variant={sortMode === 'usage' ? 'primary' : 'secondary'} onClick={() => setSortMode('usage')}>
                Usage
              </Button>
              <Button size="sm" variant={sortMode === 'score_desc' ? 'primary' : 'secondary'} onClick={() => setSortMode('score_desc')}>
                Score↓
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <Input
              placeholder="搜索标题或内容..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 min-w-[200px]"
            />
            <select
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
              value={modelFilter}
              onChange={(e) => setModelFilter(e.target.value as typeof modelFilter)}
            >
              <option value="all">所有模型</option>
              <option value="sora">Sora</option>
              <option value="veo_fast">Veo Fast</option>
              <option value="veo_pro">Veo Pro</option>
              <option value="gemini">Gemini</option>
            </select>
            <select
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
            >
              <option value="all">所有角色</option>
              <option value="default">默认</option>
              <option value="fast">快速</option>
              <option value="high_quality">高质量</option>
              <option value="social">社交媒体</option>
              <option value="ads">广告</option>
              <option value="compliance_safe">合规安全</option>
            </select>
          </div>

          {/* 模板列表 */}
          {loading ? (
            <div className="text-center py-8 text-gray-500">加载中...</div>
          ) : sortedPrompts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchQuery || modelFilter !== 'all' || roleFilter !== 'all' 
                ? '没有找到匹配的全局模板'
                : '还没有全局模板，请先创建'}
            </div>
          ) : (
            <div className="space-y-4">
              {sortedPrompts.map((prompt) => (
                <Card key={prompt.id} className="border-gray-200 dark:border-gray-700">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {prompt.content ? prompt.content.slice(0, 40) : 'Untitled'}
                          </h3>
                          <Badge variant="secondary">{prompt.model_id ? (MODEL_LABELS[prompt.model_id] || prompt.model_id) : 'unknown'}</Badge>
                          <Badge variant="secondary">{prompt.role ? (ROLE_LABELS[prompt.role] || prompt.role) : 'default'}</Badge>
                          {prompt.version && (
                            <Badge variant="secondary">v{prompt.version}</Badge>
                          )}
                          {prompt.status === 'active' && prompt.is_published ? (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              已发布
                            </Badge>
                          ) : (
                            <Badge variant="secondary">草稿</Badge>
                          )}
                          <AssetBadges
                            isActive={prompt.is_active ?? null}
                            freezeUntil={prompt.freeze_until ?? null}
                            topPrompt={prompt.top_prompt ?? null}
                            killReason={prompt.kill_reason ?? null}
                          />
                          {prompt.gate_pass ? (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              Gate PASS
                            </Badge>
                          ) : null}
                          <GateColorBadge
                            color={prompt.gate_color_7d ?? null}
                            title={
                              typeof prompt.gate_score_7d === 'number'
                                ? `GateScore_7d=${prompt.gate_score_7d.toFixed(3)}`
                                : undefined
                            }
                          />
                          <LtvGateBadge color={prompt.ltv_gate_color ?? null} />
                          <LifecycleBadge rec={prompt.lifecycle_recommendation ?? null} />
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          <span>内容长度: {prompt.content?.length || 0} 字符</span>
                          {prompt.locale && <span className="ml-3">语言: {prompt.locale}</span>}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <div>exec_7d: {prompt.executions_7d ?? '—'}</div>
                          <div>sr_7d: {typeof prompt.success_rate_7d === 'number' ? `${Math.round(prompt.success_rate_7d * 100)}%` : '—'}</div>
                          <div>ΔCR_7d: {typeof prompt.delta_cr_7d === 'number' ? `${(prompt.delta_cr_7d * 100).toFixed(2)}%` : '—'}</div>
                          <div>ROI_7d: {prompt.roi_value_cents_7d != null ? `¥${(Number(prompt.roi_value_cents_7d) / 100).toFixed(2)}` : '—'}</div>
                          <div className="col-span-2">
                            <div className="flex items-center justify-between gap-2">
                              <div>GateScore_7d: {typeof prompt.gate_score_7d === 'number' ? prompt.gate_score_7d.toFixed(3) : '—'}</div>
                              <div>last_exec: {prompt.last_execute_at ? new Date(prompt.last_execute_at).toLocaleDateString() : '—'}</div>
                            </div>
                            <div className="mt-1">
                              <GateScoreBar
                                score={prompt.gate_score_7d ?? null}
                                color={prompt.gate_color_7d ?? null}
                                title="0.6×S + 0.4×ln(U+1)/ln(101)"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          编辑
                        </Button>
                        <Button variant="outline" size="sm">
                          查看
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
