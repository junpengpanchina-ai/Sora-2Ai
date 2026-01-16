// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
'use client'

import { createClient } from '@/lib/supabase/client'
import { logError } from '@/lib/logger'
import { clearPostLoginRedirect, getPostLoginRedirect } from '@/lib/auth/post-login-redirect'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import OAuthErrorLogger from '@/components/OAuthErrorLogger'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const isExecutingRef = useRef(false)

  useEffect(() => {
    const handleCallback = async () => {
      // Prevent duplicate execution
      if (isExecutingRef.current) {
        console.log('⚠️ Callback already executing, skipping...')
        return
      }
      isExecutingRef.current = true
      const code = searchParams.get('code')
      const errorParam = searchParams.get('error')
      const errorDescription = searchParams.get('error_description')

      if (errorParam) {
        console.error('OAuth callback error:', errorParam, errorDescription)
        router.push(`/login?error=${encodeURIComponent(errorDescription || errorParam)}`)
        return
      }

      if (!code) {
        console.error('No code parameter in callback')
        router.push('/login?error=no_code')
        return
      }

      try {
        const supabase = createClient()
        
        // For email magic link login, we don't need PKCE code_verifier checks
        // Only check for OAuth if needed (when Google login is enabled)
        // This significantly speeds up email login

        // Exchange code for session
        // For email magic link, we can directly exchange without waiting
        // For OAuth, Supabase with detectSessionInUrl: true may auto-detect, but we'll try direct exchange first for speed
        let sessionData = null
        let exchangeError = null
        
        // Try to get session immediately (for email magic link, this usually works)
        const { data: { session: quickSession } } = await supabase.auth.getSession()
        if (quickSession && quickSession.user) {
          console.log('✅ Session detected immediately')
          sessionData = { session: quickSession, user: quickSession.user }
        } else {
          // If not found, try one quick wait (100ms) for OAuth auto-detection
          await new Promise(resolve => setTimeout(resolve, 100))
          const { data: { session: autoSession } } = await supabase.auth.getSession()
          if (autoSession && autoSession.user) {
            console.log('✅ Session detected after short wait')
            sessionData = { session: autoSession, user: autoSession.user }
          }
        }
        
        // If still no session, try manual exchange (for OAuth PKCE or email magic link)
        if (!sessionData?.session) {
          console.log('⚠️ Session not detected automatically, trying manual exchange...')
          
          // 🔍 记录 exchange 请求信息
          console.log('🔍 [Auth Exchange] 开始交换 code...')
          console.log('📋 [Auth Exchange] Code 信息:', {
            codeLength: code?.length || 0,
            codePreview: code ? code.substring(0, 30) + '...' : 'none',
          })
          
          // 记录 Supabase 项目 URL（用于识别请求）
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'unknown'
          console.log('📋 [OAuth Exchange] Supabase URL:', supabaseUrl)
          console.log('📋 [OAuth Exchange] 预期请求 URL:', `${supabaseUrl}/auth/v1/token?grant_type=pkce`)
          
          // Add timeout to prevent hanging (5 seconds max)
          const exchangeStartTime = Date.now()
          const exchangePromise = supabase.auth.exchangeCodeForSession(code)
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Exchange timeout after 5 seconds')), 5000)
          )
          
          let exchangeResult
          try {
            exchangeResult = await Promise.race([exchangePromise, timeoutPromise])
          } catch (timeoutError) {
            console.error('❌ Exchange timeout:', timeoutError)
            // Try to redirect to login with timeout error
            router.push('/login?error=exchange_timeout')
            return
          }
          
          const exchangeDuration = Date.now() - exchangeStartTime
          
          sessionData = exchangeResult.data
          exchangeError = exchangeResult.error
          
          // 🔍 详细记录 exchange 响应
          console.log('📊 [OAuth Exchange] 响应信息:', {
            duration: `${exchangeDuration}ms`,
            hasSession: !!sessionData?.session,
            hasError: !!exchangeError,
            errorStatus: exchangeError?.status,
            errorMessage: exchangeError?.message,
            errorName: exchangeError?.name,
          })
          
          if (exchangeError) {
            // 🔍 提取完整的错误详情
            const errorDetails = {
              message: exchangeError.message,
              status: exchangeError.status,
              name: exchangeError.name,
              // 尝试提取 error_description（如果存在）
              errorDescription: exchangeError.message?.match(/error_description[:\s]+([^,}]+)/i)?.[1] || null,
              // 尝试提取 error code（如果存在）
              errorCode: exchangeError.message?.match(/error[:\s]+([^,}]+)/i)?.[1] || null,
              // 完整错误对象（如果可序列化）
              fullError: exchangeError,
            }
            
            console.error('❌ [OAuth Exchange] 交换失败 - 详细错误信息:')
            console.error('   Status Code:', errorDetails.status)
            console.error('   Error Name:', errorDetails.name)
            console.error('   Error Message:', errorDetails.message)
            console.error('   Error Code:', errorDetails.errorCode || 'N/A')
            console.error('   Error Description:', errorDetails.errorDescription || 'N/A')
            console.error('   完整错误对象:', errorDetails.fullError)
            
            // 🔍 根据错误类型提供诊断建议
            console.error('\n🔍 [OAuth Exchange] 错误诊断建议:')
            if (errorDetails.status === 400) {
              if (errorDetails.message?.includes('invalid_client')) {
                console.error('   ⚠️  可能原因: Google Client ID/Secret 配置错误')
                console.error('   ✅ 检查: Supabase Dashboard → Authentication → Providers → Google')
                console.error('   ✅ 检查: Google Cloud Console → OAuth client credentials')
              } else if (errorDetails.message?.includes('redirect_uri') || errorDetails.message?.includes('redirect')) {
                console.error('   ⚠️  可能原因: 重定向 URL 不匹配')
                console.error('   ✅ 检查: Google Cloud Console → Authorized redirect URIs')
                console.error('   ✅ 必须包含: https://<project-ref>.supabase.co/auth/v1/callback')
                console.error('   ✅ 检查: Supabase → Authentication → URL Configuration')
              } else if (errorDetails.message?.includes('invalid_grant') || errorDetails.message?.includes('already redeemed')) {
                console.error('   ⚠️  可能原因: Code 已过期或被重复使用')
                console.error('   ✅ 检查: 是否多次执行 exchangeCodeForSession')
                console.error('   ✅ 检查: middleware 是否导致重复回调')
              } else if (errorDetails.message?.includes('Unable to exchange external code')) {
                console.error('   ⚠️  可能原因: Supabase 无法与 Google 交换 token')
                console.error('   ✅ 检查: Supabase Dashboard → Logs Explorer → 搜索 "oauth" / "google"')
                console.error('   ✅ 检查: Google Cloud Console → OAuth client 状态')
              }
            } else if (errorDetails.status === 500) {
              console.error('   ⚠️  可能原因: Supabase 服务器端错误')
              console.error('   ✅ 检查: Supabase Dashboard → Logs Explorer')
              console.error('   ✅ 检查: Network 标签中的完整响应（可能包含更详细的错误）')
            }
            
            // Log to server (visible in Vercel Dashboard)
            await logError(
              new Error(`Auth token exchange failed: ${exchangeError.message}`),
              {
                code: code ? code.substring(0, 20) + '...' : 'none',
                codeLength: code?.length || 0,
                ...errorDetails,
              }
            )
            
            // Provide helpful error messages based on error type
            let errorMsg = 'Login failed. Please try again.'
            
            if (exchangeError.status === 400) {
              if (
                exchangeError.message?.includes('code verifier') ||
                exchangeError.message?.includes('code_verifier')
              ) {
                errorMsg =
                  'Login failed: missing PKCE verifier. Please clear site data (cookies/storage) and try again.'
              } else if (
                exchangeError.message?.includes('Unable to exchange external code') ||
                exchangeError.message?.includes('exchange external code')
              ) {
                // This usually means code expired or code_verifier mismatch
                errorMsg =
                  'Login failed: The verification code has expired or doesn\'t match. This usually happens if you waited too long or tried to login multiple times. Please clear your browser storage and try again.'
              } else if (exchangeError.message?.includes('expired') || 
                         exchangeError.message?.includes('invalid')) {
                errorMsg = 'Login failed: the verification code is expired or invalid. Please sign in again.'
              } else {
                errorMsg =
                  'Login failed: code exchange failed. Please clear site data (cookies/storage) and try again.'
              }
            } else {
              errorMsg = exchangeError.message || 'Login failed: unknown error.'
            }
            
            // 🔥 防回归护栏 #2: 记录 OAuth 错误到日志系统
            const errorToLog = exchangeError.message || 'Unknown exchange error'
            try {
              await fetch('/api/log-oauth-error', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  error: errorToLog.substring(0, 200),
                  error_description: errorDetails.errorDescription || null,
                  error_code: errorDetails.errorCode || exchangeError.status?.toString() || null,
                  origin: typeof window !== 'undefined' ? window.location.origin : null,
                  pathname: '/auth/callback',
                  user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
                  timestamp: new Date().toISOString(),
                }),
              })
            } catch (logErr) {
              // 静默失败，不影响用户体验
              console.error('[OAuth Error Logger] Failed to log:', logErr)
            }
            
            router.push(`/login?error=${encodeURIComponent(errorMsg)}`)
            return
          }
        }
        
        console.log('Exchange result:', { 
          hasSession: !!sessionData?.session,
          hasUser: !!sessionData?.user,
          error: exchangeError?.message,
          errorCode: exchangeError?.status,
        })
        
        if (exchangeError) {
          console.error('Exchange code error:', exchangeError)
          router.push(`/login?error=${encodeURIComponent(exchangeError.message)}`)
          return
        }

        if (!sessionData?.session) {
          console.error('No session after code exchange')
          router.push('/login?error=no_session')
          return
        }

        // Get user information and save to users table
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          console.error('Get user error:', userError)
          // Redirect to intended page even if user fetch fails
          const intended = getPostLoginRedirect()
          clearPostLoginRedirect()
          router.replace(intended || '/')
          return
        }

        // Get Google user information from user_metadata
        const googleId = user.user_metadata?.provider_id || 
                         user.user_metadata?.sub || 
                         user.app_metadata?.provider_id ||
                         user.id
        
        const email = user.email || user.user_metadata?.email || ''
        const name = user.user_metadata?.full_name || 
                      user.user_metadata?.name || 
                      user.user_metadata?.display_name || ''
        const avatarUrl = user.user_metadata?.avatar_url || 
                         user.user_metadata?.picture || 
                         user.user_metadata?.avatar || ''

        // Check if user already exists
        const { data: existingUser, error: queryError } = await supabase
          .from('users')
          .select('id')
          .eq('google_id', googleId)
          .single()

        if (queryError && queryError.code !== 'PGRST116') {
          console.error('Query user error:', queryError)
        }

        if (!existingUser) {
          // Create new user record (use upsert to avoid duplicate-key issues)
          const { error: upsertError } = await supabase
            .from('users')
            .upsert(
              {
                id: user.id,
                google_id: googleId,
                email: email,
                name: name || null,
                avatar_url: avatarUrl || null,
                last_login_at: new Date().toISOString(),
              },
              {
                onConflict: 'google_id',
              }
            )

          if (upsertError) {
            console.error('Error creating user via upsert:', upsertError)
          } else {
            console.log('User created/updated successfully via upsert:', email)
            
            // Add welcome bonus for new users (30 credits = 3 videos) - async, don't block login
            // Fire and forget - don't wait for response to speed up login
            fetch('/api/auth/welcome-bonus', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
            }).then(response => {
              if (response.ok) {
                return response.json()
              }
              return null
            }).then(bonusResult => {
              if (bonusResult?.success && !bonusResult.alreadyGranted) {
                console.log('✅ Welcome bonus (30 credits) added for new user:', email)
              }
            }).catch(() => {
              // Silently fail - don't log to avoid console spam
              // Welcome bonus will be retried on next login if needed
            })
          }
        } else {
          // Update last login time
          const { error: updateError } = await supabase
            .from('users')
            .update({ 
              last_login_at: new Date().toISOString(),
              name: name || undefined,
              avatar_url: avatarUrl || undefined,
            })
            .eq('id', existingUser.id)

          if (updateError) {
            console.error('Error updating user:', updateError)
          } else {
            console.log('User updated successfully:', email)
          }
        }

        // Redirect back to the page user wanted before login
        const intended = getPostLoginRedirect()
        clearPostLoginRedirect()
        router.replace(intended || '/')
        router.refresh()
      } catch (err) {
        console.error('Callback error:', err)
        setError(err instanceof Error ? err.message : 'unknown_error')
        router.push(`/login?error=${encodeURIComponent(err instanceof Error ? err.message : 'callback_error')}`)
      } finally {
        setLoading(false)
        isExecutingRef.current = false
      }
    }

    handleCallback()
    
    // Cleanup function to prevent memory leaks
    return () => {
      isExecutingRef.current = false
    }
  }, [router, searchParams])

  if (loading) {
    return (
      <>
        <OAuthErrorLogger error={null} pathname="/auth/callback" />
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Processing login...</p>
          </div>
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <OAuthErrorLogger error={error} pathname="/auth/callback" />
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center text-red-600">
            <p>Login failed: {error}</p>
            <button
              onClick={() => router.push('/login')}
              className="mt-4 rounded bg-blue-600 px-4 py-2 text-white"
            >
              Back to Login
            </button>
          </div>
        </div>
      </>
    )
  }

  return <OAuthErrorLogger error={null} pathname="/auth/callback" />
}

