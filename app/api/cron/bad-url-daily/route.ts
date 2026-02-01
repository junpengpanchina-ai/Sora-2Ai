import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('missing supabase env')
  return createClient(url, key, { auth: { persistSession: false } })
}

function ymd(date: Date) {
  return date.toISOString().slice(0, 10)
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const secretParam = url.searchParams.get('secret')
  const authHeader = req.headers.get('authorization')
  const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  const secret = secretParam || bearer
  const valid =
    secret &&
    (secret === process.env.INTERNAL_METRICS_SECRET || secret === process.env.CRON_SECRET)
  if (!valid) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const sb = getSupabaseAdmin()

  const d = new Date()
  d.setDate(d.getDate() - 1)
  const day = ymd(d)

  const { data, error } = await sb
    .from('bad_url_daily_counts')
    .select('pattern, hits, last_path, updated_at')
    .eq('day', day)
    .order('hits', { ascending: false })

  if (error) return NextResponse.json({ ok: false }, { status: 200 })

  const total = (data || []).reduce((s, x) => s + Number(x.hits || 0), 0)
  console.log('[bad-url-daily]', {
    day,
    total_hits: total,
    breakdown: (data || []).map((x) => ({
      pattern: x.pattern,
      hits: x.hits,
      last_path: x.last_path,
    })),
  })

  return NextResponse.json({ ok: true, day, total, breakdown: data }, { status: 200 })
}
