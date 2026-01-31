/**
 * Bad keyword slugs: return 410 to stop Google wasting crawl on these URLs.
 * Gate rule: never let crawler see 500. These slugs cause 5xx → treat as retired.
 *
 * - Double+ prefix (keywords-keywords-...): malformed, off-by-one generation bug
 * - Overlong slugs: can trigger edge/server limits
 */
const BAD_SLUG_PATTERN = /^(keywords-){2,}/i
const MAX_SLUG_LENGTH = 200

export function isBadKeywordSlug(slug: string): boolean {
  if (!slug || typeof slug !== 'string') return true
  const s = slug.trim()
  if (s.length === 0 || s.length > MAX_SLUG_LENGTH) return true
  return BAD_SLUG_PATTERN.test(s)
}
