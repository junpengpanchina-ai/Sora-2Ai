import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getBaseUrl } from '@/lib/utils/url'
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { cache } from 'react'
import type { Database } from '@/types/database'

type ComparePageRow = Database['public']['Tables']['compare_pages']['Row']

// 从数据库获取对比页
const getComparePageBySlug = cache(async (slug: string) => {
  const supabase = await createSupabaseServerClient()
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('compare_pages')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  return data as ComparePageRow
})

// 获取相关对比页
const getRelatedComparePages = cache(async (excludeId: string, limit = 6) => {
  const supabase = await createSupabaseServerClient()
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('compare_pages')
    .select('id, slug, title, description, tool_b_name')
    .eq('is_published', true)
    .neq('id', excludeId)
    .limit(limit)

  if (error || !data) {
    return []
  }

  return data as Pick<ComparePageRow, 'id' | 'slug' | 'title' | 'description' | 'tool_b_name'>[]
})

// 获取所有已发布的对比页 slugs（用于静态生成）
export async function generateStaticParams() {
  // 在静态生成时使用 service client，不需要 cookies
  const supabase = await createServiceClient()
  
  // 限制静态生成的数量，避免构建时间过长
  const MAX_STATIC_PAGES = 50
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('compare_pages')
    .select('slug')
    .eq('is_published', true)
    .order('created_at', { ascending: false }) // 按创建时间倒序，优先生成最新的
    .limit(MAX_STATIC_PAGES) // 限制数量

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
  const comparePage = await getComparePageBySlug(params.slug)
  
  if (!comparePage) {
    return {
      title: 'Comparison Not Found',
    }
  }

  const url = `${getBaseUrl()}/compare/${params.slug}`
  const title = `${comparePage.title} - AI Video Generator Comparison | Sora Alternative`
  const description = comparePage.description || `Compare ${comparePage.tool_a_name} vs ${comparePage.tool_b_name} for AI video generation. Find the best Sora alternative text-to-video AI tool.`

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

export default async function ComparePage({ params }: { params: { slug: string } }) {
  const comparePage = await getComparePageBySlug(params.slug)
  
  if (!comparePage) {
    notFound()
  }

  const relatedComparePages = await getRelatedComparePages(comparePage.id, 6)

  // 解析对比点
  const comparisonPoints = Array.isArray(comparePage.comparison_points) 
    ? (comparePage.comparison_points as Array<Record<string, unknown>>)
    : []

  // Structured Data
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: comparePage.h1 || comparePage.title,
    description: comparePage.description,
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
    keywords: comparePage.seo_keywords?.join(', ') || '',
    articleBody: comparePage.content,
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
            <Link href="/compare" className="hover:text-energy-water">Compare</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900 dark:text-gray-100">{comparePage.title}</span>
          </nav>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header */}
              <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900/60">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {comparePage.h1 || comparePage.title}
                </h1>
                
                <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
                  {comparePage.description}
                </p>
              </div>

              {/* Comparison Points */}
              {comparisonPoints.length > 0 && (
                <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900/60">
                  <h2 className="mb-6 text-2xl font-semibold text-gray-900 dark:text-white">
                    Comparison
                  </h2>
                  <div className="space-y-4">
                    {comparisonPoints.map((point, index: number) => (
                      <div
                        key={index}
                        className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/60"
                      >
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {String(point.feature || point.title || `Feature ${index + 1}`)}
                        </h3>
                        <div className="mt-3 grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {comparePage.tool_a_name}
                            </p>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                              {String(point.tool_a || point[comparePage.tool_a_name] || 'N/A')}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {comparePage.tool_b_name}
                            </p>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                              {String(point.tool_b || point[comparePage.tool_b_name] || 'N/A')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Winner Section */}
              {comparePage.winner && (
                <div className="rounded-2xl border border-energy-water/20 bg-gradient-to-br from-energy-water/5 to-energy-water/10 p-8 dark:from-energy-water/10 dark:to-energy-water/20">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Winner
                  </h2>
                  <p className="mt-2 text-lg text-gray-700 dark:text-gray-200">
                    {comparePage.winner === 'tool_a' 
                      ? comparePage.tool_a_name 
                      : comparePage.winner === 'tool_b'
                      ? comparePage.tool_b_name
                      : 'It\'s a tie!'}
                  </p>
                </div>
              )}

              {/* Content */}
              <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900/60">
                <div 
                  className="prose prose-lg max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: comparePage.content }}
                />
              </div>

              {/* CTA Section */}
              <div className="rounded-2xl border border-energy-water/20 bg-gradient-to-br from-energy-water/5 to-energy-water/10 p-8 dark:from-energy-water/10 dark:to-energy-water/20">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Try Our Sora Alternative
                </h2>
                <p className="mt-2 text-gray-600 dark:text-gray-300">
                  Experience the best text-to-video AI generator. Create professional videos with 30 free credits, no credit card required.
                </p>
                <div className="mt-6">
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
                </div>
              </div>

              {/* SEO Content Section */}
              <section className="sr-only">
                <h2>{comparePage.tool_a_name} vs {comparePage.tool_b_name} Comparison</h2>
                <p>
                  Compare {comparePage.tool_a_name} and {comparePage.tool_b_name} for AI video generation. 
                  Find the best Sora alternative text-to-video AI tool for your needs.
                </p>
                <p>
                  Whether you&apos;re looking for the best AI video generator or a Sora alternative, 
                  this comparison will help you choose the right tool for creating professional videos.
                </p>
              </section>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Related Comparisons */}
              {relatedComparePages.length > 0 && (
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/60">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                    Related Comparisons
                  </h3>
                  <div className="space-y-3">
                    {relatedComparePages.map((related) => (
                      <Link
                        key={related.id}
                        href={`/compare/${related.slug}`}
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
                      href="/compare"
                      className="text-energy-water hover:underline"
                    >
                      All Comparisons
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
}

