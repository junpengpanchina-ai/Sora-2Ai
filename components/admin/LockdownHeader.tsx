import type { LockdownPhase } from '@/types/admin-lockdown'

const PHASE_MAP: Record<LockdownPhase, { label: string; color: string }> = {
  LOCKDOWN: { label: '🔒 锁仓期', color: 'text-neutral-400' },
  HOLD: { label: '🟡 继续静置', color: 'text-yellow-400' },
  EXPAND: { label: '🟢 可扩展', color: 'text-emerald-400' },
  STOP: { label: '🔴 必须停', color: 'text-red-400' },
}

export function LockdownHeader({
  phase,
  lastUpdated,
}: {
  phase: LockdownPhase
  lastUpdated: string
}) {
  const meta = PHASE_MAP[phase]

  return (
    <div className="mb-4">
      <div className={`text-lg font-semibold ${meta.color}`}>{meta.label}</div>
      <div className="mt-1 text-sm text-white/60">
        当前阶段：{phase} · 最近更新 {lastUpdated}
      </div>
      <div className="mt-1 text-xs text-white/40">
        Expansion is blocked by design. No expansion unless system turns GREEN.
      </div>
    </div>
  )
}
