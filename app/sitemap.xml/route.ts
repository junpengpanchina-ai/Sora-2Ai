import { NextResponse } from 'next/server'
import { getBaseUrl } from '@/lib/utils/url'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Sitemap 协议限制：每个文件最多 50,000 个 URL
const MAX_URLS_PER_SITEMAP = 50000

export async function GET() {
  const baseUrl = getBaseUrl()
  const entries = [
    `${baseUrl}/sitemap-core.xml`, // 核心内容（≤50,000条，优先转化意图）
    `${baseUrl}/sitemap-static.xml`,
  ]

  try {
    const supabase = await createServiceClient()

    // 1) Long-tail keywords sitemap pagination
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count: keywordCount, error: keywordCountError } = await (supabase as any)
      .from('long_tail_keywords')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published')

    if (keywordCountError) {
      console.error('Error counting long-tail keywords for sitemap:', keywordCountError)
      entries.push(`${baseUrl}/sitemap-long-tail.xml`)
    } else {
      const total = typeof keywordCount === 'number' ? keywordCount : 0
      const pages = Math.max(1, Math.ceil(total / MAX_URLS_PER_SITEMAP))
      for (let page = 1; page <= pages; page++) {
        entries.push(`${baseUrl}/sitemap-long-tail.xml?page=${page}`)
      }
    }

    // 按意图拆分场景 sitemap（符合 SEO 最佳实践）
    // 查询各意图的数据数量（尽量避免重复 URL）
    // - conversion: advertising-promotion, product-demo-showcase
    // - education: education-explainer
    // - platform: social-media-content, ugc-creator-content
    // - brand: brand-storytelling
    // Note: We avoid an "all" sitemap because it duplicates URLs across intent groups.
    const intents = ['conversion', 'education', 'platform', 'brand']
    
    for (const intent of intents) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let countQuery = (supabase as any)
        .from('use_cases')
        .select('id', { count: 'exact', head: true })
        .eq('is_published', true)
        .eq('quality_status', 'approved')

      // 根据意图过滤
      if (intent === 'conversion') {
        countQuery = countQuery.in('use_case_type', ['advertising-promotion', 'product-demo-showcase'])
      } else if (intent === 'education') {
        countQuery = countQuery.eq('use_case_type', 'education-explainer')
      } else if (intent === 'platform') {
        countQuery = countQuery.in('use_case_type', ['social-media-content', 'ugc-creator-content'])
      } else if (intent === 'brand') {
        countQuery = countQuery.eq('use_case_type', 'brand-storytelling')
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count } = await countQuery
      const totalCount = typeof count === 'number' ? count : 0

      if (totalCount === 0) continue

      const totalPages = Math.ceil(totalCount / MAX_URLS_PER_SITEMAP)

      // 为每个分页添加 sitemap 条目
      for (let page = 1; page <= totalPages; page++) {
        entries.push(`${baseUrl}/sitemap-scenes.xml?intent=${intent}&page=${page}`)
      }
    }
  } catch (error) {
    console.error('Error calculating scenes sitemap by intent:', error)
    // 如果出错，至少包含所有场景的第一页
    entries.push(`${baseUrl}/sitemap-scenes.xml?intent=conversion&page=1`)
    entries.push(`${baseUrl}/sitemap-scenes.xml?intent=education&page=1`)
    entries.push(`${baseUrl}/sitemap-scenes.xml?intent=platform&page=1`)
    entries.push(`${baseUrl}/sitemap-scenes.xml?intent=brand&page=1`)
    // At minimum, include page 1 of long-tail
    entries.push(`${baseUrl}/sitemap-long-tail.xml?page=1`)
  }

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
      // Keep sitemap reasonably fresh; Vercel edge caching can otherwise serve stale indexes for up to an hour.
      'Cache-Control': 'public, max-age=300, s-maxage=300',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}


