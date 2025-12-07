'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Textarea } from '@/components/ui'
import {
  KEYWORD_INTENTS,
  KEYWORD_STATUSES,
  KEYWORD_INTENT_LABELS,
  type KeywordIntent,
  type KeywordStatus,
  type KeywordStep,
  type KeywordFaqItem,
} from '@/lib/keywords/schema'

interface AdminKeywordsManagerProps {
  onShowBanner: (type: 'success' | 'error', text: string) => void
}

interface KeywordRecord {
  id: string
  keyword: string
  intent: KeywordIntent
  product: string | null
  service: string | null
  region: string | null
  pain_point: string | null
  search_volume: number | null
  competition_score: number | null
  priority: number
  page_slug: string
  title: string | null
  meta_description: string | null
  h1: string | null
  intro_paragraph: string | null
  steps: KeywordStep[]
  faq: KeywordFaqItem[]
  status: KeywordStatus
  last_generated_at: string | null
  created_at: string
  updated_at: string
}

type KeywordFormState = {
  keyword: string
  intent: KeywordIntent
  product: string
  service: string
  region: string
  pain_point: string
  search_volume: string
  competition_score: string
  priority: string
  page_slug: string
  title: string
  meta_description: string
  h1: string
  intro_paragraph: string
  status: KeywordStatus
  steps: KeywordStep[]
  faq: KeywordFaqItem[]
}

const createEmptyStep = (): KeywordStep => ({ title: '', description: '' })
const createEmptyFaq = (): KeywordFaqItem => ({ question: '', answer: '' })

const DEFAULT_FORM_STATE: KeywordFormState = {
  keyword: '',
  intent: 'information',
  product: '',
  service: '',
  region: '',
  pain_point: '',
  search_volume: '',
  competition_score: '',
  priority: '0',
  page_slug: '',
  title: '',
  meta_description: '',
  h1: '',
  intro_paragraph: '',
  status: 'draft',
  steps: [createEmptyStep()],
  faq: [createEmptyFaq()],
}

const STATUS_BADGE_STYLES: Record<KeywordStatus, string> = {
  published: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  draft: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
}

export default function AdminKeywordsManager({ onShowBanner }: AdminKeywordsManagerProps) {
  const [keywords, setKeywords] = useState<KeywordRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [filters, setFilters] = useState({
    search: '',
    intent: 'all',
    status: 'all',
    product: '',
    region: '',
    painPoint: '',
  })

  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState<KeywordFormState>(DEFAULT_FORM_STATE)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<KeywordFormState>(DEFAULT_FORM_STATE)
  const [updating, setUpdating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const compactSteps = (steps: KeywordStep[]) =>
    steps
      .map((step) => ({
        title: step.title.trim(),
        description: (step.description ?? '').trim(),
      }))
      .filter((step) => step.title || step.description)

  const compactFaq = (faq: KeywordFaqItem[]) =>
    faq
      .map((item) => ({
        question: item.question.trim(),
        answer: item.answer.trim(),
      }))
      .filter((item) => item.question && item.answer)

  const fetchKeywords = useCallback(
    async (withLoader = false) => {
      try {
        if (withLoader) {
          setFetching(true)
        }
        const params = new URLSearchParams()
        if (filters.search.trim()) params.set('search', filters.search.trim())
        if (filters.intent !== 'all') params.set('intent', filters.intent)
        if (filters.status !== 'all') params.set('status', filters.status)
        if (filters.product.trim()) params.set('product', filters.product.trim())
        if (filters.region.trim()) params.set('region', filters.region.trim())
        if (filters.painPoint.trim()) params.set('pain_point', filters.painPoint.trim())

        const response = await fetch(`/api/admin/keywords?${params.toString()}`)
        const payload = await response.json().catch(() => ({}))

        if (!response.ok || !payload.success) {
          throw new Error(payload.error ?? 'Failed to fetch keywords')
        }

        setKeywords(Array.isArray(payload.keywords) ? payload.keywords : [])
        setError(null)
      } catch (err) {
        console.error('Failed to fetch keywords:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch keywords')
        setKeywords([])
      } finally {
        setLoading(false)
        setFetching(false)
      }
    },
    [filters]
  )

  useEffect(() => {
    fetchKeywords(true)
  }, [fetchKeywords])

  const handleInputChange = (
    setter: React.Dispatch<React.SetStateAction<KeywordFormState>>,
    field: keyof KeywordFormState,
    value: string
  ) => {
    setter((prev) => ({ ...prev, [field]: value }))
  }

  const handleStepChange = (
    setter: React.Dispatch<React.SetStateAction<KeywordFormState>>,
    index: number,
    field: keyof KeywordStep,
    value: string
  ) => {
    setter((prev) => {
      const nextSteps = [...prev.steps]
      nextSteps[index] = { ...nextSteps[index], [field]: value }
      return { ...prev, steps: nextSteps }
    })
  }

  const handleFaqChange = (
    setter: React.Dispatch<React.SetStateAction<KeywordFormState>>,
    index: number,
    field: keyof KeywordFaqItem,
    value: string
  ) => {
    setter((prev) => {
      const nextFaq = [...prev.faq]
      nextFaq[index] = { ...nextFaq[index], [field]: value }
      return { ...prev, faq: nextFaq }
    })
  }

  const appendStep = (setter: React.Dispatch<React.SetStateAction<KeywordFormState>>) => {
    setter((prev) => ({ ...prev, steps: [...prev.steps, createEmptyStep()] }))
  }

  const appendFaq = (setter: React.Dispatch<React.SetStateAction<KeywordFormState>>) => {
    setter((prev) => ({ ...prev, faq: [...prev.faq, createEmptyFaq()] }))
  }

  const removeStep = (setter: React.Dispatch<React.SetStateAction<KeywordFormState>>, index: number) => {
    setter((prev) => ({ ...prev, steps: prev.steps.filter((_, i) => i !== index) }))
  }

  const removeFaq = (setter: React.Dispatch<React.SetStateAction<KeywordFormState>>, index: number) => {
    setter((prev) => ({ ...prev, faq: prev.faq.filter((_, i) => i !== index) }))
  }

  const preparePayload = (form: KeywordFormState) => ({
    keyword: form.keyword.trim(),
    intent: form.intent,
    product: form.product.trim(),
    service: form.service.trim(),
    region: form.region.trim(),
    pain_point: form.pain_point.trim(),
    search_volume: form.search_volume.trim(),
    competition_score: form.competition_score.trim(),
    priority: form.priority.trim(),
    pageSlug: form.page_slug.trim(),
    title: form.title.trim(),
    meta_description: form.meta_description.trim(),
    h1: form.h1.trim(),
    intro_paragraph: form.intro_paragraph.trim(),
    status: form.status,
    steps: compactSteps(form.steps),
    faq: compactFaq(form.faq),
  })

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!createForm.keyword.trim()) {
      onShowBanner('error', 'Please enter a keyword')
      return
    }
    setCreating(true)
    try {
      const response = await fetch('/api/admin/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preparePayload(createForm)),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? 'Creation failed')
      }
      setCreateForm(DEFAULT_FORM_STATE)
      setKeywords((prev) => [payload.keyword, ...prev])
      onShowBanner('success', 'Keyword created successfully')
    } catch (err) {
      console.error('Failed to create keyword:', err)
      onShowBanner('error', err instanceof Error ? err.message : 'Failed to create keyword')
    } finally {
      setCreating(false)
    }
  }

  const startEditing = (record: KeywordRecord) => {
    setEditingId(record.id)
    setEditForm({
      keyword: record.keyword,
      intent: record.intent,
      product: record.product ?? '',
      service: record.service ?? '',
      region: record.region ?? '',
      pain_point: record.pain_point ?? '',
      search_volume: record.search_volume?.toString() ?? '',
      competition_score: record.competition_score?.toString() ?? '',
      priority: record.priority.toString(),
      page_slug: record.page_slug,
      title: record.title ?? '',
      meta_description: record.meta_description ?? '',
      h1: record.h1 ?? '',
      intro_paragraph: record.intro_paragraph ?? '',
      status: record.status,
      steps: record.steps.length ? record.steps : [createEmptyStep()],
      faq: record.faq.length ? record.faq : [createEmptyFaq()],
    })
  }

  const handleEditSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editingId) return
    setUpdating(true)
    try {
      const response = await fetch(`/api/admin/keywords/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preparePayload(editForm)),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? 'Update failed')
      }
      setKeywords((prev) => prev.map((item) => (item.id === editingId ? payload.keyword : item)))
      onShowBanner('success', 'Keyword updated successfully')
      setEditingId(null)
      setEditForm(DEFAULT_FORM_STATE)
    } catch (err) {
      console.error('Failed to update keyword:', err)
      onShowBanner('error', err instanceof Error ? err.message : 'Failed to update keyword')
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async (record: KeywordRecord) => {
    if (!window.confirm(`Are you sure you want to delete "${record.keyword}"?`)) {
      return
    }
    setDeletingId(record.id)
    try {
      const response = await fetch(`/api/admin/keywords/${record.id}`, {
        method: 'DELETE',
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? 'Delete failed')
      }
      setKeywords((prev) => prev.filter((item) => item.id !== record.id))
      if (editingId === record.id) {
        setEditingId(null)
        setEditForm(DEFAULT_FORM_STATE)
      }
      onShowBanner('success', 'Keyword deleted successfully')
    } catch (err) {
      console.error('Failed to delete keyword:', err)
      onShowBanner('error', err instanceof Error ? err.message : 'Failed to delete keyword')
    } finally {
      setDeletingId(null)
    }
  }

  const filteredKeywordCount = useMemo(() => keywords.length, [keywords])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Keyword Page</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleCreate}>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Keyword</label>
                <Input
                  value={createForm.keyword}
                  onChange={(event) => handleInputChange(setCreateForm, 'keyword', event.target.value)}
                  placeholder="e.g., sora video generator free online"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Intent Type</label>
                <select
                  className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                  value={createForm.intent}
                  onChange={(event) =>
                    handleInputChange(setCreateForm, 'intent', event.target.value as KeywordIntent)
                  }
                >
                  {KEYWORD_INTENTS.map((intent) => (
                    <option key={intent} value={intent}>
                      {KEYWORD_INTENT_LABELS[intent]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">URL Slug</label>
                <Input
                  value={createForm.page_slug}
                  onChange={(event) => handleInputChange(setCreateForm, 'page_slug', event.target.value)}
                  placeholder="e.g., sora-video-generator-free"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Status</label>
                <select
                  className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                  value={createForm.status}
                  onChange={(event) =>
                    handleInputChange(setCreateForm, 'status', event.target.value as KeywordStatus)
                  }
                >
                  {KEYWORD_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status === 'published' ? 'Published' : 'Draft'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Product</label>
                <Input
                  value={createForm.product}
                  onChange={(event) => handleInputChange(setCreateForm, 'product', event.target.value)}
                  placeholder="e.g., Sora2 Video"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Service/Feature</label>
                <Input
                  value={createForm.service}
                  onChange={(event) => handleInputChange(setCreateForm, 'service', event.target.value)}
                  placeholder="e.g., Online Generator"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Region</label>
                <Input
                  value={createForm.region}
                  onChange={(event) => handleInputChange(setCreateForm, 'region', event.target.value)}
                  placeholder="e.g., US, UK, Global"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Pain Point/Scenario</label>
                <Input
                  value={createForm.pain_point}
                  onChange={(event) => handleInputChange(setCreateForm, 'pain_point', event.target.value)}
                  placeholder="e.g., Batch Content Creation"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Search Volume</label>
                <Input
                  type="number"
                  value={createForm.search_volume}
                  onChange={(event) => handleInputChange(setCreateForm, 'search_volume', event.target.value)}
                  placeholder="e.g., 90"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Competition Score</label>
                <Input
                  type="number"
                  step="0.01"
                  value={createForm.competition_score}
                  onChange={(event) =>
                    handleInputChange(setCreateForm, 'competition_score', event.target.value)
                  }
                  placeholder="0 - 1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Priority</label>
                <Input
                  type="number"
                  value={createForm.priority}
                  onChange={(event) => handleInputChange(setCreateForm, 'priority', event.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Page Title</label>
                <Input
                  value={createForm.title}
                  onChange={(event) => handleInputChange(setCreateForm, 'title', event.target.value)}
                  placeholder="Page title containing long-tail keyword"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">H1 Title</label>
                <Input
                  value={createForm.h1}
                  onChange={(event) => handleInputChange(setCreateForm, 'h1', event.target.value)}
                  placeholder="Main heading (H1)"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Meta Description</label>
              <Textarea
                rows={3}
                value={createForm.meta_description}
                onChange={(event) =>
                  handleInputChange(setCreateForm, 'meta_description', event.target.value)
                }
                placeholder="140-160 characters, naturally includes long-tail keyword"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Introduction</label>
              <Textarea
                rows={4}
                value={createForm.intro_paragraph}
                onChange={(event) =>
                  handleInputChange(setCreateForm, 'intro_paragraph', event.target.value)
                }
                placeholder="150-300 words, describes the search intent"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Steps</label>
                <Button type="button" variant="secondary" size="sm" onClick={() => appendStep(setCreateForm)}>
                  Add Step
                </Button>
              </div>
              {createForm.steps.map((step, index) => (
                <div key={`create-step-${index}`} className="grid gap-2 md:grid-cols-2">
                  <Input
                    value={step.title}
                    onChange={(event) => handleStepChange(setCreateForm, index, 'title', event.target.value)}
                    placeholder={`Step ${index + 1} Title`}
                  />
                  <div className="flex gap-2">
                    <Textarea
                      rows={2}
                      value={step.description ?? ''}
                      onChange={(event) =>
                        handleStepChange(setCreateForm, index, 'description', event.target.value)
                      }
                      placeholder="Description (optional)"
                    />
                    {createForm.steps.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => removeStep(setCreateForm, index)}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">FAQ</label>
                <Button type="button" variant="secondary" size="sm" onClick={() => appendFaq(setCreateForm)}>
                  Add FAQ
                </Button>
              </div>
              {createForm.faq.map((item, index) => (
                <div key={`create-faq-${index}`} className="grid gap-2 md:grid-cols-2">
                  <Input
                    value={item.question}
                    onChange={(event) =>
                      handleFaqChange(setCreateForm, index, 'question', event.target.value)
                    }
                    placeholder={`Question ${index + 1}`}
                  />
                  <div className="flex gap-2">
                    <Textarea
                      rows={2}
                      value={item.answer}
                      onChange={(event) =>
                        handleFaqChange(setCreateForm, index, 'answer', event.target.value)
                      }
                      placeholder="Answer"
                    />
                    {createForm.faq.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => removeFaq(setCreateForm, index)}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={creating}>
                {creating ? 'Creating...' : 'Create Keyword'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle>Keywords List</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-energy-water-surface text-energy-water dark:bg-energy-water-muted dark:text-energy-soft">
                Total {filteredKeywordCount} items
              </Badge>
              <Button size="sm" variant="secondary" onClick={() => fetchKeywords(true)} disabled={fetching}>
                {fetching ? 'Refreshing...' : 'Refresh List'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="grid gap-3 md:grid-cols-6"
            onSubmit={(event) => {
              event.preventDefault()
              fetchKeywords(true)
            }}
          >
            <Input
              placeholder="Search keyword/title/URL"
              value={filters.search}
              onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
            />
            <select
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
              value={filters.intent}
              onChange={(event) => setFilters((prev) => ({ ...prev, intent: event.target.value }))}
            >
              <option value="all">All Intents</option>
              {KEYWORD_INTENTS.map((intent) => (
                <option key={intent} value={intent}>
                  {KEYWORD_INTENT_LABELS[intent]}
                </option>
              ))}
            </select>
            <select
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
              value={filters.status}
              onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
            <Input
              placeholder="Product"
              value={filters.product}
              onChange={(event) => setFilters((prev) => ({ ...prev, product: event.target.value }))}
            />
            <Input
              placeholder="Region"
              value={filters.region}
              onChange={(event) => setFilters((prev) => ({ ...prev, region: event.target.value }))}
            />
            <Input
              placeholder="Pain Point"
              value={filters.painPoint}
              onChange={(event) => setFilters((prev) => ({ ...prev, painPoint: event.target.value }))}
            />
          </form>

          {loading ? (
            <div className="flex items-center justify-center py-12 text-gray-500 dark:text-gray-400">
              <div className="mr-3 h-6 w-6 animate-spin rounded-full border-b-2 border-energy-water"></div>
              Loading keywords...
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center text-red-500 dark:text-red-400">
              <p>{error}</p>
              <Button variant="secondary" size="sm" onClick={() => fetchKeywords(true)}>
                Reload
              </Button>
            </div>
          ) : keywords.length === 0 ? (
            <div className="py-12 text-center text-gray-500 dark:text-gray-400">No data available</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="py-3 px-4 text-left">Keyword</th>
                    <th className="py-3 px-4 text-left">Slug</th>
                    <th className="py-3 px-4 text-left">Intent</th>
                    <th className="py-3 px-4 text-left">Region/Product</th>
                    <th className="py-3 px-4 text-left">Priority</th>
                    <th className="py-3 px-4 text-left">Status</th>
                    <th className="py-3 px-4 text-left">Last Updated</th>
                    <th className="py-3 px-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {keywords.map((keyword) => (
                    <tr
                      key={keyword.id}
                      className="border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/40"
                    >
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {keyword.keyword}
                          </span>
                          <span className="text-xs text-gray-500">{keyword.title ?? '—'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <code className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700 dark:bg-gray-900 dark:text-gray-300">
                          /keywords/{keyword.page_slug}
                        </code>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {KEYWORD_INTENT_LABELS[keyword.intent]}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-600 dark:text-gray-300">
                        {keyword.region || '—'}
                        <br />
                        {keyword.product || '—'}
                      </td>
                      <td className="py-3 px-4">{keyword.priority}</td>
                      <td className="py-3 px-4">
                        <Badge className={STATUS_BADGE_STYLES[keyword.status]}>
                          {keyword.status === 'published' ? 'Published' : 'Draft'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-500 dark:text-gray-400">
                        {new Date(keyword.updated_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-2">
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant="secondary" onClick={() => startEditing(keyword)}>
                              Edit
                            </Button>
                            {keyword.status === 'published' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(`/keywords/${keyword.page_slug}`, '_blank')}
                                className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                              >
                                View
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(keyword)}
                              disabled={deletingId === keyword.id}
                            >
                              {deletingId === keyword.id ? 'Deleting...' : 'Delete'}
                            </Button>
                          </div>
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
            <CardTitle>Edit Keyword</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleEditSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Keyword</label>
                  <Input
                    value={editForm.keyword}
                    onChange={(event) => handleInputChange(setEditForm, 'keyword', event.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Intent Type</label>
                  <select
                    className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                    value={editForm.intent}
                    onChange={(event) =>
                      handleInputChange(setEditForm, 'intent', event.target.value as KeywordIntent)
                    }
                  >
                    {KEYWORD_INTENTS.map((intent) => (
                      <option key={intent} value={intent}>
                        {KEYWORD_INTENT_LABELS[intent]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">URL Slug</label>
                  <Input
                    value={editForm.page_slug}
                    onChange={(event) => handleInputChange(setEditForm, 'page_slug', event.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Status</label>
                  <select
                    className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                    value={editForm.status}
                    onChange={(event) =>
                      handleInputChange(setEditForm, 'status', event.target.value as KeywordStatus)
                    }
                  >
                    {KEYWORD_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status === 'published' ? 'Published' : 'Draft'}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Priority</label>
                  <Input
                    type="number"
                    value={editForm.priority}
                    onChange={(event) => handleInputChange(setEditForm, 'priority', event.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <Input
                  placeholder="Product"
                  value={editForm.product}
                  onChange={(event) => handleInputChange(setEditForm, 'product', event.target.value)}
                />
                <Input
                  placeholder="Service"
                  value={editForm.service}
                  onChange={(event) => handleInputChange(setEditForm, 'service', event.target.value)}
                />
                <Input
                  placeholder="Region"
                  value={editForm.region}
                  onChange={(event) => handleInputChange(setEditForm, 'region', event.target.value)}
                />
                <Input
                  placeholder="Pain Point"
                  value={editForm.pain_point}
                  onChange={(event) => handleInputChange(setEditForm, 'pain_point', event.target.value)}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <Input
                  type="number"
                  placeholder="Search Volume"
                  value={editForm.search_volume}
                  onChange={(event) =>
                    handleInputChange(setEditForm, 'search_volume', event.target.value)
                  }
                />
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Competition Score (0-1)"
                  value={editForm.competition_score}
                  onChange={(event) =>
                    handleInputChange(setEditForm, 'competition_score', event.target.value)
                  }
                />
                <Input
                  placeholder="H1 Heading"
                  value={editForm.h1}
                  onChange={(event) => handleInputChange(setEditForm, 'h1', event.target.value)}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Textarea
                  rows={2}
                  placeholder="Page title containing keyword"
                  value={editForm.title}
                  onChange={(event) => handleInputChange(setEditForm, 'title', event.target.value)}
                />
                <Textarea
                  rows={2}
                  placeholder="Meta description (140-160 chars)"
                  value={editForm.meta_description}
                  onChange={(event) =>
                    handleInputChange(setEditForm, 'meta_description', event.target.value)
                  }
                />
              </div>

              <div>
                <Textarea
                  rows={4}
                  placeholder="Intro paragraph (150-300 words)"
                  value={editForm.intro_paragraph}
                  onChange={(event) =>
                    handleInputChange(setEditForm, 'intro_paragraph', event.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Steps</label>
                  <Button type="button" variant="secondary" size="sm" onClick={() => appendStep(setEditForm)}>
                    Add Step
                  </Button>
                </div>
                {editForm.steps.map((step, index) => (
                  <div key={`edit-step-${index}`} className="grid gap-2 md:grid-cols-2">
                    <Input
                      value={step.title}
                      onChange={(event) => handleStepChange(setEditForm, index, 'title', event.target.value)}
                      placeholder={`Step ${index + 1} Title`}
                    />
                    <div className="flex gap-2">
                      <Textarea
                        rows={2}
                        value={step.description ?? ''}
                        onChange={(event) =>
                          handleStepChange(setEditForm, index, 'description', event.target.value)
                        }
                      />
                      {editForm.steps.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => removeStep(setEditForm, index)}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">FAQ</label>
                  <Button type="button" variant="secondary" size="sm" onClick={() => appendFaq(setEditForm)}>
                    Add FAQ
                  </Button>
                </div>
                {editForm.faq.map((item, index) => (
                  <div key={`edit-faq-${index}`} className="grid gap-2 md:grid-cols-2">
                    <Input
                      value={item.question}
                      onChange={(event) =>
                        handleFaqChange(setEditForm, index, 'question', event.target.value)
                      }
                      placeholder={`Question ${index + 1}`}
                    />
                    <div className="flex gap-2">
                      <Textarea
                        rows={2}
                        value={item.answer}
                        onChange={(event) =>
                          handleFaqChange(setEditForm, index, 'answer', event.target.value)
                        }
                      />
                      {editForm.faq.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => removeFaq(setEditForm, index)}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setEditingId(null)} disabled={updating}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updating}>
                  {updating ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}


