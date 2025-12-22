import { NextResponse } from 'next/server'
import { validateAdminSession } from '@/lib/admin-auth'
import { createHash } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// 🔥 延长会话时间到 7 天，避免批量生成过程中会话过期
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7 // 7天（168小时）

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

/**
 * POST /api/auth/admin-refresh-session
 * 刷新管理员会话，延长过期时间
 */
export async function POST() {
  try {
    const adminUser = await validateAdminSession()
    
    if (!adminUser) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const cookieStore = await cookies()
    const token = cookieStore.get('admin_session_token')?.value

    if (!token) {
      return NextResponse.json({ error: '未找到会话令牌' }, { status: 401 })
    }

    const supabase = await createClient()
    const tokenHash = hashToken(token)
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)

    // 更新会话过期时间
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).rpc('admin_extend_session', {
      p_token_hash: tokenHash,
      p_expires_at: expiresAt.toISOString(),
    })

    if (error) {
      console.error('[admin-refresh-session] 延长会话失败:', error)
      return NextResponse.json({ error: '刷新会话失败' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      expiresAt: expiresAt.toISOString(),
    })
  } catch (error) {
    console.error('[admin-refresh-session] 异常:', error)
    return NextResponse.json(
      { error: '刷新会话失败' },
      { status: 500 }
    )
  }
}

