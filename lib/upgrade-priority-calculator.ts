/**
 * 升级优先级计算器
 * 
 * 使用推荐权重公式，选出最值得升级成"赚钱页"的页面
 */

export interface UpgradePriorityParams {
  aiPrimeScore: number // 0-6
  aiSignalScore: number // 0-10+
  purchaseIntent: number // 0-3
  indexHealth: number // 0-100
  indexState?: 'indexed' | 'crawled' | 'discovered' | 'unknown'
}

/**
 * 推荐权重公式（直接可用）
 * 
 * priority_score =
 *   (ai_prime_score * 0.45)
 *   + (ai_signal_score * 0.30)
 *   + (purchase_intent * 0.15)
 *   + (index_health_weight * 0.10)
 */
export function calculateUpgradePriority(params: UpgradePriorityParams): {
  priority: number
  breakdown: {
    aiPrimePart: number
    aiSignalPart: number
    purchaseIntentPart: number
    indexHealthPart: number
  }
  indexHealthWeight: number
} {
  // 计算 index_health_weight
  let indexHealthWeight = 0
  if (params.indexState === 'indexed') {
    indexHealthWeight = 1.0
  } else if (params.indexState === 'crawled') {
    indexHealthWeight = 0.5
  } else if (params.indexHealth >= 60) {
    indexHealthWeight = 1.0
  } else if (params.indexHealth >= 40) {
    indexHealthWeight = 0.5
  }
  
  // 计算各部分
  const aiPrimePart = params.aiPrimeScore * 0.45
  const aiSignalPart = params.aiSignalScore * 0.30
  const purchaseIntentPart = params.purchaseIntent * 0.15
  const indexHealthPart = indexHealthWeight * 0.10
  
  // 总优先级
  const priority = aiPrimePart + aiSignalPart + purchaseIntentPart + indexHealthPart
  
  return {
    priority,
    breakdown: {
      aiPrimePart,
      aiSignalPart,
      purchaseIntentPart,
      indexHealthPart
    },
    indexHealthWeight
  }
}

/**
 * 批量计算升级优先级并排序
 */
export function selectTopUpgradePages(
  pages: Array<{
    pageId: string
    pageSlug: string
    aiPrimeScore: number
    aiSignalScore: number
    purchaseIntent: number
    indexHealth: number
    indexState?: 'indexed' | 'crawled' | 'discovered' | 'unknown'
  }>,
  limit: number = 10
): Array<{
  pageId: string
  pageSlug: string
  priority: number
  breakdown: {
    aiPrimePart: number
    aiSignalPart: number
    purchaseIntentPart: number
    indexHealthPart: number
  }
}> {
  return pages
    .map(page => {
      const result = calculateUpgradePriority({
        aiPrimeScore: page.aiPrimeScore,
        aiSignalScore: page.aiSignalScore,
        purchaseIntent: page.purchaseIntent,
        indexHealth: page.indexHealth,
        indexState: page.indexState
      })
      
      return {
        pageId: page.pageId,
        pageSlug: page.pageSlug,
        priority: result.priority,
        breakdown: result.breakdown
      }
    })
    .sort((a, b) => b.priority - a.priority)
    .slice(0, limit)
}

