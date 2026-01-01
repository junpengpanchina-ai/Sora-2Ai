/**
 * 页面优先队列管理
 * 
 * 功能：
 * 1. 将挑选结果写入 page_priority_queue 表
 * 2. 从队列中读取待发布页面
 * 3. 标记已发布页面
 */

import type { DatabaseClient } from './db-client-types'
import type { PickResult } from './page-priority-picker'

export interface QueueItem {
  id: bigint
  runId: string
  pageType: string
  pageId: string
  scoreTotal: number
  scoreGeo: number
  scoreIntent: number
  scoreIndex: number
  scoreRisk: number
  reason: Record<string, unknown>
  createdAt: Date
}

/**
 * 将挑选结果写入队列
 */
export async function writeToQueue(
  db: DatabaseClient,
  result: PickResult
): Promise<void> {
  const insertQuery = `
    INSERT INTO page_priority_queue (
      run_id,
      page_type,
      page_id,
      score_total,
      score_geo,
      score_intent,
      score_index,
      score_risk,
      reason
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9
    )
  `
  
  // 批量插入
  for (const page of result.pages) {
    await db.query(insertQuery, [
      result.runId,
      page.pageType,
      page.pageId,
      page.scoreTotal,
      page.scoreGeo,
      page.scoreIntent,
      page.scoreIndex,
      page.scoreRisk,
      JSON.stringify(page.reason),
    ])
  }
}

/**
 * 从队列中读取待发布页面（按分数排序）
 */
export async function readFromQueue(
  db: DatabaseClient,
  limit: number = 50
): Promise<QueueItem[]> {
  const query = `
    SELECT 
      id,
      run_id,
      page_type,
      page_id,
      score_total,
      score_geo,
      score_intent,
      score_index,
      score_risk,
      reason,
      created_at
    FROM page_priority_queue
    WHERE id NOT IN (
      SELECT queue_id FROM published_pages WHERE queue_id IS NOT NULL
    )
    ORDER BY score_total DESC
    LIMIT $1
  `
  
  const result = await db.query(query, [limit])
  return result.rows.map((row: Record<string, unknown>) => ({
    id: BigInt(row.id as string | number),
    runId: row.run_id as string,
    pageType: row.page_type as string,
    pageId: row.page_id as string,
    scoreTotal: parseFloat(String(row.score_total)),
    scoreGeo: parseFloat(String(row.score_geo)),
    scoreIntent: parseFloat(String(row.score_intent)),
    scoreIndex: parseFloat(String(row.score_index)),
    scoreRisk: parseFloat(String(row.score_risk)),
    reason: row.reason as Record<string, unknown>,
    createdAt: new Date(row.created_at as string | Date),
  }))
}

/**
 * 标记页面已发布（可选：创建 published_pages 表）
 */
export async function markAsPublished(
  db: DatabaseClient,
  queueId: bigint,
  pageId: string,
  pageType: string
): Promise<void> {
  // 如果还没有 published_pages 表，可以创建：
  /*
  CREATE TABLE IF NOT EXISTS published_pages (
    id BIGSERIAL PRIMARY KEY,
    queue_id BIGINT REFERENCES page_priority_queue(id),
    page_id UUID NOT NULL,
    page_type TEXT NOT NULL,
    published_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  */
  
  const insertQuery = `
    INSERT INTO published_pages (queue_id, page_id, page_type)
    VALUES ($1, $2, $3)
    ON CONFLICT DO NOTHING
  `
  
  await db.query(insertQuery, [queueId, pageId, pageType])
}

/**
 * 清理旧队列数据（保留最近 30 天）
 */
export async function cleanupOldQueue(
  db: DatabaseClient,
  daysToKeep: number = 30
): Promise<void> {
  const query = `
    DELETE FROM page_priority_queue
    WHERE created_at < NOW() - INTERVAL '${daysToKeep} days'
  `
  
  await db.query(query)
}

