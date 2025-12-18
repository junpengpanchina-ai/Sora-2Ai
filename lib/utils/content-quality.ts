/**
 * 内容质量检查工具
 * 用于自动检测和标记有问题的内容
 */

export interface QualityCheckResult {
  passed: boolean
  score: number // 0-100
  issues: string[]
  warnings: string[]
}

export type QualityIssue =
  | 'missing_h1'
  | 'content_too_short'
  | 'content_too_long'
  | 'missing_description'
  | 'missing_keywords'
  | 'duplicate_content'
  | 'poor_formatting'
  | 'missing_example_prompt'
  | 'low_readability'
  | 'keyword_stuffing'
  | 'incomplete_structure'

/**
 * 检查内容质量
 */
export function checkContentQuality(content: {
  title?: string
  h1?: string
  description?: string
  content?: string
  seo_keywords?: string[]
}): QualityCheckResult {
  const issues: string[] = []
  const warnings: string[] = []
  let score = 100

  // 1. 检查 H1
  if (!content.h1 || content.h1.trim().length === 0) {
    issues.push('missing_h1')
    score -= 20
  } else if (content.h1.length < 10) {
    warnings.push('H1 标题过短')
    score -= 5
  }

  // 2. 检查标题
  if (!content.title || content.title.trim().length === 0) {
    issues.push('missing_title')
    score -= 15
  }

  // 3. 检查描述
  if (!content.description || content.description.trim().length === 0) {
    issues.push('missing_description')
    score -= 15
  } else if (content.description.length < 50) {
    warnings.push('描述过短（建议至少 50 字）')
    score -= 5
  } else if (content.description.length > 300) {
    warnings.push('描述过长（建议不超过 300 字）')
    score -= 3
  }

  // 4. 检查内容长度
  const contentLength = content.content?.length || 0
  if (contentLength === 0) {
    issues.push('content_too_short')
    score -= 30
  } else if (contentLength < 300) {
    issues.push('content_too_short')
    score -= 20
  } else if (contentLength < 500) {
    warnings.push('内容较短（建议至少 500 字）')
    score -= 10
  } else if (contentLength > 5000) {
    warnings.push('内容过长（建议不超过 5000 字）')
    score -= 5
  }

  // 5. 检查 SEO 关键词
  if (!content.seo_keywords || content.seo_keywords.length === 0) {
    issues.push('missing_keywords')
    score -= 10
  } else if (content.seo_keywords.length < 2) {
    warnings.push('SEO 关键词过少（建议至少 2 个）')
    score -= 5
  }

  // 6. 检查内容结构（H2 标题）
  if (content.content) {
    const h2Count = (content.content.match(/^##\s+/gm) || []).length
    if (h2Count === 0) {
      issues.push('poor_formatting')
      score -= 15
    } else if (h2Count < 3) {
      warnings.push('内容结构不完整（建议至少 3 个 H2 标题）')
      score -= 5
    }

    // 检查是否包含示例 prompt
    const hasExamplePrompt =
      content.content.toLowerCase().includes('example prompt') ||
      content.content.toLowerCase().includes('prompt example') ||
      content.content.includes('```')
    if (!hasExamplePrompt) {
      issues.push('missing_example_prompt')
      score -= 10
    }

    // 检查关键词堆砌（同一关键词出现超过 10 次）
    if (content.seo_keywords && content.seo_keywords.length > 0) {
      const keyword = content.seo_keywords[0].toLowerCase()
      const keywordCount = (content.content.toLowerCase().match(new RegExp(keyword, 'g')) || []).length
      if (keywordCount > 10) {
        issues.push('keyword_stuffing')
        score -= 15
      }
    }

    // 检查可读性（段落长度）
    const paragraphs = content.content.split('\n\n')
    const longParagraphs = paragraphs.filter((p) => p.length > 300).length
    if (longParagraphs > paragraphs.length * 0.3) {
      warnings.push('部分段落过长，可能影响可读性')
      score -= 5
    }
  }

  // 确保分数在 0-100 范围内
  score = Math.max(0, Math.min(100, score))

  return {
    passed: issues.length === 0 && score >= 60,
    score,
    issues,
    warnings,
  }
}

/**
 * 获取质量问题的人类可读描述
 */
export function getQualityIssueLabel(issue: QualityIssue): string {
  const labels: Record<QualityIssue, string> = {
    missing_h1: '缺少 H1 标题',
    content_too_short: '内容过短（少于 300 字）',
    content_too_long: '内容过长（超过 5000 字）',
    missing_description: '缺少描述',
    missing_keywords: '缺少 SEO 关键词',
    duplicate_content: '内容重复',
    poor_formatting: '格式不规范（缺少 H2 标题）',
    missing_example_prompt: '缺少示例 Prompt',
    low_readability: '可读性差',
    keyword_stuffing: '关键词堆砌',
    incomplete_structure: '结构不完整',
  }
  return labels[issue] || issue
}

