-- 068_setup_scene_data_batch.sql
-- 分批设置场景数据，避免超时
--
-- 说明：
-- 如果一次性更新所有记录会超时，可以分批执行
-- 每次处理 1000 条记录，可以多次执行直到处理完所有记录

-- ============================================
-- 方法 1：分批设置 in_sitemap（每次 1000 条）
-- ============================================

DO $$
DECLARE
  updated_count INTEGER;
  batch_size INTEGER := 1000;
  total_updated INTEGER := 0;
BEGIN
  LOOP
    -- 每次只更新 1000 条
    UPDATE use_cases
    SET in_sitemap = TRUE
    WHERE id IN (
      SELECT id 
      FROM use_cases
      WHERE is_published = TRUE
        AND noindex = FALSE
        AND (in_sitemap IS NULL OR in_sitemap = FALSE)
      LIMIT batch_size
    );
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    total_updated := total_updated + updated_count;
    
    RAISE NOTICE '✅ 本批处理了 % 个场景，总计 % 个场景设置了 in_sitemap = TRUE', updated_count, total_updated;
    
    -- 如果没有更多记录，退出循环
    EXIT WHEN updated_count = 0;
  END LOOP;
  
  RAISE NOTICE '✅ 完成！总共为 % 个场景设置了 in_sitemap = TRUE', total_updated;
END $$;

-- ============================================
-- 方法 2：分批设置 AI 分数（每次 1000 条）
-- ============================================

DO $$
DECLARE
  updated_count INTEGER;
  batch_size INTEGER := 1000;
  total_updated INTEGER := 0;
BEGIN
  LOOP
    -- 每次只更新 1000 条
    UPDATE use_cases
    SET ai_citation_score = 0.7
    WHERE id IN (
      SELECT id 
      FROM use_cases
      WHERE is_published = TRUE
        AND noindex = FALSE
        AND in_sitemap = TRUE
        AND (ai_citation_score IS NULL OR ai_citation_score = 0)
      LIMIT batch_size
    );
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    total_updated := total_updated + updated_count;
    
    RAISE NOTICE '✅ 本批处理了 % 个场景，总计 % 个场景设置了 AI 分数 0.7', updated_count, total_updated;
    
    -- 如果没有更多记录，退出循环
    EXIT WHEN updated_count = 0;
  END LOOP;
  
  RAISE NOTICE '✅ 完成！总共为 % 个场景设置了 AI 分数 0.7', total_updated;
END $$;
