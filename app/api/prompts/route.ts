import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  isPromptCategory,
  isPromptLocale,
  normalizeTags,
  PROMPT_CATEGORIES,
  PROMPT_LOCALES,
} from '@/lib/prompts/schema'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const localeParam = searchParams.get('locale')?.toLowerCase()
    const locale = isPromptLocale(localeParam) ? localeParam : 'zh'

    const categoryParam = searchParams.get('category')?.toLowerCase() ?? null
    const category =
      categoryParam && categoryParam !== 'all' && isPromptCategory(categoryParam)
        ? categoryParam
        : null

    const searchQuery = searchParams.get('search')?.trim() ?? ''
    const limit = Math.min(Number(searchParams.get('limit')) || 200, 500)

    const { data, error } = await supabase
      .from('prompt_library')
      .select('*')
      .eq('locale', locale)
      .eq('is_published', true)
      .order('updated_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw error
    }

    let prompts = (data ?? []).map((prompt) => ({
      ...prompt,
      tags: normalizeTags(prompt.tags),
    }))

    if (category) {
      prompts = prompts.filter((prompt) => prompt.category === category)
    }

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
        locale,
        availableLocales: PROMPT_LOCALES,
        availableCategories: PROMPT_CATEGORIES,
      },
    })
  } catch (error) {
    console.error('获取提示词失败:', error)
    return NextResponse.json(
      {
        error: '获取提示词失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    )
  }
}


