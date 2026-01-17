-- 068_setup_scene_data_simple.sql
-- 简单方式：只更新前 N 条记录（测试用）
--
-- 说明：
-- 如果分批也超时，可以先测试少量记录
-- 确认逻辑正确后，再逐步增加数量

-- ============================================
-- 1. 为前 1000 条符合条件的场景设置 in_sitemap = TRUE
-- ============================================

DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE use_cases
  SET in_sitemap = TRUE
  WHERE id IN (
    SELECT id 
    FROM use_cases
    WHERE is_published = TRUE
      AND noindex = FALSE
      AND (in_sitemap IS NULL OR in_sitemap = FALSE)
    ORDER BY id  -- 添加排序，确保每次执行处理相同的记录
    LIMIT 1000  -- 先只处理前 1000 条
  );
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE '✅ 为 % 个场景设置了 in_sitemap = TRUE（前 1000 条）', updated_count;
END $$;

-- ============================================
-- 2. 为前 1000 条符合条件的场景设置 AI 分数 0.7
-- ============================================

DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE use_cases
  SET ai_citation_score = 0.7
  WHERE id IN (
    SELECT id 
    FROM use_cases
    WHERE is_published = TRUE
      AND noindex = FALSE
      AND in_sitemap = TRUE
      AND (ai_citation_score IS NULL OR ai_citation_score = 0)
    ORDER BY id  -- 添加排序，确保每次执行处理相同的记录
    LIMIT 1000  -- 先只处理前 1000 条
  );
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE '✅ 为 % 个场景设置了初始 AI 分数 0.7（前 1000 条）', updated_count;
END $$;

-- ============================================
-- 如果需要处理更多记录，可以多次执行上面的脚本
-- 或者增加 LIMIT 的数量（例如 5000、10000）
-- ============================================
