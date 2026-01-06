'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface RelatedUseCase {
  id: string
  slug: string
  title: string
  description?: string | null
}

interface RelatedKeyword {
  id: string
  keyword: string
  page_slug: string
  title: string | null
  h1: string | null
  meta_description: string | null
}

interface LazyRelatedContentProps {
  relatedUseCases: RelatedUseCase[]
  relatedKeywords: RelatedKeyword[]
  useCaseTitle: string
}

/**
 * LazyRelatedContent - Lazy loads related use cases and keywords
 * Only renders after initial page load to improve LCP
 */
export default function LazyRelatedContent({
  relatedUseCases,
  relatedKeywords,
  useCaseTitle,
}: LazyRelatedContentProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Delay rendering related content to prioritize main content
    const timer = setTimeout(() => {
      setMounted(true)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  if (!mounted) {
    // Return skeleton placeholders during initial render
    return (
      <>
        {relatedUseCases.length > 0 && (
          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/70">
            <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
              ))}
            </div>
          </section>
        )}
        {relatedKeywords.length > 0 && (
          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/70">
            <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4" />
            <div className="grid gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
              ))}
            </div>
          </section>
        )}
      </>
    )
  }

  return (
    <>
      {/* Related Use Cases */}
      {relatedUseCases.length > 0 && (
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/70">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">Related Use Cases</h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Explore similar use cases for {useCaseTitle}:
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
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">Related Keywords</h3>
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
    </>
  )
}

