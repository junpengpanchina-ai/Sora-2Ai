import type { LockdownMetric } from '@/types/admin-lockdown'

const STATUS_ICON: Record<LockdownMetric['status'], string> = {
  OK: '✅',
  WARN: '⚠️',
  FAIL: '❌',
}

export function LockdownMetricsTable({ metrics }: { metrics: LockdownMetric[] }) {
  return (
    <table className="mb-4 w-full text-sm">
      <thead className="text-white/50">
        <tr>
          <th className="py-2 text-left">指标</th>
          <th className="text-left">当前</th>
          <th className="text-left">趋势</th>
          <th className="text-left">状态</th>
        </tr>
      </thead>
      <tbody>
        {metrics.map((m) => (
          <tr key={m.key} className="border-t border-white/10">
            <td className="py-2">{m.label}</td>
            <td>{m.value}</td>
            <td>{m.trend ?? '—'}</td>
            <td>{STATUS_ICON[m.status]}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
