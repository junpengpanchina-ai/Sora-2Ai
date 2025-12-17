/**
 * 博客文章文本解析工具
 */

import { cleanValue, extractFieldValue, extractArrayField } from './common'

export interface ParsedBlogData {
  slug?: string
  title?: string
  description?: string
  h1?: string
  content?: string
  published_at?: string
  isPublished?: boolean
  related_posts?: string[]
  seo_keywords?: string[]
}

/**
 * 解析博客文章文本
 */
export function parseBlogText(inputText: string): ParsedBlogData {
  const parsed: ParsedBlogData = {}
  
  // 提取 slug
  const slug = extractFieldValue(inputText, [
    'slug', 'URL别名', 'url alias', 'URL', 'url',
    '别名', 'alias', '路径', 'path'
  ])
  if (slug) parsed.slug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-')
  
  // 提取 title
  const title = extractFieldValue(inputText, [
    'title', '标题', 'Title', '页面标题', 'page title',
    '文章标题', 'article title', 'post title'
  ])
  if (title) parsed.title = title
  
  // 提取 description
  const description = extractFieldValue(inputText, [
    'description', '描述', 'Description', '元描述', 'meta description',
    '摘要', 'summary', '简介', 'introduction'
  ])
  if (description) parsed.description = description
  
  // 提取 h1
  const h1 = extractFieldValue(inputText, [
    'h1', 'H1', 'H1标题', 'h1 title', '主标题', 'main heading'
  ])
  if (h1) parsed.h1 = h1
  
  // 提取 content（可能是多行，需要特殊处理）
  const contentLabels = [
    'content', '内容', 'Content', '正文', 'body', '文章内容', 'article content'
  ]
  let content = extractFieldValue(inputText, contentLabels)
  
  // 如果没有找到 content 标签，尝试提取标签后的所有内容
  if (!content) {
    const contentMatch = inputText.match(/(?:content|内容|正文|body|文章内容)[：:]\s*([\s\S]+?)(?=\n\s*(?:slug|title|description|h1|published|related|seo|$))/i)
    if (contentMatch && contentMatch[1]) {
      content = cleanValue(contentMatch[1])
    } else {
      // 如果还是没有，尝试提取所有未被其他字段占用的内容
      const lines = inputText.split('\n')
      let contentStart = -1
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toLowerCase()
        if (line.includes('content') || line.includes('内容') || line.includes('正文')) {
          contentStart = i + 1
          break
        }
      }
      if (contentStart >= 0) {
        content = cleanValue(lines.slice(contentStart).join('\n'))
      }
    }
  }
  if (content) parsed.content = content
  
  // 提取 published_at
  const publishedAt = extractFieldValue(inputText, [
    'published_at', 'published', '发布时间', 'publish date', '发布日期', 'date'
  ])
  if (publishedAt) {
    // 尝试解析日期
    const date = new Date(publishedAt)
    if (!isNaN(date.getTime())) {
      parsed.published_at = date.toISOString().split('T')[0]
    }
  }
  
  // 提取 isPublished
  const isPublishedText = extractFieldValue(inputText, [
    'is_published', 'isPublished', 'published', '发布状态', 'publish status', 'status'
  ])
  if (isPublishedText) {
    const lower = isPublishedText.toLowerCase()
    parsed.isPublished = lower.includes('true') || lower.includes('是') || lower.includes('yes') || lower.includes('published')
  }
  
  // 提取 related_posts（数组）
  parsed.related_posts = extractArrayField(inputText, [
    'related_posts', 'related posts', '相关文章', 'related articles', 'related'
  ])
  
  // 提取 seo_keywords（数组）
  parsed.seo_keywords = extractArrayField(inputText, [
    'seo_keywords', 'seo keywords', 'SEO关键词', 'keywords', '关键词', 'tags', '标签'
  ])
  
  return parsed
}

