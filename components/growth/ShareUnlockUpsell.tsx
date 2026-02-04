'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Events } from '@/lib/analytics/events'

interface ShareUnlockUpsellProps {
  userId?: string
  taskId: string
  /** 解锁过期时间（ISO string） */
  expiresAt: string | null
  /** 是否已下载过（触发二跳的时机之一） */
  hasDownloaded?: boolean
  /** 关闭回调 */
  onDismiss?: () => void
}

/**
 * Share-Unlock → 付费二跳文案
 * 
 * 触发时机：
 * 1. 完成一次 share-unlock 去水印下载
 * 2. unlock 即将过期（剩 < 2 分钟）
 * 
 * 原则：不羞辱用户，强调"体验差异 + 连续性"
 */
export default function ShareUnlockUpsell({
  userId,
  taskId, // eslint-disable-line @typescript-eslint/no-unused-vars
  expiresAt,
  hasDownloaded = false,
  onDismiss,
}: ShareUnlockUpsellProps) {
  const [show, setShow] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)

  useEffect(() => {
    if (!expiresAt) return

    const checkExpiry = () => {
      const now = Date.now()
      const exp = new Date(expiresAt).getTime()
      const remaining = Math.max(0, exp - now)
      const remainingMin = Math.floor(remaining / 60000)

      // 显示条件：已下载 或 剩余 < 2 分钟
      if (hasDownloaded || remainingMin < 2) {
        setShow(true)
        setTimeRemaining(remainingMin)
      }
    }

    checkExpiry()
    const interval = setInterval(checkExpiry, 30000) // 每 30 秒检查

    return () => clearInterval(interval)
  }, [expiresAt, hasDownloaded])

  if (!show) return null

  const handleUpgrade = () => {
    Events.upgradeClick(userId, 'share_unlock_upsell')
    onDismiss?.()
  }

  const handleDismiss = () => {
    Events.upgradeClick(userId, 'share_unlock_upsell_dismiss')
    setShow(false)
    onDismiss?.()
  }

  return (
    <div className="mt-4 rounded-xl border border-energy-water/30 bg-gradient-to-br from-energy-water/10 to-energy-water/5 p-4 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-white">
            Want this quality every time?
          </h3>
          <p className="mt-1 text-xs text-gray-300 leading-relaxed">
            You&apos;ve unlocked one clean export by sharing.
            <br />
            Upgrade to remove watermarks on all videos, anytime.
          </p>
          {timeRemaining !== null && timeRemaining < 2 && (
            <p className="mt-1 text-xs text-energy-water/80">
              Your unlock expires in {timeRemaining} minute{timeRemaining !== 1 ? 's' : ''}.
            </p>
          )}
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
        <Link
          href="/pricing?from=share_unlock_upsell"
          onClick={handleUpgrade}
          className="inline-flex items-center gap-2 rounded-lg bg-energy-water px-4 py-2 text-xs font-semibold text-white hover:bg-energy-water/90 transition-colors"
        >
          Upgrade for unlimited exports
        </Link>
        <button
          onClick={handleDismiss}
          className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-xs font-medium text-gray-300 hover:bg-white/10 transition-colors"
        >
          Continue with watermark
        </button>
      </div>
    </div>
  )
}

/**
 * 轻量版二跳文案（放在下载成功 toast 下方）
 */
export function ShareUnlockUpsellLight({ userId, onUpgrade }: { userId?: string; onUpgrade?: () => void }) {
  return (
    <p className="mt-2 text-xs text-gray-400 text-center">
      This was a one-time unlock.{' '}
      <Link
        href="/pricing?from=share_unlock_light"
        onClick={() => {
          Events.upgradeClick(userId, 'share_unlock_light')
          onUpgrade?.()
        }}
        className="text-energy-water hover:underline"
      >
        Upgrade to export watermark-free videos anytime.
      </Link>
    </p>
  )
}
