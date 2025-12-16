import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getBaseUrl } from '@/lib/utils/url'
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server'
import { cache } from 'react'

// 从数据库获取博客文章
const getBlogPostBySlug = cache(async (slug: string) => {
  const supabase = await createSupabaseServerClient()
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (error || !data) {
    return null
  }

  return {
    slug: data.slug,
    title: data.title,
    description: data.description,
    h1: data.h1,
    content: data.content,
    publishedAt: data.published_at || data.created_at,
    relatedPosts: Array.isArray(data.related_posts) ? data.related_posts : [],
  }
})

// 获取所有已发布的博客文章slug（用于静态生成）
export async function generateStaticParams() {
  const supabase = await createSupabaseServerClient()
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('blog_posts')
    .select('slug')
    .eq('is_published', true)

  if (error || !data) {
    // 如果数据库查询失败，返回空数组（fallback到动态渲染）
    return []
  }

  return data.map((post: { slug: string }) => ({
    slug: post.slug,
  }))
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getBlogPostBySlug(params.slug)
  
  if (!post) {
    return {
      title: 'Blog Post Not Found',
    }
  }

  const url = `${getBaseUrl()}/blog/${params.slug}`

  return {
    title: post.title,
    description: post.description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      url,
      type: 'article',
      publishedTime: post.publishedAt,
    },
  }
}

// 获取相关文章
const getRelatedPosts = cache(async (slugs: string[]) => {
  if (slugs.length === 0) {
    return []
  }

  const supabase = await createSupabaseServerClient()
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('blog_posts')
    .select('slug, title')
    .in('slug', slugs)
    .eq('is_published', true)

  if (error || !data) {
    return []
  }

  return data.map((post: { slug: string; title: string }) => ({
    slug: post.slug,
    title: post.title,
  }))
})

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getBlogPostBySlug(params.slug)

  if (!post) {
    notFound()
  }

  const relatedPosts = await getRelatedPosts(post.relatedPosts)

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.h1,
    description: post.description,
    datePublished: post.publishedAt,
    author: {
      '@type': 'Organization',
      name: 'Best Sora Alternative',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Best Sora Alternative',
      logo: {
        '@type': 'ImageObject',
        url: `${getBaseUrl()}/icon.svg`,
      },
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="bg-slate-50 dark:bg-gray-950">
        <div className="relative overflow-hidden border-b border-white/20 bg-gradient-to-br from-[#050b18] via-[#09122C] to-[#050b18]">
          <div className="cosmic-space absolute inset-0 opacity-60" aria-hidden="true" />
          <div className="cosmic-glow absolute inset-0 opacity-50" aria-hidden="true" />
          <div className="relative z-10 mx-auto max-w-4xl px-6 py-16 text-white">
            <div className="flex flex-wrap items-center gap-3 text-sm uppercase tracking-[0.2em] text-energy-water">
              <Link href="/blog" className="hover:text-energy-water/80">Blog</Link>
              <span className="text-white/50">/</span>
              <span>{params.slug}</span>
            </div>
            <h1 className="mt-6 text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
              {post.h1}
            </h1>
            <p className="mt-4 max-w-3xl text-lg text-blue-100/80">
              {post.description}
            </p>
            <p className="mt-4 text-sm text-blue-100/60">
              Published: {new Date(post.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        <main className="mx-auto max-w-4xl px-6 py-12 lg:py-16">
          <article className="rounded-2xl bg-white p-8 shadow-sm dark:bg-gray-900/60">
            <div
              className="prose prose-lg prose-gray dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </article>

          {relatedPosts.length > 0 && (
            <section className="mt-12 rounded-2xl bg-white p-8 shadow-sm dark:bg-gray-900/60">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                Related Articles
              </h2>
              <ul className="space-y-3">
                {relatedPosts.map((related) => (
                  <li key={related.slug}>
                    <Link
                      href={`/blog/${related.slug}`}
                      className="text-energy-water hover:underline font-medium"
                    >
                      {related.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="mt-12 rounded-2xl bg-white p-8 shadow-sm dark:bg-gray-900/60">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              Explore More Resources
            </h2>
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <Link
                href="/sora-alternative"
                className="p-4 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 transition"
              >
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Sora Alternatives</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Find the best Sora alternatives for AI video generation</p>
              </Link>
              <Link
                href="/text-to-video-ai"
                className="p-4 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 transition"
              >
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Text to Video AI</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Learn about text-to-video AI tools and how they work</p>
              </Link>
            </div>
          </section>

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

          <nav className="mt-12 flex items-center justify-between">
            <Link
              href="/blog"
              className="text-energy-water hover:underline font-medium"
            >
              ← Back to Blog
            </Link>
            <Link
              href="/"
              className="text-energy-water hover:underline font-medium"
            >
              Home →
            </Link>
          </nav>
        </main>
      </div>
    </>
  )
}
