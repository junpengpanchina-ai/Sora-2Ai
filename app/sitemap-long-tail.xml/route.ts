import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import type { Database } from '@/types/database'
import { getKeywordPageUrl, escapeXml } from '@/lib/utils/url'
import { isBadKeywordSlug } from '@/lib/keywords/bad-slugs'

type KeywordRow = Database['public']['Tables']['long_tail_keywords']['Row']

export const dynamic = 'force-dynamic'
export const revalidate = 0 // sitemap 本身由 HTTP cache 控制

// Sitemap 协议限制：每个文件最多 50,000 个 URL
const MAX_URLS_PER_SITEMAP = 50000

const normalizeKeywordSlug = (slug: string) => slug.replace(/\.xml$/i, '')

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))

  let totalCount = 0
  let rawData: Pick<KeywordRow, 'page_slug' | 'updated_at'>[] = []

  try {
    const supabase = await createServiceClient()

    // Count total published keywords for pagination
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count, error: countError } = await (supabase as any)
      .from('long_tail_keywords')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published')

    if (countError) {
      console.error('Failed to count keywords for sitemap:', countError)
    } else {
      totalCount = typeof count === 'number' ? count : 0
    }

    const totalPages = Math.max(1, Math.ceil(totalCount / MAX_URLS_PER_SITEMAP))
    if (page > totalPages || page < 1) {
      rawData = []
    } else {
      const offset = (page - 1) * MAX_URLS_PER_SITEMAP
      const limit = MAX_URLS_PER_SITEMAP

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (supabase as any)
        .from('long_tail_keywords')
        .select('page_slug, updated_at')
        .eq('status', 'published')
        .order('updated_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (result.error) {
        console.error(`Failed to fetch keywords for sitemap page ${page}:`, result.error)
      } else {
        rawData = Array.isArray(result.data) ? result.data : []
        console.log(`Sitemap: Found ${rawData.length} published keywords on page ${page}/${totalPages}`)
      }
    }
  } catch (err) {
    console.error('Failed to create Supabase client for sitemap:', err)
    // If env is missing or service client fails, return an empty sitemap (valid XML)
  }

  const data = rawData as Pick<KeywordRow, 'page_slug' | 'updated_at'>[]

  // P1: 只放 canonical URL；重复前缀 slug 从 sitemap 排除，避免 redirect 污染
  const filtered = data.filter((item) => {
    const slug = normalizeKeywordSlug(item.page_slug || '')
    return slug && !isBadKeywordSlug(slug)
  })

  const urls = filtered.map((item) => {
    const normalizedSlug = normalizeKeywordSlug(item.page_slug)
    const escapedSlug = escapeXml(normalizedSlug)
    const pageUrl = getKeywordPageUrl(escapedSlug)
    
    // 确保时间格式正确：使用 ISO 8601 格式，只包含日期部分（YYYY-MM-DD）
    let lastmod: string
    if (item.updated_at) {
      try {
        const date = new Date(item.updated_at)
        // 检查日期是否有效
        if (isNaN(date.getTime())) {
          lastmod = new Date().toISOString().split('T')[0] // 只使用日期部分
        } else {
          lastmod = date.toISOString().split('T')[0] // 只使用日期部分，符合 sitemap 标准
        }
      } catch {
        lastmod = new Date().toISOString().split('T')[0]
      }
    } else {
      lastmod = new Date().toISOString().split('T')[0]
    }
    return `    <url>
      <loc>${pageUrl}</loc>
      <lastmod>${lastmod}</lastmod>
      <priority>0.7</priority>
    </url>`
  })

  // 即使没有数据，也返回有效的 XML sitemap
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.length > 0 ? urls.join('\n') : '  <!-- No published keywords found -->'}
</urlset>`

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      // Cache is safe here (the file changes when DB changes; Google will refetch periodically)
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}


