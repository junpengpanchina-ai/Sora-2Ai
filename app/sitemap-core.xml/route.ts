import { NextResponse } from 'next/server'
import { getBaseUrl } from '@/lib/utils/url'
import { createServiceClient } from '@/lib/supabase/service'
import { getIndustryTier, isBlacklistedIndustry } from '@/lib/data/industries-priority'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// 核心 sitemap：最多 50,000 条，优先显示最重要的内容
// 包含：S/A+/A 级行业 + 转化意图 + 平台明确 + 内容完整
const MAX_URLS_CORE_SITEMAP = 50000

/**
 * 核心 sitemap - 只包含最重要的内容（≤50,000条）
 * 
 * 筛选规则（必须同时满足）：
 * 1. 行业 = S/A+/A 级优先行业（视频刚需）
 * 2. 场景 = 转化意图（marketing, ads, product-demo）或平台明确（youtube, tiktok, instagram, twitter）
 * 3. 有行业标记（industry IS NOT NULL）
 * 4. 不在黑名单
 * 5. 按行业优先级 + 更新时间排序
 */
export async function GET() {
  const baseUrl = getBaseUrl()
  const supabase = await createServiceClient()

  try {
    // 第一步：获取所有符合基本条件的内容（转化意图 + 平台明确 + 有行业）
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: useCases, error } = await (supabase as any)
      .from('use_cases')
      .select('slug, updated_at, use_case_type, industry')
      .eq('is_published', true)
      .eq('quality_status', 'approved')
      .not('industry', 'is', null) // 必须有行业标记
      .in('use_case_type', [
        // 6个新的视频任务类型（全选，因为都是跨行业通用的任务类型）
        'advertising-promotion',      // 广告转化
        'social-media-content',       // 短视频内容
        'product-demo-showcase',      // 产品演示
        'brand-storytelling',         // 品牌叙事
        'education-explainer',        // 讲解说明
        'ugc-creator-content',         // UGC/测评
      ])
      .order('updated_at', { ascending: false })
      .limit(MAX_URLS_CORE_SITEMAP * 2) // 获取更多数据用于筛选

    if (error) {
      console.error('Error fetching core use cases for sitemap:', error)
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

    // 定义类型
    interface UseCaseForSitemap {
      slug: string
      updated_at?: string
      use_case_type: string
      industry: string | null
    }

    const useCasesArray: UseCaseForSitemap[] = Array.isArray(useCases) ? useCases : []

    // 第二步：筛选和排序
    // If industry values in DB don't match our tier map, tier will be 0 for all rows,
    // which would make the core sitemap empty. Detect that situation and fallback to
    // a broader selection (still excluding blacklisted industries).
    const hasTieredIndustries = useCasesArray.some((uc) => getIndustryTier(uc.industry) > 0)

    const filteredAndSorted = useCasesArray
      .filter((useCase: UseCaseForSitemap) => {
        // 过滤：不在黑名单
        if (isBlacklistedIndustry(useCase.industry)) {
          return false
        }
        // 优先：S/A+/A 级行业（仅当 tier map 可用时）
        if (hasTieredIndustries) {
          return getIndustryTier(useCase.industry) >= 3
        }
        // Fallback: accept all non-blacklisted industries.
        return true
      })
      .sort((a: UseCaseForSitemap, b: UseCaseForSitemap) => {
        // 排序规则：
        // 1. 行业优先级（S > A+ > A）
        if (hasTieredIndustries) {
          const tierA = getIndustryTier(a.industry)
          const tierB = getIndustryTier(b.industry)
          if (tierA !== tierB) {
            return tierB - tierA // 降序
          }
        }

        // 2. 转化意图优先（advertising-promotion/product-demo-showcase > 其他）
        const highConversionTypes = ['advertising-promotion', 'product-demo-showcase']
        const isHighConversionA = highConversionTypes.includes(a.use_case_type)
        const isHighConversionB = highConversionTypes.includes(b.use_case_type)
        if (isHighConversionA !== isHighConversionB) {
          return isHighConversionA ? -1 : 1
        }

        // 3. 更新时间（最新的优先）
        const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0
        const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0
        return dateB - dateA
      })
      .slice(0, MAX_URLS_CORE_SITEMAP) // 只取前 50,000 条

    // 计算优先级：行业优先级 + 内容类型
    const getPriority = (useCase: UseCaseForSitemap) => {
      const tier = getIndustryTier(useCase.industry)
      
      // S 级行业 + 高转化意图 = 0.9
      if (tier === 5 && ['advertising-promotion', 'product-demo-showcase'].includes(useCase.use_case_type)) {
        return '0.9'
      }
      // A+ 级行业 + 高转化意图 = 0.85
      if (tier === 4 && ['advertising-promotion', 'product-demo-showcase'].includes(useCase.use_case_type)) {
        return '0.85'
      }
      // S/A+ 级行业 + 社媒/UGC = 0.8
      if (tier >= 4 && ['social-media-content', 'ugc-creator-content'].includes(useCase.use_case_type)) {
        return '0.8'
      }
      // A 级行业 + 高转化意图 = 0.75
      if (tier === 3 && ['advertising-promotion', 'product-demo-showcase'].includes(useCase.use_case_type)) {
        return '0.75'
      }
      // 其他优先行业 = 0.7
      if (tier >= 3) {
        return '0.7'
      }
      return '0.6'
    }

    const urls = filteredAndSorted.map((useCase: UseCaseForSitemap) => {
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

      const priority = getPriority(useCase)

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
        'Cache-Control': 'public, max-age=300, s-maxage=300',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    console.error('Error generating core sitemap:', error)
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

