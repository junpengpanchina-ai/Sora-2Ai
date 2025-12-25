'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Badge } from '@/components/ui'
import { shouldRecommendIndustry } from '@/lib/utils/industry-helper'

type UseCaseListItem = {
  id: string
  slug: string
  title: string
  description: string
  use_case_type: string
  industry: string | null
}

const USE_CASE_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'advertising-promotion', label: 'Advertising & Promotion' },
  { value: 'social-media-content', label: 'Social Media Content' },
  { value: 'product-demo-showcase', label: 'Product Demo & Showcase' },
  { value: 'brand-storytelling', label: 'Brand Storytelling' },
  { value: 'education-explainer', label: 'Education & Explainer' },
  { value: 'ugc-creator-content', label: 'UGC & Creator Content' },
] as const

// 优先行业列表（推荐给用户）
const RECOMMENDED_INDUSTRIES = [
  'TikTok Creators',
  'Instagram Creators',
  'YouTube Creators',
  'Social Media Marketing',
  'Digital Marketing Agencies',
  'E-commerce Stores',
  'SaaS Companies',
  'Personal Branding',
  'Online Courses',
  'Coaches & Consultants',
  'Real Estate Marketing',
  'Fitness Trainers',
  'Beauty & Skincare Brands',
  'Fashion Brands',
  'Restaurants & Cafes',
  'Travel Agencies',
] as const

function buildVideoPrompt(useCase: Pick<UseCaseListItem, 'title' | 'description' | 'industry'>): string {
  const title = (useCase.title || '').replace(/^scenario:\s*/i, '').trim()
  const desc = (useCase.description || '').trim()
  const industry = (useCase.industry || '').trim()

  const core = title.length > 80 ? title.slice(0, 77) + '...' : title
  const extra = desc ? ` ${desc.length > 140 ? desc.slice(0, 137) + '...' : desc}` : ''
  const industryText = industry ? ` in the ${industry} industry` : ''

  return `Create a professional 10-15 second video${industryText}: ${core}.${extra}`.replace(/\s+/g, ' ').trim()
}

async function fetchUseCases(params: {
  q: string
  type: string
  industry: string
  page: number
  limit: number
}): Promise<{ items: UseCaseListItem[]; totalCount: number | null; hasMore: boolean }> {
  const sp = new URLSearchParams()
  if (params.q.trim()) sp.set('q', params.q.trim())
  if (params.type && params.type !== 'all') sp.set('type', params.type)
  if (params.industry && params.industry !== 'all') sp.set('industry', params.industry)
  sp.set('page', String(params.page))
  sp.set('limit', String(params.limit))

  const res = await fetch(`/api/use-cases?${sp.toString()}`)
  const json = await res.json().catch(() => ({}))
  if (!res.ok || !json.success) {
    const msg = typeof json.details === 'string' ? json.details : typeof json.error === 'string' ? json.error : 'Failed to load'
    throw new Error(msg)
  }
  return {
    items: Array.isArray(json.items) ? (json.items as UseCaseListItem[]) : [],
    totalCount: typeof json.totalCount === 'number' ? json.totalCount : null,
    hasMore: Boolean(json.hasMore),
  }
}

export default function UseCasesClient(props: {
  initialItems: UseCaseListItem[]
  initialTotalCount: number | null
  initialPage: number
  initialLimit: number
  initialQ: string
  initialType: string
  initialIndustry: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [q, setQ] = useState(props.initialQ)
  const [type, setType] = useState(props.initialType)
  const [industry, setIndustry] = useState(props.initialIndustry)
  const [page, setPage] = useState(props.initialPage)
  const [limit, setLimit] = useState(props.initialLimit)
  const [availableIndustries, setAvailableIndustries] = useState<string[]>([])

  const [items, setItems] = useState<UseCaseListItem[]>(props.initialItems)
  const [totalCount, setTotalCount] = useState<number | null>(props.initialTotalCount)
  const [hasMore, setHasMore] = useState<boolean>(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 从API获取所有可用行业
  useEffect(() => {
    fetch('/api/use-cases/industries')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.industries)) {
          setAvailableIndustries(data.industries)
        }
      })
      .catch(err => {
        console.error('Failed to load industries:', err)
        // 使用默认列表作为fallback
        setAvailableIndustries([...RECOMMENDED_INDUSTRIES])
      })
  }, [])

  const totalPages = useMemo(() => {
    if (!totalCount) return null
    return Math.max(1, Math.ceil(totalCount / limit))
  }, [totalCount, limit])

  // Sync from URL if user navigates with back/forward.
  useEffect(() => {
    const qp = searchParams.get('q') ?? ''
    const tp = searchParams.get('type') ?? 'all'
    const ip = searchParams.get('industry') ?? 'all'
    const pp = Number(searchParams.get('page') ?? props.initialPage)
    const lp = Number(searchParams.get('limit') ?? props.initialLimit)

    setQ(qp)
    setType(tp)
    setIndustry(ip)
    setPage(Number.isFinite(pp) && pp > 0 ? pp : 1)
    setLimit(Number.isFinite(lp) && lp >= 6 ? Math.min(60, lp) : props.initialLimit)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetchUseCases({ q, type, industry, page, limit })
      .then((res) => {
        if (cancelled) return
        setItems(res.items)
        setTotalCount(res.totalCount)
        setHasMore(res.hasMore)
      })
      .catch((e) => {
        if (cancelled) return
        setError(e instanceof Error ? e.message : 'Failed to load')
      })
      .finally(() => {
        if (cancelled) return
        setLoading(false)
      })

    const sp = new URLSearchParams()
    if (q.trim()) sp.set('q', q.trim())
    if (type !== 'all') sp.set('type', type)
    if (industry !== 'all') sp.set('industry', industry)
    if (page !== 1) sp.set('page', String(page))
    if (limit !== props.initialLimit) sp.set('limit', String(limit))
    router.replace(`/use-cases${sp.toString() ? `?${sp.toString()}` : ''}`, { scroll: false })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, type, industry, page, limit])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Browse Use Cases</CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Search and filter through tens of thousands of scenario applications. Click a title to read details, or generate a video directly.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title/slug/description…" />
            <select
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
              value={type}
              onChange={(e) => {
                setPage(1)
                setType(e.target.value)
              }}
            >
              {USE_CASE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <select
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
              value={industry}
              onChange={(e) => {
                setPage(1)
                setIndustry(e.target.value)
              }}
            >
              <option value="all">All Industries</option>
              {availableIndustries.length > 0 ? (
                <>
                  <optgroup label="⭐ Recommended Industries">
                    {availableIndustries.filter(ind => shouldRecommendIndustry(ind)).map((ind) => (
                      <option key={ind} value={ind}>
                        ⭐ {ind}
                      </option>
                    ))}
                  </optgroup>
                  {availableIndustries.filter(ind => !shouldRecommendIndustry(ind)).length > 0 && (
                    <optgroup label="Other Industries">
                      {availableIndustries.filter(ind => !shouldRecommendIndustry(ind)).map((ind) => (
                        <option key={ind} value={ind}>
                          {ind}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </>
              ) : (
                // Fallback: 使用默认推荐行业
                RECOMMENDED_INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>
                    {shouldRecommendIndustry(ind) ? `⭐ ${ind}` : ind}
                  </option>
                ))
              )}
            </select>
            <select
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
              value={String(limit)}
              onChange={(e) => {
                setPage(1)
                setLimit(Number(e.target.value))
              }}
            >
              {[12, 24, 36, 60].map((n) => (
                <option key={n} value={n}>
                  {n} / page
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
            <div>
              {totalCount !== null ? (
                <span>
                  Total: <span className="font-semibold">{totalCount}</span>
                </span>
              ) : (
                <span>Total: —</span>
              )}
              {loading && <span className="ml-2">Loading…</span>}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </Button>
              <span>
                Page <span className="font-semibold">{page}</span>
                {totalPages ? (
                  <>
                    {' '}
                    / <span className="font-semibold">{totalPages}</span>
                  </>
                ) : null}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={loading || (!hasMore && totalPages !== null && page >= totalPages)}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
          Failed to load use cases: {error}
        </div>
      ) : null}

      {items.length === 0 && !loading ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white/70 p-6 text-center text-gray-500 dark:border-gray-800 dark:bg-gray-900/70">
          No use cases found for this filter.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((uc) => {
            const prompt = buildVideoPrompt(uc)
            return (
              <Card key={uc.id} className="border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900/70">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className="bg-energy-water/10 text-energy-water">{uc.use_case_type}</Badge>
                    {uc.industry ? <Badge variant="secondary">{uc.industry}</Badge> : null}
                  </div>

                  <h2 className="mt-3 text-lg font-semibold text-gray-900 dark:text-white">
                    <Link href={`/use-cases/${uc.slug}`} className="hover:underline">
                      {uc.title}
                    </Link>
                  </h2>
                  {uc.description ? (
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-3">{uc.description}</p>
                  ) : null}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link href={`/video?prompt=${encodeURIComponent(prompt)}`}>
                      <Button variant="primary" size="sm">
                        Generate Video
                      </Button>
                    </Link>
                    <Link href={`/use-cases/${uc.slug}`}>
                      <Button variant="secondary" size="sm">
                        Details
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}


