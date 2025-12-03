import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { validateAdminSession } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import type { Database } from '@/types/database'
import {
  KEYWORD_INTENTS,
  KEYWORD_STATUSES,
  isKeywordIntent,
  isKeywordStatus,
  normalizeSlug,
  normalizeSteps,
  normalizeFaq,
} from '@/lib/keywords/schema'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const parseOptionalNumber = (value: unknown) => {
  if (value === null || value === undefined) {
    return null
  }
  if (typeof value === 'string' && value.trim() === '') {
    return null
  }
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

type KeywordRow = Database['public']['Tables']['long_tail_keywords']['Row']

const serializeKeyword = (row: KeywordRow) => ({
  ...row,
  competition_score: parseOptionalNumber(row.competition_score),
  steps: Array.isArray(row.steps) ? row.steps : [],
  faq: Array.isArray(row.faq) ? row.faq : [],
})

const sanitizeSearchTerm = (value: string) =>
  value
    .trim()
    .replace(/[%*]/g, '')
    .replace(/[,|]/g, ' ')

async function revalidateKeywordCaches(slug?: string | null) {
  try {
    await Promise.allSettled([
      revalidatePath('/'),
      revalidatePath('/keywords'),
      revalidatePath('/sitemap.xml'),
      revalidatePath('/sitemap-index.xml'),
      revalidatePath('/sitemap-long-tail.xml'),
      slug ? revalidatePath(`/keywords/${slug}`) : Promise.resolve(),
    ])
  } catch (error) {
    console.error('Failed to revalidate keyword caches', error)
  }
}

export async function GET(request: Request) {
  try {
    const adminUser = await validateAdminSession()
    if (!adminUser) {
      return NextResponse.json({ error: '未授权，请先登录' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const pageParam = Number(searchParams.get('page')) || 1
    const limitParam = Number(searchParams.get('limit')) || 50
    const page = Math.max(pageParam, 1)
    const limit = Math.min(Math.max(limitParam, 1), 200)
    const from = (page - 1) * limit
    const to = from + limit - 1

    const supabase = await createServiceClient()
    let query = supabase
      .from('long_tail_keywords')
      .select('*', { count: 'exact' })
      .order('updated_at', { ascending: false })
      .range(from, to)

    const status = searchParams.get('status')
    if (status && isKeywordStatus(status)) {
      query = query.eq('status', status)
    }

    const intent = searchParams.get('intent')
    if (intent && isKeywordIntent(intent)) {
      query = query.eq('intent', intent)
    }

    const product = searchParams.get('product')
    if (product) {
      query = query.ilike('product', `%${product.trim()}%`)
    }

    const service = searchParams.get('service')
    if (service) {
      query = query.ilike('service', `%${service.trim()}%`)
    }

    const region = searchParams.get('region')
    if (region) {
      query = query.ilike('region', `%${region.trim()}%`)
    }

    const painPoint = searchParams.get('pain_point')
    if (painPoint) {
      query = query.ilike('pain_point', `%${painPoint.trim()}%`)
    }

    const searchTerm = searchParams.get('search')
    if (searchTerm) {
      const sanitized = sanitizeSearchTerm(searchTerm)
      if (sanitized) {
        const pattern = `*${sanitized}*`
        query = query.or(
          `keyword.ilike.${pattern},title.ilike.${pattern},page_slug.ilike.${pattern},meta_description.ilike.${pattern}`
        )
      }
    }

    const { data, error, count } = await query
    if (error) {
      throw error
    }

    const keywords = Array.isArray(data) ? data.map(serializeKeyword) : []

    return NextResponse.json({
      success: true,
      keywords,
      count: count ?? keywords.length,
      page,
      limit,
      filters: {
        intents: KEYWORD_INTENTS,
        statuses: KEYWORD_STATUSES,
      },
    })
  } catch (error) {
    console.error('获取长尾词列表失败:', error)
    return NextResponse.json(
      { error: '获取长尾词列表失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const adminUser = await validateAdminSession()
    if (!adminUser) {
      return NextResponse.json({ error: '未授权，请先登录' }, { status: 401 })
    }

    const payload = await request.json().catch(() => null)
    if (!payload || typeof payload !== 'object') {
      return NextResponse.json({ error: '请求体格式不正确' }, { status: 400 })
    }

    const keyword = typeof payload.keyword === 'string' ? payload.keyword.trim() : ''
    if (!keyword) {
      return NextResponse.json({ error: '关键字不能为空' }, { status: 400 })
    }

    const intentInput = typeof payload.intent === 'string' ? payload.intent.trim() : ''
    if (!isKeywordIntent(intentInput)) {
      return NextResponse.json({ error: '意图类型不合法' }, { status: 400 })
    }

    const slugInput =
      typeof payload.pageSlug === 'string'
        ? payload.pageSlug
        : typeof payload.page_slug === 'string'
          ? payload.page_slug
          : keyword
    const pageSlug = normalizeSlug(slugInput)
    if (!pageSlug) {
      return NextResponse.json({ error: 'URL Slug 不能为空' }, { status: 400 })
    }

    const statusInput =
      typeof payload.status === 'string' ? payload.status.trim() : KEYWORD_STATUSES[0]
    if (!isKeywordStatus(statusInput)) {
      return NextResponse.json({ error: '状态不合法' }, { status: 400 })
    }

    const steps = normalizeSteps(payload.steps)
    const faq = normalizeFaq(payload.faq)

    const insertPayload: Database['public']['Tables']['long_tail_keywords']['Insert'] = {
      keyword,
      intent: intentInput,
      product: typeof payload.product === 'string' ? payload.product.trim() || null : null,
      service: typeof payload.service === 'string' ? payload.service.trim() || null : null,
      region: typeof payload.region === 'string' ? payload.region.trim() || null : null,
      pain_point: typeof payload.pain_point === 'string' ? payload.pain_point.trim() || null : null,
      search_volume: parseOptionalNumber(payload.search_volume),
      competition_score: parseOptionalNumber(payload.competition_score),
      priority: parseOptionalNumber(payload.priority) ?? 0,
      page_slug: pageSlug,
      title: typeof payload.title === 'string' ? payload.title.trim() || null : null,
      meta_description:
        typeof payload.meta_description === 'string' ? payload.meta_description.trim() || null : null,
      h1: typeof payload.h1 === 'string' ? payload.h1.trim() || null : null,
      intro_paragraph:
        typeof payload.intro_paragraph === 'string' ? payload.intro_paragraph.trim() || null : null,
      steps,
      faq,
      status: statusInput,
      last_generated_at: statusInput === 'published' ? new Date().toISOString() : null,
    }

    const supabase = await createServiceClient()
    const { data, error } = await supabase
      .from('long_tail_keywords')
      .insert(insertPayload)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    await revalidateKeywordCaches(pageSlug)

    return NextResponse.json({
      success: true,
      keyword: serializeKeyword(data),
    })
  } catch (error) {
    console.error('创建长尾词失败:', error)
    return NextResponse.json(
      { error: '创建长尾词失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}


