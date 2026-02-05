'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Events } from '@/lib/analytics/events'

interface VeoToSoraUpsellProps {
  userId?: string
  /** 是否已通过 share-unlock 下载过 */
  hasDownloadedViaShareUnlock?: boolean
  /** 关闭回调 */
  onDismiss?: () => void
}

/**
 * Veo share-unlock → Sora upsell
 * 
 * 触发时机：
 * 1. 用户完成 "share 解锁 + 无水印下载" 后 2 秒
 * 2. 用户点击 "Generate another" 时（且刚用过 share unlock）
 * 
 * 保护条件：
 * - model_used === 'veo'
 * - duration === 8
 * - download_no_watermark_via_share === true
 * - hasSeenSoraUpsellToday === false
 */
export default function VeoToSoraUpsell({
  userId,
  hasDownloadedViaShareUnlock = false,
  onDismiss,
}: VeoToSoraUpsellProps) {
  const [show, setShow] = useState(false)
  const [hasSeenToday, setHasSeenToday] = useState(false)

  useEffect(() => {
    // 检查今天是否已显示过
    const today = new Date().toDateString()
    const seenKey = `veo_sora_upsell_seen_${today}`
    const seen = localStorage.getItem(seenKey) === 'true'
    setHasSeenToday(seen)

    // 如果已下载且未显示过，延迟 2 秒显示
    if (hasDownloadedViaShareUnlock && !seen) {
      const timer = setTimeout(() => {
        setShow(true)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [hasDownloadedViaShareUnlock])

  if (!show || hasSeenToday) return null

  const handleTrySora = () => {
    const today = new Date().toDateString()
    localStorage.setItem(`veo_sora_upsell_seen_${today}`, 'true')
    Events.upgradeClick(userId, 'veo_to_sora_upsell')
    setShow(false)
    onDismiss?.()
    // 跳转到视频页，自动选择 Sora 10s
    window.location.href = '/video?model=sora-2&duration=10'
  }

  const handleDismiss = () => {
    const today = new Date().toDateString()
    localStorage.setItem(`veo_sora_upsell_seen_${today}`, 'true')
    Events.upgradeClick(userId, 'veo_to_sora_upsell_dismiss')
    setShow(false)
    onDismiss?.()
  }

  return (
    <div className="mt-4 rounded-xl border border-energy-water/30 bg-gradient-to-br from-energy-water/10 to-energy-water/5 p-4 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-white">
            Make it longer with Sora
          </h3>
          <p className="mt-1 text-xs text-gray-300 leading-relaxed">
            Veo is great for quick 8s clips. Sora gives you <strong>10s / 15s</strong> for fuller scenes.
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="shrink-0 text-gray-400 hover:text-white transition-colors"
          aria-label="Dismiss"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={handleTrySora}
          className="inline-flex items-center gap-2 rounded-lg bg-energy-water px-4 py-2 text-xs font-semibold text-white hover:bg-energy-water/90 transition-colors"
        >
          Try Sora (10s)
        </button>
        <button
          onClick={handleDismiss}
          className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-xs font-medium text-gray-300 hover:bg-white/10 transition-colors"
        >
          Not now
        </button>
      </div>
    </div>
  )
}

/**
 * 轻量版：放在 "Generate another" 按钮附近
 */
export function VeoToSoraUpsellInline({ userId, onTrySora, onDismiss }: { userId?: string; onTrySora?: () => void; onDismiss?: () => void }) {
  const [hasSeenToday, setHasSeenToday] = useState(false)

  useEffect(() => {
    const today = new Date().toDateString()
    const seenKey = `veo_sora_upsell_inline_seen_${today}`
    const seen = localStorage.getItem(seenKey) === 'true'
    setHasSeenToday(seen)
  }, [])

  if (hasSeenToday) return null

  const handleTrySora = () => {
    const today = new Date().toDateString()
    localStorage.setItem(`veo_sora_upsell_inline_seen_${today}`, 'true')
    Events.upgradeClick(userId, 'veo_to_sora_upsell_inline')
    onTrySora?.()
    window.location.href = '/video?model=sora-2&duration=10'
  }

  const handleDismiss = () => {
    const today = new Date().toDateString()
    localStorage.setItem(`veo_sora_upsell_inline_seen_${today}`, 'true')
    Events.upgradeClick(userId, 'veo_to_sora_upsell_inline_dismiss')
    onDismiss?.()
  }

  return (
    <div className="mt-3 rounded-lg border border-white/15 bg-white/5 p-3 text-center">
      <p className="text-xs text-gray-300">
        You unlocked a clean export by sharing.
        <br />
        Upgrade to export watermark-free anytime — or try Sora for <strong>10s / 15s</strong>.
      </p>
      <div className="mt-2 flex flex-wrap gap-2 justify-center">
        <button
          onClick={handleTrySora}
          className="px-4 py-1.5 rounded-lg bg-energy-water text-xs font-semibold text-white hover:bg-energy-water/90 transition-colors"
        >
          Try Sora 10s
        </button>
        <Link
          href="/pricing?from=share_unlock_upsell"
          onClick={handleDismiss}
          className="px-4 py-1.5 rounded-lg border border-white/20 bg-white/5 text-xs font-medium text-gray-300 hover:bg-white/10 transition-colors"
        >
          Upgrade
        </Link>
      </div>
    </div>
  )
}
