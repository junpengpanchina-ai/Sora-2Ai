-- 068_initialize_scene_seo_fields.sql
-- 初始化场景 SEO 字段：为 Tier1 场景设置 in_sitemap 和初始化 ai_citation_score
-- 
-- 使用说明：
-- 1. 根据现有场景数据智能设置 SEO 字段
-- 2. 为 Tier1 场景自动设置 in_sitemap = TRUE
-- 3. 根据场景质量状态初始化 ai_citation_score

-- ============================================
-- 1. 为 Tier1 场景设置 in_sitemap = TRUE
-- ============================================

UPDATE use_cases
SET in_sitemap = TRUE
WHERE tier = 1
  AND noindex = FALSE
  AND (in_sitemap IS NULL OR in_sitemap = FALSE)
  AND is_published = TRUE;

-- 统计更新的数量
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE '✅ 为 % 个 Tier1 场景设置了 in_sitemap = TRUE', updated_count;
END $$;

-- ============================================
-- 2. 初始化 ai_citation_score（基于现有数据）
-- ============================================

-- 策略：根据场景的质量状态、发布状态、相关数据来初始化分数
-- 可以根据实际需求调整这个逻辑

UPDATE use_cases
SET ai_citation_score = CASE
  -- Tier1 且已发布且有相关 prompts：高分（0.7-0.9）
  WHEN tier = 1 
    AND is_published = TRUE 
    AND EXISTS (
      SELECT 1 FROM prompt_templates pt
      WHERE pt.scene_id = use_cases.id
        AND pt.status = 'active'
        AND pt.is_published = TRUE
    ) THEN 0.75
  
  -- Tier1 且已发布：中等分数（0.6-0.7）
  WHEN tier = 1 
    AND is_published = TRUE THEN 0.65
  
  -- Tier2 且已发布：中等偏低（0.5-0.6）
  WHEN tier = 2 
    AND is_published = TRUE THEN 0.55
  
  -- Tier3 或未发布：较低分数（0.3-0.5）
  ELSE 0.40
END
WHERE ai_citation_score IS NULL 
   OR ai_citation_score = 0;

-- 统计更新的数量
DO $$
DECLARE
  updated_count INTEGER;
  high_score_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  SELECT COUNT(*) INTO high_score_count
  FROM use_cases
  WHERE ai_citation_score >= 0.65;
  
  RAISE NOTICE '✅ 为 % 个场景初始化了 ai_citation_score', updated_count;
  RAISE NOTICE '📊 其中 % 个场景的分数 >= 0.65（可用于自动绑定）', high_score_count;
END $$;

-- ============================================
-- 3. 设置 index_health_status（可选）
-- ============================================

-- 根据场景状态设置健康状态
UPDATE use_cases
SET index_health_status = CASE
  WHEN tier = 1 
    AND is_published = TRUE 
    AND in_sitemap = TRUE
    AND noindex = FALSE
    AND ai_citation_score >= 0.65 THEN 'ok'
  
  WHEN tier = 1 
    AND is_published = TRUE 
    AND (in_sitemap = FALSE OR noindex = TRUE) THEN 'warn'
  
  WHEN tier = 1 
    AND is_published = FALSE THEN 'bad'
  
  ELSE 'unknown'
END
WHERE index_health_status IS NULL 
   OR index_health_status = 'unknown';

-- ============================================
-- 4. 验证更新结果
-- ============================================

SELECT 
  '初始化结果统计' as check_type,
  COUNT(*) as "总场景数",
  COUNT(*) FILTER (WHERE tier = 1 AND in_sitemap = TRUE) as "Tier1且in_sitemap=true",
  COUNT(*) FILTER (WHERE ai_citation_score >= 0.65) as "AI分数>=0.65",
  COUNT(*) FILTER (WHERE tier = 1 AND in_sitemap = TRUE AND ai_citation_score >= 0.65) as "Tier1高分场景（可自动绑定）",
  COUNT(*) FILTER (WHERE index_health_status = 'ok') as "健康状态为ok",
  COUNT(*) FILTER (WHERE index_health_status = 'warn') as "健康状态为warn",
  COUNT(*) FILTER (WHERE index_health_status = 'bad') as "健康状态为bad"
FROM use_cases;

-- ============================================
-- 完成
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ 场景 SEO 字段初始化完成';
  RAISE NOTICE '📊 运行上面的验证查询查看详细统计';
END $$;
