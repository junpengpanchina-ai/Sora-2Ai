import { cache } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'
import { normalizeFaq, normalizeSteps, KEYWORD_INTENT_LABELS } from '@/lib/keywords/schema'
import KeywordToolEmbed from '../KeywordToolEmbed'

type KeywordRow = Database['public']['Tables']['long_tail_keywords']['Row']

interface KeywordPageRecord extends Omit<KeywordRow, 'steps' | 'faq'> {
  steps: ReturnType<typeof normalizeSteps>
  faq: ReturnType<typeof normalizeFaq>
}

const getKeywordBySlug = cache(async (slug: string): Promise<KeywordPageRecord | null> => {
  const supabase = await createSupabaseServerClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawData, error } = await (supabase as any)
    .from('long_tail_keywords')
    .select('*')
    .eq('status', 'published')
    .eq('page_slug', slug)
    .maybeSingle()

  if (error) {
    console.error('Failed to load keyword:', error)
    return null
  }

  if (!rawData) {
    return null
  }

  const data = rawData as KeywordRow

  return {
    ...data,
    steps: normalizeSteps(data.steps),
    faq: normalizeFaq(data.faq),
  }
})

const getRelatedKeywords = cache(async (excludeId: string): Promise<KeywordPageRecord[]> => {
  const supabase = await createSupabaseServerClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawData, error } = await (supabase as any)
    .from('long_tail_keywords')
    .select('*')
    .eq('status', 'published')
    .neq('id', excludeId)
    .order('priority', { ascending: false })
    .order('updated_at', { ascending: false })
    .limit(12)

  if (error) {
    console.error('Failed to load related keywords:', error)
    return []
  }

  const data = (Array.isArray(rawData) ? rawData : []) as KeywordRow[]

  return data.map((item) => ({
    ...item,
    steps: normalizeSteps(item.steps),
    faq: normalizeFaq(item.faq),
  }))
})

export const revalidate = 1800

type PageProps = {
  params: {
    slug: string
  }
}

const buildMetaTitle = (keyword: KeywordPageRecord) => {
  if (keyword.title) {
    return keyword.title
  }
  return `${keyword.keyword} | Sora2Ai Video Generator`
}

  const buildMetaDescription = (keyword: KeywordPageRecord) => {
    if (keyword.meta_description) {
      return keyword.meta_description
    }
    return keyword.intro_paragraph
      ? keyword.intro_paragraph.slice(0, 155)
      : `Generate ${keyword.keyword} video content online, including steps, FAQ, and direct tool access.`
  }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const keyword = await getKeywordBySlug(params.slug)
  if (!keyword) {
    return {
      title: 'Keyword Not Found',
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.sora2ai.com'
  const canonical = `${baseUrl}/keywords/${keyword.page_slug}`

  return {
    title: buildMetaTitle(keyword),
    description: buildMetaDescription(keyword),
    alternates: {
      canonical,
    },
  }
}

export default async function KeywordLandingPage({ params }: PageProps) {
  const keyword = await getKeywordBySlug(params.slug)
  if (!keyword) {
    notFound()
  }

  const relatedKeywords = await getRelatedKeywords(keyword.id)
  const structuredFaq =
    keyword.faq.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: keyword.faq.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: item.answer,
            },
          })),
        }
      : null

  const heroTitle = keyword.h1 || keyword.keyword
  const intro = keyword.intro_paragraph ?? ''
  const intentLabel = KEYWORD_INTENT_LABELS[keyword.intent] ?? ''

  return (
    <div className="bg-slate-50 dark:bg-gray-950">
      <div className="relative overflow-hidden border-b border-white/20 bg-gradient-to-br from-[#050b18] via-[#09122C] to-[#050b18]">
        <div className="cosmic-space absolute inset-0 opacity-60" aria-hidden="true" />
        <div className="cosmic-glow absolute inset-0 opacity-50" aria-hidden="true" />
        <div className="relative z-10 mx-auto max-w-6xl px-6 py-16 text-white">
          <div className="flex flex-wrap items-center gap-3 text-sm uppercase tracking-[0.2em] text-energy-water">
            <span>Long-tail Landing</span>
            <span className="text-white/50">/</span>
            <span>{intentLabel}</span>
            {keyword.region && (
              <>
                <span className="text-white/50">/</span>
                <span>{keyword.region}</span>
              </>
            )}
          </div>
          <h1 className="mt-6 text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
            {heroTitle}
          </h1>
          {keyword.meta_description && (
            <p className="mt-4 max-w-3xl text-lg text-blue-100/80">{keyword.meta_description}</p>
          )}
          <div className="mt-6 flex flex-wrap gap-3 text-xs text-white/70">
            <span className="rounded-full border border-white/30 px-3 py-1">Keyword: {keyword.keyword}</span>
            {keyword.product && (
              <span className="rounded-full border border-white/30 px-3 py-1">
                Product: {keyword.product}
              </span>
            )}
            {keyword.service && (
              <span className="rounded-full border border-white/30 px-3 py-1">
                Service: {keyword.service}
              </span>
            )}
            {keyword.pain_point && (
              <span className="rounded-full border border-white/30 px-3 py-1">
                Pain Point: {keyword.pain_point}
              </span>
            )}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-6 py-12 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-10">
            {intro && (
              <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-900/60">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Overview</h2>
                <p className="mt-3 text-gray-600 leading-relaxed dark:text-gray-300 whitespace-pre-line">
                  {intro}
                </p>
              </section>
            )}

            {keyword.steps.length > 0 && (
              <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-900/60">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">How to Use</h2>
                <div className="mt-6 space-y-4">
                  {keyword.steps.map((step, index) => (
                    <div
                      key={`${keyword.id}-step-${index}`}
                      className="flex items-start gap-4 rounded-xl border border-gray-100 bg-gray-50/70 p-4 dark:border-gray-800 dark:bg-gray-800/60"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-energy-water/10 text-sm font-semibold text-energy-water">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {step.title}
                        </h3>
                        {step.description && (
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{step.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {keyword.faq.length > 0 && (
              <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-900/60">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Frequently Asked Questions</h2>
                <div className="mt-4 space-y-4">
                  {keyword.faq.map((item, index) => (
                    <details
                      key={`${keyword.id}-faq-${index}`}
                      className="group rounded-xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900/50"
                      open={index === 0}
                    >
                      <summary className="cursor-pointer list-none text-lg font-medium text-gray-900 dark:text-white flex items-center justify-between">
                        {item.question}
                        <span className="ml-2 text-energy-water group-open:rotate-180 transition-transform">⌄</span>
                      </summary>
                      <p className="mt-3 text-sm text-gray-600 leading-relaxed dark:text-gray-300">
                        {item.answer}
                      </p>
                    </details>
                  ))}
                </div>
              </section>
            )}
          </div>

          <div className="space-y-8">
            <KeywordToolEmbed defaultPrompt={keyword.keyword} />

            <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/70">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Key Points</h3>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-gray-600 dark:text-gray-300">
                <li>Title / H1 / Meta Description naturally include {keyword.keyword}</li>
                <li>Body text (150-300 words) explains the scenario, matching {intentLabel} intent</li>
                <li>Steps & FAQ provide genuine guidance, avoiding keyword stuffing</li>
                <li>Right panel directly connects to Sora2Ai video generator</li>
              </ul>
            </section>

            {relatedKeywords.length > 0 && (
              <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/70">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Related Keywords</h3>
                <div className="mt-4 grid gap-3">
                  {relatedKeywords.map((item) => (
                    <Link
                      key={item.id}
                      href={`/keywords/${item.page_slug}`}
                      className="flex flex-col rounded-xl border border-transparent bg-gray-50 p-3 text-sm text-gray-700 transition hover:border-energy-water hover:bg-white dark:bg-gray-800/60 dark:text-gray-200"
                    >
                      <span className="font-medium text-gray-900 dark:text-white">{item.keyword}</span>
                      {item.region && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">{item.region}</span>
                      )}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/70">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">More Tools</h3>
              <ul className="mt-3 space-y-2 text-sm text-energy-water">
                <li>
                  <Link href="/" className="hover:underline">
                    Back to Sora2Ai Homepage
                  </Link>
                </li>
                <li>
                  <Link href="/prompts" className="hover:underline">
                    View Prompt Library
                  </Link>
                </li>
                <li>
                  <Link href="/video" className="hover:underline">
                    Go to Video Generator
                  </Link>
                </li>
              </ul>
            </section>
          </div>
        </div>
      </main>

      {structuredFaq && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredFaq) }}
        />
      )}
    </div>
  )
}


