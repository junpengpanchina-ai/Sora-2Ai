import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const STATIC_PATHS = ['/', '/video', '/prompts', '/support', '/privacy', '/terms']

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sora2aivideos.com'
  const urls = STATIC_PATHS.map(
    (path) => `    <url>
      <loc>${baseUrl}${path}</loc>
      <priority>${path === '/' ? '1.0' : '0.6'}</priority>
    </url>`
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


