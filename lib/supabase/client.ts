import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
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
  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true, // Keep session in localStorage
      autoRefreshToken: true, // Automatically refresh expired tokens
      detectSessionInUrl: true, // Detect session from URL (for OAuth callbacks)
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
  })
}

