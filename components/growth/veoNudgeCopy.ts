/**
 * Veo 提示 A/B 文案
 * 
 * 策略：
 * - Sora = Everyday Creator Model（日常高频）
 * - Veo Flash = Quality Upgrade（更高质、仍然快）
 * - Veo Pro = Final Cut / Studio Grade（最终成片）
 * - 绝不说 "cheap / low / basic"，只说 "fast / lightweight / everyday"
 */

import type { Variant } from '@/lib/growth/ab'
import type { Reason } from '@/lib/growth/veoIntent'

export interface VeoNudgeCopy {
  title: string
  body: string
  cta: string
  note?: string
}

const A: Record<Reason, VeoNudgeCopy> = {
  QUALITY_MATCH: {
    title: 'Want a more premium finish for the same idea?',
    body: 'Sora is great for quick iteration. If this scene benefits from higher fidelity (and audio when needed), Veo Pro is often the better final render.',
    cta: 'Create Veo Pro version',
    note: 'Same prompt. Cleaner motion and richer detail.',
  },
  HIGH_ENGAGEMENT: {
    title: 'Turn this draft into a polished version',
    body: 'If you like this direction, Veo Pro can generate a higher-quality version using the exact same prompt and structure.',
    cta: 'Generate with Veo Pro',
  },
  FRICTION: {
    title: 'Need a smoother completion for this render?',
    body: 'For complex scenes or peak-time queues, Veo Pro is designed for a more stable finishing pass—without changing your workflow.',
    cta: 'Switch to Veo Pro',
  },
  HIGH_INTENT_ACTION: {
    title: 'Before you share—consider a premium render',
    body: "Since you're exporting, a Veo Pro version can help deliver a more polished final output for the same concept.",
    cta: 'Make a Veo Pro export',
  },
  STARTER_LIMIT_APPROACH: {
    title: 'Keep creating this week—without friction',
    body: "You're building momentum. Veo Pro is the best next step when you want higher fidelity output as your usage increases.",
    cta: 'Unlock Veo Pro',
  },
  NONE: {
    title: '',
    body: '',
    cta: '',
  },
}

const B: Record<Reason, VeoNudgeCopy> = {
  QUALITY_MATCH: {
    title: 'This scene looks like a Veo Pro moment',
    body: 'Sora helps you iterate fast. When you&apos;re ready to finalize with richer detail (and audio when relevant), Veo Pro is the natural upgrade.',
    cta: 'Finalize in Veo Pro',
    note: 'Same idea → premium final render.',
  },
  HIGH_ENGAGEMENT: {
    title: 'Want the "final cut" version?',
    body: 'Veo Pro can produce a premium-grade render from the same prompt—ideal when you want a more cinematic result.',
    cta: 'Create the final cut',
  },
  FRICTION: {
    title: 'If this feels slow, here&apos;s the premium route',
    body: 'Veo Pro is optimized for completing heavier scenes with a smoother experience—no need to change your prompt.',
    cta: 'Try Veo Pro for this scene',
  },
  HIGH_INTENT_ACTION: {
    title: 'Exporting? A premium version may be worth it',
    body: 'Many creators do a fast draft in Sora, then generate a premium version in Veo Pro before publishing.',
    cta: 'Generate premium export',
  },
  STARTER_LIMIT_APPROACH: {
    title: 'You&apos;re close to your Starter comfort zone',
    body: 'Sora is perfect for daily creation. Veo Pro is for premium output when you want to scale quality and consistency.',
    cta: 'Upgrade to Veo Pro',
  },
  NONE: {
    title: '',
    body: '',
    cta: '',
  },
}

/**
 * 获取文案（根据原因和变体）
 */
export function getCopy(reason: Reason, variant: Variant): VeoNudgeCopy {
  const bank = variant === 'A' ? A : B
  return bank[reason] ?? bank.HIGH_ENGAGEMENT
}

