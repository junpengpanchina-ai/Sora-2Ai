import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import type { Database } from '@/types/database'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const USE_CASE_TYPES = [
  'advertising-promotion',      // 广告转化
  'social-media-content',       // 短视频内容
  'product-demo-showcase',      // 产品演示
  'brand-storytelling',         // 品牌叙事
  'education-explainer',        // 讲解说明
  'ugc-creator-content',         // UGC/测评
] as const

type UseCaseType = (typeof USE_CASE_TYPES)[number]

function isUseCaseType(value: string): value is UseCaseType {
  return USE_CASE_TYPES.includes(value as UseCaseType)
}

function clampInt(value: unknown, fallback: number, min: number, max: number) {
  const n = typeof value === 'string' ? Number(value) : typeof value === 'number' ? value : NaN
  if (!Number.isFinite(n)) return fallback
  return Math.max(min, Math.min(max, Math.floor(n)))
}

function escapeForIlike(input: string) {
  // Escape % and _ for LIKE, and strip commas to avoid breaking Supabase `or(...)` syntax.
  return input.replace(/[%_]/g, (m) => `\\${m}`).replace(/,/g, ' ').trim()
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const qRaw = (searchParams.get('q') ?? '').trim()
    const q = qRaw.length > 0 ? escapeForIlike(qRaw.slice(0, 80)) : ''
    const type = (searchParams.get('type') ?? '').trim().toLowerCase()
    const industry = (searchParams.get('industry') ?? '').trim()

    const page = clampInt(searchParams.get('page'), 1, 1, 200000)
    const limit = clampInt(searchParams.get('limit'), 24, 6, 60)
    const offset = (page - 1) * limit

    const supabase = await createServiceClient()

    // Build count query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let countQuery = (supabase as any)
      .from('use_cases')
      .select('id', { count: 'exact', head: true })
      .eq('is_published', true)
      .eq('quality_status', 'approved')

    // Build data query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let dataQuery = (supabase as any)
      .from('use_cases')
      .select('id, slug, title, description, use_case_type, industry')
      .eq('is_published', true)
      .eq('quality_status', 'approved')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (type && isUseCaseType(type)) {
      countQuery = countQuery.eq('use_case_type', type)
      dataQuery = dataQuery.eq('use_case_type', type)
    }

    if (industry && industry !== 'all') {
      countQuery = countQuery.eq('industry', industry)
      dataQuery = dataQuery.eq('industry', industry)
    }

    if (q) {
      // Supabase `or` uses comma-separated expressions.
      const expr = `slug.ilike.%${q}%,title.ilike.%${q}%,description.ilike.%${q}%`
      countQuery = countQuery.or(expr)
      dataQuery = dataQuery.or(expr)
    }

    const [{ count, error: countError }, { data, error: dataError }] = await Promise.all([countQuery, dataQuery])

    if (countError) {
      console.error('[api/use-cases] count error:', countError)
    }

    if (dataError) {
      console.error('[api/use-cases] data error:', dataError)
      return NextResponse.json(
        { error: 'Failed to load use cases', details: dataError.message, code: dataError.code, hint: dataError.hint },
        { status: 502 }
      )
    }

    const items = (Array.isArray(data) ? data : []) as Array<
      Pick<Database['public']['Tables']['use_cases']['Row'], 'id' | 'slug' | 'title' | 'description' | 'use_case_type' | 'industry'>
    >

    return NextResponse.json({
      success: true,
      items,
      page,
      limit,
      totalCount: typeof count === 'number' ? count : null,
      hasMore: typeof count === 'number' ? offset + items.length < count : items.length === limit,
    })
  } catch (error) {
    console.error('[api/use-cases] exception:', error)
    return NextResponse.json(
      { error: 'Failed to load use cases', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}


