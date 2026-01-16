import { NextResponse } from 'next/server'
import { getBaseUrl, escapeXml } from '@/lib/utils/url'
import { createServiceClient } from '@/lib/supabase/service'
import { checkTier1 } from '@/lib/utils/tier1-checker'

export const dynamic = 'force-dynamic'
export const revalidate = 3600 // 每小时重新生成一次

// Sitemap 协议限制：每个文件最多 50,000 个 URL
const MAX_URLS_PER_SITEMAP = 50000

/**
 * Tier 1 Sitemap - GEO 核心页面
 * 
 * 只包含符合 Tier 1 标准的页面（满足 ≥4 条条件）：
 * 1. URL 能解析出 industry
 * 2. URL 能解析出 scene
 * 3. 正文长度 ≥ 800 词
 * 4. FAQ 数量 ≥ 3
 * 5. 存在 How-to / Steps 结构
 * 
 * 这些页面是 Google 和 AI 搜索最可能引用的核心知识库。
 */
export async function GET() {
  const baseUrl = getBaseUrl()

  try {
    const supabase = await createServiceClient()

    // 获取所有已发布的 use cases（需要检查内容，所以需要获取 content 字段）
    // 注意：只获取必要的字段，避免查询过大
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: useCases, error } = await (supabase as any)
      .from('use_cases')
      .select('slug, industry, use_case_type, content, updated_at')
      .eq('is_published', true)
      .not('content', 'is', null) // 确保有内容
      .not('industry', 'is', null) // 确保有行业信息
      .limit(10000) // 限制查询数量，避免超时（Tier1 通常不会超过 1 万页）

    if (error) {
      console.error('[sitemap-tier1] Error fetching use cases:', error)
      // 返回空 sitemap，而不是错误，避免影响 Google 抓取
      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`,
        {
          status: 200,
          headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=300, s-maxage=300',
            'X-Content-Type-Options': 'nosniff',
          },
        }
      )
    }

    if (!useCases || !Array.isArray(useCases)) {
      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`,
        {
          status: 200,
          headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=300, s-maxage=300',
            'X-Content-Type-Options': 'nosniff',
          },
        }
      )
    }

    // 过滤出 Tier 1 页面
    const tier1Pages = useCases
      .filter((page) => {
        const result = checkTier1({
          industry: page.industry,
          slug: page.slug,
          use_case_type: page.use_case_type,
          content: page.content || '',
        })
        return result.isTier1
      })
      .slice(0, MAX_URLS_PER_SITEMAP) // 限制数量，避免 sitemap 过大

    console.log(`[sitemap-tier1] Found ${tier1Pages.length} Tier 1 pages out of ${useCases.length} total pages`)

    // 生成 URL 列表
    const urls = tier1Pages.map((page: {
      slug: string
      updated_at?: string
    }) => {
      if (!page.slug || typeof page.slug !== 'string') {
        return null
      }

      const escapedSlug = escapeXml(page.slug)

      // Format lastmod date (ISO 8601 format, date only)
      let lastmod = ''
      if (page.updated_at) {
        try {
          const date = new Date(page.updated_at)
          if (!isNaN(date.getTime())) {
            lastmod = `\n      <lastmod>${date.toISOString().split('T')[0]}</lastmod>`
          }
        } catch {
          // Ignore invalid dates
        }
      }

      return `    <url>
      <loc>${baseUrl}/use-cases/${escapedSlug}</loc>${lastmod}
      <changefreq>weekly</changefreq>
      <priority>0.9</priority>
    </url>`
    }).filter((url): url is string => url !== null)

    const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // 缓存 1 小时
        'X-Content-Type-Options': 'nosniff',
        'X-Sitemap-Type': 'tier1',
        'X-Sitemap-Count': String(tier1Pages.length),
      },
    })
  } catch (error) {
    console.error('[sitemap-tier1] Error generating Tier 1 sitemap:', error)
    // 返回空 sitemap，而不是错误
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`,
      {
        status: 200,
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Cache-Control': 'public, max-age=300, s-maxage=300',
          'X-Content-Type-Options': 'nosniff',
        },
      }
    )
  }
}
