import { NextResponse } from 'next/server'
import { getBaseUrl } from '@/lib/utils/url'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Sitemap 协议限制：每个文件最多 50,000 个 URL
const MAX_URLS_PER_SITEMAP = 50000

/**
 * 场景 sitemap - 包含所有使用场景内容（use_cases）
 * 支持分页，按意图和行业分组
 * 
 * URL 格式：
 * - /sitemap-scenes.xml?intent=conversion&page=1
 * - /sitemap-scenes.xml?intent=education&page=1
 * - /sitemap-scenes.xml?intent=platform&page=1
 * - /sitemap-scenes.xml?intent=all&page=1 (所有场景)
 */
export async function GET(request: Request) {
  const baseUrl = getBaseUrl()
  const { searchParams } = new URL(request.url)
  const intent = searchParams.get('intent') || 'all' // conversion, education, platform, all
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  
  const supabase = await createServiceClient()

  try {
    // 根据意图构建查询
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let countQuery = (supabase as any)
      .from('use_cases')
      .select('id', { count: 'exact', head: true })
      .eq('is_published', true)
      .eq('quality_status', 'approved')

    // 根据意图过滤
    if (intent === 'conversion') {
      // 转化意图：marketing, ads, product-demo
      countQuery = countQuery.in('use_case_type', ['marketing', 'ads', 'product-demo'])
    } else if (intent === 'education') {
      // 教育意图：education
      countQuery = countQuery.eq('use_case_type', 'education')
    } else if (intent === 'platform') {
      // 平台意图：youtube, tiktok, instagram, twitter, social-media
      countQuery = countQuery.in('use_case_type', ['youtube', 'tiktok', 'instagram', 'twitter', 'social-media'])
    }
    // intent === 'all' 时不过滤

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error(`Error counting use cases for intent "${intent}":`, countError)
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
      .select('slug, updated_at, use_case_type')
      .eq('is_published', true)
      .eq('quality_status', 'approved')
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // 根据意图过滤数据
    if (intent === 'conversion') {
      dataQuery = dataQuery.in('use_case_type', ['marketing', 'ads', 'product-demo'])
    } else if (intent === 'education') {
      dataQuery = dataQuery.eq('use_case_type', 'education')
    } else if (intent === 'platform') {
      dataQuery = dataQuery.in('use_case_type', ['youtube', 'tiktok', 'instagram', 'twitter', 'social-media'])
    }

    const { data: useCases, error } = await dataQuery

    if (error) {
      console.error(`Error fetching use cases for intent "${intent}" page ${page}:`, error)
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

    // 根据意图设置优先级
    const getPriority = (useCaseType: string) => {
      if (['marketing', 'ads', 'product-demo'].includes(useCaseType)) {
        return '0.8' // 转化意图
      }
      if (useCaseType === 'education') {
        return '0.7' // 教育意图
      }
      return '0.6' // 其他
    }

    const urls = useCasesArray.map((useCase: { slug: string; updated_at?: string; use_case_type: string }) => {
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

      const priority = getPriority(useCase.use_case_type)

      return `    <url>
      <loc>${baseUrl}/use-cases/${escapedSlug}</loc>${lastmod}
      <priority>${priority}</priority>
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
    console.error(`Error generating scenes sitemap for intent "${intent}" page ${page}:`, error)
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

