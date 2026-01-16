/**
 * AI Citation Score 计算工具 V2
 * 
 * 基于用户提供的详细规格实现
 * 计算页面被 AI 引用的概率（0-100 分）
 */

export type CitationSignals = {
  hasAnswerFirst: boolean
  answerWordCount: number
  hasBullets: boolean
  bulletCount: number
  hasSteps: boolean
  stepCount: number
  faqCount: number
  hasIndustryConstraints: boolean
  wordCount: number
  nearDuplicateScore: number // 0~1 (1=高度重复)
  internalLinksOut: number
  hasKbAnchor: boolean
  indexable: boolean
  industryCoverage?: number // 同 industry 相关页数（可选）
}

/**
 * 计算 AI Citation Score (0-100)
 * 
 * 评分维度：
 * - 内容结构（50分）
 * - 去重与质量（20分）
 * - 权威锚点与内链（20分）
 * - 可抓取性（10分）
 */
export function computeAiCitationScore(s: CitationSignals): number {
  let score = 0

  // ========== 内容结构（50分） ==========
  
  // Answer-first 是否存在且 120-220 词（15分）
  if (s.hasAnswerFirst) {
    const w = s.answerWordCount
    if (w >= 120 && w <= 220) {
      score += 15
    } else if (w >= 90) {
      score += 8
    }
  }

  // 是否包含"可引用列表"（名词短语 bullets）（10分）
  if (s.hasBullets) {
    score += Math.min(10, 2 + s.bulletCount)
  }

  // 是否有 Steps（How-to 1/2/3）（10分）
  if (s.hasSteps) {
    score += Math.min(10, 2 + s.stepCount * 2)
  }

  // FAQ 数量（≥3）（10分）
  score += Math.min(10, s.faqCount >= 3 ? 10 : s.faqCount * 3)

  // 是否有 Industry Constraints 段（5分）
  if (s.hasIndustryConstraints) {
    score += 5
  }

  // ========== 去重与质量（20分） ==========
  
  // 字数下限（10分）
  if (s.wordCount >= 900) {
    score += 10
  } else if (s.wordCount >= 600) {
    score += 6
  }

  // 标题/正文相似度惩罚（10分）
  score += Math.max(0, 10 * (1 - s.nearDuplicateScore)) // duplicate -> penalize

  // ========== 权威锚点与内链（20分） ==========
  
  // 是否有 KB 归属锚点句（5分）
  if (s.hasKbAnchor) {
    score += 5
  }

  // 内链出度 3-8 且"随机但可控"多样（10分）
  if (s.internalLinksOut >= 3 && s.internalLinksOut <= 8) {
    score += 10
  } else if (s.internalLinksOut > 0) {
    score += 3
  }

  // 行业聚类覆盖（同 industry 相关页数）（5分，可选）
  if (s.industryCoverage !== undefined) {
    score += Math.min(5, Math.floor(s.industryCoverage / 10))
  }

  // ========== 可抓取性（10分） ==========
  
  // indexable + canonical 正常 + 200 OK（10分）
  if (s.indexable) {
    score += 10
  }

  return Math.max(0, Math.min(100, Math.round(score)))
}

/**
 * 从页面内容提取 Citation Signals
 */
export function extractCitationSignals(page: {
  content: string
  title: string
  h1?: string
  related_use_case_ids?: string[] | null
  industry?: string | null
}): CitationSignals {
  const content = page.content || ''
  const title = page.title || ''
  const h1 = page.h1 || title

  // 提取 Answer-first 信息
  const answerFirstInfo = extractAnswerFirst(content)
  
  // 提取列表信息
  const bulletsInfo = extractBullets(content)
  
  // 提取 Steps 信息
  const stepsInfo = extractSteps(content)
  
  // 提取 FAQ 数量
  const faqCount = countFAQs(content)
  
  // 检查 Industry Constraints
  const hasIndustryConstraints = checkIndustryConstraints(content)
  
  // 计算字数
  const wordCount = countWords(content)
  
  // 计算相似度（简化版：标题和 H1 的相似度）
  const nearDuplicateScore = calculateSimilarity(title, h1)
  
  // 内链数量
  const internalLinksOut = page.related_use_case_ids?.length || 0
  
  // 检查 KB 锚点
  const hasKbAnchor = checkKbAnchor(content)
  
  // 假设可索引（实际应该从数据库或元数据获取）
  const indexable = true

  return {
    hasAnswerFirst: answerFirstInfo.has,
    answerWordCount: answerFirstInfo.wordCount,
    hasBullets: bulletsInfo.has,
    bulletCount: bulletsInfo.count,
    hasSteps: stepsInfo.has,
    stepCount: stepsInfo.count,
    faqCount,
    hasIndustryConstraints,
    wordCount,
    nearDuplicateScore,
    internalLinksOut,
    hasKbAnchor,
    indexable,
  }
}

// ========== 辅助函数 ==========

function extractAnswerFirst(content: string): { has: boolean; wordCount: number } {
  if (!content) return { has: false, wordCount: 0 }
  
  const textWithoutMarkdown = content
    .replace(/<[^>]*>/g, ' ')
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/```[\s\S]*?```/g, '')
  
  const words = textWithoutMarkdown
    .split(/[\s\n\r\t,.;:!?()[\]{}'"]+/)
    .filter(w => w.length > 0)
    .slice(0, 220) // 取前 220 词检查
  
  const firstWords = words.slice(0, 220).join(' ').toLowerCase()
  
  const answerFirstIndicators = [
    'yes,', 'no,', 'ai video', 'can be used', 'is used',
    'allows', 'enables', 'helps', 'provides', 'enables',
  ]
  
  const marketingOpeners = [
    'in this comprehensive', 'in this article', 'welcome to',
    'discover how', 'learn how',
  ]
  
  const hasDirectAnswer = answerFirstIndicators.some(ind => firstWords.includes(ind))
  const hasMarketingOpener = marketingOpeners.some(opener => firstWords.includes(opener))
  
  return {
    has: hasDirectAnswer && !hasMarketingOpener,
    wordCount: words.length,
  }
}

function extractBullets(content: string): { has: boolean; count: number } {
  if (!content) return { has: false, count: 0 }
  
  const listPatterns = [
    /^\d+\.\s+[^\n]+/gm, // 有序列表
    /^[-*]\s+[^\n]+/gm, // 无序列表
    /<li[^>]*>[^<]+<\/li>/gi, // HTML 列表
  ]
  
  let count = 0
  for (const pattern of listPatterns) {
    const matches = content.match(pattern)
    if (matches) {
      count += matches.length
    }
  }
  
  return {
    has: count >= 3,
    count,
  }
}

function extractSteps(content: string): { has: boolean; count: number } {
  if (!content) return { has: false, count: 0 }
  
  const stepPatterns = [
    /step\s+(\d+)/gi,
    /^\d+\.\s+[^\n]*(?:step|how\s+to)/gmi,
    /<h[23][^>]*>.*step\s+\d+.*<\/h[23]>/gi,
    /###?\s+.*step\s+\d+.*$/gmi,
  ]
  
  let count = 0
  for (const pattern of stepPatterns) {
    const matches = content.match(pattern)
    if (matches) {
      count += matches.length
    }
  }
  
  return {
    has: count > 0,
    count,
  }
}

function countFAQs(content: string): number {
  if (!content) return 0
  
  const questionPatterns = [
    /^[Qq]:\s*[^\n]+/gm,
    /^[Qq]uestion\s*\d*[:\-]\s*[^\n]+/gmi,
    /^[^\n]+\?[\s\n]/gm,
    /<h[23][^>]*>.*\?.*<\/h[23]>/gi,
    /##\s+.*\?.*$/gmi,
    /###\s+.*\?.*$/gmi,
  ]
  
  let count = 0
  for (const pattern of questionPatterns) {
    const matches = content.match(pattern)
    if (matches) {
      count += matches.length
    }
  }
  
  return count
}

function checkIndustryConstraints(content: string): boolean {
  if (!content) return false
  
  const constraintPatterns = [
    /industry\s+constraints/gi,
    /industry\s+considerations/gi,
    /industry\s+limitations/gi,
    /constraints\s+and\s+considerations/gi,
    /industry-specific\s+constraints/gi,
  ]
  
  return constraintPatterns.some(pattern => pattern.test(content))
}

function countWords(text: string): number {
  if (!text) return 0
  
  const textWithoutHtml = text.replace(/<[^>]*>/g, ' ')
  const textWithoutMarkdown = textWithoutHtml
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/```[\s\S]*?```/g, '')
  
  const words = textWithoutMarkdown
    .split(/[\s\n\r\t,.;:!?()[\]{}'"]+/)
    .filter(w => w.length > 0)
  
  return words.length
}

function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0
  
  const s1 = str1.toLowerCase().trim()
  const s2 = str2.toLowerCase().trim()
  
  if (s1 === s2) return 1
  
  // 简单的相似度计算（基于共同词汇）
  const words1 = new Set(s1.split(/\s+/))
  const words2 = new Set(s2.split(/\s+/))
  
  const intersection = new Set([...words1].filter(w => words2.has(w)))
  const union = new Set([...words1, ...words2])
  
  return intersection.size / union.size
}

function checkKbAnchor(content: string): boolean {
  if (!content) return false
  
  const kbAnchorPatterns = [
    /this\s+page\s+is\s+part\s+of\s+a\s+structured\s+knowledge\s+base/gi,
    /part\s+of\s+a\s+structured\s+knowledge\s+base/gi,
    /knowledge\s+base\s+on\s+ai\s+video/gi,
    /covering\s+over\s+\d+\s+industries/gi,
  ]
  
  return kbAnchorPatterns.some(pattern => pattern.test(content))
}
