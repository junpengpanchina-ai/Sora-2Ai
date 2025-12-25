'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { Database } from '@/types/database'

type UseCaseRow = Database['public']['Tables']['use_cases']['Row']

const USE_CASE_TYPE_LABELS: Record<string, string> = {
  'advertising-promotion': 'Advertising & Promotion',
  'social-media-content': 'Social Media Content',
  'product-demo-showcase': 'Product Demo & Showcase',
  'brand-storytelling': 'Brand Storytelling',
  'education-explainer': 'Education & Explainer',
  'ugc-creator-content': 'UGC & Creator Content',
}

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
  searchQuery: string
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
  searchQuery,
}: UseCasesPageClientProps) {
  const [selectedUseCase, setSelectedUseCase] = useState<
    (typeof initialUseCases)[0] | null
  >(initialUseCases[0] || null)

  const filteredUseCases = useMemo(() => {
    return initialUseCases
  }, [initialUseCases])

  const typeOptions = [
    { value: 'all', label: 'All' },
    ...Object.entries(USE_CASE_TYPE_LABELS).map(([key, label]) => ({
      value: key,
      label,
    })),
  ]

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050b18] text-white">
      <div className="cosmic-space absolute inset-0" aria-hidden="true" />
      <div className="cosmic-glow absolute inset-0" aria-hidden="true" />
      <div className="cosmic-stars absolute inset-0" aria-hidden="true" />
      <div className="cosmic-noise absolute inset-0" aria-hidden="true" />
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
                Total: {totalCount.toLocaleString()} cases
              </span>
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-blue-100/80">
                Page {currentPage} / {totalPages}
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
                        q: searchQuery || undefined,
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
                  {filteredUseCases.length === 0 ? (
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
              {totalPages > 1 && (
                <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                  <Link
                    href={`/use-cases?${buildQueryString({
                      page: String(Math.max(1, currentPage - 1)),
                      type: selectedType === 'all' ? undefined : selectedType,
                      industry:
                        selectedIndustry === 'all' ? undefined : selectedIndustry,
                      q: searchQuery || undefined,
                    })}`}
                    className={`rounded-lg border px-4 py-2 text-sm ${
                      currentPage <= 1
                        ? 'pointer-events-none opacity-50'
                        : 'border-white/20 bg-white/5 text-white hover:bg-white/10'
                    }`}
                  >
                    Previous
                  </Link>
                  <span className="text-sm text-blue-100/80">
                    {currentPage} / {totalPages}
                  </span>
                  <Link
                    href={`/use-cases?${buildQueryString({
                      page: String(Math.min(totalPages, currentPage + 1)),
                      type: selectedType === 'all' ? undefined : selectedType,
                      industry:
                        selectedIndustry === 'all' ? undefined : selectedIndustry,
                      q: searchQuery || undefined,
                    })}`}
                    className={`rounded-lg border px-4 py-2 text-sm ${
                      currentPage >= totalPages
                        ? 'pointer-events-none opacity-50'
                        : 'border-white/20 bg-white/5 text-white hover:bg-white/10'
                    }`}
                  >
                    Next
                  </Link>
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
