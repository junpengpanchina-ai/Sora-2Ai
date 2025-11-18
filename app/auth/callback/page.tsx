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
        // With detectSessionInUrl: true, Supabase should automatically handle this
        // But we'll also try manual exchange as fallback
        console.log('Exchanging code for session...')
        
        // Wait a bit for Supabase to potentially auto-detect the session
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // First, try to get the session (Supabase may have already handled it)
        let sessionData = null
        let exchangeError = null
        
        const { data: { session: existingSession }, error: sessionError } = await supabase.auth.getSession()
        if (existingSession) {
          console.log('Session already exists from automatic detection')
          sessionData = { session: existingSession, user: existingSession.user }
        } else if (sessionError) {
          console.log('Session check error (will try manual exchange):', sessionError.message)
        }
        
        // If no session found, try manual exchange
        if (!sessionData?.session) {
          console.log('Attempting manual code exchange...')
          const exchangeResult = await supabase.auth.exchangeCodeForSession(code)
          sessionData = exchangeResult.data
          exchangeError = exchangeResult.error
          
          if (exchangeError) {
            console.error('Manual exchange error:', {
              message: exchangeError.message,
              status: exchangeError.status,
              name: exchangeError.name,
            })
            
            // If error is about missing code_verifier, provide helpful message
            if (exchangeError.message?.includes('code verifier') || exchangeError.message?.includes('code_verifier')) {
              const errorMsg = '登录失败：PKCE 验证码丢失。请清除浏览器缓存后重试，或确保未使用隐私模式。'
              router.push(`/login?error=${encodeURIComponent(errorMsg)}`)
              return
            }
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

