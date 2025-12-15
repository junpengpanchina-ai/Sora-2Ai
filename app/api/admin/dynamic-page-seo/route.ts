import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { validateAdminSession } from '@/lib/admin-auth'
import type { Database } from '@/types/database'

type DynamicPageSeoRow = Database['public']['Tables']['dynamic_page_seo']['Row']
type DynamicPageSeoInsert = Database['public']['Tables']['dynamic_page_seo']['Insert']

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET: 获取所有动态页面SEO配置
export async function GET(request: Request) {
  try {
    const adminUser = await validateAdminSession()
    if (!adminUser) {
      return NextResponse.json({ error: '未授权，请先登录' }, { status: 401 })
    }

    const supabase = await createServiceClient()
    const { searchParams } = new URL(request.url)
    const pagePath = searchParams.get('page_path')
    const isActive = searchParams.get('is_active')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any).from('dynamic_page_seo').select('*').order('priority', { ascending: false }).order('updated_at', { ascending: false })

    if (pagePath) {
      query = query.eq('page_path', pagePath)
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true')
    }

    const { data, error } = await query

    if (error) {
      console.error('获取动态页面SEO配置失败:', error)
      return NextResponse.json({ error: '获取配置失败', details: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: (data ?? []) as DynamicPageSeoRow[],
      count: Array.isArray(data) ? data.length : 0,
    })
  } catch (error) {
    console.error('获取动态页面SEO配置失败:', error)
    return NextResponse.json(
      {
        error: '获取配置失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    )
  }
}

// POST: 创建新的动态页面SEO配置
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

    const pagePath = typeof payload.page_path === 'string' ? payload.page_path.trim() : ''
    const pageUrl = typeof payload.page_url === 'string' ? payload.page_url.trim() : ''
    const title = typeof payload.title === 'string' ? payload.title.trim() : ''
    const description = typeof payload.description === 'string' ? payload.description.trim() : null
    const h1Text = typeof payload.h1_text === 'string' ? payload.h1_text.trim() : null
    const seoContent = typeof payload.seo_content === 'string' ? payload.seo_content.trim() : null
    const metaKeywords = Array.isArray(payload.meta_keywords) ? payload.meta_keywords.filter((k: unknown) => typeof k === 'string') : []
    const isActive = typeof payload.is_active === 'boolean' ? payload.is_active : true
    const priority = typeof payload.priority === 'number' ? payload.priority : 0
    const pageParams = payload.page_params && typeof payload.page_params === 'object' ? payload.page_params : null

    if (!pagePath) {
      return NextResponse.json({ error: '页面路径不能为空' }, { status: 400 })
    }

    if (!pageUrl) {
      return NextResponse.json({ error: '页面URL不能为空' }, { status: 400 })
    }

    if (!title) {
      return NextResponse.json({ error: '标题不能为空' }, { status: 400 })
    }

    const supabase = await createServiceClient()

    const insertPayload: DynamicPageSeoInsert = {
      page_path: pagePath,
      page_url: pageUrl,
      page_params: pageParams,
      title,
      description,
      h1_text: h1Text,
      seo_content: seoContent,
      meta_keywords: metaKeywords.length > 0 ? metaKeywords : null,
      is_active: isActive,
      priority,
      created_by_admin_id: adminUser.id,
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).from('dynamic_page_seo').insert(insertPayload).select().single()

    if (error) {
      console.error('创建动态页面SEO配置失败:', error)
      if (error.code === '23505') {
        // Unique constraint violation
        return NextResponse.json({ error: '该URL的SEO配置已存在' }, { status: 400 })
      }
      return NextResponse.json({ error: '创建配置失败', details: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: data as DynamicPageSeoRow,
    })
  } catch (error) {
    console.error('创建动态页面SEO配置失败:', error)
    return NextResponse.json(
      {
        error: '创建配置失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    )
  }
}
