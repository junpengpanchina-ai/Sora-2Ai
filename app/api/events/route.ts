import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

type EventPayload = {
  event: string
  source?: string
  properties?: Record<string, unknown>
  example_id?: string
  ratio?: string
  anon_id?: string
}

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

const ALLOWED_EVENTS = new Set(['example_click', 'hero_generate_click', 'generation_started'])

function safeString(v: unknown, maxLen: number) {
  if (typeof v !== 'string') return null
  const s = v.trim()
  if (!s) return null
  return s.length > maxLen ? s.slice(0, maxLen) : s
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as EventPayload

    const event = safeString(body.event, 64)
    if (!event || !ALLOWED_EVENTS.has(event)) {
      return NextResponse.json({ ok: false, error: 'invalid_event' }, { status: 400 })
    }

    const source = safeString(body.source, 64)

    const properties: Record<string, unknown> = {
      ...(body.properties && typeof body.properties === 'object' ? body.properties : {}),
    }

    if (body.example_id) properties.example_id = safeString(body.example_id, 120)
    if (body.ratio) properties.ratio = safeString(body.ratio, 16)
    if (body.anon_id) properties.anon_id = safeString(body.anon_id, 80)

    const approxSize = JSON.stringify(properties).length
    if (approxSize > 4000) {
      return NextResponse.json({ ok: false, error: 'properties_too_large' }, { status: 413 })
    }

    const user_id = null

    const { error } = await supabaseAdmin.from('event_logs').insert({
      event,
      source,
      user_id,
      properties,
    })

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 })
  }
}

