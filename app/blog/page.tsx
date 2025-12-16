import type { Metadata } from 'next'
import Link from 'next/link'
import { getBaseUrl } from '@/lib/utils/url'
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server'
import { cache } from 'react'

export const metadata: Metadata = {
  title: 'Blog – AI Video Generator Guides & Comparisons',
  description: 'Read our blog for guides on AI video generators, Sora alternatives, text-to-video AI tools, and comparisons. Learn how to create professional videos with AI.',
  alternates: {
    canonical: `${getBaseUrl()}/blog`,
  },
}

// 从数据库获取所有已发布的博客文章
const getAllBlogPosts = cache(async () => {
  const supabase = await createSupabaseServerClient()
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('blog_posts')
    .select('slug, title, description, published_at')
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .order('created_at', { ascending: false })

  if (error || !data) {
    return []
  }

  return data.map((post: { slug: string; title: string; description: string; published_at: string | null }) => ({
    slug: post.slug,
    title: post.title,
    description: post.description,
    date: post.published_at || new Date().toISOString(),
  }))
})

export default async function BlogPage() {
  const blogPosts = await getAllBlogPosts()

  return (
    <div className="bg-slate-50 dark:bg-gray-950">
      <div className="relative overflow-hidden border-b border-white/20 bg-gradient-to-br from-[#050b18] via-[#09122C] to-[#050b18]">
        <div className="cosmic-space absolute inset-0 opacity-60" aria-hidden="true" />
        <div className="cosmic-glow absolute inset-0 opacity-50" aria-hidden="true" />
        <div className="relative z-10 mx-auto max-w-6xl px-6 py-16 text-white">
          <div className="flex flex-wrap items-center gap-3 text-sm uppercase tracking-[0.2em] text-energy-water">
            <span>Blog</span>
          </div>
          <h1 className="mt-6 text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
            AI Video Generator Guides & Comparisons
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-blue-100/80">
            Learn about AI video generators, Sora alternatives, text-to-video AI tools, and best practices for creating professional videos with AI.
          </p>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-6 py-12 lg:py-16">
        {blogPosts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">暂无博客文章</p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {blogPosts.map((post) => (
              <article
                key={post.slug}
                className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md dark:bg-gray-900/60"
              >
                <Link href={`/blog/${post.slug}`} className="block">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 hover:text-energy-water transition">
                    {post.title}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
                    {post.description}
                  </p>
                  <time className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </time>
                </Link>
              </article>
            ))}
          </div>
        )}

        <section className="mt-12 rounded-2xl bg-white p-8 shadow-sm dark:bg-gray-900/60">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            Start Creating Videos
          </h2>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
            Ready to create AI videos? Try our free text-to-video AI generator and get 30 free credits to start.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/video"
              className="inline-flex items-center justify-center rounded-lg bg-energy-water px-6 py-3 text-sm font-medium text-white transition hover:bg-energy-water/90"
            >
              Create Video Now
            </Link>
            <Link
              href="/sora-alternative"
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              View Sora Alternatives
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
