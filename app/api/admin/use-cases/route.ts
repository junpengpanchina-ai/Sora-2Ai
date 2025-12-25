import { NextResponse } from 'next/server'
import { validateAdminSession } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import type { Database } from '@/types/database'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const USE_CASE_TYPES = [
  'advertising-promotion',      // 广告转化（原 ads, 部分 marketing）
  'social-media-content',       // 短视频内容（原 social-media, youtube, tiktok, instagram, twitter）
  'product-demo-showcase',      // 产品演示（原 product-demo）
  'brand-storytelling',         // 品牌叙事（原 部分 marketing）
  'education-explainer',        // 讲解说明（原 education）
  'ugc-creator-content',         // UGC/测评（新增）
] as const

type UseCaseType = (typeof USE_CASE_TYPES)[number]

function isUseCaseType(value: string): value is UseCaseType {
  return USE_CASE_TYPES.includes(value as UseCaseType)
}

function parseArrayInput(input: string | string[] | undefined): string[] {
  if (Array.isArray(input)) {
    return input.filter((item): item is string => typeof item === 'string')
  }
  if (typeof input === 'string') {
    return input
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
  }
  return []
}

function extractSupabaseErrorInfo(error: unknown): {
  message: string
  code?: string
  details?: string
  hint?: string
  status?: number
} {
  if (!error || typeof error !== 'object') {
    return { message: typeof error === 'string' ? error : 'Unknown error' }
  }

  const record = error as Record<string, unknown>
  const message =
    typeof record.message === 'string'
      ? record.message
      : typeof record.error === 'string'
        ? record.error
        : 'Unknown error'

  return {
    message,
    code: typeof record.code === 'string' ? record.code : undefined,
    details: typeof record.details === 'string' ? record.details : undefined,
    hint: typeof record.hint === 'string' ? record.hint : undefined,
    status: typeof record.status === 'number' ? record.status : undefined,
  }
}

export async function GET(request: Request) {
  try {
    const adminUser = await validateAdminSession()
    if (!adminUser) {
      console.error('[use-cases GET] 未授权访问')
      return NextResponse.json({ error: '未授权，请先登录' }, { status: 401 })
    }

    const supabase = await createServiceClient()
    const { searchParams } = new URL(request.url)

    const searchQuery = searchParams.get('search')?.trim() ?? ''
    const typeFilter = searchParams.get('type')?.toLowerCase()
    const industryFilter = searchParams.get('industry')?.trim() ?? null
    const statusFilter = searchParams.get('status')?.toLowerCase()
    const qualityFilter = searchParams.get('quality_status')?.toLowerCase()
    const limit = Math.min(Number(searchParams.get('limit')) || 50, 1000)
    const offset = Math.max(Number(searchParams.get('offset')) || 0, 0)

    // 首先获取总数（用于分页）
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let countQuery = (supabase as any)
      .from('use_cases')
      // Use a minimal column for count queries to reduce payload/compute pressure
      .select('id', { count: 'exact', head: true })

    if (typeFilter && isUseCaseType(typeFilter)) {
      countQuery = countQuery.eq('use_case_type', typeFilter)
    }

    if (industryFilter && industryFilter !== 'all' && industryFilter !== '') {
      countQuery = countQuery.eq('industry', industryFilter)
    }

    if (statusFilter === 'published') {
      countQuery = countQuery.eq('is_published', true)
    } else if (statusFilter === 'draft') {
      countQuery = countQuery.eq('is_published', false)
    }

    if (qualityFilter && qualityFilter !== 'all') {
      if (qualityFilter === 'null' || qualityFilter === 'none') {
        countQuery = countQuery.is('quality_status', null)
      } else if (['pending', 'approved', 'rejected', 'needs_review'].includes(qualityFilter)) {
        countQuery = countQuery.eq('quality_status', qualityFilter)
      }
    }

    // 添加搜索查询到总数统计中（在数据库层面搜索，支持所有数据）
    if (searchQuery) {
      // 转义特殊字符，避免 SQL 注入和语法错误
      const escapedQuery = searchQuery.replace(/[%_\\]/g, (m) => `\\${m}`)
      const searchPattern = `%${escapedQuery}%`
      // 使用 or 查询在 title, description, slug 中搜索
      // Supabase `or` 使用逗号分隔的表达式
      countQuery = countQuery.or(`title.ilike.${searchPattern},description.ilike.${searchPattern},slug.ilike.${searchPattern}`)
    }

    const { count, error: countError } = await countQuery
    if (countError) {
      console.error('[use-cases GET] 获取总数错误:', countError)
    }

    // 获取分页数据
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from('use_cases')
      .select('*')
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (typeFilter && isUseCaseType(typeFilter)) {
      query = query.eq('use_case_type', typeFilter)
    }

    if (industryFilter && industryFilter !== 'all' && industryFilter !== '') {
      query = query.eq('industry', industryFilter)
    }

    if (statusFilter === 'published') {
      query = query.eq('is_published', true)
    } else if (statusFilter === 'draft') {
      query = query.eq('is_published', false)
    }

    if (qualityFilter && qualityFilter !== 'all') {
      if (qualityFilter === 'null' || qualityFilter === 'none') {
        query = query.is('quality_status', null)
      } else if (['pending', 'approved', 'rejected', 'needs_review'].includes(qualityFilter)) {
        query = query.eq('quality_status', qualityFilter)
      }
    }

    // 添加搜索查询到数据查询中（在数据库层面搜索，支持所有数据）
    if (searchQuery) {
      // 转义特殊字符，避免 SQL 注入和语法错误
      const escapedQuery = searchQuery.replace(/[%_\\]/g, (m) => `\\${m}`)
      const searchPattern = `%${escapedQuery}%`
      // 使用 or 查询在 title, description, slug 中搜索
      // Supabase `or` 使用逗号分隔的表达式
      query = query.or(`title.ilike.${searchPattern},description.ilike.${searchPattern},slug.ilike.${searchPattern}`)
    }

    const { data, error } = await query
    if (error) {
      const info = extractSupabaseErrorInfo(error)
      console.error('[use-cases GET] Supabase 查询错误:', { ...info })
      return NextResponse.json(
        {
          error: '获取使用场景失败',
          details: info.message,
          code: info.code,
          hint: info.hint,
        },
        // Gateway-ish error: the upstream (Supabase) failed
        { status: info.status && info.status >= 400 ? info.status : 502 }
      )
    }

    const useCases = (Array.isArray(data) ? data : []) as Database['public']['Tables']['use_cases']['Row'][]
    const totalCount = typeof count === 'number' ? count : useCases.length

    return NextResponse.json({
      success: true,
      useCases: useCases,
      count: useCases.length,
      totalCount: totalCount,
      limit: limit,
      offset: offset,
    })
  } catch (error) {
    console.error('[use-cases GET] 获取使用场景失败:', error)
    const info = extractSupabaseErrorInfo(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error('[use-cases GET] 错误详情:', { ...info })
    console.error('[use-cases GET] 错误堆栈:', errorStack)
    return NextResponse.json(
      {
        error: '获取使用场景失败',
        details: info.message || '未知错误',
        code: info.code,
        hint: info.hint,
      },
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

    const slug = typeof payload.slug === 'string' ? payload.slug.trim() : ''
    const title = typeof payload.title === 'string' ? payload.title.trim() : ''
    const h1 = typeof payload.h1 === 'string' ? payload.h1.trim() : ''
    const description = typeof payload.description === 'string' ? payload.description.trim() : ''
    const content = typeof payload.content === 'string' ? payload.content.trim() : ''
    const useCaseType = typeof payload.use_case_type === 'string' ? payload.use_case_type.toLowerCase() : ''
    const isPublished =
      typeof payload.isPublished === 'boolean'
        ? payload.isPublished
        : typeof payload.is_published === 'boolean'
          ? payload.is_published
          : true

    if (!slug) {
      return NextResponse.json({ error: 'Slug 不能为空' }, { status: 400 })
    }

    if (!title) {
      return NextResponse.json({ error: '标题不能为空' }, { status: 400 })
    }

    if (!h1) {
      return NextResponse.json({ error: 'H1 不能为空' }, { status: 400 })
    }

    if (!description) {
      return NextResponse.json({ error: '描述不能为空' }, { status: 400 })
    }

    if (!content) {
      return NextResponse.json({ error: '内容不能为空' }, { status: 400 })
    }

    if (!isUseCaseType(useCaseType)) {
      return NextResponse.json({ error: '使用场景类型不合法' }, { status: 400 })
    }

    const featuredPromptIds = parseArrayInput(payload.featured_prompt_ids)
    const relatedUseCaseIds = parseArrayInput(payload.related_use_case_ids)
    const seoKeywords = parseArrayInput(payload.seo_keywords)
    const industry = typeof payload.industry === 'string' && payload.industry.trim() ? payload.industry.trim() : null
    
    // 质量相关字段
    const qualityStatus = typeof payload.quality_status === 'string' 
      ? (['pending', 'approved', 'rejected', 'needs_review'].includes(payload.quality_status) ? payload.quality_status : 'pending')
      : 'pending'
    const qualityIssues = parseArrayInput(payload.quality_issues)
    const qualityScore = typeof payload.quality_score === 'number' 
      ? Math.max(0, Math.min(100, payload.quality_score))
      : null

    const supabase = await createServiceClient()

    // 确保 slug 唯一性：如果已存在，自动添加后缀
    let finalSlug = slug
    let attempt = 0
    const maxAttempts = 100 // 防止无限循环
    
    while (attempt < maxAttempts) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existing, error: checkError } = await (supabase as any)
        .from('use_cases')
        .select('slug')
        .eq('slug', finalSlug)
        .limit(1)
        .maybeSingle()
      
      // 如果查询出错或找到记录，说明 slug 已存在
      if (checkError || existing) {
        // slug 已存在，添加后缀
        attempt++
        finalSlug = `${slug}-${attempt}`
      } else {
        // slug 不存在，可以使用
        break
      }
    }
    
    if (attempt >= maxAttempts) {
      throw new Error(`无法生成唯一的 slug，已尝试 ${maxAttempts} 次`)
    }

    const insertPayload: Database['public']['Tables']['use_cases']['Insert'] = {
      slug: finalSlug,
      title,
      h1,
      description,
      content,
      use_case_type: useCaseType,
      industry,
      featured_prompt_ids: featuredPromptIds,
      related_use_case_ids: relatedUseCaseIds,
      seo_keywords: seoKeywords,
      is_published: isPublished,
      quality_status: qualityStatus as 'pending' | 'approved' | 'rejected' | 'needs_review' | null,
      quality_issues: qualityIssues.length > 0 ? qualityIssues : null,
      quality_score: qualityScore,
      created_by_admin_id: adminUser.id,
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('use_cases')
      .insert(insertPayload)
      .select('*')
      .single()

    if (error) {
      console.error('[use-cases POST] Supabase 插入错误:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        insertPayload: {
          ...insertPayload,
          content: insertPayload.content?.substring(0, 100) + '...',
        },
      })
      
      // 如果是唯一约束违反（slug 冲突），提供更友好的错误信息
      if (error.code === '23505') {
        throw new Error(`Slug "${finalSlug}" 已存在，系统已尝试自动生成唯一 slug，但仍失败。请检查数据库或稍后重试。`)
      }
      
      throw error
    }

    if (!data) {
      console.error('[use-cases POST] 插入成功但未返回数据')
      throw new Error('创建使用场景失败：未返回数据')
    }

    console.log('[use-cases POST] 成功创建使用场景:', { id: data.id, slug: data.slug, title: data.title })
    return NextResponse.json({
      success: true,
      useCase: data,
    })
  } catch (error) {
    console.error('[use-cases POST] 创建使用场景失败:', error)
    const errorMessage = error instanceof Error ? error.message : '未知错误'
    const errorStack = error instanceof Error ? error.stack : undefined
    const errorDetails = error && typeof error === 'object' && 'details' in error ? error.details : undefined
    const errorCode = error && typeof error === 'object' && 'code' in error ? error.code : undefined
    
    console.error('[use-cases POST] 错误详情:', {
      message: errorMessage,
      code: errorCode,
      details: errorDetails,
      stack: errorStack,
    })
    
    return NextResponse.json(
      {
        error: '创建使用场景失败',
        details: errorMessage,
        code: errorCode,
        hint: error && typeof error === 'object' && 'hint' in error ? error.hint : undefined,
      },
      { status: 500 }
    )
  }
}

