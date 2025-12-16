import { NextResponse } from 'next/server'
import { getBaseUrl } from '@/lib/utils/url'

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
  // Blog listing
  { path: '/blog', priority: '0.8' },
  // Blog posts - high priority for SEO
  { path: '/blog/best-sora-alternatives', priority: '0.8' },
  { path: '/blog/free-sora-alternative', priority: '0.8' },
  { path: '/blog/sora-vs-runway', priority: '0.8' },
  { path: '/blog/sora-vs-pika', priority: '0.8' },
  { path: '/blog/text-to-video-ai-free', priority: '0.8' },
  { path: '/blog/ai-video-generator-without-watermark', priority: '0.8' },
  { path: '/blog/ai-video-generator-for-youtube', priority: '0.8' },
  { path: '/blog/ai-video-generator-for-marketing', priority: '0.8' },
  { path: '/blog/sora-vs-luma', priority: '0.8' },
  { path: '/blog/sora-alternative-without-watermark', priority: '0.8' },
  { path: '/blog/ai-video-for-youtube', priority: '0.8' },
  { path: '/blog/ai-video-for-marketing', priority: '0.8' },
  { path: '/blog/sora-alternative-for-youtube', priority: '0.8' },
  { path: '/blog/ai-video-generator-for-short-videos', priority: '0.8' },
  { path: '/blog/ai-video-generator-for-social-media', priority: '0.8' },
  { path: '/blog/ai-video-tool-for-tiktok-videos', priority: '0.8' },
  { path: '/blog/ai-video-for-product-demo', priority: '0.8' },
  { path: '/blog/ai-video-for-ads', priority: '0.8' },
  { path: '/blog/what-is-openai-sora', priority: '0.9' },
  { path: '/blog/best-ai-video-generator-for-youtube-creators', priority: '0.8' },
  // Other pages
  { path: '/video', priority: '0.7' },
  { path: '/prompts', priority: '0.6' },
  { path: '/prompts-en', priority: '0.6' },
  { path: '/keywords', priority: '0.6' },
  { path: '/support', priority: '0.5' },
  { path: '/privacy', priority: '0.3' },
  { path: '/terms', priority: '0.3' },
]

export async function GET() {
  const baseUrl = getBaseUrl()
  const urls = STATIC_PATHS.map(
    (item) => {
      const path = typeof item === 'string' ? item : item.path
      const priority = typeof item === 'string' ? (path === '/' ? '1.0' : '0.6') : item.priority
      return `    <url>
      <loc>${baseUrl}${path}</loc>
      <priority>${priority}</priority>
    </url>`
    }
  )

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


