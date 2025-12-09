import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'
import { KEYWORD_INTENT_LABELS, type KeywordIntent } from '@/lib/keywords/schema'

type KeywordRow = Database['public']['Tables']['long_tail_keywords']['Row']

export const revalidate = 600

export const metadata: Metadata = {
  title: 'Long-tail Keywords Index | Sora2Ai',
  description:
    'Browse all Sora2Ai long-tail keyword pages customized for products/regions/pain points. Quick access to landing pages for better SEO coverage.',
}

interface KeywordSummary {
  id: string
  keyword: string
  page_slug: string
  intent: KeywordIntent
  region: string | null
  product: string | null
  updated_at: string
}

export default async function KeywordsIndexPage() {
  const supabase = await createSupabaseServerClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawData, error } = await (supabase as any)
    .from('long_tail_keywords')
    .select('id, keyword, page_slug, intent, region, product, updated_at')
    .eq('status', 'published')
    .order('priority', { ascending: false })
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Failed to load keywords list:', error)
  }

  const data = (Array.isArray(rawData) ? rawData : []) as Pick<
    KeywordRow,
    'id' | 'keyword' | 'page_slug' | 'intent' | 'region' | 'product' | 'updated_at'
 >[]

  const keywords: KeywordSummary[] = data.map((item) => ({
    id: item.id,
    keyword: item.keyword,
    page_slug: item.page_slug,
    intent: item.intent as KeywordIntent,
    region: item.region,
    product: item.product,
    updated_at: item.updated_at,
  }))

  return (
    <div className="min-h-screen bg-slate-50 py-16 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-10">
          <p className="text-sm uppercase tracking-[0.4em] text-energy-water">Keyword Hub</p>
          <h1 className="mt-3 text-3xl font-bold">Sora2Ai Long-tail Keywords Index</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Static index of all Long-tail Landing Pages for internal linking, Google Search Console submission, and content quality review.
          </p>
        </div>

        {keywords.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-gray-300 bg-white/70 p-6 text-center text-gray-500 dark:border-gray-800 dark:bg-gray-900/70">
            No published keyword pages yet.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {keywords.map((keyword) => (
              <Link
                key={keyword.id}
                href={`/keywords/${keyword.page_slug}.xml`}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-energy-water hover:shadow-lg dark:border-gray-800 dark:bg-gray-900/70"
              >
                <p className="text-xs uppercase tracking-[0.25em] text-energy-water">
                  {KEYWORD_INTENT_LABELS[keyword.intent]}
                </p>
                <h2 className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">
                  {keyword.keyword}
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {keyword.region || 'Any Region'} · {keyword.product || 'Core Tool'}
                </p>
                <p className="mt-3 text-xs text-gray-400">
                  Updated {new Date(keyword.updated_at).toLocaleDateString()}
                </p>
              </Link>
            ))}
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


