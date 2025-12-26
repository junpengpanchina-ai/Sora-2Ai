'use client'

import { useCallback, useEffect, useState } from 'react'
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { createClient as createSupabaseClient } from '@/lib/supabase/client'

interface AdminSceneModelConfigProps {
  onShowBanner: (type: 'success' | 'error' | 'info', text: string) => void
}

interface SceneModelConfig {
  id: string
  use_case_type: string
  default_model: string
  fallback_model: string | null
  ultimate_model: string | null
  hot_industry_model: string | null // 热门行业使用的模型
  cold_industry_model: string | null // 冷门行业使用的模型
  professional_industry_model: string | null // 专业行业使用的模型
  is_enabled: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

const SCENE_APPS = [
  {
    value: 'advertising-promotion',
    label: 'Marketing / Ads',
    description: '广告转化、获客、投放 - 适合电商、SaaS、本地服务',
    icon: '🎯',
    defaultModel: 'gemini-2.5-flash',
    recommendedModel: 'gemini-2.5-flash',
  },
  {
    value: 'social-media-content',
    label: 'Social Media Shorts',
    description: '曝光、增长、涨粉 - 适合创作者、品牌、娱乐',
    icon: '📱',
    defaultModel: 'gemini-2.5-flash',
    recommendedModel: 'gemini-2.5-flash',
  },
  {
    value: 'product-demo-showcase',
    label: 'Product Demo',
    description: '解释复杂产品 - 适合SaaS、工具类、AI产品',
    icon: '💼',
    defaultModel: 'gemini-2.5-flash',
    recommendedModel: 'gemini-3-flash',
  },
  {
    value: 'education-explainer',
    label: 'Education',
    description: '教学、培训 - 适合在线教育、企业培训',
    icon: '📚',
    defaultModel: 'gemini-2.5-flash',
    recommendedModel: 'gemini-2.5-flash',
  },
  {
    value: 'brand-storytelling',
    label: 'Branding',
    description: '品牌形象 - 适合中大型企业、消费品牌',
    icon: '✨',
    defaultModel: 'gemini-2.5-flash',
    recommendedModel: 'gemini-2.5-flash',
  },
  {
    value: 'ugc-creator-content',
    label: 'Local / Lead Gen',
    description: '到店/咨询 - 适合餐饮、牙科、房产、健身房',
    icon: '📍',
    defaultModel: 'gemini-2.5-flash',
    recommendedModel: 'gemini-3-flash',
  },
] as const

const AVAILABLE_MODELS = [
  { value: 'gemini-2.5-flash', label: 'gemini-2.5-flash（热门行业）', cost: '低' },
  { value: 'gemini-3-flash', label: 'gemini-3-flash（冷门专业）', cost: '中' },
  { value: 'gemini-3-pro', label: 'gemini-3-pro（终极卡点）', cost: '高' },
]

export default function AdminSceneModelConfig({ onShowBanner }: AdminSceneModelConfigProps) {
  const [configs, setConfigs] = useState<SceneModelConfig[]>([])
  const [editingType, setEditingType] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    use_case_type: '',
    default_model: 'gemini-2.5-flash',
    fallback_model: '',
    ultimate_model: '',
    hot_industry_model: '',
    cold_industry_model: '',
    professional_industry_model: '',
    is_enabled: true,
    notes: '',
  })

  const supabase = createSupabaseClient()

  const fetchConfigs = useCallback(async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('scene_model_configs')
        .select('*')
        .order('use_case_type', { ascending: true })

      if (error) {
        // 如果表不存在，返回空数组（首次使用）
        if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
          setConfigs([])
          return
        }
        throw error
      }
      setConfigs(data || [])
    } catch (error) {
      console.error('获取配置失败:', error)
      onShowBanner('error', `获取配置失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }, [supabase, onShowBanner])

  useEffect(() => {
    fetchConfigs()
  }, [fetchConfigs])

  const getConfig = (useCaseType: string): SceneModelConfig | null => {
    return configs.find((c) => c.use_case_type === useCaseType) || null
  }

  const handleSave = async (useCaseType: string) => {
    try {
      const config = getConfig(useCaseType)
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabaseClient = supabase as any
      const updateData = {
        default_model: formData.default_model,
        fallback_model: formData.fallback_model || null,
        ultimate_model: formData.ultimate_model || null,
        hot_industry_model: formData.hot_industry_model || null,
        cold_industry_model: formData.cold_industry_model || null,
        professional_industry_model: formData.professional_industry_model || null,
        is_enabled: formData.is_enabled,
        notes: formData.notes || null,
      }
      
      const { error } = config
        ? await supabaseClient
            .from('scene_model_configs')
            .update({
              ...updateData,
              updated_at: new Date().toISOString(),
            })
            .eq('use_case_type', useCaseType)
        : await supabaseClient
            .from('scene_model_configs')
            .insert([{
              use_case_type: useCaseType,
              ...updateData,
            }])

      if (error) throw error
      onShowBanner('success', config ? '配置更新成功' : '配置创建成功')
      setEditingType(null)
      resetForm()
      fetchConfigs()
    } catch (error) {
      console.error('保存配置失败:', error)
      onShowBanner('error', `保存失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  const handleEdit = (useCaseType: string) => {
    const config = getConfig(useCaseType)
    setEditingType(useCaseType)
    if (config) {
      setFormData({
        use_case_type: config.use_case_type,
        default_model: config.default_model,
        fallback_model: config.fallback_model || '',
        ultimate_model: config.ultimate_model || '',
        hot_industry_model: config.hot_industry_model || '',
        cold_industry_model: config.cold_industry_model || '',
        professional_industry_model: config.professional_industry_model || '',
        is_enabled: config.is_enabled,
        notes: config.notes || '',
      })
    } else {
      const sceneApp = SCENE_APPS.find((s) => s.value === useCaseType)
      setFormData({
        use_case_type: useCaseType,
        default_model: sceneApp?.defaultModel || 'gemini-2.5-flash',
        fallback_model: '',
        ultimate_model: '',
        hot_industry_model: '',
        cold_industry_model: '',
        professional_industry_model: '',
        is_enabled: true,
        notes: '',
      })
    }
  }

  const resetForm = () => {
    setEditingType(null)
    setFormData({
      use_case_type: '',
      default_model: 'gemini-2.5-flash',
      fallback_model: '',
      ultimate_model: '',
      hot_industry_model: '',
      cold_industry_model: '',
      professional_industry_model: '',
      is_enabled: true,
      notes: '',
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>场景应用模型配置</CardTitle>
          <p className="text-sm text-gray-500 mt-2">
            按场景应用配置模型，系统会自动应用到所有行业。热门行业用2.5-flash，冷门专业用3-flash，终极卡点用3-pro。
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {SCENE_APPS.map((sceneApp) => {
              const config = getConfig(sceneApp.value)
              const isEditing = editingType === sceneApp.value

              return (
                <Card key={sceneApp.value} className="border-2">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{sceneApp.icon}</span>
                        <div>
                          <CardTitle className="text-lg">{sceneApp.label}</CardTitle>
                          <p className="text-sm text-gray-500 mt-1">{sceneApp.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {config && (
                          <Badge variant={config.is_enabled ? 'success' : 'secondary'}>
                            {config.is_enabled ? '已配置' : '已禁用'}
                          </Badge>
                        )}
                        <Button
                          size="sm"
                          variant={isEditing ? 'secondary' : 'outline'}
                          onClick={() => isEditing ? resetForm() : handleEdit(sceneApp.value)}
                        >
                          {isEditing ? '取消' : config ? '编辑' : '配置'}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  {isEditing && (
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">默认模型 *</label>
                          <select
                            value={formData.default_model}
                            onChange={(e) => setFormData({ ...formData, default_model: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg"
                          >
                            {AVAILABLE_MODELS.map((model) => (
                              <option key={model.value} value={model.value}>
                                {model.label}（{model.cost}成本）
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
                            <option value="">无（使用默认策略）</option>
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
                            <option value="">无（使用默认策略）</option>
                            {AVAILABLE_MODELS.map((model) => (
                              <option key={model.value} value={model.value}>
                                {model.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">热门行业模型（可选）</label>
                          <select
                            value={formData.hot_industry_model}
                            onChange={(e) => setFormData({ ...formData, hot_industry_model: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg"
                          >
                            <option value="">使用默认模型</option>
                            {AVAILABLE_MODELS.map((model) => (
                              <option key={model.value} value={model.value}>
                                {model.label}
                              </option>
                            ))}
                          </select>
                          <p className="text-xs text-gray-500 mt-1">热门行业（E-commerce, SaaS等）优先使用此模型</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">冷门行业模型（可选）</label>
                          <select
                            value={formData.cold_industry_model}
                            onChange={(e) => setFormData({ ...formData, cold_industry_model: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg"
                          >
                            <option value="">使用默认模型</option>
                            {AVAILABLE_MODELS.map((model) => (
                              <option key={model.value} value={model.value}>
                                {model.label}
                              </option>
                            ))}
                          </select>
                          <p className="text-xs text-gray-500 mt-1">冷门行业优先使用此模型（推荐3-flash）</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">专业行业模型（可选）</label>
                          <select
                            value={formData.professional_industry_model}
                            onChange={(e) => setFormData({ ...formData, professional_industry_model: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg"
                          >
                            <option value="">使用默认模型</option>
                            {AVAILABLE_MODELS.map((model) => (
                              <option key={model.value} value={model.value}>
                                {model.label}
                              </option>
                            ))}
                          </select>
                          <p className="text-xs text-gray-500 mt-1">专业行业（医疗、法律等）优先使用此模型（推荐3-flash或3-pro）</p>
                        </div>
                        <div className="md:col-span-2">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={formData.is_enabled}
                              onChange={(e) => setFormData({ ...formData, is_enabled: e.target.checked })}
                              className="rounded"
                            />
                            <span className="text-sm font-medium">启用此配置</span>
                          </label>
                        </div>
                        <div className="md:col-span-2">
                          <div className="flex gap-2">
                            <Button onClick={() => handleSave(sceneApp.value)}>保存配置</Button>
                            <Button variant="outline" onClick={resetForm}>取消</Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  )}
                  {!isEditing && config && (
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">默认模型：</span>
                          <Badge variant="secondary" className="ml-2">{config.default_model.replace('gemini-', '')}</Badge>
                        </div>
                        {config.fallback_model && (
                          <div>
                            <span className="text-gray-500">Fallback：</span>
                            <Badge variant="secondary" className="ml-2">{config.fallback_model.replace('gemini-', '')}</Badge>
                          </div>
                        )}
                        {config.ultimate_model && (
                          <div>
                            <span className="text-gray-500">终极：</span>
                            <Badge variant="secondary" className="ml-2">{config.ultimate_model.replace('gemini-', '')}</Badge>
                          </div>
                        )}
                        {config.hot_industry_model && (
                          <div>
                            <span className="text-gray-500">热门行业：</span>
                            <Badge variant="secondary" className="ml-2">{config.hot_industry_model.replace('gemini-', '')}</Badge>
                          </div>
                        )}
                        {config.cold_industry_model && (
                          <div>
                            <span className="text-gray-500">冷门行业：</span>
                            <Badge variant="secondary" className="ml-2">{config.cold_industry_model.replace('gemini-', '')}</Badge>
                          </div>
                        )}
                        {config.professional_industry_model && (
                          <div>
                            <span className="text-gray-500">专业行业：</span>
                            <Badge variant="secondary" className="ml-2">{config.professional_industry_model.replace('gemini-', '')}</Badge>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

