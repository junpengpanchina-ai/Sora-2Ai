import { NextResponse } from 'next/server'
import { getBaseUrl } from '@/lib/utils/url'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Sitemap 协议限制：每个文件最多 50,000 个 URL
const MAX_URLS_PER_SITEMAP = 50000

/**
 * 按行业分组的 use-cases sitemap
 * 支持通过查询参数 industry 和 page 来获取特定行业的分页数据
 * 
 * URL 格式：
 * - /sitemap-use-cases-by-industry.xml?industry=TikTok Creators
 * - /sitemap-use-cases-by-industry.xml?industry=TikTok Creators&page=1
 * - /sitemap-use-cases-by-industry.xml?industry=null (没有行业的数据)
 */
export async function GET(request: Request) {
  const baseUrl = getBaseUrl()
  const { searchParams } = new URL(request.url)
  const industryParam = searchParams.get('industry')
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  
  // 处理 industry=null 的情况（表示没有行业分类的数据）
  const industry = industryParam === 'null' ? null : industryParam
  
  const supabase = await createServiceClient()

  try {
    // 构建查询
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let countQuery = (supabase as any)
      .from('use_cases')
      .select('id', { count: 'exact', head: true })
      .eq('is_published', true)
      .eq('quality_status', 'approved')

    // 根据 industry 参数过滤
    if (industry === null) {
      countQuery = countQuery.is('industry', null)
    } else if (industry) {
      countQuery = countQuery.eq('industry', industry)
    } else {
      // 如果没有提供 industry 参数，返回空 sitemap
      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`,
        {
          status: 200,
          headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=3600, s-maxage=3600',
            'X-Content-Type-Options': 'nosniff',
          },
        }
      )
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error(`Error counting use cases for industry "${industry}":`, countError)
      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`,
        {
          status: 200,
          headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=3600, s-maxage=3600',
            'X-Content-Type-Options': 'nosniff',
          },
        }
      )
    }

    const totalCount = typeof count === 'number' ? count : 0
    
    // 如果该行业没有数据，返回空 sitemap
    if (totalCount === 0) {
      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`,
        {
          status: 200,
          headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=3600, s-maxage=3600',
            'X-Content-Type-Options': 'nosniff',
          },
        }
      )
    }

    const totalPages = Math.ceil(totalCount / MAX_URLS_PER_SITEMAP)

    // 如果请求的页码超出范围，返回空 sitemap
    if (page > totalPages || page < 1) {
      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`,
        {
          status: 200,
          headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=3600, s-maxage=3600',
            'X-Content-Type-Options': 'nosniff',
          },
        }
      )
    }

    // 计算当前页的范围
    const offset = (page - 1) * MAX_URLS_PER_SITEMAP
    const limit = MAX_URLS_PER_SITEMAP

    // 构建数据查询
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let dataQuery = (supabase as any)
      .from('use_cases')
      .select('slug, updated_at')
      .eq('is_published', true)
      .eq('quality_status', 'approved')
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (industry === null) {
      dataQuery = dataQuery.is('industry', null)
    } else {
      dataQuery = dataQuery.eq('industry', industry)
    }

    const { data: useCases, error } = await dataQuery

    if (error) {
      console.error(`Error fetching use cases for industry "${industry}" page ${page}:`, error)
      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`,
        {
          status: 200,
          headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=3600, s-maxage=3600',
            'X-Content-Type-Options': 'nosniff',
          },
        }
      )
    }

    const useCasesArray = Array.isArray(useCases) ? useCases : []

    const urls = useCasesArray.map((useCase: { slug: string; updated_at?: string }) => {
      if (!useCase.slug || typeof useCase.slug !== 'string') {
        return null
      }

      const escapedSlug = useCase.slug
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')

      // Format lastmod date (ISO 8601 format, date only)
      let lastmod = ''
      if (useCase.updated_at) {
        try {
          const date = new Date(useCase.updated_at)
          if (!isNaN(date.getTime())) {
            lastmod = `\n      <lastmod>${date.toISOString().split('T')[0]}</lastmod>`
          }
        } catch {
          // Ignore invalid dates
        }
      }

      return `    <url>
      <loc>${baseUrl}/use-cases/${escapedSlug}</loc>${lastmod}
      <priority>0.7</priority>
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
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    console.error(`Error generating use cases sitemap for industry "${industry}" page ${page}:`, error)
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`,
      {
        status: 200,
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Cache-Control': 'public, max-age=3600, s-maxage=3600',
          'X-Content-Type-Options': 'nosniff',
        },
      }
    )
  }
}

