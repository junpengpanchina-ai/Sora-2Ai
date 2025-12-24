import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

type UseCaseRow = Database['public']['Tables']['use_cases']['Row']

export const revalidate = 600

export const metadata: Metadata = {
  title: 'AI Video Use Cases - Marketing, Social Media, YouTube & More',
  description: 'Discover how to use AI video generation for marketing, social media, YouTube, TikTok, and more. Learn best practices and create professional videos with our Sora alternative.',
}

const USE_CASE_TYPE_LABELS: Record<string, string> = {
  marketing: 'Marketing',
  'social-media': 'Social Media',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  'product-demo': 'Product Demo',
  ads: 'Advertising',
  education: 'Education',
  other: 'Other',
}

function buildQueryString(params: Record<string, string | undefined>) {
  const sp = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') sp.set(k, v)
  })
  return sp.toString()
}

export default async function UseCasesIndexPage({
  searchParams,
}: {
  searchParams?: { page?: string; type?: string; industry?: string; q?: string }
}) {
  const supabase = await createSupabaseServerClient()
  const pageSize = 48
  const page = Math.max(1, Number(searchParams?.page ?? '1') || 1)
  const offset = (page - 1) * pageSize

  const type = (searchParams?.type ?? 'all').toLowerCase()
  const industry = searchParams?.industry ?? 'all'
  const q = (searchParams?.q ?? '').trim()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('use_cases')
    .select('id, slug, title, description, use_case_type, industry', { count: 'exact' })
    .eq('is_published', true)
    .eq('quality_status', 'approved') // RLS policy requires both is_published=true AND quality_status='approved'
    .order('created_at', { ascending: false })

  if (type !== 'all' && type in USE_CASE_TYPE_LABELS) {
    query = query.eq('use_case_type', type)
  }

  if (industry !== 'all' && industry !== '') {
    query = query.eq('industry', industry)
  }

  if (q) {
    // Search across slug/title/description in DB to avoid downloading huge datasets.
    query = query.or(`slug.ilike.%${q}%,title.ilike.%${q}%,description.ilike.%${q}%`)
  }

  query = query.range(offset, offset + pageSize - 1)
  
  const { data, error, count } = await query

  if (error) {
    console.error('Failed to load use cases:', error)
  }

  const useCases = (Array.isArray(data) ? data : []) as Pick<
    UseCaseRow,
    'id' | 'slug' | 'title' | 'description' | 'use_case_type' | 'industry'
 >[]
  const totalCount = typeof count === 'number' ? count : useCases.length
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  return (
    <div className="min-h-screen bg-slate-50 py-16 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-10">
          <p className="text-sm uppercase tracking-[0.4em] text-energy-water">Use Cases</p>
          <h1 className="mt-3 text-3xl font-bold">AI Video Generation Use Cases</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Learn how to use AI video generation for different purposes. From marketing to social media, 
            discover best practices and create professional videos.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              Total: {totalCount.toLocaleString()}
            </span>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              Page: {page}/{totalPages}
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900/60">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500 dark:text-gray-400">Type</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href={`/use-cases?${buildQueryString({ page: '1', type: 'all', industry: industry === 'all' ? undefined : industry, q: q || undefined })}`}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  type === 'all'
                    ? 'bg-energy-water text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                All
              </Link>
              {Object.entries(USE_CASE_TYPE_LABELS).map(([key, label]) => (
                <Link
                  key={key}
                  href={`/use-cases?${buildQueryString({ page: '1', type: key, industry: industry === 'all' ? undefined : industry, q: q || undefined })}`}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    type === key
                      ? 'bg-energy-water text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900/60">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500 dark:text-gray-400">Industry</p>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Tip: industry values come from your admin generator. Use search if you don’t remember exact names.
            </p>
            <div className="mt-3">
              <Link
                href={`/use-cases?${buildQueryString({ page: '1', type: type === 'all' ? undefined : type, industry: 'all', q: q || undefined })}`}
                className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                  industry === 'all'
                    ? 'bg-energy-water text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                All industries
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900/60">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500 dark:text-gray-400">Search</p>
            <form action="/use-cases" className="mt-3 flex gap-2">
              <input
                name="q"
                defaultValue={q}
                placeholder="Search slug/title/description…"
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-energy-water focus:outline-none focus:ring-2 focus:ring-energy-water dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              />
              <input type="hidden" name="type" value={type} />
              <input type="hidden" name="industry" value={industry} />
              <button className="rounded-xl bg-energy-water px-4 py-2 text-sm font-semibold text-white hover:bg-energy-water-deep">
                Search
              </button>
            </form>
          </div>
        </div>

        {useCases.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-gray-300 bg-white/70 p-6 text-center text-gray-500 dark:border-gray-800 dark:bg-gray-900/70">
            No published use cases available yet.
            <br />
            <span className="text-xs text-gray-400">
              If you generated 60k+ items in admin, make sure they are approved and published (is_published=true).
            </span>
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {useCases.map((useCase) => (
              <Link
                key={useCase.id}
                href={`/use-cases/${useCase.slug}`}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-energy-water hover:shadow-lg dark:border-gray-800 dark:bg-gray-900/70"
              >
                <p className="text-xs uppercase tracking-[0.25em] text-energy-water">
                  {USE_CASE_TYPE_LABELS[useCase.use_case_type] || useCase.use_case_type}
                </p>
                <h2 className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">
                  {useCase.title}
                </h2>
                {useCase.industry && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {useCase.industry}
                  </p>
                )}
                {useCase.description && (
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                    {useCase.description}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
            <Link
              href={`/use-cases?${buildQueryString({
                page: String(Math.max(1, page - 1)),
                type: type === 'all' ? undefined : type,
                industry: industry === 'all' ? undefined : industry,
                q: q || undefined,
              })}`}
              className={`rounded-lg border px-4 py-2 text-sm ${
                page <= 1
                  ? 'pointer-events-none opacity-50'
                  : 'border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900/60 dark:hover:bg-gray-800'
              }`}
            >
              Prev
            </Link>
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {page} / {totalPages}
            </span>
            <Link
              href={`/use-cases?${buildQueryString({
                page: String(Math.min(totalPages, page + 1)),
                type: type === 'all' ? undefined : type,
                industry: industry === 'all' ? undefined : industry,
                q: q || undefined,
              })}`}
              className={`rounded-lg border px-4 py-2 text-sm ${
                page >= totalPages
                  ? 'pointer-events-none opacity-50'
                  : 'border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900/60 dark:hover:bg-gray-800'
              }`}
            >
              Next
            </Link>
          </div>
        )}

        <div className="mt-12 text-center">
          <Link
            href="/"
            className="inline-flex items-center text-sm font-medium text-energy-water transition hover:text-energy-water-deep"
          >
            Back to Homepage
            <svg
              className="ml-1 h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  )
}

