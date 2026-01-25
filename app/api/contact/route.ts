import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendEmailViaResend } from '@/lib/email/resend'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

type ContactIntent = 'enterprise-demo' | 'enterprise-pricing' | 'contact'

const INTENTS: ContactIntent[] = ['enterprise-demo', 'enterprise-pricing', 'contact']

const ContactBodySchema = z
  .object({
    intent: z.string().optional(),
    name: z.string().min(1).max(120),
    email: z.string().email().max(255),
    company: z.string().max(200).optional(),
    message: z.string().max(4000).optional(),
    sourcePath: z.string().max(500).optional(),
    website: z.string().max(200).optional(), // honeypot
  })
  .transform((raw) => {
    const normalizedIntent = (INTENTS.includes(raw.intent as ContactIntent) ? raw.intent : 'contact') as ContactIntent
    return {
      intent: normalizedIntent,
      name: raw.name.trim(),
      email: raw.email.trim(),
      company: (raw.company ?? '').trim(),
      message: raw.message?.trim() || '',
      sourcePath: raw.sourcePath?.trim() || '',
      website: raw.website?.trim() || '',
    }
  })
  .superRefine((v, ctx) => {
    if ((v.intent === 'enterprise-demo' || v.intent === 'enterprise-pricing') && !v.company) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'company_required',
        path: ['company'],
      })
    }
    if ((v.intent === 'enterprise-demo' || v.intent === 'enterprise-pricing') && !v.message) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'message_required',
        path: ['message'],
      })
    }
  })

const subjectFor = (intent: ContactIntent, company?: string, name?: string) => {
  const c = (company ?? '').trim() || '-'
  const n = (name ?? '').trim() || '-'
  if (intent === 'enterprise-demo') return `[Sora2][Demo] ${c} — ${n}`
  if (intent === 'enterprise-pricing') return `[Sora2][Pricing] ${c} — ${n}`
  return `[Sora2][Contact] ${c} — ${n}`
}

export async function POST(req: Request) {
  try {
    const json = await req.json().catch(() => null)
    if (!json || typeof json !== 'object') {
      return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 })
    }

    const parsed = ContactBodySchema.safeParse(json)
    if (!parsed.success) {
      // Keep response minimal; frontend shows generic error.
      return NextResponse.json({ ok: false, error: 'invalid_payload' }, { status: 400 })
    }

    const body = parsed.data
    if (body.website) {
      // Honeypot hit: pretend success, but don't write to DB or email.
      return NextResponse.json({ ok: true, id: null, emailSent: false, degraded: 'spam' })
    }

    const userAgent = req.headers.get('user-agent') ?? ''
    const ip = getClientIp(req)

    const supabase = await createServiceClient()

    // ----------------------------
    // Rate limit (DB-backed, serverless-safe)
    // Default: 5 submissions / 10 min / IP
    // ----------------------------
    const rateLimitMax = Number.parseInt(process.env.CONTACT_RATE_LIMIT_MAX ?? '5', 10)
    const rateLimitWindowMin = Number.parseInt(process.env.CONTACT_RATE_LIMIT_WINDOW_MIN ?? '10', 10)

    if (ip && Number.isFinite(rateLimitMax) && rateLimitMax > 0) {
      const sinceIso = new Date(Date.now() - rateLimitWindowMin * 60_000).toISOString()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count, error: countError } = await (supabase as any)
        .from('contact_requests')
        .select('id', { count: 'exact', head: true })
        .eq('ip', ip)
        .gte('created_at', sinceIso)

      if (countError) {
        console.warn('[api/contact] rate limit count failed (ignored):', countError)
      } else if (typeof count === 'number' && count >= rateLimitMax) {
        return NextResponse.json(
          { ok: false, error: 'rate_limited' },
          {
            status: 429,
            headers: {
              'Retry-After': String(rateLimitWindowMin * 60),
            },
          }
        )
      }
    }

    const baseMeta = {
      receivedAt: new Date().toISOString(),
      email: {
        provider: 'resend',
        sent: null as null | boolean,
        error: null as null | string,
      },
    }
    // NOTE: `contact_requests` may not exist in generated Database types yet.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: inserted, error: insertError } = await (supabase as any)
      .from('contact_requests')
      .insert({
        intent: body.intent,
        name: body.name,
        email: body.email,
        company: body.company || null,
        message: body.message || null,
        source_path: body.sourcePath || null,
        user_agent: userAgent || null,
        ip: ip || null,
        status: 'new',
        meta: baseMeta,
      })
      .select('id, created_at')
      .single()

    if (insertError) {
      console.error('[api/contact] insert failed', insertError)
      return NextResponse.json({ ok: false, error: 'db_insert_failed' }, { status: 500 })
    }

    const notifyTo = process.env.CONTACT_NOTIFY_EMAIL ?? 'junpengpanchina@gmail.com'
    const fromEmail = process.env.CONTACT_FROM_EMAIL ?? 'Sora2Ai <no-reply@sora2aivideos.com>'
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sora2aivideos.com'
    const adminUrl = `${siteUrl}/admin/contact-requests`

    const requestId = inserted?.id ?? 'n/a'
    const createdAt = inserted?.created_at ?? new Date().toISOString()
    const sourcePath = body.sourcePath || '(unknown)'

    const subject = subjectFor(body.intent, body.company, body.name)

    const text = `New Enterprise Contact Request

Intent: ${body.intent}

Contact
- Name: ${body.name}
- Email: ${body.email}
- Company: ${body.company}

Message
${body.message || ''}

Source
- Path: ${sourcePath}
- IP: ${ip || ''}
- User-Agent: ${userAgent || ''}

Admin
${adminUrl}

Request ID: ${requestId}
Time: ${createdAt}
`

    const html = `
      <div style="font-family: ui-sans-serif, system-ui, -apple-system; line-height:1.5;">
        <h2 style="margin:0 0 12px;">New Enterprise Contact Request</h2>

        <div style="margin:0 0 14px;">
          <strong>Intent:</strong> <span>${escapeHtml(body.intent)}</span>
        </div>

        <div style="border:1px solid #e5e7eb; border-radius:10px; padding:12px; margin-bottom:14px;">
          <div><strong>Name:</strong> ${escapeHtml(body.name)}</div>
          <div><strong>Email:</strong> <a href="mailto:${escapeAttr(body.email)}">${escapeHtml(body.email)}</a></div>
          <div><strong>Company:</strong> ${escapeHtml(body.company)}</div>
        </div>

        <div style="margin-bottom:14px;">
          <strong>Message</strong>
          <pre style="white-space:pre-wrap; background:#f9fafb; border:1px solid #e5e7eb; border-radius:10px; padding:12px; margin:8px 0 0;">${escapeHtml(
            body.message || ''
          )}</pre>
        </div>

        <div style="border:1px dashed #e5e7eb; border-radius:10px; padding:12px; margin-bottom:14px;">
          <div><strong>Source Path:</strong> ${escapeHtml(sourcePath)}</div>
          <div><strong>IP:</strong> ${escapeHtml(ip || '')}</div>
          <div><strong>User-Agent:</strong> ${escapeHtml(userAgent || '')}</div>
        </div>

        <div style="margin-bottom:6px;">
          <strong>Admin:</strong> <a href="${escapeAttr(adminUrl)}">${escapeHtml(adminUrl)}</a>
        </div>
        <div style="color:#6b7280; font-size:12px;">
          Request ID: ${escapeHtml(requestId)} · Time: ${escapeHtml(createdAt)}
        </div>
      </div>
    `

    const emailRes = await sendEmailViaResend({
      to: notifyTo,
      from: fromEmail,
      subject,
      text,
      html,
      replyTo: body.email,
    })

    if (!emailRes.ok) {
      // Best-effort: write email status back for admin debugging.
      try {
        if (inserted?.id) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any)
            .from('contact_requests')
            .update({
              meta: {
                ...baseMeta,
                email: { provider: 'resend', sent: false, error: emailRes.error },
              },
            })
            .eq('id', inserted.id)
        }
      } catch (e) {
        console.warn('[api/contact] meta update failed (ignored):', e)
      }
      // Don't fail the user flow—DB insert succeeded and admin can follow up.
      console.warn('[api/contact] email failed:', emailRes.error)
      return NextResponse.json({
        ok: true,
        id: inserted?.id,
        emailSent: false,
        degraded: 'email',
      })
    }

    // Best-effort: mark email sent in meta.
    try {
      if (inserted?.id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('contact_requests')
          .update({
            meta: {
              ...baseMeta,
              email: { provider: 'resend', sent: true, error: null },
            },
          })
          .eq('id', inserted.id)
      }
    } catch (e) {
      console.warn('[api/contact] meta update failed (ignored):', e)
    }

    return NextResponse.json({
      ok: true,
      id: inserted?.id,
      emailSent: true,
      degraded: null,
    })
  } catch (error) {
    console.error('[api/contact] unexpected error', error)
    return NextResponse.json({ ok: false, error: 'unexpected_error' }, { status: 500 })
  }
}

function getClientIp(req: Request) {
  // Prefer x-forwarded-for (Vercel / proxies)
  const xff = req.headers.get('x-forwarded-for')
  if (xff) {
    const first = xff.split(',')[0]?.trim()
    if (first) return first
  }
  const xri = req.headers.get('x-real-ip')
  if (xri) return xri.trim()
  return null
}

function escapeHtml(input: string) {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function escapeAttr(input: string) {
  return escapeHtml(input)
}

