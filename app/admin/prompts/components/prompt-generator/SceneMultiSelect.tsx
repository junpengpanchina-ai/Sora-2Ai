'use client'

import type { ReactNode } from 'react'

export type SceneOption = {
  id: string // UUID
  title?: string | null
  slug?: string | null
  tier?: number | null
  industry?: string | null
}

export function SceneMultiSelect({
  options,
  value,
  onChange,
  max = 8,
  renderPrefix,
}: {
  options: SceneOption[]
  value: string[]
  onChange: (next: string[]) => void
  max?: number
  renderPrefix?: ReactNode
}) {
  function toggle(id: string) {
    const set = new Set(value)
    if (set.has(id)) set.delete(id)
    else {
      if (set.size >= max) return
      set.add(id)
    }
    onChange(Array.from(set))
  }

  return (
    <div className="space-y-2">
      {renderPrefix}
      <div className="text-sm text-muted-foreground">Select scenes (UUID). Max {max}.</div>

      <div className="grid gap-2 md:grid-cols-2">
        {options.map((s) => {
          const checked = value.includes(s.id)
          const title = s.title || s.slug || s.id
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => toggle(s.id)}
              className={[
                'rounded-lg border px-3 py-2 text-left text-sm',
                checked ? 'bg-muted/60' : 'bg-background',
              ].join(' ')}
              title={s.id}
            >
              <div className="font-medium">{title}</div>
              <div className="text-xs text-muted-foreground">
                {s.slug ? `/${s.slug}` : ''} {typeof s.tier === 'number' ? ` · Tier ${s.tier}` : ''}{' '}
                {s.industry ? ` · ${s.industry}` : ''}
              </div>
              <div className="mt-1 text-[10px] text-muted-foreground truncate">{s.id}</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

