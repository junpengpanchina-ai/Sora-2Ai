/**
 * 生成 URL slug
 */
export function generateSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * 从标题或关键词生成 slug
 * 限制最大长度为 100 字符，避免文件系统错误
 */
export function generateSlugFromText(text: string): string {
  if (!text || typeof text !== 'string') {
    return ''
  }
  
  // 先截断文本，保留前 150 个字符（生成 slug 后会变短）
  const truncated = text.length > 150 ? text.substring(0, 150) : text
  const slug = generateSlug(truncated)
  
  // 最终限制在 100 字符以内（文件系统安全限制）
  return slug.length > 100 ? slug.substring(0, 100) : slug
}

