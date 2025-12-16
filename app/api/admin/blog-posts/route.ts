import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { cookies } from 'next/headers'

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

export async function GET() {
  try {
    const supabase = await createServiceClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('blog_posts')
      .select('*')
      .order('published_at', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('获取博客文章失败:', error)
      return NextResponse.json({ error: '获取博客文章失败', details: error.message }, { status: 500 })
    }

    return NextResponse.json({ blogPosts: data || [] })
  } catch (err) {
    console.error('获取博客文章异常:', err)
    return NextResponse.json(
      { error: '获取博客文章异常', details: err instanceof Error ? err.message : '未知错误' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const auth = await verifyAdmin()
    if (!auth.valid) {
      return NextResponse.json({ error: auth.error }, { status: 401 })
    }

    const body = await request.json()
    const { slug, title, description, h1, content, published_at, is_published, related_posts, seo_keywords } = body

    if (!slug || !title || !description || !h1 || !content) {
      return NextResponse.json({ error: '缺少必需字段' }, { status: 400 })
    }

    const supabase = await createServiceClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('blog_posts')
      .insert({
        slug,
        title,
        description,
        h1,
        content,
        published_at: published_at || null,
        is_published: is_published !== false,
        related_posts: related_posts || [],
        seo_keywords: seo_keywords || [],
        created_by_admin_id: auth.adminUserId,
      })
      .select()
      .single()

    if (error) {
      console.error('创建博客文章失败:', error)
      return NextResponse.json({ error: '创建博客文章失败', details: error.message }, { status: 500 })
    }

    return NextResponse.json({ blogPost: data })
  } catch (err) {
    console.error('创建博客文章异常:', err)
    return NextResponse.json(
      { error: '创建博客文章异常', details: err instanceof Error ? err.message : '未知错误' },
      { status: 500 }
    )
  }
}

