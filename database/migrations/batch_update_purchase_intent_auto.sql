-- ============================================
-- 批量更新 Purchase Intent（自动化版本）
-- ============================================
-- 说明：自动循环执行，直到所有记录更新完成
-- 优点：一次执行，自动完成所有批次
-- ============================================

-- ============================================
-- 方案 1：使用 DO 块自动循环（推荐）
-- ============================================
-- 注意：如果超时，可以减小 batch_size 或增加 pg_sleep 时间

DO $$
DECLARE
  v_batch_size INTEGER := 5000;
  v_updated INTEGER;
  v_total_updated INTEGER := 0;
  v_iteration INTEGER := 0;
  v_max_iterations INTEGER := 50; -- 防止无限循环
BEGIN
  RAISE NOTICE '🚀 开始批量更新 Purchase Intent...';
  RAISE NOTICE '批次大小: % 条', v_batch_size;
  
  LOOP
    v_iteration := v_iteration + 1;
    
    -- 检查是否超过最大迭代次数
    IF v_iteration > v_max_iterations THEN
      RAISE NOTICE '⚠️  达到最大迭代次数 (% 次)，停止执行', v_max_iterations;
      EXIT;
    END IF;
    
    -- 更新一批
    WITH batch AS (
      SELECT pm.page_id
      FROM page_meta pm
      WHERE pm.page_type = 'use_case'
        AND pm.status = 'published'
        AND pm.purchase_intent = 0
      LIMIT v_batch_size
    ),
    updates AS (
      SELECT 
        b.page_id,
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
      FROM batch b
      INNER JOIN use_cases uc ON b.page_id = uc.id
    )
    UPDATE page_meta pm
    SET 
      purchase_intent = u.purchase_intent,
      layer = u.layer
    FROM updates u
    WHERE pm.page_id = u.page_id;
    
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    v_total_updated := v_total_updated + v_updated;
    
    RAISE NOTICE '第 % 批: 更新 % 条，累计 % 条', v_iteration, v_updated, v_total_updated;
    
    -- 如果没有更新任何记录，说明已完成
    IF v_updated = 0 THEN
      RAISE NOTICE '✅ 所有记录已更新完成！';
      EXIT;
    END IF;
    
    -- 短暂延迟，避免锁表和超时
    PERFORM pg_sleep(0.5);
  END LOOP;
  
  RAISE NOTICE '🎉 批量更新完成！总共更新 % 条记录，执行 % 批次', v_total_updated, v_iteration;
END $$;

-- ============================================
-- 方案 2：使用存储过程（更灵活，可重复调用）
-- ============================================

CREATE OR REPLACE FUNCTION batch_update_purchase_intent_auto(
  p_batch_size INTEGER DEFAULT 5000,
  p_max_iterations INTEGER DEFAULT 50
)
RETURNS TABLE (
  total_updated INTEGER,
  iterations INTEGER,
  message TEXT
) AS $$
DECLARE
  v_updated INTEGER;
  v_total_updated INTEGER := 0;
  v_iteration INTEGER := 0;
BEGIN
  LOOP
    v_iteration := v_iteration + 1;
    
    -- 检查是否超过最大迭代次数
    IF v_iteration > p_max_iterations THEN
      RETURN QUERY SELECT 
        v_total_updated,
        v_iteration,
        format('达到最大迭代次数 (%s 次)，已更新 %s 条', p_max_iterations, v_total_updated);
      RETURN;
    END IF;
    
    -- 更新一批
    WITH batch AS (
      SELECT pm.page_id
      FROM page_meta pm
      WHERE pm.page_type = 'use_case'
        AND pm.status = 'published'
        AND pm.purchase_intent = 0
      LIMIT p_batch_size
    ),
    updates AS (
      SELECT 
        b.page_id,
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
      FROM batch b
      INNER JOIN use_cases uc ON b.page_id = uc.id
    )
    UPDATE page_meta pm
    SET 
      purchase_intent = u.purchase_intent,
      layer = u.layer
    FROM updates u
    WHERE pm.page_id = u.page_id;
    
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    v_total_updated := v_total_updated + v_updated;
    
    -- 如果没有更新任何记录，说明已完成
    IF v_updated = 0 THEN
      RETURN QUERY SELECT 
        v_total_updated,
        v_iteration,
        format('所有记录已更新完成！总共 %s 条，执行 %s 批次', v_total_updated, v_iteration);
      RETURN;
    END IF;
    
    -- 短暂延迟
    PERFORM pg_sleep(0.5);
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 使用存储过程（推荐方式）
-- SELECT * FROM batch_update_purchase_intent_auto(5000, 50);

-- ============================================
-- 方案 3：超大批次（如果数据库性能好，可以一次处理更多）
-- ============================================
-- 警告：如果超时，请使用方案 1 或 2

-- 直接更新所有记录（不推荐，可能超时）
-- UPDATE page_meta pm
-- SET 
--   purchase_intent = (
--     SELECT CASE
--       WHEN uc.use_case_type IN ('product-demo-showcase', 'advertising-promotion') THEN 3
--       WHEN uc.use_case_type IN ('education-explainer', 'ugc-creator-content') THEN 2
--       WHEN uc.use_case_type = 'brand-storytelling' THEN 1
--       WHEN uc.use_case_type = 'social-media-content' THEN 0
--       ELSE 0
--     END
--     FROM use_cases uc
--     WHERE uc.id = pm.page_id
--   ),
--   layer = (
--     SELECT CASE
--       WHEN uc.use_case_type IN ('product-demo-showcase', 'advertising-promotion') THEN 'conversion'
--       WHEN uc.use_case_type IN ('education-explainer', 'ugc-creator-content') THEN 'conversion'
--       ELSE 'asset'
--     END
--     FROM use_cases uc
--     WHERE uc.id = pm.page_id
--   )
-- WHERE pm.page_type = 'use_case'
--   AND pm.status = 'published'
--   AND pm.purchase_intent = 0;

-- ============================================
-- 检查进度
-- ============================================

-- 查看还有多少未更新
SELECT 
  COUNT(*) as remaining,
  COUNT(*) / 5000.0 as estimated_batches
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

