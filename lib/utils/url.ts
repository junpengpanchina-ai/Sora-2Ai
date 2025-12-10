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
 * 生成长尾词页面的 URL（用于 HTML 页面）
 * 注意：不带 format=xml 参数，这是用户访问的 HTML 页面
 */
export function getKeywordPageUrl(slug: string): string {
  const baseUrl = getBaseUrl()
  return `${baseUrl}/keywords/${slug}`
}

/**
 * 生成长尾词页面的 XML API URL（用于 API 调用）
 * 注意：这个用于 ?format=xml 场景，不应该在 sitemap 中使用
 */
export function getKeywordXmlUrl(slug: string): string {
  const baseUrl = getBaseUrl()
  return `${baseUrl}/keywords/${slug}?format=xml`
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

