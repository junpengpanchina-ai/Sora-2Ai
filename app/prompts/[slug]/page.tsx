import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getBaseUrl } from '@/lib/utils/url'
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { cache } from 'react'
import type { Database } from '@/types/database'

type PromptRow = Database['public']['Tables']['prompt_library']['Row']

// 从数据库获取 Prompt
const getPromptBySlug = cache(async (slug: string, locale?: string) => {
  const supabase = await createSupabaseServerClient()
  
  let query = supabase
    .from('prompt_library')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
  
  if (locale) {
    query = query.eq('locale', locale)
  }
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (query as any).maybeSingle()

  if (error || !data) {
    return null
  }

  return data as PromptRow
})

// 获取相关 Prompts
const getRelatedPrompts = cache(async (excludeId: string, category: string, locale: string, limit = 6) => {
  const supabase = await createSupabaseServerClient()
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('prompt_library')
    .select('id, slug, title, description, category, locale')
    .eq('is_published', true)
    .eq('locale', locale)
    .eq('category', category)
    .neq('id', excludeId)
    .limit(limit)

  if (error || !data) {
    return []
  }

  return data as Pick<PromptRow, 'id' | 'slug' | 'title' | 'description' | 'category' | 'locale'>[]
})

// 获取所有已发布的 Prompt slugs（用于静态生成）
export async function generateStaticParams() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return []
  }

  // 在静态生成时使用 service client，不需要 cookies
  const supabase = await createServiceClient()
  
  // 限制静态生成的数量，避免构建时间过长
  const MAX_STATIC_PAGES = 100
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('prompt_library')
    .select('slug, locale')
    .eq('is_published', true)
    .not('slug', 'is', null)
    .order('created_at', { ascending: false }) // 按创建时间倒序，优先生成最新的
    .limit(MAX_STATIC_PAGES) // 限制数量

  if (error || !data) {
    return []
  }

  return data.map((item: { slug: string; locale: string }) => ({
    slug: item.slug,
  }))
}

export async function generateMetadata({ 
  params 
}: { 
  params: { slug: string } 
}): Promise<Metadata> {
  const prompt = await getPromptBySlug(params.slug)
  
  if (!prompt) {
    return {
      title: 'Prompt Not Found',
    }
  }

  const url = `${getBaseUrl()}/prompts/${params.slug}`
  const title = `${prompt.title} - AI Video Prompt | Sora Alternative`
  const description = prompt.description || `Use this AI video prompt to create ${prompt.title.toLowerCase()} videos. Part of our Sora alternative text-to-video AI generator.`

  return {
    title,
    description,
    robots: {
      index: false,  // ❌ Prompt 页面不索引（内部资产，不是内容主体）
      follow: false, // ❌ 不跟踪链接
    },
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

export default async function PromptPage({ params }: { params: { slug: string } }) {
  const prompt = await getPromptBySlug(params.slug)
  
  if (!prompt) {
    notFound()
  }

  const relatedPrompts = await getRelatedPrompts(
    prompt.id,
    prompt.category,
    prompt.locale,
    6
  )

  // 构建关键词（用于SEO）
  const keywords = [
    ...(prompt.tags || []),
    `${prompt.title} prompt`,
    'text to video ai',
    'sora alternative',
    'ai video generator',
    `${prompt.category} video prompt`,
  ]

  // Structured Data
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: prompt.title,
    description: prompt.description || `AI video generation prompt for ${prompt.title}`,
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
    keywords: keywords.join(', '),
    articleBody: prompt.prompt,
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
            <Link href="/prompts" className="hover:text-energy-water">Prompts</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900 dark:text-gray-100">{prompt.title}</span>
          </nav>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header */}
              <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900/60">
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-energy-water/10 px-3 py-1 text-xs font-medium text-energy-water">
                    {prompt.category}
                  </span>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                    {prompt.locale === 'zh' ? '中文' : 'English'}
                  </span>
                  {prompt.tags && prompt.tags.length > 0 && (
                    <>
                      {prompt.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </>
                  )}
                </div>
                
                {/* ❌ 修复：H1 不应该直接显示 prompt 标题 */}
                {/* ✅ 正确：H1 应该是场景/用途，prompt 标题降级为 H2 */}
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  AI Video Generation Tools
                </h1>
                <h2 className="mt-2 text-2xl font-semibold text-gray-700 dark:text-gray-300">
                  {prompt.title}
                </h2>
                
                {prompt.description && (
                  <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
                    {prompt.description}
                  </p>
                )}
              </div>

              {/* Prompt Content */}
              <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900/60">
                <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                  Prompt Text
                </h2>
                <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800/60">
                  <pre className="whitespace-pre-wrap break-words font-mono text-sm text-gray-900 dark:text-gray-100">
                    {prompt.prompt}
                  </pre>
                </div>
                
                {/* Action Buttons */}
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href={`/video?prompt=${encodeURIComponent(prompt.prompt)}`}
                    className="inline-flex items-center rounded-lg bg-energy-water px-6 py-3 font-medium text-white transition hover:bg-energy-water-deep"
                  >
                    Use This Prompt
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
                    Browse More Prompts
                  </Link>
                </div>
              </div>

              {/* SEO Content Section */}
              <section className="sr-only">
                <h2>{prompt.title} - AI Video Generation Prompt</h2>
                <p>
                  Create stunning {prompt.title.toLowerCase()} videos using this AI video prompt. 
                  This prompt is optimized for text-to-video AI generation and works with Sora alternative 
                  tools. Use our free AI video generator to bring this prompt to life.
                </p>
                <p>
                  This {prompt.category} category prompt is perfect for creating {prompt.title.toLowerCase()} 
                  content. Whether you&apos;re looking for a Sora alternative or the best text-to-video AI tool, 
                  this prompt template will help you generate professional videos.
                </p>
              </section>

              {/* Example (if available) */}
              {prompt.example && (
                <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900/60">
                  <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                    Example Output
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">{prompt.example}</p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Related Prompts */}
              {relatedPrompts.length > 0 && (
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/60">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                    Related Prompts
                  </h3>
                  <div className="space-y-3">
                    {relatedPrompts.map((related) => (
                      <Link
                        key={related.id}
                        href={`/prompts/${related.slug}`}
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
                      All Prompts
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

