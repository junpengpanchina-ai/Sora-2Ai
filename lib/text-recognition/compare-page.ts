/**
 * 对比页文本解析工具
 */

import { cleanValue, extractFieldValue, extractArrayField } from './common'

export interface ParsedComparePageData {
  slug?: string
  title?: string
  h1?: string
  description?: string
  content?: string
  tool_a_name?: string
  tool_b_name?: string
  comparison_points?: string
  winner?: string
  seo_keywords?: string[]
  isPublished?: boolean
}

/**
 * 解析对比页文本
 */
export function parseComparePageText(inputText: string): ParsedComparePageData {
  const parsed: ParsedComparePageData = {}
  
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
    'content', '内容', 'Content', '正文', 'body', '对比内容', 'comparison content'
  ]
  let content = extractFieldValue(inputText, contentLabels)
  
  // 如果没有找到 content 标签，尝试提取标签后的所有内容
  if (!content) {
    const contentMatch = inputText.match(/(?:content|内容|正文|body)[：:]\s*([\s\S]+?)(?=\n\s*(?:tool_a|tool_b|comparison_points|winner|seo|$))/i)
    if (contentMatch && contentMatch[1]) {
      content = cleanValue(contentMatch[1])
    }
  }
  if (content) parsed.content = content
  
  // 提取 tool_a_name
  const toolA = extractFieldValue(inputText, [
    'tool_a_name', 'tool a', '工具A', 'Tool A', '第一个工具', 'first tool',
    'tool_a', 'toolA', '工具1', 'tool 1'
  ])
  if (toolA) parsed.tool_a_name = toolA
  
  // 提取 tool_b_name
  const toolB = extractFieldValue(inputText, [
    'tool_b_name', 'tool b', '工具B', 'Tool B', '第二个工具', 'second tool',
    'tool_b', 'toolB', '工具2', 'tool 2'
  ])
  if (toolB) parsed.tool_b_name = toolB
  
  // 提取 comparison_points（JSON 数组）
  const comparisonPoints = extractFieldValue(inputText, [
    'comparison_points', 'comparison points', '对比点', '对比项', 'comparison items',
    '对比内容', 'comparison content', 'points', 'points'
  ])
  if (comparisonPoints) {
    // 尝试解析 JSON
    try {
      const parsedPoints = JSON.parse(comparisonPoints)
      if (Array.isArray(parsedPoints)) {
        parsed.comparison_points = JSON.stringify(parsedPoints)
      } else {
        parsed.comparison_points = comparisonPoints
      }
    } catch {
      // 如果不是有效的 JSON，直接使用原始文本
      parsed.comparison_points = comparisonPoints
    }
  }
  
  // 提取 winner
  const winner = extractFieldValue(inputText, [
    'winner', '获胜者', 'Winner', '胜出', '最佳', 'best', '推荐', 'recommended'
  ])
  if (winner) {
    const lower = winner.toLowerCase()
    if (lower.includes('tool_a') || lower.includes('工具a') || lower.includes('tool a') || lower.includes('a')) {
      parsed.winner = 'tool_a'
    } else if (lower.includes('tool_b') || lower.includes('工具b') || lower.includes('tool b') || lower.includes('b')) {
      parsed.winner = 'tool_b'
    } else if (lower.includes('tie') || lower.includes('平局') || lower.includes('平手') || lower.includes('both')) {
      parsed.winner = 'tie'
    } else {
      parsed.winner = winner.toLowerCase()
    }
  }
  
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

