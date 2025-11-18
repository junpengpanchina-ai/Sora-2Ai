import { NextResponse } from 'next/server'
import { validateAdminSession } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import type { Database } from '@/types/database'
import {
  isPromptCategory,
  isPromptDifficulty,
  isPromptLocale,
  normalizeTags,
} from '@/lib/prompts/schema'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type RouteParams = {
  params: {
    id: string
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const adminUser = await validateAdminSession()
    if (!adminUser) {
      return NextResponse.json({ error: '未授权，请先登录' }, { status: 401 })
    }

    const promptId = params.id
    if (!promptId) {
      return NextResponse.json({ error: '缺少提示词 ID' }, { status: 400 })
    }

    const payload = await request.json().catch(() => null)
    if (!payload || typeof payload !== 'object') {
      return NextResponse.json({ error: '请求体格式不正确' }, { status: 400 })
    }

    type PromptUpdate = Database['public']['Tables']['prompt_library']['Update']
    const updates: PromptUpdate = {}

    if (typeof payload.title === 'string') {
      const title = payload.title.trim()
      if (!title) {
        return NextResponse.json({ error: '标题不能为空' }, { status: 400 })
      }
      updates.title = title
    }

    if (typeof payload.description === 'string') {
      updates.description = payload.description.trim() || null
    } else if (payload.description === null) {
      updates.description = null
    }

    if (typeof payload.prompt === 'string') {
      const prompt = payload.prompt.trim()
      if (!prompt) {
        return NextResponse.json({ error: '提示词内容不能为空' }, { status: 400 })
      }
      updates.prompt = prompt
    }

    if (typeof payload.example === 'string') {
      updates.example = payload.example.trim() || null
    } else if (payload.example === null) {
      updates.example = null
    }

    if (typeof payload.category === 'string') {
      const category = payload.category.toLowerCase()
      if (!isPromptCategory(category)) {
        return NextResponse.json({ error: '提示词分类不合法' }, { status: 400 })
      }
      updates.category = category
    }

    if (typeof payload.difficulty === 'string') {
      const difficulty = payload.difficulty.toLowerCase()
      if (!isPromptDifficulty(difficulty)) {
        return NextResponse.json({ error: '提示词难度不合法' }, { status: 400 })
      }
      updates.difficulty = difficulty
    }

    if (typeof payload.locale === 'string') {
      const locale = payload.locale.toLowerCase()
      if (!isPromptLocale(locale)) {
        return NextResponse.json({ error: '提示词语言不合法' }, { status: 400 })
      }
      updates.locale = locale
    }

    if (payload.tags !== undefined) {
      updates.tags = normalizeTags(payload.tags)
    }

    if (typeof payload.isPublished === 'boolean') {
      updates.is_published = payload.isPublished
    } else if (typeof payload.is_published === 'boolean') {
      updates.is_published = payload.is_published
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: '没有可更新的字段' }, { status: 400 })
    }

    const supabase = await createServiceClient()
    const promptTable = supabase.from('prompt_library') as unknown as {
      update: (values: PromptUpdate) => {
        eq: (column: string, value: string) => {
          select: (columns: string) => {
            single: () => Promise<{
              data: Database['public']['Tables']['prompt_library']['Row'] | null
              error: unknown
            }>
          }
        }
      }
    }

    const { data, error } = await promptTable
      .update(updates)
      .eq('id', promptId)
      .select('*')
      .single()

    if (error || !data) {
      throw error ?? new Error('更新提示词失败')
    }

    return NextResponse.json({
      success: true,
      prompt: {
        ...data,
        tags: normalizeTags(data.tags),
      },
    })
  } catch (error) {
    console.error('更新提示词失败:', error)
    return NextResponse.json(
      {
        error: '更新提示词失败',
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

    const promptId = params.id
    if (!promptId) {
      return NextResponse.json({ error: '缺少提示词 ID' }, { status: 400 })
    }

    const supabase = await createServiceClient()
    const { data, error } = await supabase
      .from('prompt_library')
      .delete()
      .eq('id', promptId)
      .select('id')
      .maybeSingle()

    if (error) {
      throw error
    }

    if (!data) {
      return NextResponse.json({ error: '提示词未找到' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('删除提示词失败:', error)
    return NextResponse.json(
      {
        error: '删除提示词失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    )
  }
}


