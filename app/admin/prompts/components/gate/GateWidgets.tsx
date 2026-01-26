'use client'

import { Badge, Progress } from '@/components/ui'

export type GateColor = 'RED' | 'YELLOW' | 'GREEN'
export type LtvGateColor = 'RED' | 'YELLOW' | 'GREEN'
export type LifecycleRecommendation = 'HARD_KILL' | 'FREEZE' | 'PROMOTE' | 'KEEP'

function progressVariant(color?: GateColor | null): 'default' | 'success' | 'warning' | 'error' {
  if (color === 'GREEN') return 'success'
  if (color === 'YELLOW') return 'warning'
  if (color === 'RED') return 'error'
  return 'default'
}

export function GateColorBadge(props: { color?: GateColor | null; title?: string }) {
  const { color, title } = props
  if (!color) return null
  const className =
    color === 'GREEN'
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      : color === 'YELLOW'
        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  return (
    <span title={title}>
      <Badge className={className}>Gate {color}</Badge>
    </span>
  )
}

export function LtvGateBadge(props: { color?: LtvGateColor | null; title?: string }) {
  const { color, title } = props
  if (!color) return null
  const className =
    color === 'GREEN'
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      : color === 'YELLOW'
        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  return (
    <span title={title}>
      <Badge className={className}>LTV {color}</Badge>
    </span>
  )
}

export function LifecycleBadge(props: { rec?: LifecycleRecommendation | null; title?: string }) {
  const { rec, title } = props
  if (!rec || rec === 'KEEP') return null
  const className =
    rec === 'PROMOTE'
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      : rec === 'FREEZE'
        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  const label = rec === 'HARD_KILL' ? 'Hard Kill' : rec === 'FREEZE' ? 'Freeze' : 'Promote'
  return (
    <span title={title}>
      <Badge className={className}>{label}</Badge>
    </span>
  )
}

export function AssetBadges(props: {
  isActive?: boolean | null
  freezeUntil?: string | null
  topPrompt?: boolean | null
  killReason?: string | null
}) {
  const { isActive, freezeUntil, topPrompt, killReason } = props
  const frozen = freezeUntil ? new Date(freezeUntil).getTime() > Date.now() : false
  return (
    <>
      {topPrompt ? (
        <span title="Only top_prompt can enter Scene Draft">
          <Badge className="bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-100">★ Top</Badge>
        </span>
      ) : null}
      {isActive === false ? (
        <span title={killReason ? `kill_reason: ${killReason}` : 'inactive'}>
          <Badge variant="error">Inactive</Badge>
        </span>
      ) : frozen ? (
        <span title={`Frozen until ${new Date(freezeUntil as string).toLocaleString()}`}>
          <Badge variant="warning">Frozen</Badge>
        </span>
      ) : (
        <Badge variant="success">Active</Badge>
      )}
    </>
  )
}

export function GateScoreBar(props: {
  score?: number | null
  color?: GateColor | null
  title?: string
}) {
  const { score, color, title } = props
  if (typeof score !== 'number') return null
  const pct = Math.max(0, Math.min(100, score * 100))
  return (
    <span title={title} className="inline-block w-full">
      <Progress value={pct} max={100} size="sm" variant={progressVariant(color)} />
    </span>
  )
}

