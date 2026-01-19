'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import type { Database } from '@/types/database'
import CosmicBackground from '@/components/CosmicBackground'

type UseCaseRow = Database['public']['Tables']['use_cases']['Row']

const USE_CASE_TYPE_LABELS: Record<string, string> = {
  'advertising-promotion': 'Advertising & Promotion',
  'social-media-content': 'Social Media Content',
  'product-demo-showcase': 'Product Demo & Showcase',
  'brand-storytelling': 'Brand Storytelling',
  'education-explainer': 'Education & Explainer',
  'ugc-creator-content': 'UGC & Creator Content',
}

const TIER_OPTIONS = [
  { value: 'all', label: '全部' },
  { value: 's', label: 'S 级' },
  { value: 'a', label: 'A 级' },
  { value: 's-a', label: 'S+A 级' },
] as const

interface UseCasesPageClientProps {
  initialUseCases: Pick<
    UseCaseRow,
    'id' | 'slug' | 'title' | 'description' | 'use_case_type' | 'industry'
  >[]
  totalCount: number
  currentPage: number
  totalPages: number
  selectedType: string
  selectedIndustry: string
  selectedTier?: string
  searchQuery: string
  itemsPerPage?: number
}

function buildQueryString(params: Record<string, string | undefined>) {
  const sp = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') sp.set(k, v)
  })
  return sp.toString()
}

export default function UseCasesPageClient({
  initialUseCases,
  totalCount,
  currentPage,
  totalPages,
  selectedType,
  selectedIndustry,
  selectedTier = 'all',
  searchQuery,
  itemsPerPage: itemsPerPageProp = 24,
}: UseCasesPageClientProps) {
  const [useCases, setUseCases] = useState(initialUseCases)
  const [actualTotalCount, setActualTotalCount] = useState<number | null>(totalCount)
  const [actualTotalPages, setActualTotalPages] = useState(totalPages)
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [fetchAttempt, setFetchAttempt] = useState(0)
  const [itemsPerPage, setItemsPerPage] = useState(itemsPerPageProp)
  const [pageInput, setPageInput] = useState(String(currentPage))

  const [selectedUseCase, setSelectedUseCase] = useState<
    (typeof initialUseCases)[0] | null
  >(initialUseCases[0] || null)

  // 同步 pageInput 与 currentPage
  useEffect(() => {
    setPageInput(String(currentPage))
  }, [currentPage])

  // 如果服务端数据为空，尝试从 API 获取；502/超时时展示错误与重试
  useEffect(() => {
    if (initialUseCases.length !== 0 || totalCount !== 0) return

    setFetchError(null)
    setLoading(true)
    const params = new URLSearchParams()
    if (searchQuery) params.set('q', searchQuery)
    if (selectedType !== 'all') params.set('type', selectedType)
    if (selectedIndustry !== 'all') params.set('industry', selectedIndustry)
    if (selectedTier !== 'all') params.set('tier', selectedTier)
    params.set('page', String(currentPage))
    params.set('limit', String(itemsPerPage))

    fetch(`/api/use-cases?${params.toString()}`)
      .then(async res => {
        const data = await res.json().catch(() => ({}))
        if (res.ok && data.success && Array.isArray(data.items)) {
          setUseCases(data.items)
          if (typeof data.totalCount === 'number') {
            setActualTotalCount(data.totalCount)
            setActualTotalPages(Math.max(1, Math.ceil(data.totalCount / itemsPerPage)))
          } else {
            setActualTotalCount(null)
            setActualTotalPages(data.items.length >= itemsPerPage ? 2 : 1)
          }
        } else if (!res.ok) {
          setFetchError((data.details || data.error) || `请求失败 (${res.status})`)
        }
      })
      .catch(err => {
        console.error('[UseCasesPageClient] Failed to fetch from API:', err)
        setFetchError(err?.message || '网络错误，请重试')
      })
      .finally(() => setLoading(false))
  }, [initialUseCases.length, totalCount, searchQuery, selectedType, selectedIndustry, selectedTier, currentPage, itemsPerPage, fetchAttempt])

  // 处理页码跳转
  const handlePageJump = (e: React.FormEvent) => {
    e.preventDefault()
    const pageNum = parseInt(pageInput, 10)
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= actualTotalPages) {
      const params = new URLSearchParams()
      if (searchQuery) params.set('q', searchQuery)
      if (selectedType !== 'all') params.set('type', selectedType)
      if (selectedIndustry !== 'all') params.set('industry', selectedIndustry)
      if (selectedTier !== 'all') params.set('tier', selectedTier)
      params.set('page', String(pageNum))
      if (itemsPerPage !== 24) params.set('limit', String(itemsPerPage))
      window.location.href = `/use-cases?${params.toString()}`
    } else {
      // 如果输入无效，恢复当前页码
      setPageInput(String(currentPage))
    }
  }

  // 处理每页显示数量改变
  const handleItemsPerPageChange = (newLimit: number) => {
    setItemsPerPage(newLimit)
    const params = new URLSearchParams()
    if (searchQuery) params.set('q', searchQuery)
    if (selectedType !== 'all') params.set('type', selectedType)
    if (selectedIndustry !== 'all') params.set('industry', selectedIndustry)
    if (selectedTier !== 'all') params.set('tier', selectedTier)
    params.set('page', '1')
    params.set('limit', String(newLimit))
    window.location.href = `/use-cases?${params.toString()}`
  }

  // 生成页码按钮数组
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxPages = actualTotalPages
    const current = currentPage

    if (maxPages <= 10) {
      // 如果总页数少于10页，显示所有页码
      for (let i = 1; i <= maxPages; i++) {
        pages.push(i)
      }
    } else {
      // 显示前几页
      if (current <= 5) {
        for (let i = 1; i <= 7; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(maxPages)
      }
      // 显示中间页
      else if (current > 5 && current < maxPages - 4) {
        pages.push(1)
        pages.push('...')
        for (let i = current - 2; i <= current + 2; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(maxPages)
      }
      // 显示后几页
      else {
        pages.push(1)
        pages.push('...')
        for (let i = maxPages - 6; i <= maxPages; i++) {
          pages.push(i)
        }
      }
    }
    return pages
  }

  const filteredUseCases = useMemo(() => {
    return useCases
  }, [useCases])

  const typeOptions = [
    { value: 'all', label: 'All' },
    ...Object.entries(USE_CASE_TYPE_LABELS).map(([key, label]) => ({
      value: key,
      label,
    })),
  ]

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050b18] text-white">
      {/* 🔥 Performance optimization: Lazy load background effects */}
      <CosmicBackground />
      <div className="relative z-10 cosmic-content">
        <nav className="border-b border-white/10 bg-white/5 backdrop-blur-lg">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/" className="text-xl font-bold text-white">
                  Sora2Ai Videos
                </Link>
                <Link
                  href="/video"
                  className="text-sm font-medium text-blue-100 transition-colors hover:text-white"
                >
                  Video Generation
                </Link>
                <Link
                  href="/prompts"
                  className="text-sm font-medium text-blue-100 transition-colors hover:text-white"
                >
                  Prompt Library
                </Link>
                <Link
                  href="/use-cases"
                  className="text-sm font-medium text-energy-water"
                >
                  Use Cases
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="mb-2 text-4xl font-bold text-white">Use Cases Library</h1>
            <p className="text-lg text-blue-100/80">
              Explore AI video generation applications across different scenarios. Quickly find the right video creation solution for your needs.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-blue-100/80">
                Total: {actualTotalCount != null ? actualTotalCount.toLocaleString() : '50,000+'} cases
                {loading && <span className="ml-2">(Loading...)</span>}
              </span>
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-blue-100/80">
                Page {currentPage} / {actualTotalPages}
              </span>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_25px_80px_-45px_rgba(0,0,0,0.85)] backdrop-blur-xl">
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-blue-100/80">
                Search Use Cases
              </label>
              <form action="/use-cases" method="get" className="flex gap-2">
                <input
                  type="text"
                  name="q"
                  defaultValue={searchQuery}
                  placeholder="Search by title, description, or keywords..."
                  className="flex-1 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-blue-100/50 shadow-lg backdrop-blur-sm focus:border-energy-water focus:outline-none focus:ring-2 focus:ring-energy-water"
                />
                <input type="hidden" name="type" value={selectedType} />
                <input type="hidden" name="industry" value={selectedIndustry} />
                <input type="hidden" name="tier" value={selectedTier} />
                <input type="hidden" name="limit" value={String(itemsPerPage)} />
                <button
                  type="submit"
                  className="rounded-2xl bg-energy-water px-6 py-3 font-semibold text-white shadow-lg transition hover:bg-energy-water-deep"
                >
                  Search
                </button>
              </form>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-blue-100/80">
                Category Filter
              </label>
              <div className="flex flex-wrap gap-2">
                {typeOptions.map((option) => {
                  const isSelected = selectedType === option.value
                  return (
                    <Link
                      key={option.value}
                      href={`/use-cases?${buildQueryString({
                        page: '1',
                        type: option.value === 'all' ? undefined : option.value,
                        industry: selectedIndustry === 'all' ? undefined : selectedIndustry,
                        tier: selectedTier === 'all' ? undefined : selectedTier,
                        q: searchQuery || undefined,
                        limit: itemsPerPage !== 24 ? String(itemsPerPage) : undefined,
                      })}`}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                        isSelected
                          ? 'bg-energy-water text-white shadow-lg hover:bg-energy-water-deep'
                          : 'bg-white/10 text-blue-100 hover:bg-white/20'
                      }`}
                    >
                      {option.label}
                    </Link>
                  )
                })}
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-sm font-medium text-blue-100/80">
                级别 / Level
              </label>
              <div className="flex flex-wrap gap-2">
                {TIER_OPTIONS.map((opt) => {
                  const isSelected = selectedTier === opt.value
                  return (
                    <Link
                      key={opt.value}
                      href={`/use-cases?${buildQueryString({
                        page: '1',
                        type: selectedType === 'all' ? undefined : selectedType,
                        industry: selectedIndustry === 'all' ? undefined : selectedIndustry,
                        tier: opt.value === 'all' ? undefined : opt.value,
                        q: searchQuery || undefined,
                        limit: itemsPerPage !== 24 ? String(itemsPerPage) : undefined,
                      })}`}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                        isSelected
                          ? 'bg-energy-water text-white shadow-lg hover:bg-energy-water-deep'
                          : 'bg-white/10 text-blue-100 hover:bg-white/20'
                      }`}
                    >
                      {opt.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Use Cases List */}
            <div className="lg:col-span-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 text-white shadow-[0_25px_80px_-45px_rgba(0,0,0,0.85)] backdrop-blur-xl">
                <div className="border-b border-white/10 p-6">
                  <h2 className="text-xl font-semibold text-white">
                    Use Cases List ({filteredUseCases.length})
                  </h2>
                </div>
                <div className="p-6">
                  {loading ? (
                    <div className="py-12 text-center">
                      <p className="text-blue-100/70">Loading use cases...</p>
                    </div>
                  ) : fetchError ? (
                    <div className="py-12 text-center space-y-3">
                      <p className="text-amber-200/90">{fetchError}</p>
                      <button
                        type="button"
                        onClick={() => setFetchAttempt(a => a + 1)}
                        className="rounded-lg border border-energy-water bg-energy-water/20 px-4 py-2 text-sm font-medium text-energy-water transition hover:bg-energy-water/30"
                      >
                        重试
                      </button>
                    </div>
                  ) : filteredUseCases.length === 0 ? (
                    <div className="py-12 text-center">
                      <p className="text-blue-100/70">
                        No matching use cases found. Please try adjusting your filters.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredUseCases.map((useCase) => (
                        <div
                          key={useCase.id}
                          className={`cursor-pointer rounded-2xl border p-4 transition-colors ${
                            selectedUseCase?.id === useCase.id
                              ? 'border-energy-water bg-energy-water/10'
                              : 'border-white/10 bg-white/5 hover:bg-white/10'
                          }`}
                          onClick={() => setSelectedUseCase(useCase)}
                        >
                          <div className="mb-2 flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-white">
                                {useCase.title}
                              </h3>
                              <div className="mt-1 flex flex-wrap gap-2">
                                <span className="inline-flex items-center rounded-full bg-energy-water/20 px-2.5 py-0.5 text-xs font-medium text-energy-water">
                                  {USE_CASE_TYPE_LABELS[useCase.use_case_type] ||
                                    useCase.use_case_type}
                                </span>
                                {useCase.industry && (
                                  <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-blue-100/80">
                                    {useCase.industry}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          {useCase.description && (
                            <p className="mb-3 text-sm text-blue-100/80 line-clamp-2">
                              {useCase.description}
                            </p>
                          )}
                          <div className="flex gap-2">
                            <Link
                              href={`/use-cases/${useCase.slug}`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center rounded-lg bg-energy-water px-4 py-2 text-sm font-medium text-white transition hover:bg-energy-water-deep"
                            >
                              Use This Case
                            </Link>
                            <Link
                              href={`/use-cases/${useCase.slug}`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                            >
                              View Details
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Pagination */}
              {actualTotalPages > 1 && (
                <div className="mt-6 space-y-4">
                  {/* 每页显示数量选择器 */}
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-sm text-blue-100/80">每页显示:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                      className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white focus:border-energy-water focus:outline-none focus:ring-2 focus:ring-energy-water"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={28}>28</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>

                  {/* 分页控件 */}
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {/* Previous 按钮 */}
                    <Link
                      href={`/use-cases?${buildQueryString({
                        page: String(Math.max(1, currentPage - 1)),
                        type: selectedType === 'all' ? undefined : selectedType,
                        industry: selectedIndustry === 'all' ? undefined : selectedIndustry,
                        tier: selectedTier === 'all' ? undefined : selectedTier,
                        q: searchQuery || undefined,
                        limit: itemsPerPage !== 24 ? String(itemsPerPage) : undefined,
                      })}`}
                      className={`rounded-lg border px-4 py-2 text-sm transition ${
                        currentPage <= 1
                          ? 'pointer-events-none opacity-50 border-white/10 bg-white/5 text-blue-100/50'
                          : 'border-white/20 bg-white/5 text-white hover:bg-white/10'
                      }`}
                    >
                      Previous
                    </Link>

                    {/* 页码按钮 */}
                    {getPageNumbers().map((page, index) => {
                      if (page === '...') {
                        return (
                          <span key={`ellipsis-${index}`} className="px-2 text-blue-100/50">
                            ...
                          </span>
                        )
                      }
                      const pageNum = page as number
                      const isActive = pageNum === currentPage
                      return (
                        <Link
                          key={pageNum}
                          href={`/use-cases?${buildQueryString({
                            page: String(pageNum),
                            type: selectedType === 'all' ? undefined : selectedType,
                            industry: selectedIndustry === 'all' ? undefined : selectedIndustry,
                            tier: selectedTier === 'all' ? undefined : selectedTier,
                            q: searchQuery || undefined,
                            limit: itemsPerPage !== 24 ? String(itemsPerPage) : undefined,
                          })}`}
                          className={`rounded-lg border px-4 py-2 text-sm transition ${
                            isActive
                              ? 'border-energy-water bg-energy-water text-white shadow-lg'
                              : 'border-white/20 bg-white/5 text-white hover:bg-white/10'
                          }`}
                        >
                          {pageNum}
                        </Link>
                      )
                    })}

                    {/* Next 按钮 */}
                    <Link
                      href={`/use-cases?${buildQueryString({
                        page: String(Math.min(actualTotalPages, currentPage + 1)),
                        type: selectedType === 'all' ? undefined : selectedType,
                        industry: selectedIndustry === 'all' ? undefined : selectedIndustry,
                        tier: selectedTier === 'all' ? undefined : selectedTier,
                        q: searchQuery || undefined,
                        limit: itemsPerPage !== 24 ? String(itemsPerPage) : undefined,
                      })}`}
                      className={`rounded-lg border px-4 py-2 text-sm transition ${
                        currentPage >= actualTotalPages
                          ? 'pointer-events-none opacity-50 border-white/10 bg-white/5 text-blue-100/50'
                          : 'border-white/20 bg-white/5 text-white hover:bg-white/10'
                      }`}
                    >
                      Next
                    </Link>
                  </div>

                  {/* 页码输入框 */}
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-sm text-blue-100/80">跳转到:</span>
                    <form onSubmit={handlePageJump} className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max={actualTotalPages}
                        value={pageInput}
                        onChange={(e) => setPageInput(e.target.value)}
                        className="w-20 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-blue-100/50 focus:border-energy-water focus:outline-none focus:ring-2 focus:ring-energy-water"
                        placeholder="页码"
                      />
                      <button
                        type="submit"
                        className="rounded-lg border border-energy-water bg-energy-water px-4 py-2 text-sm font-medium text-white transition hover:bg-energy-water-deep"
                      >
                        跳转
                      </button>
                    </form>
                    <span className="text-sm text-blue-100/50">
                      共 {actualTotalPages} 页
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar: Selected Use Case Details */}
            <div className="space-y-6">
              {selectedUseCase && (
                <div className="rounded-2xl border border-white/10 bg-white/5 text-white shadow-[0_25px_80px_-45px_rgba(0,0,0,0.85)] backdrop-blur-xl">
                  <div className="border-b border-white/10 p-6">
                    <h3 className="text-xl font-semibold text-white">Use Case Details</h3>
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <h4 className="mb-2 text-lg font-semibold text-white">
                        {selectedUseCase.title}
                      </h4>
                      <div className="mb-3 flex flex-wrap gap-2">
                        <span className="inline-flex items-center rounded-full bg-energy-water/20 px-2.5 py-0.5 text-xs font-medium text-energy-water">
                          {
                            USE_CASE_TYPE_LABELS[selectedUseCase.use_case_type] ||
                            selectedUseCase.use_case_type
                          }
                        </span>
                        {selectedUseCase.industry && (
                          <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-blue-100/80">
                            {selectedUseCase.industry}
                          </span>
                        )}
                      </div>
                      {selectedUseCase.description && (
                        <p className="text-sm text-blue-100/80">
                          {selectedUseCase.description}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <Link
                        href={`/use-cases/${selectedUseCase.slug}`}
                        className="inline-flex items-center justify-center rounded-lg bg-energy-water px-4 py-2 text-sm font-medium text-white transition hover:bg-energy-water-deep"
                      >
                        Generate Video with This Case
                      </Link>
                      <Link
                        href={`/use-cases/${selectedUseCase.slug}`}
                        className="inline-flex items-center justify-center rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                      >
                        View Full Details
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Links */}
              <div className="rounded-2xl border border-white/10 bg-white/5 text-white shadow-[0_25px_80px_-45px_rgba(0,0,0,0.85)] backdrop-blur-xl">
                <div className="border-b border-white/10 p-6">
                  <h3 className="text-lg font-semibold text-white">Quick Links</h3>
                </div>
                <div className="p-6 space-y-2">
                  <Link
                    href="/"
                    className="block text-sm text-energy-water hover:text-energy-water-deep transition"
                  >
                    Back to Homepage
                  </Link>
                  <Link
                    href="/prompts"
                    className="block text-sm text-energy-water hover:text-energy-water-deep transition"
                  >
                    Prompt Library
                  </Link>
                  <Link
                    href="/video"
                    className="block text-sm text-energy-water hover:text-energy-water-deep transition"
                  >
                    Video Generator
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
