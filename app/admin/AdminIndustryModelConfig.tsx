'use client'

import { useCallback, useEffect, useState } from 'react'
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Textarea } from '@/components/ui'
import { createClient as createSupabaseClient } from '@/lib/supabase/client'
import { INDUSTRIES_100 } from '@/lib/data/industries-100'

interface AdminIndustryModelConfigProps {
  onShowBanner: (type: 'success' | 'error' | 'info', text: string) => void
}

interface IndustryModelConfig {
  id: string
  industry: string
  use_case_type: string
  default_model: string
  fallback_model: string | null
  ultimate_model: string | null
  industry_category: string | null // 'hot', 'cold', 'professional', 'restricted'
  industry_tier: string | null // 'A', 'B', 'C'
  is_enabled: boolean
  priority: number
  notes: string | null
  created_at: string
  updated_at: string
}

const USE_CASE_TYPES = [
  { value: 'advertising-promotion', label: 'Marketing / Ads', short: 'Marketing' },
  { value: 'social-media-content', label: 'Social Media Shorts', short: 'Shorts' },
  { value: 'product-demo-showcase', label: 'Product Demo', short: 'Demo' },
  { value: 'education-explainer', label: 'Education', short: 'Education' },
  { value: 'brand-storytelling', label: 'Branding', short: 'Branding' },
  { value: 'ugc-creator-content', label: 'Local / Lead Gen', short: 'Local' },
] as const

const AVAILABLE_MODELS = [
  { value: 'gemini-2.5-flash', label: '2.5-flash' },
  { value: 'gemini-3-flash', label: '3-flash' },
  { value: 'gemini-3-pro', label: '3-pro' },
]

const INDUSTRY_CATEGORIES = [
  { value: 'hot', label: '热门', color: 'bg-green-100 text-green-800' },
  { value: 'cold', label: '冷门', color: 'bg-blue-100 text-blue-800' },
  { value: 'professional', label: '专业', color: 'bg-purple-100 text-purple-800' },
  { value: 'restricted', label: '限制', color: 'bg-red-100 text-red-800' },
]

const INDUSTRY_TIERS = [
  { value: 'A', label: 'A类（高价）', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'B', label: 'B类（流量）', color: 'bg-blue-100 text-blue-800' },
  { value: 'C', label: 'C类（限制）', color: 'bg-gray-100 text-gray-800' },
]

export default function AdminIndustryModelConfig({ onShowBanner }: AdminIndustryModelConfigProps) {
  const [configs, setConfigs] = useState<IndustryModelConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIndustry, setSelectedIndustry] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    industry: '',
    use_case_type: '',
    default_model: 'gemini-2.5-flash',
    fallback_model: '',
    ultimate_model: '',
    industry_category: '',
    industry_tier: '',
    is_enabled: true,
    priority: 0,
    notes: '',
  })

  const supabase = createSupabaseClient()

  const fetchConfigs = useCallback(async () => {
    try {
      setLoading(true)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('industry_scene_model_configs')
        .select('*')
        .order('industry', { ascending: true })
        .order('use_case_type', { ascending: true })

      if (error) throw error
      setConfigs(data || [])
    } catch (error) {
      console.error('获取配置失败:', error)
      onShowBanner('error', `获取配置失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setLoading(false)
    }
  }, [supabase, onShowBanner])

  useEffect(() => {
    fetchConfigs()
  }, [fetchConfigs])

  const getConfig = (industry: string, useCaseType: string): IndustryModelConfig | null => {
    return configs.find(
      (c) => c.industry === industry && c.use_case_type === useCaseType
    ) || null
  }

  const handleCreate = async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('industry_scene_model_configs')
        .insert([{
          ...formData,
          fallback_model: formData.fallback_model || null,
          ultimate_model: formData.ultimate_model || null,
          industry_category: formData.industry_category || null,
          industry_tier: formData.industry_tier || null,
          notes: formData.notes || null,
        }])

      if (error) throw error
      onShowBanner('success', '配置创建成功')
      resetForm()
      fetchConfigs()
    } catch (error) {
      console.error('创建配置失败:', error)
      onShowBanner('error', `创建失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  const handleUpdate = async (id: string) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('industry_scene_model_configs')
        .update({
          ...formData,
          fallback_model: formData.fallback_model || null,
          ultimate_model: formData.ultimate_model || null,
          industry_category: formData.industry_category || null,
          industry_tier: formData.industry_tier || null,
          notes: formData.notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) throw error
      onShowBanner('success', '配置更新成功')
      setEditingId(null)
      resetForm()
      fetchConfigs()
    } catch (error) {
      console.error('更新配置失败:', error)
      onShowBanner('error', `更新失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 注意：删除功能可以通过编辑配置并禁用来实现，不需要单独的删除按钮

  const handleEdit = (config: IndustryModelConfig) => {
    setEditingId(config.id)
    setFormData({
      industry: config.industry,
      use_case_type: config.use_case_type,
      default_model: config.default_model,
      fallback_model: config.fallback_model || '',
      ultimate_model: config.ultimate_model || '',
      industry_category: config.industry_category || '',
      industry_tier: config.industry_tier || '',
      is_enabled: config.is_enabled,
      priority: config.priority,
      notes: config.notes || '',
    })
  }

  const handleQuickEdit = (industry: string, useCaseType: string) => {
    const config = getConfig(industry, useCaseType)
    if (config) {
      handleEdit(config)
    } else {
      setEditingId(null)
      setFormData({
        industry,
        use_case_type: useCaseType,
        default_model: 'gemini-2.5-flash',
        fallback_model: '',
        ultimate_model: '',
        industry_category: '',
        industry_tier: '',
        is_enabled: true,
        priority: 0,
        notes: '',
      })
    }
  }

  const resetForm = () => {
    setEditingId(null)
    setFormData({
      industry: '',
      use_case_type: '',
      default_model: 'gemini-2.5-flash',
      fallback_model: '',
      ultimate_model: '',
      industry_category: '',
      industry_tier: '',
      is_enabled: true,
      priority: 0,
      notes: '',
    })
  }

  const filteredIndustries = INDUSTRIES_100.filter((industry) => {
    if (searchTerm) {
      return industry.toLowerCase().includes(searchTerm.toLowerCase())
    }
    return true
  })

  const displayedIndustries = selectedIndustry
    ? filteredIndustries.filter((i) => i === selectedIndustry)
    : filteredIndustries.slice(0, 20) // 默认显示前20个

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>行业×场景×模型配置</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">行业 *</label>
                <select
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">选择行业</option>
                  {INDUSTRIES_100.map((industry) => (
                    <option key={industry} value={industry}>
                      {industry}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">场景类型 *</label>
                <select
                  value={formData.use_case_type}
                  onChange={(e) => setFormData({ ...formData, use_case_type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">选择场景</option>
                  {USE_CASE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">默认模型 *</label>
                <select
                  value={formData.default_model}
                  onChange={(e) => setFormData({ ...formData, default_model: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {AVAILABLE_MODELS.map((model) => (
                    <option key={model.value} value={model.value}>
                      {model.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Fallback模型</label>
                <select
                  value={formData.fallback_model}
                  onChange={(e) => setFormData({ ...formData, fallback_model: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">无</option>
                  {AVAILABLE_MODELS.map((model) => (
                    <option key={model.value} value={model.value}>
                      {model.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">终极模型</label>
                <select
                  value={formData.ultimate_model}
                  onChange={(e) => setFormData({ ...formData, ultimate_model: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">无</option>
                  {AVAILABLE_MODELS.map((model) => (
                    <option key={model.value} value={model.value}>
                      {model.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">行业分类</label>
                <select
                  value={formData.industry_category}
                  onChange={(e) => setFormData({ ...formData, industry_category: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">未分类</option>
                  {INDUSTRY_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">行业层级</label>
                <select
                  value={formData.industry_tier}
                  onChange={(e) => setFormData({ ...formData, industry_tier: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">未分类</option>
                  {INDUSTRY_TIERS.map((tier) => (
                    <option key={tier.value} value={tier.value}>
                      {tier.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">优先级</label>
                <Input
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="md:col-span-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_enabled}
                    onChange={(e) => setFormData({ ...formData, is_enabled: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm font-medium">启用</span>
                </label>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">备注</label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-2">
              {editingId ? (
                <>
                  <Button onClick={() => handleUpdate(editingId)}>更新</Button>
                  <Button variant="outline" onClick={resetForm}>取消</Button>
                </>
              ) : (
                <Button onClick={handleCreate} disabled={!formData.industry || !formData.use_case_type}>
                  创建
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>配置矩阵视图</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Input
                placeholder="搜索行业..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <select
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value)}
                className="px-3 py-2 border rounded-lg"
              >
                <option value="">全部行业</option>
                {INDUSTRIES_100.map((industry) => (
                  <option key={industry} value={industry}>
                    {industry}
                  </option>
                ))}
              </select>
            </div>

            {loading ? (
              <div className="text-center py-8 text-gray-500">加载中...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50 dark:bg-gray-800">
                      <th className="text-left p-2 sticky left-0 bg-gray-50 dark:bg-gray-800 z-10">行业</th>
                      {USE_CASE_TYPES.map((type) => (
                        <th key={type.value} className="text-center p-2 min-w-[120px]">
                          {type.short}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayedIndustries.map((industry) => {
                      const industryConfigs = configs.filter((c) => c.industry === industry)
                      const industryConfig = industryConfigs[0] // 获取第一个配置作为行业信息
                      return (
                        <tr key={industry} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="p-2 sticky left-0 bg-white dark:bg-gray-900 z-10">
                            <div className="font-medium">{industry}</div>
                            {industryConfig && (
                              <div className="flex gap-1 mt-1">
                                {industryConfig.industry_category && (
                                  <Badge className={INDUSTRY_CATEGORIES.find(c => c.value === industryConfig.industry_category)?.color || ''}>
                                    {INDUSTRY_CATEGORIES.find(c => c.value === industryConfig.industry_category)?.label}
                                  </Badge>
                                )}
                                {industryConfig.industry_tier && (
                                  <Badge className={INDUSTRY_TIERS.find(t => t.value === industryConfig.industry_tier)?.color || ''}>
                                    {INDUSTRY_TIERS.find(t => t.value === industryConfig.industry_tier)?.label}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </td>
                          {USE_CASE_TYPES.map((type) => {
                            const config = getConfig(industry, type.value)
                            return (
                              <td key={type.value} className="p-2 text-center">
                                {config ? (
                                  <div className="space-y-1">
                                    <Badge variant="secondary" className="text-xs">
                                      {config.default_model.replace('gemini-', '')}
                                    </Badge>
                                    {config.fallback_model && (
                                      <div className="text-xs text-gray-500">
                                        →{config.fallback_model.replace('gemini-', '')}
                                      </div>
                                    )}
                                    {config.ultimate_model && (
                                      <div className="text-xs text-gray-500">
                                        →{config.ultimate_model.replace('gemini-', '')}
                                      </div>
                                    )}
                                    {!config.is_enabled && (
                                      <div className="text-xs text-red-500">禁用</div>
                                    )}
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleQuickEdit(industry, type.value)}
                                      className="mt-1"
                                    >
                                      编辑
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleQuickEdit(industry, type.value)}
                                  >
                                    配置
                                  </Button>
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

