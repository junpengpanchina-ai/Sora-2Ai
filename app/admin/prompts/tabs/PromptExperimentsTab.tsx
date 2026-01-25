'use client'

import { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, Input, Button, Badge } from '@/components/ui'

interface PromptExperimentsTabProps {
  onShowBanner: (type: 'success' | 'error' | 'info', text: string) => void
}

/**
 * Prompt Experiments Tab
 * 
 * AB/灰度实验管理
 * - 展示 rollout_pct、权重、最近 7 天 success/quality
 * - 一键"停止实验 / 全量发布 / 回滚"
 */
export default function PromptExperimentsTab({ onShowBanner }: PromptExperimentsTabProps) {
  const [experiments, setExperiments] = useState<Array<{
    id: string
    scene_id?: string
    model_id?: string
    role?: string
    version?: number
    rollout_pct?: number
    weight?: number
    parent_id?: string | null
    content?: string
    ab_data_sufficient?: boolean | null
    executions_7d?: number | null
    success_rate_7d?: number | null
    ltv_gate_color?: 'RED' | 'YELLOW' | 'GREEN' | null
  }>>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // 加载实验数据
  const fetchExperiments = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(
        '/api/admin/prompt-templates?experiments_only=true&page=1&page_size=200&sort_by=updated_at&sort_dir=desc'
      )
      const data = await response.json()
      if (response.ok && data.items) {
        setExperiments(data.items)
      }
    } catch (error) {
      console.error('加载实验数据失败:', error)
      onShowBanner('error', '加载实验数据失败')
    } finally {
      setLoading(false)
    }
  }, [onShowBanner])

  useEffect(() => {
    fetchExperiments()
  }, [fetchExperiments])

  const filteredExperiments = experiments.filter((exp) => {
    const matchesSearch = searchQuery === '' || 
      exp.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.scene_id?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const handleStopExperiment = async () => {
    if (!window.confirm('确定要停止这个实验吗？')) return
    
    try {
      // TODO: 创建 API 端点
      onShowBanner('info', '功能开发中...')
    } catch {
      onShowBanner('error', '停止实验失败')
    }
  }

  const handleFullRollout = async () => {
    if (!window.confirm('确定要全量发布这个 prompt 吗？')) return
    
    try {
      // TODO: 创建 API 端点
      onShowBanner('info', '功能开发中...')
    } catch {
      onShowBanner('error', '全量发布失败')
    }
  }

  const handleRollback = async () => {
    if (!window.confirm('确定要回滚这个 prompt 吗？')) return
    
    try {
      // TODO: 创建 API 端点
      onShowBanner('info', '功能开发中...')
    } catch {
      onShowBanner('error', '回滚失败')
    }
  }

  return (
    <div className="space-y-6">
      {/* 说明卡片 */}
      <Card className="border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950/30">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="text-purple-600 dark:text-purple-400">🧪</div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-1">
                AB/灰度实验说明
              </h3>
              <p className="text-sm text-purple-700 dark:text-purple-200">
                管理正在进行的 prompt 实验。可以查看成功率、质量分数，并进行停止实验、全量发布、回滚等操作。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 实验列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>进行中的实验</CardTitle>
            <Input
              placeholder="搜索实验..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">加载中...</div>
          ) : filteredExperiments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchQuery 
                ? '没有找到匹配的实验'
                : '当前没有进行中的实验'}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredExperiments.map((exp) => (
                <Card key={exp.id} className="border-gray-200 dark:border-gray-700">
                  <CardContent className="pt-4">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                            {exp.content ? exp.content.slice(0, 40) : 'Experiment'}
                            </h3>
                            <Badge variant="secondary">{exp.model_id || 'unknown'}</Badge>
                            <Badge variant="secondary">{exp.role || 'default'}</Badge>
                            {exp.version && <Badge variant="secondary">v{exp.version}</Badge>}
                          {exp.ab_data_sufficient === false ? (
                            <Badge variant="secondary">样本不足</Badge>
                          ) : exp.ab_data_sufficient === true ? (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              样本充足
                            </Badge>
                          ) : null}
                          {exp.ltv_gate_color ? (
                            exp.ltv_gate_color === 'GREEN' ? (
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                LTV GREEN
                              </Badge>
                            ) : exp.ltv_gate_color === 'YELLOW' ? (
                              <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                LTV YELLOW
                              </Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                LTV RED
                              </Badge>
                            )
                          ) : null}
                          </div>
                          {exp.scene_id && (
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              场景ID: {exp.scene_id.substring(0, 8)}...
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {(exp.rollout_pct ?? 0) < 100 && (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={handleStopExperiment}
                              >
                                停止实验
                              </Button>
                              <Button 
                                variant="primary" 
                                size="sm"
                                onClick={handleFullRollout}
                              >
                                全量发布
                              </Button>
                            </>
                          )}
                          {exp.parent_id && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={handleRollback}
                            >
                              回滚
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {/* 实验数据 */}
                      <div className="grid grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">灰度百分比</div>
                          <div className="text-lg font-semibold text-gray-900 dark:text-white">
                            {(exp.rollout_pct ?? 0)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">权重</div>
                          <div className="text-lg font-semibold text-gray-900 dark:text-white">
                            {exp.weight || 100}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">成功率</div>
                          <div className="text-lg font-semibold text-gray-900 dark:text-white">
                            {typeof exp.success_rate_7d === 'number'
                              ? `${Math.round(exp.success_rate_7d * 100)}%`
                              : '—'}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">质量分数</div>
                          <div className="text-lg font-semibold text-gray-900 dark:text-white">
                            {/* 这里暂用 executions_7d 作为可观测指标占位；后续可接 quality_score */}
                            {exp.executions_7d ?? '—'}
                          </div>
                        </div>
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
