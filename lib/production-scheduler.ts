/**
 * GEO × Index Health 自动排产表（最终执行版）
 * 
 * 一句话目标：
 * - 不靠感觉
 * - 不追热点
 * - 自动判断「先发谁、慢发谁、暂停谁」
 */

export type GEOScore = 'G-A' | 'G-B' | 'G-C'
export type IndexHealthStatus = 'healthy' | 'digesting' | 'risk'
export type ProductionAction = 'scale' | 'stable' | 'slow' | 'sample' | 'stop'
export type PurchaseIntent = 0 | 1 | 2 | 3
export type PageLayer = 'asset' | 'conversion' | 'core-sample'

export interface ProductionDecision {
  geoScore: GEOScore
  indexHealth: number // 0-100
  trendPressure: number // 0-4
  purchaseIntent: PurchaseIntent // 0-3
  action: ProductionAction
  dailyLimit: number
  reason: string
  status: IndexHealthStatus
  layer: PageLayer
}

export interface ContentType {
  type: 'evergreen' | 'industry-scene' | 'trend-mapping'
  geoScore: GEOScore
  trendPressure: number
}

/**
 * 计算 Index Health
 * 
 * @param indexed - 已索引数量
 * @param discovered - 已发现数量
 * @param crawled - 已抓取数量
 * @returns Index Health 百分比 (0-100)
 */
export function calculateIndexHealth(
  indexed: number,
  discovered: number,
  crawled: number
): number {
  const total = discovered + crawled
  if (total === 0) return 0
  return Math.round((indexed / total) * 100)
}

/**
 * 获取 Index Health 状态
 */
export function getIndexHealthStatus(health: number): IndexHealthStatus {
  if (health >= 60) return 'healthy'
  if (health >= 40) return 'digesting'
  return 'risk'
}

/**
 * 根据 GEO 命中率计算 GEO Score
 * 
 * @param geoHitRate - GEO 命中率 (0-100)
 * @returns GEO Score
 */
export function calculateGEOScore(geoHitRate: number): GEOScore {
  if (geoHitRate >= 80) return 'G-A'
  if (geoHitRate >= 60) return 'G-B'
  return 'G-C'
}

/**
 * 计算趋势压力值
 * 
 * @param contentType - 内容类型
 * @returns Trend Pressure (0-4)
 */
export function calculateTrendPressure(contentType: ContentType): number {
  switch (contentType.type) {
    case 'evergreen':
      return 0
    case 'industry-scene':
      return 1
    case 'trend-mapping':
      return 2
    default:
      return 0
  }
}

/**
 * 计算购买意图分（Purchase Intent）
 * 
 * @param useCase - 用例描述或关键词
 * @returns Purchase Intent (0-3)
 */
export function calculatePurchaseIntent(useCase: string): PurchaseIntent {
  const lowerCase = useCase.toLowerCase()
  
  // 3 分：明确交付任务
  if (
    lowerCase.includes('demo') ||
    lowerCase.includes('listing') ||
    lowerCase.includes('promo') ||
    lowerCase.includes('recruitment') ||
    lowerCase.includes('product demo') ||
    lowerCase.includes('course promo')
  ) {
    return 3
  }
  
  // 2 分：工作场景强，但不立即交付
  if (
    lowerCase.includes('onboarding') ||
    lowerCase.includes('training') ||
    lowerCase.includes('internal') ||
    lowerCase.includes('compliance') ||
    lowerCase.includes('safety training')
  ) {
    return 2
  }
  
  // 1 分：学习/解释型
  if (
    lowerCase.includes('what is') ||
    lowerCase.includes('why') ||
    lowerCase.includes('how') ||
    lowerCase.includes('explain') ||
    lowerCase.includes('education')
  ) {
    return 1
  }
  
  // 0 分：纯泛营销/空泛场景
  return 0
}

/**
 * 确定页面层级
 * 
 * @param purchaseIntent - 购买意图分
 * @returns Page Layer
 */
export function determinePageLayer(purchaseIntent: PurchaseIntent): PageLayer {
  if (purchaseIntent >= 2) {
    return 'conversion' // 转化层
  }
  if (purchaseIntent === 1) {
    return 'asset' // 资产层
  }
  return 'asset' // 0 分也归为资产层（但禁止发布）
}

/**
 * 自动排产决策（更新版：加入 Purchase Intent）
 * 
 * @param geoScore - GEO Score
 * @param indexHealth - Index Health 百分比 (0-100)
 * @param trendPressure - Trend Pressure (0-4)
 * @param purchaseIntent - Purchase Intent (0-3)
 * @returns Production Decision
 */
export function makeProductionDecision(
  geoScore: GEOScore,
  indexHealth: number,
  trendPressure: number,
  purchaseIntent: PurchaseIntent = 1 // 默认 1 分（解释型）
): ProductionDecision {
  const status = getIndexHealthStatus(indexHealth)
  const layer = determinePageLayer(purchaseIntent)
  
  // 🔴 暂停发布（不争论）
  if (geoScore === 'G-C') {
    return {
      geoScore,
      indexHealth,
      trendPressure,
      purchaseIntent,
      action: 'stop',
      dailyLimit: 0,
      reason: 'G-C 内容禁止发布',
      status,
      layer,
    }
  }
  
  if (purchaseIntent === 0) {
    return {
      geoScore,
      indexHealth,
      trendPressure,
      purchaseIntent,
      action: 'stop',
      dailyLimit: 0,
      reason: 'Purchase Intent = 0（无商业价值）',
      status,
      layer,
    }
  }
  
  if (indexHealth < 40 && trendPressure >= 1) {
    return {
      geoScore,
      indexHealth,
      trendPressure,
      purchaseIntent,
      action: 'stop',
      dailyLimit: 0,
      reason: 'Index Health <40% + Trend Pressure ≥1',
      status,
      layer,
    }
  }
  
  if (trendPressure >= 3) {
    return {
      geoScore,
      indexHealth,
      trendPressure,
      purchaseIntent,
      action: 'stop',
      dailyLimit: 0,
      reason: 'Trend Pressure ≥3',
      status,
      layer,
    }
  }
  
  // 🟢 全速区（可以加速）
  // G-A + Index ≥65% + Pressure ≤1 + Intent ≥2
  if (geoScore === 'G-A' && indexHealth >= 65 && trendPressure <= 1 && purchaseIntent >= 2) {
    return {
      geoScore,
      indexHealth,
      trendPressure,
      purchaseIntent,
      action: 'scale',
      dailyLimit: 70, // 全速区：60-80 页
      reason: '全速区：G-A + Index ≥65% + Pressure ≤1 + Intent ≥2',
      status,
      layer,
    }
  }
  
  // G-A + Index ≥65% + Pressure ≤2 + Intent = 3（高商业价值）
  if (geoScore === 'G-A' && indexHealth >= 65 && trendPressure <= 2 && purchaseIntent === 3) {
    return {
      geoScore,
      indexHealth,
      trendPressure,
      purchaseIntent,
      action: 'scale',
      dailyLimit: 70, // 全速区：60-80 页
      reason: '全速区：G-A + Index ≥65% + Pressure ≤2 + Intent = 3（高商业价值）',
      status,
      layer,
    }
  }
  
  // 🟢 优先发布（放心发）
  // G-A + Index ≥60% + Pressure ≤2 + Intent ≥2
  if (geoScore === 'G-A' && indexHealth >= 60 && indexHealth < 65 && trendPressure <= 2 && purchaseIntent >= 2) {
    return {
      geoScore,
      indexHealth,
      trendPressure,
      purchaseIntent,
      action: 'scale',
      dailyLimit: 50, // 可以放量
      reason: 'G-A + Index ≥60% + Pressure ≤2 + Intent ≥2',
      status,
      layer,
    }
  }
  
  // G-A + Index 40-59% + Pressure 0-1 + Intent ≥2
  if (geoScore === 'G-A' && indexHealth >= 40 && indexHealth < 60 && trendPressure <= 1 && purchaseIntent >= 2) {
    return {
      geoScore,
      indexHealth,
      trendPressure,
      purchaseIntent,
      action: 'stable',
      dailyLimit: 30, // 稳定节奏
      reason: 'G-A + Index 40-59% + Pressure 0-1 + Intent ≥2',
      status,
      layer,
    }
  }
  
  // G-A + Index ≥60% + Pressure ≤2 + Intent = 1（资产层）
  if (geoScore === 'G-A' && indexHealth >= 60 && trendPressure <= 2 && purchaseIntent === 1) {
    return {
      geoScore,
      indexHealth,
      trendPressure,
      purchaseIntent,
      action: 'stable',
      dailyLimit: 20, // 资产层
      reason: 'G-A + Index ≥60% + Pressure ≤2 + Intent = 1（资产层）',
      status,
      layer,
    }
  }
  
  // G-B + Index ≥60% + Pressure 0 + Intent ≥2
  if (geoScore === 'G-B' && indexHealth >= 60 && trendPressure === 0 && purchaseIntent >= 2) {
    return {
      geoScore,
      indexHealth,
      trendPressure,
      purchaseIntent,
      action: 'stable',
      dailyLimit: 10, // 少量补充
      reason: 'G-B + Index ≥60% + Pressure 0 + Intent ≥2',
      status,
      layer,
    }
  }
  
  // 🟡 稳定区（推荐区）
  // G-A + Index 45-64% + Pressure ≤1 + Intent ≥2
  if (geoScore === 'G-A' && indexHealth >= 45 && indexHealth < 65 && trendPressure <= 1 && purchaseIntent >= 2) {
    return {
      geoScore,
      indexHealth,
      trendPressure,
      purchaseIntent,
      action: 'stable',
      dailyLimit: 30, // 稳定区：20-40 页
      reason: '稳定区：G-A + Index 45-64% + Pressure ≤1 + Intent ≥2',
      status,
      layer,
    }
  }
  
  // G-A + Index ≥65% + Pressure 0 + Intent = 1（资产层）
  if (geoScore === 'G-A' && indexHealth >= 65 && trendPressure === 0 && purchaseIntent === 1) {
    return {
      geoScore,
      indexHealth,
      trendPressure,
      purchaseIntent,
      action: 'stable',
      dailyLimit: 30, // 稳定区：20-40 页
      reason: '稳定区：G-A + Index ≥65% + Pressure 0 + Intent = 1（资产层）',
      status,
      layer,
    }
  }
  
  // 🟡 控制发布（慢一点）
  // G-A + Index 40-59% + Pressure 2 + Intent ≥2
  if (geoScore === 'G-A' && indexHealth >= 40 && indexHealth < 60 && trendPressure === 2 && purchaseIntent >= 2) {
    return {
      geoScore,
      indexHealth,
      trendPressure,
      purchaseIntent,
      action: 'slow',
      dailyLimit: 15, // 减速 30%
      reason: 'G-A + Index 40-59% + Pressure 2 + Intent ≥2',
      status,
      layer,
    }
  }
  
  // G-A + Index 40-59% + Pressure 0-1 + Intent = 1（资产层）
  if (geoScore === 'G-A' && indexHealth >= 40 && indexHealth < 60 && trendPressure <= 1 && purchaseIntent === 1) {
    return {
      geoScore,
      indexHealth,
      trendPressure,
      purchaseIntent,
      action: 'slow',
      dailyLimit: 10, // 资产层
      reason: 'G-A + Index 40-59% + Pressure 0-1 + Intent = 1（资产层）',
      status,
      layer,
    }
  }
  
  // 🟠 观察区（谨慎）
  // G-A + Index 35-44% + Pressure 0 + Intent ≥2
  if (geoScore === 'G-A' && indexHealth >= 35 && indexHealth < 45 && trendPressure === 0 && purchaseIntent >= 2) {
    return {
      geoScore,
      indexHealth,
      trendPressure,
      purchaseIntent,
      action: 'slow',
      dailyLimit: 8, // 观察区：5-10 页
      reason: '观察区：G-A + Index 35-44% + Pressure 0 + Intent ≥2',
      status,
      layer,
    }
  }
  
  // G-A + Index 45-64% + Pressure 1 + Intent = 1
  if (geoScore === 'G-A' && indexHealth >= 45 && indexHealth < 65 && trendPressure === 1 && purchaseIntent === 1) {
    return {
      geoScore,
      indexHealth,
      trendPressure,
      purchaseIntent,
      action: 'slow',
      dailyLimit: 8, // 观察区：5-10 页
      reason: '观察区：G-A + Index 45-64% + Pressure 1 + Intent = 1',
      status,
      layer,
    }
  }
  
  // G-B + Index 40-59% + Pressure 0-1 + Intent ≥2
  if (geoScore === 'G-B' && indexHealth >= 40 && indexHealth < 60 && trendPressure <= 1 && purchaseIntent >= 2) {
    return {
      geoScore,
      indexHealth,
      trendPressure,
      purchaseIntent,
      action: 'slow',
      dailyLimit: 5, // 观察
      reason: 'G-B + Index 40-59% + Pressure 0-1 + Intent ≥2',
      status,
      layer,
    }
  }
  
  // 🔴 冻结区（绝不新增）
  // Index <35% 或 Intent = 0 或 Trend ≥2
  if (indexHealth < 35) {
    return {
      geoScore,
      indexHealth,
      trendPressure,
      purchaseIntent,
      action: 'stop',
      dailyLimit: 0,
      reason: '冻结区：Index Health <35%',
      status,
      layer,
    }
  }
  
  // G-A + Index <40% + Pressure 0 + Intent ≥2（样本区）
  if (geoScore === 'G-A' && indexHealth >= 35 && indexHealth < 40 && trendPressure === 0 && purchaseIntent >= 2) {
    return {
      geoScore,
      indexHealth,
      trendPressure,
      purchaseIntent,
      action: 'sample',
      dailyLimit: 5, // 只发样本
      reason: '观察区：G-A + Index 35-40% + Pressure 0 + Intent ≥2',
      status,
      layer,
    }
  }
  
  // 默认：暂停
  return {
    geoScore,
    indexHealth,
    trendPressure,
    purchaseIntent,
    action: 'stop',
    dailyLimit: 0,
    reason: '不符合任何发布条件',
    status,
    layer,
  }
}

/**
 * 计算每日发布分配
 * 
 * @param dailyLimit - 每日总量限制
 * @returns 发布分配
 */
export function calculateDailyDistribution(dailyLimit: number): {
  evergreen: number
  industryScene: number
  trendMapping: number
} {
  return {
    evergreen: Math.round(dailyLimit * 0.7), // 70%
    industryScene: Math.round(dailyLimit * 0.2), // 20%
    trendMapping: Math.round(dailyLimit * 0.1), // 10%
  }
}

/**
 * 验证趋势压力是否符合规则
 * 
 * @param indexHealth - Index Health 百分比
 * @param trendPressure - Trend Pressure
 * @returns 是否有效
 */
export function validateTrendPressure(
  indexHealth: number,
  trendPressure: number
): boolean {
  if (indexHealth < 60) {
    return trendPressure <= 2
  }
  return trendPressure <= 4
}

/**
 * 获取行动说明
 */
export function getActionDescription(action: ProductionAction): string {
  switch (action) {
    case 'scale':
      return '✅ 放量发布（可以加速）'
    case 'stable':
      return '✅ 稳定发布（维持节奏）'
    case 'slow':
      return '⚠️ 控制发布（减速 30%）'
    case 'sample':
      return '⚠️ 样本发布（仅样本页）'
    case 'stop':
      return '⛔ 暂停发布（禁止）'
    default:
      return '未知行动'
  }
}

/**
 * 冷却机制：检测是否需要暂停发布
 * 
 * 如果 3 天内：
 * - Indexed 不增长
 * - Crawled 快速上升
 * 
 * 则自动暂停 48 小时
 */
export interface CoolingPeriod {
  shouldCool: boolean
  reason: string
  cooldownHours: number
}

export function checkCoolingPeriod(params: {
  currentIndexed: number
  previousIndexed: number // 3 天前
  currentCrawled: number
  previousCrawled: number // 3 天前
  daysSinceLastCheck: number
}): CoolingPeriod {
  const indexedGrowth = params.currentIndexed - params.previousIndexed
  const crawledGrowth = params.currentCrawled - params.previousCrawled
  const crawledGrowthRate = params.previousCrawled > 0 
    ? (crawledGrowth / params.previousCrawled) * 100 
    : 0
  
  // 条件 1：Indexed 不增长（或下降）
  const indexedStagnant = indexedGrowth <= 0
  
  // 条件 2：Crawled 快速上升（超过 50%）
  const crawledSpike = crawledGrowthRate > 50
  
  if (indexedStagnant && crawledSpike) {
    return {
      shouldCool: true,
      reason: `Indexed 未增长（${indexedGrowth}），但 Crawled 快速上升（${crawledGrowthRate.toFixed(1)}%）`,
      cooldownHours: 48
    }
  }
  
  // 如果 Indexed 下降超过 10%，也需要冷却
  if (params.previousIndexed > 0) {
    const indexedDropRate = ((params.currentIndexed - params.previousIndexed) / params.previousIndexed) * 100
    if (indexedDropRate < -10) {
      return {
        shouldCool: true,
        reason: `Indexed 下降 ${Math.abs(indexedDropRate).toFixed(1)}%`,
        cooldownHours: 48
      }
    }
  }
  
  return {
    shouldCool: false,
    reason: '指标正常，无需冷却',
    cooldownHours: 0
  }
}

/**
 * 完整决策流程（更新版：加入 Purchase Intent + 冷却机制）
 */
export function makeFullDecision(params: {
  indexed: number
  discovered: number
  crawled: number
  geoHitRate: number
  contentType: ContentType
  useCase?: string // 用于计算 Purchase Intent
  purchaseIntent?: PurchaseIntent // 可选：直接提供 Purchase Intent
  // 冷却机制参数（可选）
  previousIndexed?: number
  previousCrawled?: number
  daysSinceLastCheck?: number
}): ProductionDecision & {
  distribution: {
    evergreen: number
    industryScene: number
    trendMapping: number
  }
  cooling?: CoolingPeriod
} {
  const indexHealth = calculateIndexHealth(
    params.indexed,
    params.discovered,
    params.crawled
  )
  
  const geoScore = calculateGEOScore(params.geoHitRate)
  const trendPressure = calculateTrendPressure(params.contentType)
  const purchaseIntent = params.purchaseIntent ?? 
    (params.useCase ? calculatePurchaseIntent(params.useCase) : 1)
  
  // 检查冷却机制
  let cooling: CoolingPeriod | undefined
  if (params.previousIndexed !== undefined && 
      params.previousCrawled !== undefined &&
      params.daysSinceLastCheck !== undefined) {
    cooling = checkCoolingPeriod({
      currentIndexed: params.indexed,
      previousIndexed: params.previousIndexed,
      currentCrawled: params.crawled,
      previousCrawled: params.previousCrawled,
      daysSinceLastCheck: params.daysSinceLastCheck
    })
    
    // 如果需要冷却，强制停止发布
    if (cooling.shouldCool) {
      return {
        geoScore,
        indexHealth,
        trendPressure,
        purchaseIntent,
        action: 'stop',
        dailyLimit: 0,
        reason: `冷却期：${cooling.reason}`,
        status: 'risk',
        layer: 'asset',
        distribution: {
          evergreen: 0,
          industryScene: 0,
          trendMapping: 0
        },
        cooling
      }
    }
  }
  
  const decision = makeProductionDecision(geoScore, indexHealth, trendPressure, purchaseIntent)
  const distribution = calculateDailyDistribution(decision.dailyLimit)
  
  return {
    ...decision,
    distribution,
    cooling
  }
}

