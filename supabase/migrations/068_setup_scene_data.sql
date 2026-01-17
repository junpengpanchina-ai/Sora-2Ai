-- 068_setup_scene_data.sql
-- 设置场景数据：为 Tier1 场景设置 in_sitemap 和初始 AI 分数
--
-- 说明：
-- 1. 为 Tier1 场景设置 in_sitemap = TRUE（加入 sitemap）
-- 2. 为已发布的高质量场景设置初始 ai_citation_score（用于自动绑定）
-- 3. 可以根据实际业务逻辑调整分数设置策略

-- ============================================
-- 1. 为 Tier1 场景设置 in_sitemap = TRUE
-- ============================================

DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- 为 Tier1 且已发布的场景设置 in_sitemap = TRUE
  UPDATE use_cases
  SET in_sitemap = TRUE
  WHERE tier = 1
    AND is_published = TRUE
    AND noindex = FALSE
    AND (in_sitemap IS NULL OR in_sitemap = FALSE);
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE '✅ 为 % 个 Tier1 场景设置了 in_sitemap = TRUE', updated_count;
END $$;

-- ============================================
-- 2. 为高质量场景设置初始 AI Citation Score
-- ============================================

DO $$
DECLARE
  updated_count INTEGER;
  score_updated INTEGER;
BEGIN
  -- 策略 1：为 Tier1 已发布的场景设置初始分数 0.7
  UPDATE use_cases
  SET ai_citation_score = 0.7
  WHERE tier = 1
    AND is_published = TRUE
    AND noindex = FALSE
    AND in_sitemap = TRUE
    AND (ai_citation_score IS NULL OR ai_citation_score = 0);
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE '✅ 为 % 个 Tier1 场景设置了初始 AI 分数 0.7', updated_count;
  
  -- 策略 2：为 Tier2 已发布的场景设置初始分数 0.5
  UPDATE use_cases
  SET ai_citation_score = 0.5
  WHERE tier = 2
    AND is_published = TRUE
    AND noindex = FALSE
    AND in_sitemap = TRUE
    AND (ai_citation_score IS NULL OR ai_citation_score = 0);
  
  GET DIAGNOSTICS score_updated = ROW_COUNT;
  RAISE NOTICE '✅ 为 % 个 Tier2 场景设置了初始 AI 分数 0.5', score_updated;
  
  RAISE NOTICE '';
  RAISE NOTICE '📊 设置结果统计：';
  RAISE NOTICE '  - Tier1 场景总数: %', (
    SELECT COUNT(*) FROM use_cases WHERE tier = 1
  );
  RAISE NOTICE '  - Tier1 且 in_sitemap = TRUE: %', (
    SELECT COUNT(*) FROM use_cases WHERE tier = 1 AND in_sitemap = TRUE
  );
  RAISE NOTICE '  - AI分数 >= 0.65 的场景数: %', (
    SELECT COUNT(*) FROM use_cases WHERE ai_citation_score >= 0.65
  );
  
END $$;

-- ============================================
-- 3. 验证设置结果
-- ============================================

SELECT 
  '场景数据设置结果' as check_type,
  COUNT(*) FILTER (WHERE tier = 1) as "Tier1场景总数",
  COUNT(*) FILTER (WHERE tier = 1 AND in_sitemap = TRUE) as "Tier1且in_sitemap=true",
  COUNT(*) FILTER (WHERE tier = 1 AND ai_citation_score >= 0.65) as "Tier1且AI分数>=0.65",
  COUNT(*) FILTER (WHERE tier = 1 AND in_sitemap = TRUE AND ai_citation_score >= 0.65 AND noindex = FALSE) as "符合自动绑定条件的场景数"
FROM use_cases;
