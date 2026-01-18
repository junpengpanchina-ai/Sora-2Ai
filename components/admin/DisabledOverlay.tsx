'use client'

/**
 * phase ≠ EXPAND 时覆盖 Content/Sitemap/Merge 等页面，
 * 用户连点的机会都没有。
 */
export function DisabledOverlay() {
  return (
    <div className="absolute inset-0 z-40 flex h-full min-h-[240px] items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="max-w-md px-6 text-center text-sm">
        <p className="font-semibold text-neutral-200">LOCKDOWN MODE</p>
        <p className="mt-2 text-neutral-400">
          Expansion is intentionally disabled. Wait for Google trust ramp completion.
        </p>
      </div>
    </div>
  )
}
