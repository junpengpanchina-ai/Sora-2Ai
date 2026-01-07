'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { track } from '@/lib/growth/track'

type Trigger =
  | 'AFTER_SORA_2'
  | 'REMIX_3'
  | 'EXPORT_CLICK'
  | 'BONUS_NEAR_EMPTY'

interface VeoUpgradeNudgeProps {
  soraRenders7d: number
  remixSamePrompt24h: number
  bonusUsageRatio: number // 0..1
  onUpgradeToVeoPro: () => void
  onDismiss: () => void
  exportIntent?: boolean
  prompt?: string
  aspectRatio?: string
}

const COPY: Record<Trigger, { title: string; body: string; cta: string }> = {
  AFTER_SORA_2: {
    title: 'Want a higher-fidelity version of the same scene?',
    body: 'Many creators draft ideas with Sora, then upgrade the best take for a more realistic final cut.',
    cta: 'Upgrade this render to Veo Pro',
  },
  REMIX_3: {
    title: 'This looks ready for a final export',
    body: 'If motion and realism matter for publishing, Veo Pro is commonly used for the final version.',
    cta: 'Render once in Veo Pro',
  },
  EXPORT_CLICK: {
    title: 'Before you export',
    body: 'Some teams draft with Sora and export the final in Veo Pro for the best result.',
    cta: 'Final export with Veo Pro',
  },
  BONUS_NEAR_EMPTY: {
    title: 'Keep creating without interruptions',
    body: 'Your bonus window is nearly used. A Creator pack keeps credits permanently, with extra bonus for the next days.',
    cta: 'Get Creator (Recommended)',
  },
}

function pickTrigger(p: VeoUpgradeNudgeProps): Trigger | null {
  if (p.exportIntent) return 'EXPORT_CLICK'
  if (p.remixSamePrompt24h >= 3) return 'REMIX_3'
  if (p.soraRenders7d >= 2 && p.soraRenders7d < 3) return 'AFTER_SORA_2'
  if (p.bonusUsageRatio >= 0.8) return 'BONUS_NEAR_EMPTY'
  return null
}

/**
 * Veo 升级提示组件（无感升级）
 * 
 * 触发点：
 * - AFTER_SORA_2: 完成第 2 次 Sora 生成后
 * - REMIX_3: 同一提示词 remix ≥3 次
 * - EXPORT_CLICK: 点击下载/分享时
 * - BONUS_NEAR_EMPTY: Bonus 积分使用 ≥80%
 */
export default function VeoUpgradeNudge(props: VeoUpgradeNudgeProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const trigger = useMemo(() => pickTrigger(props), [
    props.soraRenders7d,
    props.remixSamePrompt24h,
    props.bonusUsageRatio,
    props.exportIntent,
  ])

  useEffect(() => {
    if (!trigger) return

    // 埋点：显示提示
    track('upgrade_nudge_shown', {
      trigger_type: trigger,
      sora_renders_7d: props.soraRenders7d,
      remix_count_24h: props.remixSamePrompt24h,
      bonus_usage_ratio: props.bonusUsageRatio,
    })

    setOpen(true)
  }, [trigger, props])

  if (!open || !trigger) return null

  const copy = COPY[trigger]

  const handleUpgrade = () => {
    // 埋点：点击升级
    track('upgrade_nudge_clicked', {
      trigger_type: trigger,
      action: 'upgrade',
    })

    if (trigger === 'BONUS_NEAR_EMPTY') {
      // 跳转到定价页面
      router.push('/?pricing=1')
    } else {
      // 跳转到 Veo Pro 生成页面，携带当前 prompt
      const params = new URLSearchParams()
      if (props.prompt) params.set('prompt', props.prompt)
      if (props.aspectRatio) params.set('aspect', props.aspectRatio)
      params.set('model', 'veo-pro')
      router.push(`/video?${params.toString()}`)
    }

    props.onUpgradeToVeoPro()
    setOpen(false)
  }

  const handleDismiss = () => {
    // 埋点：关闭提示
    track('upgrade_nudge_dismissed', {
      trigger_type: trigger,
    })

    props.onDismiss()
    setOpen(false)
  }

  return (
    <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="text-sm font-semibold text-white">{copy.title}</div>
          <div className="mt-1 text-sm text-white/80 leading-relaxed">{copy.body}</div>
        </div>
        <button
          className="flex-shrink-0 text-xs text-white/60 hover:text-white/80 transition-colors"
          onClick={handleDismiss}
          aria-label="Dismiss"
        >
          Not now
        </button>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          className="flex-1 rounded-xl bg-gradient-to-r from-[#1f75ff] to-[#3f8cff] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          onClick={handleUpgrade}
        >
          {copy.cta}
        </button>

        {trigger !== 'BONUS_NEAR_EMPTY' && (
          <button
            className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/80 hover:bg-white/5 transition-colors"
            onClick={() => {
              router.push('/?pricing=1')
              handleDismiss()
            }}
          >
            See plans
          </button>
        )}
      </div>
    </div>
  )
}

