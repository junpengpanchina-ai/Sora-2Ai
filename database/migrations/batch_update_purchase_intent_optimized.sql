-- ============================================
-- 批量更新 Purchase Intent（优化版 - 避免超时）
-- ============================================
-- 说明：使用更小的批次和更简单的查询
-- ============================================

-- ============================================
-- 方法 1：手动分批执行（最安全，推荐）
-- ============================================
-- 每次执行一条，重复执行直到完成

-- 第一批：更新 5,000 条
UPDATE page_meta pm
SET 
  purchase_intent = CASE
    WHEN uc.use_case_type IN ('product-demo-showcase', 'advertising-promotion') THEN 3
    WHEN uc.use_case_type IN ('education-explainer', 'ugc-creator-content') THEN 2
    WHEN uc.use_case_type = 'brand-storytelling' THEN 1
    WHEN uc.use_case_type = 'social-media-content' THEN 0
    ELSE 0
  END,
  layer = CASE
    WHEN uc.use_case_type IN ('product-demo-showcase', 'advertising-promotion') THEN 'conversion'
    WHEN uc.use_case_type IN ('education-explainer', 'ugc-creator-content') THEN 'conversion'
    ELSE 'asset'
  END
FROM use_cases uc
WHERE pm.page_type = 'use_case'
  AND pm.status = 'published'
  AND pm.purchase_intent = 0
  AND pm.page_id = uc.id
LIMIT 5000;

-- 重复执行上面的 SQL，每次更新 5,000 条
-- 直到没有更多记录需要更新

-- ============================================
-- 方法 2：使用临时表（更高效）
-- ============================================

-- Step 1: 创建临时表，存储需要更新的数据
CREATE TEMP TABLE temp_purchase_intent_updates AS
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

-- Step 2: 创建索引加速更新
CREATE INDEX IF NOT EXISTS idx_temp_updates_page_id ON temp_purchase_intent_updates(page_id);

-- Step 3: 批量更新
UPDATE page_meta pm
SET 
  purchase_intent = t.purchase_intent,
  layer = t.layer
FROM temp_purchase_intent_updates t
WHERE pm.page_id = t.page_id
  AND pm.page_type = 'use_case';

-- Step 4: 清理临时表
DROP TABLE IF EXISTS temp_purchase_intent_updates;

-- 重复执行 Step 1-4，每次处理 5,000 条

-- ============================================
-- 方法 3：优化的存储过程（小批次）
-- ============================================

CREATE OR REPLACE FUNCTION batch_update_purchase_intent_small(
  batch_size INTEGER DEFAULT 5000
)
RETURNS INTEGER AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  -- 使用子查询，避免复杂的 JOIN
  UPDATE page_meta pm
  SET 
    purchase_intent = (
      SELECT CASE
        WHEN uc.use_case_type IN ('product-demo-showcase', 'advertising-promotion') THEN 3
        WHEN uc.use_case_type IN ('education-explainer', 'ugc-creator-content') THEN 2
        WHEN uc.use_case_type = 'brand-storytelling' THEN 1
    WHEN uc.use_case_type = 'social-media-content' THEN 0
        ELSE 0
      END
      FROM use_cases uc
      WHERE uc.id = pm.page_id
      LIMIT 1
    ),
    layer = (
      SELECT CASE
        WHEN uc.use_case_type IN ('product-demo-showcase', 'advertising-promotion') THEN 'conversion'
        WHEN uc.use_case_type IN ('education-explainer', 'ugc-creator-content') THEN 'conversion'
        ELSE 'asset'
      END
      FROM use_cases uc
      WHERE uc.id = pm.page_id
      LIMIT 1
    )
  WHERE pm.page_type = 'use_case'
    AND pm.status = 'published'
    AND pm.purchase_intent = 0
    AND pm.page_id IN (
      SELECT page_id
      FROM page_meta
      WHERE page_type = 'use_case'
        AND status = 'published'
        AND purchase_intent = 0
      LIMIT batch_size
    );
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$$ LANGUAGE plpgsql;

-- 使用方式：重复执行直到返回 0
SELECT batch_update_purchase_intent_small(5000);

-- ============================================
-- 方法 4：最简单的分批更新（推荐用于手动执行）
-- ============================================

-- 每次执行这个，更新 5,000 条
WITH batch AS (
  SELECT pm.page_id
  FROM page_meta pm
  WHERE pm.page_type = 'use_case'
    AND pm.status = 'published'
    AND pm.purchase_intent = 0
  LIMIT 5000
)
UPDATE page_meta pm
SET 
  purchase_intent = (
    SELECT CASE
      WHEN uc.use_case_type IN ('product-demo-showcase', 'advertising-promotion') THEN 3
      WHEN uc.use_case_type IN ('education-explainer', 'ugc-creator-content') THEN 2
      WHEN uc.use_case_type = 'brand-storytelling' THEN 1
    WHEN uc.use_case_type = 'social-media-content' THEN 0
      ELSE 0
    END
    FROM use_cases uc
    WHERE uc.id = pm.page_id
  ),
  layer = (
    SELECT CASE
      WHEN uc.use_case_type IN ('product-demo-showcase', 'advertising-promotion') THEN 'conversion'
      WHEN uc.use_case_type IN ('education-explainer', 'ugc-creator-content') THEN 'conversion'
      ELSE 'asset'
    END
    FROM use_cases uc
    WHERE uc.id = pm.page_id
  )
WHERE pm.page_id IN (SELECT page_id FROM batch);

-- 检查进度
SELECT COUNT(*) as remaining
FROM page_meta
WHERE page_type = 'use_case'
  AND status = 'published'
  AND purchase_intent = 0;

