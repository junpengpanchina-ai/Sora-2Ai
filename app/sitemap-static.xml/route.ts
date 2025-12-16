import { NextResponse } from 'next/server'
import { getBaseUrl } from '@/lib/utils/url'
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const STATIC_PATHS = [
  // Homepage - highest priority
  { path: '/', priority: '1.0' },
  // Main category pages - high priority
  { path: '/sora-alternative', priority: '0.9' },
  { path: '/text-to-video-ai', priority: '0.9' },
  { path: '/ai-video-generator', priority: '0.9' },
  { path: '/compare', priority: '0.8' },
  { path: '/use-cases', priority: '0.8' },
  // Blog listing
  { path: '/blog', priority: '0.8' },
  // Other pages
  { path: '/video', priority: '0.7' },
  { path: '/prompts', priority: '0.6' },
  { path: '/prompts-en', priority: '0.6' },
  { path: '/keywords', priority: '0.6' },
  { path: '/support', priority: '0.5' },
  { path: '/privacy', priority: '0.3' },
  { path: '/terms', priority: '0.3' },
]

async function getDynamicPaths() {
  const supabase = await createSupabaseServerClient()
  const paths: Array<{ path: string; priority: string }> = []

  try {
    // Blog posts
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: blogPosts } = await (supabase as any)
      .from('blog_posts')
      .select('slug')
      .eq('is_published', true)

    if (Array.isArray(blogPosts)) {
      blogPosts.forEach((post: { slug: string }) => {
        paths.push({ path: `/blog/${post.slug}`, priority: '0.8' })
      })
    }

    // Prompts (individual pages)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: prompts } = await (supabase as any)
      .from('prompt_library')
      .select('slug')
      .eq('is_published', true)
      .not('slug', 'is', null)

    if (Array.isArray(prompts)) {
      prompts.forEach((prompt: { slug: string }) => {
        paths.push({ path: `/prompts/${prompt.slug}`, priority: '0.7' })
      })
    }

    // Use cases
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: useCases } = await (supabase as any)
      .from('use_cases')
      .select('slug')
      .eq('is_published', true)

    if (Array.isArray(useCases)) {
      useCases.forEach((useCase: { slug: string }) => {
        paths.push({ path: `/use-cases/${useCase.slug}`, priority: '0.7' })
      })
    }

    // Compare pages
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: comparePages } = await (supabase as any)
      .from('compare_pages')
      .select('slug')
      .eq('is_published', true)

    if (Array.isArray(comparePages)) {
      comparePages.forEach((compare: { slug: string }) => {
        paths.push({ path: `/compare/${compare.slug}`, priority: '0.7' })
      })
    }

    // Keywords (long-tail keywords)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: keywords } = await (supabase as any)
      .from('long_tail_keywords')
      .select('page_slug')
      .eq('status', 'published')

    if (Array.isArray(keywords)) {
      keywords.forEach((keyword: { page_slug: string }) => {
        paths.push({ path: `/keywords/${keyword.page_slug}`, priority: '0.6' })
      })
    }
  } catch (error) {
    console.error('Error fetching dynamic paths for sitemap:', error)
  }

  return paths
}

export async function GET() {
  const baseUrl = getBaseUrl()
  const dynamicPaths = await getDynamicPaths()
  const allPaths = [...STATIC_PATHS, ...dynamicPaths]

  const urls = allPaths.map((item) => {
    const path = typeof item === 'string' ? item : item.path
    const priority = typeof item === 'string' ? (path === '/' ? '1.0' : '0.6') : item.priority
    return `    <url>
      <loc>${baseUrl}${path}</loc>
      <priority>${priority}</priority>
    </url>`
  })

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}


