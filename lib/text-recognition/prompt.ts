/**
 * 提示词文本解析工具
 */

import { cleanValue, extractFieldValue, extractArrayField } from './common'

export interface ParsedPromptData {
  title?: string
  description?: string
  prompt?: string
  category?: string
  tags?: string[]
  difficulty?: string
  example?: string
  locale?: string
  isPublished?: boolean
}

const PROMPT_CATEGORIES = ['nature', 'character', 'action', 'scenery', 'abstract', 'cinematic']
const PROMPT_INTENTS = ['information', 'comparison', 'transaction']
const PROMPT_LOCALES = ['zh', 'en']

/**
 * 解析提示词文本
 */
export function parsePromptText(inputText: string): ParsedPromptData {
  const parsed: ParsedPromptData = {}
  
  // 提取 title
  const title = extractFieldValue(inputText, [
    'title', '标题', 'Title', '提示词标题', 'prompt title'
  ])
  if (title) parsed.title = title
  
  // 提取 description
  const description = extractFieldValue(inputText, [
    'description', '描述', 'Description', '简介', 'introduction'
  ])
  if (description) parsed.description = description
  
  // 提取 prompt（提示词内容）
  const promptLabels = [
    'prompt', '提示词', 'Prompt', '内容', 'content', 'prompt text', '提示词内容'
  ]
  let prompt = extractFieldValue(inputText, promptLabels)
  
  // 如果没有找到 prompt 标签，尝试提取标签后的所有内容
  if (!prompt) {
    const promptMatch = inputText.match(/(?:prompt|提示词|内容)[：:]\s*([\s\S]+?)(?=\n\s*(?:category|tags|difficulty|example|locale|$))/i)
    if (promptMatch && promptMatch[1]) {
      prompt = cleanValue(promptMatch[1])
    }
  }
  if (prompt) parsed.prompt = prompt
  
  // 提取 category
  const category = extractFieldValue(inputText, [
    'category', '分类', 'Category', '类别', 'type'
  ])
  if (category) {
    const lower = category.toLowerCase()
    // 尝试匹配已知的分类
    const matched = PROMPT_CATEGORIES.find(cat => 
      lower.includes(cat) || 
      (cat === 'nature' && (lower.includes('自然') || lower.includes('nature'))) ||
      (cat === 'character' && (lower.includes('角色') || lower.includes('character'))) ||
      (cat === 'action' && (lower.includes('动作') || lower.includes('action'))) ||
      (cat === 'scenery' && (lower.includes('场景') || lower.includes('scenery'))) ||
      (cat === 'abstract' && (lower.includes('抽象') || lower.includes('abstract'))) ||
      (cat === 'cinematic' && (lower.includes('电影') || lower.includes('cinematic')))
    )
    if (matched) {
      parsed.category = matched
    } else {
      parsed.category = category.toLowerCase()
    }
  }
  
  // 提取 tags（数组）
  parsed.tags = extractArrayField(inputText, [
    'tags', '标签', 'Tags', 'tag', '关键词', 'keywords'
  ])
  
  // 提取 difficulty
  const difficulty = extractFieldValue(inputText, [
    'difficulty', '难度', 'Difficulty', '意图', 'intent', '类型', 'type'
  ])
  if (difficulty) {
    const lower = difficulty.toLowerCase()
    const matched = PROMPT_INTENTS.find(intent => 
      lower.includes(intent) ||
      (intent === 'information' && (lower.includes('信息') || lower.includes('information'))) ||
      (intent === 'comparison' && (lower.includes('对比') || lower.includes('comparison'))) ||
      (intent === 'transaction' && (lower.includes('交易') || lower.includes('transaction')))
    )
    if (matched) {
      parsed.difficulty = matched
    } else {
      parsed.difficulty = difficulty.toLowerCase()
    }
  }
  
  // 提取 example
  const example = extractFieldValue(inputText, [
    'example', '示例', 'Example', '例子', '样例', 'sample'
  ])
  if (example) parsed.example = example
  
  // 提取 locale
  const locale = extractFieldValue(inputText, [
    'locale', '语言', 'Locale', 'Language', 'lang'
  ])
  if (locale) {
    const lower = locale.toLowerCase()
    const matched = PROMPT_LOCALES.find(loc => 
      lower.includes(loc) ||
      (loc === 'zh' && (lower.includes('中文') || lower.includes('chinese') || lower.includes('zh'))) ||
      (loc === 'en' && (lower.includes('英文') || lower.includes('english') || lower.includes('en')))
    )
    if (matched) {
      parsed.locale = matched
    } else {
      parsed.locale = lower.substring(0, 2) as 'zh' | 'en'
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
  
  return parsed
}

