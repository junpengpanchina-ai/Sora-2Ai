import type { LockdownStatus } from '@/types/admin-lockdown'

const STATUS_MAP: Record<LockdownStatus, { label: string; color: string }> = {
  EXPAND: { label: '🟢 可扩展', color: 'text-emerald-400' },
  HOLD: { label: '🟡 继续静置', color: 'text-yellow-400' },
  STOP: { label: '🔴 必须停', color: 'text-red-400' },
}

export function LockdownHeader({
  status,
  lastUpdated,
}: {
  status: LockdownStatus
  lastUpdated: string
}) {
  const meta = STATUS_MAP[status]

  return (
    <div className="mb-4">
      <div className={`text-lg font-semibold ${meta.color}`}>{meta.label}</div>
      <div className="mt-1 text-sm text-white/60">
        当前阶段：稳定期（Lockdown） · 最近更新 {lastUpdated}
      </div>
    </div>
  )
}
