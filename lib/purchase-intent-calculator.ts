/**
 * Purchase Intent 自动算分逻辑
 * 
 * 用于：决定哪些页面能卖钱
 * 
 * 规则：
 * - 3 分：明确交付任务（product demo / listing / promo / recruitment）
 * - 2 分：工作场景强（training / education / onboarding）
 * - 1 分：学习/解释型（explainer / guide / what-is）
 * - 0 分：纯泛营销/空泛场景
 */

export type SceneType = 
  | 'product-demo-showcase'
  | 'advertising-promotion'
  | 'education-explainer'
  | 'brand-storytelling'
  | 'ugc-creator-content'
  | 'social-media-content'
  | string

export type PurchaseIntent = 0 | 1 | 2 | 3

export interface IntentCalculation {
  sceneType: string
  industry: string
  baseScore: number
  industryBoost: number
  intentScore: PurchaseIntent
  geoScore: number
  conversionAllowed: boolean
  layer: 'asset' | 'conversion' | 'core-sample'
}

/**
 * Step 1：基础分（按场景）
 */
export function baseIntentScore(sceneType: string): number {
  const lowerCase = sceneType.toLowerCase()
  
  // 3 分：明确交付任务
  const highIntentKeywords = [
    'product-demo',
    'product demo',
    'listing',
    'promo',
    'recruitment',
    'advertising-promotion',
    'advertising promotion',
    'showcase',
  ]
  
  if (highIntentKeywords.some(keyword => lowerCase.includes(keyword))) {
    return 3
  }
  
  // 2 分：工作场景强，但不立即交付
  const mediumIntentKeywords = [
    'training',
    'education',
    'onboarding',
    'compliance',
    'education-explainer',
    'ugc-creator-content',
    'ugc creator',
  ]
  
  if (mediumIntentKeywords.some(keyword => lowerCase.includes(keyword))) {
    return 2
  }
  
  // 1 分：学习/解释型
  const lowIntentKeywords = [
    'explainer',
    'guide',
    'what-is',
    'what is',
    'how-to',
    'how to',
    'brand-storytelling',
    'brand storytelling',
  ]
  
  if (lowIntentKeywords.some(keyword => lowerCase.includes(keyword))) {
    return 1
  }
  
  // 0 分：纯泛营销/空泛场景
  return 0
}

/**
 * Step 2：行业权重加成
 */
export function industryBoost(industry: string): number {
  const lowerCase = industry.toLowerCase()
  
  // 高价值行业：+1 分
  const highValueIndustries = [
    'real estate',
    'ecommerce',
    'e-commerce',
    'saas',
    'education',
    'healthcare',
    'health care',
    'finance',
    'legal',
  ]
  
  if (highValueIndustries.some(ind => lowerCase.includes(ind))) {
    return 1
  }
  
  // 中等价值行业：+0.5 分
  const mediumValueIndustries = [
    'manufacturing',
    'compliance',
    'training',
    'construction',
    'engineering',
  ]
  
  if (mediumValueIndustries.some(ind => lowerCase.includes(ind))) {
    return 0.5
  }
  
  // 其他行业：不加分
  return 0
}

/**
 * Step 3：最终 Intent 评分
 */
export function calcIntentScore(
  sceneType: string,
  industry: string
): PurchaseIntent {
  const baseScore = baseIntentScore(sceneType)
  const boost = industryBoost(industry)
  const finalScore = baseScore + boost
  
  // 最终评分（0-3 分）
  if (finalScore >= 2.6) return 3
  if (finalScore >= 1.6) return 2
  if (finalScore >= 0.6) return 1
  return 0
}

/**
 * Step 4：是否进入"转化层"
 */
export function allowConversion(
  intentScore: PurchaseIntent,
  geoScore: number
): boolean {
  // 只有 Intent ≥2 且 GEO ≥80 的页面才能进入转化层
  return intentScore >= 2 && geoScore >= 80
}

/**
 * 确定页面层级
 */
export function determinePageLayer(
  intentScore: PurchaseIntent,
  geoScore: number
): 'asset' | 'conversion' | 'core-sample' {
  if (intentScore >= 2 && geoScore >= 80) {
    return 'conversion' // 转化层
  }
  if (intentScore === 1) {
    return 'asset' // 资产层
  }
  return 'asset' // 0 分也归为资产层（但禁止发布）
}

/**
 * 完整计算 Purchase Intent
 */
export function calculateIntent(
  sceneType: string,
  industry: string,
  geoScore: number = 80
): IntentCalculation {
  const baseScore = baseIntentScore(sceneType)
  const boost = industryBoost(industry)
  const intentScore = calcIntentScore(sceneType, industry)
  const conversionAllowed = allowConversion(intentScore, geoScore)
  const layer = determinePageLayer(intentScore, geoScore)
  
  return {
    sceneType,
    industry,
    baseScore,
    industryBoost: boost,
    intentScore,
    geoScore,
    conversionAllowed,
    layer,
  }
}

/**
 * 批量计算 Purchase Intent
 */
export function calculateIntentBatch(
  items: Array<{ sceneType: string; industry: string; geoScore?: number }>
): IntentCalculation[] {
  return items.map(item => 
    calculateIntent(item.sceneType, item.industry, item.geoScore)
  )
}

/**
 * 筛选可进入转化层的内容
 */
export function filterConversionLayer(
  items: Array<{ sceneType: string; industry: string; geoScore?: number }>
): IntentCalculation[] {
  const calculations = calculateIntentBatch(items)
  return calculations.filter(item => item.conversionAllowed)
}

