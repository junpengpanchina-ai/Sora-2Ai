import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { createHash } from 'crypto'

export interface AdminUserSession {
  id: string
  username: string
  is_super_admin: boolean
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export async function getAdminSessionToken() {
  const cookieStore = await cookies()
  return cookieStore.get('admin_session_token')?.value ?? null
}

export async function validateAdminSession(): Promise<AdminUserSession | null> {
  const token = await getAdminSessionToken()
  if (!token) {
    return null
  }

  const supabase = await createClient()
  const tokenHash = hashToken(token)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc('admin_validate_session', {
    p_token_hash: tokenHash,
  })

  if (error || !data) {
    const cookieStore = await cookies()
    cookieStore.delete('admin_session_token')
    return null
  }

  return {
    id: data.id,
    username: data.username,
    is_super_admin: data.is_super_admin,
  }
}

export async function clearAdminSession() {
  const token = await getAdminSessionToken()
  const cookieStore = await cookies()
  if (token) {
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).rpc('admin_delete_session', {
      p_token_hash: hashToken(token),
    })
  }
  cookieStore.delete('admin_session_token')
}

export function hashSessionToken(token: string) {
  return hashToken(token)
}


