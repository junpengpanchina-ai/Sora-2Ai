import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

type Body = { pattern: string; path?: string; ua?: string }

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('missing supabase env')
  return createClient(url, key, { auth: { persistSession: false } })
}

export async function POST(req: Request) {
  const secret = req.headers.get('x-internal-metrics-secret')
  if (!secret || secret !== process.env.INTERNAL_METRICS_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const body = (await req.json()) as Body
  const pattern = (body.pattern || '').slice(0, 64)
  if (!pattern) return NextResponse.json({ ok: false }, { status: 400 })

  const day = new Date().toISOString().slice(0, 10)
  const last_path = (body.path || '').slice(0, 500)
  const last_ua = (body.ua || '').slice(0, 300)

  try {
    const sb = getSupabaseAdmin()
    const { error } = await sb.rpc('rpc_bad_url_hit', {
      p_day: day,
      p_pattern: pattern,
      p_last_path: last_path || null,
      p_last_ua: last_ua || null,
    })

    if (error) {
      return NextResponse.json({ ok: false }, { status: 200 }) // 打点失败不阻断
    }
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 })
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}
