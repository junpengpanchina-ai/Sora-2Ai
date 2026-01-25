'use client'

import { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, Input, Button } from '@/components/ui'
import { Badge } from '@/components/ui'

interface ScenePromptsTabProps {
  onShowBanner: (type: 'success' | 'error' | 'info', text: string) => void
}

type PromptItem = {
  id: string
  model_id?: string
  role?: string
  status?: string
  version?: number
  is_published?: boolean
  rollout_pct?: number
  content?: string
  // analytics / gate (optional, from v_prompt_templates_admin_list)
  executions_7d?: number | null
  success_rate_7d?: number | null
  delta_cr_7d?: number | null
  roi_value_cents_7d?: number | null
  gate_pass?: boolean | null
  ab_data_sufficient?: boolean | null
  variant_count_14d?: number | null
  ltv_gate_color?: 'RED' | 'YELLOW' | 'GREEN' | null
}

/**
 * Scene Prompts Tab
 * 
 * 按场景管理 Prompt
 * - 左侧：Scene 搜索和列表
 * - 右侧：该 Scene 的 prompts 列表（按 model + role 分组）
 */
export default function ScenePromptsTab({ onShowBanner }: ScenePromptsTabProps) {
  const [scenes, setScenes] = useState<Array<{
    id: string
    slug?: string
    title?: string
    industry?: string
    tier?: number
    in_sitemap?: boolean
    ai_citation_score?: number
  }>>([])
  const [prompts, setPrompts] = useState<PromptItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [tierFilter, setTierFilter] = useState<'all' | '1' | '2' | '3'>('all')
  const [genOpen, setGenOpen] = useState(false)
  const [genIndustries, setGenIndustries] = useState('')
  const [genPerCellCount, setGenPerCellCount] = useState(10)
  const [genLocale, setGenLocale] = useState<'en' | 'zh'>('en')
  const [genModelId, setGenModelId] = useState<'sora' | 'veo_fast' | 'veo_pro' | 'gemini'>('sora')
  const [genRole, setGenRole] = useState<
    'default' | 'fast' | 'high_quality' | 'long_form' | 'ads' | 'social' | 'compliance_safe'
  >('default')
  const [genTaskId, setGenTaskId] = useState<string | null>(null)
  const [genProgress, setGenProgress] = useState<number | null>(null)

  // 加载场景列表
  const fetchScenes = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/use-cases?limit=100')
      const data = await response.json()
      if (response.ok && data.use_cases) {
        setScenes(data.use_cases)
        if (data.use_cases.length > 0 && !selectedSceneId) {
          setSelectedSceneId(data.use_cases[0].id)
        }
      }
    } catch (error) {
      console.error('加载场景失败:', error)
      onShowBanner('error', '加载场景列表失败')
    } finally {
      setLoading(false)
    }
  }, [selectedSceneId, onShowBanner])

  // 加载选定场景的 prompts
  const fetchScenePrompts = useCallback(async (sceneId: string) => {
    if (!sceneId) return
    
    try {
      const response = await fetch(
        `/api/admin/prompt-templates?owner_scope=scene&scene_id=${encodeURIComponent(sceneId)}&page=1&page_size=200&sort_by=updated_at&sort_dir=desc`
      )
      const data = await response.json()
      if (response.ok && data.items) {
        setPrompts(data.items)
      }
    } catch (error) {
      console.error('加载场景 prompts 失败:', error)
      onShowBanner('error', '加载场景 prompts 失败')
    }
  }, [onShowBanner])

  useEffect(() => {
    fetchScenes()
  }, [fetchScenes])

  useEffect(() => {
    if (selectedSceneId) {
      fetchScenePrompts(selectedSceneId)
    }
  }, [selectedSceneId, fetchScenePrompts])

  const filteredScenes = scenes.filter((scene) => {
    const matchesSearch = searchQuery === '' || 
      scene.slug?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scene.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scene.industry?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesTier = tierFilter === 'all' || String(scene.tier) === tierFilter
    
    return matchesSearch && matchesTier
  })

  const selectedScene = scenes.find(s => s.id === selectedSceneId)

  const pollGenerationStatus = useCallback(
    async (taskId: string) => {
      try {
        const res = await fetch(`/api/admin/prompt-templates/batch-generate/status/${taskId}`)
        const data = await res.json()
        if (!res.ok || !data?.task) {
          return
        }
        const task = data.task as { status?: string; progress?: number; last_error?: string | null }
        if (typeof task.progress === 'number') {
          setGenProgress(task.progress)
        }
        if (task.last_error) {
          // keep last error visible via banner but don't spam
          console.warn('[prompt-gen] last_error:', task.last_error)
        }
        if (task.status === 'completed') {
          onShowBanner('success', '批量生成完成')
          setGenTaskId(null)
          setGenProgress(null)
          if (selectedSceneId) {
            fetchScenePrompts(selectedSceneId)
          }
          return
        }
        if (task.status === 'failed') {
          onShowBanner('error', `批量生成失败：${task.last_error || 'unknown'}`)
          setGenTaskId(null)
          return
        }
        // continue polling
        setTimeout(() => pollGenerationStatus(taskId), 1200)
      } catch {
        // ignore polling errors
        setTimeout(() => pollGenerationStatus(taskId), 2000)
      }
    },
    [fetchScenePrompts, onShowBanner, selectedSceneId]
  )

  const handleBatchGenerate = useCallback(async () => {
    if (!selectedScene) {
      onShowBanner('error', '请先选择一个场景')
      return
    }
    const industries = genIndustries
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
    const scenesInput = [selectedScene.title || selectedScene.slug || selectedScene.id].filter(Boolean) as string[]
    if (industries.length === 0) {
      onShowBanner('error', '请至少输入 1 个行业（每行一个）')
      return
    }

    try {
      const res = await fetch('/api/admin/prompt-templates/batch-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          industries,
          scenes: scenesInput,
          sceneIds: [selectedScene.id],
          perCellCount: genPerCellCount,
          maxTotalPrompts: 1200,
          maxRetriesPerCell: 2,
          ownerScope: 'scene',
          modelId: genModelId,
          role: genRole,
          locale: genLocale,
          strategy: {
            primary: 'gemini-2.5-flash',
            secondary: 'gemini-3-flash',
            fallback: 'gemini-3-pro',
          },
        }),
      })
      const data = await res.json()
      if (!res.ok || !data?.taskId) {
        throw new Error(data?.error || '创建任务失败')
      }
      setGenTaskId(data.taskId)
      setGenProgress(0)
      onShowBanner('info', `已启动批量生成（taskId: ${String(data.taskId).slice(0, 8)}...）`)
      pollGenerationStatus(data.taskId)
    } catch (e) {
      onShowBanner('error', e instanceof Error ? e.message : '创建批量生成失败')
    }
  }, [
    genIndustries,
    genLocale,
    genModelId,
    genPerCellCount,
    genRole,
    onShowBanner,
    pollGenerationStatus,
    selectedScene,
  ])

  // 按 model + role 分组 prompts
  const promptsByModelRole = prompts.reduce((acc, prompt) => {
    const key = `${prompt.model_id || 'unknown'}_${prompt.role || 'default'}`
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(prompt)
    return acc
  }, {} as Record<string, PromptItem[]>)

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* 左侧：Scene 搜索和列表 */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>场景列表</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 搜索框 */}
            <Input
              placeholder="搜索场景 slug/title/industry..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            {/* Tier 筛选 */}
            <div className="flex gap-2">
              <Button
                variant={tierFilter === 'all' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setTierFilter('all')}
              >
                全部
              </Button>
              <Button
                variant={tierFilter === '1' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setTierFilter('1')}
              >
                Tier 1
              </Button>
              <Button
                variant={tierFilter === '2' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setTierFilter('2')}
              >
                Tier 2
              </Button>
              <Button
                variant={tierFilter === '3' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setTierFilter('3')}
              >
                Tier 3
              </Button>
            </div>

            {/* 场景列表 */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="text-sm text-gray-500">加载中...</div>
              ) : filteredScenes.length === 0 ? (
                <div className="text-sm text-gray-500">没有找到场景</div>
              ) : (
                filteredScenes.map((scene) => (
                  <div
                    key={scene.id}
                    onClick={() => setSelectedSceneId(scene.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition ${
                      selectedSceneId === scene.id
                        ? 'border-energy-water bg-energy-water/10'
                        : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={scene.tier === 1 ? 'info' : 'secondary'}>
                        Tier {scene.tier || 'N/A'}
                      </Badge>
                      {scene.in_sitemap && (
                        <Badge variant="secondary" className="text-xs">
                          Sitemap
                        </Badge>
                      )}
                      {scene.ai_citation_score !== undefined && scene.ai_citation_score >= 0.65 && (
                        <Badge variant="success" className="text-xs">
                          High Score
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm font-medium">{scene.title || scene.slug}</div>
                    {scene.industry && (
                      <div className="text-xs text-gray-500">{scene.industry}</div>
                    )}
                    {scene.ai_citation_score !== undefined && scene.ai_citation_score !== null && (
                      <div className="text-xs text-gray-500 mt-1">
                        AI Score: {scene.ai_citation_score.toFixed(2)}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 右侧：Prompt 列表 */}
      <div className="lg:col-span-2 space-y-4">
        {selectedScene ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle>场景: {selectedScene.title || selectedScene.slug}</CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={selectedScene.tier === 1 ? 'info' : 'secondary'}>
                    Tier {selectedScene.tier}
                  </Badge>
                  {selectedScene.industry && (
                    <Badge variant="secondary">{selectedScene.industry}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => {
                      onShowBanner('info', '创建 Prompt 功能待实现（建议走 prompt_templates 编辑器）')
                    }}
                  >
                    创建新 Prompt
                  </Button>
                  <Button variant="outline" onClick={() => setGenOpen((v) => !v)}>
                    批量自动生成
                  </Button>
                </div>

                {genOpen ? (
                  <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm dark:border-gray-700 dark:bg-gray-900/40">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-2">
                        <div className="text-xs text-gray-500">行业（每行一个）</div>
                        <textarea
                          className="w-full rounded-lg border border-gray-300 bg-white p-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                          rows={5}
                          placeholder="E-commerce\nSaaS\nLocal business"
                          value={genIndustries}
                          onChange={(e) => setGenIndustries(e.target.value)}
                        />
                        <div className="text-xs text-gray-500">
                          默认会把当前选中场景作为 scene 输入，并写入到该 scene 的 prompt_templates（draft）。
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">每个行业生成条数</div>
                            <Input
                              value={String(genPerCellCount)}
                              onChange={(e) => setGenPerCellCount(Math.max(1, Number(e.target.value) || 1))}
                            />
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">语言</div>
                            <select
                              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                              value={genLocale}
                              onChange={(e) => setGenLocale(e.target.value as 'en' | 'zh')}
                            >
                              <option value="en">en</option>
                              <option value="zh">zh</option>
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">model_id</div>
                            <select
                              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                              value={genModelId}
                              onChange={(e) =>
                                setGenModelId(e.target.value as 'sora' | 'veo_fast' | 'veo_pro' | 'gemini')
                              }
                            >
                              <option value="sora">sora</option>
                              <option value="veo_fast">veo_fast</option>
                              <option value="veo_pro">veo_pro</option>
                              <option value="gemini">gemini</option>
                            </select>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">role</div>
                            <select
                              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                              value={genRole}
                              onChange={(e) =>
                                setGenRole(
                                  e.target.value as
                                    | 'default'
                                    | 'fast'
                                    | 'high_quality'
                                    | 'long_form'
                                    | 'ads'
                                    | 'social'
                                    | 'compliance_safe'
                                )
                              }
                            >
                              <option value="default">default</option>
                              <option value="fast">fast</option>
                              <option value="high_quality">high_quality</option>
                              <option value="ads">ads</option>
                              <option value="social">social</option>
                              <option value="compliance_safe">compliance_safe</option>
                              <option value="long_form">long_form</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-2">
                          <Button onClick={handleBatchGenerate} disabled={!!genTaskId}>
                            {genTaskId ? '生成中...' : '开始生成'}
                          </Button>
                          {genTaskId && (
                            <div className="text-xs text-gray-600 dark:text-gray-300">
                              Progress: {genProgress ?? 0}%
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {/* Prompts 列表（按 model + role 分组） */}
            <div className="space-y-4">
              {Object.entries(promptsByModelRole).map(([key, groupPrompts]) => {
                const [modelId, role] = key.split('_')
                return (
                  <Card key={key}>
                    <CardHeader>
                      <CardTitle className="text-base">
                        {modelId} / {role}
                        <Badge variant="secondary" className="ml-2">
                          {groupPrompts.length} 个版本
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {groupPrompts.map((prompt) => (
                          <div
                            key={prompt.id}
                            className="p-3 rounded border border-gray-200 dark:border-gray-700"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Badge variant={prompt.status === 'active' ? 'info' : 'secondary'}>
                                  {String(prompt.status || 'unknown')}
                                </Badge>
                                {Boolean(prompt.is_published) && (
                                  <Badge variant="success">已发布</Badge>
                                )}
                                <span className="text-xs text-gray-500">v{String(prompt.version ?? 'N/A')}</span>
                                {prompt.gate_pass ? (
                                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                    Gate PASS
                                  </Badge>
                                ) : null}
                                {prompt.ltv_gate_color ? (
                                  prompt.ltv_gate_color === 'GREEN' ? (
                                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                      LTV GREEN
                                    </Badge>
                                  ) : prompt.ltv_gate_color === 'YELLOW' ? (
                                    <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                      LTV YELLOW
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                      LTV RED
                                    </Badge>
                                  )
                                ) : null}
                                {prompt.ab_data_sufficient === false && (prompt.variant_count_14d ?? 0) > 1 ? (
                                  <Badge variant="secondary">AB 数据不足</Badge>
                                ) : null}
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline">
                                  编辑
                                </Button>
                                <Button size="sm" variant="outline">
                                  克隆
                                </Button>
                              </div>
                            </div>
                            <div className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                              {prompt.content && typeof prompt.content === 'string' ? prompt.content.substring(0, 200) + '...' : 'No content'}
                            </div>
                            {prompt.rollout_pct !== undefined && prompt.rollout_pct !== null && typeof prompt.rollout_pct === 'number' && prompt.rollout_pct < 100 && (
                              <div className="text-xs text-orange-600 mt-1">
                                灰度: {prompt.rollout_pct}%
                              </div>
                            )}
                            <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400">
                              <div>exec_7d: {prompt.executions_7d ?? '—'}</div>
                              <div>sr_7d: {typeof prompt.success_rate_7d === 'number' ? `${Math.round(prompt.success_rate_7d * 100)}%` : '—'}</div>
                              <div>ΔCR_7d: {typeof prompt.delta_cr_7d === 'number' ? `${(prompt.delta_cr_7d * 100).toFixed(2)}%` : '—'}</div>
                              <div>ROI_7d: {prompt.roi_value_cents_7d != null ? `¥${(Number(prompt.roi_value_cents_7d) / 100).toFixed(2)}` : '—'}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}

              {prompts.length === 0 && (
                <Card>
                  <CardContent className="pt-6 text-center text-gray-500">
                    该场景还没有 prompts
                    <br />
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => {
                        onShowBanner('info', '创建 Prompt 功能待实现')
                      }}
                    >
                      创建第一个 Prompt
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        ) : (
          <Card>
            <CardContent className="pt-6 text-center text-gray-500">
              请从左侧选择一个场景
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
