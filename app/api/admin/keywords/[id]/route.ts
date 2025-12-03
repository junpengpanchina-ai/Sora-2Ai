import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { validateAdminSession } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import type { Database } from '@/types/database'
import {
  isKeywordIntent,
  isKeywordStatus,
  normalizeSlug,
  normalizeSteps,
  normalizeFaq,
} from '@/lib/keywords/schema'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type RouteParams = {
  params: {
    id: string
  }
}

type KeywordRow = Database['public']['Tables']['long_tail_keywords']['Row']

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

const serializeKeyword = (row: KeywordRow) => ({
  ...row,
  competition_score: parseOptionalNumber(row.competition_score),
  steps: Array.isArray(row.steps) ? row.steps : [],
  faq: Array.isArray(row.faq) ? row.faq : [],
})

async function revalidateKeywordPaths(slugs: Array<string | null | undefined>) {
  try {
    const tasks = [
      revalidatePath('/'),
      revalidatePath('/keywords'),
      revalidatePath('/sitemap.xml'),
      revalidatePath('/sitemap-index.xml'),
      revalidatePath('/sitemap-long-tail.xml'),
    ]
    slugs
      .filter((slug): slug is string => Boolean(slug))
      .forEach((slug) => tasks.push(revalidatePath(`/keywords/${slug}`)))
    await Promise.allSettled(tasks)
  } catch (error) {
    console.error('Failed to revalidate keyword paths:', error)
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const adminUser = await validateAdminSession()
    if (!adminUser) {
      return NextResponse.json({ error: '未授权，请先登录' }, { status: 401 })
    }

    const keywordId = params.id
    if (!keywordId) {
      return NextResponse.json({ error: '缺少关键词 ID' }, { status: 400 })
    }

    const payload = await request.json().catch(() => null)
    if (!payload || typeof payload !== 'object') {
      return NextResponse.json({ error: '请求体格式不正确' }, { status: 400 })
    }

    const supabase = await createServiceClient()

    const { data: existing, error: fetchError } = await supabase
      .from('long_tail_keywords')
      .select('*')
      .eq('id', keywordId)
      .single()

    if (fetchError) {
      throw fetchError
    }

    if (!existing) {
      return NextResponse.json({ error: '长尾词不存在' }, { status: 404 })
    }

    const updates: Database['public']['Tables']['long_tail_keywords']['Update'] = {}

    if (typeof payload.keyword === 'string') {
      const keyword = payload.keyword.trim()
      if (!keyword) {
        return NextResponse.json({ error: '关键字不能为空' }, { status: 400 })
      }
      updates.keyword = keyword
    }

    if (typeof payload.intent === 'string') {
      const intent = payload.intent.trim()
      if (!isKeywordIntent(intent)) {
        return NextResponse.json({ error: '意图类型不合法' }, { status: 400 })
      }
      updates.intent = intent
    }

    if (typeof payload.pageSlug === 'string' || typeof payload.page_slug === 'string') {
      const slugInput = typeof payload.pageSlug === 'string' ? payload.pageSlug : payload.page_slug
      const slug = normalizeSlug(slugInput)
      if (!slug) {
        return NextResponse.json({ error: 'URL Slug 不能为空' }, { status: 400 })
      }
      updates.page_slug = slug
    }

    if (payload.status !== undefined) {
      const status =
        typeof payload.status === 'string' ? payload.status.trim() : payload.status ?? ''
      if (!isKeywordStatus(status)) {
        return NextResponse.json({ error: '状态不合法' }, { status: 400 })
      }
      updates.status = status
      if (status === 'published') {
        updates.last_generated_at = new Date().toISOString()
      }
    }

    if (payload.product !== undefined) {
      updates.product =
        typeof payload.product === 'string' ? payload.product.trim() || null : payload.product ?? null
    }

    if (payload.service !== undefined) {
      updates.service =
        typeof payload.service === 'string' ? payload.service.trim() || null : payload.service ?? null
    }

    if (payload.region !== undefined) {
      updates.region =
        typeof payload.region === 'string' ? payload.region.trim() || null : payload.region ?? null
    }

    if (payload.pain_point !== undefined) {
      updates.pain_point =
        typeof payload.pain_point === 'string'
          ? payload.pain_point.trim() || null
          : payload.pain_point ?? null
    }

    if (payload.search_volume !== undefined) {
      updates.search_volume = parseOptionalNumber(payload.search_volume)
    }

    if (payload.competition_score !== undefined) {
      updates.competition_score = parseOptionalNumber(payload.competition_score)
    }

    if (payload.priority !== undefined) {
      updates.priority = parseOptionalNumber(payload.priority) ?? existing.priority
    }

    if (payload.title !== undefined) {
      updates.title = typeof payload.title === 'string' ? payload.title.trim() || null : null
    }

    if (payload.meta_description !== undefined) {
      updates.meta_description =
        typeof payload.meta_description === 'string' ? payload.meta_description.trim() || null : null
    }

    if (payload.h1 !== undefined) {
      updates.h1 = typeof payload.h1 === 'string' ? payload.h1.trim() || null : null
    }

    if (payload.intro_paragraph !== undefined) {
      updates.intro_paragraph =
        typeof payload.intro_paragraph === 'string' ? payload.intro_paragraph.trim() || null : null
    }

    if (payload.steps !== undefined) {
      updates.steps = normalizeSteps(payload.steps)
    }

    if (payload.faq !== undefined) {
      updates.faq = normalizeFaq(payload.faq)
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: '没有可更新的字段' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('long_tail_keywords')
      .update(updates)
      .eq('id', keywordId)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    await revalidateKeywordPaths([existing.page_slug, data.page_slug])

    return NextResponse.json({
      success: true,
      keyword: serializeKeyword(data),
    })
  } catch (error) {
    console.error('更新长尾词失败:', error)
    return NextResponse.json(
      {
        error: '更新长尾词失败',
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

    const keywordId = params.id
    if (!keywordId) {
      return NextResponse.json({ error: '缺少关键词 ID' }, { status: 400 })
    }

    const supabase = await createServiceClient()

    const { data, error } = await supabase
      .from('long_tail_keywords')
      .delete()
      .eq('id', keywordId)
      .select('page_slug')
      .maybeSingle()

    if (error) {
      throw error
    }

    if (!data) {
      return NextResponse.json({ error: '长尾词不存在' }, { status: 404 })
    }

    await revalidateKeywordPaths([data.page_slug])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('删除长尾词失败:', error)
    return NextResponse.json(
      {
        error: '删除长尾词失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    )
  }
}


