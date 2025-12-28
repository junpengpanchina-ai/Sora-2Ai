import { NextResponse } from 'next/server'
import { getBaseUrl } from '@/lib/utils/url'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const baseUrl = getBaseUrl()
  // Keep this index aligned with the primary sitemap entrypoint in robots.txt:
  //   /sitemap.xml
  const entries = [`${baseUrl}/sitemap.xml`]

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


