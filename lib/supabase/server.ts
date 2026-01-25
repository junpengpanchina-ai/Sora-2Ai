import { createServerClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { cookies, headers } from 'next/headers'
import { resilientFetch } from '@/lib/utils/resilient-fetch'

export async function createClient(customHeaders?: Headers | HeadersInit): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies()
  const headerList =
    customHeaders ??
    (typeof headers === 'function'
      ? (() => {
          try {
            return headers()
          } catch {
            return undefined
          }
        })()
      : undefined)

  let authorizationHeader: string | undefined

  if (headerList) {
    if (typeof (headerList as Headers).get === 'function') {
      authorizationHeader = (headerList as Headers).get('authorization') ?? undefined
    } else if (Array.isArray(headerList)) {
      authorizationHeader = headerList.find(([key]) => key.toLowerCase() === 'authorization')?.[1]
    } else {
      const record = headerList as Record<string, string>
      authorizationHeader =
        Object.entries(record).find(([key]) => key.toLowerCase() === 'authorization')?.[1] ?? undefined
    }
  }

  // Only forward Supabase JWTs via Authorization header.
  // This prevents accidental API keys or non-JWT tokens from overriding valid cookie sessions.
  const normalizedAuth = authorizationHeader?.trim()
  const bearerToken =
    normalizedAuth && normalizedAuth.toLowerCase().startsWith('bearer ') ? normalizedAuth.slice(7).trim() : null
  const looksLikeJwt =
    !!bearerToken &&
    // Typical JWT header is base64url-encoded JSON: starts with "eyJ"
    bearerToken.startsWith('eyJ') &&
    bearerToken.split('.').length === 3 &&
    bearerToken.length > 20

  const globalConfig: {
    headers?: Record<string, string>
    fetch: typeof fetch
  } = {
    fetch: (input, init) =>
      resilientFetch(input, init, {
        timeoutMs: 30000,
        keepAlive: true,
        maxRetries: 5,
        retryDelay: 500,
        exponentialBackoff: true,
        returnErrorResponseOnFailure: true,
      }),
  }

  if (normalizedAuth && looksLikeJwt) {
    globalConfig.headers = {
      Authorization: normalizedAuth,
    }
  }

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: globalConfig,
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

