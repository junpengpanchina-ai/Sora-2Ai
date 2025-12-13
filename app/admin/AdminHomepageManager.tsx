'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Textarea } from '@/components/ui'

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
  theme_style: 'cosmic' | 'minimal' | 'modern' | 'classic'
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
  }, [loadSettings])

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

          {/* 图片配置 */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-lg font-semibold">图片配置</h3>
            <p className="text-sm text-gray-500">输入R2存储的图片路径（例如: images/hero.jpg）</p>

            {(formData.hero_image_paths || []).map((path, index) => (
              <div key={index} className="flex gap-2 items-start">
                <div className="flex-1">
                  <Input
                    value={path}
                    onChange={(e) => updateArrayField('hero_image_paths', index, e.target.value)}
                    placeholder={`图片路径 ${index + 1}`}
                  />
                  <Input
                    value={(formData.hero_image_alt_texts || [])[index] || ''}
                    onChange={(e) => updateArrayField('hero_image_alt_texts', index, e.target.value)}
                    placeholder={`Alt 文本 ${index + 1}`}
                    className="mt-2"
                  />
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => removeArrayItem('hero_image_paths', index)}
                >
                  删除
                </Button>
              </div>
            ))}

            <Button
              variant="secondary"
              size="sm"
              onClick={() => addArrayItem('hero_image_paths')}
            >
              + 添加图片
            </Button>
          </div>

          {/* 视频配置 */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-lg font-semibold">视频配置</h3>
            <p className="text-sm text-gray-500">输入R2存储的视频路径（例如: videos/demo.mp4）</p>

            {(formData.hero_video_paths || []).map((path, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={path}
                  onChange={(e) => updateArrayField('hero_video_paths', index, e.target.value)}
                  placeholder={`视频路径 ${index + 1}`}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => removeArrayItem('hero_video_paths', index)}
                >
                  删除
                </Button>
              </div>
            ))}

            <Button
              variant="secondary"
              size="sm"
              onClick={() => addArrayItem('hero_video_paths')}
            >
              + 添加视频
            </Button>
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
    </div>
  )
}

