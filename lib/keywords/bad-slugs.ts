/**
 * Keyword slug normalization for 5xx fix.
 * Gate rule: never let crawler see 500. Duplicate prefix → 308 to canonical.
 *
 * - Double+ prefix (keywords-keywords-...): malformed, off-by-one generation bug
 * - Overlong slugs: reject (may trigger edge/server limits)
 */
const BAD_SLUG_PATTERN = /^(keywords-){2,}/i
const MAX_SLUG_LENGTH = 200

export function isBadKeywordSlug(slug: string): boolean {
  if (!slug || typeof slug !== 'string') return true
  const s = slug.trim()
  if (s.length === 0 || s.length > MAX_SLUG_LENGTH) return true
  return BAD_SLUG_PATTERN.test(s)
}

/** Normalize to single keywords- prefix. keywords-keywords-xxx → keywords-xxx */
export function normalizeKeywordSlug(slug: string): string {
  return slug.replace(/^(keywords-)+/i, 'keywords-')
}
