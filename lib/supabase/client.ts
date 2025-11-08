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
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

