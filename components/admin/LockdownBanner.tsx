'use client'

import type { LockdownPhase } from '@/types/admin-lockdown'

/**
 * Admin 顶部【强制 Banner】— 不可关闭、不可隐藏、不随路由变化。
 * 所有 Admin 页面顶部都显示。
 */
export function LockdownBanner({ phase }: { phase: LockdownPhase }) {
  return (
    <div className="sticky top-0 z-50 w-full border-b border-neutral-800 bg-neutral-950 px-6 py-3">
      <div className="mx-auto max-w-7xl text-sm text-neutral-200">
        <strong>Current Phase:</strong> {phase} · Architecture completed. Waiting for Google / LLM trust ramp.
        <span className="ml-2 text-neutral-400">Expansion is blocked by design.</span>
      </div>
    </div>
  )
}
