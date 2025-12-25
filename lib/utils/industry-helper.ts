/**
 * 行业工具函数
 * 整合 SEO 优先级、商业价值、平台场景映射
 */

import { 
  getIndustryTier, 
  isPriorityIndustry, 
  isBlacklistedIndustry,
  INDUSTRIES_S_TIER,
  INDUSTRIES_A_PLUS_TIER,
  INDUSTRIES_A_TIER,
} from '@/lib/data/industries-priority'

import {
  getIndustryConfig,
  type BusinessTier,
} from '@/lib/data/industries-business-value'

import {
  getRecommendedPlatforms,
  getRecommendedScenarios,
} from '@/lib/data/industry-platform-scenarios'

/**
 * 行业完整信息（用于UI展示）
 */
export interface IndustryInfo {
  name: string
  seoTier: 'S' | 'A+' | 'A' | 'B' | 'C' | 'none'
  businessTier: BusinessTier | 'none'
  seoTierNumber: number // 5=S, 4=A+, 3=A, 2=B, 1=C, 0=none
  recommendedPlatforms: string[]
  recommendedScenarios: Record<string, string[]> // platform -> scenarios
  pricingStrategy?: {
    suggestedPlans: string[]
    featureLevel: 'enterprise' | 'professional' | 'starter'
    notes: string
  }
  contentStrategy?: {
    focus: string[]
    avoid: string[]
    notes: string
  }
}

/**
 * 获取行业的完整信息
 */
export function getIndustryInfo(industry: string | null): IndustryInfo | null {
  if (!industry) return null

  const seoTierNumber = getIndustryTier(industry)
  let seoTier: 'S' | 'A+' | 'A' | 'B' | 'C' | 'none' = 'none'
  
  if (seoTierNumber === 5) seoTier = 'S'
  else if (seoTierNumber === 4) seoTier = 'A+'
  else if (seoTierNumber === 3) seoTier = 'A'
  else if (seoTierNumber === 2) seoTier = 'B'
  else if (seoTierNumber === 1) seoTier = 'C'

  const businessConfig = getIndustryConfig(industry)
  const businessTier: BusinessTier | 'none' = businessConfig?.businessTier || 'none'

  const platforms = getRecommendedPlatforms(industry)
  const scenariosMap: Record<string, string[]> = {}
  platforms.forEach(platform => {
    scenariosMap[platform] = getRecommendedScenarios(industry, platform)
  })

  return {
    name: industry,
    seoTier,
    businessTier,
    seoTierNumber,
    recommendedPlatforms: platforms,
    recommendedScenarios: scenariosMap,
    pricingStrategy: businessConfig?.pricingStrategy,
    contentStrategy: businessConfig?.contentStrategy,
  }
}

/**
 * 获取行业显示标签（用于UI）
 */
export function getIndustryBadge(industry: string | null): {
  label: string
  color: string
  bgColor: string
} | null {
  if (!industry) return null

  const tier = getIndustryTier(industry)
  
  if (tier === 5) {
    return { label: 'S级', color: 'text-yellow-700 dark:text-yellow-300', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30' }
  } else if (tier === 4) {
    return { label: 'A+级', color: 'text-green-700 dark:text-green-300', bgColor: 'bg-green-100 dark:bg-green-900/30' }
  } else if (tier === 3) {
    return { label: 'A级', color: 'text-blue-700 dark:text-blue-300', bgColor: 'bg-blue-100 dark:bg-blue-900/30' }
  } else if (tier === 2) {
    return { label: 'B级', color: 'text-gray-700 dark:text-gray-300', bgColor: 'bg-gray-100 dark:bg-gray-900/30' }
  } else if (tier === 1) {
    return { label: 'C级', color: 'text-gray-600 dark:text-gray-400', bgColor: 'bg-gray-50 dark:bg-gray-800/30' }
  }

  return null
}

/**
 * 获取商业价值标签（用于UI）
 */
export function getBusinessTierBadge(industry: string | null): {
  label: string
  color: string
  bgColor: string
  icon: string
} | null {
  if (!industry) return null

  const config = getIndustryConfig(industry)
  if (!config) return null

  if (config.businessTier === 'premium') {
    return {
      label: '高价行业',
      color: 'text-purple-700 dark:text-purple-300',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      icon: '💰',
    }
  } else if (config.businessTier === 'standard') {
    return {
      label: '中价行业',
      color: 'text-blue-700 dark:text-blue-300',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      icon: '⚖️',
    }
  } else if (config.businessTier === 'traffic') {
    return {
      label: '流量行业',
      color: 'text-green-700 dark:text-green-300',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      icon: '📈',
    }
  }

  return null
}

/**
 * 获取优先行业列表（用于筛选和推荐）
 */
export function getPrioritizedIndustries(): Array<{
  industry: string
  seoTier: number
  businessTier: BusinessTier | 'none'
  recommended: boolean
}> {
  // 合并所有优先行业
  const allPriority = [
    ...INDUSTRIES_S_TIER.map(i => ({ industry: i, seoTier: 5, recommended: true })),
    ...INDUSTRIES_A_PLUS_TIER.map(i => ({ industry: i, seoTier: 4, recommended: true })),
    ...INDUSTRIES_A_TIER.map(i => ({ industry: i, seoTier: 3, recommended: true })),
  ]

  return allPriority.map(item => {
    const config = getIndustryConfig(item.industry)
    return {
      ...item,
      businessTier: (config?.businessTier || 'none') as BusinessTier | 'none',
    }
  }).sort((a, b) => {
    // 排序：SEO优先级 > 商业价值
    if (a.seoTier !== b.seoTier) return b.seoTier - a.seoTier
    if (a.businessTier === 'premium' && b.businessTier !== 'premium') return -1
    if (b.businessTier === 'premium' && a.businessTier !== 'premium') return 1
    return a.industry.localeCompare(b.industry)
  })
}

/**
 * 检查行业是否应该推荐给用户
 */
export function shouldRecommendIndustry(industry: string | null): boolean {
  if (!industry) return false
  if (isBlacklistedIndustry(industry)) return false
  return isPriorityIndustry(industry) // 只推荐优先行业
}

/**
 * 根据平台获取推荐场景
 */
export function getScenariosForPlatform(industry: string, platform: string): string[] {
  return getRecommendedScenarios(industry, platform)
}

/**
 * 获取行业的所有推荐平台
 */
export function getPlatformsForIndustry(industry: string): string[] {
  return getRecommendedPlatforms(industry)
}

