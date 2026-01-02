-- ============================================
-- 批量更新 Purchase Intent（Dashboard 版本）
-- ============================================
-- 说明：直接在 Supabase Dashboard SQL Editor 中执行
-- 批次大小：500 条（更小，避免 Dashboard 超时）
-- 延迟时间：2 秒
-- ============================================
-- 注意：如果还是超时，可以减小批次大小或增加延迟
-- ============================================

DO $$
DECLARE
  v_batch_size INTEGER := 500;  -- 极小批次，避免 Dashboard 超时
  v_updated INTEGER;
  v_total_updated INTEGER := 0;
  v_iteration INTEGER := 0;
  v_max_iterations INTEGER := 410;  -- 203,062 ÷ 500 ≈ 406 次
BEGIN
  RAISE NOTICE '🚀 开始批量更新 Purchase Intent（Dashboard 模式）...';
  RAISE NOTICE '批次大小: % 条', v_batch_size;
  RAISE NOTICE '延迟时间: 2 秒/批';
  RAISE NOTICE '预计时间: 约 15-20 分钟';
  RAISE NOTICE '';
  
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
    
    -- 每 20 批显示一次进度，避免输出太多
    IF v_iteration % 20 = 0 OR v_updated = 0 THEN
      RAISE NOTICE '第 % 批: 更新 % 条，累计 % 条 (%.1f%%)', 
        v_iteration, 
        v_updated, 
        v_total_updated,
        (v_total_updated::NUMERIC / 203062.0 * 100);
    END IF;
    
    -- 如果没有更新任何记录，说明已完成
    IF v_updated = 0 THEN
      RAISE NOTICE '';
      RAISE NOTICE '✅ 所有记录已更新完成！';
      EXIT;
    END IF;
    
    -- 长延迟，确保 Dashboard 不超时
    PERFORM pg_sleep(2.0);  -- 2 秒延迟
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '🎉 批量更新完成！';
  RAISE NOTICE '  - 总更新: % 条', v_total_updated;
  RAISE NOTICE '  - 执行批次: % 次', v_iteration;
  RAISE NOTICE '  - 完成度: %.1f%%', (v_total_updated::NUMERIC / 203062.0 * 100);
END $$;

-- ============================================
-- 执行后验证（可选，单独执行）
-- ============================================

-- 查看还有多少未更新
-- SELECT 
--   COUNT(*) as remaining,
--   ROUND(COUNT(*) / 500.0) as estimated_batches_left
-- FROM page_meta
-- WHERE page_type = 'use_case'
--   AND status = 'published'
--   AND purchase_intent = 0;

-- 查看已更新的分布
-- SELECT 
--   purchase_intent,
--   layer,
--   COUNT(*) as count,
--   ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
-- FROM page_meta
-- WHERE page_type = 'use_case'
--   AND status = 'published'
--   AND purchase_intent > 0
-- GROUP BY purchase_intent, layer
-- ORDER BY purchase_intent DESC, layer;

