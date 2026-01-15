import { NextResponse } from 'next/server'
import { validateAdminSession } from '@/lib/admin-auth'
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

type RouteParams = {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const adminUser = await validateAdminSession()
    if (!adminUser) {
      return NextResponse.json({ error: '未授权，请先登录' }, { status: 401 })
    }

    const { id } = await params
    const supabase = await createServiceClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('use_cases')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      throw error
    }

    if (!data) {
      return NextResponse.json({ error: '使用场景不存在' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      useCase: data,
    })
  } catch (error) {
    console.error('获取使用场景失败:', error)
    return NextResponse.json(
      {
        error: '获取使用场景失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const adminUser = await validateAdminSession()
    if (!adminUser) {
      return NextResponse.json({ error: '未授权，请先登录' }, { status: 401 })
    }

    const { id } = await params
    const payload = await request.json().catch(() => null)
    if (!payload || typeof payload !== 'object') {
      return NextResponse.json({ error: '请求体格式不正确' }, { status: 400 })
    }

    const supabase = await createServiceClient()

    const updatePayload: Database['public']['Tables']['use_cases']['Update'] = {}

    if (typeof payload.slug === 'string' && payload.slug.trim()) {
      updatePayload.slug = payload.slug.trim()
    }

    if (typeof payload.title === 'string' && payload.title.trim()) {
      updatePayload.title = payload.title.trim()
    }

    if (typeof payload.h1 === 'string' && payload.h1.trim()) {
      updatePayload.h1 = payload.h1.trim()
    }

    if (typeof payload.description === 'string' && payload.description.trim()) {
      updatePayload.description = payload.description.trim()
    }

    if (typeof payload.content === 'string' && payload.content.trim()) {
      updatePayload.content = payload.content.trim()
    }

    if (typeof payload.use_case_type === 'string' && isUseCaseType(payload.use_case_type.toLowerCase())) {
      updatePayload.use_case_type = payload.use_case_type.toLowerCase()
    }

    if (payload.industry !== undefined) {
      updatePayload.industry = typeof payload.industry === 'string' && payload.industry.trim() ? payload.industry.trim() : null
    }

    if (typeof payload.isPublished === 'boolean' || typeof payload.is_published === 'boolean') {
      updatePayload.is_published =
        typeof payload.isPublished === 'boolean' ? payload.isPublished : payload.is_published
    }

    if (payload.featured_prompt_ids !== undefined) {
      updatePayload.featured_prompt_ids = parseArrayInput(payload.featured_prompt_ids)
    }

    if (payload.related_use_case_ids !== undefined) {
      updatePayload.related_use_case_ids = parseArrayInput(payload.related_use_case_ids)
    }

    if (payload.seo_keywords !== undefined) {
      updatePayload.seo_keywords = parseArrayInput(payload.seo_keywords)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('use_cases')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    if (!data) {
      return NextResponse.json({ error: '使用场景不存在' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      useCase: data,
    })
  } catch (error) {
    console.error('更新使用场景失败:', error)
    return NextResponse.json(
      {
        error: '更新使用场景失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const adminUser = await validateAdminSession()
    if (!adminUser) {
      return NextResponse.json({ error: '未授权，请先登录' }, { status: 401 })
    }

    const { id } = await params
    const supabase = await createServiceClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('use_cases').delete().eq('id', id)

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      message: '使用场景已删除',
    })
  } catch (error) {
    console.error('删除使用场景失败:', error)
    return NextResponse.json(
      {
        error: '删除使用场景失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    )
  }
}

