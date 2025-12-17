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
 */
export function generateSlugFromText(text: string): string {
  if (!text || typeof text !== 'string') {
    return ''
  }
  return generateSlug(text)
}

