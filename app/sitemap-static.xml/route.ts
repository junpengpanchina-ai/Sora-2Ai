import { NextResponse } from 'next/server'

export const revalidate = 3600

const STATIC_PATHS = ['/', '/video', '/prompts', '/support', '/privacy', '/terms']

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.sora2ai.com'
  const urls = STATIC_PATHS.map(
    (path) => `
    <url>
      <loc>${baseUrl}${path}</loc>
      <priority>${path === '/' ? '1.0' : '0.6'}</priority>
    </url>`
  ).join('')

  const body = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls}
  </urlset>`

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'application/xml',
    },
  })
}


