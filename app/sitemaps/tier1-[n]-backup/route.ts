import { NextResponse } from 'next/server'
import { getBaseUrl, escapeXml } from '@/lib/utils/url'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'
export const revalidate = 3600 // 每小时重新生成一次

const PAGE_SIZE = 20000 // 每片最多 20k URL

/**
 * Tier1 Sitemap 分片
 * 
 * 基于 AI Citation Score 排序，只包含 Tier1 页面（score ≥ 80）
 * 每片最多 20k URL，按分数降序排列
 * 
 * 路径: /sitemaps/tier1-1.xml, /sitemaps/tier1-2.xml, ...
 */
export async function GET(
  _req: Request,
  { params }: { params: { n: string } }
) {
  const baseUrl = getBaseUrl()
  const chunkIndex = Number(params.n)

  // 验证分片索引
  if (!Number.isFinite(chunkIndex) || chunkIndex <= 0) {
    return new NextResponse('Invalid sitemap chunk index', { status: 400 })
  }

  try {
    const supabase = await createServiceClient()

    // 计算 offset
    const offset = (chunkIndex - 1) * PAGE_SIZE

    // 查询 Tier1 页面（按 AI Citation Score 降序）
    // 注意：page_scores.url 格式为 /use-cases/slug
    const { data: scores, error } = await supabase
      .from('page_scores')
      .select('url, ai_citation_score, recalc_at, updated_at')
      .eq('tier', 1)
      .order('ai_citation_score', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1)

    if (error) {
      console.error(`[sitemaps/tier1-${chunkIndex}] Error fetching data:`, error)
      // 返回空 sitemap，而不是错误
      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`,
        {
          status: 200,
          headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=600, s-maxage=600',
          },
        }
      )
    }

    if (!scores || scores.length === 0) {
      // 返回空 sitemap
      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`,
        {
          status: 200,
          headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=600, s-maxage=600',
          },
        }
      )
    }

    // 生成 URL 列表
    const urls = scores
      .map((score: any) => {
        const url = score.url
        if (!url) return null

        // page_scores.url 已经是相对路径（如 /use-cases/slug）
        const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`
        
        // 使用 updated_at 或 recalc_at 作为 lastmod
        const lastmod = score.updated_at || score.recalc_at
        const lastmodStr = lastmod
          ? `\n      <lastmod>${escapeXml(new Date(lastmod).toISOString().split('T')[0])}</lastmod>`
          : ''

        return `    <url>
      <loc>${escapeXml(fullUrl)}</loc>${lastmodStr}
      <changefreq>weekly</changefreq>
      <priority>0.9</priority>
    </url>`
      })
      .filter((url): url is string => url !== null)

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
        'X-Sitemap-Type': 'tier1-chunk',
        'X-Sitemap-Chunk': String(chunkIndex),
        'X-Sitemap-Count': String(urls.length),
      },
    })
  } catch (error) {
    console.error(`[sitemaps/tier1-${chunkIndex}] Error generating sitemap:`, error)
    
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
