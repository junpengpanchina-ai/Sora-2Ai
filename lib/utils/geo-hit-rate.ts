/**
 * GEO 命中率计算工具
 * 
 * GEO 命中率 = 结构命中率 × 行业适配率
 * 
 * 用于内部判断：哪些页面会被 AI 引用
 */

import { getGEOIndustryClass, getGEOIndustryScore } from '@/lib/data/industries-geo-classification'

export interface GEOStructureCheck {
  hasAnswerFirst: boolean      // Answer-first（150-200词）
  hasNounPhraseList: boolean   // 名词短语列表
  hasSteps: boolean            // Steps（列表格式）
  hasFAQ: boolean              // ≥3 FAQ（傻问题）
  hasIndustryScenePlatform: boolean // 行业/场景/平台 ≥2 命中
}

export interface GEOHitRateResult {
  structureScore: number       // 结构命中率（0-100分）
  industryScore: number        // 行业适配率（0-3分）
  geoClass: 'A' | 'B' | 'C' | 'none'
  geoLevel: 'G-A' | 'G-B' | 'G-C' | 'G-None'
  shouldIncludeInTop50k: boolean
  hitProbability: 'high' | 'medium' | 'low'
}

/**
 * 检查页面结构是否符合 GEO 标准
 */
export function checkGEOStructure(content: {
  description?: string | null
  content?: string | null
  industry?: string | null
  use_case_type?: string | null
}): GEOStructureCheck {
  const desc = (content.description || '').toLowerCase()
  const fullContent = (content.content || '').toLowerCase()
  const combined = `${desc} ${fullContent}`
  const industryLower = (content.industry || '').toLowerCase()
  
  // 1. Answer-first（150-200词）- 检查开头是否有明确答案结构
  // ⚠️ 硬红线：Answer-first 区必须包含明确行业名
  const hasAnswerFirstStructure = 
    combined.includes('commonly used') ||
    combined.includes('typically used') ||
    combined.includes('typically applied') ||
    (desc.length >= 150 && desc.length <= 300) // 描述长度在合理范围
  
  const hasIndustryInAnswer = industryLower && (desc.includes(industryLower) || fullContent.substring(0, 500).includes(industryLower))
  
  const hasAnswerFirst = hasAnswerFirstStructure && !!hasIndustryInAnswer // 硬红线：必须有行业名
  
  // 2. 名词短语列表 - 检查是否有列表格式
  const hasNounPhraseList = 
    combined.includes('include:') ||
    combined.includes('applications include') ||
    combined.includes('typical applications') ||
    /^[-•]\s+\w+/m.test(fullContent) // 列表格式
  
  // 3. Steps（列表格式）- 检查是否有步骤列表
  const hasSteps = 
    combined.includes('step 1') ||
    combined.includes('step 2') ||
    combined.includes('how to') ||
    /^\d+\.\s+\w+/m.test(fullContent) // 数字列表
  
  // 4. FAQ（≥3个）- 检查是否有 FAQ 部分
  const faqCount = (fullContent.match(/faq|frequently asked|question:/gi) || []).length
  const hasFAQ = faqCount >= 3 || combined.includes('frequently asked questions')
  
  // 5. 行业/场景/平台 ≥2 命中
  const hasIndustry = !!content.industry
  const hasScene = !!content.use_case_type
  // 平台检测（从内容中提取）
  const hasPlatform = 
    combined.includes('instagram') ||
    combined.includes('tiktok') ||
    combined.includes('youtube') ||
    combined.includes('facebook') ||
    combined.includes('twitter')
  
  const hasIndustryScenePlatform = [hasIndustry, hasScene, hasPlatform].filter(Boolean).length >= 2
  
  return {
    hasAnswerFirst,
    hasNounPhraseList,
    hasSteps,
    hasFAQ,
    hasIndustryScenePlatform,
  }
}

/**
 * 计算结构命中率（0-100分）
 * 每项 20 分
 */
export function calculateStructureScore(structure: GEOStructureCheck): number {
  let score = 0
  if (structure.hasAnswerFirst) score += 20
  if (structure.hasNounPhraseList) score += 20
  if (structure.hasSteps) score += 20
  if (structure.hasFAQ) score += 20
  if (structure.hasIndustryScenePlatform) score += 20
  return score
}

/**
 * 计算 GEO 命中率
 */
export function calculateGEOHitRate(content: {
  description?: string | null
  content?: string | null
  industry?: string | null
  use_case_type?: string | null
}): GEOHitRateResult {
  // 1. 检查结构
  const structure = checkGEOStructure(content)
  const structureScore = calculateStructureScore(structure)
  
  // 2. 检查行业适配率
  const industry = content.industry ?? null
  const industryScore = getGEOIndustryScore(industry)
  const geoClass = getGEOIndustryClass(industry)
  
  // 3. 计算 GEO 等级
  // ⚠️ 硬红线：如果 Answer-first 区没有明确行业名 → 直接 G-None
  const industryLower = (industry || '').toLowerCase()
  const desc = (content.description || '').toLowerCase()
  const fullContent = (content.content || '').toLowerCase()
  const answerSection = desc || fullContent.substring(0, 500)
  const hasIndustryInAnswer = industryLower && answerSection.includes(industryLower)
  
  let geoLevel: 'G-A' | 'G-B' | 'G-C' | 'G-None'
  let shouldIncludeInTop50k: boolean
  let hitProbability: 'high' | 'medium' | 'low'
  
  // 硬红线：Answer-first 区必须包含行业名
  if (!hasIndustryInAnswer) {
    geoLevel = 'G-None'
    shouldIncludeInTop50k = false
    hitProbability = 'low'
  } else if (structureScore >= 80 && geoClass === 'A') {
    geoLevel = 'G-A'
    shouldIncludeInTop50k = true
    hitProbability = 'high'
  } else if (structureScore >= 80 && geoClass === 'B') {
    geoLevel = 'G-B'
    shouldIncludeInTop50k = true
    hitProbability = 'high'
  } else if (structureScore >= 60 && (geoClass === 'A' || geoClass === 'B')) {
    geoLevel = 'G-B'
    shouldIncludeInTop50k = true
    hitProbability = 'medium'
  } else if (structureScore >= 60 && geoClass === 'C') {
    geoLevel = 'G-C'
    shouldIncludeInTop50k = false
    hitProbability = 'low'
  } else {
    geoLevel = 'G-None'
    shouldIncludeInTop50k = false
    hitProbability = 'low'
  }
  
  return {
    structureScore,
    industryScore,
    geoClass: geoClass || 'none',
    geoLevel,
    shouldIncludeInTop50k,
    hitProbability,
  }
}

/**
 * 判定页面类型（基于用户提供的5种类型）
 */
export function classifyPageType(content: {
  title?: string | null
  industry?: string | null
  use_case_type?: string | null
}): {
  type: 'medical-clinic' | 'industry-platform-scene' | 'niche-professional' | 'pain-point-saas' | 'marketing-generic' | 'unknown'
  hitRate: '⭐⭐⭐⭐⭐' | '⭐⭐⭐⭐' | '⭐⭐⭐' | '❌'
  reason: string
} {
  const title = (content.title || '').toLowerCase()
  const industry = (content.industry || '').toLowerCase()
  const scene = (content.use_case_type || '').toLowerCase()
  
  // 类型1：医疗诊所（近乎100%命中）
  if (
    industry.includes('clinic') ||
    industry.includes('medical') ||
    industry.includes('dental') ||
    industry.includes('healthcare') ||
    industry.includes('hospital')
  ) {
    return {
      type: 'medical-clinic',
      hitRate: '⭐⭐⭐⭐⭐',
      reason: '医疗属于 AI 搜索"解释型刚需行业"，不是新闻、不是观点，是稳定知识',
    }
  }
  
  // 类型2：行业 × 平台 × 场景
  if (
    industry &&
    (title.includes('instagram') ||
     title.includes('tiktok') ||
     title.includes('youtube') ||
     scene.includes('social-media'))
  ) {
    return {
      type: 'industry-platform-scene',
      hitRate: '⭐⭐⭐⭐⭐',
      reason: '平台明确 + 场景具体 + 非情绪、非营销，AI 搜索必抓',
    }
  }
  
  // 类型3：冷门专业行业 + 操作型场景
  if (
    (industry.includes('manufacturing') ||
     industry.includes('engineering') ||
     industry.includes('construction') ||
     industry.includes('safety')) &&
    (scene.includes('training') || scene.includes('explainer'))
  ) {
    return {
      type: 'niche-professional',
      hitRate: '⭐⭐⭐⭐⭐',
      reason: '冷门行业 → AI 自己"不会编"，你给的是事实型结构',
    }
  }
  
  // 类型4：行业 + 痛点导向（SaaS）
  if (
    industry.includes('saas') &&
    (title.includes('onboarding') ||
     title.includes('customer') ||
     title.includes('user'))
  ) {
    return {
      type: 'pain-point-saas',
      hitRate: '⭐⭐⭐⭐',
      reason: '高频被问，但竞争略大，赢在 Answer-first + 列表',
    }
  }
  
  // 类型5：营销通用（不会被引用）
  if (
    !industry &&
    (title.includes('transform') ||
     title.includes('revolutionary') ||
     title.includes('game-changing') ||
     title.includes('boost') ||
     title.includes('maximize'))
  ) {
    return {
      type: 'marketing-generic',
      hitRate: '❌',
      reason: '无行业 + 无场景 + 情绪化标题，AI 不敢引用"营销话术"',
    }
  }
  
  return {
    type: 'unknown',
    hitRate: '⭐⭐⭐',
    reason: '需要进一步分析',
  }
}

