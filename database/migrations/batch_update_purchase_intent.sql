-- ============================================
-- 批量更新 Purchase Intent（分批处理，避免超时）
-- ============================================
-- 说明：分批次更新，每次 10,000 条，避免超时
-- ============================================

-- ============================================
-- 方法 1：使用 CTE 和 LIMIT（推荐）
-- ============================================

-- 第一次执行：更新前 10,000 条
WITH batch AS (
  SELECT pm.page_id
  FROM page_meta pm
  INNER JOIN use_cases uc ON pm.page_id = uc.id
  WHERE pm.page_type = 'use_case'
    AND pm.status = 'published'
    AND pm.purchase_intent = 0  -- 只更新还没有设置的
  LIMIT 10000
)
UPDATE page_meta pm
SET 
  purchase_intent = CASE
    -- 3 分：明确交付任务
    WHEN uc.use_case_type IN ('product-demo-showcase', 'advertising-promotion') THEN 3
    -- 2 分：工作场景强
    WHEN uc.use_case_type IN ('education-explainer', 'ugc-creator-content') THEN 2
    -- 1 分：学习/解释型
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
WHERE pm.page_id = uc.id
  AND pm.page_id IN (SELECT page_id FROM batch);

-- ============================================
-- 方法 2：创建存储过程（更高效）
-- ============================================

CREATE OR REPLACE FUNCTION batch_update_purchase_intent(
  batch_size INTEGER DEFAULT 10000
)
RETURNS TABLE (
  updated_count INTEGER,
  remaining_count INTEGER
) AS $$
DECLARE
  v_updated INTEGER;
  v_remaining INTEGER;
BEGIN
  -- 更新一批
  WITH batch AS (
    SELECT pm.page_id
    FROM page_meta pm
    INNER JOIN use_cases uc ON pm.page_id = uc.id
    WHERE pm.page_type = 'use_case'
      AND pm.status = 'published'
      AND pm.purchase_intent = 0
    LIMIT batch_size
  )
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
  WHERE pm.page_id = uc.id
    AND pm.page_id IN (SELECT page_id FROM batch);
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  
  -- 计算剩余数量
  SELECT COUNT(*) INTO v_remaining
  FROM page_meta pm
  WHERE pm.page_type = 'use_case'
    AND pm.status = 'published'
    AND pm.purchase_intent = 0;
  
  RETURN QUERY SELECT v_updated, v_remaining;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 使用存储过程（推荐方式）
-- ============================================
-- 执行以下 SQL，每次更新 10,000 条，直到返回的 remaining_count 为 0

-- 第一次执行
SELECT * FROM batch_update_purchase_intent(10000);

-- 如果 remaining_count > 0，继续执行
SELECT * FROM batch_update_purchase_intent(10000);

-- 重复执行，直到 remaining_count = 0

-- ============================================
-- 方法 3：使用游标分批处理（最安全）
-- ============================================

DO $$
DECLARE
  v_batch_size INTEGER := 10000;
  v_updated INTEGER;
  v_total_updated INTEGER := 0;
  v_remaining INTEGER;
BEGIN
  -- 计算总数
  SELECT COUNT(*) INTO v_remaining
  FROM page_meta pm
  WHERE pm.page_type = 'use_case'
    AND pm.status = 'published'
    AND pm.purchase_intent = 0;
  
  RAISE NOTICE '需要更新 % 条记录', v_remaining;
  
  -- 循环更新
  LOOP
    -- 更新一批
    WITH batch AS (
      SELECT pm.page_id
      FROM page_meta pm
      INNER JOIN use_cases uc ON pm.page_id = uc.id
      WHERE pm.page_type = 'use_case'
        AND pm.status = 'published'
        AND pm.purchase_intent = 0
      LIMIT v_batch_size
    )
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
    WHERE pm.page_id = uc.id
      AND pm.page_id IN (SELECT page_id FROM batch);
    
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    v_total_updated := v_total_updated + v_updated;
    
    -- 如果没有更新任何记录，退出循环
    EXIT WHEN v_updated = 0;
    
    RAISE NOTICE '已更新 % 条，总计 % 条', v_updated, v_total_updated;
    
    -- 短暂延迟，避免锁表
    PERFORM pg_sleep(0.1);
  END LOOP;
  
  RAISE NOTICE '完成！总共更新 % 条记录', v_total_updated;
END $$;

