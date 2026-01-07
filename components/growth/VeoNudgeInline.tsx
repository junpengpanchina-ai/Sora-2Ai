'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { decideVeoHint, type VeoIntentInput } from '@/lib/growth/veoIntent'
import { assignVariant, getStableBucketingId } from '@/lib/growth/ab'
import { canShowHint, markDismiss, markShown } from '@/lib/growth/frequency'
import { track } from '@/lib/growth/track'
import { getCopy } from '@/components/growth/veoNudgeCopy'

export interface VeoNudgeInlineProps {
  userId?: string
  sessionId: string
  input: VeoIntentInput
  // 把 Sora 的 prompt/seed 带过去，保证"同一想法更好版本"
  payload?: {
    prompt?: string
    aspect?: string
    style?: string
  }
}

/**
 * Veo 无感提示组件（Inline，不弹窗）
 * 
 * 显示位置：Sora 结果页，Answer-first 下面，"下载/分享/再生成"按钮附近
 */
export default function VeoNudgeInline({
  userId,
  sessionId,
  input,
  payload,
}: VeoNudgeInlineProps) {
  const decision = useMemo(() => decideVeoHint(input), [input])
  const [open, setOpen] = useState(false)

  const bucketId = useMemo(() => getStableBucketingId(userId), [userId])
  const variant = useMemo(() => assignVariant(bucketId, 'exp_veo_nudge_v1'), [bucketId])

  useEffect(() => {
    if (!decision.show) return
    if (!canShowHint(sessionId)) return

    setOpen(true)
    markShown(sessionId)

    track('veo_nudge_shown', {
      reason: decision.reason,
      score: decision.score,
      plan: input.userPlan,
      variant,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decision.show, sessionId])

  if (!open) return null

  const copy = getCopy(decision.reason, variant)

  // 构建 Veo 跳转 URL（携带参数）
  const veoUrl = (() => {
    const p = new URLSearchParams()
    p.set('from', 'sora')
    if (payload?.prompt) p.set('prompt', payload.prompt)
    if (payload?.aspect) p.set('aspect', payload.aspect)
    if (payload?.style) p.set('style', payload.style)
    return `/veo-pro?${p.toString()}`
  })()

  const handleDismiss = () => {
    setOpen(false)
    markDismiss(decision.reason)
    track('veo_nudge_dismiss', {
      reason: decision.reason,
      score: decision.score,
      variant,
    })
  }

  const handlePrimaryClick = () => {
    track('veo_nudge_click', {
      where: 'primary',
      reason: decision.reason,
      variant,
    })
  }

  const handlePricingClick = () => {
    track('veo_nudge_click', {
      where: 'pricing',
      reason: decision.reason,
      variant,
    })
  }

  return (
    <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="text-sm font-semibold text-white">{copy.title}</div>
          <p className="mt-1 text-sm text-white/80 leading-relaxed">{copy.body}</p>
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
        <a
          className="rounded-xl bg-gradient-to-r from-[#1f75ff] to-[#3f8cff] text-white px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
          href={veoUrl}
          onClick={handlePrimaryClick}
        >
          {copy.cta}
        </a>

        <a
          className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/80 hover:bg-white/5 transition-colors"
          href="/?pricing=1#veo"
          onClick={handlePricingClick}
        >
          See plans
        </a>
      </div>

      {copy.note && (
        <div className="mt-2 text-xs text-white/50 italic">{copy.note}</div>
      )}
    </div>
  )
}

