import { NextRequest, NextResponse } from 'next/server'
import { validateAdminSession } from '@/lib/admin-auth'
import { createClient as createSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/chat/sessions
 * 获取聊天会话列表
 */
export async function GET() {
  try {
    const adminUser = await validateAdminSession()
    if (!adminUser) {
      return NextResponse.json({ success: false, error: '未授权' }, { status: 401 })
    }

    const supabase = await createSupabaseClient()
    const { data: sessions, error } = await (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from('admin_chat_sessions') as any)
        .select('*')
        .eq('admin_user_id', adminUser.id)
        .order('updated_at', { ascending: false })
        .limit(100)
    )

    if (error) {
      console.error('[Chat Sessions] 数据库查询错误:', {
        error: error,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorCode: (error as { code?: string })?.code,
        errorDetails: (error as { details?: string })?.details,
        adminUserId: adminUser.id,
      })
      throw error
    }

    return NextResponse.json({ success: true, data: sessions || [] })
  } catch (error) {
    console.error('获取聊天会话失败:', error)
    const errorMessage = error instanceof Error ? error.message : '未知错误'
    const errorDetails = error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name,
    } : String(error)
    
    // 尝试获取 adminUser，如果失败则为 undefined
    let adminUserId: string | undefined
    try {
      const adminUser = await validateAdminSession()
      adminUserId = adminUser?.id
    } catch {
      // 忽略认证错误
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        debug: {
          errorDetails,
          adminUserId,
        },
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/chat/sessions
 * 创建新的聊天会话
 */
export async function POST(request: NextRequest) {
  try {
    const adminUser = await validateAdminSession()
    if (!adminUser) {
      return NextResponse.json({ success: false, error: '未授权' }, { status: 401 })
    }

    const body = await request.json()
    const { title } = body

    const supabase = await createSupabaseClient()
    const { data: session, error } = await (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from('admin_chat_sessions') as any)
        .insert({
          admin_user_id: adminUser.id,
          title: title || '新对话',
        })
        .select()
        .single()
    )

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, data: session })
  } catch (error) {
    console.error('创建聊天会话失败:', error)
    const errorMessage = error instanceof Error ? error.message : '未知错误'
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/chat/sessions/[id]
 * 删除聊天会话
 */
export async function DELETE(request: NextRequest) {
  try {
    const adminUser = await validateAdminSession()
    if (!adminUser) {
      return NextResponse.json({ success: false, error: '未授权' }, { status: 401 })
    }

    const url = new URL(request.url)
    const sessionId = url.searchParams.get('id')

    if (!sessionId) {
      return NextResponse.json({ success: false, error: '缺少会话ID' }, { status: 400 })
    }

    const supabase = await createSupabaseClient()
    const { error } = await (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from('admin_chat_sessions') as any)
        .delete()
        .eq('id', sessionId)
        .eq('admin_user_id', adminUser.id) // 确保只能删除自己的会话
    )

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('删除聊天会话失败:', error)
    const errorMessage = error instanceof Error ? error.message : '未知错误'
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

