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

type RouteParams = {
  params: Promise<{ id: string }>
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

    const updatePayload: Database['public']['Tables']['compare_pages']['Update'] = {}

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

    if (typeof payload.tool_a_name === 'string' && payload.tool_a_name.trim()) {
      updatePayload.tool_a_name = payload.tool_a_name.trim()
    }

    if (typeof payload.tool_b_name === 'string' && payload.tool_b_name.trim()) {
      updatePayload.tool_b_name = payload.tool_b_name.trim()
    }

    if (payload.comparison_points !== undefined) {
      updatePayload.comparison_points = parseComparisonPoints(payload.comparison_points)
    }

    if (payload.winner === 'tool_a' || payload.winner === 'tool_b' || payload.winner === 'tie' || payload.winner === null) {
      updatePayload.winner = payload.winner
    }

    if (typeof payload.isPublished === 'boolean' || typeof payload.is_published === 'boolean') {
      updatePayload.is_published =
        typeof payload.isPublished === 'boolean' ? payload.isPublished : payload.is_published
    }

    if (payload.seo_keywords !== undefined) {
      updatePayload.seo_keywords = parseArrayInput(payload.seo_keywords)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('compare_pages')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    if (!data) {
      return NextResponse.json({ error: '对比页不存在' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      comparePage: data,
    })
  } catch (error) {
    console.error('更新对比页失败:', error)
    return NextResponse.json(
      {
        error: '更新对比页失败',
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

    const { error } = await supabase.from('compare_pages').delete().eq('id', id)

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      message: '对比页已删除',
    })
  } catch (error) {
    console.error('删除对比页失败:', error)
    return NextResponse.json(
      {
        error: '删除对比页失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    )
  }
}

