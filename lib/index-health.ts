/**
 * Index Health 管理
 * 
 * 功能：
 * 1. 从 index_health_daily 表读取数据
 * 2. 计算 Index Health
 * 3. 更新每日快照
 */

export interface IndexHealthSnapshot {
  day: Date
  discovered: number
  crawled: number
  indexed: number
  crawlRequestsPerDay?: number | null
  sitemapLastReadAt?: Date | null
  sitemapSuccess?: boolean | null
  notes?: string | null
}

/**
 * 计算 Index Health
 */
export function calculateIndexHealth(
  discovered: number,
  crawled: number,
  indexed: number
): number {
  const total = discovered + crawled
  if (total === 0) return 0
  return indexed / total
}

/**
 * 获取当前 Index Health（从数据库）
 */
export async function getCurrentIndexHealth(
  db?: any // 你的数据库客户端
): Promise<number | null> {
  if (!db) {
    // 如果没有数据库客户端，返回 null
    return null
  }
  
  const query = `
    SELECT 
      discovered,
      crawled,
      indexed
    FROM index_health_daily
    ORDER BY day DESC
    LIMIT 1
  `
  
  const result = await db.query(query)
  
  if (result.rows.length === 0) {
    return null
  }
  
  const row = result.rows[0]
  return calculateIndexHealth(
    row.discovered,
    row.crawled,
    row.indexed
  )
}

/**
 * 更新 Index Health 快照
 */
export async function updateIndexHealthSnapshot(
  db: any,
  snapshot: IndexHealthSnapshot
): Promise<void> {
  const query = `
    INSERT INTO index_health_daily (
      day,
      discovered,
      crawled,
      indexed,
      crawl_requests_per_day,
      sitemap_last_read_at,
      sitemap_success,
      notes
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8
    )
    ON CONFLICT (day) DO UPDATE SET
      discovered = EXCLUDED.discovered,
      crawled = EXCLUDED.crawled,
      indexed = EXCLUDED.indexed,
      crawl_requests_per_day = EXCLUDED.crawl_requests_per_day,
      sitemap_last_read_at = EXCLUDED.sitemap_last_read_at,
      sitemap_success = EXCLUDED.sitemap_success,
      notes = EXCLUDED.notes
  `
  
  await db.query(query, [
    snapshot.day,
    snapshot.discovered,
    snapshot.crawled,
    snapshot.indexed,
    snapshot.crawlRequestsPerDay,
    snapshot.sitemapLastReadAt,
    snapshot.sitemapSuccess,
    snapshot.notes,
  ])
}

/**
 * 获取最近 N 天的 Index Health 趋势
 */
export async function getIndexHealthTrend(
  db: any,
  days: number = 7
): Promise<Array<{ day: Date; indexHealth: number }>> {
  const query = `
    SELECT 
      day,
      discovered,
      crawled,
      indexed
    FROM index_health_daily
    ORDER BY day DESC
    LIMIT $1
  `
  
  const result = await db.query(query, [days])
  
  return result.rows.map((row: any) => ({
    day: new Date(row.day),
    indexHealth: calculateIndexHealth(
      row.discovered,
      row.crawled,
      row.indexed
    ),
  }))
}

