import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase 环境变量缺失', {
      hasUrl: Boolean(supabaseUrl),
      hasAnonKey: Boolean(supabaseAnonKey),
    })
    return supabaseResponse
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as CookieOptions | undefined)
          )
        },
      },
    })

    // Refresh user session
    const { error: getUserError } = await supabase.auth.getUser()
    
    // 如果刷新令牌无效或会话丢失，清除相关的认证 cookie
    if (getUserError) {
      // 检查是否是会话相关的正常错误（用户未登录或会话过期）
      const errorMessage = getUserError.message || ''
      const errorName = getUserError.name || getUserError.constructor?.name || ''
      const errorCode = getUserError.code
      const errorString = String(getUserError)
      
      // 检查是否是认证错误（通过 __isAuthError 属性或错误类型）
      const isAuthError = 
        (getUserError as unknown as { __isAuthError?: boolean }).__isAuthError === true || 
        errorName.includes('Auth') ||
        errorString.includes('Auth')
      
      // 检查是否是会话相关的正常错误（这些是预期的，不应该记录为错误）
      const isSessionError = isAuthError && (
        // 刷新令牌错误
        errorMessage.includes('refresh_token_not_found') ||
        errorMessage.includes('Invalid Refresh Token') ||
        errorCode === 'refresh_token_not_found' ||
        // 会话丢失错误
        errorMessage.includes('Auth 会话丢失') ||
        errorMessage.includes('Auth session missing') ||
        errorMessage.includes('session missing') ||
        errorName.includes('AuthSessionMissingError') ||
        errorName.includes('SessionMissing') ||
        // 检查错误类型名称（可能在不同语言环境下）
        errorString.includes('AuthSessionMissingError') ||
        errorString.includes('SessionMissing')
      )
      
      if (isSessionError) {
        // 清除所有 Supabase 认证相关的 cookie
        // Supabase SSR 库使用的 cookie 格式：sb-<project-ref>-auth-token
        const allCookies = request.cookies.getAll()
        const authCookieNames = new Set<string>()
        
        // 查找所有 Supabase 相关的 cookie
        allCookies.forEach(({ name }) => {
          // 匹配格式：sb-<project-ref>-auth-token 或 sb-<project-ref>-auth-token-code-verifier
          if (name.startsWith('sb-') && name.includes('auth-token')) {
            authCookieNames.add(name)
          }
        })
        
        // 清除这些 cookie
        authCookieNames.forEach((cookieName) => {
          supabaseResponse.cookies.delete(cookieName)
        })
        
        // 不记录为错误，因为这是正常情况（用户可能未登录、已登出或会话过期）
        // 静默处理，让用户继续访问公开页面
      } else {
        // 其他类型的错误才记录日志
        console.error('Supabase 中间件更新会话失败', getUserError)
      }
    }
  } catch (error) {
    // 捕获意外的错误
    console.error('Supabase 中间件异常', error)
  }

  return supabaseResponse
}
