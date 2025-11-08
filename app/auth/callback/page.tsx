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
        
        // Exchange code for session
        // createBrowserClient automatically reads code_verifier from localStorage
        console.log('Exchanging code for session...')
        const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        
        console.log('Exchange result:', { 
          hasSession: !!sessionData?.session,
          hasUser: !!sessionData?.user,
          error: exchangeError?.message,
          errorCode: exchangeError?.status,
          errorDetails: exchangeError
        })
        
        if (exchangeError) {
          console.error('Exchange code error:', exchangeError)
          router.push(`/login?error=${encodeURIComponent(exchangeError.message)}`)
          return
        }

        if (!sessionData.session) {
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

