import { NextResponse } from 'next/server'

export const revalidate = 3600

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.sora2ai.com'
  const entries = [
    `${baseUrl}/sitemap-static.xml`,
    `${baseUrl}/sitemap-long-tail.xml`,
  ]

  const body = `<?xml version="1.0" encoding="UTF-8"?>
  <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${entries
      .map(
        (loc) => `<sitemap>
      <loc>${loc}</loc>
    </sitemap>`
      )
      .join('')}
  </sitemapindex>`

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'application/xml',
    },
  })
}


