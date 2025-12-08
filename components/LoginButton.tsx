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

      const containsPkceIndicators = (value: string) => {
        return (
          value.includes('code_verifier') ||
          value.includes('codeVerifier') ||
          value.includes('oauthCodeVerifier') ||
          value.includes('pkce')
        )
      }

      const detectPkceInStorage = (storage: Storage) => {
        const keys = Object.keys(storage)
        const supabaseKeys = keys.filter(key => key.includes('supabase') || key.startsWith('sb-'))

        for (const key of supabaseKeys) {
          const normalizedKey = key.toLowerCase()
          if (
            normalizedKey.includes('code_verifier') ||
            normalizedKey.includes('code-verifier') ||
            normalizedKey.includes('oauth-code-verifier')
          ) {
            return { detected: true, key, source: 'key', supabaseKeys, keys }
          }

          try {
            const rawValue = storage.getItem(key)
            if (!rawValue) {
              continue
            }

            if (containsPkceIndicators(rawValue)) {
              return { detected: true, key, source: 'value', supabaseKeys, keys }
            }

            const parsed = JSON.parse(rawValue)
            if (
              parsed?.code_verifier ||
              parsed?.codeVerifier ||
              parsed?.oauthCodeVerifier ||
              parsed?.session?.codeVerifier ||
              parsed?.pkce
            ) {
              return { detected: true, key, source: 'parsed', supabaseKeys, keys }
            }
          } catch {
            // Ignore JSON parse errors and keep scanning other keys
          }
        }

        return { detected: false, key: null, source: null, supabaseKeys, keys }
      }

      const detectPkceData = () => {
        const localResult = detectPkceInStorage(localStorage)
        if (localResult.detected) {
          return { ...localResult, storage: 'localStorage' as const }
        }

        if (typeof sessionStorage !== 'undefined') {
          const sessionResult = detectPkceInStorage(sessionStorage)
          if (sessionResult.detected) {
            // Attempt to persist the detected PKCE data into localStorage for Supabase compatibility
            try {
              const value = sessionStorage.getItem(sessionResult.key || '')
              if (value) {
                localStorage.setItem(sessionResult.key || '', value)
              }
            } catch (err) {
              console.warn('Failed to copy PKCE data from sessionStorage to localStorage', {
                key: sessionResult.key,
                error: err,
              })
            }

            return { ...sessionResult, storage: 'sessionStorage' as const }
          }

          return {
            detected: false,
            key: null,
            source: null,
            storage: 'sessionStorage' as const,
            supabaseKeys: sessionResult.supabaseKeys,
            keys: sessionResult.keys,
            localKeys: localResult.keys,
            localSupabaseKeys: localResult.supabaseKeys,
          }
        }

        return { ...localResult, storage: 'localStorage' as const }
      }

      if (data?.url) {
        console.log('Supabase provided OAuth URL, waiting for PKCE data before redirect...', {
          url: data.url,
        })

        let attempts = 0
        const maxAttempts = 30 // 3s total
        let verifierDetected = false
        let detectionDetails:
          | ReturnType<typeof detectPkceData>
          | {
              detected: boolean
              key: string | null
              source: string | null
              storage: string
              supabaseKeys?: string[]
              keys?: string[]
              localKeys?: string[]
              localSupabaseKeys?: string[]
            } = {
          detected: false,
          key: null,
          source: null,
          storage: 'localStorage',
          supabaseKeys: [],
          keys: [],
        }

        while (attempts < maxAttempts && !verifierDetected) {
          await new Promise(resolve => setTimeout(resolve, 100))
          detectionDetails = detectPkceData()
          verifierDetected = detectionDetails.detected

          if (verifierDetected) {
            console.log('Detected PKCE data before redirect.', {
              attempts,
              storage: detectionDetails.storage,
              key: detectionDetails.key,
              source: detectionDetails.source,
            })
            break
          }

          attempts++
          if (attempts < maxAttempts) {
            console.log(`⏳ Waiting for PKCE data before redirect... (${attempts}/${maxAttempts})`, {
              localStorageKeys: Object.keys(localStorage),
              sessionStorageKeys: typeof sessionStorage !== 'undefined' ? Object.keys(sessionStorage) : [],
            })
          }
        }

        if (!verifierDetected) {
          console.warn('⚠️ PKCE data not detected before redirect. Forcing redirect with diagnostic info.', {
            localStorageKeys: Object.keys(localStorage),
            sessionStorageKeys: typeof sessionStorage !== 'undefined' ? Object.keys(sessionStorage) : [],
            detectionDetails,
          })

          const pkceKey = detectionDetails?.key || detectionDetails?.supabaseKeys?.find(key => key.includes('code'))

          if (typeof document !== 'undefined' && pkceKey) {
            try {
              const cookieName = `${pkceKey}`
              const cookieValue =
                detectionDetails?.storage === 'sessionStorage'
                  ? sessionStorage.getItem(pkceKey) ?? ''
                  : localStorage.getItem(pkceKey) ?? ''

              if (cookieValue) {
                console.log('Attempting to copy PKCE value to cookie manually before redirect', {
                  cookieName,
                })
                document.cookie = `${cookieName}=${encodeURIComponent(cookieValue)}; Path=/; SameSite=Lax; Max-Age=600${
                  window.location.protocol === 'https:' ? '; Secure' : ''
                }`
              }
            } catch (cookieErr) {
              console.error('Failed to set PKCE cookie manually', cookieErr)
            }
          }
        }

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
      className="group relative w-full flex items-center justify-center gap-3 rounded-xl bg-white px-6 py-4 text-base font-semibold text-gray-900 shadow-lg ring-1 ring-gray-200 transition-all duration-200 hover:bg-gray-50 hover:shadow-xl hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:hover:bg-gray-600"
    >
      {loading ? (
        <>
          <svg className="animate-spin h-5 w-5 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-gray-700 dark:text-gray-200">Logging in...</span>
        </>
      ) : (
        <>
          <svg
            className="h-6 w-6 transition-transform group-hover:scale-110"
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
          <span className="text-gray-700 dark:text-gray-200">Sign in with Google</span>
        </>
      )}
    </button>
  )
}

