import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type RecItem = {
  id: string
  content: string
  role: string
  locale: string | null
  status: string
  is_published: boolean
  owner_scope: string
  ltv_gate_color?: 'RED' | 'YELLOW' | 'GREEN' | null
  completion_rate_30d?: number | null
  reuse_rate_30d?: number | null
  delta_cr_30d?: number | null
  t_first_success_median_sec_30d?: number | null
  executions_30d?: number | null
}

function getFallbackTemplate(role: string | null, locale: string | null) {
  const normalizedLocale = locale || 'en'
  const normalizedRole = (role || 'default') as 'ads' | 'social' | 'long_form' | 'default'

  const base = {
    locale: normalizedLocale,
    ltv_gate_color: null as 'GREEN' | 'YELLOW' | 'RED' | null,
  }

  if (normalizedRole === 'ads') {
    return {
      id: 'fallback-ads-en',
      role: 'ads',
      content:
        'Vertical smartphone ad for {{brand}}. Goal: {{goal}}. Duration: {{duration}}. Aspect ratio: {{aspect_ratio}}. Start with a clear hook in the first second, then show close-up shots of the product in use. Use natural lighting, realistic skin tones, and simple backgrounds. End with a clear call-to-action text on screen.',
      ...base,
    }
  }

  if (normalizedRole === 'social') {
    return {
      id: 'fallback-social-en',
      role: 'social',
      content:
        'Vertical social video for {{brand}}, designed to increase followers. Goal: {{goal}}. Duration: {{duration}}. Aspect ratio: {{aspect_ratio}}. Show a casual, behind-the-scenes moment or a relatable meme-style scene. Keep camera movement light and handheld, with natural reactions and expressions. Add space in the frame for app UI overlays or captions.',
      ...base,
    }
  }

  if (normalizedRole === 'long_form') {
    return {
      id: 'fallback-long-form-en',
      role: 'long_form',
      content:
        'Vertical talking-head explainer for {{brand}}. Goal: {{goal}}. Duration: {{duration}}. Aspect ratio: {{aspect_ratio}}. A friendly presenter speaks directly to camera with natural eye contact and subtle expressions. Background: simple home office with a warm desk lamp and bookshelf, softly blurred. Clean, even soft lighting, realistic skin tones, and a calm, confident delivery.',
      ...base,
    }
  }

  // default
  return {
    id: 'fallback-default-en',
    role: 'default',
    content:
      'Vertical smartphone video for {{brand}}. Goal: {{goal}}. Duration: {{duration}}. Aspect ratio: {{aspect_ratio}}. Show the main subject clearly in the center of frame, with simple, uncluttered background. Use natural lighting and realistic motion, avoiding extreme camera moves. Make the scene feel like a real short-form video a creator would post.',
    ...base,
  }
}

function score(item: RecItem) {
  const gate = item.ltv_gate_color
  const gateScore = gate === 'GREEN' ? 0 : gate === 'YELLOW' ? 1 : 2
  const comp = typeof item.completion_rate_30d === 'number' ? item.completion_rate_30d : 0
  const reuse = typeof item.reuse_rate_30d === 'number' ? item.reuse_rate_30d : 0
  const delta = typeof item.delta_cr_30d === 'number' ? item.delta_cr_30d : 0
  const t = typeof item.t_first_success_median_sec_30d === 'number' ? item.t_first_success_median_sec_30d : 999999
  const exec = typeof item.executions_30d === 'number' ? item.executions_30d : 0

  // lower is better for this sort tuple
  return [gateScore, -delta, -reuse, -comp, t, -exec] as const
}

function cmp(a: readonly number[], b: readonly number[]) {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const av = a[i] ?? 0
    const bv = b[i] ?? 0
    if (av < bv) return -1
    if (av > bv) return 1
  }
  return 0
}

/**
 * GET /api/prompt-templates/recommend?role=ads&locale=en
 * Public endpoint used by the new-user flow on /video.
 *
 * It returns ONE recommended prompt template (published + active), ranked by LTV gate and metrics.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')?.trim() || null
    const locale = searchParams.get('locale')?.trim() || null

    const supabase = await createServiceClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const q = (supabase as any)
      .from('v_prompt_templates_admin_list')
      .select(
        'id,content,role,locale,status,is_published,owner_scope,ltv_gate_color,completion_rate_30d,reuse_rate_30d,delta_cr_30d,t_first_success_median_sec_30d,executions_30d'
      )
      .eq('owner_scope', 'global')
      .eq('status', 'active')
      .eq('is_published', true)
      .eq('ltv_gate_color', 'GREEN')
      .limit(50)

    if (role) q.eq('role', role)
    if (locale) q.eq('locale', locale)

    const { data, error } = await q
    if (error) throw error

    let items = (data || []) as RecItem[]
    if (items.length === 0) {
      // fallback: allow YELLOW when no GREEN exists yet
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const q2 = (supabase as any)
        .from('v_prompt_templates_admin_list')
        .select(
          'id,content,role,locale,status,is_published,owner_scope,ltv_gate_color,completion_rate_30d,reuse_rate_30d,delta_cr_30d,t_first_success_median_sec_30d,executions_30d'
        )
        .eq('owner_scope', 'global')
        .eq('status', 'active')
        .eq('is_published', true)
        .in('ltv_gate_color', ['GREEN', 'YELLOW'])
        .limit(50)
      if (role) q2.eq('role', role)
      if (locale) q2.eq('locale', locale)
      const { data: data2 } = await q2
      items = (data2 || []) as RecItem[]
    }
    let top: RecItem | null = null

    if (items.length === 0) {
      // Hard fallback: return a built-in template when DB has nothing suitable
      const fb = getFallbackTemplate(role, locale)
      top = {
        id: fb.id,
        content: fb.content,
        role: fb.role,
        locale: fb.locale,
        status: 'fallback',
        is_published: true,
        owner_scope: 'global',
        ltv_gate_color: fb.ltv_gate_color,
        completion_rate_30d: null,
        reuse_rate_30d: null,
        delta_cr_30d: null,
        t_first_success_median_sec_30d: null,
        executions_30d: null,
      }
    } else {
      items.sort((a, b) => cmp(score(a), score(b)))
      top = items[0]
    }

    return NextResponse.json({
      success: true,
      item: {
        id: top.id,
        content: top.content,
        role: top.role,
        locale: top.locale,
        ltv_gate_color: top.ltv_gate_color ?? null,
        metrics: {
          completion_rate_30d: top.completion_rate_30d ?? null,
          reuse_rate_30d: top.reuse_rate_30d ?? null,
          delta_cr_30d: top.delta_cr_30d ?? null,
          t_first_success_median_sec_30d: top.t_first_success_median_sec_30d ?? null,
          executions_30d: top.executions_30d ?? null,
        },
      },
    })
  } catch (e) {
    console.error('[prompt-templates/recommend] failed:', e)
    return NextResponse.json({ success: false, error: 'Failed to recommend template' }, { status: 500 })
  }
}

