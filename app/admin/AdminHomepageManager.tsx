'use client'

import { useCallback, useEffect, useState, useRef } from 'react'
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Textarea } from '@/components/ui'
import { getPublicUrl } from '@/lib/r2/client'

interface AdminHomepageManagerProps {
  onShowBanner: (type: 'success' | 'error', text: string) => void
}

interface HomepageSettings {
  id: string
  hero_badge_text: string
  hero_h1_text: string
  hero_h1_text_logged_in: string
  hero_description: string
  hero_image_paths: string[]
  hero_image_alt_texts: string[]
  hero_video_paths: string[]
  theme_style: 'cosmic' | 'minimal' | 'modern' | 'classic' | 'christmas'
  primary_color: string
  secondary_color: string
  accent_color: string
  background_gradient: string
  cta_primary_text: string
  cta_primary_text_logged_out: string
  cta_secondary_text: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function AdminHomepageManager({ onShowBanner }: AdminHomepageManagerProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<Partial<HomepageSettings>>({})
  const [r2Images, setR2Images] = useState<Array<{ key: string; url: string }>>([])
  const [r2Videos, setR2Videos] = useState<Array<{ key: string; url: string }>>([])
  const [loadingR2Files, setLoadingR2Files] = useState(false)
  const [uploading, setUploading] = useState<Record<string | number, boolean>>({})
  const fileInputRefs = useRef<Record<string | number, HTMLInputElement | null>>({})

  // 加载配置
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/homepage')
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || '加载配置失败')
      }

      if (data.settings) {
        setFormData(data.settings)
      } else {
        // 使用默认值
        const defaults: Partial<HomepageSettings> = {
          hero_badge_text: 'Sora 2 AI Control Center',
          hero_h1_text: 'Turn cinematic ideas into deployable Sora 2.0 workflows.',
          hero_h1_text_logged_in: 'Welcome back, Creator!',
          hero_description: 'Operate from a focused dashboard that keeps the cosmic atmosphere but prioritizes productivity.',
          hero_image_paths: [],
          hero_image_alt_texts: [],
          hero_video_paths: [],
          theme_style: 'cosmic',
          primary_color: '#3B82F6',
          secondary_color: '#8B5CF6',
          accent_color: '#F59E0B',
          background_gradient: 'cosmic-space',
          cta_primary_text: 'Open Video Console',
          cta_primary_text_logged_out: 'Sign in to Start',
          cta_secondary_text: 'Browse Prompt Library',
        }
        setFormData(defaults)
      }
    } catch (error) {
      console.error('加载首页配置失败:', error)
      onShowBanner('error', error instanceof Error ? error.message : '加载配置失败')
    } finally {
      setLoading(false)
    }
  }, [onShowBanner])

  useEffect(() => {
    loadSettings()
    loadR2Files()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 加载R2文件列表
  const loadR2Files = useCallback(async () => {
    try {
      setLoadingR2Files(true)
      const [imagesResponse, videosResponse] = await Promise.all([
        fetch('/api/admin/r2/list?type=image&maxKeys=100'),
        fetch('/api/admin/r2/list?type=video&maxKeys=100'),
      ])

      const imagesData = await imagesResponse.json()
      const videosData = await videosResponse.json()

      if (imagesData.success) {
        setR2Images(imagesData.files.map((f: { key: string; url: string | null }) => ({
          key: f.key || '',
          url: f.url || getPublicUrl(f.key || ''),
        })))
      }

      if (videosData.success) {
        setR2Videos(videosData.files.map((f: { key: string; url: string | null }) => ({
          key: f.key || '',
          url: f.url || getPublicUrl(f.key || ''),
        })))
      }
    } catch (error) {
      console.error('加载R2文件列表失败:', error)
    } finally {
      setLoadingR2Files(false)
    }
  }, [])

  // 上传文件到R2
  const handleFileUpload = useCallback(async (file: File, index: number, type: 'image' | 'video') => {
    try {
      const uploadKey = type === 'video' ? `video-${index}` : index
      setUploading((prev) => ({ ...prev, [uploadKey]: true }))
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      uploadFormData.append('folder', type === 'image' ? 'images' : 'videos')

      const response = await fetch('/api/admin/r2/upload', {
        method: 'POST',
        body: uploadFormData,
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || '上传失败')
      }

      // 更新表单数据
      const field = type === 'image' ? 'hero_image_paths' : 'hero_video_paths'
      setFormData((prev) => {
        const currentArray = (prev[field] as string[]) || []
        const newArray = [...currentArray]
        newArray[index] = data.file.key
        return { ...prev, [field]: newArray }
      })

      // 刷新文件列表
      await loadR2Files()

      onShowBanner('success', '文件上传成功')
    } catch (error) {
      console.error('上传文件失败:', error)
      onShowBanner('error', error instanceof Error ? error.message : '上传失败')
    } finally {
      const uploadKey = type === 'video' ? `video-${index}` : index
      setUploading((prev) => ({ ...prev, [uploadKey]: false }))
    }
  }, [loadR2Files, onShowBanner])

  // 保存配置
  const handleSave = useCallback(async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/admin/homepage', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || '保存失败')
      }

      onShowBanner('success', '首页配置已保存')
    } catch (error) {
      console.error('保存首页配置失败:', error)
      onShowBanner('error', error instanceof Error ? error.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }, [formData, onShowBanner])

  // 处理数组字段更新
  const updateArrayField = (field: keyof HomepageSettings, index: number, value: string) => {
    const currentArray = (formData[field] as string[]) || []
    const newArray = [...currentArray]
    newArray[index] = value
    setFormData((prev) => ({ ...prev, [field]: newArray }))
  }

  const addArrayItem = (field: keyof HomepageSettings, defaultValue = '') => {
    const currentArray = (formData[field] as string[]) || []
    setFormData((prev) => ({ ...prev, [field]: [...currentArray, defaultValue] }))
  }

  const removeArrayItem = (field: keyof HomepageSettings, index: number) => {
    const currentArray = (formData[field] as string[]) || []
    const newArray = currentArray.filter((_, i) => i !== index)
    setFormData((prev) => ({ ...prev, [field]: newArray }))
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-gray-500">加载中...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>首页配置管理</CardTitle>
          <p className="text-sm text-gray-500">管理首页的标题、描述、图片、视频和风格设置</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Hero Section 配置 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Hero Section（顶部横幅区域）</h3>

            <div>
              <label className="block text-sm font-medium mb-1">Badge 文本</label>
              <Input
                value={formData.hero_badge_text || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, hero_badge_text: e.target.value }))}
                placeholder="例如: Sora 2 AI Control Center"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">H1 标题（未登录用户）</label>
              <Input
                value={formData.hero_h1_text || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, hero_h1_text: e.target.value }))}
                placeholder="主标题文本"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">H1 标题（已登录用户）</label>
              <Input
                value={formData.hero_h1_text_logged_in || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, hero_h1_text_logged_in: e.target.value }))}
                placeholder="例如: Welcome back, {name}!"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">描述文本</label>
              <Textarea
                value={formData.hero_description || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, hero_description: e.target.value }))}
                placeholder="描述文本"
                rows={3}
              />
            </div>
          </div>

          {/* 图片配置 - 九宫格展示 */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">图片配置</h3>
                <p className="text-sm text-gray-500">从R2选择图片或上传新图片，九宫格展示</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={loadR2Files}
                  disabled={loadingR2Files}
                >
                  {loadingR2Files ? '刷新中...' : '刷新列表'}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => addArrayItem('hero_image_paths')}
                >
                  + 添加图片
                </Button>
              </div>
            </div>

            {/* 九宫格展示 */}
            <div className="grid grid-cols-3 gap-4">
              {(formData.hero_image_paths || []).map((path, index) => (
                <div key={index} className="border rounded-lg p-3 space-y-2 bg-gray-50 dark:bg-gray-900">
                  {/* 图片预览 */}
                  <div className="relative w-full aspect-square border rounded overflow-hidden bg-gray-100 dark:bg-gray-800">
                    {path ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={getPublicUrl(path)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            const parent = target.parentElement
                            if (parent) {
                              parent.innerHTML = '<div class="flex items-center justify-center h-full text-gray-400 text-xs">图片加载失败</div>'
                            }
                          }}
                        />
                        <Button
                          variant="secondary"
                          size="sm"
                          className="absolute top-1 right-1 h-6 w-6 p-0 bg-red-500 hover:bg-red-600 text-white"
                          onClick={() => removeArrayItem('hero_image_paths', index)}
                        >
                          ×
                        </Button>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400 text-xs">
                        未设置
                      </div>
                    )}
                  </div>

                  {/* 路径选择器 */}
                  <div>
                    <select
                      value={path}
                      onChange={(e) => updateArrayField('hero_image_paths', index, e.target.value)}
                      className="w-full px-2 py-1 border rounded text-xs"
                    >
                      <option value="">-- 选择图片 --</option>
                      {r2Images.map((img) => (
                        <option key={img.key} value={img.key}>
                          {img.key.split('/').pop()}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Alt文本 */}
                  <Input
                    value={(formData.hero_image_alt_texts || [])[index] || ''}
                    onChange={(e) => updateArrayField('hero_image_alt_texts', index, e.target.value)}
                    placeholder={`Alt ${index + 1}`}
                    className="text-xs h-8"
                  />

                  {/* 上传按钮 */}
                  <div>
                    <input
                      ref={(el) => {
                        fileInputRefs.current[index] = el
                      }}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          handleFileUpload(file, index, 'image')
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => fileInputRefs.current[index]?.click()}
                      disabled={uploading[index]}
                      className="w-full h-8 text-xs"
                    >
                      {uploading[index] ? '上传中...' : '上传'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 视频配置 - 九宫格展示 */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">视频配置</h3>
                <p className="text-sm text-gray-500">从R2选择视频或上传新视频，九宫格展示</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={loadR2Files}
                  disabled={loadingR2Files}
                >
                  {loadingR2Files ? '刷新中...' : '刷新列表'}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => addArrayItem('hero_video_paths')}
                >
                  + 添加视频
                </Button>
              </div>
            </div>

            {/* 九宫格展示 */}
            <div className="grid grid-cols-3 gap-4">
              {(formData.hero_video_paths || []).map((path, index) => (
                <div key={index} className="border rounded-lg p-3 space-y-2 bg-gray-50 dark:bg-gray-900">
                  {/* 视频预览 */}
                  <div className="relative w-full aspect-square border rounded overflow-hidden bg-gray-100 dark:bg-gray-800">
                    {path ? (
                      <>
                        <video
                          src={getPublicUrl(path)}
                          className="w-full h-full object-cover"
                          controls
                          muted
                        />
                        <Button
                          variant="secondary"
                          size="sm"
                          className="absolute top-1 right-1 h-6 w-6 p-0 bg-red-500 hover:bg-red-600 text-white"
                          onClick={() => removeArrayItem('hero_video_paths', index)}
                        >
                          ×
                        </Button>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400 text-xs">
                        未设置
                      </div>
                    )}
                  </div>

                  {/* 路径选择器 */}
                  <div>
                    <select
                      value={path}
                      onChange={(e) => updateArrayField('hero_video_paths', index, e.target.value)}
                      className="w-full px-2 py-1 border rounded text-xs"
                    >
                      <option value="">-- 选择视频 --</option>
                      {r2Videos.map((video) => (
                        <option key={video.key} value={video.key}>
                          {video.key.split('/').pop()}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 上传按钮 */}
                  <div>
                    <input
                      ref={(el) => {
                        fileInputRefs.current[`video-${index}`] = el
                      }}
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          handleFileUpload(file, index, 'video')
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => fileInputRefs.current[`video-${index}`]?.click()}
                      disabled={uploading[`video-${index}`]}
                      className="w-full h-8 text-xs"
                    >
                      {uploading[`video-${index}`] ? '上传中...' : '上传'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 风格配置 */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-lg font-semibold">风格配置</h3>

            <div>
              <label className="block text-sm font-medium mb-1">主题风格</label>
              <select
                value={formData.theme_style || 'cosmic'}
                onChange={(e) => setFormData((prev) => ({ ...prev, theme_style: e.target.value as HomepageSettings['theme_style'] }))}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="cosmic">Cosmic（宇宙风格）</option>
                <option value="minimal">Minimal（简约风格）</option>
                <option value="modern">Modern（现代风格）</option>
                <option value="classic">Classic（经典风格）</option>
                <option value="christmas">Christmas（圣诞节风格）🎄</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">主色调</label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={formData.primary_color || '#3B82F6'}
                    onChange={(e) => setFormData((prev) => ({ ...prev, primary_color: e.target.value }))}
                    className="w-16 h-10"
                  />
                  <Input
                    value={formData.primary_color || '#3B82F6'}
                    onChange={(e) => setFormData((prev) => ({ ...prev, primary_color: e.target.value }))}
                    placeholder="#3B82F6"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">次色调</label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={formData.secondary_color || '#8B5CF6'}
                    onChange={(e) => setFormData((prev) => ({ ...prev, secondary_color: e.target.value }))}
                    className="w-16 h-10"
                  />
                  <Input
                    value={formData.secondary_color || '#8B5CF6'}
                    onChange={(e) => setFormData((prev) => ({ ...prev, secondary_color: e.target.value }))}
                    placeholder="#8B5CF6"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">强调色</label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={formData.accent_color || '#F59E0B'}
                    onChange={(e) => setFormData((prev) => ({ ...prev, accent_color: e.target.value }))}
                    className="w-16 h-10"
                  />
                  <Input
                    value={formData.accent_color || '#F59E0B'}
                    onChange={(e) => setFormData((prev) => ({ ...prev, accent_color: e.target.value }))}
                    placeholder="#F59E0B"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">背景渐变样式</label>
              <Input
                value={formData.background_gradient || 'cosmic-space'}
                onChange={(e) => setFormData((prev) => ({ ...prev, background_gradient: e.target.value }))}
                placeholder="cosmic-space"
              />
            </div>
          </div>

          {/* 按钮文本配置 */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-lg font-semibold">按钮文本配置</h3>

            <div>
              <label className="block text-sm font-medium mb-1">主要按钮文本（已登录）</label>
              <Input
                value={formData.cta_primary_text || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, cta_primary_text: e.target.value }))}
                placeholder="例如: Open Video Console"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">主要按钮文本（未登录）</label>
              <Input
                value={formData.cta_primary_text_logged_out || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, cta_primary_text_logged_out: e.target.value }))}
                placeholder="例如: Sign in to Start"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">次要按钮文本</label>
              <Input
                value={formData.cta_secondary_text || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, cta_secondary_text: e.target.value }))}
                placeholder="例如: Browse Prompt Library"
              />
            </div>
          </div>

          {/* 保存按钮 */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <Button
              variant="secondary"
              onClick={loadSettings}
              disabled={saving}
            >
              重置
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? '保存中...' : '保存配置'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 支付计划管理 */}
      <PaymentPlansManager onShowBanner={onShowBanner} />
    </div>
  )
}

// 支付计划管理组件
interface PaymentPlan {
  id: string
  plan_name: string
  plan_type: 'basic' | 'professional' | 'custom'
  display_order: number
  amount: number
  currency: string
  credits: number
  videos: number
  description: string | null
  badge_text: string | null
  stripe_buy_button_id: string | null
  stripe_payment_link_id: string | null
  is_active: boolean
  is_recommended: boolean
  created_at: string
  updated_at: string
}

function PaymentPlansManager({ onShowBanner }: { onShowBanner: (type: 'success' | 'error', text: string) => void }) {
  const [plans, setPlans] = useState<PaymentPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<PaymentPlan>>({})
  const [showAddForm, setShowAddForm] = useState(false)
  const [newForm, setNewForm] = useState<Partial<PaymentPlan>>({})

  const loadPlans = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/payment-plans')
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || '加载支付计划失败')
      }

      setPlans(data.plans || [])
    } catch (error) {
      console.error('加载支付计划失败:', error)
      onShowBanner('error', error instanceof Error ? error.message : '加载支付计划失败')
    } finally {
      setLoading(false)
    }
  }, [onShowBanner])

  useEffect(() => {
    loadPlans()
  }, [loadPlans])

  const handleSave = useCallback(async (plan: PaymentPlan) => {
    try {
      setSaving((prev) => ({ ...prev, [plan.id]: true }))
      const response = await fetch('/api/admin/payment-plans', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...plan, ...editForm }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || '保存失败')
      }

      setEditingId(null)
      setEditForm({})
      await loadPlans()
      onShowBanner('success', '支付计划已更新')
    } catch (error) {
      console.error('保存支付计划失败:', error)
      onShowBanner('error', error instanceof Error ? error.message : '保存失败')
    } finally {
      setSaving((prev) => ({ ...prev, [plan.id]: false }))
    }
  }, [editForm, loadPlans, onShowBanner])

  const handleCreate = useCallback(async () => {
    try {
      setSaving((prev) => ({ ...prev, new: true }))
      const response = await fetch('/api/admin/payment-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newForm),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || '创建失败')
      }

      setShowAddForm(false)
      setNewForm({})
      await loadPlans()
      onShowBanner('success', '支付计划已创建')
    } catch (error) {
      console.error('创建支付计划失败:', error)
      onShowBanner('error', error instanceof Error ? error.message : '创建失败')
    } finally {
      setSaving((prev) => ({ ...prev, new: false }))
    }
  }, [newForm, loadPlans, onShowBanner])

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-gray-500">加载支付计划中...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>支付计划管理</CardTitle>
            <p className="text-sm text-gray-500">管理支付计划的名称、价格、描述、Stripe按钮ID等</p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowAddForm(true)}
          >
            + 添加计划
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 添加新计划表单 */}
        {showAddForm && (
          <div className="border rounded-lg p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
            <h4 className="font-semibold">添加新支付计划</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">计划名称</label>
                <Input
                  value={newForm.plan_name || ''}
                  onChange={(e) => setNewForm((prev) => ({ ...prev, plan_name: e.target.value }))}
                  placeholder="例如: Basic Plan"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">计划类型</label>
                <select
                  value={newForm.plan_type || 'custom'}
                  onChange={(e) => setNewForm((prev) => ({ ...prev, plan_type: e.target.value as PaymentPlan['plan_type'] }))}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="basic">Basic</option>
                  <option value="professional">Professional</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">价格 ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={newForm.amount || ''}
                  onChange={(e) => setNewForm((prev) => ({ ...prev, amount: parseFloat(e.target.value) }))}
                  placeholder="39.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">视频数量</label>
                <Input
                  type="number"
                  value={newForm.videos || ''}
                  onChange={(e) => setNewForm((prev) => ({ ...prev, videos: parseInt(e.target.value) }))}
                  placeholder="50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">积分数量</label>
                <Input
                  type="number"
                  value={newForm.credits || ''}
                  onChange={(e) => setNewForm((prev) => ({ ...prev, credits: parseInt(e.target.value) }))}
                  placeholder="500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">显示顺序</label>
                <Input
                  type="number"
                  value={newForm.display_order || 0}
                  onChange={(e) => setNewForm((prev) => ({ ...prev, display_order: parseInt(e.target.value) }))}
                  placeholder="0"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">描述</label>
                <Textarea
                  value={newForm.description || ''}
                  onChange={(e) => setNewForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Perfect for individual users and small projects"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Stripe Buy Button ID</label>
                <Input
                  value={newForm.stripe_buy_button_id || ''}
                  onChange={(e) => setNewForm((prev) => ({ ...prev, stripe_buy_button_id: e.target.value }))}
                  placeholder="buy_btn_xxxxx"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Stripe Payment Link ID</label>
                <Input
                  value={newForm.stripe_payment_link_id || ''}
                  onChange={(e) => setNewForm((prev) => ({ ...prev, stripe_payment_link_id: e.target.value }))}
                  placeholder="dRmcN55nY4k33WXfPa0kE03"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">徽章文本（可选）</label>
                <Input
                  value={newForm.badge_text || ''}
                  onChange={(e) => setNewForm((prev) => ({ ...prev, badge_text: e.target.value }))}
                  placeholder="Recommended"
                />
              </div>
              <div className="col-span-2 flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newForm.is_active !== false}
                    onChange={(e) => setNewForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                  />
                  <span className="text-sm">启用</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newForm.is_recommended || false}
                    onChange={(e) => setNewForm((prev) => ({ ...prev, is_recommended: e.target.checked }))}
                  />
                  <span className="text-sm">推荐</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setShowAddForm(false)
                  setNewForm({})
                }}
              >
                取消
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleCreate}
                disabled={saving.new}
              >
                {saving.new ? '创建中...' : '创建计划'}
              </Button>
            </div>
          </div>
        )}

        {/* 计划列表 */}
        {plans.map((plan) => (
          <div key={plan.id} className="border rounded-lg p-4 space-y-4">
            {editingId === plan.id ? (
              // 编辑模式
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">计划名称</label>
                    <Input
                      value={editForm.plan_name ?? plan.plan_name}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, plan_name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">计划类型</label>
                    <select
                      value={editForm.plan_type ?? plan.plan_type}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, plan_type: e.target.value as PaymentPlan['plan_type'] }))}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="basic">Basic</option>
                      <option value="professional">Professional</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">价格 ($)</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editForm.amount ?? plan.amount}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, amount: parseFloat(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">视频数量</label>
                    <Input
                      type="number"
                      value={editForm.videos ?? plan.videos}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, videos: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">积分数量</label>
                    <Input
                      type="number"
                      value={editForm.credits ?? plan.credits}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, credits: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">显示顺序</label>
                    <Input
                      type="number"
                      value={editForm.display_order ?? plan.display_order}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, display_order: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">描述</label>
                    <Textarea
                      value={editForm.description ?? plan.description ?? ''}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Stripe Buy Button ID</label>
                    <Input
                      value={editForm.stripe_buy_button_id ?? plan.stripe_buy_button_id ?? ''}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, stripe_buy_button_id: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Stripe Payment Link ID</label>
                    <Input
                      value={editForm.stripe_payment_link_id ?? plan.stripe_payment_link_id ?? ''}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, stripe_payment_link_id: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">徽章文本（可选）</label>
                    <Input
                      value={editForm.badge_text ?? plan.badge_text ?? ''}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, badge_text: e.target.value }))}
                    />
                  </div>
                  <div className="col-span-2 flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editForm.is_active !== undefined ? editForm.is_active : plan.is_active}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                      />
                      <span className="text-sm">启用</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editForm.is_recommended !== undefined ? editForm.is_recommended : plan.is_recommended}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, is_recommended: e.target.checked }))}
                      />
                      <span className="text-sm">推荐</span>
                    </label>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setEditingId(null)
                      setEditForm({})
                    }}
                  >
                    取消
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleSave(plan)}
                    disabled={saving[plan.id]}
                  >
                    {saving[plan.id] ? '保存中...' : '保存'}
                  </Button>
                </div>
              </div>
            ) : (
              // 查看模式
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-lg">{plan.plan_name}</h4>
                    {plan.badge_text && (
                      <span className="inline-block px-2 py-1 text-xs bg-energy-water text-white rounded">
                        {plan.badge_text}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded ${plan.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {plan.is_active ? '启用' : '禁用'}
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setEditingId(plan.id)
                        setEditForm({})
                      }}
                    >
                      编辑
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">价格:</span>
                    <span className="ml-2 font-semibold">${plan.amount} {plan.currency.toUpperCase()}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">视频:</span>
                    <span className="ml-2 font-semibold">{plan.videos}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">积分:</span>
                    <span className="ml-2 font-semibold">{plan.credits}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">单价:</span>
                    <span className="ml-2 font-semibold">~ ${(plan.amount / plan.videos).toFixed(2)}/video</span>
                  </div>
                </div>
                {plan.description && (
                  <p className="text-sm text-gray-600">{plan.description}</p>
                )}
                <div className="text-xs text-gray-500 space-y-1">
                  {plan.stripe_buy_button_id && (
                    <div>Stripe Button ID: <code className="bg-gray-100 px-1 rounded">{plan.stripe_buy_button_id}</code></div>
                  )}
                  {plan.stripe_payment_link_id && (
                    <div>Payment Link ID: <code className="bg-gray-100 px-1 rounded">{plan.stripe_payment_link_id}</code></div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

