import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getBaseUrl } from '@/lib/utils/url'
import { createServiceClient } from '@/lib/supabase/service'
import { cache } from 'react'
import type { Database } from '@/types/database'

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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      <div className="min-h-screen bg-slate-50 py-12 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
        <div className="mx-auto max-w-6xl px-6">
          {/* Breadcrumb */}
          <nav className="mb-6 text-sm text-gray-600 dark:text-gray-400">
            <Link href="/" className="hover:text-energy-water">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/use-cases" className="hover:text-energy-water">Use Cases</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900 dark:text-gray-100">{useCase.title}</span>
          </nav>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header */}
              <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900/60">
                <div className="mb-4">
                  <span className="rounded-full bg-energy-water/10 px-3 py-1 text-xs font-medium text-energy-water">
                    {USE_CASE_TYPE_LABELS[useCase.use_case_type] || useCase.use_case_type}
                  </span>
                </div>
                
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {useCase.h1 || useCase.title}
                </h1>
                
                <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
                  {useCase.description}
                </p>
              </div>

              {/* Content */}
              <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900/60">
                <div 
                  className="prose prose-lg max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: useCase.content }}
                />
              </div>

              {/* CTA Section */}
              <div className="rounded-2xl border border-energy-water/20 bg-gradient-to-br from-energy-water/5 to-energy-water/10 p-8 dark:from-energy-water/10 dark:to-energy-water/20">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Ready to Create {useCase.title} Videos?
                </h2>
                <p className="mt-2 text-gray-600 dark:text-gray-300">
                  Start using our AI video generator to create professional {useCase.title.toLowerCase()} content. 
                  No credit card required, 30 free credits to get started.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/video"
                    className="inline-flex items-center rounded-lg bg-energy-water px-6 py-3 font-medium text-white transition hover:bg-energy-water-deep"
                  >
                    Start Creating Videos
                    <svg
                      className="ml-2 h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </Link>
                  <Link
                    href="/prompts"
                    className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    Browse Prompts
                  </Link>
                </div>
              </div>

              {/* SEO Content Section */}
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

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Related Keywords (Long-tail Keywords) */}
              {relatedKeywords.length > 0 && (
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/60">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                    Related Keywords
                  </h3>
                  <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                    Explore specific search terms related to this use case:
                  </p>
                  <div className="space-y-2">
                    {relatedKeywords.map((keyword) => (
                      <Link
                        key={keyword.id}
                        href={`/keywords/${keyword.page_slug}`}
                        className="block rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm transition hover:border-energy-water hover:bg-white dark:border-gray-700 dark:bg-gray-800/60 dark:hover:bg-gray-700"
                      >
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {keyword.h1 || keyword.title || keyword.keyword}
                        </h4>
                        {keyword.meta_description && (
                          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                            {keyword.meta_description}
                          </p>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Related Use Cases */}
              {relatedUseCases.length > 0 && (
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/60">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                    Related Use Cases
                  </h3>
                  <div className="space-y-3">
                    {relatedUseCases.map((related) => (
                      <Link
                        key={related.id}
                        href={`/use-cases/${related.slug}`}
                        className="block rounded-lg border border-gray-200 bg-gray-50 p-4 transition hover:border-energy-water hover:bg-white dark:border-gray-700 dark:bg-gray-800/60 dark:hover:bg-gray-700"
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
                </div>
              )}

              {/* Quick Links */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/60">
                <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                  Quick Links
                </h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link
                      href="/sora-alternative"
                      className="text-energy-water hover:underline"
                    >
                      Best Sora Alternatives
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/text-to-video-ai"
                      className="text-energy-water hover:underline"
                    >
                      Text to Video AI Tools
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/prompts"
                      className="text-energy-water hover:underline"
                    >
                      Prompt Library
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/video"
                      className="text-energy-water hover:underline"
                    >
                      Video Generator
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
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

