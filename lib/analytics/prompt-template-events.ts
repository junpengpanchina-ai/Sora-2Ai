import { z } from 'zod'

export const PromptEventType = {
  Execute: 'execute',
  Success: 'success',
  Failure: 'failure',
  Paid: 'paid',
  Impression: 'impression',
  VariantShown: 'variant_shown',
  VariantGenerate: 'variant_generate',
  Favorite: 'favorite',
  Reuse: 'reuse',
} as const

export type PromptEventType = (typeof PromptEventType)[keyof typeof PromptEventType]

export type PromptEventProps = {
  scene_id?: string

  // AB
  experiment_id?: string
  variant_id?: string
  rollout_pct?: number
  weight?: number

  // Execution
  model_target?: 'Sora-2' | 'Veo-Fast' | 'Veo-Pro'
  duration_sec?: number
  aspect_ratio?: '9:16' | '16:9' | '1:1'
  locale?: string

  // Outcome
  error_code?: string
  error_class?: string
  provider?: 'grsai' | 'openai' | 'google'
  latency_ms?: number

  // Commerce
  amount_cents?: number
  currency?: string
  credits_purchased?: number
  credits_spent?: number
  plan_id?: string
}

const InputSchema = z.object({
  event_type: z.enum([
    'execute',
    'success',
    'failure',
    'paid',
    'impression',
    'variant_shown',
    'variant_generate',
    'favorite',
    'reuse',
  ]),
  prompt_template_id: z.string().uuid(),
  scene_id: z.string().uuid().optional().nullable(),
  session_id: z.string().min(1).max(128).optional().nullable(),
  request_id: z.string().min(8).max(128).optional().nullable(),
  variant_label: z.string().min(1).max(32).optional().nullable(),
  revenue_cents: z.number().int().min(0).max(1_000_000_000).optional().nullable(),
  props: z.record(z.unknown()).optional().nullable(),
})

export async function trackPromptEvent(input: {
  event_type: PromptEventType
  prompt_template_id: string
  scene_id?: string | null
  session_id?: string | null
  request_id?: string | null
  variant_label?: string | null
  revenue_cents?: number | null
  props?: PromptEventProps
}) {
  const parsed = InputSchema.safeParse(input)
  if (!parsed.success) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn('[trackPromptEvent] invalid payload', parsed.error.flatten())
    }
    return
  }

  try {
    await fetch('/api/events/prompt-template', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
    })
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.debug('[trackPromptEvent] failed', e)
    }
  }
}

