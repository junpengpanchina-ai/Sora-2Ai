/**
 * URL 生成工具函数
 * 统一管理所有 URL 生成逻辑，确保一致性
 */

/**
 * 获取基础 URL
 */
export function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sora2aivideos.com'
}

/**
 * 生成长尾词页面的 path（用于内链 href）
 * 复发源防护：始终 normalize 后再输出
 */
export function getKeywordPath(slug: string): string {
  const safe = normalizeKeywordSlug(slug || '')
  return `/keywords/${safe}`
}

/**
 * 生成长尾词页面的 URL（用于 HTML 页面、sitemap）
 * 注意：不带 format=xml 参数，这是用户访问的 HTML 页面
 * 复发源防护：始终 normalize 后再输出，避免 keywords-keywords-* 进入 sitemap/内链
 */
export function getKeywordPageUrl(slug: string): string {
  const baseUrl = getBaseUrl()
  return `${baseUrl}${getKeywordPath(slug)}`
}

/**
 * @deprecated 不要使用！format=xml 会导致 GSC 404 错误
 * 如果需要 XML 格式，使用 /api/keywords/[slug].xml 路由
 */
// export function getKeywordXmlUrl - REMOVED to prevent format=xml URLs

/**
 * 规范化 keyword slug
 * - 去掉重复的 keywords- 前缀
 * - 去掉 .xml 后缀
 * - 去掉 format=xml 等查询参数
 */
export function normalizeKeywordSlug(slug: string): string {
  if (!slug) return slug
  
  let normalized = slug
  
  // 去掉 .xml 后缀
  normalized = normalized.replace(/\.xml$/i, '')
  
  // 去掉重复的 keywords- 前缀 (keywords-keywords-xxx → keywords-xxx)
  normalized = normalized.replace(/^(keywords-)+/i, 'keywords-')
  
  return normalized.trim()
}

/**
 * 转义 XML 特殊字符
 */
export function escapeXml(str: string | null | undefined): string {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

