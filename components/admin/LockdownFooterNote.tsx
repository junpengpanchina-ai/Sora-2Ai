export function LockdownFooterNote() {
  return (
    <div className="mt-4 text-xs text-white/50">
      <span className="font-medium text-white/60">Owner Decision Only.</span> This system is designed to block premature actions. No expansion is allowed unless the system explicitly turns GREEN.
      <br />
      本面板用于防止结构性误操作。只有当抓取量与索引稳定后，才允许继续扩展。只有 Owner 可解除 Lockdown；任何人不得擅自扩展。结论以状态条为准，系统不提供扩展入口。
      <br />
      <span className="italic text-white/40">不是你不允许自己动，是系统不允许你动。</span>
    </div>
  )
}
