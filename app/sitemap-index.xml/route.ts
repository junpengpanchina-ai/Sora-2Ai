import { NextResponse } from 'next/server'
import { getBaseUrl, escapeXml } from '@/lib/utils/url'

export const dynamic = 'force-dynamic'
export const revalidate = 300 // 5 分钟重新生成一次

/**
 * Sitemap Index - 主入口
 * 
 * 这是 Google 应该抓取的主要 sitemap 索引。
 * 它包含：
 * 1. Tier 1 sitemap（GEO 核心页面，优先抓取）
 * 2. 全量 sitemap（所有其他页面）
 * 
 * Google 会优先抓取 Tier 1，但不会忽略全量。
 */
export async function GET() {
  const baseUrl = getBaseUrl()

  const entries = [
    {
      loc: `${baseUrl}/sitemap-tier1.xml`,
      priority: 'Tier 1 - GEO Core Pages',
    },
    {
      loc: `${baseUrl}/sitemap.xml`,
      priority: 'Full Sitemap - All Pages',
    },
  ]

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map((entry) => `  <sitemap>
    <loc>${escapeXml(entry.loc)}</loc>
  </sitemap>`)
  .join('\n')}
</sitemapindex>`

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=300', // 缓存 5 分钟
      'X-Content-Type-Options': 'nosniff',
      'X-Sitemap-Type': 'index',
    },
  })
}
