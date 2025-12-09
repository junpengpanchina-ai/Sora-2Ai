import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

type KeywordRow = Database['public']['Tables']['long_tail_keywords']['Row']

export const dynamic = 'force-dynamic'
export const revalidate = 0

// XML 转义函数
const escapeXml = (str: string | null | undefined): string => {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const slug = params.slug

  // 检查是否是 XML 请求
  // 1. 检查 Accept 头
  const acceptHeader = request.headers.get('accept') || ''
  const acceptsXml = acceptHeader.includes('application/xml') || acceptHeader.includes('text/xml')
  
  // 2. 检查查询参数
  const format = request.nextUrl.searchParams.get('format')
  const isXmlRequest = acceptsXml || format === 'xml'

  // 如果不是 XML 请求，返回 404
  if (!isXmlRequest) {
    return new NextResponse('Not found', { status: 404 })
  }

  try {
    const supabase = await createSupabaseServerClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rawData, error } = await (supabase as any)
      .from('long_tail_keywords')
      .select('*')
      .eq('status', 'published')
      .eq('page_slug', slug)
      .maybeSingle()

    if (error) {
      console.error('Failed to load keyword for XML:', error)
      return new NextResponse('Keyword not found', { status: 404 })
    }

    if (!rawData) {
      return new NextResponse('Keyword not found', { status: 404 })
    }

    const keyword = rawData as KeywordRow
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sora2aivideos.com'

    // 构建 XML 内容
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<keyword-page xmlns="https://sora2aivideos.com/schema/keyword">
  <metadata>
    <url>${baseUrl}/keywords/${escapeXml(keyword.page_slug)}</url>
    <slug>${escapeXml(keyword.page_slug)}</slug>
    <lastmod>${keyword.updated_at ? new Date(keyword.updated_at).toISOString() : new Date().toISOString()}</lastmod>
  </metadata>
  <content>
    <title>${escapeXml(keyword.title || keyword.keyword)}</title>
    <keyword>${escapeXml(keyword.keyword)}</keyword>
    <h1>${escapeXml(keyword.h1 || keyword.keyword)}</h1>
    <meta-description>${escapeXml(keyword.meta_description || '')}</meta-description>
    <intro-paragraph><![CDATA[${keyword.intro_paragraph || ''}]]></intro-paragraph>
    ${keyword.product ? `<product>${escapeXml(keyword.product)}</product>` : ''}
    ${keyword.service ? `<service>${escapeXml(keyword.service)}</service>` : ''}
    ${keyword.pain_point ? `<pain-point><![CDATA[${keyword.pain_point}]]></pain-point>` : ''}
    <intent>${escapeXml(keyword.intent || 'information')}</intent>
    ${keyword.region ? `<region>${escapeXml(keyword.region)}</region>` : ''}
  </content>
  ${keyword.steps && Array.isArray(keyword.steps) && keyword.steps.length > 0 ? `
  <steps>
    ${keyword.steps.map((step, index) => {
      const stepData = step as { title?: string; description?: string }
      return `
    <step number="${index + 1}">
      <title>${escapeXml(stepData.title || '')}</title>
      <description><![CDATA[${stepData.description || ''}]]></description>
    </step>`
    }).join('')}
  </steps>` : ''}
  ${keyword.faq && Array.isArray(keyword.faq) && keyword.faq.length > 0 ? `
  <faq>
    ${keyword.faq.map((item) => {
      const faqData = item as { question?: string; answer?: string }
      return `
    <item>
      <question>${escapeXml(faqData.question || '')}</question>
      <answer><![CDATA[${faqData.answer || ''}]]></answer>
    </item>`
    }).join('')}
  </faq>` : ''}
</keyword-page>`

    return new NextResponse(xmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    console.error('Failed to generate keyword XML:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

