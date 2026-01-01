-- ============================================
-- 批量更新 Purchase Intent（安全自动版本）
-- ============================================
-- 说明：自动循环，小批次，避免超时
-- 使用方法：直接执行这个 SQL，一次完成所有更新
-- ============================================

DO $$
DECLARE
  v_batch_size INTEGER := 3000;  -- 减小批次大小，避免超时
  v_updated INTEGER;
  v_total_updated INTEGER := 0;
  v_iteration INTEGER := 0;
  v_max_iterations INTEGER := 70;  -- 增加最大迭代次数
BEGIN
  RAISE NOTICE '🚀 开始批量更新 Purchase Intent...';
  RAISE NOTICE '批次大小: % 条', v_batch_size;
  RAISE NOTICE '最大迭代次数: % 次', v_max_iterations;
  
  LOOP
    v_iteration := v_iteration + 1;
    
    -- 检查是否超过最大迭代次数
    IF v_iteration > v_max_iterations THEN
      RAISE NOTICE '⚠️  达到最大迭代次数 (% 次)，停止执行', v_max_iterations;
      RAISE NOTICE '已更新 % 条记录，剩余记录请手动检查', v_total_updated;
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
    
    -- 显示进度（每 5 批显示一次，避免输出太多）
    IF v_iteration % 5 = 0 OR v_updated = 0 THEN
      RAISE NOTICE '第 % 批: 更新 % 条，累计 % 条', v_iteration, v_updated, v_total_updated;
    END IF;
    
    -- 如果没有更新任何记录，说明已完成
    IF v_updated = 0 THEN
      RAISE NOTICE '✅ 所有记录已更新完成！';
      EXIT;
    END IF;
    
    -- 短暂延迟，避免锁表和超时
    PERFORM pg_sleep(0.8);  -- 增加延迟时间
  END LOOP;
  
  RAISE NOTICE '🎉 批量更新完成！总共更新 % 条记录，执行 % 批次', v_total_updated, v_iteration;
  
  -- 显示最终统计
  RAISE NOTICE '';
  RAISE NOTICE '📊 最终统计:';
  RAISE NOTICE '  - 总更新: % 条', v_total_updated;
  RAISE NOTICE '  - 执行批次: % 次', v_iteration;
END $$;

-- ============================================
-- 执行后验证
-- ============================================

-- 查看还有多少未更新
SELECT 
  COUNT(*) as remaining,
  ROUND(COUNT(*) / 3000.0) as estimated_batches_left
FROM page_meta
WHERE page_type = 'use_case'
  AND status = 'published'
  AND purchase_intent = 0;

-- 查看已更新的分布
SELECT 
  purchase_intent,
  layer,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM page_meta
WHERE page_type = 'use_case'
  AND status = 'published'
  AND purchase_intent > 0
GROUP BY purchase_intent, layer
ORDER BY purchase_intent DESC, layer;

