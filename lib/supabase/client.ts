import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

type StorageAdapter = {
  getItem: (key: string) => Promise<string | null>
  setItem: (key: string, value: string) => Promise<void>
  removeItem: (key: string) => Promise<void>
}

const IN_MEMORY_STORAGE = new Map<string, string>()
const PKCE_COOKIE_MAX_AGE_SECONDS = 60 * 10 // keep verifier cookies for 10 minutes

function safeGetLocalStorage(): Storage | null {
  try {
    return typeof window !== 'undefined' && 'localStorage' in window ? window.localStorage : null
  } catch {
    return null
  }
}

function safeGetSessionStorage(): Storage | null {
  try {
    return typeof window !== 'undefined' && 'sessionStorage' in window ? window.sessionStorage : null
  } catch {
    return null
  }
}

function getCookieValue(name: string): string | null {
  if (typeof document === 'undefined') return null
  const cookies = document.cookie ? document.cookie.split('; ') : []
  for (const cookie of cookies) {
    const [key, ...rest] = cookie.split('=')
    if (key === name) {
      return decodeURIComponent(rest.join('='))
    }
  }
  return null
}

function setCookieValue(name: string, value: string, maxAgeSeconds: number) {
  if (typeof document === 'undefined') return
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:'
  const cookie = `${name}=${encodeURIComponent(value)}; Path=/; SameSite=Lax; Max-Age=${maxAgeSeconds}${
    secure ? '; Secure' : ''
  }`
  document.cookie = cookie
}

function removeCookieValue(name: string) {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`
}

function createResilientBrowserStorage(): StorageAdapter {
  const local = safeGetLocalStorage()
  const session = safeGetSessionStorage()

  return {
    async getItem(key: string) {
      if (key.endsWith('-code-verifier')) {
        console.log('[SupabaseStorage] getItem start', { key })
      }
      const fromLocal = local?.getItem(key)
      if (fromLocal !== null && fromLocal !== undefined) {
        IN_MEMORY_STORAGE.set(key, fromLocal)
        if (key.endsWith('-code-verifier')) {
          console.log('[SupabaseStorage] getItem hit localStorage', { key })
        }
        return fromLocal
      }

      const fromSession = session?.getItem(key)
      if (fromSession !== null && fromSession !== undefined) {
        IN_MEMORY_STORAGE.set(key, fromSession)
        if (key.endsWith('-code-verifier')) {
          console.log('[SupabaseStorage] getItem hit sessionStorage', { key })
        }
        return fromSession
      }

      const fromCookie = getCookieValue(key)
      if (fromCookie !== null) {
        IN_MEMORY_STORAGE.set(key, fromCookie)
        if (key.endsWith('-code-verifier')) {
          console.log('[SupabaseStorage] getItem hit cookie', { key })
        }
        return fromCookie
      }

      if (key.endsWith('-code-verifier')) {
        console.log('[SupabaseStorage] getItem miss', { key })
      }
      return IN_MEMORY_STORAGE.get(key) ?? null
    },

    async setItem(key: string, value: string) {
      const serialized = String(value)

      try {
        local?.setItem(key, serialized)
        if (key.endsWith('-code-verifier')) {
          console.log('[SupabaseStorage] setItem localStorage success', { key })
        }
      } catch (error) {
        if (key.endsWith('-code-verifier')) {
          console.warn('[SupabaseStorage] setItem localStorage failed', { key, error })
        }
        // ignore quota/storage errors
      }

      try {
        session?.setItem(key, serialized)
        if (key.endsWith('-code-verifier')) {
          console.log('[SupabaseStorage] setItem sessionStorage success', { key })
        }
      } catch (error) {
        if (key.endsWith('-code-verifier')) {
          console.warn('[SupabaseStorage] setItem sessionStorage failed', { key, error })
        }
        // ignore quota/storage errors
      }

      if (key.endsWith('-code-verifier')) {
        try {
          setCookieValue(key, serialized, PKCE_COOKIE_MAX_AGE_SECONDS)
          console.log('[SupabaseStorage] setItem cookie success', { key })
        } catch (error) {
          console.warn('[SupabaseStorage] setItem cookie failed', { key, error })
          // ignore cookie errors
        }
      }

      IN_MEMORY_STORAGE.set(key, serialized)
      if (key.endsWith('-code-verifier')) {
        console.log('[SupabaseStorage] setItem memory store', { key })
      }
    },

    async removeItem(key: string) {
      try {
        local?.removeItem(key)
        if (key.endsWith('-code-verifier')) {
          console.log('[SupabaseStorage] removeItem localStorage', { key })
        }
      } catch (error) {
        if (key.endsWith('-code-verifier')) {
          console.warn('[SupabaseStorage] removeItem localStorage failed', { key, error })
        }
        // ignore
      }

      try {
        session?.removeItem(key)
        if (key.endsWith('-code-verifier')) {
          console.log('[SupabaseStorage] removeItem sessionStorage', { key })
        }
      } catch (error) {
        if (key.endsWith('-code-verifier')) {
          console.warn('[SupabaseStorage] removeItem sessionStorage failed', { key, error })
        }
        // ignore
      }

      if (key.endsWith('-code-verifier')) {
        removeCookieValue(key)
        console.log('[SupabaseStorage] removeItem cookie', { key })
      }
      IN_MEMORY_STORAGE.delete(key)
    },
  }
}

let browserClient: SupabaseClient<Database> | undefined
let browserStorage: StorageAdapter | undefined

export function createClient(): SupabaseClient<Database> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  if (typeof window === 'undefined') {
    throw new Error('createClient must be called in a browser environment')
  }

  if (!browserStorage) {
    browserStorage = createResilientBrowserStorage()
  }

  if (!browserClient) {
    // 🔥 浏览器登录专用 client - 绝对不能传 accessToken
    // 只用于：登录/登出/获取 session/监听 auth 状态
    browserClient = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storage: browserStorage,
      },
      // 🔥 明确不传任何 global headers（避免 accessToken 污染）
      // 不传 global 配置，确保不会意外传入 Authorization header
    })
  }

  return browserClient
}

