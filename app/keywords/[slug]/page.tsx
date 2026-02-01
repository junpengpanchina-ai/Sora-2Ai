import { cache } from 'react'
import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/service'
import type { Database } from '@/types/database'
import { normalizeFaq, normalizeSteps, KEYWORD_INTENT_LABELS } from '@/lib/keywords/schema'
import { isBadKeywordSlug, normalizeKeywordSlug } from '@/lib/keywords/bad-slugs'
import KeywordToolEmbed from '../KeywordToolEmbed'
import ChristmasBGM from '@/components/ChristmasBGM'
import { isProdBuildPhase, shouldSkipStaticGeneration } from '@/lib/utils/buildPhase'

type KeywordRow = Database['public']['Tables']['long_tail_keywords']['Row']

interface KeywordPageRecord extends Omit<KeywordRow, 'steps' | 'faq'> {
  steps: ReturnType<typeof normalizeSteps>
  faq: ReturnType<typeof normalizeFaq>
}

const getKeywordBySlug = cache(async (slug: string): Promise<KeywordPageRecord | null> => {
  // 🔥 添加重试机制，解决构建时的连接错误
  const { withRetryQuery, delay } = await import('@/lib/utils/retry')
  
  // 添加小延迟，避免并发请求过多
  await delay(50)
  
  // Public keyword pages don't require per-request cookies; use service client for build stability.
  let supabase: Awaited<ReturnType<typeof createServiceClient>>
  try {
    supabase = await createServiceClient()
  } catch (error) {
    console.warn('[keywords/getKeywordBySlug] Failed to create service client, skipping:', {
      slug,
      error: error instanceof Error ? error.message : String(error),
    })
    return null
  }
  
  // 先尝试查询原始 slug（不带扩展名）
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let rawData: KeywordRow | null = null
  let error: unknown = null
  try {
    const result = await withRetryQuery<KeywordRow | null>(
    async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return await (supabase as any)
        .from('long_tail_keywords')
        .select('*')
        .eq('status', 'published')
        .eq('page_slug', slug)
        .maybeSingle()
    },
    {
      maxRetries: 3,
      retryDelay: 500,
      exponentialBackoff: true,
    }
  )
    rawData = result.data
    error = result.error
  } catch (caught) {
    console.warn('[keywords/getKeywordBySlug] Network error, skipping slug during build:', {
      slug,
      error: caught instanceof Error ? caught.message : String(caught),
    })
    return null
  }

  // 如果找不到，尝试查询带 .xml 后缀的（兼容旧数据）
  if (!rawData && !slug.endsWith('.xml')) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    try {
    const result = await withRetryQuery<KeywordRow | null>(
      async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return await (supabase as any)
          .from('long_tail_keywords')
          .select('*')
          .eq('status', 'published')
          .eq('page_slug', `${slug}.xml`)
          .maybeSingle()
      },
      {
        maxRetries: 3,
        retryDelay: 500,
        exponentialBackoff: true,
      }
    )
    rawData = result.data
    error = result.error
    } catch (caught) {
      console.warn('[keywords/getKeywordBySlug] Network error on xml fallback, skipping slug during build:', {
        slug,
        error: caught instanceof Error ? caught.message : String(caught),
      })
      return null
    }
  }

  // 如果还是找不到，尝试使用 ILIKE 模糊匹配（处理可能的空格或大小写问题）
  if (!rawData) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    try {
    const result = await withRetryQuery<KeywordRow | null>(
      async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return await (supabase as any)
          .from('long_tail_keywords')
          .select('*')
          .eq('status', 'published')
          .ilike('page_slug', `%${slug}%`)
          .limit(1)
          .maybeSingle()
      },
      {
        maxRetries: 2,
        retryDelay: 500,
        exponentialBackoff: true,
      }
    )
    if (result.data) {
      rawData = result.data
      error = result.error
      console.log(`Found keyword with fuzzy match: ${result.data.page_slug} for slug: ${slug}`)
      }
    } catch (caught) {
      console.warn('[keywords/getKeywordBySlug] Network error on fuzzy fallback, skipping slug during build:', {
        slug,
        error: caught instanceof Error ? caught.message : String(caught),
      })
      return null
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

  try {
    return {
      ...data,
      steps: normalizeSteps(data.steps),
      faq: normalizeFaq(data.faq),
    }
  } catch (err) {
    console.warn('[keywords/getKeywordBySlug] normalize threw, returning null:', {
      slug,
      error: err instanceof Error ? err.message : String(err),
    })
    return null
  }
})

const getRelatedKeywords = cache(async (excludeId: string): Promise<KeywordPageRecord[]> => {
  let supabase: Awaited<ReturnType<typeof createServiceClient>>
  try {
    supabase = await createServiceClient()
  } catch (error) {
    console.warn('[keywords/getRelatedKeywords] Failed to create service client, returning empty list:', {
      excludeId,
      error: error instanceof Error ? error.message : String(error),
    })
    return []
  }
  const { withRetryQuery, delay } = await import('@/lib/utils/retry')
  await delay(30)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let rawData: KeywordRow[] | null = null
  let error: unknown = null
  try {
    const result = await withRetryQuery<KeywordRow[]>(
      async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return await (supabase as any)
    .from('long_tail_keywords')
    .select('*')
    .eq('status', 'published')
    .neq('id', excludeId)
    .order('priority', { ascending: false })
    .order('updated_at', { ascending: false })
    .limit(12)
      },
      {
        maxRetries: 3,
        retryDelay: 500,
        exponentialBackoff: true,
      }
    )
    rawData = result.data
    error = result.error
  } catch (caught) {
    console.warn('[keywords/getRelatedKeywords] Network error, returning empty list:', {
      excludeId,
      error: caught instanceof Error ? caught.message : String(caught),
    })
    return []
  }

  if (error) {
    console.error('Failed to load related keywords:', error)
    return []
  }

  const data = (Array.isArray(rawData) ? rawData : []) as KeywordRow[]

  return data.map((item) => {
    try {
      return {
        ...item,
        steps: normalizeSteps(item.steps),
        faq: normalizeFaq(item.faq),
      }
    } catch {
      return { ...item, steps: [], faq: [] }
    }
  })
})

// 获取相关使用场景（通过关键词匹配）
const getRelatedUseCases = cache(async (keyword: string): Promise<Array<{
  id: string
  slug: string
  title: string
  description: string
  use_case_type: string
}>> => {
  let supabase: Awaited<ReturnType<typeof createServiceClient>>
  try {
    supabase = await createServiceClient()
  } catch (error) {
    console.warn('[keywords/getRelatedUseCases] Failed to create service client, returning empty list:', {
      keyword,
      error: error instanceof Error ? error.message : String(error),
    })
    return []
  }
  const { withRetryQuery, delay } = await import('@/lib/utils/retry')
  await delay(30)

  type UseCaseRowLite = {
    id: string
    slug: string
    title: string
    description: string
    use_case_type: string
    seo_keywords: string[] | null
  }
  
  // 将关键词转换为小写用于匹配
  const keywordLower = keyword.toLowerCase()
  
  // 查找使用场景的 seo_keywords 数组包含此关键词或相关词
  // 由于 Supabase 不支持直接查询数组包含，我们使用文本搜索
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let rawUseCases: UseCaseRowLite[] | null = null
  let error: unknown = null
  try {
    const result = await withRetryQuery<UseCaseRowLite[]>(
      async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return await (supabase as any)
    .from('use_cases')
    .select('id, slug, title, description, use_case_type, seo_keywords')
    .eq('is_published', true)
    .limit(10)
      },
      {
        maxRetries: 3,
        retryDelay: 500,
        exponentialBackoff: true,
      }
    )
    rawUseCases = result.data
    error = result.error
  } catch (caught) {
    console.warn('[keywords/getRelatedUseCases] Network error, returning empty list:', {
      keyword,
      error: caught instanceof Error ? caught.message : String(caught),
    })
    return []
  }

  const data = Array.isArray(rawUseCases) ? rawUseCases : []

  if (error || data.length === 0) {
    return []
  }

  // 在应用层过滤：检查 seo_keywords 数组是否包含相关关键词
  const matched: Array<{
    id: string
    slug: string
    title: string
    description: string
    use_case_type: string
  }> = data
    .filter((uc) => {
      if (!uc.seo_keywords || uc.seo_keywords.length === 0) return false
      // 检查关键词是否包含在 seo_keywords 中，或 seo_keywords 中的词是否包含在关键词中
      return uc.seo_keywords.some(
        (seoKw) => keywordLower.includes(seoKw.toLowerCase()) || seoKw.toLowerCase().includes(keywordLower)
      )
    })
    .slice(0, 6)
    .map(({ id, slug, title, description, use_case_type }) => ({
      id,
      slug,
      title,
      description,
      use_case_type,
    }))

  return matched
})

// 获取所有已发布的关键词 slugs（用于静态生成）
// 预生成热门关键词（按 priority 和 search_volume 排序）
export async function generateStaticParams() {
  if (isProdBuildPhase() && shouldSkipStaticGeneration()) {
    return []
  }

  // To keep production builds stable (avoid flaky Supabase connections during SSG),
  // we disable keyword SSG by default. Enable explicitly via env:
  //   ENABLE_KEYWORD_SSG=true
  if (process.env.ENABLE_KEYWORD_SSG !== 'true') {
    return []
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return []
  }

  try {
    // 在静态生成时使用 service client，不需要 cookies
    const supabase = await createServiceClient()
    
    // 限制静态生成的数量，避免构建时间过长/并发请求过多
    // 只预生成最热门的 200 个关键词，其余的动态渲染（使用 ISR）
    const MAX_STATIC_PAGES = 200
    
    // 🔥 添加重试机制和请求延迟，解决构建时的连接错误
    const { withRetryQuery, delay } = await import('@/lib/utils/retry')
    
    // 添加初始延迟，避免同时发起大量请求
    await delay(100)
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await withRetryQuery(
      async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return await (supabase as any)
          .from('long_tail_keywords')
          .select('page_slug')
          .eq('status', 'published')
          .not('page_slug', 'is', null) // 确保 page_slug 不为 null
          .neq('page_slug', '') // 确保 page_slug 不为空字符串
          .order('priority', { ascending: false }) // 按优先级降序
          .order('search_volume', { ascending: false, nullsLast: true }) // 按搜索量降序
          .order('created_at', { ascending: false }) // 按创建时间倒序
          .limit(MAX_STATIC_PAGES) // 限制数量
      },
      {
        maxRetries: 5, // 最多重试 5 次
        retryDelay: 1000, // 初始延迟 1 秒
        exponentialBackoff: true, // 指数退避
        onRetry: (attempt, error) => {
          console.warn(`[keywords/generateStaticParams] 重试 ${attempt}/5:`, error instanceof Error ? error.message : String(error))
        },
      }
    )
    
    if (error) {
      console.error('[keywords/generateStaticParams] 查询错误:', error)
      return []
    }
    
    if (!data || !Array.isArray(data)) {
      return []
    }
    
    // 过滤掉无效的 slug，并确保类型安全
    // 文件系统限制：大多数系统限制文件名在 255 字符以内
    // 考虑到路径前缀，我们限制 slug 在 100 字符以内
    const MAX_SLUG_LENGTH = 100
    
    const filtered = data
      .filter((item: { page_slug: string | null }) => {
        if (!item.page_slug || typeof item.page_slug !== 'string') {
          return false
        }
        // 移除可能的 .xml 后缀（兼容旧数据）
        const slug = item.page_slug.replace(/\.xml$/, '')
        const trimmed = slug.trim()
        if (trimmed.length === 0 || trimmed.length > MAX_SLUG_LENGTH) return false
        if (isBadKeywordSlug(trimmed)) return false // P0: exclude bad slugs from SSG
        return true
      })
      .map((item: { page_slug: string }) => {
        // 移除可能的 .xml 后缀
        const slug = item.page_slug.replace(/\.xml$/, '').trim()
        return { slug }
      })
    
    console.log(`[keywords/generateStaticParams] 生成 ${filtered.length} 个静态页面（限制: ${MAX_STATIC_PAGES}）`)
    
    return filtered
  } catch (error) {
    console.error('[keywords/generateStaticParams] 异常:', error)
    return []
  }
}

// 启用 ISR（增量静态再生）以提升性能和 SEO
// dynamic = 'auto' 允许静态生成，也支持动态渲染
export const dynamic = 'auto'
export const revalidate = 3600 // ISR: 每小时重新验证
export const dynamicParams = true // 允许动态渲染未预生成的页面

type PageProps = {
  params: {
    slug: string
  }
}

const buildMetaTitle = (keyword: KeywordPageRecord): string => {
  if (keyword?.title && typeof keyword.title === 'string') return keyword.title
  const kw = keyword?.keyword
  return `${typeof kw === 'string' ? kw : 'Keyword'} | Sora2Ai Video Generator`
}

const buildMetaDescription = (keyword: KeywordPageRecord): string => {
  if (keyword?.meta_description && typeof keyword.meta_description === 'string') {
    return keyword.meta_description
  }
  const intro = keyword?.intro_paragraph
  if (intro && typeof intro === 'string') return intro.slice(0, 155)
  const kw = keyword?.keyword
  return `Generate ${typeof kw === 'string' ? kw : 'keyword'} video content online, including steps, FAQ, and direct tool access.`
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    let slug = params.slug
    try {
      slug = decodeURIComponent(params.slug)
    } catch {
      return { title: 'Keyword Not Found', robots: { index: false, follow: false } }
    }
    const keyword = await getKeywordBySlug(slug.trim())
    if (!keyword) {
      return {
        title: 'Keyword Not Found',
        robots: { index: false, follow: false },
      }
    }

    const { getKeywordPageUrl } = await import('@/lib/utils/url')
    const canonical = getKeywordPageUrl((keyword.page_slug || '').toString().replace(/\.xml$/i, ''))

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
  } catch {
    return { title: 'Keyword Not Found', robots: { index: false, follow: false } }
  }
}

export default async function KeywordLandingPage({ params }: PageProps) {
  try {
    let slug: string
    try {
      slug = decodeURIComponent(params.slug)
    } catch {
      notFound()
    }
    const trimmed = slug.trim()
    if (!trimmed) {
      notFound()
    }
    // P0: Bad slugs (double prefix) → 308 to canonical; overlong → 404
    if (isBadKeywordSlug(trimmed)) {
      if (trimmed.length <= 200) {
        redirect(`/keywords/${encodeURIComponent(normalizeKeywordSlug(trimmed))}`)
      }
      notFound()
    }
    
    const keyword = await getKeywordBySlug(trimmed)
    if (!keyword) {
      notFound()
    }
    
    console.log(`KeywordLandingPage: Found keyword with page_slug: ${keyword.page_slug}`)

    // Use Promise.allSettled to prevent one failure from breaking the page
    const [relatedKeywordsResult, relatedUseCasesResult] = await Promise.allSettled([
      getRelatedKeywords(keyword.id),
      getRelatedUseCases(keyword.keyword),
    ])
    
    const relatedKeywords = relatedKeywordsResult.status === 'fulfilled' ? relatedKeywordsResult.value : []
    const relatedUseCases = relatedUseCasesResult.status === 'fulfilled' ? relatedUseCasesResult.value : []
    
    if (relatedKeywordsResult.status === 'rejected') {
      console.error('[KeywordLandingPage] Failed to fetch related keywords:', relatedKeywordsResult.reason)
    }
    if (relatedUseCasesResult.status === 'rejected') {
      console.error('[KeywordLandingPage] Failed to fetch related use cases:', relatedUseCasesResult.reason)
    }
  const structuredFaq =
    keyword.faq?.length > 0
      ? (() => {
          try {
            return {
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: keyword.faq
                .filter((item) => item?.question && item?.answer)
                .map((item) => ({
                  '@type': 'Question',
                  name: String(item.question),
                  acceptedAnswer: { '@type': 'Answer', text: String(item.answer) },
                })),
            }
          } catch {
            return null
          }
        })()
      : null

  const heroTitle = (keyword.h1 || keyword.keyword || '').toString()
  const intro = (keyword.intro_paragraph ?? '') && typeof keyword.intro_paragraph === 'string' ? keyword.intro_paragraph : ''
  const intentLabel = KEYWORD_INTENT_LABELS[keyword.intent as keyof typeof KEYWORD_INTENT_LABELS] ?? ''
  const pageStyle = (keyword.page_style ?? 'default') as string
  const isChristmas = pageStyle === 'christmas'

  // Additional Structured Data for Keyword Page
  const { getKeywordPageUrl, getKeywordPath } = await import('@/lib/utils/url')
  const canonical = getKeywordPageUrl(keyword.page_slug)
  
  const metaTitle = buildMetaTitle(keyword)
  const metaDesc = buildMetaDescription(keyword)
  const keywordStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: metaTitle,
    description: metaDesc,
    url: canonical,
    mainEntity: {
      '@type': 'Article',
      headline: heroTitle,
      description: metaDesc,
      articleBody: typeof intro === 'string' ? intro : '',
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
        dangerouslySetInnerHTML={{
          __html: (() => {
            try {
              return JSON.stringify(keywordStructuredData)
            } catch {
              return '{}'
            }
          })(),
        }}
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
            <KeywordToolEmbed defaultPrompt={typeof keyword.keyword === 'string' ? keyword.keyword : ''} />

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
                  <Link href="/video" className="hover:underline">
                    Go to Video Generator
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
                      href={getKeywordPath(item.page_slug)}
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
  } catch (error) {
    // Log error for debugging but return 404 to prevent 5xx errors
    console.error('[KeywordLandingPage] Error rendering page:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      slug: params.slug,
    })
    // Return 404 instead of 500 to prevent indexing issues
    notFound()
  }
}


