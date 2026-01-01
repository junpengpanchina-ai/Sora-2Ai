/**
 * Page Meta 辅助函数
 * 
 * 功能：
 * 1. 获取或创建 page_meta 记录
 * 2. 更新 page_meta 字段
 * 3. 批量操作
 */

export interface PageMetaData {
  pageType: 'use_case' | 'keyword' | 'industry' | 'core_sample'
  pageId: string
  pageSlug?: string | null
  variantId?: string | null
  geoScore?: number
  geoLevel?: 'G-A' | 'G-B' | 'G-C' | 'G-None'
  purchaseIntent?: number
  trendPressure?: number
  layer?: 'asset' | 'conversion' | 'core_sample'
  status?: 'draft' | 'published' | 'paused'
  promptPreviewEnabled?: boolean
  promptPreviewText?: string | null
  ctaVariant?: 'continue' | 'generate' | 'turn_into_video'
  paywallVariant?: 'export_lock' | 'style_lock' | 'full_lock'
  publishBatch?: number | null
  publishDate?: Date | null
  indexState?: 'unknown' | 'discovered' | 'crawled' | 'indexed' | 'excluded'
  lastIndexCheckAt?: Date | null
  dupHash?: string | null
  dupCluster?: number | null
  contentLen?: number | null
  lastGeneratedAt?: Date | null
}

/**
 * 获取或创建 page_meta 记录
 */
export async function getOrCreatePageMeta(
  db: any,
  pageType: string,
  pageId: string,
  pageSlug?: string | null
): Promise<PageMetaData | null> {
  // 先尝试获取
  const selectQuery = `
    SELECT * FROM page_meta
    WHERE page_type = $1 AND page_id = $2
  `
  
  const selectResult = await db.query(selectQuery, [pageType, pageId])
  
  if (selectResult.rows.length > 0) {
    return mapRowToPageMeta(selectResult.rows[0])
  }
  
  // 如果不存在，创建默认记录
  const insertQuery = `
    INSERT INTO page_meta (page_type, page_id, page_slug)
    VALUES ($1, $2, $3)
    RETURNING *
  `
  
  const insertResult = await db.query(insertQuery, [pageType, pageId, pageSlug || null])
  
  if (insertResult.rows.length > 0) {
    return mapRowToPageMeta(insertResult.rows[0])
  }
  
  return null
}

/**
 * 更新 page_meta 字段
 */
export async function updatePageMeta(
  db: any,
  pageType: string,
  pageId: string,
  updates: Partial<PageMetaData>
): Promise<PageMetaData | null> {
  const fields: string[] = []
  const values: any[] = []
  let paramIndex = 1
  
  // 构建更新字段
  if (updates.geoScore !== undefined) {
    fields.push(`geo_score = $${paramIndex++}`)
    values.push(updates.geoScore)
  }
  if (updates.geoLevel !== undefined) {
    fields.push(`geo_level = $${paramIndex++}`)
    values.push(updates.geoLevel)
  }
  if (updates.purchaseIntent !== undefined) {
    fields.push(`purchase_intent = $${paramIndex++}`)
    values.push(updates.purchaseIntent)
  }
  if (updates.trendPressure !== undefined) {
    fields.push(`trend_pressure = $${paramIndex++}`)
    values.push(updates.trendPressure)
  }
  if (updates.layer !== undefined) {
    fields.push(`layer = $${paramIndex++}`)
    values.push(updates.layer)
  }
  if (updates.status !== undefined) {
    fields.push(`status = $${paramIndex++}`)
    values.push(updates.status)
  }
  if (updates.promptPreviewEnabled !== undefined) {
    fields.push(`prompt_preview_enabled = $${paramIndex++}`)
    values.push(updates.promptPreviewEnabled)
  }
  if (updates.promptPreviewText !== undefined) {
    fields.push(`prompt_preview_text = $${paramIndex++}`)
    values.push(updates.promptPreviewText)
  }
  if (updates.publishDate !== undefined) {
    fields.push(`publish_date = $${paramIndex++}`)
    values.push(updates.publishDate)
  }
  if (updates.indexState !== undefined) {
    fields.push(`index_state = $${paramIndex++}`)
    values.push(updates.indexState)
  }
  if (updates.contentLen !== undefined) {
    fields.push(`content_len = $${paramIndex++}`)
    values.push(updates.contentLen)
  }
  if (updates.lastGeneratedAt !== undefined) {
    fields.push(`last_generated_at = $${paramIndex++}`)
    values.push(updates.lastGeneratedAt)
  }
  
  if (fields.length === 0) {
    // 没有要更新的字段，直接返回现有记录
    return getOrCreatePageMeta(db, pageType, pageId)
  }
  
  // 添加 WHERE 条件
  values.push(pageType, pageId)
  
  const query = `
    UPDATE page_meta
    SET ${fields.join(', ')}
    WHERE page_type = $${paramIndex++} AND page_id = $${paramIndex++}
    RETURNING *
  `
  
  const result = await db.query(query, values)
  
  if (result.rows.length > 0) {
    return mapRowToPageMeta(result.rows[0])
  }
  
  return null
}

/**
 * 批量更新 page_meta
 */
export async function batchUpdatePageMeta(
  db: any,
  updates: Array<{ pageType: string; pageId: string; data: Partial<PageMetaData> }>
): Promise<void> {
  // 使用事务批量更新
  for (const update of updates) {
    await updatePageMeta(db, update.pageType, update.pageId, update.data)
  }
}

/**
 * 将数据库行映射为 PageMetaData
 */
function mapRowToPageMeta(row: any): PageMetaData {
  return {
    pageType: row.page_type,
    pageId: row.page_id,
    pageSlug: row.page_slug,
    variantId: row.variant_id,
    geoScore: row.geo_score,
    geoLevel: row.geo_level,
    purchaseIntent: row.purchase_intent,
    trendPressure: row.trend_pressure,
    layer: row.layer,
    status: row.status,
    promptPreviewEnabled: row.prompt_preview_enabled,
    promptPreviewText: row.prompt_preview_text,
    ctaVariant: row.cta_variant,
    paywallVariant: row.paywall_variant,
    publishBatch: row.publish_batch,
    publishDate: row.publish_date ? new Date(row.publish_date) : null,
    indexState: row.index_state,
    lastIndexCheckAt: row.last_index_check_at ? new Date(row.last_index_check_at) : null,
    dupHash: row.dup_hash,
    dupCluster: row.dup_cluster,
    contentLen: row.content_len,
    lastGeneratedAt: row.last_generated_at ? new Date(row.last_generated_at) : null,
  }
}

