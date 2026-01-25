import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendEmailViaResend } from '@/lib/email/resend'

export const dynamic = 'force-dynamic'

type ContactIntent = 'enterprise-demo' | 'enterprise-pricing' | 'contact'

const normalizeIntent = (value: unknown): ContactIntent => {
  if (value === 'enterprise-demo') return 'enterprise-demo'
  if (value === 'enterprise-pricing') return 'enterprise-pricing'
  return 'contact'
}

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      intent?: string
      name?: string
      email?: string
      company?: string
      message?: string
      sourcePath?: string
    }

    const intent = normalizeIntent(body.intent)
    const name = (body.name ?? '').trim()
    const email = (body.email ?? '').trim()
    const company = (body.company ?? '').trim()
    const message = (body.message ?? '').trim()

    if (!name || !email || !company) {
      return NextResponse.json({ ok: false, error: 'missing_required_fields' }, { status: 400 })
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ ok: false, error: 'invalid_email' }, { status: 400 })
    }
    if ((intent === 'enterprise-demo' || intent === 'enterprise-pricing') && !message) {
      return NextResponse.json({ ok: false, error: 'message_required' }, { status: 400 })
    }

    const userAgent = req.headers.get('user-agent') ?? null
    const forwardedFor = req.headers.get('x-forwarded-for') ?? null
    const ip = forwardedFor ? forwardedFor.split(',')[0]?.trim() : null

    const supabase = await createServiceClient()

    // NOTE: `contact_requests` may not exist in generated Database types yet.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: inserted, error: insertError } = await (supabase as any)
      .from('contact_requests')
      .insert({
        intent,
        name,
        email,
        company,
        message: message || null,
        source_path: body.sourcePath ?? null,
        user_agent: userAgent,
        ip,
        status: 'new',
        meta: {
          receivedAt: new Date().toISOString(),
        },
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('[api/contact] insert failed', insertError)
      return NextResponse.json({ ok: false, error: 'db_insert_failed' }, { status: 500 })
    }

    const notifyTo = process.env.CONTACT_NOTIFY_EMAIL ?? 'junpengpanchina@gmail.com'
    const fromEmail = process.env.CONTACT_FROM_EMAIL ?? 'Sora2Ai <onboarding@resend.dev>'

    const subject =
      intent === 'enterprise-demo'
        ? `[Sora2Ai] Enterprise demo request — ${company}`
        : intent === 'enterprise-pricing'
          ? `[Sora2Ai] Enterprise pricing request — ${company}`
          : `[Sora2Ai] Contact message — ${company}`

    const html = `
      <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;">
        <h2 style="margin:0 0 8px 0;">New ${intent.replace('-', ' ')} lead</h2>
        <p style="margin:0 0 16px 0; color:#555;">Lead ID: <code>${inserted?.id ?? 'n/a'}</code></p>
        <table style="border-collapse:collapse; width:100%; max-width:720px;">
          <tr><td style="padding:6px 0; width:140px; color:#666;">Name</td><td style="padding:6px 0;">${escapeHtml(
            name
          )}</td></tr>
          <tr><td style="padding:6px 0; color:#666;">Work email</td><td style="padding:6px 0;"><a href="mailto:${encodeURIComponent(
            email
          )}">${escapeHtml(email)}</a></td></tr>
          <tr><td style="padding:6px 0; color:#666;">Company</td><td style="padding:6px 0;">${escapeHtml(
            company
          )}</td></tr>
          <tr><td style="padding:6px 0; color:#666;">Intent</td><td style="padding:6px 0;">${escapeHtml(
            intent
          )}</td></tr>
          <tr><td style="padding:6px 0; color:#666;">Message</td><td style="padding:6px 0; white-space:pre-wrap;">${escapeHtml(
            message || '(empty)'
          )}</td></tr>
          <tr><td style="padding:6px 0; color:#666;">Source</td><td style="padding:6px 0;">${escapeHtml(
            body.sourcePath ?? '(unknown)'
          )}</td></tr>
        </table>
        <hr style="margin:16px 0; border:none; border-top:1px solid #eee;" />
        <p style="margin:0; color:#777; font-size:12px;">
          Replying to this email will go to <strong>${escapeHtml(email)}</strong> (Reply-To).
        </p>
      </div>
    `

    const emailRes = await sendEmailViaResend({
      to: notifyTo,
      from: fromEmail,
      subject,
      html,
      replyTo: email,
    })

    if (!emailRes.ok) {
      // Don't fail the user flow—DB insert succeeded and admin can follow up.
      console.warn('[api/contact] email failed:', emailRes.error)
      return NextResponse.json({
        ok: true,
        id: inserted?.id,
        emailSent: false,
      })
    }

    return NextResponse.json({
      ok: true,
      id: inserted?.id,
      emailSent: true,
    })
  } catch (error) {
    console.error('[api/contact] unexpected error', error)
    return NextResponse.json({ ok: false, error: 'unexpected_error' }, { status: 500 })
  }
}

function escapeHtml(input: string) {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

