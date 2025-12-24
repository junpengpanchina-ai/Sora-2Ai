'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Textarea } from '@/components/ui'
import TextRecognitionArea from '@/components/admin/TextRecognitionArea'
import { parseUseCaseText } from '@/lib/text-recognition/use-case'
import IndustrySceneBatchGenerator from './IndustrySceneBatchGenerator'

interface AdminUseCasesManagerProps {
  onShowBanner: (type: 'success' | 'error' | 'info', text: string) => void
}

interface UseCaseRecord {
  id: string
  slug: string
  title: string
  h1: string
  description: string
  content: string
  use_case_type: 'marketing' | 'social-media' | 'youtube' | 'tiktok' | 'product-demo' | 'ads' | 'education' | 'other'
  industry: string | null
  featured_prompt_ids: string[]
  related_use_case_ids: string[]
  seo_keywords: string[]
  is_published: boolean
  quality_status: 'pending' | 'approved' | 'rejected' | 'needs_review' | null
  quality_issues: string[] | null
  quality_score: number | null
  quality_notes: string | null
  reviewed_by_admin_id: string | null
  reviewed_at: string | null
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
  industry: string
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
  industry: '',
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
    industry: typeof record.industry === 'string' ? record.industry : null,
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
    quality_status: typeof record.quality_status === 'string' && ['pending', 'approved', 'rejected', 'needs_review'].includes(record.quality_status)
      ? record.quality_status as 'pending' | 'approved' | 'rejected' | 'needs_review'
      : null,
    quality_issues: Array.isArray(record.quality_issues) ? record.quality_issues.map(String) : null,
    quality_score: typeof record.quality_score === 'number' ? record.quality_score : null,
    quality_notes: typeof record.quality_notes === 'string' ? record.quality_notes : null,
    reviewed_by_admin_id: typeof record.reviewed_by_admin_id === 'string' ? record.reviewed_by_admin_id : null,
    reviewed_at: typeof record.reviewed_at === 'string' ? record.reviewed_at : null,
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
    industry: useCase.industry || '',
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
  const [industryFilter, setIndustryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all')
  const [qualityFilter, setQualityFilter] = useState<string>('all')
  const [groupBy, setGroupBy] = useState<'none' | 'type' | 'industry' | 'quality_status'>('industry')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(50)
  const [totalCount, setTotalCount] = useState(0)
  
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
      if (industryFilter !== 'all' && industryFilter !== '') params.append('industry', industryFilter)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (qualityFilter !== 'all') params.append('quality_status', qualityFilter)
      if (search.trim()) params.append('search', search.trim())
      
      // 添加分页参数
      const offset = (currentPage - 1) * itemsPerPage
      params.append('limit', itemsPerPage.toString())
      params.append('offset', offset.toString())

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
      setTotalCount(typeof payload.totalCount === 'number' ? payload.totalCount : normalized.length)
    } catch (err) {
      console.error('获取使用场景列表失败:', err)
      setError(err instanceof Error ? err.message : '获取使用场景列表失败')
      setUseCases([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }, [search, typeFilter, industryFilter, statusFilter, qualityFilter, currentPage, itemsPerPage])

  useEffect(() => {
    console.log('开始获取使用场景列表...')
    fetchUseCases()
  }, [fetchUseCases])

  // 当筛选条件改变时，重置到第一页
  useEffect(() => {
    setCurrentPage(1)
  }, [search, typeFilter, industryFilter, statusFilter, qualityFilter])

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

  // 计算总页数
  const totalPages = Math.ceil(totalCount / itemsPerPage)

  const groupedUseCases = useMemo(() => {
    if (groupBy === 'none') {
      return [{ key: 'all', label: 'All', items: useCases }]
    }

    const map = new Map<string, UseCaseRecord[]>()
    for (const uc of useCases) {
      let key = ''
      if (groupBy === 'type') {
        key = uc.use_case_type || 'other'
      } else if (groupBy === 'industry') {
        key = uc.industry || 'Uncategorized'
      } else {
        key = uc.quality_status || 'null'
      }
      map.set(key, [...(map.get(key) || []), uc])
    }

    const labelFor = (key: string): string => {
      if (groupBy === 'type') {
        return USE_CASE_TYPES.find((t) => t.value === key)?.label || key
      }
      if (groupBy === 'industry') {
        return key
      }
      // quality_status
      if (key === 'approved') return '✅ 已批准'
      if (key === 'pending') return '⏳ 待审核'
      if (key === 'needs_review') return '🔍 需要审核'
      if (key === 'rejected') return '❌ 已拒绝'
      return '未检查'
    }

    return [...map.entries()]
      .sort((a, b) => b[1].length - a[1].length)
      .map(([key, items]) => ({ key, label: labelFor(key), items }))
  }, [groupBy, useCases])

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
          industry: newUseCaseForm.industry.trim() || null,
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
          industry: editForm.industry.trim() || null,
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
      {/* 行业场景词批量生成器（10,000 条内容计划） */}
      <IndustrySceneBatchGenerator 
        onShowBanner={onShowBanner} 
        onGenerated={fetchUseCases}
        onFilterChange={(type, industry) => {
          // 批量生成后，自动应用筛选条件
          console.log('批量生成完成，自动应用筛选条件:', { type, industry })
          setTypeFilter(type)
          if (industry) {
            setIndustryFilter(industry)
          }
          // 由于 fetchUseCases 依赖于 typeFilter 和 industryFilter，
          // 设置这些值后会自动触发重新获取
          // 但为了确保立即刷新，我们也手动调用一次
          setTimeout(() => {
            fetchUseCases()
          }, 200)
        }}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>使用场景管理</CardTitle>
            <Button
              onClick={async () => {
                try {
                  const response = await fetch('/api/admin/use-cases/export-csv')
                  if (!response.ok) {
                    throw new Error('导出失败')
                  }
                  const blob = await response.blob()
                  const url = window.URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `use-cases-export-${new Date().toISOString().split('T')[0]}.csv`
                  document.body.appendChild(a)
                  a.click()
                  window.URL.revokeObjectURL(url)
                  document.body.removeChild(a)
                  onShowBanner('success', 'CSV 导出成功')
                } catch (error) {
                  console.error('导出失败:', error)
                  onShowBanner('error', '导出失败，请重试')
                }
              }}
              variant="outline"
              className="text-sm"
            >
              📥 导出 CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid gap-4 md:grid-cols-6">
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
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
            >
              <option value="all">所有行业</option>
              <option value="">不限制行业</option>
              <option value="Fitness & Sports">Fitness & Sports</option>
              <option value="E-commerce & Retail">E-commerce & Retail</option>
              <option value="Education & Training">Education & Training</option>
              <option value="Marketing & Advertising">Marketing & Advertising</option>
              <option value="Social Media">Social Media</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Real Estate">Real Estate</option>
              <option value="Food & Beverage">Food & Beverage</option>
              <option value="Travel & Tourism">Travel & Tourism</option>
              <option value="Fashion & Beauty">Fashion & Beauty</option>
              <option value="Technology">Technology</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Finance">Finance</option>
              <option value="Automotive">Automotive</option>
              <option value="Gaming">Gaming</option>
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
            <select
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
              value={qualityFilter}
              onChange={(e) => setQualityFilter(e.target.value)}
            >
              <option value="all">所有质量状态</option>
              <option value="null">未检查</option>
              <option value="pending">待审核</option>
              <option value="approved">已批准</option>
              <option value="rejected">已拒绝</option>
              <option value="needs_review">需要审核</option>
            </select>
            <select
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as typeof groupBy)}
              title="按分类分组展示"
            >
              <option value="industry">按行业分组</option>
              <option value="type">按类型分组</option>
              <option value="quality_status">按质量状态分组</option>
              <option value="none">不分组</option>
            </select>
          </div>

          {/* 批量审核操作 */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-4 rounded-lg border border-energy-water bg-energy-water/10 p-4">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                已选择 {selectedIds.size} 项
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/admin/use-cases/batch-review', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          ids: Array.from(selectedIds),
                          action: 'approve',
                        }),
                      })
                      const data = await response.json()
                      if (response.ok) {
                        onShowBanner('success', data.message || '批量批准成功')
                        setSelectedIds(new Set())
                        fetchUseCases()
                      } else {
                        onShowBanner('error', data.error || '批量批准失败')
                      }
                    } catch (error) {
                      console.error('批量批准失败:', error)
                      onShowBanner('error', '批量批准失败')
                    }
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  ✅ 批量批准
                </Button>
                <Button
                  size="sm"
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/admin/use-cases/batch-review', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          ids: Array.from(selectedIds),
                          action: 'reject',
                        }),
                      })
                      const data = await response.json()
                      if (response.ok) {
                        onShowBanner('success', data.message || '批量拒绝成功')
                        setSelectedIds(new Set())
                        fetchUseCases()
                      } else {
                        onShowBanner('error', data.error || '批量拒绝失败')
                      }
                    } catch (error) {
                      console.error('批量拒绝失败:', error)
                      onShowBanner('error', '批量拒绝失败')
                    }
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  ❌ 批量拒绝
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedIds(new Set())}
                >
                  取消选择
                </Button>
              </div>
            </div>
          )}

          {/* Pagination Controls - Top */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">每页显示:</span>
              <select
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800"
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value))
                  setCurrentPage(1)
                }}
              >
                <option value="10">10</option>
                <option value="30">30</option>
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="500">500</option>
                <option value="1000">1000</option>
              </select>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                共 {totalCount} 条，第 {currentPage} / {totalPages || 1} 页
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1 || loading}
              >
                首页
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || loading}
              >
                上一页
              </Button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                第 <input
                  type="number"
                  min="1"
                  max={totalPages || 1}
                  value={currentPage}
                  onChange={(e) => {
                    const page = Math.max(1, Math.min(totalPages || 1, Number(e.target.value) || 1))
                    setCurrentPage(page)
                  }}
                  className="w-16 rounded border border-gray-300 px-2 py-1 text-center text-sm dark:border-gray-700 dark:bg-gray-800"
                /> 页
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages || 1, prev + 1))}
                disabled={currentPage >= (totalPages || 1) || loading}
              >
                下一页
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage(totalPages || 1)}
                disabled={currentPage >= (totalPages || 1) || loading}
              >
                末页
              </Button>
            </div>
          </div>

          {/* List */}
          {loading ? (
            <div className="py-8 text-center text-gray-500">加载中...</div>
          ) : error ? (
            <div className="py-8 text-center text-red-500">{error}</div>
          ) : useCases.length === 0 ? (
            <div className="py-8 text-center text-gray-500">暂无使用场景</div>
          ) : (
            <div className="space-y-6">
              {groupedUseCases.map((group) => (
                <div key={group.key} className="space-y-2">
                  {groupBy !== 'none' && (
                    <div className="flex items-center justify-between px-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {group.label}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {group.items.length}
                        </Badge>
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    {group.items.map((useCase) => {
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
                                <select
                                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
                                  value={editForm.industry}
                                  onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })}
                                >
                                  <option value="">不限制行业</option>
                                  <option value="Fitness & Sports">Fitness & Sports</option>
                                  <option value="E-commerce & Retail">E-commerce & Retail</option>
                                  <option value="Education & Training">Education & Training</option>
                                  <option value="Marketing & Advertising">Marketing & Advertising</option>
                                  <option value="Social Media">Social Media</option>
                                  <option value="Entertainment">Entertainment</option>
                                  <option value="Real Estate">Real Estate</option>
                                  <option value="Food & Beverage">Food & Beverage</option>
                                  <option value="Travel & Tourism">Travel & Tourism</option>
                                  <option value="Fashion & Beauty">Fashion & Beauty</option>
                                  <option value="Technology">Technology</option>
                                  <option value="Healthcare">Healthcare</option>
                                  <option value="Finance">Finance</option>
                                  <option value="Automotive">Automotive</option>
                                  <option value="Gaming">Gaming</option>
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
                                <Button onClick={() => handleUpdateUseCase(useCase.id)} disabled={updating} size="sm">
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
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-3 flex-1">
                                <input
                                  type="checkbox"
                                  checked={selectedIds.has(useCase.id)}
                                  onChange={(e) => {
                                    const newSet = new Set(selectedIds)
                                    if (e.target.checked) newSet.add(useCase.id)
                                    else newSet.delete(useCase.id)
                                    setSelectedIds(newSet)
                                  }}
                                  className="mt-1 h-4 w-4 rounded border-gray-300 text-energy-water focus:ring-energy-water"
                                />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <a
                                      href={`/use-cases/${useCase.slug}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="font-semibold text-gray-900 hover:underline dark:text-white"
                                      title="点击标题打开内容页（新窗口）"
                                    >
                                      {useCase.title}
                                    </a>
                                    <Badge className={STATUS_BADGES[useCase.is_published ? 'published' : 'draft'].className}>
                                      {STATUS_BADGES[useCase.is_published ? 'published' : 'draft'].label}
                                    </Badge>
                                    <Badge variant="default">{useCase.use_case_type}</Badge>
                                    {useCase.industry && (
                                      <Badge variant="secondary" className="text-xs">
                                        {useCase.industry}
                                      </Badge>
                                    )}
                                    {useCase.quality_status && (
                                      <Badge
                                        className={
                                          useCase.quality_status === 'approved'
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                            : useCase.quality_status === 'rejected'
                                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                              : useCase.quality_status === 'pending'
                                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                        }
                                      >
                                        {useCase.quality_status === 'approved'
                                          ? '✅ 已批准'
                                          : useCase.quality_status === 'rejected'
                                            ? '❌ 已拒绝'
                                            : useCase.quality_status === 'pending'
                                              ? '⏳ 待审核'
                                              : '🔍 需要审核'}
                                      </Badge>
                                    )}
                                    {useCase.quality_score !== null && (
                                      <Badge
                                        className={
                                          useCase.quality_score >= 80
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                            : useCase.quality_score >= 60
                                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                        }
                                      >
                                        质量: {useCase.quality_score}
                                      </Badge>
                                    )}
                                    {useCase.quality_issues && useCase.quality_issues.length > 0 && (
                                      <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                        ⚠️ {useCase.quality_issues.length}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
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
                </div>
              ))}
            </div>
          )}

          {/* Pagination Controls - Bottom */}
          {!loading && !error && useCases.length > 0 && (
            <div className="flex items-center justify-between gap-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">每页显示:</span>
                <select
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800"
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                >
                  <option value="10">10</option>
                  <option value="30">30</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                  <option value="500">500</option>
                  <option value="1000">1000</option>
                </select>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  共 {totalCount} 条，第 {currentPage} / {totalPages || 1} 页
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  首页
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  上一页
                </Button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  第 <input
                    type="number"
                    min="1"
                    max={totalPages || 1}
                    value={currentPage}
                    onChange={(e) => {
                      const page = Math.max(1, Math.min(totalPages || 1, Number(e.target.value) || 1))
                      setCurrentPage(page)
                    }}
                    className="w-16 rounded border border-gray-300 px-2 py-1 text-center text-sm dark:border-gray-700 dark:bg-gray-800"
                  /> 页
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages || 1, prev + 1))}
                  disabled={currentPage >= (totalPages || 1)}
                >
                  下一页
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(totalPages || 1)}
                  disabled={currentPage >= (totalPages || 1)}
                >
                  末页
                </Button>
              </div>
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

