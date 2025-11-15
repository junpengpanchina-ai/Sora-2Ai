import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export function createClient(): SupabaseClient<Database> {
  // Ensure environment variables exist
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  // createBrowserClient automatically handles PKCE code_verifier
  // It stores it in browser's localStorage
  // Note: Supabase automatically persists sessions in localStorage
  // This means users stay logged in across page refreshes
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true, // Keep session in localStorage
      autoRefreshToken: true, // Automatically refresh expired tokens
      detectSessionInUrl: true, // Detect session from URL (for OAuth callbacks)
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
  })
}

