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
      return NextResponse.json({ error: 'Unauthorized, please login first' }, { status: 401 })
    }

    const keywordId = params.id
    if (!keywordId) {
      return NextResponse.json({ error: 'Missing keyword ID' }, { status: 400 })
    }

    const payloadRaw = await request.json().catch(() => null)
    if (!payloadRaw || typeof payloadRaw !== 'object') {
      return NextResponse.json({ error: 'Invalid request body format' }, { status: 400 })
    }
    const payload = payloadRaw as Record<string, unknown>

    const supabase = await createServiceClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingRaw, error: fetchError } = await (supabase as any)
      .from('long_tail_keywords')
      .select('*')
      .eq('id', keywordId)
      .single()

    if (fetchError) {
      throw fetchError
    }

    if (!existingRaw) {
      return NextResponse.json({ error: 'Keyword not found' }, { status: 404 })
    }

    const existing = existingRaw as KeywordRow

    const updates: Record<string, unknown> = {}

    const keywordValue = readTrimmedString(payload.keyword)
    if (keywordValue !== null) {
      updates.keyword = keywordValue
    }

      const intentValue = readTrimmedString(payload.intent)
      if (intentValue) {
        if (!isKeywordIntent(intentValue)) {
          return NextResponse.json({ error: 'Invalid intent type' }, { status: 400 })
        }
        updates.intent = intentValue
      }

      if (Object.prototype.hasOwnProperty.call(payload, 'page_style')) {
        const pageStyleValue = typeof payload.page_style === 'string' ? payload.page_style.trim() : null
        if (pageStyleValue && (pageStyleValue === 'default' || pageStyleValue === 'christmas')) {
          updates.page_style = pageStyleValue
        }
      }

      const slugSource = readTrimmedString(payload.pageSlug) ?? readTrimmedString(payload.page_slug)
      if (slugSource) {
        const slug = normalizeSlug(slugSource)
        if (!slug) {
          return NextResponse.json({ error: 'URL Slug cannot be empty' }, { status: 400 })
        }
        updates.page_slug = slug
      }

      if (payload.status !== undefined) {
        const statusValue = readTrimmedString(payload.status)
        if (!statusValue) {
          return NextResponse.json({ error: 'Status must be a string' }, { status: 400 })
        }
        if (!isKeywordStatus(statusValue)) {
          return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
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
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rawData, error } = await (supabase as any)
      .from('long_tail_keywords')
      .update(updates as Database['public']['Tables']['long_tail_keywords']['Update'])
      .eq('id', keywordId)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    const data = rawData as KeywordRow

    await revalidateKeywordPaths([existing.page_slug, data.page_slug])

    return NextResponse.json({
      success: true,
      keyword: serializeKeyword(data),
    })
  } catch (error) {
    console.error('Failed to update keyword:', error)
    return NextResponse.json(
      {
        error: 'Failed to update keyword',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const adminUser = await validateAdminSession()
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized, please login first' }, { status: 401 })
    }

    const keywordId = params.id
    if (!keywordId) {
      return NextResponse.json({ error: 'Missing keyword ID' }, { status: 400 })
    }

    const supabase = await createServiceClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rawData, error } = await (supabase as any)
      .from('long_tail_keywords')
      .delete()
      .eq('id', keywordId)
      .select('page_slug')
      .maybeSingle()

    if (error) {
      throw error
    }

    if (!rawData) {
      return NextResponse.json({ error: 'Keyword not found' }, { status: 404 })
    }

    const data = rawData as Pick<KeywordRow, 'page_slug'>

    await revalidateKeywordPaths([data.page_slug])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete keyword:', error)
    return NextResponse.json(
      {
        error: 'Failed to delete keyword',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}


