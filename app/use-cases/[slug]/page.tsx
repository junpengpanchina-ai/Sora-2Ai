import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getBaseUrl } from '@/lib/utils/url'
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { cache } from 'react'
import type { Database } from '@/types/database'

type UseCaseRow = Database['public']['Tables']['use_cases']['Row']

// 从数据库获取使用场景
const getUseCaseBySlug = cache(async (slug: string) => {
  const supabase = await createSupabaseServerClient()
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('use_cases')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  return data as UseCaseRow
})

// 获取相关使用场景
const getRelatedUseCases = cache(async (excludeId: string, useCaseType: string, limit = 6) => {
  const supabase = await createSupabaseServerClient()
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('use_cases')
    .select('id, slug, title, description, use_case_type')
    .eq('is_published', true)
    .eq('use_case_type', useCaseType)
    .neq('id', excludeId)
    .limit(limit)

  if (error || !data) {
    return []
  }

  return data as Pick<UseCaseRow, 'id' | 'slug' | 'title' | 'description' | 'use_case_type'>[]
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
  const useCase = await getUseCaseBySlug(params.slug)
  
  if (!useCase) {
    notFound()
  }

  const relatedUseCases = await getRelatedUseCases(
    useCase.id,
    useCase.use_case_type,
    6
  )

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
}

