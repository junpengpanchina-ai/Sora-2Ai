'use client'

import { createClient } from '@/lib/supabase/client'
import { logError } from '@/lib/logger'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LoginButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      // Use full URL to ensure Supabase can properly handle PKCE
      // Must match exactly with the callback URL
      const redirectTo = `${window.location.origin}/auth/callback`

      console.log('Initiating OAuth login...', { redirectTo })

      // Check localStorage availability before starting OAuth
      try {
        const testKey = '__oauth_test__'
        localStorage.setItem(testKey, 'test')
        localStorage.removeItem(testKey)
        console.log('✅ localStorage is available')
      } catch (e) {
        console.error('❌ localStorage is not available:', e)
        router.push('/login?error=' + encodeURIComponent('浏览器不支持本地存储，请检查浏览器设置或使用正常浏览模式（非无痕模式）'))
        setLoading(false)
        return
      }

      // Use skipBrowserRedirect: false to let Supabase handle the redirect
      // Supabase will save the code_verifier internally before redirecting
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: false,
          queryParams: {
            prompt: 'consent',
            access_type: 'offline',
          },
        },
      })

      if (error) {
        console.error('OAuth error:', error)
        router.push(`/login?error=${encodeURIComponent(error.message)}`)
        setLoading(false)
        return
      }

      console.log('OAuth URL generated:', data?.url ? 'Yes' : 'No')
      console.log('localStorage keys after signInWithOAuth:', Object.keys(localStorage))
      console.log('sessionStorage keys after signInWithOAuth:', Object.keys(sessionStorage))

      if (data?.url) {
        console.log('Supabase provided OAuth URL, ensuring redirect now...', {
          url: data.url,
        })
        window.location.assign(data.url)
        return
      }

      console.log('Supabase handled the redirect automatically.')
    } catch (err) {
      console.error('Login error:', err)
      
      // Log to server (visible in Vercel Dashboard)
      await logError(
        err instanceof Error ? err : new Error(String(err)),
        {
          redirectTo: `${window.location.origin}/auth/callback`,
          step: 'login_initiation',
        }
      )
      
      router.push(`/login?error=${encodeURIComponent(err instanceof Error ? err.message : 'unknown_error')}`)
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleLogin}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 rounded-lg bg-white px-4 py-3 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 transition-colors hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:hover:bg-gray-600"
    >
      {loading ? (
        <>
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Logging in...</span>
        </>
      ) : (
        <>
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Sign in with Google
        </>
      )}
    </button>
  )
}

