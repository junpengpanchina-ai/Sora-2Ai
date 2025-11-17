import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createHash } from 'crypto'
import { cookies } from 'next/headers'

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export async function POST() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_session_token')?.value ?? null

  if (token) {
    const supabase = await createClient()
    await supabase.rpc('admin_delete_session', { p_token_hash: hashToken(token) })
  }

  const response = NextResponse.json({ success: true })
  response.cookies.set('admin_session_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(0),
  })

  return response
}


