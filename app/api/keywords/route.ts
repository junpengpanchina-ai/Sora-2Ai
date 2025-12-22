import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import type { Database } from '@/types/database'
import {
  isKeywordIntent,
  KEYWORD_INTENTS,
  normalizeSteps,
  normalizeFaq,
} from '@/lib/keywords/schema'

type KeywordRow = Database['public']['Tables']['long_tail_keywords']['Row']

export const dynamic = 'force-dynamic'
export const revalidate = 60

const sanitizeSearchTerm = (value: string) =>
  value
    .trim()
    .replace(/[%*]/g, '')
    .replace(/[,|]/g, ' ')

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limitParam = Number(searchParams.get('limit')) || 50
    const limit = Math.min(Math.max(limitParam, 1), 200)
    const excludeId = searchParams.get('exclude')
    const intent = searchParams.get('intent')
    const region = searchParams.get('region')
    const product = searchParams.get('product')
    const search = searchParams.get('search')

    const supabase = await createServiceClient()
    let query = supabase
      .from('long_tail_keywords')
      .select('*')
      .eq('status', 'published')
      .order('priority', { ascending: false })
      .order('updated_at', { ascending: false })
      .limit(limit)

    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    if (intent && isKeywordIntent(intent)) {
      query = query.eq('intent', intent)
    }

    if (region) {
      query = query.ilike('region', `%${region.trim()}%`)
    }

    if (product) {
      query = query.ilike('product', `%${product.trim()}%`)
    }

    if (search) {
      const sanitized = sanitizeSearchTerm(search)
      if (sanitized) {
        const pattern = `*${sanitized}*`
        query = query.or(
          `keyword.ilike.${pattern},title.ilike.${pattern},page_slug.ilike.${pattern},meta_description.ilike.${pattern}`
        )
      }
    }

    const { data: rawData, error } = await query
    if (error) {
      throw error
    }

    const data = (Array.isArray(rawData) ? rawData : []) as KeywordRow[]

    const keywords = data.map((item) => ({
      ...item,
      steps: normalizeSteps(item.steps),
      faq: normalizeFaq(item.faq),
    }))

    const response = NextResponse.json({
      success: true,
      keywords,
      filters: {
        intents: KEYWORD_INTENTS,
      },
    })
    
    // 🔥 Pro 计划优化：添加 CDN 缓存 headers（利用 Vercel Edge Network）
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=60, stale-while-revalidate=300'
    )
    
    return response
  } catch (error) {
    console.error('Failed to fetch public keywords:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch keywords',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}


