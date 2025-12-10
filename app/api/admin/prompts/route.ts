import { NextResponse } from 'next/server'
import { validateAdminSession } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import type { Database } from '@/types/database'
import {
  isPromptCategory,
  isPromptDifficulty,
  isPromptLocale,
  normalizeTags,
  PROMPT_CATEGORIES,
  PROMPT_DIFFICULTIES,
  PROMPT_LOCALES,
} from '@/lib/prompts/schema'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  try {
    const adminUser = await validateAdminSession()
    if (!adminUser) {
      return NextResponse.json({ error: '未授权，请先登录' }, { status: 401 })
    }

    const supabase = await createServiceClient()
    const { searchParams } = new URL(request.url)

    const localeParam = searchParams.get('locale')?.toLowerCase()
    const categoryParam = searchParams.get('category')?.toLowerCase()
    const statusParam = searchParams.get('status')?.toLowerCase()
    const searchQuery = searchParams.get('search')?.trim() ?? ''
    const limit = Math.min(Number(searchParams.get('limit')) || 200, 500)

    let query = supabase
      .from('prompt_library')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(limit)

    if (localeParam && isPromptLocale(localeParam)) {
      query = query.eq('locale', localeParam)
    }

    if (categoryParam && isPromptCategory(categoryParam)) {
      query = query.eq('category', categoryParam)
    }

    if (statusParam === 'published') {
      query = query.eq('is_published', true)
    } else if (statusParam === 'draft') {
      query = query.eq('is_published', false)
    }

    const { data, error } = await query
    if (error) {
      throw error
    }

    const promptRows = Array.isArray(data)
      ? (data as Database['public']['Tables']['prompt_library']['Row'][])
      : ([] as Database['public']['Tables']['prompt_library']['Row'][])

    let prompts = promptRows.map((prompt) => ({
      ...prompt,
      tags: normalizeTags(prompt.tags),
    }))

    if (searchQuery) {
      const lowered = searchQuery.toLowerCase()
      prompts = prompts.filter((prompt) => {
        const matchesTitle = prompt.title?.toLowerCase().includes(lowered)
        const matchesDescription = prompt.description?.toLowerCase().includes(lowered)
        const matchesPrompt = prompt.prompt?.toLowerCase().includes(lowered)
        const matchesTags = prompt.tags.some((tag) => tag.toLowerCase().includes(lowered))
        return matchesTitle || matchesDescription || matchesPrompt || matchesTags
      })
    }

    return NextResponse.json({
      success: true,
      prompts,
      count: prompts.length,
      meta: {
        locales: PROMPT_LOCALES,
        categories: PROMPT_CATEGORIES,
        difficulties: PROMPT_DIFFICULTIES,
      },
    })
  } catch (error) {
    console.error('获取提示词列表失败:', error)
    return NextResponse.json(
      {
        error: '获取提示词列表失败',
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

    const title = typeof payload.title === 'string' ? payload.title.trim() : ''
    const prompt = typeof payload.prompt === 'string' ? payload.prompt.trim() : ''
    const description = typeof payload.description === 'string' ? payload.description.trim() : null
    const example = typeof payload.example === 'string' ? payload.example.trim() : null
    const category = typeof payload.category === 'string' ? payload.category.toLowerCase() : ''
    const difficulty =
      typeof payload.difficulty === 'string' ? payload.difficulty.toLowerCase() : ''
    const locale =
      typeof payload.locale === 'string' ? payload.locale.toLowerCase() : undefined
    const tags = normalizeTags(payload.tags)
    const isPublished =
      typeof payload.isPublished === 'boolean'
        ? payload.isPublished
        : typeof payload.is_published === 'boolean'
          ? payload.is_published
          : true

    if (!title) {
      return NextResponse.json({ error: '标题不能为空' }, { status: 400 })
    }

    if (!prompt) {
      return NextResponse.json({ error: '提示词内容不能为空' }, { status: 400 })
    }

    if (!isPromptCategory(category)) {
      return NextResponse.json({ error: '提示词分类不合法' }, { status: 400 })
    }

    if (!isPromptDifficulty(difficulty)) {
      return NextResponse.json({ error: '提示词意图不合法' }, { status: 400 })
    }

    const resolvedLocale = isPromptLocale(locale) ? locale : 'zh'

    const supabase = await createServiceClient()

    const insertPayload: Database['public']['Tables']['prompt_library']['Insert'] = {
      title,
      description,
      prompt,
      category,
      difficulty,
      tags,
      example,
      locale: resolvedLocale,
      is_published: isPublished,
      created_by_admin_id: adminUser.id,
    }

    const { data, error } = await supabase
      .from('prompt_library')
      // @ts-expect-error Supabase type inference issue with prompt_library table
      .insert(insertPayload)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    if (!data) {
      throw new Error('创建提示词失败：未返回数据')
    }

    const promptData = data as Database['public']['Tables']['prompt_library']['Row']

    return NextResponse.json({
      success: true,
      prompt: {
        ...promptData,
        tags: normalizeTags(promptData.tags),
      },
    })
  } catch (error) {
    console.error('创建提示词失败:', error)
    return NextResponse.json(
      {
        error: '创建提示词失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    )
  }
}


