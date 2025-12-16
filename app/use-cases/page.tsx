import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

type UseCaseRow = Database['public']['Tables']['use_cases']['Row']

export const revalidate = 600

export const metadata: Metadata = {
  title: 'AI Video Use Cases - Marketing, Social Media, YouTube & More',
  description: 'Discover how to use AI video generation for marketing, social media, YouTube, TikTok, and more. Learn best practices and create professional videos with our Sora alternative.',
}

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

export default async function UseCasesIndexPage() {
  const supabase = await createSupabaseServerClient()
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('use_cases')
    .select('id, slug, title, description, use_case_type')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to load use cases:', error)
  }

  const useCases = (Array.isArray(data) ? data : []) as Pick<
    UseCaseRow,
    'id' | 'slug' | 'title' | 'description' | 'use_case_type'
 >[]

  return (
    <div className="min-h-screen bg-slate-50 py-16 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-10">
          <p className="text-sm uppercase tracking-[0.4em] text-energy-water">Use Cases</p>
          <h1 className="mt-3 text-3xl font-bold">AI Video Generation Use Cases</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Learn how to use AI video generation for different purposes. From marketing to social media, 
            discover best practices and create professional videos.
          </p>
        </div>

        {useCases.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-gray-300 bg-white/70 p-6 text-center text-gray-500 dark:border-gray-800 dark:bg-gray-900/70">
            No use cases available yet.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {useCases.map((useCase) => (
              <Link
                key={useCase.id}
                href={`/use-cases/${useCase.slug}`}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-energy-water hover:shadow-lg dark:border-gray-800 dark:bg-gray-900/70"
              >
                <p className="text-xs uppercase tracking-[0.25em] text-energy-water">
                  {USE_CASE_TYPE_LABELS[useCase.use_case_type] || useCase.use_case_type}
                </p>
                <h2 className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">
                  {useCase.title}
                </h2>
                {useCase.description && (
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                    {useCase.description}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <Link
            href="/"
            className="inline-flex items-center text-sm font-medium text-energy-water transition hover:text-energy-water-deep"
          >
            Back to Homepage
            <svg
              className="ml-1 h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  )
}

