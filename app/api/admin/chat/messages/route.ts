import { NextRequest, NextResponse } from 'next/server'
import { validateAdminSession } from '@/lib/admin-auth'
import { createClient as createSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/chat/messages?sessionId=xxx
 * 获取指定会话的消息列表
 */
export async function GET(request: NextRequest) {
  try {
    const adminUser = await validateAdminSession()
    if (!adminUser) {
      return NextResponse.json({ success: false, error: '未授权' }, { status: 401 })
    }

    const url = new URL(request.url)
    const sessionId = url.searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json({ success: false, error: '缺少会话ID' }, { status: 400 })
    }

    const supabase = createSupabaseClient()
    
    // 验证会话属于当前管理员
    const { data: session, error: sessionError } = await supabase
      .from('admin_chat_sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('admin_user_id', adminUser.id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ success: false, error: '会话不存在或无权限' }, { status: 403 })
    }

    // 获取消息列表
    const { data: messages, error } = await supabase
      .from('admin_chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, data: messages })
  } catch (error) {
    console.error('获取聊天消息失败:', error)
    const errorMessage = error instanceof Error ? error.message : '未知错误'
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

