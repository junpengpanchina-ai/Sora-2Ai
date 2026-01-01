-- ============================================
-- 批量更新 Purchase Intent（最简单版本 - 避免超时）
-- ============================================
-- 说明：每次更新 5,000 条，手动重复执行
-- ============================================

-- ============================================
-- 方法 1：使用 CTE 限制更新数量（推荐）
-- ============================================

WITH batch AS (
  SELECT pm.page_id
  FROM page_meta pm
  WHERE pm.page_type = 'use_case'
    AND pm.status = 'published'
    AND pm.purchase_intent = 0
  LIMIT 5000
),
updates AS (
  SELECT 
    b.page_id,
    CASE
      -- 3 分：明确交付任务
      WHEN uc.use_case_type IN ('product-demo-showcase', 'advertising-promotion') THEN 3
      -- 2 分：工作场景强
      WHEN uc.use_case_type IN ('education-explainer', 'ugc-creator-content') THEN 2
      -- 1 分：学习/解释型
      WHEN uc.use_case_type = 'brand-storytelling' THEN 1
      -- 0 分：纯泛营销/空泛场景
      WHEN uc.use_case_type = 'social-media-content' THEN 0
      ELSE 0
    END as purchase_intent,
    CASE
      -- Intent ≥2 且 GEO ≥80 才能进入 conversion 层（这里简化处理，只按 Intent 判断）
      -- 注意：完整的 layer 判断还需要考虑 geo_score，后续可以通过其他方式调整
      WHEN uc.use_case_type IN ('product-demo-showcase', 'advertising-promotion') THEN 'conversion'
      WHEN uc.use_case_type IN ('education-explainer', 'ugc-creator-content') THEN 'conversion'
      -- Intent <2 的归为 asset 层
      ELSE 'asset'
    END as layer
  FROM batch b
  INNER JOIN use_cases uc ON b.page_id = uc.id
)
UPDATE page_meta pm
SET 
  purchase_intent = u.purchase_intent,
  layer = u.layer
FROM updates u
WHERE pm.page_id = u.page_id;

-- ============================================
-- 方法 2：更简单的版本（如果方法 1 还是超时）
-- ============================================

-- 先创建一个临时表存储需要更新的数据
CREATE TEMP TABLE IF NOT EXISTS temp_batch_update AS
SELECT 
  pm.page_id,
  CASE
    WHEN uc.use_case_type IN ('product-demo-showcase', 'advertising-promotion') THEN 3
    WHEN uc.use_case_type IN ('education-explainer', 'ugc-creator-content') THEN 2
    WHEN uc.use_case_type = 'brand-storytelling' THEN 1
    WHEN uc.use_case_type = 'social-media-content' THEN 0
    ELSE 0
  END as purchase_intent,
  CASE
    WHEN uc.use_case_type IN ('product-demo-showcase', 'advertising-promotion') THEN 'conversion'
    WHEN uc.use_case_type IN ('education-explainer', 'ugc-creator-content') THEN 'conversion'
    ELSE 'asset'
  END as layer
FROM page_meta pm
INNER JOIN use_cases uc ON pm.page_id = uc.id
WHERE pm.page_type = 'use_case'
  AND pm.status = 'published'
  AND pm.purchase_intent = 0
LIMIT 5000;

-- 然后更新
UPDATE page_meta pm
SET 
  purchase_intent = t.purchase_intent,
  layer = t.layer
FROM temp_batch_update t
WHERE pm.page_id = t.page_id;

-- 清理临时表
DROP TABLE IF EXISTS temp_batch_update;

-- ============================================
-- 方法 3：最小批次（如果还是超时，用这个）
-- ============================================

-- 每次只更新 1,000 条
WITH batch AS (
  SELECT pm.page_id
  FROM page_meta pm
  WHERE pm.page_type = 'use_case'
    AND pm.status = 'published'
    AND pm.purchase_intent = 0
  LIMIT 1000
),
updates AS (
  SELECT 
    b.page_id,
    CASE
      -- 3 分：明确交付任务
      WHEN uc.use_case_type IN ('product-demo-showcase', 'advertising-promotion') THEN 3
      -- 2 分：工作场景强
      WHEN uc.use_case_type IN ('education-explainer', 'ugc-creator-content') THEN 2
      -- 1 分：学习/解释型
      WHEN uc.use_case_type = 'brand-storytelling' THEN 1
      -- 0 分：纯泛营销/空泛场景
      WHEN uc.use_case_type = 'social-media-content' THEN 0
      ELSE 0
    END as purchase_intent,
    CASE
      -- Intent ≥2 且 GEO ≥80 才能进入 conversion 层（这里简化处理，只按 Intent 判断）
      -- 注意：完整的 layer 判断还需要考虑 geo_score，后续可以通过其他方式调整
      WHEN uc.use_case_type IN ('product-demo-showcase', 'advertising-promotion') THEN 'conversion'
      WHEN uc.use_case_type IN ('education-explainer', 'ugc-creator-content') THEN 'conversion'
      -- Intent <2 的归为 asset 层
      ELSE 'asset'
    END as layer
  FROM batch b
  INNER JOIN use_cases uc ON b.page_id = uc.id
)
UPDATE page_meta pm
SET 
  purchase_intent = u.purchase_intent,
  layer = u.layer
FROM updates u
WHERE pm.page_id = u.page_id;

-- ============================================
-- 检查进度
-- ============================================

-- 查看还有多少未更新
SELECT COUNT(*) as remaining
FROM page_meta
WHERE page_type = 'use_case'
  AND status = 'published'
  AND purchase_intent = 0;

-- 查看已更新的分布
SELECT 
  purchase_intent,
  layer,
  COUNT(*) as count
FROM page_meta
WHERE page_type = 'use_case'
  AND status = 'published'
  AND purchase_intent > 0
GROUP BY purchase_intent, layer
ORDER BY purchase_intent DESC, layer;

