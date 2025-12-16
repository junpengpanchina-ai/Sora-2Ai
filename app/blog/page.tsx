import type { Metadata } from 'next'
import Link from 'next/link'
import { getBaseUrl } from '@/lib/utils/url'

export const metadata: Metadata = {
  title: 'Blog – AI Video Generator Guides & Comparisons',
  description: 'Read our blog for guides on AI video generators, Sora alternatives, text-to-video AI tools, and comparisons. Learn how to create professional videos with AI.',
  alternates: {
    canonical: `${getBaseUrl()}/blog`,
  },
}

const blogPosts = [
  {
    slug: 'what-is-openai-sora',
    title: 'What Is OpenAI Sora? Features, Limitations & Use Cases',
    description: 'Learn everything about OpenAI Sora: what it is, key features, limitations, and use cases.',
    date: '2025-01-16',
  },
  {
    slug: 'best-sora-alternatives',
    title: 'Best Sora Alternatives for Creators in 2025',
    description: 'Discover the best Sora alternatives for content creators. Compare free and paid options, features, and find the perfect AI video generator.',
    date: '2025-01-15',
  },
  {
    slug: 'free-sora-alternative',
    title: 'Free Sora Alternative Online – Best Options in 2025',
    description: 'Find the best free Sora alternatives online. Compare free AI video generators and start creating videos without spending money.',
    date: '2025-01-14',
  },
  {
    slug: 'sora-vs-runway',
    title: 'Sora vs Runway: Complete Comparison 2025',
    description: 'Compare OpenAI Sora vs Runway Gen-3. Detailed comparison of features, quality, pricing, and use cases.',
    date: '2025-01-13',
  },
  {
    slug: 'sora-vs-pika',
    title: 'Sora vs Pika: Which AI Video Generator is Better?',
    description: 'Compare Sora vs Pika Labs. Find out which AI video generator is better for your needs.',
    date: '2025-01-12',
  },
  {
    slug: 'text-to-video-ai-free',
    title: 'Free Text to Video AI – Best Free Tools in 2025',
    description: 'Find the best free text to video AI tools. Compare free options and start creating videos from text.',
    date: '2025-01-11',
  },
  {
    slug: 'ai-video-generator-without-watermark',
    title: 'AI Video Generator Without Watermark – Best Options',
    description: 'Find AI video generators without watermarks. Compare tools that offer watermark-free videos.',
    date: '2025-01-10',
  },
  {
    slug: 'best-ai-video-generator-for-youtube-creators',
    title: 'Best AI Video Generator for YouTube Creators (2025 Guide)',
    description: 'Find the best AI video generator for YouTube creators. Compare top tools, features, and pricing.',
    date: '2025-01-17',
  },
  {
    slug: 'ai-video-generator-for-youtube',
    title: 'AI Video Generator for YouTube – Complete Guide',
    description: 'Learn how to use AI video generators for YouTube content. Find the best tools and tips.',
    date: '2025-01-09',
  },
  {
    slug: 'ai-video-generator-for-marketing',
    title: 'AI Video Generator for Marketing – Best Tools & Tips',
    description: 'Discover how to use AI video generators for marketing. Find the best tools and strategies.',
    date: '2025-01-08',
  },
  {
    slug: 'sora-vs-luma',
    title: 'Sora vs Luma: Speed vs Quality Comparison',
    description: 'Compare Sora vs Luma Dream Machine. Understand the trade-offs between speed and quality.',
    date: '2025-01-07',
  },
  {
    slug: 'sora-alternative-without-watermark',
    title: 'Sora Alternative Without Watermark – Best Options',
    description: 'Find Sora alternatives that offer watermark-free videos. Compare tools for commercial use.',
    date: '2025-01-06',
  },
  {
    slug: 'ai-video-for-youtube',
    title: 'AI Video for YouTube – Best Tools & Tips',
    description: 'Create engaging YouTube videos with AI. Discover the best AI video tools for YouTube content creation.',
    date: '2025-01-05',
  },
  {
    slug: 'ai-video-for-marketing',
    title: 'AI Video for Marketing – Complete Guide',
    description: 'Learn how to use AI video for marketing campaigns. Discover best practices and strategies.',
    date: '2025-01-04',
  },
  {
    slug: 'sora-alternative-for-youtube',
    title: 'Sora Alternative for YouTube – Best Options',
    description: 'Find the best Sora alternatives specifically for YouTube content creation.',
    date: '2025-01-03',
  },
  {
    slug: 'ai-video-generator-for-short-videos',
    title: 'AI Video Generator for Short Videos – Best Tools',
    description: 'Find the best AI video generators for creating short videos for TikTok, Instagram Reels, and YouTube Shorts.',
    date: '2025-01-02',
  },
  {
    slug: 'ai-video-generator-for-social-media',
    title: 'AI Video Generator for Social Media – Complete Guide',
    description: 'Learn how to use AI video generators for social media. Discover the best tools and strategies.',
    date: '2025-01-01',
  },
  {
    slug: 'ai-video-tool-for-tiktok-videos',
    title: 'AI Video Tool for TikTok Videos – Best Options',
    description: 'Discover the best AI video tools for creating TikTok videos. Compare tools optimized for TikTok.',
    date: '2024-12-31',
  },
  {
    slug: 'ai-video-for-product-demo',
    title: 'AI Video for Product Demo – Best Tools & Tips',
    description: 'Learn how to create effective product demo videos with AI. Discover the best tools and strategies.',
    date: '2024-12-30',
  },
  {
    slug: 'ai-video-for-ads',
    title: 'AI Video for Ads – Complete Guide',
    description: 'Learn how to create effective advertising videos with AI. Discover the best tools and strategies.',
    date: '2024-12-29',
  },
]

export default function BlogPage() {
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

