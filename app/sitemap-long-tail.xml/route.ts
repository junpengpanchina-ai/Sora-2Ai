import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import type { Database } from '@/types/database'
import { getKeywordPageUrl, escapeXml } from '@/lib/utils/url'

type KeywordRow = Database['public']['Tables']['long_tail_keywords']['Row']

export const dynamic = 'force-dynamic'
export const revalidate = 0 // 禁用缓存，确保每次请求都读取最新数据

export async function GET() {
  let rawData: Pick<KeywordRow, 'page_slug' | 'updated_at'>[] = []
  
  try {
    const supabase = await createServiceClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (supabase as any)
      .from('long_tail_keywords')
      .select('page_slug, updated_at')
      .eq('status', 'published')
      .order('updated_at', { ascending: false })
      .limit(5000)
    
    if (result.error) {
      console.error('Failed to fetch keywords for sitemap:', result.error)
    } else {
      rawData = Array.isArray(result.data) ? result.data : []
      console.log(`Sitemap: Found ${rawData.length} published keywords`)
    }
  } catch (err) {
    console.error('Failed to create Supabase client for sitemap:', err)
    // 如果环境变量未配置，返回空的 sitemap
  }

  const data = rawData as Pick<KeywordRow, 'page_slug' | 'updated_at'>[]

  const urls = data.map((item) => {
    const escapedSlug = escapeXml(item.page_slug)
    // 使用统一的 URL 生成函数，确保不带 format=xml 参数
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
      'Cache-Control': 'no-cache, no-store, must-revalidate', // 禁用缓存，确保实时数据
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}


