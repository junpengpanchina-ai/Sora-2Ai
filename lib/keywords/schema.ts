export const KEYWORD_INTENTS = ['information', 'comparison', 'transaction'] as const
export type KeywordIntent = (typeof KEYWORD_INTENTS)[number]

export const KEYWORD_INTENT_LABELS: Record<KeywordIntent, string> = {
  information: 'Informational',
  comparison: 'Comparison',
  transaction: 'Transactional',
}

export const KEYWORD_STATUSES = ['draft', 'published'] as const
export type KeywordStatus = (typeof KEYWORD_STATUSES)[number]

export interface KeywordStep {
  title: string
  description?: string
}

export interface KeywordFaqItem {
  question: string
  answer: string
}

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0

export function isKeywordIntent(value: unknown): value is KeywordIntent {
  return typeof value === 'string' && KEYWORD_INTENTS.includes(value as KeywordIntent)
}

export function isKeywordStatus(value: unknown): value is KeywordStatus {
  return typeof value === 'string' && KEYWORD_STATUSES.includes(value as KeywordStatus)
}

export function normalizeSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function normalizeSteps(value: unknown): KeywordStep[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => {
      if (typeof item === 'string') {
        const text = item.trim()
        if (!text) {
          return null
        }
        return { title: text }
      }
      if (!item || typeof item !== 'object') {
        return null
      }
      const record = item as Record<string, unknown>
      const title = isNonEmptyString(record.title) ? record.title.trim() : null
      const description = isNonEmptyString(record.description)
        ? record.description.trim()
        : isNonEmptyString(record.text)
          ? record.text.trim()
          : null

      if (!title && !description) {
        return null
      }

      return {
        title: title ?? (description ? description.slice(0, 48) : 'Step'),
        description: description ?? undefined,
      }
    })
    .filter((item): item is KeywordStep => Boolean(item))
}

export function normalizeFaq(value: unknown): KeywordFaqItem[] {
  if (!Array.isArray(value)) {
    return []
  }
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null
      }
      const record = item as Record<string, unknown>
      const question = isNonEmptyString(record.question)
        ? record.question.trim()
        : isNonEmptyString(record.q)
          ? record.q.trim()
          : null
      const answer = isNonEmptyString(record.answer)
        ? record.answer.trim()
        : isNonEmptyString(record.a)
          ? record.a.trim()
          : null

      if (!question || !answer) {
        return null
      }

      return { question, answer }
    })
    .filter((item): item is KeywordFaqItem => Boolean(item))
}


