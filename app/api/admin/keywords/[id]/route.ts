import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { validateAdminSession } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import type { Database, Json } from '@/types/database'
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

const toNullableString = (value: unknown): string | null => {
  if (value === null || value === undefined) {
    return null
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
  }
  return null
}

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

const readTrimmedString = (value: unknown) => {
  if (typeof value !== 'string') {
    return null
  }
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
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

    const payloadRaw = await request.json().catch(() => null)
    if (!payloadRaw || typeof payloadRaw !== 'object') {
      return NextResponse.json({ error: '请求体格式不正确' }, { status: 400 })
    }
    const payload = payloadRaw as Record<string, unknown>

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

    const updates: Record<string, unknown> = {}

    const keywordValue = readTrimmedString(payload.keyword)
    if (keywordValue !== null) {
      updates.keyword = keywordValue
    }

    const intentValue = readTrimmedString(payload.intent)
    if (intentValue) {
      if (!isKeywordIntent(intentValue)) {
        return NextResponse.json({ error: '意图类型不合法' }, { status: 400 })
      }
      updates.intent = intentValue
    }

    const slugSource = readTrimmedString(payload.pageSlug) ?? readTrimmedString(payload.page_slug)
    if (slugSource) {
      const slug = normalizeSlug(slugSource)
      if (!slug) {
        return NextResponse.json({ error: 'URL Slug 不能为空' }, { status: 400 })
      }
      updates.page_slug = slug
    }

    if (payload.status !== undefined) {
      const statusValue = readTrimmedString(payload.status)
      if (!statusValue) {
        return NextResponse.json({ error: '状态必须是字符串' }, { status: 400 })
      }
      if (!isKeywordStatus(statusValue)) {
        return NextResponse.json({ error: '状态不合法' }, { status: 400 })
      }
      updates.status = statusValue
      if (statusValue === 'published') {
        updates.last_generated_at = new Date().toISOString()
      }
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'product')) {
      updates.product = toNullableString(payload.product)
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'service')) {
      updates.service = toNullableString(payload.service)
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'region')) {
      updates.region = toNullableString(payload.region)
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'pain_point')) {
      updates.pain_point = toNullableString(payload.pain_point)
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'title')) {
      updates.title = toNullableString(payload.title)
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'meta_description')) {
      updates.meta_description = toNullableString(payload.meta_description)
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'h1')) {
      updates.h1 = toNullableString(payload.h1)
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'intro_paragraph')) {
      updates.intro_paragraph = toNullableString(payload.intro_paragraph)
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'search_volume')) {
      updates.search_volume = parseOptionalNumber(payload.search_volume)
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'competition_score')) {
      updates.competition_score = parseOptionalNumber(payload.competition_score)
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'priority')) {
      const parsedPriority = parseOptionalNumber(payload.priority)
      if (parsedPriority !== null) {
        updates.priority = parsedPriority
      }
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'steps')) {
      const normalizedSteps = normalizeSteps(payload.steps)
      updates.steps = JSON.parse(JSON.stringify(normalizedSteps)) as Json
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'faq')) {
      const normalizedFaq = normalizeFaq(payload.faq)
      updates.faq = JSON.parse(JSON.stringify(normalizedFaq)) as Json
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: '没有可更新的字段' }, { status: 400 })
    }
    const updatePayload = updates as Database['public']['Tables']['long_tail_keywords']['Update']

    const { data, error } = await supabase
      .from<Database['public']['Tables']['long_tail_keywords']['Row']>('long_tail_keywords')
      .update(updatePayload)
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


