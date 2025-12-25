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
    `${baseUrl}/sitemap-long-tail.xml`,
  ]

  try {
    // 按意图拆分场景 sitemap（符合 SEO 最佳实践）
    const supabase = await createServiceClient()
    
    // 查询各意图的数据数量
    const intents = ['conversion', 'education', 'platform', 'all']
    
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
      }
      // intent === 'all' 时不过滤

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count } = await countQuery
      const totalCount = typeof count === 'number' ? count : 0

      if (totalCount === 0) continue

      const totalPages = Math.ceil(totalCount / MAX_URLS_PER_SITEMAP)

      // 为每个分页添加 sitemap 条目
      for (let page = 1; page <= totalPages; page++) {
        if (page === 1 && totalPages === 1) {
          // 如果只有一页，不需要 page 参数
          entries.push(`${baseUrl}/sitemap-scenes.xml?intent=${intent}`)
        } else {
          entries.push(`${baseUrl}/sitemap-scenes.xml?intent=${intent}&page=${page}`)
        }
      }
    }
  } catch (error) {
    console.error('Error calculating scenes sitemap by intent:', error)
    // 如果出错，至少包含所有场景的第一页
    entries.push(`${baseUrl}/sitemap-scenes.xml?intent=all`)
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
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}


