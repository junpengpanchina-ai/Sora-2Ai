import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { validateAdminSession } from '@/lib/admin-auth'
import type { Database } from '@/types/database'

interface RouteParams {
  params: {
    id: string
  }
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

// PATCH: 更新动态页面SEO配置
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const adminUser = await validateAdminSession()
    if (!adminUser) {
      return NextResponse.json({ error: '未授权，请先登录' }, { status: 401 })
    }

    const payload = await request.json().catch(() => null)
    if (!payload || typeof payload !== 'object') {
      return NextResponse.json({ error: '请求体格式不正确' }, { status: 400 })
    }

    const supabase = await createServiceClient()

    const updatePayload: Database['public']['Tables']['dynamic_page_seo']['Update'] = {}

    if (typeof payload.page_path === 'string') {
      updatePayload.page_path = payload.page_path.trim()
    }
    if (typeof payload.page_url === 'string') {
      updatePayload.page_url = payload.page_url.trim()
    }
    if (typeof payload.title === 'string') {
      updatePayload.title = payload.title.trim()
    }
    if (typeof payload.description === 'string') {
      updatePayload.description = payload.description.trim() || null
    }
    if (typeof payload.h1_text === 'string') {
      updatePayload.h1_text = payload.h1_text.trim() || null
    }
    if (typeof payload.seo_content === 'string') {
      updatePayload.seo_content = payload.seo_content.trim() || null
    }
    if (Array.isArray(payload.meta_keywords)) {
      updatePayload.meta_keywords = payload.meta_keywords.filter((k: unknown) => typeof k === 'string')
    }
    if (typeof payload.is_active === 'boolean') {
      updatePayload.is_active = payload.is_active
    }
    if (typeof payload.priority === 'number') {
      updatePayload.priority = payload.priority
    }
    if (payload.page_params && typeof payload.page_params === 'object') {
      updatePayload.page_params = payload.page_params
    }

    const { data, error } = await supabase
      .from('dynamic_page_seo')
      .update(updatePayload)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('更新动态页面SEO配置失败:', error)
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: '配置不存在' }, { status: 404 })
      }
      return NextResponse.json({ error: '更新配置失败', details: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: data,
    })
  } catch (error) {
    console.error('更新动态页面SEO配置失败:', error)
    return NextResponse.json(
      {
        error: '更新配置失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    )
  }
}

// DELETE: 删除动态页面SEO配置
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const adminUser = await validateAdminSession()
    if (!adminUser) {
      return NextResponse.json({ error: '未授权，请先登录' }, { status: 401 })
    }

    const supabase = await createServiceClient()

    const { error } = await supabase.from('dynamic_page_seo').delete().eq('id', params.id)

    if (error) {
      console.error('删除动态页面SEO配置失败:', error)
      return NextResponse.json({ error: '删除配置失败', details: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: '配置已删除',
    })
  } catch (error) {
    console.error('删除动态页面SEO配置失败:', error)
    return NextResponse.json(
      {
        error: '删除配置失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    )
  }
}
