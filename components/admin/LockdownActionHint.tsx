import type { LockdownStatus } from '@/types/admin-lockdown'

export function LockdownActionHint({ status }: { status: LockdownStatus }) {
  if (status === 'EXPAND') {
    return (
      <div className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm">
        ✅ 允许动作：
        <br />
        · 每个 use_case_type +3–5 个主 Scene
        <br />
        · 运行合并脚本（不改阈值）
        <br />
        · 须 Owner 确认后执行，系统不自动扩展
      </div>
    )
  }

  if (status === 'STOP') {
    return (
      <div className="rounded-lg border border-red-400/30 bg-red-400/10 p-4 text-sm">
        ❌ 已触发风险：
        <br />
        · 只允许修 sitemap / canonical / redirect
        <br />
        · 禁止新增 Scene / URL
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-yellow-400/30 bg-yellow-400/10 p-4 text-sm">
      ⏳ Google 正在消化结构。
      <br />
      当前最优策略：什么都不做，7 天后再看。
    </div>
  )
}
