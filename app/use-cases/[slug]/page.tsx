import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getBaseUrl } from '@/lib/utils/url'
import { createServiceClient } from '@/lib/supabase/service'
import { cache } from 'react'
import type { Database } from '@/types/database'
import UseCaseToolEmbed from '../UseCaseToolEmbed'
import { parseMarkdownSections, markdownToHtml } from '@/lib/utils/markdown-parser'

type UseCaseRow = Database['public']['Tables']['use_cases']['Row']

// 从数据库获取使用场景
const getUseCaseBySlug = cache(async (slug: string) => {
  try {
    // 使用 service client 避免 cookies，支持静态生成
    const supabase = await createServiceClient()
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('use_cases')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle()

    if (error) {
      console.error('[getUseCaseBySlug] 查询错误:', {
        slug,
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      })
      return null
    }

    if (!data) {
      console.warn('[getUseCaseBySlug] 未找到使用场景:', slug)
      return null
    }

    return data as UseCaseRow
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
    // 构建 OR 查询条件：匹配 keyword 字段包含任何 SEO 关键词
    // Supabase OR 查询格式：field.ilike.value,field2.ilike.value2
    const orConditions = seoKeywords
      .slice(0, 5) // 限制最多 5 个关键词，避免查询过于复杂
      .map(kw => `keyword.ilike.%${kw.toLowerCase().trim()}%`)
      .join(',')

    if (!orConditions) {
      return []
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('long_tail_keywords')
      .select('id, keyword, page_slug, title, h1, meta_description')
      .eq('status', 'published')
      .or(orConditions)
      .limit(limit)

    if (error) {
      console.error('[getRelatedKeywords] 查询错误:', {
        error: error.message,
        code: error.code,
        seoKeywords: seoKeywords.slice(0, 5),
        orConditions,
      })
      return []
    }

    if (!data || !Array.isArray(data)) {
      return []
    }

    return data as Array<{
      id: string
      keyword: string
      page_slug: string
      title: string | null
      h1: string | null
      meta_description: string | null
    }>
  } catch (error) {
    console.error('[getRelatedKeywords] 异常:', error)
    return []
  }
})

// 获取所有已发布的使用场景 slugs（用于静态生成）
export async function generateStaticParams() {
  // 在静态生成时使用 service client，不需要 cookies
  const supabase = await createServiceClient()
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('use_cases')
    .select('slug')
    .eq('is_published', true)

  if (error || !data) {
    return []
  }

  return data.map((item: { slug: string }) => ({
    slug: item.slug,
  }))
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
  const title = `${useCase.title} - AI Video Use Case | Sora Alternative`
  const description = useCase.description || `Learn how to use AI video generation for ${useCase.title.toLowerCase()}. Create professional videos with our Sora alternative text-to-video AI tool.`

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      type: 'article',
    },
  }
}

export const revalidate = 3600 // Revalidate every hour

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

export default async function UseCasePage({ params }: { params: { slug: string } }) {
  try {
    const useCase = await getUseCaseBySlug(params.slug)
    
    if (!useCase) {
      console.warn('[UseCasePage] 使用场景不存在:', params.slug)
      notFound()
    }

    // 并行获取相关数据，即使失败也不影响主页面渲染
    const [relatedUseCasesResult, relatedKeywordsResult] = await Promise.allSettled([
      getRelatedUseCases(
        useCase.id,
        useCase.use_case_type,
        6
      ),
      getRelatedKeywords(
        useCase.seo_keywords || [],
        useCase.use_case_type,
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
    keywords: useCase.seo_keywords?.join(', ') || '',
    articleBody: useCase.content,
  }

  // 提取主关键词用于工具嵌入
  const mainKeyword = useCase.seo_keywords?.[0] || useCase.title

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
          <div className="cosmic-space absolute inset-0 opacity-60" aria-hidden="true" />
          <div className="cosmic-glow absolute inset-0 opacity-50" aria-hidden="true" />
          <div className="relative z-10 mx-auto max-w-6xl px-6 py-16 text-white">
            <div className="flex flex-wrap items-center gap-3 text-sm uppercase tracking-[0.2em] text-energy-water">
              <span>Use Case</span>
              <span className="text-white/50">/</span>
              <span>{USE_CASE_TYPE_LABELS[useCase.use_case_type] || useCase.use_case_type}</span>
            </div>
            <h1 className="mt-6 text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
              {useCase.h1 || useCase.title}
            </h1>
            {useCase.description && (
              <p className="mt-4 max-w-3xl text-lg text-blue-100/80">{useCase.description}</p>
            )}
            <div className="mt-6 flex flex-wrap gap-3 text-xs text-white/70">
              <span className="rounded-full border border-white/30 px-3 py-1">Use Case: {useCase.title}</span>
              <span className="rounded-full border border-white/30 px-3 py-1">
                Type: {USE_CASE_TYPE_LABELS[useCase.use_case_type] || useCase.use_case_type}
              </span>
              {useCase.seo_keywords && useCase.seo_keywords.length > 0 && (
                <span className="rounded-full border border-white/30 px-3 py-1">
                  Keywords: {useCase.seo_keywords.slice(0, 2).join(', ')}
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
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
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
                                  className="mt-1 text-sm text-gray-600 dark:text-gray-300 prose prose-sm max-w-none dark:prose-invert"
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
                          className="mt-3 prose prose-lg max-w-none text-gray-600 leading-relaxed dark:prose-invert dark:text-gray-300"
                          dangerouslySetInnerHTML={{ __html: markdownToHtml(section.content) }}
                        />
                      )
                    )}
                  </section>
                ))
              ) : (
                /* 如果没有解析到部分，显示原始内容（向后兼容） */
                <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-900/60">
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Overview</h2>
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
              <UseCaseToolEmbed defaultPrompt={mainKeyword} useCaseTitle={useCase.title} />

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
                    Explore similar use cases for {useCase.title}:
                  </p>
                  <div className="mt-4 space-y-3">
                    {relatedUseCases.map((related) => (
                      <Link
                        key={related.id}
                        href={`/use-cases/${related.slug}`}
                        className="block rounded-xl border border-gray-200 bg-gray-50 p-4 transition hover:border-energy-water hover:bg-white dark:border-gray-700 dark:bg-gray-800/60 dark:hover:bg-gray-700"
                      >
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {related.title}
                        </h4>
                        {related.description && (
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {related.description}
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
                >
                  <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">Related Keywords</h3>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Explore specific search terms related to this use case:
                  </p>
                  <div className="mt-4 grid gap-3 flex-1">
                    {relatedKeywords.map((keyword) => (
                      <Link
                        key={keyword.id}
                        href={`/keywords/${keyword.page_slug}`}
                        className="flex flex-col rounded-xl border border-transparent bg-gray-50 p-3 text-sm text-gray-700 transition hover:border-energy-water hover:bg-white dark:bg-gray-800/60 dark:text-gray-200"
                      >
                        <span className="font-medium text-gray-900 dark:text-white">
                          {keyword.h1 || keyword.title || keyword.keyword}
                        </span>
                        {keyword.meta_description && (
                          <span className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                            {keyword.meta_description}
                          </span>
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
    notFound()
  }
}

