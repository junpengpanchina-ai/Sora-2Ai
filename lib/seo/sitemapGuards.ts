/**
 * Sitemap 门禁：发现 bad keyword slugs 时报警，CI 可严格 fail
 * 同时过滤掉带 prompt 参数的 URL（避免重定向消耗 crawl budget）
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

/**
 * 过滤掉带 prompt 参数的 URL（避免重定向消耗 crawl budget）
 * P1: sitemap 永远不要吐出会重定向的 URL
 */
export function filterUrlsWithPromptParam(urls: string[]): string[] {
  return urls.filter((url) => {
    if (!url || typeof url !== 'string') return false
    try {
      const urlObj = new URL(url, 'https://sora2aivideos.com')
      // 过滤掉带 prompt 参数的 URL
      if (urlObj.searchParams.has('prompt')) {
        console.warn('[sitemap-guard] Filtered URL with prompt param:', url)
        return false
      }
      return true
    } catch {
      // 如果 URL 解析失败，保留（让其他逻辑处理）
      return true
    }
  })
}

/**
 * 断言 sitemap URL 不包含会重定向的 pattern
 */
export function assertNoRedirectPatterns(urls: string[], ctx: { source: string }): void {
  const bad: string[] = []
  
  for (const url of urls) {
    if (!url || typeof url !== 'string') continue
    try {
      const urlObj = new URL(url, 'https://sora2aivideos.com')
      // 检查 prompt 参数
      if (urlObj.searchParams.has('prompt')) {
        bad.push(url)
      }
      // 检查 format=xml 参数
      if (urlObj.searchParams.get('format') === 'xml') {
        bad.push(url)
      }
    } catch {
      // 忽略解析失败的 URL
    }
  }

  if (bad.length === 0) return

  const sample = bad.slice(0, 20)
  console.error('[sitemap-guard] URLs with redirect patterns detected', {
    source: ctx.source,
    count: bad.length,
    sample,
  })

  if (process.env.SITEMAP_STRICT_ASSERT === '1') {
    throw new Error(`[sitemap-guard] URLs with redirect patterns detected: ${bad.length}`)
  }
}
