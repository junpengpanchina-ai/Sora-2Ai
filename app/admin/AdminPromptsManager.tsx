'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Textarea } from '@/components/ui'
import {
  PROMPT_CATEGORIES,
  PROMPT_INTENTS,
  PROMPT_LOCALES,
  type PromptCategory,
  type PromptIntent,
  type PromptLocale,
} from '@/lib/prompts/schema'
import TextRecognitionArea from '@/components/admin/TextRecognitionArea'
import { parsePromptText } from '@/lib/text-recognition/prompt'

interface AdminPromptsManagerProps {
  onShowBanner: (type: 'success' | 'error', text: string) => void
}

interface PromptRecord {
  id: string
  title: string
  description: string | null
  prompt: string
  category: PromptCategory
  tags: string[]
  difficulty: PromptIntent
  example: string | null
  locale: PromptLocale
  is_published: boolean
  created_at: string
  updated_at: string
  created_by_admin_id?: string | null
}

type PromptFormState = {
  title: string
  description: string
  prompt: string
  category: PromptCategory
  tags: string
  difficulty: PromptIntent
  example: string
  locale: PromptLocale
  isPublished: boolean
}

const DEFAULT_FORM_STATE: PromptFormState = {
  title: '',
  description: '',
  prompt: '',
  category: 'nature',
  tags: '',
  difficulty: 'information',
  example: '',
  locale: 'zh',
  isPublished: true,
}

const CATEGORY_LABELS: Record<PromptCategory, string> = {
  nature: '自然',
  character: '角色',
  action: '动作',
  scenery: '场景',
  abstract: '抽象',
  cinematic: '电影感',
}

const INTENT_LABELS: Record<PromptIntent, string> = {
  information: '信息型',
  comparison: '对比型',
  transaction: '交易型',
}

const LOCALE_LABELS: Record<PromptLocale, string> = {
  zh: '简体中文',
  en: 'English',
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

function normalizePromptRecord(item: unknown): PromptRecord | null {
  if (!item || typeof item !== 'object') {
    return null
  }

  const record = item as Record<string, unknown>
  const id = typeof record.id === 'string' ? record.id : null
  const title = typeof record.title === 'string' ? record.title : ''
  const prompt = typeof record.prompt === 'string' ? record.prompt : ''
  const category = (record.category as PromptCategory) ?? 'nature'
  const difficulty = (record.difficulty as PromptIntent) ?? 'information'
  const locale = (record.locale as PromptLocale) ?? 'zh'

  if (!id || !title || !prompt) {
    return null
  }

  return {
    id,
    title,
    description: typeof record.description === 'string' ? record.description : null,
    prompt,
    category,
    tags: Array.isArray(record.tags)
      ? record.tags.filter((tag): tag is string => typeof tag === 'string')
      : [],
    difficulty,
    example: typeof record.example === 'string' ? record.example : null,
    locale,
    is_published: typeof record.is_published === 'boolean' ? record.is_published : true,
    created_at: typeof record.created_at === 'string' ? record.created_at : new Date().toISOString(),
    updated_at: typeof record.updated_at === 'string' ? record.updated_at : new Date().toISOString(),
    created_by_admin_id:
      typeof record.created_by_admin_id === 'string' ? record.created_by_admin_id : null,
  }
}

function buildFormStateFromPrompt(prompt: PromptRecord): PromptFormState {
  return {
    title: prompt.title,
    description: prompt.description ?? '',
    prompt: prompt.prompt,
    category: prompt.category,
    tags: prompt.tags.join(', '),
    difficulty: prompt.difficulty,
    example: prompt.example ?? '',
    locale: prompt.locale,
    isPublished: prompt.is_published,
  }
}

function parseTagsInput(input: string): string[] {
  return input
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)
}

export default function AdminPromptsManager({ onShowBanner }: AdminPromptsManagerProps) {
  const [prompts, setPrompts] = useState<PromptRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [localeFilter, setLocaleFilter] = useState<'all' | PromptLocale>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all')
  const [categoryFilter, setCategoryFilter] = useState<'all' | PromptCategory>('all')

  const [newPromptForm, setNewPromptForm] = useState<PromptFormState>(DEFAULT_FORM_STATE)
  const [creating, setCreating] = useState(false)
  const [textRecognitionInput, setTextRecognitionInput] = useState('')
  const [isRecognizing, setIsRecognizing] = useState(false)

  const [editingPromptId, setEditingPromptId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<PromptFormState>(DEFAULT_FORM_STATE)
  const [updating, setUpdating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchPrompts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/prompts')
      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        const messageParts: string[] = []
        if (typeof payload.error === 'string' && payload.error.trim().length > 0) {
          messageParts.push(payload.error.trim())
        }
        if (typeof payload.details === 'string' && payload.details.trim().length > 0) {
          messageParts.push(payload.details.trim())
        }
        const message = messageParts.join('：') || '获取提示词列表失败'
        throw new Error(message)
      }

      const items = Array.isArray(payload.prompts) ? payload.prompts : []
      const normalized = items
        .map((item: unknown) => normalizePromptRecord(item))
        .filter((item: PromptRecord | null): item is PromptRecord => Boolean(item))

      setPrompts(normalized)
    } catch (err) {
      console.error('获取提示词列表失败:', err)
      setError(err instanceof Error ? err.message : '获取提示词列表失败')
      setPrompts([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPrompts()
  }, [fetchPrompts])

  /**
   * 执行文本识别和填充
   */
  const performTextRecognition = useCallback(async (text: string) => {
    if (!text.trim()) {
      return
    }

    setIsRecognizing(true)
    try {
      const parsed = parsePromptText(text)
      
      // 更新表单字段
      setNewPromptForm((prev) => {
        const updated: PromptFormState = { ...prev }
        
        if (parsed.title) updated.title = parsed.title
        if (parsed.description) updated.description = parsed.description
        if (parsed.prompt) updated.prompt = parsed.prompt
        if (parsed.category && PROMPT_CATEGORIES.includes(parsed.category as PromptCategory)) {
          updated.category = parsed.category as PromptCategory
        }
        if (parsed.tags && parsed.tags.length > 0) {
          updated.tags = parsed.tags.join(', ')
        }
        if (parsed.difficulty && PROMPT_INTENTS.includes(parsed.difficulty as PromptIntent)) {
          updated.difficulty = parsed.difficulty as PromptIntent
        }
        if (parsed.example) updated.example = parsed.example
        if (parsed.locale && PROMPT_LOCALES.includes(parsed.locale as PromptLocale)) {
          updated.locale = parsed.locale as PromptLocale
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

  const filteredPrompts = useMemo(() => {
    const text = search.trim().toLowerCase()
    return prompts.filter((prompt) => {
      const matchesLocale = localeFilter === 'all' || prompt.locale === localeFilter
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'published' ? prompt.is_published : !prompt.is_published)
      const matchesCategory =
        categoryFilter === 'all' || prompt.category === categoryFilter
      const matchesSearch =
        text === '' ||
        prompt.title.toLowerCase().includes(text) ||
        (prompt.description ?? '').toLowerCase().includes(text) ||
        prompt.tags.some((tag) => tag.toLowerCase().includes(text)) ||
        prompt.prompt.toLowerCase().includes(text)
      return matchesLocale && matchesStatus && matchesCategory && matchesSearch
    })
  }, [prompts, search, localeFilter, statusFilter, categoryFilter])

  const handleCreatePrompt = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!newPromptForm.title.trim()) {
      onShowBanner('error', '请输入提示词标题')
      return
    }
    if (!newPromptForm.prompt.trim()) {
      onShowBanner('error', '请输入提示词正文')
      return
    }

    setCreating(true)
    try {
      const response = await fetch('/api/admin/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newPromptForm.title.trim(),
          description: newPromptForm.description.trim() || null,
          prompt: newPromptForm.prompt.trim(),
          category: newPromptForm.category,
          difficulty: newPromptForm.difficulty,
          tags: parseTagsInput(newPromptForm.tags),
          example: newPromptForm.example.trim() || null,
          locale: newPromptForm.locale,
          isPublished: newPromptForm.isPublished,
        }),
      })

      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        const message = typeof payload.error === 'string' ? payload.error : '创建提示词失败'
        throw new Error(message)
      }

      const created = normalizePromptRecord(payload.prompt)
      if (created) {
        setPrompts((prev) => [created, ...prev])
      }
      setNewPromptForm(DEFAULT_FORM_STATE)
      onShowBanner('success', '提示词已创建')
    } catch (err) {
      console.error('创建提示词失败:', err)
      onShowBanner('error', err instanceof Error ? err.message : '创建提示词失败')
    } finally {
      setCreating(false)
    }
  }

  const handleEditStart = (prompt: PromptRecord) => {
    setEditingPromptId(prompt.id)
    setEditForm(buildFormStateFromPrompt(prompt))
  }

  const handleEditCancel = () => {
    setEditingPromptId(null)
    setEditForm(DEFAULT_FORM_STATE)
  }

  const handleEditSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editingPromptId) return

    if (!editForm.title.trim()) {
      onShowBanner('error', '请输入提示词标题')
      return
    }
    if (!editForm.prompt.trim()) {
      onShowBanner('error', '请输入提示词正文')
      return
    }

    setUpdating(true)
    try {
      const response = await fetch(`/api/admin/prompts/${editingPromptId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editForm.title.trim(),
          description: editForm.description.trim() || null,
          prompt: editForm.prompt.trim(),
          category: editForm.category,
          difficulty: editForm.difficulty,
          tags: parseTagsInput(editForm.tags),
          example: editForm.example.trim() || null,
          locale: editForm.locale,
          isPublished: editForm.isPublished,
        }),
      })

      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        const message = typeof payload.error === 'string' ? payload.error : '更新提示词失败'
        throw new Error(message)
      }

      const updated = normalizePromptRecord(payload.prompt)
      if (updated) {
        setPrompts((prev) =>
          prev.map((prompt) => (prompt.id === updated.id ? updated : prompt))
        )
      }
      onShowBanner('success', '提示词已更新')
      handleEditCancel()
    } catch (err) {
      console.error('更新提示词失败:', err)
      onShowBanner('error', err instanceof Error ? err.message : '更新提示词失败')
    } finally {
      setUpdating(false)
    }
  }

  const handleTogglePublish = async (prompt: PromptRecord) => {
    setUpdating(true)
    try {
      const response = await fetch(`/api/admin/prompts/${prompt.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !prompt.is_published }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        const message = typeof payload.error === 'string' ? payload.error : '更新发布状态失败'
        throw new Error(message)
      }
      const updated = normalizePromptRecord(payload.prompt)
      if (updated) {
        setPrompts((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item))
        )
      }
      onShowBanner('success', prompt.is_published ? '已切换为草稿' : '已发布提示词')
    } catch (err) {
      console.error('更新发布状态失败:', err)
      onShowBanner('error', err instanceof Error ? err.message : '更新发布状态失败')
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async (prompt: PromptRecord) => {
    if (!window.confirm(`确定要删除提示词「${prompt.title}」吗？此操作不可恢复。`)) {
      return
    }
    setDeletingId(prompt.id)
    try {
      const response = await fetch(`/api/admin/prompts/${prompt.id}`, {
        method: 'DELETE',
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        const message = typeof payload.error === 'string' ? payload.error : '删除提示词失败'
        throw new Error(message)
      }
      setPrompts((prev) => prev.filter((item) => item.id !== prompt.id))
      onShowBanner('success', '提示词已删除')
      if (editingPromptId === prompt.id) {
        handleEditCancel()
      }
    } catch (err) {
      console.error('删除提示词失败:', err)
      onShowBanner('error', err instanceof Error ? err.message : '删除提示词失败')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>新增提示词</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleCreatePrompt}>
            {/* 文本识别区域 */}
            <TextRecognitionArea
              textInput={textRecognitionInput}
              onTextInputChange={setTextRecognitionInput}
              onRecognize={performTextRecognition}
              isRecognizing={isRecognizing}
              onShowBanner={onShowBanner}
            />
            
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  标题
                </label>
                <Input
                  value={newPromptForm.title}
                  onChange={(event) =>
                    setNewPromptForm((prev) => ({ ...prev, title: event.target.value }))
                  }
                  placeholder="例如：Serene Forest Dawn"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  语言
                </label>
                <select
                  className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                  value={newPromptForm.locale}
                  onChange={(event) =>
                    setNewPromptForm((prev) => ({
                      ...prev,
                      locale: event.target.value as PromptLocale,
                    }))
                  }
                >
                  {PROMPT_LOCALES.map((locale) => (
                    <option key={locale} value={locale}>
                      {LOCALE_LABELS[locale]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  分类
                </label>
                <select
                  className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                  value={newPromptForm.category}
                  onChange={(event) =>
                    setNewPromptForm((prev) => ({
                      ...prev,
                      category: event.target.value as PromptCategory,
                    }))
                  }
                >
                  {PROMPT_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {CATEGORY_LABELS[category]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  意图
                </label>
                <select
                  className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                  value={newPromptForm.difficulty}
                  onChange={(event) =>
                    setNewPromptForm((prev) => ({
                      ...prev,
                      difficulty: event.target.value as PromptIntent,
                    }))
                  }
                >
                  {PROMPT_INTENTS.map((intent) => (
                    <option key={intent} value={intent}>
                      {INTENT_LABELS[intent]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                标签（用逗号分隔）
              </label>
              <Input
                value={newPromptForm.tags}
                onChange={(event) =>
                  setNewPromptForm((prev) => ({ ...prev, tags: event.target.value }))
                }
                placeholder="例如：forest, morning, peaceful"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                简短描述
              </label>
              <Textarea
                rows={2}
                value={newPromptForm.description}
                onChange={(event) =>
                  setNewPromptForm((prev) => ({ ...prev, description: event.target.value }))
                }
                placeholder="用于列表展示的简短摘要，可选"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                提示词正文
              </label>
              <Textarea
                rows={5}
                value={newPromptForm.prompt}
                onChange={(event) =>
                  setNewPromptForm((prev) => ({ ...prev, prompt: event.target.value }))
                }
                placeholder="请输入完整的提示词内容"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                示例（可选）
              </label>
              <Textarea
                rows={3}
                value={newPromptForm.example}
                onChange={(event) =>
                  setNewPromptForm((prev) => ({ ...prev, example: event.target.value }))
                }
                placeholder="可记录示例输出、使用说明或注意事项"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="newPromptPublished"
                type="checkbox"
                checked={newPromptForm.isPublished}
                onChange={(event) =>
                  setNewPromptForm((prev) => ({ ...prev, isPublished: event.target.checked }))
                }
              />
              <label htmlFor="newPromptPublished" className="text-sm text-gray-600 dark:text-gray-300">
                创建后立即对用户开放
              </label>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={creating}>
                {creating ? '创建中...' : '创建提示词'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>提示词列表</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <Input
              placeholder="搜索标题、标签或内容..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <select
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
              value={localeFilter}
              onChange={(event) => setLocaleFilter(event.target.value as typeof localeFilter)}
            >
              <option value="all">全部语言</option>
              {PROMPT_LOCALES.map((locale) => (
                <option key={locale} value={locale}>
                  {LOCALE_LABELS[locale]}
                </option>
              ))}
            </select>
            <select
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(event.target.value as typeof categoryFilter)
              }
            >
              <option value="all">全部分类</option>
              {PROMPT_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {CATEGORY_LABELS[category]}
                </option>
              ))}
            </select>
            <select
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as typeof statusFilter)
              }
            >
              <option value="all">全部状态</option>
              <option value="published">已发布</option>
              <option value="draft">草稿</option>
            </select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 text-gray-500 dark:text-gray-400">
              <div className="mr-3 h-6 w-6 animate-spin rounded-full border-b-2 border-energy-water"></div>
              正在加载提示词...
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center text-red-500 dark:text-red-400">
              <p>{error}</p>
              <Button variant="secondary" size="sm" onClick={fetchPrompts}>
                重新加载
              </Button>
            </div>
          ) : filteredPrompts.length === 0 ? (
            <div className="py-12 text-center text-gray-500 dark:text-gray-400">
              暂无符合条件的提示词
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="py-3 px-4 text-left">标题</th>
                    <th className="py-3 px-4 text-left">语言</th>
                    <th className="py-3 px-4 text-left">分类</th>
                    <th className="py-3 px-4 text-left">意图</th>
                    <th className="py-3 px-4 text-left">标签</th>
                    <th className="py-3 px-4 text-left">更新于</th>
                    <th className="py-3 px-4 text-left">状态</th>
                    <th className="py-3 px-4 text-left">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPrompts.map((prompt) => (
                    <tr
                      key={prompt.id}
                      className="border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/40"
                    >
                      <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                        {prompt.title}
                      </td>
                      <td className="py-3 px-4">{LOCALE_LABELS[prompt.locale]}</td>
                      <td className="py-3 px-4">{CATEGORY_LABELS[prompt.category]}</td>
                      <td className="py-3 px-4">{INTENT_LABELS[prompt.difficulty]}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {prompt.tags.map((tag) => (
                            <Badge key={tag} variant="info" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-500 dark:text-gray-400">
                        {new Date(prompt.updated_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          className={
                            prompt.is_published
                              ? STATUS_BADGES.published.className
                              : STATUS_BADGES.draft.className
                          }
                        >
                          {prompt.is_published
                            ? STATUS_BADGES.published.label
                            : STATUS_BADGES.draft.label}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={updating}
                            onClick={() => handleEditStart(prompt)}
                          >
                            编辑
                          </Button>
                          <Button
                            size="sm"
                            variant={prompt.is_published ? 'outline' : 'primary'}
                            disabled={updating}
                            onClick={() => handleTogglePublish(prompt)}
                          >
                            {prompt.is_published ? '设为草稿' : '发布'}
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            disabled={deletingId === prompt.id}
                            onClick={() => handleDelete(prompt)}
                          >
                            {deletingId === prompt.id ? '删除中...' : '删除'}
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

      {editingPromptId && (
        <Card>
          <CardHeader>
            <CardTitle>编辑提示词</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleEditSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    标题
                  </label>
                  <Input
                    value={editForm.title}
                    onChange={(event) =>
                      setEditForm((prev) => ({ ...prev, title: event.target.value }))
                    }
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    语言
                  </label>
                  <select
                    className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                    value={editForm.locale}
                    onChange={(event) =>
                      setEditForm((prev) => ({
                        ...prev,
                        locale: event.target.value as PromptLocale,
                      }))
                    }
                  >
                    {PROMPT_LOCALES.map((locale) => (
                      <option key={locale} value={locale}>
                        {LOCALE_LABELS[locale]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    分类
                  </label>
                  <select
                    className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                    value={editForm.category}
                    onChange={(event) =>
                      setEditForm((prev) => ({
                        ...prev,
                        category: event.target.value as PromptCategory,
                      }))
                    }
                  >
                    {PROMPT_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {CATEGORY_LABELS[category]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    难度
                  </label>
                  <select
                    className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                    value={editForm.difficulty}
                    onChange={(event) =>
                      setEditForm((prev) => ({
                        ...prev,
                        difficulty: event.target.value as PromptIntent,
                      }))
                    }
                  >
                    {PROMPT_INTENTS.map((intent) => (
                      <option key={intent} value={intent}>
                        {INTENT_LABELS[intent]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  标签
                </label>
                <Input
                  value={editForm.tags}
                  onChange={(event) =>
                    setEditForm((prev) => ({ ...prev, tags: event.target.value }))
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  简短描述
                </label>
                <Textarea
                  rows={2}
                  value={editForm.description}
                  onChange={(event) =>
                    setEditForm((prev) => ({ ...prev, description: event.target.value }))
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  提示词正文
                </label>
                <Textarea
                  rows={5}
                  value={editForm.prompt}
                  onChange={(event) =>
                    setEditForm((prev) => ({ ...prev, prompt: event.target.value }))
                  }
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  示例
                </label>
                <Textarea
                  rows={3}
                  value={editForm.example}
                  onChange={(event) =>
                    setEditForm((prev) => ({ ...prev, example: event.target.value }))
                  }
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="editPromptPublished"
                  type="checkbox"
                  checked={editForm.isPublished}
                  onChange={(event) =>
                    setEditForm((prev) => ({ ...prev, isPublished: event.target.checked }))
                  }
                />
                <label htmlFor="editPromptPublished" className="text-sm text-gray-600 dark:text-gray-300">
                  对用户可见
                </label>
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={handleEditCancel} disabled={updating}>
                  取消
                </Button>
                <Button type="submit" disabled={updating}>
                  {updating ? '保存中...' : '保存修改'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}


