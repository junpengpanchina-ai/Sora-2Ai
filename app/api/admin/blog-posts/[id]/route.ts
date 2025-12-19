import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { cookies } from 'next/headers'

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic'
export const revalidate = 0

async function verifyAdmin() {
  const cookieStore = await cookies()
  const adminToken = cookieStore.get('admin_token')?.value

  if (!adminToken) {
    return { valid: false, error: '未授权' }
  }

  const supabase = await createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: session, error } = await (supabase as any)
    .from('admin_sessions')
    .select('admin_user_id, expires_at')
    .eq('token_hash', adminToken)
    .single()

  if (error || !session || new Date(session.expires_at) < new Date()) {
    return { valid: false, error: '会话已过期' }
  }

  return { valid: true, adminUserId: session.admin_user_id }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await verifyAdmin()
    if (!auth.valid) {
      return NextResponse.json({ error: auth.error }, { status: 401 })
    }

    const body = await request.json()
    const { slug, title, description, h1, content, published_at, is_published, related_posts, seo_keywords } = body

    const supabase = await createServiceClient()
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (slug !== undefined) updateData.slug = slug
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (h1 !== undefined) updateData.h1 = h1
    if (content !== undefined) updateData.content = content
    if (published_at !== undefined) updateData.published_at = published_at || null
    if (is_published !== undefined) updateData.is_published = is_published
    if (related_posts !== undefined) updateData.related_posts = related_posts || []
    if (seo_keywords !== undefined) updateData.seo_keywords = seo_keywords || []

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('blog_posts')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('更新博客文章失败:', error)
      return NextResponse.json({ error: '更新博客文章失败', details: error.message }, { status: 500 })
    }

    return NextResponse.json({ blogPost: data })
  } catch (err) {
    console.error('更新博客文章异常:', err)
    return NextResponse.json(
      { error: '更新博客文章异常', details: err instanceof Error ? err.message : '未知错误' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await verifyAdmin()
    if (!auth.valid) {
      return NextResponse.json({ error: auth.error }, { status: 401 })
    }

    const supabase = await createServiceClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('blog_posts').delete().eq('id', params.id)

    if (error) {
      console.error('删除博客文章失败:', error)
      return NextResponse.json({ error: '删除博客文章失败', details: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('删除博客文章异常:', err)
    return NextResponse.json(
      { error: '删除博客文章异常', details: err instanceof Error ? err.message : '未知错误' },
      { status: 500 }
    )
  }
}

