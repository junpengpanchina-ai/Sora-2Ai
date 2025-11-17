import { NextResponse } from 'next/server'
import { randomUUID, createHash } from 'crypto'
import { createClient } from '@/lib/supabase/server'

const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 // 24小时

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export async function POST(request: Request) {
  try {
    const { username, password } = (await request.json()) as {
      username?: string
      password?: string
    }

    if (!username || !password) {
      return NextResponse.json({ error: '用户名和密码不能为空' }, { status: 400 })
    }

    const token = randomUUID() + randomUUID()
    const tokenHash = hashToken(token)
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString()

    const supabase = await createClient()
    const { data, error } = await supabase.rpc('admin_create_session', {
      p_username: username.trim(),
      p_password: password,
      p_token_hash: tokenHash,
      p_expires_at: expiresAt,
    })

    if (error || !data) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 })
    }

    const response = NextResponse.json({ success: true })
    response.cookies.set('admin_session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_DURATION_MS / 1000,
    })

    return response
  } catch (error) {
    console.error('管理员登录接口异常:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '登录失败，请稍后重试' },
      { status: 500 }
    )
  }
}


