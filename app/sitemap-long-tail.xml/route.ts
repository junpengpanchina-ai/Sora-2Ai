import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export const revalidate = 3600

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.sora2ai.com'
  const supabase = await createServiceClient()

  const { data, error } = await supabase
    .from('long_tail_keywords')
    .select('page_slug, updated_at')
    .eq('status', 'published')
    .order('updated_at', { ascending: false })
    .limit(5000)

  if (error) {
    console.error('生成长尾词 sitemap 失败:', error)
  }

  const urls = (data ?? []).map(
    (item) => `
    <url>
      <loc>${baseUrl}/keywords/${item.page_slug}</loc>
      <lastmod>${new Date(item.updated_at ?? new Date()).toISOString()}</lastmod>
      <priority>0.7</priority>
    </url>`
  )

  const body = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls.join('')}
  </urlset>`

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'application/xml',
    },
  })
}


