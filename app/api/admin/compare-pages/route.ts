import { NextResponse } from 'next/server'
import { validateAdminSession } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import type { Database } from '@/types/database'

export const dynamic = 'force-dynamic'
export const revalidate = 0

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

function parseComparisonPoints(input: unknown): Database['public']['Tables']['compare_pages']['Row']['comparison_points'] {
  if (Array.isArray(input)) {
    return input as Database['public']['Tables']['compare_pages']['Row']['comparison_points']
  }
  if (typeof input === 'string') {
    try {
      return JSON.parse(input) as Database['public']['Tables']['compare_pages']['Row']['comparison_points']
    } catch {
      return []
    }
  }
  return []
}

export async function GET(request: Request) {
  try {
    const adminUser = await validateAdminSession()
    if (!adminUser) {
      return NextResponse.json({ error: '未授权，请先登录' }, { status: 401 })
    }

    const supabase = await createServiceClient()
    const { searchParams } = new URL(request.url)

    const searchQuery = searchParams.get('search')?.trim() ?? ''
    const statusFilter = searchParams.get('status')?.toLowerCase()
    const limit = Math.min(Number(searchParams.get('limit')) || 200, 500)

    let query = supabase
      .from('compare_pages')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(limit)

    if (statusFilter === 'published') {
      query = query.eq('is_published', true)
    } else if (statusFilter === 'draft') {
      query = query.eq('is_published', false)
    }

    const { data, error } = await query
    if (error) {
      throw error
    }

    const comparePages = (Array.isArray(data) ? data : []) as Database['public']['Tables']['compare_pages']['Row'][]

    let filteredComparePages = comparePages

    if (searchQuery) {
      const lowered = searchQuery.toLowerCase()
      filteredComparePages = comparePages.filter((page) => {
        const matchesTitle = page.title?.toLowerCase().includes(lowered)
        const matchesDescription = page.description?.toLowerCase().includes(lowered)
        const matchesSlug = page.slug?.toLowerCase().includes(lowered)
        const matchesToolB = page.tool_b_name?.toLowerCase().includes(lowered)
        return matchesTitle || matchesDescription || matchesSlug || matchesToolB
      })
    }

    return NextResponse.json({
      success: true,
      comparePages: filteredComparePages,
      count: filteredComparePages.length,
    })
  } catch (error) {
    console.error('获取对比页失败:', error)
    return NextResponse.json(
      {
        error: '获取对比页失败',
        details: error instanceof Error ? error.message : '未知错误',
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
    const toolAName = typeof payload.tool_a_name === 'string' ? payload.tool_a_name.trim() : 'OpenAI Sora'
    const toolBName = typeof payload.tool_b_name === 'string' ? payload.tool_b_name.trim() : ''
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

    if (!toolBName) {
      return NextResponse.json({ error: '工具B名称不能为空' }, { status: 400 })
    }

    const comparisonPoints = parseComparisonPoints(payload.comparison_points)
    const seoKeywords = parseArrayInput(payload.seo_keywords)
    const winner = payload.winner === 'tool_a' || payload.winner === 'tool_b' || payload.winner === 'tie' 
      ? payload.winner 
      : null

    const supabase = await createServiceClient()

    const insertPayload: Database['public']['Tables']['compare_pages']['Insert'] = {
      slug,
      title,
      h1,
      description,
      content,
      tool_a_name: toolAName,
      tool_b_name: toolBName,
      comparison_points: comparisonPoints,
      winner,
      seo_keywords: seoKeywords,
      is_published: isPublished,
      created_by_admin_id: adminUser.id,
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('compare_pages')
      .insert(insertPayload)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    if (!data) {
      throw new Error('创建对比页失败：未返回数据')
    }

    return NextResponse.json({
      success: true,
      comparePage: data,
    })
  } catch (error) {
    console.error('创建对比页失败:', error)
    return NextResponse.json(
      {
        error: '创建对比页失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    )
  }
}

