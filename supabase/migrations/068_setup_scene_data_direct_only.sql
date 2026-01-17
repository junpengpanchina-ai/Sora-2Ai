-- 068_setup_scene_data_direct_only.sql
-- 只包含 DO $$ 块部分，用于快速执行（避免验证查询超时）
--
-- 说明：
-- 这个脚本只包含设置逻辑，不包含验证查询
-- 执行后查看 NOTICE 消息确认设置成功

-- ============================================
-- 1. 为已发布且可索引的场景设置 in_sitemap = TRUE
-- ============================================

DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE use_cases
  SET in_sitemap = TRUE
  WHERE is_published = TRUE
    AND noindex = FALSE
    AND (in_sitemap IS NULL OR in_sitemap = FALSE);
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE '✅ 为 % 个场景设置了 in_sitemap = TRUE', updated_count;
END $$;

-- ============================================
-- 2. 为已发布且可索引的场景设置 AI 分数 0.7
-- ============================================

DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE use_cases
  SET ai_citation_score = 0.7
  WHERE is_published = TRUE
    AND noindex = FALSE
    AND in_sitemap = TRUE
    AND (ai_citation_score IS NULL OR ai_citation_score = 0);
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE '✅ 为 % 个场景设置了初始 AI 分数 0.7', updated_count;
END $$;
