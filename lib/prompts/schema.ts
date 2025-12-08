export const PROMPT_CATEGORIES = [
  'nature',
  'character',
  'action',
  'scenery',
  'abstract',
  'cinematic',
] as const

export type PromptCategory = (typeof PROMPT_CATEGORIES)[number]

export const PROMPT_INTENTS = ['information', 'comparison', 'transaction'] as const
export type PromptIntent = (typeof PROMPT_INTENTS)[number]

// 保持向后兼容的别名
export const PROMPT_DIFFICULTIES = PROMPT_INTENTS
export type PromptDifficulty = PromptIntent

export const PROMPT_LOCALES = ['zh', 'en'] as const
export type PromptLocale = (typeof PROMPT_LOCALES)[number]

export function isPromptCategory(value: unknown): value is PromptCategory {
  return typeof value === 'string' && PROMPT_CATEGORIES.includes(value as PromptCategory)
}

export function isPromptIntent(value: unknown): value is PromptIntent {
  return typeof value === 'string' && PROMPT_INTENTS.includes(value as PromptIntent)
}

export function isPromptDifficulty(value: unknown): value is PromptDifficulty {
  return isPromptIntent(value)
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


