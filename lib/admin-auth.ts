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
  try {
    const cookieStore = await cookies()
    return cookieStore.get('admin_session_token')?.value ?? null
  } catch (error) {
    console.error('[admin-auth] 获取 cookie 失败:', error)
    return null
  }
}

export async function validateAdminSession(): Promise<AdminUserSession | null> {
  try {
    const token = await getAdminSessionToken()
    if (!token) {
      return null
    }

    let supabase
    try {
      supabase = await createClient()
    } catch (error) {
      console.error('[admin-auth] 创建 Supabase 客户端失败:', error)
      return null
    }

    const tokenHash = hashToken(token)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc('admin_validate_session', {
      p_token_hash: tokenHash,
    })

    if (error || !data) {
      try {
        const cookieStore = await cookies()
        cookieStore.delete('admin_session_token')
      } catch (cookieError) {
        // 忽略 cookie 删除错误
        console.warn('[admin-auth] 删除 cookie 失败:', cookieError)
      }
      return null
    }

    return {
      id: data.id,
      username: data.username,
      is_super_admin: data.is_super_admin,
    }
  } catch (error) {
    console.error('[admin-auth] validateAdminSession 异常:', error)
    return null
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


