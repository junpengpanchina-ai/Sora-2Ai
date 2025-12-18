import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getBaseUrl } from '@/lib/utils/url'
import { createServiceClient } from '@/lib/supabase/service'
import { cache } from 'react'
import type { Database } from '@/types/database'
import { INDUSTRIES_100 } from '@/lib/data/industries-100'

type UseCaseRow = Database['public']['Tables']['use_cases']['Row']

// 获取行业的所有使用场景
const getIndustryUseCases = cache(async (industry: string) => {
  try {
    const supabase = await createServiceClient()
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('use_cases')
      .select('id, slug, title, description, h1, use_case_type')
      .eq('is_published', true)
      .eq('industry', industry)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[getIndustryUseCases] 查询错误:', {
        industry,
        error: error.message,
        code: error.code,
      })
      return []
    }

    if (!data || !Array.isArray(data)) {
      return []
    }

    return data as Pick<UseCaseRow, 'id' | 'slug' | 'title' | 'description' | 'h1' | 'use_case_type'>[]
  } catch (error) {
    console.error('[getIndustryUseCases] 异常:', error)
    return []
  }
})

// 获取所有行业的 slugs（用于静态生成）
export async function generateStaticParams() {
  return INDUSTRIES_100.map((industry) => ({
    slug: industry.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and'),
  }))
}

export async function generateMetadata({ 
  params 
}: { 
  params: { slug: string } 
}): Promise<Metadata> {
  const industryName = INDUSTRIES_100.find(
    (ind) => ind.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and') === params.slug
  )
  
  if (!industryName) {
    return {
      title: 'Industry Not Found',
    }
  }

  const url = `${getBaseUrl()}/industries/${params.slug}`
  const title = `${industryName} AI Video Generation - Use Cases & Examples | Sora2`
  const description = `Discover ${industryName} AI video generation use cases. Create professional videos for ${industryName.toLowerCase()} with Sora2 text-to-video AI tool.`

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
      type: 'website',
    },
  }
}

export const revalidate = 3600 // Revalidate every hour

export default async function IndustryPage({ params }: { params: { slug: string } }) {
  const industryName = INDUSTRIES_100.find(
    (ind) => ind.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and') === params.slug
  )
  
  if (!industryName) {
    notFound()
  }

  const useCases = await getIndustryUseCases(industryName)

  // Structured Data
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${industryName} AI Video Generation Use Cases`,
    description: `Comprehensive guide to AI video generation use cases for ${industryName}`,
    url: `${getBaseUrl()}/industries/${params.slug}`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: useCases.length,
      itemListElement: useCases.map((uc, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Article',
          headline: uc.h1 || uc.title,
          description: uc.description,
          url: `${getBaseUrl()}/use-cases/${uc.slug}`,
        },
      })),
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      <div className="bg-slate-50 dark:bg-gray-950">
        {/* Hero Section */}
        <div className="relative overflow-hidden border-b border-white/20 bg-gradient-to-br from-[#050b18] via-[#09122C] to-[#050b18]">
          <div className="cosmic-space absolute inset-0 opacity-60" aria-hidden="true" />
          <div className="cosmic-glow absolute inset-0 opacity-50" aria-hidden="true" />
          <div className="relative z-10 mx-auto max-w-6xl px-6 py-16 text-white">
            <div className="flex flex-wrap items-center gap-3 text-sm uppercase tracking-[0.2em] text-energy-water">
              <span>Industry</span>
              <span className="text-white/50">/</span>
              <span>{industryName}</span>
            </div>
            <h1 className="mt-6 text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
              {industryName} AI Video Generation Use Cases
            </h1>
            <p className="mt-4 max-w-3xl text-lg text-blue-100/80">
              Discover {useCases.length} professional AI video generation use cases for {industryName.toLowerCase()}. 
              Create engaging videos for marketing, training, product demos, and more with Sora2.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-xs text-white/70">
              <span className="rounded-full border border-white/30 px-3 py-1">
                {useCases.length} Use Cases
              </span>
              <span className="rounded-full border border-white/30 px-3 py-1">
                Industry: {industryName}
              </span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="mx-auto max-w-6xl px-6 py-12 lg:py-16">
          {/* Overview Section */}
          <section className="mb-12 rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-900/60">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Why Use AI Video for {industryName}?
            </h2>
            <div className="mt-4 space-y-3 text-gray-600 dark:text-gray-300">
              <p>
                AI video generation is revolutionizing how {industryName.toLowerCase()} businesses create content. 
                Whether you need marketing videos, training materials, product demonstrations, or social media content, 
                Sora2 makes it easy to produce professional videos quickly and cost-effectively.
              </p>
              <p>
                With {useCases.length} specialized use cases, you can find the perfect AI video solution for your 
                {industryName.toLowerCase()} business needs. Each use case includes detailed guidance, example prompts, 
                and step-by-step instructions to help you get started.
              </p>
            </div>
          </section>

          {/* Use Cases Grid */}
          {useCases.length > 0 ? (
            <section>
              <h2 className="mb-6 text-2xl font-semibold text-gray-900 dark:text-white">
                All {industryName} Use Cases ({useCases.length})
              </h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {useCases.map((useCase) => (
                  <Link
                    key={useCase.id}
                    href={`/use-cases/${useCase.slug}`}
                    className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-energy-water hover:shadow-md dark:border-gray-700 dark:bg-gray-900/60 dark:hover:bg-gray-800"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-energy-water dark:text-white">
                      {useCase.h1 || useCase.title}
                    </h3>
                    {useCase.description && (
                      <p className="mt-2 line-clamp-3 text-sm text-gray-600 dark:text-gray-400">
                        {useCase.description}
                      </p>
                    )}
                    <div className="mt-4 flex items-center text-sm text-energy-water">
                      <span>View Use Case</span>
                      <span className="ml-2 transition group-hover:translate-x-1">→</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ) : (
            <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-900/60">
              <p className="text-gray-600 dark:text-gray-400">
                No use cases available for {industryName} yet. Check back soon!
              </p>
            </section>
          )}

          {/* Navigation */}
          <section className="mt-12 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900/60">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Explore More</h3>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/use-cases"
                className="rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
              >
                All Use Cases
              </Link>
              <Link
                href="/"
                className="rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
              >
                Homepage
              </Link>
              <Link
                href="/video"
                className="rounded-lg border border-energy-water bg-energy-water px-4 py-2 text-sm text-white transition hover:bg-energy-water/90"
              >
                Try Sora2 Video Generator
              </Link>
            </div>
          </section>
        </main>
      </div>
    </>
  )
}

