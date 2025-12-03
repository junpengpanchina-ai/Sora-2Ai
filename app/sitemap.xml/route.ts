import { NextResponse } from 'next/server'

export const revalidate = 3600

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.sora2ai.com'
  const target = new URL('/sitemap-index.xml', baseUrl)
  const body = `<?xml version="1.0" encoding="UTF-8"?>
  <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <sitemap>
      <loc>${target.href}</loc>
    </sitemap>
  </sitemapindex>`

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'application/xml',
    },
  })
}


