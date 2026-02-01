/**
 * Sitemap 门禁：发现 bad keyword slugs 时报警，CI 可严格 fail
 */
import { isBadKeywordSlug } from '@/lib/keywords/bad-slugs'

const BAD_PREFIX_PATTERN = /^(keywords-){2,}/i

export function assertNoBadKeywordSlugs(slugs: string[], ctx: { source: string }): void {
  const bad = slugs.filter((s) => s && isBadKeywordSlug(s))
  if (bad.length === 0) return

  const sample = bad.slice(0, 20)
  console.error('[sitemap-guard] bad keyword slugs detected', {
    source: ctx.source,
    count: bad.length,
    sample,
  })

  if (process.env.SITEMAP_STRICT_ASSERT === '1') {
    throw new Error(`[sitemap-guard] bad keyword slugs detected: ${bad.length}`)
  }
}

/** Normalize 后仍含重复前缀的 slug 应被 drop（保险） */
export function filterBadKeywordSlugs(slugs: string[]): string[] {
  return slugs.filter((s) => !s || !BAD_PREFIX_PATTERN.test(s))
}
