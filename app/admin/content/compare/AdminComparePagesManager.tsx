'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Textarea } from '@/components/ui'
import TextRecognitionArea from '@/components/admin/TextRecognitionArea'
import { parseComparePageText } from '@/lib/text-recognition/compare-page'

interface AdminComparePagesManagerProps {
  onShowBanner: (type: 'success' | 'error', text: string) => void
}

interface ComparePageRecord {
  id: string
  slug: string
  title: string
  h1: string
  description: string
  content: string
  tool_a_name: string
  tool_b_name: string
  comparison_points: unknown
  winner: 'tool_a' | 'tool_b' | 'tie' | null
  seo_keywords: string[]
  is_published: boolean
  created_at: string
  updated_at: string
}

type ComparePageFormState = {
  slug: string
  title: string
  h1: string
  description: string
  content: string
  tool_a_name: string
  tool_b_name: string
  comparison_points: string
  winner: string
  seo_keywords: string
  isPublished: boolean
}

const DEFAULT_FORM_STATE: ComparePageFormState = {
  slug: '',
  title: '',
  h1: '',
  description: '',
  content: '',
  tool_a_name: 'OpenAI Sora',
  tool_b_name: '',
  comparison_points: '[]',
  winner: '',
  seo_keywords: '',
  isPublished: true,
}

const STATUS_BADGES: Record<'published' | 'draft', { label: string; className: string }> = {
  published: {
    label: '已发布',
    className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  },
  draft: {
    label: '草稿',
    className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200',
  },
}

function normalizeComparePageRecord(item: unknown): ComparePageRecord | null {
  if (!item || typeof item !== 'object') {
    return null
  }

  const record = item as Record<string, unknown>
  const id = typeof record.id === 'string' ? record.id : null
  const slug = typeof record.slug === 'string' ? record.slug : ''
  const title = typeof record.title === 'string' ? record.title : ''
  const h1 = typeof record.h1 === 'string' ? record.h1 : ''
  const description = typeof record.description === 'string' ? record.description : ''
  const content = typeof record.content === 'string' ? record.content : ''

  if (!id || !slug || !title || !h1 || !description || !content) {
    return null
  }

  return {
    id,
    slug,
    title,
    h1,
    description,
    content,
    tool_a_name: typeof record.tool_a_name === 'string' ? record.tool_a_name : 'OpenAI Sora',
    tool_b_name: typeof record.tool_b_name === 'string' ? record.tool_b_name : '',
    comparison_points: record.comparison_points || [],
    winner: (record.winner as ComparePageRecord['winner']) || null,
    seo_keywords: Array.isArray(record.seo_keywords)
      ? record.seo_keywords.filter((k): k is string => typeof k === 'string')
      : [],
    is_published: typeof record.is_published === 'boolean' ? record.is_published : true,
    created_at: typeof record.created_at === 'string' ? record.created_at : new Date().toISOString(),
    updated_at: typeof record.updated_at === 'string' ? record.updated_at : new Date().toISOString(),
  }
}

function buildFormStateFromComparePage(page: ComparePageRecord): ComparePageFormState {
  return {
    slug: page.slug,
    title: page.title,
    h1: page.h1,
    description: page.description,
    content: page.content,
    tool_a_name: page.tool_a_name,
    tool_b_name: page.tool_b_name,
    comparison_points: JSON.stringify(page.comparison_points, null, 2),
    winner: page.winner || '',
    seo_keywords: page.seo_keywords.join(', '),
    isPublished: page.is_published,
  }
}

function parseArrayInput(input: string): string[] {
  return input
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

export default function AdminComparePagesManager({ onShowBanner }: AdminComparePagesManagerProps) {
  const [comparePages, setComparePages] = useState<ComparePageRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all')

  const [newComparePageForm, setNewComparePageForm] = useState<ComparePageFormState>(DEFAULT_FORM_STATE)
  const [creating, setCreating] = useState(false)
  const [textRecognitionInput, setTextRecognitionInput] = useState('')
  const [isRecognizing, setIsRecognizing] = useState(false)

  const [editingComparePageId, setEditingComparePageId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<ComparePageFormState>(DEFAULT_FORM_STATE)
  const [updating, setUpdating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchComparePages = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (search.trim()) params.append('search', search.trim())

      const response = await fetch(`/api/admin/compare-pages?${params.toString()}`)
      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        const messageParts: string[] = []
        if (typeof payload.error === 'string' && payload.error.trim().length > 0) {
          messageParts.push(payload.error.trim())
        }
        if (typeof payload.details === 'string' && payload.details.trim().length > 0) {
          messageParts.push(payload.details.trim())
        }
        const message = messageParts.join('：') || '获取对比页列表失败'
        throw new Error(message)
      }

      const items = Array.isArray(payload.comparePages) ? payload.comparePages : []
      const normalized = items
        .map((item: unknown) => normalizeComparePageRecord(item))
        .filter((item: ComparePageRecord | null): item is ComparePageRecord => Boolean(item))

      setComparePages(normalized)
    } catch (err) {
      console.error('获取对比页列表失败:', err)
      setError(err instanceof Error ? err.message : '获取对比页列表失败')
      setComparePages([])
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter])

  useEffect(() => {
    fetchComparePages()
  }, [fetchComparePages])

  /**
   * 执行文本识别和填充
   */
  const performTextRecognition = useCallback(async (text: string) => {
    if (!text.trim()) {
      return
    }

    setIsRecognizing(true)
    try {
      const parsed = parseComparePageText(text)
      
      // 更新表单字段
      setNewComparePageForm((prev) => {
        const updated: ComparePageFormState = { ...prev }
        
        if (parsed.slug) updated.slug = parsed.slug
        if (parsed.title) updated.title = parsed.title
        if (parsed.h1) updated.h1 = parsed.h1
        if (parsed.description) updated.description = parsed.description
        if (parsed.content) updated.content = parsed.content
        if (parsed.tool_a_name) updated.tool_a_name = parsed.tool_a_name
        if (parsed.tool_b_name) updated.tool_b_name = parsed.tool_b_name
        if (parsed.comparison_points) updated.comparison_points = parsed.comparison_points
        if (parsed.winner) updated.winner = parsed.winner
        if (parsed.seo_keywords && parsed.seo_keywords.length > 0) {
          updated.seo_keywords = parsed.seo_keywords.join(', ')
        }
        if (parsed.isPublished !== undefined) updated.isPublished = parsed.isPublished
        
        return updated
      })
      
      // 统计识别到的字段数量
      const recognizedFields = Object.keys(parsed).filter((key) => {
        const value = parsed[key as keyof typeof parsed]
        if (Array.isArray(value)) {
          return value.length > 0
        }
        return value !== undefined && value !== null && value !== ''
      }).length
      
      onShowBanner('success', `成功识别并填充了 ${recognizedFields} 个字段`)
    } catch (err) {
      console.error('Text recognition failed:', err)
      onShowBanner('error', err instanceof Error ? err.message : '文本识别失败')
    } finally {
      setIsRecognizing(false)
    }
  }, [onShowBanner])

  const filteredComparePages = useMemo(() => {
    const text = search.trim().toLowerCase()
    return comparePages.filter((page) => {
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'published' ? page.is_published : !page.is_published)
      const matchesSearch =
        text === '' ||
        page.slug.toLowerCase().includes(text) ||
        page.title.toLowerCase().includes(text) ||
        page.description.toLowerCase().includes(text) ||
        page.h1.toLowerCase().includes(text) ||
        page.tool_b_name.toLowerCase().includes(text)
      return matchesStatus && matchesSearch
    })
  }, [comparePages, search, statusFilter])

  const handleCreateComparePage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!newComparePageForm.slug.trim()) {
      onShowBanner('error', '请输入slug')
      return
    }
    if (!newComparePageForm.title.trim()) {
      onShowBanner('error', '请输入标题')
      return
    }
    if (!newComparePageForm.h1.trim()) {
      onShowBanner('error', '请输入H1标题')
      return
    }
    if (!newComparePageForm.content.trim()) {
      onShowBanner('error', '请输入内容')
      return
    }
    if (!newComparePageForm.tool_b_name.trim()) {
      onShowBanner('error', '请输入工具B名称')
      return
    }

    setCreating(true)
    try {
      let comparisonPoints
      try {
        comparisonPoints = JSON.parse(newComparePageForm.comparison_points)
      } catch {
        comparisonPoints = []
      }

      const response = await fetch('/api/admin/compare-pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: newComparePageForm.slug.trim(),
          title: newComparePageForm.title.trim(),
          h1: newComparePageForm.h1.trim(),
          description: newComparePageForm.description.trim(),
          content: newComparePageForm.content.trim(),
          tool_a_name: newComparePageForm.tool_a_name.trim(),
          tool_b_name: newComparePageForm.tool_b_name.trim(),
          comparison_points: comparisonPoints,
          winner: newComparePageForm.winner || null,
          seo_keywords: parseArrayInput(newComparePageForm.seo_keywords),
          is_published: newComparePageForm.isPublished,
        }),
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        const messageParts: string[] = []
        if (typeof payload.error === 'string' && payload.error.trim().length > 0) {
          messageParts.push(payload.error.trim())
        }
        if (typeof payload.details === 'string' && payload.details.trim().length > 0) {
          messageParts.push(payload.details.trim())
        }
        const message = messageParts.join('：') || '创建对比页失败'
        throw new Error(message)
      }

      onShowBanner('success', '对比页创建成功')
      setNewComparePageForm(DEFAULT_FORM_STATE)
      await fetchComparePages()
    } catch (err) {
      console.error('创建对比页失败:', err)
      onShowBanner('error', err instanceof Error ? err.message : '创建对比页失败')
    } finally {
      setCreating(false)
    }
  }

  const handleStartEdit = (page: ComparePageRecord) => {
    setEditingComparePageId(page.id)
    setEditForm(buildFormStateFromComparePage(page))
  }

  const handleCancelEdit = () => {
    setEditingComparePageId(null)
    setEditForm(DEFAULT_FORM_STATE)
  }

  const handleUpdateComparePage = async (id: string) => {
    if (!editForm.slug.trim() || !editForm.title.trim() || !editForm.h1.trim() || !editForm.content.trim()) {
      onShowBanner('error', '请填写所有必需字段')
      return
    }

    setUpdating(true)
    try {
      let comparisonPoints
      try {
        comparisonPoints = JSON.parse(editForm.comparison_points)
      } catch {
        comparisonPoints = []
      }

      const response = await fetch(`/api/admin/compare-pages/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: editForm.slug.trim(),
          title: editForm.title.trim(),
          h1: editForm.h1.trim(),
          description: editForm.description.trim(),
          content: editForm.content.trim(),
          tool_a_name: editForm.tool_a_name.trim(),
          tool_b_name: editForm.tool_b_name.trim(),
          comparison_points: comparisonPoints,
          winner: editForm.winner || null,
          seo_keywords: parseArrayInput(editForm.seo_keywords),
          is_published: editForm.isPublished,
        }),
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        const messageParts: string[] = []
        if (typeof payload.error === 'string' && payload.error.trim().length > 0) {
          messageParts.push(payload.error.trim())
        }
        if (typeof payload.details === 'string' && payload.details.trim().length > 0) {
          messageParts.push(payload.details.trim())
        }
        const message = messageParts.join('：') || '更新对比页失败'
        throw new Error(message)
      }

      onShowBanner('success', '对比页更新成功')
      setEditingComparePageId(null)
      await fetchComparePages()
    } catch (err) {
      console.error('更新对比页失败:', err)
      onShowBanner('error', err instanceof Error ? err.message : '更新对比页失败')
    } finally {
      setUpdating(false)
    }
  }

  const handleDeleteComparePage = async (id: string) => {
    if (!confirm('确定要删除这个对比页吗？此操作无法撤销。')) {
      return
    }

    setDeletingId(id)
    try {
      const response = await fetch(`/api/admin/compare-pages/${id}`, {
        method: 'DELETE',
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        const messageParts: string[] = []
        if (typeof payload.error === 'string' && payload.error.trim().length > 0) {
          messageParts.push(payload.error.trim())
        }
        if (typeof payload.details === 'string' && payload.details.trim().length > 0) {
          messageParts.push(payload.details.trim())
        }
        const message = messageParts.join('：') || '删除对比页失败'
        throw new Error(message)
      }

      onShowBanner('success', '对比页已删除')
      await fetchComparePages()
    } catch (err) {
      console.error('删除对比页失败:', err)
      onShowBanner('error', err instanceof Error ? err.message : '删除对比页失败')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>对比页管理</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              placeholder="搜索 slug、标题、描述..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'published' | 'draft')}
            >
              <option value="all">所有状态</option>
              <option value="published">已发布</option>
              <option value="draft">草稿</option>
            </select>
          </div>

          {/* List */}
          {loading ? (
            <div className="py-8 text-center text-gray-500">加载中...</div>
          ) : error ? (
            <div className="py-8 text-center text-red-500">{error}</div>
          ) : filteredComparePages.length === 0 ? (
            <div className="py-8 text-center text-gray-500">暂无对比页</div>
          ) : (
            <div className="space-y-2">
              {filteredComparePages.map((page) => {
                const isEditing = editingComparePageId === page.id
                const isDeleting = deletingId === page.id

                if (isEditing) {
                  return (
                    <Card key={page.id} className="border-blue-300">
                      <CardContent className="space-y-4 p-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <Input
                            placeholder="Slug"
                            value={editForm.slug}
                            onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                          />
                          <Input
                            placeholder="标题"
                            value={editForm.title}
                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                          />
                          <Input
                            placeholder="H1"
                            value={editForm.h1}
                            onChange={(e) => setEditForm({ ...editForm, h1: e.target.value })}
                          />
                          <Input
                            placeholder="工具A名称"
                            value={editForm.tool_a_name}
                            onChange={(e) => setEditForm({ ...editForm, tool_a_name: e.target.value })}
                          />
                          <Input
                            placeholder="工具B名称"
                            value={editForm.tool_b_name}
                            onChange={(e) => setEditForm({ ...editForm, tool_b_name: e.target.value })}
                          />
                          <select
                            className="rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
                            value={editForm.winner}
                            onChange={(e) => setEditForm({ ...editForm, winner: e.target.value })}
                          >
                            <option value="">无</option>
                            <option value="tool_a">工具A获胜</option>
                            <option value="tool_b">工具B获胜</option>
                            <option value="tie">平局</option>
                          </select>
                        </div>
                        <Textarea
                          placeholder="描述"
                          value={editForm.description}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          rows={2}
                        />
                        <Textarea
                          placeholder="内容 (HTML)"
                          value={editForm.content}
                          onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                          rows={10}
                        />
                        <Textarea
                          placeholder="对比点 (JSON数组)"
                          value={editForm.comparison_points}
                          onChange={(e) => setEditForm({ ...editForm, comparison_points: e.target.value })}
                          rows={5}
                        />
                        <Input
                          placeholder="SEO Keywords (逗号分隔)"
                          value={editForm.seo_keywords}
                          onChange={(e) => setEditForm({ ...editForm, seo_keywords: e.target.value })}
                        />
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={editForm.isPublished}
                              onChange={(e) => setEditForm({ ...editForm, isPublished: e.target.checked })}
                            />
                            <span className="text-sm">已发布</span>
                          </label>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleUpdateComparePage(page.id)}
                            disabled={updating}
                            size="sm"
                          >
                            {updating ? '更新中...' : '保存'}
                          </Button>
                          <Button onClick={handleCancelEdit} variant="secondary" size="sm">
                            取消
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                }

                return (
                  <Card key={page.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{page.title}</h3>
                            <Badge
                              className={
                                STATUS_BADGES[page.is_published ? 'published' : 'draft'].className
                              }
                            >
                              {STATUS_BADGES[page.is_published ? 'published' : 'draft'].label}
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            Slug: {page.slug}
                          </p>
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
                            {page.tool_a_name} vs {page.tool_b_name}
                          </p>
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
                            {page.description}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={() => handleStartEdit(page)} size="sm" variant="secondary">
                            编辑
                          </Button>
                          <Button
                            onClick={() => handleDeleteComparePage(page.id)}
                            disabled={isDeleting}
                            size="sm"
                            variant="danger"
                          >
                            {isDeleting ? '删除中...' : '删除'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Form */}
      <Card>
        <CardHeader>
          <CardTitle>创建新对比页</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateComparePage} className="space-y-4">
            {/* 文本识别区域 */}
            <TextRecognitionArea
              textInput={textRecognitionInput}
              onTextInputChange={setTextRecognitionInput}
              onRecognize={performTextRecognition}
              isRecognizing={isRecognizing}
              onShowBanner={onShowBanner}
            />
            
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                placeholder="Slug *"
                value={newComparePageForm.slug}
                onChange={(e) => setNewComparePageForm({ ...newComparePageForm, slug: e.target.value })}
                required
              />
              <Input
                placeholder="标题 *"
                value={newComparePageForm.title}
                onChange={(e) => setNewComparePageForm({ ...newComparePageForm, title: e.target.value })}
                required
              />
              <Input
                placeholder="H1 *"
                value={newComparePageForm.h1}
                onChange={(e) => setNewComparePageForm({ ...newComparePageForm, h1: e.target.value })}
                required
              />
              <Input
                placeholder="工具A名称"
                value={newComparePageForm.tool_a_name}
                onChange={(e) => setNewComparePageForm({ ...newComparePageForm, tool_a_name: e.target.value })}
              />
              <Input
                placeholder="工具B名称 *"
                value={newComparePageForm.tool_b_name}
                onChange={(e) => setNewComparePageForm({ ...newComparePageForm, tool_b_name: e.target.value })}
                required
              />
              <select
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
                value={newComparePageForm.winner}
                onChange={(e) => setNewComparePageForm({ ...newComparePageForm, winner: e.target.value })}
              >
                <option value="">无</option>
                <option value="tool_a">工具A获胜</option>
                <option value="tool_b">工具B获胜</option>
                <option value="tie">平局</option>
              </select>
            </div>
            <Textarea
              placeholder="描述 *"
              value={newComparePageForm.description}
              onChange={(e) => setNewComparePageForm({ ...newComparePageForm, description: e.target.value })}
              rows={2}
              required
            />
            <Textarea
              placeholder="内容 (HTML) *"
              value={newComparePageForm.content}
              onChange={(e) => setNewComparePageForm({ ...newComparePageForm, content: e.target.value })}
              rows={10}
              required
            />
            <Textarea
              placeholder='对比点 (JSON数组，例如: [{"feature": "价格", "tool_a": "免费", "tool_b": "付费"}])'
              value={newComparePageForm.comparison_points}
              onChange={(e) => setNewComparePageForm({ ...newComparePageForm, comparison_points: e.target.value })}
              rows={5}
            />
            <Input
              placeholder="SEO Keywords (逗号分隔)"
              value={newComparePageForm.seo_keywords}
              onChange={(e) => setNewComparePageForm({ ...newComparePageForm, seo_keywords: e.target.value })}
            />
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newComparePageForm.isPublished}
                  onChange={(e) => setNewComparePageForm({ ...newComparePageForm, isPublished: e.target.checked })}
                />
                <span className="text-sm">已发布</span>
              </label>
            </div>
            <Button type="submit" disabled={creating}>
              {creating ? '创建中...' : '创建对比页'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

