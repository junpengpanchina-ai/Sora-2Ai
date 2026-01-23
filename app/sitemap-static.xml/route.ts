import { NextResponse } from 'next/server'
import { getBaseUrl } from '@/lib/utils/url'
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server'
import { INDUSTRIES_100 } from '@/lib/data/industries-100'

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
  // ❌ 移除：Prompt 列表页也不应该进入 sitemap（或降权）
  // { path: '/prompts', priority: '0.6' },
  // { path: '/prompts-en', priority: '0.6' },
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

    // ❌ 移除：Prompts 不应该进入 sitemap
    // Prompt 是内部资产/能力实现，不是内容主体，不应该被索引
    // 参考：SCENE_PROMPT_ARCHITECTURE.md

    // Use cases are now in a separate sitemap (sitemap-use-cases.xml)
    // to avoid exceeding the 50,000 URL limit per sitemap file

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

    // NOTE: Long-tail keywords are intentionally excluded here.
    // They must live in a dedicated, paginated sitemap (sitemap-long-tail.xml)
    // to avoid exceeding the 50,000 URL limit per sitemap file.

    // Industry pages (100 industries)
    INDUSTRIES_100.forEach((industry) => {
      const slug = industry.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and')
      paths.push({ path: `/industries/${slug}`, priority: '0.8' })
    })
  } catch (error) {
    console.error('Error fetching dynamic paths for sitemap:', error)
  }

  return paths
}

export async function GET() {
  const baseUrl = getBaseUrl()
  const dynamicPaths = await getDynamicPaths()
  const allPaths = [...STATIC_PATHS, ...dynamicPaths]
  
  // 使用当前日期作为 lastmod（静态页面通常不会频繁更新）
  const now = new Date().toISOString().split('T')[0]

  const urls = allPaths.map((item) => {
    const path = typeof item === 'string' ? item : item.path
    const priority = typeof item === 'string' ? (path === '/' ? '1.0' : '0.6') : item.priority
    return `    <url>
      <loc>${baseUrl}${path}</loc>
      <lastmod>${now}</lastmod>
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


