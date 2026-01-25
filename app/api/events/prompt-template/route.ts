import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const EventType = z.enum([
  'execute',
  'success',
  'failure',
  'paid',
  'impression',
  'variant_shown',
  'variant_generate',
  'favorite',
  'reuse',
])

const BodySchema = z.object({
  event_type: EventType,
  prompt_template_id: z.string().uuid(),
  scene_id: z.string().uuid().optional().nullable(),
  session_id: z.string().min(1).max(128).optional().nullable(),
  request_id: z.string().min(8).max(128).optional().nullable(),
  variant_label: z.string().min(1).max(32).optional().nullable(),
  revenue_cents: z.number().int().min(0).max(1_000_000_000).optional().nullable(),
  props: z.record(z.unknown()).optional().nullable(),
})

function safeProps(props: Record<string, unknown> | null | undefined): Record<string, unknown> {
  if (!props) return {}
  // soft size limit to prevent abuse / huge payloads
  try {
    const raw = JSON.stringify(props)
    if (raw.length > 10_000) return { _dropped: 'props_too_large' }
  } catch {
    return { _dropped: 'props_not_serializable' }
  }
  return props
}

/**
 * POST /api/events/prompt-template
 * Writes an analytics row into `prompt_template_events`.
 *
 * - `user_id` is taken from the current auth session (if any); never trusted from client.
 * - `request_id` is optional but recommended for idempotency.
 */
export async function POST(request: NextRequest) {
  try {
    const json = await request.json().catch(() => null)
    const parsed = BodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 })
    }

    const {
      event_type,
      prompt_template_id,
      scene_id,
      session_id,
      request_id,
      variant_label,
      revenue_cents,
      props,
    } = parsed.data

    // best-effort user id (cookie session)
    const sb = await createClient(request.headers)
    const { data: authData } = await sb.auth.getUser()
    const userId = authData?.user?.id ?? null

    const supabase = await createServiceClient()
    // NOTE: typed Supabase client may not include this table in types for some repos.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('prompt_template_events').insert({
      occurred_at: new Date().toISOString(),
      user_id: userId,
      session_id: session_id ?? null,
      scene_id: scene_id ?? null,
      prompt_template_id,
      variant_label: variant_label ?? null,
      event_type,
      revenue_cents: revenue_cents ?? 0,
      request_id: request_id ?? null,
      props: safeProps(props ?? null),
    })

    if (error) {
      // idempotency: unique violation on request_id should be treated as success
      const msg = String(error.message || '')
      if (msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('unique')) {
        return NextResponse.json({ success: true, deduped: true })
      }
      return NextResponse.json({ error: 'Insert failed', details: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[events/prompt-template] failed:', e)
    return NextResponse.json({ error: 'Failed to track prompt event' }, { status: 500 })
  }
}

