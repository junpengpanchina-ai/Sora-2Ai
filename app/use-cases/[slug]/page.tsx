import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getBaseUrl } from '@/lib/utils/url'
import { createServiceClient } from '@/lib/supabase/service'
import { cache } from 'react'
import type { Database } from '@/types/database'
import UseCaseToolEmbed from '../UseCaseToolEmbed'
import { parseMarkdownSections, markdownToHtml } from '@/lib/utils/markdown-parser'
import CosmicBackground from '@/components/CosmicBackground'
import LazyRelatedContent from '@/components/LazyRelatedContent'
import { RelatedTier1Links } from '@/components/RelatedTier1Links'
import { isProdBuildPhase, shouldSkipStaticGeneration } from '@/lib/utils/buildPhase'

type UseCaseRow = Database['public']['Tables']['use_cases']['Row']

// 从数据库获取使用场景
const getUseCaseBySlug = cache(async (slug: string) => {
  try {
    // 验证 slug 基本有效性（不为空）
    if (!slug || typeof slug !== 'string' || slug.trim().length === 0) {
      console.warn('[getUseCaseBySlug] 无效的 slug:', slug)
      return null
    }

    const trimmedSlug = slug.trim()

    // 使用 service client 避免 cookies，支持静态生成和动态渲染
    const supabase = await createServiceClient()
    
    // 🔥 添加重试机制和请求延迟，解决构建时的连接错误
    const { withRetryQuery, delay } = await import('@/lib/utils/retry')
    
    // 添加小延迟，避免并发请求过多
    await delay(50)
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await withRetryQuery(
      async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return await (supabase as any)
          .from('use_cases')
          .select('*')
          .eq('slug', trimmedSlug)
          .eq('is_published', true)
          .maybeSingle()
      },
      {
        maxRetries: 3,
        retryDelay: 500,
        exponentialBackoff: true,
        onRetry: (attempt, error) => {
          console.warn(`[getUseCaseBySlug] 重试 ${attempt}/3:`, error instanceof Error ? error.message : String(error))
        },
      }
    )

    if (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errorObj = error as any
      console.error('[getUseCaseBySlug] 查询错误:', {
        slug: trimmedSlug,
        error: error instanceof Error ? error.message : String(error),
        code: errorObj?.code,
        details: errorObj?.details,
        hint: errorObj?.hint,
      })
      return null
    }

    if (!data) {
      console.warn('[getUseCaseBySlug] 未找到使用场景:', trimmedSlug)
      return null
    }

    // 验证必要字段
    const useCase = data as UseCaseRow
    if (!useCase.slug || !useCase.title || !useCase.content) {
      console.warn('[getUseCaseBySlug] 使用场景数据不完整:', {
        slug: trimmedSlug,
        hasSlug: !!useCase.slug,
        hasTitle: !!useCase.title,
        hasContent: !!useCase.content,
      })
      return null
    }

    // 确保数组字段是有效的数组
    if (useCase.seo_keywords && !Array.isArray(useCase.seo_keywords)) {
      useCase.seo_keywords = []
    }
    if (useCase.featured_prompt_ids && !Array.isArray(useCase.featured_prompt_ids)) {
      useCase.featured_prompt_ids = []
    }
    if (useCase.related_use_case_ids && !Array.isArray(useCase.related_use_case_ids)) {
      useCase.related_use_case_ids = []
    }

    return useCase
  } catch (error) {
    console.error('[getUseCaseBySlug] 异常:', {
      slug,
      error: error instanceof Error ? error.message : '未知错误',
    })
    return null
  }
})

// 获取相关使用场景
const getRelatedUseCases = cache(async (excludeId: string, useCaseType: string, limit = 6) => {
  try {
    // 使用 service client 避免 cookies，支持静态生成
    const supabase = await createServiceClient()
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('use_cases')
      .select('id, slug, title, description, use_case_type')
      .eq('is_published', true)
      .eq('use_case_type', useCaseType)
      .neq('id', excludeId)
      .limit(limit)

    if (error) {
      console.error('[getRelatedUseCases] 查询错误:', {
        excludeId,
        useCaseType,
        error: error.message,
        code: error.code,
      })
      return []
    }

    if (!data || !Array.isArray(data)) {
      return []
    }

    return data as Pick<UseCaseRow, 'id' | 'slug' | 'title' | 'description' | 'use_case_type'>[]
  } catch (error) {
    console.error('[getRelatedUseCases] 异常:', error)
    return []
  }
})

// 获取属于这个使用场景的长尾词页面
const getRelatedKeywords = cache(async (seoKeywords: string[], useCaseType: string, limit = 12) => {
  if (!seoKeywords || seoKeywords.length === 0) {
    return []
  }

  try {
    // 使用 service client 避免 cookies，支持静态生成
    const supabase = await createServiceClient()
    
    // 通过关键词匹配长尾词
    // 清理和转义关键词，避免 PostgreSQL 查询错误
    const cleanKeywords = seoKeywords
      .slice(0, 5) // 限制最多 5 个关键词，避免查询过于复杂
      .map(kw => {
        // 清理关键词：移除特殊字符，只保留字母、数字和空格
        const cleaned = kw
          .toLowerCase()
          .trim()
          .replace(/[%'"]/g, '') // 移除 PostgreSQL 特殊字符
          .replace(/[^a-z0-9\s-]/g, ' ') // 只保留字母、数字、空格和连字符
          .replace(/\s+/g, ' ') // 合并多个空格
          .trim()
        
        // 只保留有意义的关键词（至少 3 个字符）
        return cleaned.length >= 3 ? cleaned : null
      })
      .filter((kw): kw is string => kw !== null && kw.length > 0)
      .slice(0, 3) // 进一步限制到 3 个关键词，避免查询过于复杂

    if (cleanKeywords.length === 0) {
      return []
    }

    // 使用更安全的查询方式：逐个查询并合并结果
    // 这样可以避免复杂的 OR 查询导致的解析错误
    const allResults: Array<{
      id: string
      keyword: string
      page_slug: string
      title: string | null
      h1: string | null
      meta_description: string | null
    }> = []
    const seenIds = new Set<string>()

    for (const keyword of cleanKeywords) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
          .from('long_tail_keywords')
          .select('id, keyword, page_slug, title, h1, meta_description')
          .eq('status', 'published')
          .ilike('keyword', `%${keyword}%`)
          .limit(limit)

        if (!error && data && Array.isArray(data)) {
          for (const item of data) {
            if (!seenIds.has(item.id)) {
              seenIds.add(item.id)
              allResults.push(item)
              if (allResults.length >= limit) {
                break
              }
            }
          }
        }

        if (allResults.length >= limit) {
          break
        }
      } catch (err) {
        console.warn('[getRelatedKeywords] 单个关键词查询失败:', {
          keyword,
          error: err instanceof Error ? err.message : '未知错误',
        })
        // 继续处理下一个关键词
      }
    }

    // 返回去重后的结果
    return allResults.slice(0, limit)
  } catch (error) {
    console.error('[getRelatedKeywords] 异常:', error)
    return []
  }
})

// 获取所有已发布的使用场景 slugs（用于静态生成）
export async function generateStaticParams() {
  // 🔥 构建时如果环境变量未设置或构建超时，返回空数组，使用动态渲染
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('[generateStaticParams] Environment variables not set, skipping static generation, using dynamic rendering')
    return []
  }

  // 🔥 如果设置了 SKIP_STATIC_GENERATION，跳过静态生成（用于快速构建）
  if (isProdBuildPhase() && shouldSkipStaticGeneration()) {
    console.warn('[generateStaticParams] SKIP_STATIC_GENERATION=true, skipping static generation, using dynamic rendering')
    return []
  }

  // 🔥 构建时限制静态生成数量，避免超时
  // 如果构建环境设置了 BUILD_STATIC_LIMIT，使用该值，否则使用较小的默认值
  const MAX_STATIC_PAGES = process.env.BUILD_STATIC_LIMIT 
    ? parseInt(process.env.BUILD_STATIC_LIMIT, 10) 
    : 10 // 默认只生成 10 个，避免构建超时

  try {
    // 在静态生成时使用 service client，不需要 cookies
    const supabase = await createServiceClient()
    
    // 限制静态生成的数量，避免构建时间过长
    // 只预生成最新的 N 个 use_cases，其余的动态渲染（ISR）
    // 这样可以显著降低构建期对 Supabase 的并发压力，避免 ECONNRESET/fetch failed
    
    // 🔥 添加重试机制和请求延迟，解决构建时的连接错误
    const { withRetryQuery, delay } = await import('@/lib/utils/retry')
    
    // 添加初始延迟，避免同时发起大量请求
    await delay(200)
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await withRetryQuery(
      async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return await (supabase as any)
          .from('use_cases')
          .select('slug')
          .eq('is_published', true)
          .not('slug', 'is', null) // 确保 slug 不为 null
          .neq('slug', '') // 确保 slug 不为空字符串
          .order('created_at', { ascending: false }) // 按创建时间倒序，优先生成最新的
          .limit(MAX_STATIC_PAGES) // 限制数量
      },
      {
        maxRetries: 5, // 最多重试 5 次
        retryDelay: 1000, // 初始延迟 1 秒
        exponentialBackoff: true, // 指数退避
        onRetry: (attempt, error) => {
          console.warn(`[generateStaticParams] 重试 ${attempt}/5:`, error instanceof Error ? error.message : String(error))
        },
      }
    )

    if (error) {
      console.error('[generateStaticParams] 查询错误:', error)
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
      .filter((item: { slug: string | null }) => {
        if (!item.slug || typeof item.slug !== 'string') {
          return false
        }
        const trimmed = item.slug.trim()
        // 过滤掉空字符串和过长的 slug
        return trimmed.length > 0 && trimmed.length <= MAX_SLUG_LENGTH
      })
      .map((item: { slug: string }) => ({
        slug: item.slug.trim(),
      }))
    
    console.log(`[generateStaticParams] Generating ${filtered.length} static pages (limit: ${MAX_STATIC_PAGES})`)
    
    return filtered
  } catch (error) {
    console.error('[generateStaticParams] 异常:', error)
    return []
  }
}

export async function generateMetadata({ 
  params 
}: { 
  params: { slug: string } 
}): Promise<Metadata> {
  const useCase = await getUseCaseBySlug(params.slug)
  
  if (!useCase) {
    return {
      title: 'Use Case Not Found',
    }
  }

  const url = `${getBaseUrl()}/use-cases/${params.slug}`
  const canonical =
    useCase.canonical_url && typeof useCase.canonical_url === 'string' && useCase.canonical_url.trim().length > 0
      ? useCase.canonical_url.startsWith('http')
        ? useCase.canonical_url
        : `${getBaseUrl()}${useCase.canonical_url.startsWith('/') ? '' : '/'}${useCase.canonical_url}`
      : url
  const title = `${useCase.title} - AI Video Use Case | Sora Alternative`
  const description = useCase.description || `Learn how to use AI video generation for ${useCase.title.toLowerCase()}. Create professional videos with our Sora alternative text-to-video AI tool.`

  return {
    title,
    description,
    robots: useCase.noindex
      ? {
          index: false,
          follow: true,
        }
      : undefined,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'article',
    },
  }
}

export const revalidate = 3600 // Revalidate every hour

// 允许动态渲染未在 generateStaticParams 中的 slug
// 这样过长的 slug 可以动态渲染，而不是返回 404
export const dynamicParams = true

const USE_CASE_TYPE_LABELS: Record<string, string> = {
  'advertising-promotion': 'Advertising & Promotion',
  'social-media-content': 'Social Media Content',
  'product-demo-showcase': 'Product Demo & Showcase',
  'brand-storytelling': 'Brand Storytelling',
  'education-explainer': 'Education & Explainer',
  'ugc-creator-content': 'UGC & Creator Content',
}

export default async function UseCasePage({ params }: { params: { slug: string } }) {
  try {
    // 验证 slug 基本有效性（不为空）
    if (!params.slug || typeof params.slug !== 'string' || params.slug.trim().length === 0) {
      console.warn('[UseCasePage] Slug 无效:', params.slug)
      notFound()
    }

    // 注意：我们不再检查 slug 长度，因为：
    // 1. 过长的 slug 不会被静态生成（在 generateStaticParams 中过滤）
    // 2. 但可以通过动态渲染访问（dynamicParams = true）
    // 3. 如果数据库中确实存在这个 use case，应该允许访问

    const useCase = await getUseCaseBySlug(params.slug.trim())
    
    if (!useCase) {
      console.warn('[UseCasePage] 使用场景不存在:', params.slug)
      notFound()
    }

    // ✅ 合并页：如果设置了 canonical_url，直接重定向到 canonical（把近似句式/重复页收敛到主 Scene）
    if (
      useCase.canonical_url &&
      typeof useCase.canonical_url === 'string' &&
      useCase.canonical_url.trim().length > 0
    ) {
      const target = useCase.canonical_url.startsWith('http')
        ? useCase.canonical_url
        : useCase.canonical_url.startsWith('/')
          ? useCase.canonical_url
          : `/${useCase.canonical_url}`

      const current = `/use-cases/${params.slug.trim()}`
      if (target !== current) {
        const { redirect } = await import('next/navigation')
        redirect(target)
      }
    }

    // 确保 seo_keywords 是有效的数组
    const seoKeywords = Array.isArray(useCase.seo_keywords) 
      ? useCase.seo_keywords.filter((k): k is string => typeof k === 'string' && k.trim().length > 0)
      : []

    // 并行获取相关数据，即使失败也不影响主页面渲染
    const [relatedUseCasesResult, relatedKeywordsResult] = await Promise.allSettled([
      getRelatedUseCases(
        useCase.id,
        useCase.use_case_type || 'other',
        6
      ),
      getRelatedKeywords(
        seoKeywords,
        useCase.use_case_type || 'other',
        12
      ),
    ])

    const relatedUseCases = relatedUseCasesResult.status === 'fulfilled' ? relatedUseCasesResult.value : []
    const relatedKeywords = relatedKeywordsResult.status === 'fulfilled' ? relatedKeywordsResult.value : []

    if (relatedUseCasesResult.status === 'rejected') {
      console.error('[UseCasePage] 获取相关使用场景失败:', relatedUseCasesResult.reason)
    }
    if (relatedKeywordsResult.status === 'rejected') {
      console.error('[UseCasePage] 获取相关关键词失败:', relatedKeywordsResult.reason)
    }

    // Structured Data
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: useCase.h1 || useCase.title,
    description: useCase.description,
    author: {
      '@type': 'Organization',
      name: 'Sora2Ai Videos',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Sora2Ai Videos',
      logo: {
        '@type': 'ImageObject',
        url: `${getBaseUrl()}/icon.svg`,
      },
    },
    keywords: Array.isArray(useCase.seo_keywords) 
      ? useCase.seo_keywords.filter((k): k is string => typeof k === 'string').join(', ')
      : '',
    articleBody: useCase.content,
  }

  // 从使用场景中提取简洁的默认 prompt（用于视频生成）
  // 只提取核心关键词，生成简洁的提示词（50-100字符）
  const getDefaultPrompt = (): string => {
    // 优先使用标题，生成简洁的提示词
    const title = useCase.title.toLowerCase()
    
    // 从标题中提取核心关键词（移除常见词汇）
    const keywords = title
      .replace(/\b(ai|video|generation|for|how|to|use|create|make|generate)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim()
    
    // 如果有关键词，生成简洁的提示词
    if (keywords && keywords.length > 5) {
      // 限制在80字符以内，简洁明了
      const shortKeywords = keywords.length > 50 ? keywords.substring(0, 50) + '...' : keywords
      return `Create a professional ${shortKeywords} video with high-quality visuals and smooth transitions`
    }
    
    // 如果标题太短，使用通用格式
    return `Create a professional ${title} video with engaging visuals`
  }

  const defaultPrompt = getDefaultPrompt()

  // 解析 Markdown 内容，按照 H2 标题分割
  const contentSections = parseMarkdownSections(useCase.content)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      <div className="bg-slate-50 dark:bg-gray-950">
        {/* Hero Section - 参考关键词页面的深色渐变头部 */}
        <div className="relative overflow-hidden border-b border-white/20 bg-gradient-to-br from-[#050b18] via-[#09122C] to-[#050b18]">
          {/* 🔥 Performance optimization: Lazy load background effects */}
          <div className="absolute inset-0 opacity-60" aria-hidden="true">
            <CosmicBackground />
          </div>
          <div className="relative z-10 mx-auto max-w-6xl px-6 py-16 text-white">
            <div className="flex flex-wrap items-center gap-3 text-sm uppercase tracking-[0.2em] text-energy-water">
              <span>Use Case</span>
              <span className="text-white/50">/</span>
              <span>{USE_CASE_TYPE_LABELS[useCase.use_case_type] || useCase.use_case_type}</span>
            </div>
            <h1 className="mt-6 text-2xl font-bold leading-tight text-white sm:text-3xl lg:text-4xl">
              {useCase.h1 || useCase.title}
            </h1>
            {useCase.description && (
              <p className="mt-4 max-w-3xl text-base text-blue-100/80 sm:text-lg">{useCase.description}</p>
            )}
            
            {/* 醒目的视频生成 CTA 按钮 */}
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`/video?prompt=${encodeURIComponent(defaultPrompt)}`}
                className="inline-flex items-center gap-2 rounded-full bg-energy-water px-6 py-3 text-base font-semibold text-white shadow-lg transition hover:bg-energy-water-deep hover:shadow-xl"
              >
                <span>🎬</span>
                <span>Generate Video Now</span>
                <span>→</span>
              </Link>
              <a
                href="#video-generator"
                className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-3 text-base font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
              >
                <span>📝</span>
                <span>Try In-Page</span>
              </a>
            </div>
            <p className="mt-2 text-sm text-blue-100/70">Free to try • No credit card required</p>
            
            <div className="mt-6 flex flex-wrap gap-3 text-xs text-white/70">
              <span className="rounded-full border border-white/30 px-3 py-1">Use Case: {useCase.title}</span>
              <span className="rounded-full border border-white/30 px-3 py-1">
                Type: {USE_CASE_TYPE_LABELS[useCase.use_case_type] || useCase.use_case_type}
              </span>
              {Array.isArray(useCase.seo_keywords) && useCase.seo_keywords.length > 0 && (
                <span className="rounded-full border border-white/30 px-3 py-1">
                  Keywords: {useCase.seo_keywords
                    .filter((k): k is string => typeof k === 'string')
                    .slice(0, 2)
                    .join(', ')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="mx-auto max-w-6xl px-6 py-12 lg:py-16">
          <div className="grid gap-10 lg:grid-cols-3">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-10">
              {/* 动态渲染每个 H2 部分 */}
              {contentSections.length > 0 ? (
                contentSections.map((section, sectionIndex) => (
                  <section
                    key={`section-${sectionIndex}`}
                    className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-900/60"
                  >
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
                      {section.title}
                    </h2>
                    
                    {/* 如果有 H3 子部分，显示为带编号的步骤（类似长尾词页面） */}
                    {section.subsections && section.subsections.length > 0 ? (
                      <div className="mt-6 space-y-4">
                        {section.subsections.map((subsection, subIndex) => (
                          <div
                            key={`subsection-${sectionIndex}-${subIndex}`}
                            className="flex items-start gap-4 rounded-xl border border-gray-100 bg-gray-50/70 p-4 dark:border-gray-800 dark:bg-gray-800/60"
                          >
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-energy-water/10 text-sm font-semibold text-energy-water flex-shrink-0">
                              {subIndex + 1}
                            </div>
                            <div className="flex-1">
                              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                {subsection.title}
                              </h3>
                              {subsection.content && (
                                <div
                                  className="mt-1 text-sm leading-relaxed text-gray-600 dark:text-gray-300 prose prose-sm max-w-none dark:prose-invert"
                                  dangerouslySetInnerHTML={{ __html: markdownToHtml(subsection.content) }}
                                />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      /* 如果没有子部分，直接显示内容 */
                      section.content && (
                        <div
                          className="mt-3 prose prose-base max-w-none text-gray-600 leading-relaxed dark:prose-invert dark:text-gray-300"
                          dangerouslySetInnerHTML={{ __html: markdownToHtml(section.content) }}
                        />
                      )
                    )}
                  </section>
                ))
              ) : (
                /* 如果没有解析到部分，显示原始内容（向后兼容） */
                <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-900/60">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">Overview</h2>
                  <div
                    className="mt-3 prose prose-lg max-w-none text-gray-600 leading-relaxed dark:prose-invert dark:text-gray-300"
                    dangerouslySetInnerHTML={{ __html: markdownToHtml(useCase.content) }}
                  />
                </section>
              )}

              {/* SEO Content Section (hidden but indexed) */}
              <section className="sr-only">
                <h2>How to Use AI Video Generation for {useCase.title}</h2>
                <p>
                  Learn how to create professional {useCase.title.toLowerCase()} videos using AI video generation. 
                  Our Sora alternative text-to-video AI tool makes it easy to create high-quality content for 
                  {useCase.use_case_type} purposes.
                </p>
                <p>
                  Whether you&apos;re looking for the best text-to-video AI generator or a Sora alternative, 
                  our platform provides everything you need to create {useCase.title.toLowerCase()} videos 
                  quickly and efficiently.
                </p>
              </section>
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-8">
              {/* Video Generator Tool Embed */}
              <div id="video-generator" className="scroll-mt-20">
                <UseCaseToolEmbed defaultPrompt={defaultPrompt} useCaseTitle={useCase.title} />
              </div>

              {/* Key Points */}
              <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/70">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Key Points</h3>
                <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-gray-600 dark:text-gray-300">
                  <li>Title / H1 / Meta Description naturally include {useCase.title}</li>
                  <li>Body text explains the use case scenario for {USE_CASE_TYPE_LABELS[useCase.use_case_type] || useCase.use_case_type}</li>
                  <li>Content provides genuine guidance, avoiding keyword stuffing</li>
                  <li>Right panel directly connects to Sora2Ai video generator</li>
                </ul>
              </section>

              {/* More Tools */}
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

              {/* 🔥 Performance optimization: Lazy load related content */}
              <LazyRelatedContent
                relatedUseCases={relatedUseCases}
                relatedKeywords={relatedKeywords}
                useCaseTitle={useCase.title}
              />
            </div>
          </div>

          {/* Tier1 内链（每周轮换） */}
          <div className="mt-12">
            <RelatedTier1Links pageId={useCase.id} />
          </div>
        </main>
      </div>
    </>
    )
  } catch (error) {
    console.error('[UseCasePage] 页面渲染异常:', {
      slug: params.slug,
      error: error instanceof Error ? error.message : '未知错误',
      stack: error instanceof Error ? error.stack : undefined,
    })
    // 如果发生错误，返回 404 而不是 500
    console.error('[UseCasePage] Error rendering page:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      slug: params.slug,
    })
    notFound()
  }
}

