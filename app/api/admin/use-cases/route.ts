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
    const statusFilter = searchParams.get('status')?.toLowerCase()
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

    if (statusFilter === 'published') {
      query = query.eq('is_published', true)
    } else if (statusFilter === 'draft') {
      query = query.eq('is_published', false)
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

    const supabase = await createServiceClient()

    const insertPayload: Database['public']['Tables']['use_cases']['Insert'] = {
      slug,
      title,
      h1,
      description,
      content,
      use_case_type: useCaseType,
      featured_prompt_ids: featuredPromptIds,
      related_use_case_ids: relatedUseCaseIds,
      seo_keywords: seoKeywords,
      is_published: isPublished,
      created_by_admin_id: adminUser.id,
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('use_cases')
      .insert(insertPayload)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    if (!data) {
      throw new Error('创建使用场景失败：未返回数据')
    }

    return NextResponse.json({
      success: true,
      useCase: data,
    })
  } catch (error) {
    console.error('创建使用场景失败:', error)
    return NextResponse.json(
      {
        error: '创建使用场景失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    )
  }
}

