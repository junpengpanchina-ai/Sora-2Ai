import { NextResponse } from 'next/server'
import { randomUUID, createHash } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic'
export const revalidate = 0

// 🔥 延长会话时间到 7 天，避免批量生成过程中会话过期
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7 // 7天（168小时）

// Rate limiting: 5 attempts per 15 minutes per IP
const RATE_LIMIT_MAX_ATTEMPTS = 5
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000 // 15 minutes

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export async function POST(request: Request) {
  // #region agent log
  const requestIp = getClientIp(request)
  const userAgent = request.headers.get('user-agent') || 'unknown'
  fetch('http://127.0.0.1:7242/ingest/ef411af9-a357-4528-93a0-017b8708eb6e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/auth/admin-login/route.ts:13',message:'Admin login attempt - ENTRY',data:{requestIp,userAgent,timestamp:new Date().toISOString()},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  
  // SECURITY FIX: Rate limiting to prevent brute force attacks
  const rateLimitResult = checkRateLimit(requestIp, {
    maxRequests: RATE_LIMIT_MAX_ATTEMPTS,
    windowMs: RATE_LIMIT_WINDOW_MS,
    keyPrefix: 'admin-login',
  })
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/ef411af9-a357-4528-93a0-017b8708eb6e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/auth/admin-login/route.ts:23',message:'Admin login - Rate limit check',data:{requestIp,allowed:rateLimitResult.allowed,remaining:rateLimitResult.remaining,resetAt:new Date(rateLimitResult.resetAt).toISOString()},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  
  if (!rateLimitResult.allowed) {
    const retryAfter = Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)
    return NextResponse.json(
      { 
        error: '请求过于频繁，请稍后再试',
        retryAfter,
      },
      { 
        status: 429,
        headers: {
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': RATE_LIMIT_MAX_ATTEMPTS.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimitResult.resetAt.toString(),
        },
      }
    )
  }
  
  try {
    const { username, password } = (await request.json()) as {
      username?: string
      password?: string
    }
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/ef411af9-a357-4528-93a0-017b8708eb6e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/auth/admin-login/route.ts:50',message:'Admin login attempt - CREDENTIALS RECEIVED',data:{username:username?.substring(0,10)+'...',hasPassword:!!password,requestIp},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    if (!username || !password) {
      return NextResponse.json({ error: '用户名和密码不能为空' }, { status: 400 })
    }

    const token = randomUUID() + randomUUID()
    const tokenHash = hashToken(token)
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString()

    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc('admin_create_session', {
      p_username: username.trim(),
      p_password: password,
      p_token_hash: tokenHash,
      p_expires_at: expiresAt,
    })

    if (error || !data) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/ef411af9-a357-4528-93a0-017b8708eb6e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/auth/admin-login/route.ts:67',message:'Admin login attempt - FAILED',data:{username:username?.substring(0,10)+'...',requestIp,error:error?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      return NextResponse.json(
        { error: '用户名或密码错误' },
        { 
          status: 401,
          headers: {
            'X-RateLimit-Limit': RATE_LIMIT_MAX_ATTEMPTS.toString(),
            'X-RateLimit-Remaining': (rateLimitResult.remaining - 1).toString(),
            'X-RateLimit-Reset': rateLimitResult.resetAt.toString(),
          },
        }
      )
    }
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/ef411af9-a357-4528-93a0-017b8708eb6e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/auth/admin-login/route.ts:82',message:'Admin login attempt - SUCCESS',data:{username:username?.substring(0,10)+'...',requestIp},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

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


