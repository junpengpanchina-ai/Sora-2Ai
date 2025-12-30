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

export interface ProductionDecision {
  geoScore: GEOScore
  indexHealth: number // 0-100
  trendPressure: number // 0-4
  action: ProductionAction
  dailyLimit: number
  reason: string
  status: IndexHealthStatus
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
 * 自动排产决策
 * 
 * @param geoScore - GEO Score
 * @param indexHealth - Index Health 百分比 (0-100)
 * @param trendPressure - Trend Pressure (0-4)
 * @returns Production Decision
 */
export function makeProductionDecision(
  geoScore: GEOScore,
  indexHealth: number,
  trendPressure: number
): ProductionDecision {
  const status = getIndexHealthStatus(indexHealth)
  
  // 🔴 暂停发布（不争论）
  if (geoScore === 'G-C') {
    return {
      geoScore,
      indexHealth,
      trendPressure,
      action: 'stop',
      dailyLimit: 0,
      reason: 'G-C 内容禁止发布',
      status,
    }
  }
  
  if (indexHealth < 40 && trendPressure >= 1) {
    return {
      geoScore,
      indexHealth,
      trendPressure,
      action: 'stop',
      dailyLimit: 0,
      reason: 'Index Health <40% + Trend Pressure ≥1',
      status,
    }
  }
  
  if (trendPressure >= 3) {
    return {
      geoScore,
      indexHealth,
      trendPressure,
      action: 'stop',
      dailyLimit: 0,
      reason: 'Trend Pressure ≥3',
      status,
    }
  }
  
  // 🟢 优先发布（放心发）
  if (geoScore === 'G-A' && indexHealth >= 60 && trendPressure <= 2) {
    return {
      geoScore,
      indexHealth,
      trendPressure,
      action: 'scale',
      dailyLimit: 50, // 可以放量
      reason: 'G-A + Index ≥60% + Pressure ≤2',
      status,
    }
  }
  
  if (geoScore === 'G-A' && indexHealth >= 40 && indexHealth < 60 && trendPressure <= 1) {
    return {
      geoScore,
      indexHealth,
      trendPressure,
      action: 'stable',
      dailyLimit: 30, // 稳定节奏
      reason: 'G-A + Index 40-59% + Pressure 0-1',
      status,
    }
  }
  
  if (geoScore === 'G-B' && indexHealth >= 60 && trendPressure === 0) {
    return {
      geoScore,
      indexHealth,
      trendPressure,
      action: 'stable',
      dailyLimit: 10, // 少量补充
      reason: 'G-B + Index ≥60% + Pressure 0',
      status,
    }
  }
  
  // 🟡 控制发布（慢一点）
  if (geoScore === 'G-A' && indexHealth >= 40 && indexHealth < 60 && trendPressure === 2) {
    return {
      geoScore,
      indexHealth,
      trendPressure,
      action: 'slow',
      dailyLimit: 20, // 减速 30%
      reason: 'G-A + Index 40-59% + Pressure 2',
      status,
    }
  }
  
  if (geoScore === 'G-B' && indexHealth >= 40 && indexHealth < 60 && trendPressure <= 1) {
    return {
      geoScore,
      indexHealth,
      trendPressure,
      action: 'slow',
      dailyLimit: 5, // 观察
      reason: 'G-B + Index 40-59% + Pressure 0-1',
      status,
    }
  }
  
  if (geoScore === 'G-A' && indexHealth < 40 && trendPressure === 0) {
    return {
      geoScore,
      indexHealth,
      trendPressure,
      action: 'sample',
      dailyLimit: 5, // 只发样本
      reason: 'G-A + Index <40% + Pressure 0',
      status,
    }
  }
  
  // 默认：暂停
  return {
    geoScore,
    indexHealth,
    trendPressure,
    action: 'stop',
    dailyLimit: 0,
    reason: '不符合任何发布条件',
    status,
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
 * 完整决策流程
 */
export function makeFullDecision(params: {
  indexed: number
  discovered: number
  crawled: number
  geoHitRate: number
  contentType: ContentType
}): ProductionDecision & {
  distribution: {
    evergreen: number
    industryScene: number
    trendMapping: number
  }
} {
  const indexHealth = calculateIndexHealth(
    params.indexed,
    params.discovered,
    params.crawled
  )
  
  const geoScore = calculateGEOScore(params.geoHitRate)
  const trendPressure = calculateTrendPressure(params.contentType)
  
  const decision = makeProductionDecision(geoScore, indexHealth, trendPressure)
  const distribution = calculateDailyDistribution(decision.dailyLimit)
  
  return {
    ...decision,
    distribution,
  }
}

