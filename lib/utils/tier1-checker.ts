/**
 * Tier 1 页面判定工具
 * 
 * Tier 1 页面 = 同时满足以下 ≥4 条：
 * 1. URL 能解析出 industry
 * 2. URL 能解析出 scene
 * 3. 正文长度 ≥ 800 词
 * 4. FAQ 数量 ≥ 3
 * 5. 存在 How-to / Steps 结构
 */

/**
 * 计算文本字数（英文单词数）
 */
function countWords(text: string): number {
  if (!text || typeof text !== 'string') {
    return 0
  }
  
  // 移除 HTML 标签
  const textWithoutHtml = text.replace(/<[^>]*>/g, ' ')
  
  // 移除 Markdown 语法
  const textWithoutMarkdown = textWithoutHtml
    .replace(/#{1,6}\s+/g, '') // 标题
    .replace(/\*\*([^*]+)\*\*/g, '$1') // 粗体
    .replace(/\*([^*]+)\*/g, '$1') // 斜体
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // 链接
    .replace(/`([^`]+)`/g, '$1') // 代码
    .replace(/```[\s\S]*?```/g, '') // 代码块
  
  // 按空格和标点分割，计算单词数
  const words = textWithoutMarkdown
    .split(/[\s\n\r\t,.;:!?()[\]{}'"]+/)
    .filter(word => word.length > 0)
  
  return words.length
}

/**
 * 检查是否存在 FAQ（≥3 个）
 */
function hasEnoughFAQ(content: string): boolean {
  if (!content || typeof content !== 'string') {
    return false
  }
  
  const contentLower = content.toLowerCase()
  
  // 方法 1: 检查 "FAQ" 或 "Frequently Asked Questions" 标题
  const faqSectionMatch = contentLower.match(/frequently\s+asked\s+questions?|faq/gi)
  if (!faqSectionMatch) {
    return false
  }
  
  // 方法 2: 计算问题数量
  // 匹配多种 FAQ 格式：
  // - Q: ... / A: ...
  // - Question: ... / Answer: ...
  // - 以 ? 结尾的行
  // - H2/H3 标题中包含 ?
  const questionPatterns = [
    /^[Qq]:\s*[^\n]+/gm, // Q: 开头
    /^[Qq]uestion\s*\d*[:\-]\s*[^\n]+/gmi, // Question: 或 Question 1:
    /^[^\n]+\?[\s\n]/gm, // 以 ? 结尾的行
    /<h[23][^>]*>.*\?.*<\/h[23]>/gi, // H2/H3 标题中包含 ?
    /##\s+.*\?.*$/gmi, // Markdown H2 标题包含 ?
    /###\s+.*\?.*$/gmi, // Markdown H3 标题包含 ?
  ]
  
  let questionCount = 0
  for (const pattern of questionPatterns) {
    const matches = content.match(pattern)
    if (matches) {
      questionCount += matches.length
    }
  }
  
  // 如果找到 FAQ 部分，至少应该有 3 个问题
  return questionCount >= 3
}

/**
 * 检查是否存在 How-to / Steps 结构
 */
function hasSteps(content: string): boolean {
  if (!content || typeof content !== 'string') {
    return false
  }
  
  const contentLower = content.toLowerCase()
  
  // 检查步骤相关的关键词
  const stepKeywords = [
    'how to',
    'step 1',
    'step 2',
    'step 3',
    'steps:',
    'procedure',
    'process:',
    'how to create',
    'how to use',
    'how to generate',
  ]
  
  const hasStepKeyword = stepKeywords.some(keyword => contentLower.includes(keyword))
  
  // 检查有序列表（1. 2. 3. 或 Step 1, Step 2）
  const numberedListPatterns = [
    /^\d+\.\s+\w+/m, // 1. text
    /^step\s+\d+[:\-]\s+\w+/gmi, // Step 1: text
    /^h3[^>]*>.*step\s+\d+.*<\/h3>/gi, // <h3>Step 1</h3>
    /###\s+.*step\s+\d+.*$/gmi, // Markdown ### Step 1
  ]
  
  const hasNumberedList = numberedListPatterns.some(pattern => pattern.test(content))
  
  // 检查 "How to" 标题
  const howToPatterns = [
    /<h2[^>]*>.*how\s+to.*<\/h2>/gi,
    /##\s+.*how\s+to.*$/gmi,
    /<h3[^>]*>.*how\s+to.*<\/h3>/gi,
    /###\s+.*how\s+to.*$/gmi,
  ]
  
  const hasHowToTitle = howToPatterns.some(pattern => pattern.test(content))
  
  return hasStepKeyword || hasNumberedList || hasHowToTitle
}

/**
 * 从 slug 或 use_case_type 解析 scene
 */
function extractScene(slug: string, useCaseType: string): string | null {
  // 方法 1: 从 use_case_type 解析（这是最可靠的方法）
  if (useCaseType) {
    return useCaseType
  }
  
  // 方法 2: 从 slug 中尝试解析（如果 slug 包含场景信息）
  // 例如：ai-video-for-healthcare-patient-education
  // 可以尝试提取 "patient-education" 作为 scene
  
  // 暂时返回 use_case_type，因为这是最可靠的数据源
  return useCaseType || null
}

/**
 * 检查页面是否符合 Tier 1 标准
 * 
 * @param page 页面数据
 * @returns { isTier1: boolean, score: number, criteria: Record<string, boolean> }
 */
export function checkTier1(page: {
  industry: string | null
  slug: string
  use_case_type: string
  content: string
}): {
  isTier1: boolean
  score: number
  criteria: {
    hasIndustry: boolean
    hasScene: boolean
    hasEnoughWords: boolean
    hasEnoughFAQ: boolean
    hasSteps: boolean
  }
} {
  const criteria = {
    hasIndustry: !!page.industry && page.industry.trim().length > 0,
    hasScene: !!extractScene(page.slug, page.use_case_type),
    hasEnoughWords: countWords(page.content) >= 800,
    hasEnoughFAQ: hasEnoughFAQ(page.content),
    hasSteps: hasSteps(page.content),
  }
  
  // 计算满足的条件数量
  const score = Object.values(criteria).filter(Boolean).length
  
  // Tier 1 = 满足 ≥4 条
  const isTier1 = score >= 4
  
  return {
    isTier1,
    score,
    criteria,
  }
}
