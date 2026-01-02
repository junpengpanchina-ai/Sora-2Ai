/**
 * AI-Prime Pool 分析器
 * 
 * 识别最可能被 AI 引用的 10% 页面
 * 使用"结构信号"直接筛选，不用猜、不用等 AI 官方数据
 */

export interface AIPrimeCriteria {
  hasAnswerFirst: boolean
  answerFirstWordCount: number
  hasNeutralDefinition: boolean
  hasLimitations: boolean
  hasCTA: boolean
  paragraphCount: number
  purchaseIntent: number
}

export interface AIPrimeScore {
  pageId: string
  pageSlug: string
  score: number // 0-6
  conditionCount: number // 满足的条件数
  isAIPrime: boolean // ≥4 个条件
  criteria: AIPrimeCriteria
}

/**
 * AI 引用高概率页面的 6 个硬条件
 * 
 * 1. 有 Answer-first 且 ≤160 词（SGE/AI 最爱直接摘）
 * 2. 有 Neutral Definition（定义句是引用率最高块）
 * 3. 有 Limitations / Boundary（AI 判断"可信"的关键信号）
 * 4. 全文 无 CTA / 无 you / 无 we（避免商业偏向）
 * 5. 结构段落数固定（6–8）（AI 更容易稳定抽取）
 * 6. 行业 + 场景明确（非泛词）（AI 需要"可定位概念"）
 */
export function calculateAIPrimeScore(criteria: AIPrimeCriteria): AIPrimeScore {
  let conditionCount = 0
  
  // 条件 1：有 Answer-first 且 ≤160 词
  if (criteria.hasAnswerFirst && criteria.answerFirstWordCount <= 160) {
    conditionCount++
  }
  
  // 条件 2：有 Neutral Definition
  if (criteria.hasNeutralDefinition) {
    conditionCount++
  }
  
  // 条件 3：有 Limitations / Boundary
  if (criteria.hasLimitations) {
    conditionCount++
  }
  
  // 条件 4：无 CTA
  if (!criteria.hasCTA) {
    conditionCount++
  }
  
  // 条件 5：结构段落数固定（6–8）
  if (criteria.paragraphCount >= 6 && criteria.paragraphCount <= 8) {
    conditionCount++
  }
  
  // 条件 6：行业 + 场景明确（purchase_intent ≤ 1 表示非商业意图）
  if (criteria.purchaseIntent <= 1) {
    conditionCount++
  }
  
  return {
    pageId: '',
    pageSlug: '',
    score: conditionCount,
    conditionCount,
    isAIPrime: conditionCount >= 4, // ≥4 条进入 AI-Prime Pool
    criteria
  }
}

/**
 * AI Signal Score 计算
 * 
 * AI Signal Score =
 *   (定义型 query 数 × 2)
 *   + (when/how 查询 × 1)
 *   + (query 变体数 × 1)
 * 
 * ≥5 = 已进入 AI 引用轨道
 */
export interface AISignalData {
  definitionQueries: number // "what is ... used for"
  whenHowQueries: number // "when is ... used", "how does ... work"
  queryVariants: number // 同一页面的近义 query 数
}

export function calculateAISignalScore(data: AISignalData): {
  score: number
  isInAITrack: boolean
  breakdown: {
    definitionPart: number
    whenHowPart: number
    variantPart: number
  }
} {
  const definitionPart = data.definitionQueries * 2
  const whenHowPart = data.whenHowQueries * 1
  const variantPart = data.queryVariants * 1
  
  const totalScore = definitionPart + whenHowPart + variantPart
  
  return {
    score: totalScore,
    isInAITrack: totalScore >= 5,
    breakdown: {
      definitionPart,
      whenHowPart,
      variantPart
    }
  }
}

/**
 * 检测 AI 引用信号的关键词
 */
export const AI_SIGNAL_KEYWORDS = {
  definition: [
    'what is',
    'what are',
    'definition of',
    'meaning of',
    'used for',
    'purpose of'
  ],
  whenHow: [
    'when is',
    'when are',
    'how does',
    'how do',
    'how to',
    'how can',
    'when to',
    'when should'
  ],
  limitations: [
    'limitations of',
    'limitations',
    'boundaries of',
    'when not to',
    'restrictions'
  ]
}

/**
 * 从 GSC 查询数据中提取 AI 信号
 */
export function extractAISignals(queries: Array<{ query: string; impressions: number }>): AISignalData {
  let definitionQueries = 0
  let whenHowQueries = 0
  const queryVariants = new Set<string>()
  
  for (const { query } of queries) {
    const queryLower = query.toLowerCase()
    
    // 检测定义型查询
    if (AI_SIGNAL_KEYWORDS.definition.some(kw => queryLower.includes(kw))) {
      definitionQueries++
    }
    
    // 检测 when/how 查询
    if (AI_SIGNAL_KEYWORDS.whenHow.some(kw => queryLower.includes(kw))) {
      whenHowQueries++
    }
    
    // 检测查询变体（同一概念的不同表达）
    // 这里简化处理，实际应该做语义相似度分析
    const normalized = queryLower
      .replace(/^(what|how|when|where|why)\s+/, '')
      .replace(/\s+(is|are|does|do|can|should|to)\s+/g, ' ')
      .trim()
    
    if (normalized.length > 10) {
      queryVariants.add(normalized)
    }
  }
  
  return {
    definitionQueries,
    whenHowQueries,
    queryVariants: queryVariants.size
  }
}

/**
 * 30 天 Index Health 预测模型
 * 
 * 基于当前节奏（20–30 页/天）的保守预测
 */
export interface IndexHealthPrediction {
  day: number
  predictedIndexHealth: number
  status: 'digesting' | 'stable' | 'critical' | 'trust'
  confidence: 'high' | 'medium' | 'low'
}

export function predictIndexHealth(
  currentIndexHealth: number,
  currentDay: number = 0
): IndexHealthPrediction[] {
  const predictions: IndexHealthPrediction[] = []
  
  // 预测曲线（保守）
  const curve = [
    { day: 0, health: currentIndexHealth },
    { day: 7, health: Math.min(currentIndexHealth + 5, 55) },
    { day: 14, health: Math.min(currentIndexHealth + 12, 62) },
    { day: 21, health: Math.min(currentIndexHealth + 20, 65) },
    { day: 30, health: Math.min(currentIndexHealth + 25, 70) }
  ]
  
  for (const point of curve) {
    if (point.day < currentDay) continue
    
    let status: IndexHealthPrediction['status']
    if (point.health < 50) {
      status = 'digesting'
    } else if (point.health < 60) {
      status = 'stable'
    } else if (point.health < 65) {
      status = 'critical'
    } else {
      status = 'trust'
    }
    
    predictions.push({
      day: point.day,
      predictedIndexHealth: point.health,
      status,
      confidence: point.day <= 14 ? 'high' : point.day <= 21 ? 'medium' : 'low'
    })
  }
  
  return predictions
}

/**
 * 优先级公式（用于选择最该升级的页面）
 * 
 * Priority Score =
 *   (purchase_intent * 2)
 *   + (geo_score / 25)
 *   + (index_health / 20)
 */
export function calculateUpgradePriority(params: {
  purchaseIntent: number
  geoScore: number
  indexHealth: number
}): number {
  return (
    params.purchaseIntent * 2 +
    params.geoScore / 25 +
    params.indexHealth / 20
  )
}

