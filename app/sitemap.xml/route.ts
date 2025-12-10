import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sora2aivideos.com'
  const entries = [
    `${baseUrl}/sitemap-static.xml`,
    `${baseUrl}/sitemap-long-tail.xml`,
  ]

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map((loc) => `  <sitemap>
    <loc>${loc}</loc>
  </sitemap>`)
  .join('\n')}
</sitemapindex>`

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}


