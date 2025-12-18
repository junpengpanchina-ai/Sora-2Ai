'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Textarea } from '@/components/ui'
import TextRecognitionArea from '@/components/admin/TextRecognitionArea'
import { parseUseCaseText } from '@/lib/text-recognition/use-case'
import UseCaseBatchGenerator from './UseCaseBatchGenerator'

interface AdminUseCasesManagerProps {
  onShowBanner: (type: 'success' | 'error', text: string) => void
}

interface UseCaseRecord {
  id: string
  slug: string
  title: string
  h1: string
  description: string
  content: string
  use_case_type: 'marketing' | 'social-media' | 'youtube' | 'tiktok' | 'product-demo' | 'ads' | 'education' | 'other'
  featured_prompt_ids: string[]
  related_use_case_ids: string[]
  seo_keywords: string[]
  is_published: boolean
  created_at: string
  updated_at: string
}

type UseCaseFormState = {
  slug: string
  title: string
  h1: string
  description: string
  content: string
  use_case_type: string
  featured_prompt_ids: string
  related_use_case_ids: string
  seo_keywords: string
  isPublished: boolean
}

const DEFAULT_FORM_STATE: UseCaseFormState = {
  slug: '',
  title: '',
  h1: '',
  description: '',
  content: '',
  use_case_type: 'marketing',
  featured_prompt_ids: '',
  related_use_case_ids: '',
  seo_keywords: '',
  isPublished: true,
}

const USE_CASE_TYPES = [
  { value: 'marketing', label: 'Marketing' },
  { value: 'social-media', label: 'Social Media' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'product-demo', label: 'Product Demo' },
  { value: 'ads', label: 'Advertising' },
  { value: 'education', label: 'Education' },
  { value: 'other', label: 'Other' },
] as const

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

function normalizeUseCaseRecord(item: unknown): UseCaseRecord | null {
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
    use_case_type: (record.use_case_type as UseCaseRecord['use_case_type']) || 'other',
    featured_prompt_ids: Array.isArray(record.featured_prompt_ids)
      ? record.featured_prompt_ids.filter((p): p is string => typeof p === 'string')
      : [],
    related_use_case_ids: Array.isArray(record.related_use_case_ids)
      ? record.related_use_case_ids.filter((p): p is string => typeof p === 'string')
      : [],
    seo_keywords: Array.isArray(record.seo_keywords)
      ? record.seo_keywords.filter((k): k is string => typeof k === 'string')
      : [],
    is_published: typeof record.is_published === 'boolean' ? record.is_published : true,
    created_at: typeof record.created_at === 'string' ? record.created_at : new Date().toISOString(),
    updated_at: typeof record.updated_at === 'string' ? record.updated_at : new Date().toISOString(),
  }
}

function buildFormStateFromUseCase(useCase: UseCaseRecord): UseCaseFormState {
  return {
    slug: useCase.slug,
    title: useCase.title,
    h1: useCase.h1,
    description: useCase.description,
    content: useCase.content,
    use_case_type: useCase.use_case_type,
    featured_prompt_ids: useCase.featured_prompt_ids.join(', '),
    related_use_case_ids: useCase.related_use_case_ids.join(', '),
    seo_keywords: useCase.seo_keywords.join(', '),
    isPublished: useCase.is_published,
  }
}

function parseArrayInput(input: string): string[] {
  return input
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

export default function AdminUseCasesManager({ onShowBanner }: AdminUseCasesManagerProps) {
  const searchParams = useSearchParams()
  const [useCases, setUseCases] = useState<UseCaseRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all')
  
  // 从 URL 参数获取要编辑的 ID
  const editIdFromUrl = searchParams?.get('edit') || null

  const [newUseCaseForm, setNewUseCaseForm] = useState<UseCaseFormState>(DEFAULT_FORM_STATE)
  const [creating, setCreating] = useState(false)
  const [textRecognitionInput, setTextRecognitionInput] = useState('')
  const [isRecognizing, setIsRecognizing] = useState(false)

  const [editingUseCaseId, setEditingUseCaseId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<UseCaseFormState>(DEFAULT_FORM_STATE)
  const [updating, setUpdating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchUseCases = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (typeFilter !== 'all') params.append('type', typeFilter)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (search.trim()) params.append('search', search.trim())

      const response = await fetch(`/api/admin/use-cases?${params.toString()}`)
      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        const messageParts: string[] = []
        if (typeof payload.error === 'string' && payload.error.trim().length > 0) {
          messageParts.push(payload.error.trim())
        }
        if (typeof payload.details === 'string' && payload.details.trim().length > 0) {
          messageParts.push(payload.details.trim())
        }
        const message = messageParts.join('：') || '获取使用场景列表失败'
        throw new Error(message)
      }

      const items = Array.isArray(payload.useCases) ? payload.useCases : []
      const normalized = items
        .map((item: unknown) => normalizeUseCaseRecord(item))
        .filter((item: UseCaseRecord | null): item is UseCaseRecord => Boolean(item))

      setUseCases(normalized)
    } catch (err) {
      console.error('获取使用场景列表失败:', err)
      setError(err instanceof Error ? err.message : '获取使用场景列表失败')
      setUseCases([])
    } finally {
      setLoading(false)
    }
  }, [search, typeFilter, statusFilter])

  useEffect(() => {
    console.log('开始获取使用场景列表...')
    fetchUseCases()
  }, [fetchUseCases])

  // 如果 URL 中有 edit 参数，自动打开编辑
  useEffect(() => {
    if (editIdFromUrl && useCases.length > 0 && !editingUseCaseId) {
      const useCaseToEdit = useCases.find((uc) => uc.id === editIdFromUrl)
      if (useCaseToEdit) {
        handleStartEdit(useCaseToEdit)
        // 滚动到编辑表单
        setTimeout(() => {
          const editForm = document.getElementById(`edit-form-${editIdFromUrl}`)
          editForm?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 300)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editIdFromUrl, useCases])

  /**
   * 执行文本识别和填充
   */
  const performTextRecognition = useCallback(async (text: string) => {
    if (!text.trim()) {
      return
    }

    setIsRecognizing(true)
    try {
      const parsed = parseUseCaseText(text)
      
      // 更新表单字段
      setNewUseCaseForm((prev) => {
        const updated: UseCaseFormState = { ...prev }
        
        if (parsed.slug) updated.slug = parsed.slug
        if (parsed.title) updated.title = parsed.title
        if (parsed.h1) updated.h1 = parsed.h1
        if (parsed.description) updated.description = parsed.description
        if (parsed.content) updated.content = parsed.content
        if (parsed.use_case_type) updated.use_case_type = parsed.use_case_type
        if (parsed.featured_prompt_ids && parsed.featured_prompt_ids.length > 0) {
          updated.featured_prompt_ids = parsed.featured_prompt_ids.join(', ')
        }
        if (parsed.related_use_case_ids && parsed.related_use_case_ids.length > 0) {
          updated.related_use_case_ids = parsed.related_use_case_ids.join(', ')
        }
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

  const filteredUseCases = useMemo(() => {
    const text = search.trim().toLowerCase()
    return useCases.filter((useCase) => {
      const matchesType = typeFilter === 'all' || useCase.use_case_type === typeFilter
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'published' ? useCase.is_published : !useCase.is_published)
      const matchesSearch =
        text === '' ||
        useCase.slug.toLowerCase().includes(text) ||
        useCase.title.toLowerCase().includes(text) ||
        useCase.description.toLowerCase().includes(text) ||
        useCase.h1.toLowerCase().includes(text)
      return matchesType && matchesStatus && matchesSearch
    })
  }, [useCases, search, typeFilter, statusFilter])

  const handleCreateUseCase = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!newUseCaseForm.slug.trim()) {
      onShowBanner('error', '请输入slug')
      return
    }
    if (!newUseCaseForm.title.trim()) {
      onShowBanner('error', '请输入标题')
      return
    }
    if (!newUseCaseForm.h1.trim()) {
      onShowBanner('error', '请输入H1标题')
      return
    }
    if (!newUseCaseForm.content.trim()) {
      onShowBanner('error', '请输入内容')
      return
    }

    setCreating(true)
    try {
      const response = await fetch('/api/admin/use-cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: newUseCaseForm.slug.trim(),
          title: newUseCaseForm.title.trim(),
          h1: newUseCaseForm.h1.trim(),
          description: newUseCaseForm.description.trim(),
          content: newUseCaseForm.content.trim(),
          use_case_type: newUseCaseForm.use_case_type,
          featured_prompt_ids: parseArrayInput(newUseCaseForm.featured_prompt_ids),
          related_use_case_ids: parseArrayInput(newUseCaseForm.related_use_case_ids),
          seo_keywords: parseArrayInput(newUseCaseForm.seo_keywords),
          is_published: newUseCaseForm.isPublished,
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
        const message = messageParts.join('：') || '创建使用场景失败'
        throw new Error(message)
      }

      onShowBanner('success', '使用场景创建成功')
      setNewUseCaseForm(DEFAULT_FORM_STATE)
      await fetchUseCases()
    } catch (err) {
      console.error('创建使用场景失败:', err)
      onShowBanner('error', err instanceof Error ? err.message : '创建使用场景失败')
    } finally {
      setCreating(false)
    }
  }

  const handleStartEdit = (useCase: UseCaseRecord) => {
    setEditingUseCaseId(useCase.id)
    setEditForm(buildFormStateFromUseCase(useCase))
  }

  const handleCancelEdit = () => {
    setEditingUseCaseId(null)
    setEditForm(DEFAULT_FORM_STATE)
  }

  const handleUpdateUseCase = async (id: string) => {
    if (!editForm.slug.trim() || !editForm.title.trim() || !editForm.h1.trim() || !editForm.content.trim()) {
      onShowBanner('error', '请填写所有必需字段')
      return
    }

    setUpdating(true)
    try {
      const response = await fetch(`/api/admin/use-cases/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: editForm.slug.trim(),
          title: editForm.title.trim(),
          h1: editForm.h1.trim(),
          description: editForm.description.trim(),
          content: editForm.content.trim(),
          use_case_type: editForm.use_case_type,
          featured_prompt_ids: parseArrayInput(editForm.featured_prompt_ids),
          related_use_case_ids: parseArrayInput(editForm.related_use_case_ids),
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
        const message = messageParts.join('：') || '更新使用场景失败'
        throw new Error(message)
      }

      onShowBanner('success', '使用场景更新成功')
      setEditingUseCaseId(null)
      await fetchUseCases()
    } catch (err) {
      console.error('更新使用场景失败:', err)
      onShowBanner('error', err instanceof Error ? err.message : '更新使用场景失败')
    } finally {
      setUpdating(false)
    }
  }

  const handleDeleteUseCase = async (id: string) => {
    if (!confirm('确定要删除这个使用场景吗？此操作无法撤销。')) {
      return
    }

    setDeletingId(id)
    try {
      const response = await fetch(`/api/admin/use-cases/${id}`, {
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
        const message = messageParts.join('：') || '删除使用场景失败'
        throw new Error(message)
      }

      onShowBanner('success', '使用场景已删除')
      await fetchUseCases()
    } catch (err) {
      console.error('删除使用场景失败:', err)
      onShowBanner('error', err instanceof Error ? err.message : '删除使用场景失败')
    } finally {
      setDeletingId(null)
    }
  }

  // 调试：组件已加载
  useEffect(() => {
    console.log('AdminUseCasesManager 组件已加载')
  }, [])

  return (
    <div className="space-y-6">
      {/* 批量生成组件 */}
      <UseCaseBatchGenerator onShowBanner={onShowBanner} onGenerated={fetchUseCases} />

      <Card>
        <CardHeader>
          <CardTitle>使用场景管理</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid gap-4 md:grid-cols-3">
            <Input
              placeholder="搜索 slug、标题、描述..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">所有类型</option>
              {USE_CASE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
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
          ) : filteredUseCases.length === 0 ? (
            <div className="py-8 text-center text-gray-500">暂无使用场景</div>
          ) : (
            <div className="space-y-2">
              {filteredUseCases.map((useCase) => {
                const isEditing = editingUseCaseId === useCase.id
                const isDeleting = deletingId === useCase.id
                const isHighlighted = editIdFromUrl === useCase.id

                if (isEditing) {
                  return (
                    <Card key={useCase.id} id={`edit-form-${useCase.id}`} className="border-blue-300">
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
                          <select
                            className="rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
                            value={editForm.use_case_type}
                            onChange={(e) => setEditForm({ ...editForm, use_case_type: e.target.value })}
                          >
                            {USE_CASE_TYPES.map((type) => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
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
                        <div className="grid gap-4 md:grid-cols-3">
                          <Input
                            placeholder="Featured Prompt IDs (逗号分隔)"
                            value={editForm.featured_prompt_ids}
                            onChange={(e) => setEditForm({ ...editForm, featured_prompt_ids: e.target.value })}
                          />
                          <Input
                            placeholder="Related Use Case IDs (逗号分隔)"
                            value={editForm.related_use_case_ids}
                            onChange={(e) => setEditForm({ ...editForm, related_use_case_ids: e.target.value })}
                          />
                          <Input
                            placeholder="SEO Keywords (逗号分隔)"
                            value={editForm.seo_keywords}
                            onChange={(e) => setEditForm({ ...editForm, seo_keywords: e.target.value })}
                          />
                        </div>
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
                            onClick={() => handleUpdateUseCase(useCase.id)}
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
                  <Card 
                    key={useCase.id} 
                    id={`use-case-${useCase.id}`}
                    className={isHighlighted ? 'border-energy-water bg-energy-water/10 ring-2 ring-energy-water' : ''}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{useCase.title}</h3>
                            <Badge
                              className={
                                STATUS_BADGES[useCase.is_published ? 'published' : 'draft'].className
                              }
                            >
                              {STATUS_BADGES[useCase.is_published ? 'published' : 'draft'].label}
                            </Badge>
                            <Badge variant="default">{useCase.use_case_type}</Badge>
                          </div>
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            Slug: {useCase.slug}
                          </p>
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
                            {useCase.description}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <a
                            href={`/use-cases/${useCase.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                          >
                            👁️ 查看
                          </a>
                          <Button onClick={() => handleStartEdit(useCase)} size="sm" variant="secondary">
                            ✏️ 编辑
                          </Button>
                          <Button
                            onClick={() => handleDeleteUseCase(useCase.id)}
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
          <CardTitle>创建新使用场景</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateUseCase} className="space-y-4">
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
                value={newUseCaseForm.slug}
                onChange={(e) => setNewUseCaseForm({ ...newUseCaseForm, slug: e.target.value })}
                required
              />
              <Input
                placeholder="标题 *"
                value={newUseCaseForm.title}
                onChange={(e) => setNewUseCaseForm({ ...newUseCaseForm, title: e.target.value })}
                required
              />
              <Input
                placeholder="H1 *"
                value={newUseCaseForm.h1}
                onChange={(e) => setNewUseCaseForm({ ...newUseCaseForm, h1: e.target.value })}
                required
              />
              <select
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
                value={newUseCaseForm.use_case_type}
                onChange={(e) => setNewUseCaseForm({ ...newUseCaseForm, use_case_type: e.target.value })}
              >
                {USE_CASE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <Textarea
              placeholder="描述 *"
              value={newUseCaseForm.description}
              onChange={(e) => setNewUseCaseForm({ ...newUseCaseForm, description: e.target.value })}
              rows={2}
              required
            />
            <Textarea
              placeholder="内容 (HTML) *"
              value={newUseCaseForm.content}
              onChange={(e) => setNewUseCaseForm({ ...newUseCaseForm, content: e.target.value })}
              rows={10}
              required
            />
            <div className="grid gap-4 md:grid-cols-3">
              <Input
                placeholder="Featured Prompt IDs (逗号分隔)"
                value={newUseCaseForm.featured_prompt_ids}
                onChange={(e) =>
                  setNewUseCaseForm({ ...newUseCaseForm, featured_prompt_ids: e.target.value })
                }
              />
              <Input
                placeholder="Related Use Case IDs (逗号分隔)"
                value={newUseCaseForm.related_use_case_ids}
                onChange={(e) =>
                  setNewUseCaseForm({ ...newUseCaseForm, related_use_case_ids: e.target.value })
                }
              />
              <Input
                placeholder="SEO Keywords (逗号分隔)"
                value={newUseCaseForm.seo_keywords}
                onChange={(e) => setNewUseCaseForm({ ...newUseCaseForm, seo_keywords: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newUseCaseForm.isPublished}
                  onChange={(e) => setNewUseCaseForm({ ...newUseCaseForm, isPublished: e.target.checked })}
                />
                <span className="text-sm">已发布</span>
              </label>
            </div>
            <Button type="submit" disabled={creating}>
              {creating ? '创建中...' : '创建使用场景'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

