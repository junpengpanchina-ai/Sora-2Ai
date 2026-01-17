-- 068_setup_scene_data_direct.sql
-- 直接设置场景数据，不依赖 tier
--
-- 说明：
-- 如果修复 tier 有困难（超时），可以直接使用这个脚本
-- 它不依赖 tier，直接基于业务条件（is_published, noindex）设置数据

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

-- ============================================
-- 3. 验证结果（可选，如果超时可以跳过）
-- ============================================

-- 注意：如果这个查询超时，可以跳过验证
-- DO $$ 块中的 NOTICE 消息已经显示了设置成功的场景数量
-- 如果看到 NOTICE: ✅ 为 X 个场景设置了...，说明设置成功

-- 最简单的验证：只检查前 100 条记录（避免全表扫描）
SELECT 
  '设置结果（前100条样本）' as check_type,
  COUNT(*) FILTER (WHERE is_published = TRUE AND noindex = FALSE AND in_sitemap = TRUE) as "in_sitemap=true（样本）",
  COUNT(*) FILTER (WHERE is_published = TRUE AND noindex = FALSE AND ai_citation_score >= 0.65) as "AI分数>=0.65（样本）"
FROM (
  SELECT * FROM use_cases 
  WHERE is_published = TRUE AND noindex = FALSE 
  LIMIT 100
) sample;
