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
    const tier = (searchParams.get('tier') ?? 'all').trim().toLowerCase()

    const page = clampInt(searchParams.get('page'), 1, 1, 200000)
    const limit = clampInt(searchParams.get('limit'), 24, 6, 100)
    const offset = (page - 1) * limit

    const supabase = await createServiceClient()

    // Query timeout: 20 seconds for data query, skip count if it times out
    const QUERY_TIMEOUT = 20000

    // Build data query first (more important than count)
    // Allow both approved and null quality_status (null means not reviewed yet, but still show if published)
    // Optimize: Use separate conditions instead of .or() for better index usage
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let dataQuery = (supabase as any)
      .from('use_cases')
      .select('id, slug, title, description, use_case_type, industry')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply quality_status filter: approved OR null
    // Use .or() for quality_status only
    dataQuery = dataQuery.or('quality_status.eq.approved,quality_status.is.null')

    if (type && isUseCaseType(type)) {
      dataQuery = dataQuery.eq('use_case_type', type)
    }

    if (industry && industry !== 'all') {
      dataQuery = dataQuery.eq('industry', industry)
    }

    if (tier === 's') {
      dataQuery = dataQuery.eq('tier', 1)
    } else if (tier === 'a') {
      dataQuery = dataQuery.eq('tier', 2)
    } else if (tier === 's-a') {
      dataQuery = dataQuery.in('tier', [1, 2])
    }

    if (q) {
      // Supabase `or` uses comma-separated expressions.
      const expr = `slug.ilike.%${q}%,title.ilike.%${q}%,description.ilike.%${q}%`
      dataQuery = dataQuery.or(expr)
    }

    // Execute data query with timeout
    const dataPromise = dataQuery
    const dataTimeoutPromise = new Promise<{ data: unknown[] | null; error: unknown }>((resolve) => {
      setTimeout(() => {
        resolve({ data: null, error: { message: 'Query timed out (20s).', code: 'TIMEOUT' } })
      }, QUERY_TIMEOUT)
    })

    const { data, error: dataError } = await Promise.race([
      dataPromise,
      dataTimeoutPromise,
    ]) as { data: unknown[] | null; error: unknown }

    if (dataError) {
      console.error('[api/use-cases] data error:', dataError)
      const errorInfo = dataError as { message?: string; code?: string; hint?: string }
      return NextResponse.json(
        { 
          error: 'Failed to load use cases', 
          details: errorInfo.message || 'Query timed out or failed.', 
          code: errorInfo.code || 'TIMEOUT',
          hint: errorInfo.hint 
        },
        { 
          status: 502,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
        }
      )
    }

    const items = (Array.isArray(data) ? data : []) as Array<
      Pick<Database['public']['Tables']['use_cases']['Row'], 'id' | 'slug' | 'title' | 'description' | 'use_case_type' | 'industry'>
    >

    // Try to get count, but don't fail if it times out
    let count: number | null = null
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let countQuery = (supabase as any)
        .from('use_cases')
        .select('id', { count: 'exact', head: true })
        .eq('is_published', true)
        .or('quality_status.eq.approved,quality_status.is.null')

      if (type && isUseCaseType(type)) {
        countQuery = countQuery.eq('use_case_type', type)
      }

      if (industry && industry !== 'all') {
        countQuery = countQuery.eq('industry', industry)
      }

      if (tier === 's') {
        countQuery = countQuery.eq('tier', 1)
      } else if (tier === 'a') {
        countQuery = countQuery.eq('tier', 2)
      } else if (tier === 's-a') {
        countQuery = countQuery.in('tier', [1, 2])
      }

      if (q) {
        const expr = `slug.ilike.%${q}%,title.ilike.%${q}%,description.ilike.%${q}%`
        countQuery = countQuery.or(expr)
      }

      const countPromise = countQuery
      const countTimeoutPromise = new Promise<{ count: number | null; error: unknown }>((resolve) => {
        setTimeout(() => {
          resolve({ count: null, error: { message: 'Count query timeout', code: 'TIMEOUT' } })
        }, 10000) // Shorter timeout for count
      })

      const countResult = await Promise.race([countPromise, countTimeoutPromise]) as { count: number | null; error: unknown }
      if (!countResult.error && typeof countResult.count === 'number') {
        count = countResult.count
      }
    } catch (countErr) {
      console.warn('[api/use-cases] count query failed or timed out, continuing without count:', countErr)
      // Continue without count - estimate based on data length
      count = null
    }

    return NextResponse.json(
      {
        success: true,
        items,
        page,
        limit,
        totalCount: count,
        hasMore: count !== null ? offset + items.length < count : items.length === limit,
      },
      {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      }
    )
  } catch (error) {
    console.error('[api/use-cases] exception:', error)
    return NextResponse.json(
      { error: 'Failed to load use cases', details: error instanceof Error ? error.message : 'Unknown error' },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      }
    )
  }
}


