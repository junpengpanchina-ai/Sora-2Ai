'use client'

import { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, Input, Button } from '@/components/ui'
import { Badge } from '@/components/ui'

interface ScenePromptsTabProps {
  onShowBanner: (type: 'success' | 'error' | 'info', text: string) => void
}

/**
 * Scene Prompts Tab
 * 
 * 按场景管理 Prompt
 * - 左侧：Scene 搜索和列表
 * - 右侧：该 Scene 的 prompts 列表（按 model + role 分组）
 */
export default function ScenePromptsTab({ onShowBanner }: ScenePromptsTabProps) {
  const [scenes, setScenes] = useState<any[]>([])
  const [prompts, setPrompts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [tierFilter, setTierFilter] = useState<'all' | '1' | '2' | '3'>('all')

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
      // TODO: 创建 API 端点 /api/admin/prompts/scene/[sceneId]
      const response = await fetch(`/api/admin/prompts?sceneId=${sceneId}`)
      const data = await response.json()
      if (response.ok && data.prompts) {
        setPrompts(data.prompts)
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

  // 按 model + role 分组 prompts
  const promptsByModelRole = prompts.reduce((acc, prompt) => {
    const key = `${prompt.model_id || 'unknown'}_${prompt.role || 'default'}`
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(prompt)
    return acc
  }, {} as Record<string, any[]>)

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
                      <Badge variant={scene.tier === 1 ? 'primary' : 'secondary'}>
                        Tier {scene.tier || 'N/A'}
                      </Badge>
                      {scene.in_sitemap && (
                        <Badge variant="outline" className="text-xs">
                          Sitemap
                        </Badge>
                      )}
                      {scene.ai_citation_score && scene.ai_citation_score >= 0.65 && (
                        <Badge variant="outline" className="text-xs text-green-600">
                          High Score
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm font-medium">{scene.title || scene.slug}</div>
                    {scene.industry && (
                      <div className="text-xs text-gray-500">{scene.industry}</div>
                    )}
                    {scene.ai_citation_score !== null && (
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
                  <Badge variant={selectedScene.tier === 1 ? 'primary' : 'secondary'}>
                    Tier {selectedScene.tier}
                  </Badge>
                  {selectedScene.industry && (
                    <Badge variant="outline">{selectedScene.industry}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => {
                    // TODO: 打开创建 prompt 的对话框
                    onShowBanner('info', '创建 Prompt 功能待实现')
                  }}
                >
                  创建新 Prompt
                </Button>
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
                        <Badge variant="outline" className="ml-2">
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
                                <Badge variant={prompt.status === 'active' ? 'primary' : 'secondary'}>
                                  {prompt.status}
                                </Badge>
                                {prompt.is_published && (
                                  <Badge variant="outline">已发布</Badge>
                                )}
                                <span className="text-xs text-gray-500">v{prompt.version}</span>
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
                              {prompt.content?.substring(0, 200)}...
                            </div>
                            {prompt.rollout_pct < 100 && (
                              <div className="text-xs text-orange-600 mt-1">
                                灰度: {prompt.rollout_pct}%
                              </div>
                            )}
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
