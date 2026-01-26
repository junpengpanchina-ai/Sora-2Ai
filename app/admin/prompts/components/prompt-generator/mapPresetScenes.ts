'use client'

import type { SceneOption } from './SceneMultiSelect'

export function mapSceneSlugsToIds(
  sceneOptions: SceneOption[],
  slugs: string[]
): { ids: string[]; missing: string[] } {
  const bySlug = new Map<string, string>()
  for (const s of sceneOptions) {
    if (s.slug) bySlug.set(s.slug, s.id)
  }

  const ids: string[] = []
  const missing: string[] = []
  for (const slug of slugs) {
    const id = bySlug.get(slug)
    if (id) ids.push(id)
    else missing.push(slug)
  }

  return { ids, missing }
}

