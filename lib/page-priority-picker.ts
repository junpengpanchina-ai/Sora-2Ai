/**
 * 自动挑选「高转化页面」算法
 * 
 * 目标：在 Index 健康允许的前提下，优先挑：
 * - Intent ≥ 2
 * - 同构低
 * - 可转化的页面
 */

import { calculateIntent } from './purchase-intent-calculator'

export type PageType = 'use_case' | 'keyword' | 'industry' | 'core_sample'
export type GeoLevel = 'G-A' | 'G-B' | 'G-C' | 'G-None'
export type PageLayer = 'asset' | 'conversion' | 'core_sample'

export interface PageCandidate {
  id: string
  pageType: PageType
  geoScore: number
  geoLevel: GeoLevel
  purchaseIntent: number // 0-3
  trendPressure: number // 0-4
  layer: PageLayer
  status: string
  dupHash?: string | null
  dupCluster?: number | null
  contentLen?: number | null
  lastGeneratedAt?: Date | null
  publishDate?: Date | null
  sceneType?: string
  industry?: string
}

export interface ScoredPage {
  pageId: string
  pageType: PageType
  scoreTotal: number
  scoreGeo: number
  scoreIntent: number
  scoreIndex: number
  scoreRisk: number
  reason: {
    geoPart: number
    intentPart: number
    indexPart: number
    freshnessPart: number
    riskPenalty: number
    indexHealth: number
  }
}

export interface PickResult {
  runId: string
  pages: ScoredPage[]
  dailyCap: number
  indexHealth: number
  pickedCount: number
}

/**
 * 计算天数差
 */
function daysSince(date: Date | null | undefined): number {
  if (!date) return 999 // 很老的页面
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

/**
 * 根据 Index Health 确定每日上限
 */
function getDailyCap(indexHealth: number): number {
  if (indexHealth >= 0.65) return 80 // 健康：60-80/天
  if (indexHealth >= 0.45) return 40 // 消化：20-40/天
  if (indexHealth >= 0.35) return 10 // 风险：5-10/天
  return 0 // 危险：0（只推 core sample 层）
}

/**
 * 计算 Geo Score Part（0-30）
 */
function calculateGeoPart(geoScore: number): number {
  if (geoScore >= 90) return 30
  if (geoScore >= 80) return 24
  if (geoScore >= 70) return 12
  return 0
}

/**
 * 计算 Intent Score Part（0-40）
 */
function calculateIntentPart(purchaseIntent: number): number {
  if (purchaseIntent === 3) return 40
  if (purchaseIntent === 2) return 28
  if (purchaseIntent === 1) return 8
  return 0
}

/**
 * 计算 Index Capacity Part（0-20）
 */
function calculateIndexPart(indexHealth: number): number {
  if (indexHealth >= 0.65) return 20
  if (indexHealth >= 0.45) return 12
  if (indexHealth >= 0.35) return 6
  return 0
}

/**
 * 计算 Freshness Part（0-10）
 */
function calculateFreshnessPart(
  lastGeneratedAt: Date | null | undefined,
  publishDate: Date | null | undefined
): number {
  const date = lastGeneratedAt || publishDate
  const days = daysSince(date)
  
  if (days <= 7) return 10
  if (days <= 30) return 6
  return 2
}

/**
 * 计算 Risk Penalty（0-50）
 */
function calculateRiskPenalty(
  page: PageCandidate,
  indexHealth: number
): number {
  let penalty = 0
  
  // 内容长度不足
  if (page.contentLen && page.contentLen < 800) {
    penalty += 15
  }
  
  // 同构风险（dup_cluster 非空）
  if (page.dupCluster != null) {
    penalty += 20
  }
  
  // 趋势压力 + Index Health 低
  if (indexHealth < 0.6 && page.trendPressure >= 2) {
    penalty += 25
  }
  
  return Math.min(penalty, 50) // 最多扣 50 分
}

/**
 * 按 dup_cluster 分组并去重
 */
function deduplicateByCluster(
  scored: ScoredPage[],
  pagesById: Map<string, PageCandidate>
): ScoredPage[] {
  const grouped = new Map<number | string, ScoredPage[]>()
  
  // 按 dup_cluster 分组
  for (const item of scored) {
    const page = pagesById.get(item.pageId)
    const clusterKey = page?.dupCluster ?? `solo:${item.pageId}`
    
    if (!grouped.has(clusterKey)) {
      grouped.set(clusterKey, [])
    }
    grouped.get(clusterKey)!.push(item)
  }
  
  // 每个簇最多保留 3 条（按分数排序）
  const deduped: ScoredPage[] = []
  for (const [, items] of grouped.entries()) {
    const sorted = items.sort((a, b) => b.scoreTotal - a.scoreTotal)
    deduped.push(...sorted.slice(0, 3)) // 每个簇最多 3 条/天
  }
  
  return deduped
}

/**
 * 自动挑选高转化页面
 * 
 * @param pages - 候选页面列表
 * @param indexHealth - 当前 Index Health（0-1）
 * @returns 挑选结果
 */
export function pickHighConversionPages(
  pages: PageCandidate[],
  indexHealth: number
): PickResult {
  const runId = crypto.randomUUID()
  const dailyCap = getDailyCap(indexHealth)
  
  // 1) 先过滤：不合格直接不要
  const eligible = pages.filter(p => {
    // 必须已发布
    if (p.status !== 'published') return false
    
    // GEO 必须 ≥ 80
    if (p.geoScore < 80) return false
    
    // Intent 必须 ≥ 2
    if (p.purchaseIntent < 2) return false
    
    // 不能是 G-None
    if (p.geoLevel === 'G-None') return false
    
    return true
  })
  
  // 2) 对每个页面打分
  const scored: ScoredPage[] = eligible.map(page => {
    const geoPart = calculateGeoPart(page.geoScore)
    const intentPart = calculateIntentPart(page.purchaseIntent)
    const indexPart = calculateIndexPart(indexHealth)
    const freshnessPart = calculateFreshnessPart(
      page.lastGeneratedAt,
      page.publishDate
    )
    const riskPenalty = calculateRiskPenalty(page, indexHealth)
    
    const total = geoPart + intentPart + indexPart + freshnessPart - riskPenalty
    
    return {
      pageId: page.id,
      pageType: page.pageType,
      scoreTotal: total,
      scoreGeo: geoPart,
      scoreIntent: intentPart,
      scoreIndex: indexPart,
      scoreRisk: riskPenalty,
      reason: {
        geoPart,
        intentPart,
        indexPart,
        freshnessPart,
        riskPenalty,
        indexHealth,
      },
    }
  })
  
  // 3) 去重：同一 dup_cluster 只保留前 N 条（防同构集中上线）
  const pagesById = new Map<string, PageCandidate>()
  for (const page of eligible) {
    pagesById.set(page.id, page)
  }
  
  const deduped = deduplicateByCluster(scored, pagesById)
  
  // 4) 排序并截断到当天配额
  const sorted = deduped.sort((a, b) => b.scoreTotal - a.scoreTotal)
  const picked = sorted.slice(0, dailyCap)
  
  return {
    runId,
    pages: picked,
    dailyCap,
    indexHealth,
    pickedCount: picked.length,
  }
}

/**
 * 批量计算 Purchase Intent（如果页面没有 purchase_intent 字段）
 */
export function enrichPagesWithIntent(
  pages: PageCandidate[]
): PageCandidate[] {
  return pages.map(page => {
    // 如果已经有 purchase_intent，直接返回
    if (page.purchaseIntent !== undefined && page.purchaseIntent > 0) {
      return page
    }
    
    // 如果没有，尝试计算
    if (page.sceneType && page.industry) {
      const intentCalc = calculateIntent(
        page.sceneType,
        page.industry,
        page.geoScore
      )
      return {
        ...page,
        purchaseIntent: intentCalc.intentScore,
        layer: intentCalc.layer as PageLayer,
      }
    }
    
    return page
  })
}

/**
 * 从数据库查询候选页面（使用 page_meta 表）
 * 
 * 方案 A：使用 page_meta 表，不依赖原表结构
 */
import type { DatabaseClient } from './db-client-types'

export async function queryCandidatePages(
  db: DatabaseClient,
  limit: number = 1000
): Promise<PageCandidate[]> {
  // 查询所有已发布、GEO ≥ 80、Intent ≥ 2 的页面
  // 使用 page_meta 表，不依赖原表结构
  
  const query = `
    SELECT 
      page_id as id,
      page_type,
      geo_score,
      geo_level,
      purchase_intent,
      trend_pressure,
      layer,
      status,
      dup_hash,
      dup_cluster,
      content_len,
      last_generated_at,
      publish_date
    FROM page_meta
    WHERE status = 'published'
      AND geo_score >= 80
      AND purchase_intent >= 2
      AND geo_level != 'G-None'
    ORDER BY geo_score DESC, purchase_intent DESC
    LIMIT $1
  `
  
  // 执行查询并转换为 PageCandidate[]
  const result = await db.query(query, [limit])
  
  return result.rows.map((row: Record<string, unknown>) => ({
    id: row.id as string,
    pageType: row.page_type as PageType,
    geoScore: row.geo_score as number,
    geoLevel: row.geo_level as GeoLevel,
    purchaseIntent: row.purchase_intent as number,
    trendPressure: row.trend_pressure as number,
    layer: row.layer as PageLayer,
    status: row.status as string,
    dupHash: row.dup_hash as string | null | undefined,
    dupCluster: row.dup_cluster as number | null | undefined,
    contentLen: row.content_len as number | null | undefined,
    lastGeneratedAt: row.last_generated_at ? new Date(row.last_generated_at as string | Date) : null,
    publishDate: row.publish_date ? new Date(row.publish_date as string | Date) : null,
  }))
}

