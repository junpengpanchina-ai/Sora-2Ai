'use client'

import { useCallback, useEffect, useState } from 'react'
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Textarea } from '@/components/ui'
import { createClient as createSupabaseClient } from '@/lib/supabase/client'

interface AdminGeoManagerProps {
  onShowBanner: (type: 'success' | 'error' | 'info', text: string) => void
}

interface GeoConfig {
  id: string
  geo_code: string
  geo_name: string
  is_active: boolean
  default_model: string
  priority: number
  notes: string | null
  created_at: string
  updated_at: string
}

const AVAILABLE_MODELS = [
  { value: 'gemini-2.5-flash', label: 'gemini-2.5-flash (热门行业默认)' },
  { value: 'gemini-3-flash', label: 'gemini-3-flash (冷门专业)' },
  { value: 'gemini-3-pro', label: 'gemini-3-pro (终极卡点)' },
]

export default function AdminGeoManager({ onShowBanner }: AdminGeoManagerProps) {
  const [geoConfigs, setGeoConfigs] = useState<GeoConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    geo_code: '',
    geo_name: '',
    is_active: true,
    default_model: 'gemini-2.5-flash',
    priority: 0,
    notes: '',
  })

  const supabase = createSupabaseClient()

  const fetchGeoConfigs = useCallback(async () => {
    try {
      setLoading(true)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('geo_configs')
        .select('*')
        .order('priority', { ascending: false })
        .order('geo_code', { ascending: true })

      if (error) throw error
      setGeoConfigs(data || [])
    } catch (error) {
      console.error('获取GEO配置失败:', error)
      onShowBanner('error', `获取GEO配置失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setLoading(false)
    }
  }, [supabase, onShowBanner])

  useEffect(() => {
    fetchGeoConfigs()
  }, [fetchGeoConfigs])

  const handleCreate = async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('geo_configs')
        .insert([{
          ...formData,
          notes: formData.notes || null,
        }])

      if (error) throw error
      onShowBanner('success', 'GEO配置创建成功')
      setFormData({
        geo_code: '',
        geo_name: '',
        is_active: true,
        default_model: 'gemini-2.5-flash',
        priority: 0,
        notes: '',
      })
      fetchGeoConfigs()
    } catch (error) {
      console.error('创建GEO配置失败:', error)
      onShowBanner('error', `创建失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  const handleUpdate = async (id: string) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('geo_configs')
        .update({
          ...formData,
          notes: formData.notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) throw error
      onShowBanner('success', 'GEO配置更新成功')
      setEditingId(null)
      setFormData({
        geo_code: '',
        geo_name: '',
        is_active: true,
        default_model: 'gemini-2.5-flash',
        priority: 0,
        notes: '',
      })
      fetchGeoConfigs()
    } catch (error) {
      console.error('更新GEO配置失败:', error)
      onShowBanner('error', `更新失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个GEO配置吗？')) return

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('geo_configs')
        .delete()
        .eq('id', id)

      if (error) throw error
      onShowBanner('success', 'GEO配置删除成功')
      fetchGeoConfigs()
    } catch (error) {
      console.error('删除GEO配置失败:', error)
      onShowBanner('error', `删除失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  const handleEdit = (config: GeoConfig) => {
    setEditingId(config.id)
    setFormData({
      geo_code: config.geo_code,
      geo_name: config.geo_name,
      is_active: config.is_active,
      default_model: config.default_model,
      priority: config.priority,
      notes: config.notes || '',
    })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setFormData({
      geo_code: '',
      geo_name: '',
      is_active: true,
      default_model: 'gemini-2.5-flash',
      priority: 0,
      notes: '',
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>GEO配置管理</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">地区代码 *</label>
                <Input
                  value={formData.geo_code}
                  onChange={(e) => setFormData({ ...formData, geo_code: e.target.value.toUpperCase() })}
                  placeholder="如: US, CN, GB"
                  disabled={!!editingId}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">地区名称 *</label>
                <Input
                  value={formData.geo_name}
                  onChange={(e) => setFormData({ ...formData, geo_name: e.target.value })}
                  placeholder="如: United States, China"
                />
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
                <label className="block text-sm font-medium mb-1">优先级</label>
                <Input
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                  placeholder="数字越大优先级越高"
                />
              </div>
              <div className="md:col-span-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
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
                  placeholder="可选备注信息"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-2">
              {editingId ? (
                <>
                  <Button onClick={() => handleUpdate(editingId)}>更新</Button>
                  <Button variant="outline" onClick={handleCancelEdit}>取消</Button>
                </>
              ) : (
                <Button onClick={handleCreate} disabled={!formData.geo_code || !formData.geo_name}>
                  创建
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>GEO配置列表 ({geoConfigs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">加载中...</div>
          ) : geoConfigs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">暂无GEO配置</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">地区代码</th>
                    <th className="text-left p-2">地区名称</th>
                    <th className="text-left p-2">默认模型</th>
                    <th className="text-left p-2">优先级</th>
                    <th className="text-left p-2">状态</th>
                    <th className="text-left p-2">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {geoConfigs.map((config) => (
                    <tr key={config.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="p-2 font-mono">{config.geo_code}</td>
                      <td className="p-2">{config.geo_name}</td>
                      <td className="p-2">
                        <Badge variant="secondary">{config.default_model}</Badge>
                      </td>
                      <td className="p-2">{config.priority}</td>
                      <td className="p-2">
                        <Badge variant={config.is_active ? 'default' : 'secondary'}>
                          {config.is_active ? '启用' : '禁用'}
                        </Badge>
                      </td>
                      <td className="p-2">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(config)}>
                            编辑
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => handleDelete(config.id)}>
                            删除
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

