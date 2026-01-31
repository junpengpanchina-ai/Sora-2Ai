'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Textarea } from '@/components/ui'

interface AdminKeywordOptimizationProps {
  onShowBanner: (type: 'success' | 'error' | 'info', text: string) => void
}

interface OptimizationItem {
  id: string
  keyword: string
  priority: 'high' | 'medium' | 'low'
  status: 'active' | 'inactive'
  adjustment_reason: string | null
  source: string
  search_volume: number | null
  trend_data: unknown
  created_at: string
  updated_at: string
}

type PriorityLevel = 'high' | 'medium' | 'low'

const PRIORITY_LABELS: Record<PriorityLevel, string> = {
  high: '高',
  medium: '中',
  low: '低',
}

const PRIORITY_BADGE_STYLES: Record<PriorityLevel, string> = {
  high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  low: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
}

export default function AdminKeywordOptimization({ onShowBanner }: AdminKeywordOptimizationProps) {
  const [items, setItems] = useState<OptimizationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [keyword, setKeyword] = useState('')
  const [priority, setPriority] = useState<PriorityLevel>('medium')
  const [adjustmentReason, setAdjustmentReason] = useState('')
  const [searchVolume, setSearchVolume] = useState('')
  const [creating, setCreating] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editKeyword, setEditKeyword] = useState('')
  const [editPriority, setEditPriority] = useState<PriorityLevel>('medium')
  const [editStatus, setEditStatus] = useState<'active' | 'inactive'>('active')
  const [editAdjustmentReason, setEditAdjustmentReason] = useState('')
  const [editSearchVolume, setEditSearchVolume] = useState('')
  const [updating, setUpdating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchItems = useCallback(async (withLoader = false) => {
    try {
      if (withLoader) setFetching(true)
      const res = await fetch('/api/admin/keyword-optimization')
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) {
        throw new Error(data.error ?? '获取失败')
      }
      setItems(Array.isArray(data.items) ? data.items : [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取失败')
      setItems([])
    } finally {
      setLoading(false)
      setFetching(false)
    }
  }, [])

  useEffect(() => {
    fetchItems(true)
  }, [fetchItems])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const kw = keyword.trim()
    if (!kw) {
      onShowBanner('error', '请输入关键词')
      return
    }
    setCreating(true)
    try {
      const res = await fetch('/api/admin/keyword-optimization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: kw,
          priority,
          adjustment_reason: adjustmentReason.trim() || null,
          search_volume: searchVolume ? parseInt(searchVolume, 10) : null,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) {
        throw new Error(data.error ?? '添加失败')
      }
      setKeyword('')
      setAdjustmentReason('')
      setSearchVolume('')
      setItems((prev) => [data.item, ...prev])
      onShowBanner('success', '关键词已添加')
    } catch (err) {
      onShowBanner('error', err instanceof Error ? err.message : '添加失败')
    } finally {
      setCreating(false)
    }
  }

  const startEdit = (item: OptimizationItem) => {
    setEditingId(item.id)
    setEditKeyword(item.keyword)
    setEditPriority(item.priority)
    setEditStatus(item.status)
    setEditAdjustmentReason(item.adjustment_reason ?? '')
    setEditSearchVolume(item.search_volume?.toString() ?? '')
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingId) return
    setUpdating(true)
    try {
      const res = await fetch(`/api/admin/keyword-optimization/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: editKeyword.trim(),
          priority: editPriority,
          status: editStatus,
          adjustment_reason: editAdjustmentReason.trim() || null,
          search_volume: editSearchVolume ? parseInt(editSearchVolume, 10) : null,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) {
        throw new Error(data.error ?? '更新失败')
      }
      setItems((prev) => prev.map((x) => (x.id === editingId ? data.item : x)))
      onShowBanner('success', '已更新')
      setEditingId(null)
    } catch (err) {
      onShowBanner('error', err instanceof Error ? err.message : '更新失败')
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async (item: OptimizationItem) => {
    if (!window.confirm(`确定删除「${item.keyword}」？`)) return
    setDeletingId(item.id)
    try {
      const res = await fetch(`/api/admin/keyword-optimization/${item.id}`, {
        method: 'DELETE',
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) {
        throw new Error(data.error ?? '删除失败')
      }
      setItems((prev) => prev.filter((x) => x.id !== item.id))
      if (editingId === item.id) setEditingId(null)
      onShowBanner('success', '已删除')
    } catch (err) {
      onShowBanner('error', err instanceof Error ? err.message : '删除失败')
    } finally {
      setDeletingId(null)
    }
  }

  const handleExport = () => {
    const headers = ['关键词', '优先级', '状态', '调整原因', '搜索量', '更新时间']
    const rows = items.map((x) => [
      x.keyword,
      PRIORITY_LABELS[x.priority],
      x.status === 'active' ? '激活' : '停用',
      x.adjustment_reason ?? '',
      x.search_volume ?? '',
      new Date(x.updated_at).toLocaleString(),
    ])
    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `keyword-optimization-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    onShowBanner('success', '导出成功')
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      const text = String(reader.result)
      const lines = text.split(/\r?\n/).filter((l) => l.trim())
      if (lines.length < 2) {
        onShowBanner('error', 'CSV 格式无效，需要表头和至少一行数据')
        return
      }
      const parseRow = (line: string): string[] => {
        const result: string[] = []
        let cur = ''
        let inQuote = false
        for (let i = 0; i < line.length; i++) {
          const c = line[i]
          if (c === '"') {
            if (inQuote && line[i + 1] === '"') {
              cur += '"'
              i++
            } else {
              inQuote = !inQuote
            }
          } else if (!inQuote && c === ',') {
            result.push(cur.trim())
            cur = ''
          } else {
            cur += c
          }
        }
        result.push(cur.trim())
        return result
      }
      const header = parseRow(lines[0])
      const kwIdx = header.findIndex((h) => /关键词|keyword/i.test(h))
      const prioIdx = header.findIndex((h) => /优先级|priority/i.test(h))
      const reasonIdx = header.findIndex((h) => /原因|reason/i.test(h))
      const ki = kwIdx >= 0 ? kwIdx : 0
      const pi = prioIdx >= 0 ? prioIdx : 1
      const ri = reasonIdx >= 0 ? reasonIdx : 3
      let ok = 0
      let fail = 0
      for (let i = 1; i < lines.length; i++) {
        const cells = parseRow(lines[i])
        const kw = (cells[ki] ?? cells[0] ?? '').replace(/^"|"$/g, '').trim()
        if (!kw) continue
        const prioMap: Record<string, PriorityLevel> = {
          高: 'high',
          high: 'high',
          中: 'medium',
          medium: 'medium',
          低: 'low',
          low: 'low',
        }
        const prio = prioMap[(cells[pi] ?? cells[1] ?? 'medium').toLowerCase()] ?? 'medium'
        const reason = (cells[ri] ?? cells[3] ?? '').replace(/^"|"$/g, '').trim() || null
        try {
          const res = await fetch('/api/admin/keyword-optimization', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ keyword: kw, priority: prio, adjustment_reason: reason }),
          })
          const data = await res.json().catch(() => ({}))
          if (res.ok && data.success) ok++
          else fail++
        } catch {
          fail++
        }
      }
      await fetchItems(true)
      onShowBanner('success', `导入完成：成功 ${ok} 条${fail > 0 ? `，失败 ${fail} 条` : ''}`)
    }
    reader.readAsText(file, 'UTF-8')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
        <p className="text-sm text-amber-800 dark:text-amber-200">
          📌 <strong>审核期间手动微调</strong>：在 Google Trends API 审核通过前，可在此手动添加、调整关键词优先级。审核通过后可切换为 API 自动更新。
        </p>
        <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
          趋势数据展示：待 API 接入后启用。
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>添加关键词</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-4">
            <div className="min-w-[180px]">
              <label className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-300">
                关键词
              </label>
              <Input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="e.g. sora video generator"
              />
            </div>
            <div className="min-w-[100px]">
              <label className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-300">
                优先级
              </label>
              <select
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityLevel)}
              >
                <option value="high">高</option>
                <option value="medium">中</option>
                <option value="low">低</option>
              </select>
            </div>
            <div className="min-w-[100px]">
              <label className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-300">
                搜索量
              </label>
              <Input
                type="number"
                value={searchVolume}
                onChange={(e) => setSearchVolume(e.target.value)}
                placeholder="可选"
              />
            </div>
            <div className="min-w-[200px] flex-1">
              <label className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-300">
                调整原因
              </label>
              <Input
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                placeholder="可选，如：热点、竞品词"
              />
            </div>
            <Button type="submit" disabled={creating}>
              {creating ? '添加中...' : '添加'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle>关键词列表</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-energy-water-surface text-energy-water dark:bg-energy-water-muted">
                共 {items.length} 条
              </Badge>
              <Button size="sm" variant="secondary" onClick={() => fetchItems(true)} disabled={fetching}>
                {fetching ? '刷新中...' : '刷新'}
              </Button>
              <Button size="sm" variant="outline" onClick={handleExport}>
                导出 CSV
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleImport}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                导入 CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-gray-500">加载中...</div>
          ) : error ? (
            <div className="py-12 text-center text-red-500">
              {error}
              <Button className="ml-2" variant="secondary" size="sm" onClick={() => fetchItems(true)}>
                重试
              </Button>
            </div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center text-gray-500">暂无数据，请添加关键词</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="px-4 py-3 text-left">关键词</th>
                    <th className="px-4 py-3 text-left">优先级</th>
                    <th className="px-4 py-3 text-left">状态</th>
                    <th className="px-4 py-3 text-left">调整原因</th>
                    <th className="px-4 py-3 text-left">搜索量</th>
                    <th className="px-4 py-3 text-left">趋势</th>
                    <th className="px-4 py-3 text-left">更新时间</th>
                    <th className="px-4 py-3 text-left">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/40"
                    >
                      <td className="px-4 py-3 font-medium">{item.keyword}</td>
                      <td className="px-4 py-3">
                        <Badge className={PRIORITY_BADGE_STYLES[item.priority]}>
                          {PRIORITY_LABELS[item.priority]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          className={
                            item.status === 'active'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-700'
                          }
                        >
                          {item.status === 'active' ? '激活' : '停用'}
                        </Badge>
                      </td>
                      <td className="max-w-[200px] truncate px-4 py-3 text-gray-600 dark:text-gray-400">
                        {item.adjustment_reason ?? '—'}
                      </td>
                      <td className="px-4 py-3">{item.search_volume ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-400">
                          {item.source === 'trends_api' && item.trend_data ? 'API' : '待接入'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {new Date(item.updated_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button size="sm" variant="secondary" onClick={() => startEdit(item)}>
                            编辑
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(item)}
                            disabled={deletingId === item.id}
                          >
                            {deletingId === item.id ? '删除中...' : '删除'}
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

      {editingId && (
        <Card>
          <CardHeader>
            <CardTitle>编辑关键词</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-300">
                    关键词
                  </label>
                  <Input
                    value={editKeyword}
                    onChange={(e) => setEditKeyword(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-300">
                    优先级
                  </label>
                  <select
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as PriorityLevel)}
                  >
                    <option value="high">高</option>
                    <option value="medium">中</option>
                    <option value="low">低</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-300">
                    状态
                  </label>
                  <select
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as 'active' | 'inactive')}
                  >
                    <option value="active">激活</option>
                    <option value="inactive">停用</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-300">
                    搜索量
                  </label>
                  <Input
                    type="number"
                    value={editSearchVolume}
                    onChange={(e) => setEditSearchVolume(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-300">
                  调整原因
                </label>
                <Textarea
                  rows={2}
                  value={editAdjustmentReason}
                  onChange={(e) => setEditAdjustmentReason(e.target.value)}
                  placeholder="可选"
                />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setEditingId(null)}>
                  取消
                </Button>
                <Button type="submit" disabled={updating}>
                  {updating ? '保存中...' : '保存'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
