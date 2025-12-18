import { NextResponse } from 'next/server'
import { validateAdminSession } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import type { Database } from '@/types/database'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const USE_CASE_TYPES = [
  'marketing',
  'social-media',
  'youtube',
  'tiktok',
  'product-demo',
  'ads',
  'education',
  'other',
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
    const limit = Math.min(Number(searchParams.get('limit')) || 200, 500)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from('use_cases')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(limit)

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

    const { data, error } = await query
    if (error) {
      console.error('[use-cases GET] Supabase 查询错误:', error)
      throw error
    }

    const useCases = (Array.isArray(data) ? data : []) as Database['public']['Tables']['use_cases']['Row'][]

    let filteredUseCases = useCases

    if (searchQuery) {
      const lowered = searchQuery.toLowerCase()
      filteredUseCases = useCases.filter((useCase) => {
        const matchesTitle = useCase.title?.toLowerCase().includes(lowered)
        const matchesDescription = useCase.description?.toLowerCase().includes(lowered)
        const matchesSlug = useCase.slug?.toLowerCase().includes(lowered)
        return matchesTitle || matchesDescription || matchesSlug
      })
    }

    return NextResponse.json({
      success: true,
      useCases: filteredUseCases,
      count: filteredUseCases.length,
    })
  } catch (error) {
    console.error('[use-cases GET] 获取使用场景失败:', error)
    const errorMessage = error instanceof Error ? error.message : '未知错误'
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error('[use-cases GET] 错误堆栈:', errorStack)
    return NextResponse.json(
      {
        error: '获取使用场景失败',
        details: errorMessage,
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

