import { createServerClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { cookies, headers } from 'next/headers'

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

  const authorizationHeader =
    typeof headerList?.get === 'function' ? headerList.get('authorization') ?? undefined : undefined

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: authorizationHeader
        ? {
            headers: {
              Authorization: authorizationHeader,
            },
          }
        : undefined,
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

