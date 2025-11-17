export const PROMPT_CATEGORIES = [
  'nature',
  'character',
  'action',
  'scenery',
  'abstract',
  'cinematic',
] as const

export type PromptCategory = (typeof PROMPT_CATEGORIES)[number]

export const PROMPT_DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const
export type PromptDifficulty = (typeof PROMPT_DIFFICULTIES)[number]

export const PROMPT_LOCALES = ['zh', 'en'] as const
export type PromptLocale = (typeof PROMPT_LOCALES)[number]

export function isPromptCategory(value: unknown): value is PromptCategory {
  return typeof value === 'string' && PROMPT_CATEGORIES.includes(value as PromptCategory)
}

export function isPromptDifficulty(value: unknown): value is PromptDifficulty {
  return typeof value === 'string' && PROMPT_DIFFICULTIES.includes(value as PromptDifficulty)
}

export function isPromptLocale(value: unknown): value is PromptLocale {
  return typeof value === 'string' && PROMPT_LOCALES.includes(value as PromptLocale)
}

export function normalizeTags(tags: unknown): string[] {
  if (Array.isArray(tags)) {
    return tags
      .map((tag) => (typeof tag === 'string' ? tag.trim() : ''))
      .filter((tag) => tag.length > 0)
  }

  if (typeof tags === 'string') {
    return tags
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)
  }

  return []
}


