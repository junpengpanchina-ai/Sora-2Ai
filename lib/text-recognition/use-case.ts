/**
 * 使用场景文本解析工具
 */

import { cleanValue, extractFieldValue, extractArrayField } from './common'

export interface ParsedUseCaseData {
  slug?: string
  title?: string
  h1?: string
  description?: string
  content?: string
  use_case_type?: string
  featured_prompt_ids?: string[]
  related_use_case_ids?: string[]
  seo_keywords?: string[]
  isPublished?: boolean
}

const USE_CASE_TYPES = [
  'marketing', 'social-media', 'youtube', 'tiktok', 
  'instagram', 'twitter',
  'product-demo', 'ads', 'education', 'other'
]

/**
 * 解析使用场景文本
 */
export function parseUseCaseText(inputText: string): ParsedUseCaseData {
  const parsed: ParsedUseCaseData = {}
  
  // 提取 slug
  const slug = extractFieldValue(inputText, [
    'slug', 'URL别名', 'url alias', 'URL', 'url',
    '别名', 'alias', '路径', 'path'
  ])
  if (slug) parsed.slug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-')
  
  // 提取 title
  const title = extractFieldValue(inputText, [
    'title', '标题', 'Title', '页面标题', 'page title'
  ])
  if (title) parsed.title = title
  
  // 提取 h1
  const h1 = extractFieldValue(inputText, [
    'h1', 'H1', 'H1标题', 'h1 title', '主标题', 'main heading'
  ])
  if (h1) parsed.h1 = h1
  
  // 提取 description
  const description = extractFieldValue(inputText, [
    'description', '描述', 'Description', '元描述', 'meta description',
    '摘要', 'summary', '简介', 'introduction'
  ])
  if (description) parsed.description = description
  
  // 提取 content（可能是多行，需要特殊处理）
  const contentLabels = [
    'content', '内容', 'Content', '正文', 'body', '场景内容', 'use case content'
  ]
  let content = extractFieldValue(inputText, contentLabels)
  
  // 如果没有找到 content 标签，尝试提取标签后的所有内容
  if (!content) {
    const contentMatch = inputText.match(/(?:content|内容|正文|body)[：:]\s*([\s\S]+?)(?=\n\s*(?:use_case_type|featured|related|seo|$))/i)
    if (contentMatch && contentMatch[1]) {
      content = cleanValue(contentMatch[1])
    }
  }
  if (content) parsed.content = content
  
  // 提取 use_case_type
  const useCaseType = extractFieldValue(inputText, [
    'use_case_type', 'use case type', '类型', 'Type', '场景类型', 'scenario type'
  ])
  if (useCaseType) {
    const lower = useCaseType.toLowerCase().replace(/[^a-z-]/g, '')
    const matched = USE_CASE_TYPES.find(type => 
      lower.includes(type) ||
      (type === 'marketing' && lower.includes('marketing')) ||
      (type === 'social-media' && (lower.includes('social') || lower.includes('media'))) ||
      (type === 'youtube' && lower.includes('youtube')) ||
      (type === 'tiktok' && lower.includes('tiktok')) ||
      (type === 'instagram' && lower.includes('instagram')) ||
      (type === 'twitter' && (lower.includes('twitter') || lower.includes('x'))) ||
      (type === 'product-demo' && (lower.includes('product') || lower.includes('demo'))) ||
      (type === 'ads' && (lower.includes('ads') || lower.includes('advertising'))) ||
      (type === 'education' && lower.includes('education')) ||
      (type === 'other' && lower.includes('other'))
    )
    if (matched) {
      parsed.use_case_type = matched
    } else {
      parsed.use_case_type = lower
    }
  }
  
  // 提取 featured_prompt_ids（数组）
  parsed.featured_prompt_ids = extractArrayField(inputText, [
    'featured_prompt_ids', 'featured prompts', '推荐提示词', 'featured prompt ids'
  ])
  
  // 提取 related_use_case_ids（数组）
  parsed.related_use_case_ids = extractArrayField(inputText, [
    'related_use_case_ids', 'related use cases', '相关场景', 'related use case ids'
  ])
  
  // 提取 seo_keywords（数组）
  parsed.seo_keywords = extractArrayField(inputText, [
    'seo_keywords', 'seo keywords', 'SEO关键词', 'keywords', '关键词', 'tags', '标签'
  ])
  
  // 提取 isPublished
  const isPublishedText = extractFieldValue(inputText, [
    'is_published', 'isPublished', 'published', '发布状态', 'publish status', 'status'
  ])
  if (isPublishedText) {
    const lower = isPublishedText.toLowerCase()
    parsed.isPublished = lower.includes('true') || lower.includes('是') || lower.includes('yes') || lower.includes('published')
  }
  
  return parsed
}

