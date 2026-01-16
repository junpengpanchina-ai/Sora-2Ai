import { NextResponse } from 'next/server'
import { getBaseUrl, escapeXml } from '@/lib/utils/url'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'
export const revalidate = 300 // 5 分钟重新生成一次

/**
 * Sitemap Index - 主入口（支持分片）
 * 
 * 这是 Google 应该抓取的主要 sitemap 索引。
 * 它包含：
 * 1. Tier 1 sitemap 分片（基于 AI Citation Score，5k~20k 页）
 * 2. 全量 sitemap（所有其他页面）
 * 
 * Google 会优先抓取 Tier 1，但不会忽略全量。
 */
export async function GET() {
  const baseUrl = getBaseUrl()

  try {
    // 计算需要多少个 Tier1 分片（每片最多 20k URL）
    const supabase = await createServiceClient()
    const { count } = await supabase
      .from('page_scores')
      .select('*', { count: 'exact', head: true })
      .eq('tier', 1)

    const tier1Count = count || 0
    const chunkSize = 20000 // 每片最多 20k URL
    const tier1Chunks = Math.max(1, Math.ceil(tier1Count / chunkSize))

    const now = new Date().toISOString()

    // 构建 Tier1 分片列表
    const tier1Sitemaps = Array.from({ length: tier1Chunks }, (_, i) => ({
      loc: `${baseUrl}/sitemaps/tier1-${i + 1}.xml`,
      lastmod: now,
    }))

    // 构建完整 sitemap 列表
    const entries = [
      ...tier1Sitemaps.map(s => ({ ...s, priority: 'Tier 1 - GEO Core Pages' })),
      {
        loc: `${baseUrl}/sitemap.xml`,
        lastmod: now,
        priority: 'Full Sitemap - All Pages',
      },
    ]

    const body = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map((entry) => `  <sitemap>
    <loc>${escapeXml(entry.loc)}</loc>
    <lastmod>${entry.lastmod}</lastmod>
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
        'X-Tier1-Chunks': String(tier1Chunks),
      },
    })
  } catch (error) {
    console.error('[sitemap-index] Error generating index:', error)
    
    // 降级：返回固定分片数（如果数据库查询失败）
    const fallbackChunks = Number(process.env.TIER1_SITEMAP_CHUNKS || 1)
    const now = new Date().toISOString()
    
    const entries = [
      ...Array.from({ length: fallbackChunks }, (_, i) => ({
        loc: `${baseUrl}/sitemaps/tier1-${i + 1}.xml`,
        lastmod: now,
      })),
      {
        loc: `${baseUrl}/sitemap.xml`,
        lastmod: now,
      },
    ]

    const body = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map((entry) => `  <sitemap>
    <loc>${escapeXml(entry.loc)}</loc>
    <lastmod>${entry.lastmod}</lastmod>
  </sitemap>`)
  .join('\n')}
</sitemapindex>`

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=300, s-maxage=300',
        'X-Content-Type-Options': 'nosniff',
        'X-Sitemap-Type': 'index',
        'X-Fallback': 'true',
      },
    })
  }
}
