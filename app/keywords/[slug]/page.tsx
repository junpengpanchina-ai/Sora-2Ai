import { cache } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'
import { normalizeFaq, normalizeSteps, KEYWORD_INTENT_LABELS } from '@/lib/keywords/schema'
import KeywordToolEmbed from '../KeywordToolEmbed'
import ChristmasBGM from '@/components/ChristmasBGM'

type KeywordRow = Database['public']['Tables']['long_tail_keywords']['Row']

interface KeywordPageRecord extends Omit<KeywordRow, 'steps' | 'faq'> {
  steps: ReturnType<typeof normalizeSteps>
  faq: ReturnType<typeof normalizeFaq>
}

const getKeywordBySlug = cache(async (slug: string): Promise<KeywordPageRecord | null> => {
  const supabase = await createSupabaseServerClient()
  
  // 先尝试查询原始 slug（不带扩展名）
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let { data: rawData, error } = await (supabase as any)
    .from('long_tail_keywords')
    .select('*')
    .eq('status', 'published')
    .eq('page_slug', slug)
    .maybeSingle()

  // 如果找不到，尝试查询带 .xml 后缀的（兼容旧数据）
  if (!rawData && !slug.endsWith('.xml')) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (supabase as any)
      .from('long_tail_keywords')
      .select('*')
      .eq('status', 'published')
      .eq('page_slug', `${slug}.xml`)
      .maybeSingle()
    rawData = result.data
    error = result.error
  }

  // 如果还是找不到，尝试使用 ILIKE 模糊匹配（处理可能的空格或大小写问题）
  if (!rawData) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (supabase as any)
      .from('long_tail_keywords')
      .select('*')
      .eq('status', 'published')
      .ilike('page_slug', `%${slug}%`)
      .limit(1)
      .maybeSingle()
    if (result.data) {
      rawData = result.data
      error = result.error
      console.log(`Found keyword with fuzzy match: ${result.data.page_slug} for slug: ${slug}`)
    }
  }

  if (error) {
    console.error('Failed to load keyword:', error)
    return null
  }

  if (!rawData) {
    console.log(`Keyword not found for slug: ${slug}`)
    return null
  }
  
  console.log(`Found keyword: ${rawData.page_slug} for slug: ${slug}`)
  
  // 如果找到的关键词 page_slug 包含 .xml，记录警告
  if (rawData.page_slug && rawData.page_slug.includes('.xml')) {
    console.warn(`Warning: Found keyword with .xml in page_slug: ${rawData.page_slug} for slug: ${slug}`)
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

// 获取相关使用场景（通过关键词匹配）
const getRelatedUseCases = cache(async (keyword: string): Promise<Array<{
  id: string
  slug: string
  title: string
  description: string
  use_case_type: string
}>> => {
  const supabase = await createSupabaseServerClient()
  
  // 将关键词转换为小写用于匹配
  const keywordLower = keyword.toLowerCase()
  
  // 查找使用场景的 seo_keywords 数组包含此关键词或相关词
  // 由于 Supabase 不支持直接查询数组包含，我们使用文本搜索
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('use_cases')
    .select('id, slug, title, description, use_case_type, seo_keywords')
    .eq('is_published', true)
    .limit(10)

  if (error || !data) {
    return []
  }

  // 在应用层过滤：检查 seo_keywords 数组是否包含相关关键词
  const matched = data
    .filter((uc: { seo_keywords: string[] | null }) => {
      if (!uc.seo_keywords || uc.seo_keywords.length === 0) return false
      // 检查关键词是否包含在 seo_keywords 中，或 seo_keywords 中的词是否包含在关键词中
      return uc.seo_keywords.some(seoKw => 
        keywordLower.includes(seoKw.toLowerCase()) || 
        seoKw.toLowerCase().includes(keywordLower)
      )
    })
    .slice(0, 6)
    .map((uc: { seo_keywords: unknown }) => {
      // 移除 seo_keywords 字段，只返回需要的字段
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { seo_keywords, ...rest } = uc
      return rest
    })

  return matched
})

export const dynamic = 'force-dynamic'
export const revalidate = 0

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

  const { getKeywordPageUrl } = await import('@/lib/utils/url')
  const canonical = getKeywordPageUrl(keyword.page_slug)

  return {
    title: buildMetaTitle(keyword),
    description: buildMetaDescription(keyword),
    alternates: {
      canonical,
    },
    openGraph: {
      type: 'article',
      title: buildMetaTitle(keyword),
      description: buildMetaDescription(keyword),
      url: canonical,
    },
  }
}

export default async function KeywordLandingPage({ params }: PageProps) {
  const slug = decodeURIComponent(params.slug)
  console.log(`KeywordLandingPage: Requested slug: ${slug}, params.slug: ${params.slug}`)
  
  const keyword = await getKeywordBySlug(slug)
  if (!keyword) {
    console.error(`KeywordLandingPage: Keyword not found for slug: ${slug}`)
    notFound()
  }
  
  console.log(`KeywordLandingPage: Found keyword with page_slug: ${keyword.page_slug}`)

  const relatedKeywords = await getRelatedKeywords(keyword.id)
  const relatedUseCases = await getRelatedUseCases(keyword.keyword)
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
  const pageStyle = keyword.page_style ?? 'default'
  const isChristmas = pageStyle === 'christmas'

  // Additional Structured Data for Keyword Page
  const { getKeywordPageUrl } = await import('@/lib/utils/url')
  const canonical = getKeywordPageUrl(keyword.page_slug)
  
  const keywordStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: buildMetaTitle(keyword),
    description: buildMetaDescription(keyword),
    url: canonical,
    mainEntity: {
      '@type': 'Article',
      headline: heroTitle,
      description: buildMetaDescription(keyword),
      articleBody: intro,
      author: {
        '@type': 'Organization',
        name: 'Sora2Ai Videos',
      },
      publisher: {
        '@type': 'Organization',
        name: 'Sora2Ai Videos',
        logo: {
          '@type': 'ImageObject',
          url: 'https://sora2aivideos.com/icon.svg',
        },
      },
    },
  }

  return (
    <>
      {/* Structured Data for Keyword Page */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(keywordStructuredData) }}
      />
      <ChristmasBGM enabled={isChristmas} />
      <div className={`bg-slate-50 dark:bg-gray-950 ${isChristmas ? 'christmas-theme' : ''}`}>
        <div className={`relative overflow-hidden border-b border-white/20 ${isChristmas ? '' : 'bg-gradient-to-br from-[#050b18] via-[#09122C] to-[#050b18]'}`}>
          {isChristmas ? (
            <>
              <div className="christmas-bg absolute inset-0" aria-hidden="true" />
              <div className="christmas-snow absolute inset-0" aria-hidden="true" />
              <div className="christmas-glow absolute inset-0" aria-hidden="true" />
              <div className="christmas-lights absolute inset-0" aria-hidden="true" />
            </>
          ) : (
            <>
              <div className="cosmic-space absolute inset-0 opacity-60" aria-hidden="true" />
              <div className="cosmic-glow absolute inset-0 opacity-50" aria-hidden="true" />
            </>
          )}
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
              <section 
                className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-900/60"
                id="faq-section"
              >
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Frequently Asked Questions</h2>
                <div className="mt-4 space-y-4">
                  {keyword.faq.map((item, index) => (
                    <div
                      key={`${keyword.id}-faq-${index}`}
                      className="rounded-xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900/50"
                    >
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {item.question}
                      </h3>
                      <p className="mt-3 text-sm text-gray-600 leading-relaxed dark:text-gray-300">
                        {item.answer}
                      </p>
                    </div>
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

            {/* Related Use Cases */}
            {relatedUseCases.length > 0 && (
              <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/70">
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">Related Use Cases</h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Explore comprehensive guides for this keyword:
                </p>
                <div className="mt-4 space-y-3">
                  {relatedUseCases.map((useCase) => (
                    <Link
                      key={useCase.id}
                      href={`/use-cases/${useCase.slug}`}
                      className="block rounded-xl border border-gray-200 bg-gray-50 p-4 transition hover:border-energy-water hover:bg-white dark:border-gray-700 dark:bg-gray-800/60 dark:hover:bg-gray-700"
                    >
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {useCase.title}
                      </h4>
                      {useCase.description && (
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {useCase.description}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Link
                    href="/use-cases"
                    className="text-sm text-energy-water hover:underline font-medium"
                  >
                    View all use cases →
                  </Link>
                </div>
              </section>
            )}

            {/* Related Keywords */}
            {relatedKeywords.length > 0 && (
              <section 
                className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/70 flex flex-col"
                id="related-keywords-section"
              >
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">Related Keywords</h3>
                <div className="mt-4 grid gap-3 flex-1">
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
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Link
                    href="/keywords"
                    className="text-sm text-energy-water hover:underline font-medium"
                  >
                    Want to learn more? View all keywords →
                  </Link>
                </div>
              </section>
            )}
          </div>
        </div>
      </main>

      {structuredFaq && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredFaq) }}
        />
      )}
      
      {/* 动态对齐 Related Keywords 和 FAQ 的高度 */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              function alignHeights() {
                try {
                  const faqSection = document.getElementById('faq-section');
                  const relatedSection = document.getElementById('related-keywords-section');
                  
                  if (faqSection && relatedSection && faqSection.isConnected && relatedSection.isConnected) {
                    const faqHeight = faqSection.offsetHeight;
                    relatedSection.style.minHeight = faqHeight + 'px';
                  }
                } catch (error) {
                  // Silently fail if elements are not found or not connected
                  console.debug('Align heights error (safe to ignore):', error);
                }
              }
              
              // 页面加载后执行
              if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', alignHeights);
              } else {
                alignHeights();
              }
              
              // 窗口大小改变时重新对齐
              window.addEventListener('resize', alignHeights);
            })();
          `,
        }}
      />
      </div>
    </>
  )
}


