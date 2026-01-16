/**
 * AI Citation Score 计算工具
 * 
 * 计算页面被 AI 引用的概率（0-100 分）
 * 基于结构、清晰度、边界感等因素
 */

/**
 * 检查 Answer-first 是否在前 200 词
 */
function hasAnswerFirst(content: string): boolean {
  if (!content || typeof content !== 'string') {
    return false
  }
  
  // 移除 Markdown 和 HTML 标签，获取纯文本
  const textWithoutMarkdown = content
    .replace(/<[^>]*>/g, ' ')
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/```[\s\S]*?```/g, '')
  
  // 计算前 200 词
  const words = textWithoutMarkdown
    .split(/[\s\n\r\t,.;:!?()[\]{}'"]+/)
    .filter(word => word.length > 0)
    .slice(0, 200)
  
  const first200Words = words.join(' ').toLowerCase()
  
  // 检查是否包含 Answer-first 的特征
  // Answer-first 通常直接回答问题，不绕弯
  const answerFirstIndicators = [
    'yes,',
    'no,',
    'ai video',
    'can be used',
    'is used',
    'allows',
    'enables',
    'helps',
    'provides',
  ]
  
  // 检查是否在前 200 词中直接回答（不以 "in this article" 等开头）
  const hasDirectAnswer = answerFirstIndicators.some(indicator => 
    first200Words.includes(indicator)
  )
  
  // 检查是否没有营销性开头（如 "In this comprehensive guide"）
  const marketingOpeners = [
    'in this comprehensive',
    'in this article',
    'welcome to',
    'discover how',
    'learn how',
  ]
  
  const hasMarketingOpener = marketingOpeners.some(opener => 
    first200Words.includes(opener)
  )
  
  return hasDirectAnswer && !hasMarketingOpener
}

/**
 * 检查是否有 FAQ-B（决策边界问题）
 */
function hasFAQ_B(content: string): boolean {
  if (!content || typeof content !== 'string') {
    return false
  }
  
  // FAQ-B 的特征：询问边界、限制、何时不使用
  // 注意：正则表达式使用 gi 标志（不区分大小写），不需要转换为小写
  const faqBPatterns = [
    /when\s+should\s+(?:ai\s+video|you)\s+not\s+be\s+used/gi,
    /when\s+is\s+(?:ai\s+video|this)\s+not\s+suitable/gi,
    /what\s+are\s+(?:the\s+)?(?:limitations|constraints|restrictions)/gi,
    /when\s+should\s+you\s+avoid/gi,
    /what\s+are\s+common\s+limitations/gi,
    /industry\s+constraints/gi,
    /when\s+not\s+to\s+use/gi,
  ]
  
  return faqBPatterns.some(pattern => pattern.test(content))
}

/**
 * 检查是否有 Industry Constraints 段落
 */
function hasIndustryConstraints(content: string): boolean {
  if (!content || typeof content !== 'string') {
    return false
  }
  
  // Industry Constraints 的特征
  // 注意：正则表达式使用 gi 标志（不区分大小写），不需要转换为小写
  const constraintPatterns = [
    /industry\s+constraints/gi,
    /industry\s+considerations/gi,
    /industry\s+limitations/gi,
    /constraints\s+and\s+considerations/gi,
    /industry-specific\s+constraints/gi,
  ]
  
  return constraintPatterns.some(pattern => pattern.test(content))
}

/**
 * 检查列表中是否有 ≥3 个名词短语
 */
function hasNounPhrases(content: string): boolean {
  if (!content || typeof content !== 'string') {
    return false
  }
  
  // 查找列表结构（有序或无序）
  const listPatterns = [
    /^\d+\.\s+[^\n]+/gm, // 有序列表
    /^[-*]\s+[^\n]+/gm, // 无序列表
    /<li[^>]*>[^<]+<\/li>/gi, // HTML 列表
  ]
  
  let listItemCount = 0
  for (const pattern of listPatterns) {
    const matches = content.match(pattern)
    if (matches) {
      listItemCount += matches.length
    }
  }
  
  // 检查是否有足够的列表项（≥3）
  return listItemCount >= 3
}

/**
 * 检查 URL 是否命中 industry + scene
 */
function urlMatchesIndustryScene(slug: string, industry: string | null, useCaseType: string): boolean {
  if (!slug || !industry || !useCaseType) {
    return false
  }
  
  const slugLower = slug.toLowerCase()
  const industryLower = industry.toLowerCase().replace(/\s+/g, '-')
  const sceneLower = useCaseType.toLowerCase()
  
  // 检查 slug 中是否包含 industry 和 scene 的关键词
  const hasIndustry = slugLower.includes(industryLower) || 
    industryLower.split('-').some(word => slugLower.includes(word))
  
  const hasScene = slugLower.includes(sceneLower) ||
    sceneLower.split('-').some(word => slugLower.includes(word))
  
  return hasIndustry && hasScene
}

/**
 * 检查内链数量（≥3 且非固定模板）
 */
function hasGoodInternalLinks(relatedUseCaseIds: string[] | null | undefined): boolean {
  if (!relatedUseCaseIds || !Array.isArray(relatedUseCaseIds)) {
    return false
  }
  
  // 内链数量 ≥3
  return relatedUseCaseIds.length >= 3
}

/**
 * 检查页面是否应该被排除（AI 不喜欢的页面类型）
 */
export function shouldExcludePage(page: {
  slug: string
  title: string
  content: string
  use_case_type: string
}): boolean {
  const slugLower = page.slug.toLowerCase()
  const titleLower = page.title.toLowerCase()
  const contentLower = page.content.toLowerCase()
  
  // 排除条件
  const excludePatterns = [
    // 纯工具页
    /pricing/i,
    /landing/i,
    /signup/i,
    /login/i,
    /checkout/i,
    
    // 泛博客
    /^what\s+is\s+ai\s+video/i,
    /^introduction\s+to/i,
    /^overview\s+of/i,
    
    // 对比页
    /best\s+.*\s+tool/i,
    /\s+vs\s+/i,
    /alternative/i,
    /comparison/i,
    
    // 营销词密度高
    /cheap|discount|free\s+trial|limited\s+time/i,
  ]
  
  // 检查 slug 和 title
  const slugOrTitleMatch = excludePatterns.some(pattern => 
    pattern.test(slugLower) || pattern.test(titleLower)
  )
  
  // 检查内容中的营销词密度
  const marketingWords = ['cheap', 'discount', 'limited time', 'act now', 'buy now', 'sign up now']
  const marketingWordCount = marketingWords.filter(word => 
    contentLower.includes(word)
  ).length
  
  // 如果营销词超过 3 个，排除
  const hasHighMarketingDensity = marketingWordCount >= 3
  
  return slugOrTitleMatch || hasHighMarketingDensity
}

/**
 * 计算 AI Citation Score (0-100)
 */
export function calculateAICitationScore(page: {
  slug: string
  title: string
  content: string
  industry: string | null
  use_case_type: string
  related_use_case_ids: string[] | null | undefined
}): {
  score: number
  breakdown: {
    answerFirst: number
    faqB: number
    industryConstraints: number
    nounPhrases: number
    urlMatch: number
    internalLinks: number
  }
} {
  let score = 0
  const breakdown = {
    answerFirst: 0,
    faqB: 0,
    industryConstraints: 0,
    nounPhrases: 0,
    urlMatch: 0,
    internalLinks: 0,
  }
  
  // +30 if Answer-first 在前 200 词
  if (hasAnswerFirst(page.content)) {
    score += 30
    breakdown.answerFirst = 30
  }
  
  // +20 if FAQ-B（决策边界）≥ 1
  if (hasFAQ_B(page.content)) {
    score += 20
    breakdown.faqB = 20
  }
  
  // +15 if Industry Constraints 段存在
  if (hasIndustryConstraints(page.content)) {
    score += 15
    breakdown.industryConstraints = 15
  }
  
  // +15 if 列表中 ≥3 个名词短语
  if (hasNounPhrases(page.content)) {
    score += 15
    breakdown.nounPhrases = 15
  }
  
  // +10 if URL 命中 industry + scene
  if (urlMatchesIndustryScene(page.slug, page.industry, page.use_case_type)) {
    score += 10
    breakdown.urlMatch = 10
  }
  
  // +10 if 内链 ≥3 且非固定模板
  if (hasGoodInternalLinks(page.related_use_case_ids)) {
    score += 10
    breakdown.internalLinks = 10
  }
  
  return {
    score: Math.min(100, score), // 确保不超过 100
    breakdown,
  }
}
