// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const handleCallback = async () => {
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
        
        console.log('Callback received:', { 
          code: code ? code.substring(0, 20) + '...' : 'none',
          codeLength: code?.length || 0
        })
        
        // Check localStorage for PKCE data
        const allStorageKeys = Object.keys(localStorage)
        const supabaseKeys = allStorageKeys.filter(key => key.includes('supabase'))
        console.log('Supabase storage keys:', supabaseKeys)
        
        // Check for code_verifier in localStorage
        const codeVerifierKey = supabaseKeys.find(key => key.includes('code-verifier') || key.includes('verifier'))
        if (codeVerifierKey) {
          console.log('Found code_verifier key:', codeVerifierKey)
        } else {
          console.warn('No code_verifier found in localStorage. This may cause the exchange to fail.')
          console.warn('Possible causes:')
          console.warn('1. Browser cleared localStorage')
          console.warn('2. Using incognito/private mode')
          console.warn('3. Redirect URL mismatch')
          console.warn('4. Cross-origin redirect issue')
        }
        
        // Exchange code for session
        // With detectSessionInUrl: true, Supabase automatically handles code exchange
        // We need to wait for it to complete, then check the session
        console.log('Waiting for Supabase automatic session detection...')
        
        // Wait for Supabase to process the code (it happens automatically with detectSessionInUrl: true)
        // Try multiple times with increasing delays to ensure automatic detection completes
        let sessionData = null
        let exchangeError = null
        let attempts = 0
        const maxAttempts = 3
        
        while (attempts < maxAttempts && !sessionData?.session) {
          // Wait progressively longer on each attempt
          await new Promise(resolve => setTimeout(resolve, 300 * (attempts + 1)))
          
          const { data: { session: existingSession } } = await supabase.auth.getSession()
          
          if (existingSession && existingSession.user) {
            console.log(`✅ Session created by automatic detection (attempt ${attempts + 1})`)
            sessionData = { session: existingSession, user: existingSession.user }
            break
          }
          
          attempts++
          if (attempts < maxAttempts) {
            console.log(`⏳ Waiting for session... (attempt ${attempts}/${maxAttempts})`)
          }
        }
        
        // If automatic detection didn't work after multiple attempts, try manual exchange
        if (!sessionData?.session) {
          // Check if code_verifier exists before attempting manual exchange
          const hasCodeVerifier = supabaseKeys.some(key => 
            key.includes('code-verifier') || key.includes('verifier')
          )
          
          if (!hasCodeVerifier) {
            console.error('❌ No code_verifier found in localStorage')
            const errorMsg = '登录失败：PKCE 验证码丢失。请清除浏览器缓存后重试，或确保未使用隐私模式。'
            router.push(`/login?error=${encodeURIComponent(errorMsg)}`)
            return
          }
          
          console.log('⚠️ Automatic detection failed after multiple attempts, trying manual exchange...')
          const exchangeResult = await supabase.auth.exchangeCodeForSession(code)
          sessionData = exchangeResult.data
          exchangeError = exchangeResult.error
          
          if (exchangeError) {
            console.error('❌ Manual exchange error:', {
              message: exchangeError.message,
              status: exchangeError.status,
              name: exchangeError.name,
            })
            
            // Provide helpful error messages based on error type
            let errorMsg = '登录失败：请重试。'
            
            if (exchangeError.status === 400) {
              if (exchangeError.message?.includes('code verifier') || 
                  exchangeError.message?.includes('code_verifier')) {
                errorMsg = '登录失败：PKCE 验证码丢失。请清除浏览器缓存后重试。'
              } else if (exchangeError.message?.includes('expired') || 
                         exchangeError.message?.includes('invalid')) {
                errorMsg = '登录失败：验证码已过期或无效。请重新登录。'
              } else {
                errorMsg = '登录失败：验证码交换失败。请清除浏览器缓存后重新登录。'
              }
            } else {
              errorMsg = exchangeError.message || '登录失败：未知错误。'
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
          // Redirect to home even if user fetch fails
          router.push('/')
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
          // Create new user record
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              google_id: googleId,
              email: email,
              name: name || null,
              avatar_url: avatarUrl || null,
              last_login_at: new Date().toISOString(),
            })

          if (insertError) {
            console.error('Error creating user:', insertError)
          } else {
            console.log('User created successfully:', email)
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

        // Redirect to home page
        router.push('/')
        router.refresh()
      } catch (err) {
        console.error('Callback error:', err)
        setError(err instanceof Error ? err.message : 'unknown_error')
        router.push(`/login?error=${encodeURIComponent(err instanceof Error ? err.message : 'callback_error')}`)
      } finally {
        setLoading(false)
      }
    }

    handleCallback()
  }, [router, searchParams])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Processing login...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
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
    )
  }

  return null
}

