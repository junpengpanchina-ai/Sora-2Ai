-- 069_initialize_scene_tiers.sql
-- 为场景初始化 tier 值
--
-- 说明：
-- 由于目前所有场景的 tier 都是 NULL 或 0，需要先设置 tier 才能执行后续的设置脚本
-- 这个脚本提供一个基础的 tier 设置策略，可以根据实际业务逻辑调整

-- ============================================
-- 策略说明
-- ============================================
-- Tier1: 高质量、已发布、可索引的场景（优先处理）
-- Tier2: 已发布、可索引的场景（次要）
-- Tier3: 其他场景

-- ============================================
-- 1. 检查当前状态
-- ============================================

SELECT 
  '初始化前状态' as check_type,
  COUNT(*) as "总场景数",
  COUNT(*) FILTER (WHERE tier IS NULL) as "tier为NULL",
  COUNT(*) FILTER (WHERE tier = 0) as "tier为0",
  COUNT(*) FILTER (WHERE tier IS NOT NULL AND tier > 0) as "已有tier",
  COUNT(*) FILTER (WHERE is_published = TRUE AND noindex = FALSE) as "已发布且可索引"
FROM use_cases;

-- ============================================
-- 2. 为场景设置初始 tier
-- ============================================

DO $$
DECLARE
  tier1_count INTEGER;
  tier2_count INTEGER;
  tier3_count INTEGER;
BEGIN
  -- Tier1: 已发布、可索引、高质量场景
  -- 可以根据实际业务逻辑调整条件，例如：
  -- - 有 featured_prompt_ids 的场景
  -- - 有特定 industry 的场景
  -- - 有特定 quality_score 的场景
  -- 这里先设置一个基础策略：已发布且可索引的场景
  
  UPDATE use_cases
  SET tier = 1
  WHERE (tier IS NULL OR tier = 0)
    AND is_published = TRUE
    AND noindex = FALSE;
  
  GET DIAGNOSTICS tier1_count = ROW_COUNT;
  RAISE NOTICE '✅ 为 % 个场景设置了 tier = 1', tier1_count;
  
  -- Tier2: 已发布但 noindex = TRUE 的场景
  UPDATE use_cases
  SET tier = 2
  WHERE (tier IS NULL OR tier = 0)
    AND is_published = TRUE
    AND noindex = TRUE;
  
  GET DIAGNOSTICS tier2_count = ROW_COUNT;
  RAISE NOTICE '✅ 为 % 个场景设置了 tier = 2', tier2_count;
  
  -- Tier3: 未发布的场景
  UPDATE use_cases
  SET tier = 3
  WHERE (tier IS NULL OR tier = 0)
    AND is_published = FALSE;
  
  GET DIAGNOSTICS tier3_count = ROW_COUNT;
  RAISE NOTICE '✅ 为 % 个场景设置了 tier = 3', tier3_count;
  
  RAISE NOTICE '';
  RAISE NOTICE '📊 初始化结果统计：';
  RAISE NOTICE '  - Tier1 场景数: %', (SELECT COUNT(*) FROM use_cases WHERE tier = 1);
  RAISE NOTICE '  - Tier2 场景数: %', (SELECT COUNT(*) FROM use_cases WHERE tier = 2);
  RAISE NOTICE '  - Tier3 场景数: %', (SELECT COUNT(*) FROM use_cases WHERE tier = 3);
  RAISE NOTICE '  - 仍有 NULL tier: %', (SELECT COUNT(*) FROM use_cases WHERE tier IS NULL);
  
END $$;

-- ============================================
-- 3. 验证初始化结果
-- ============================================

SELECT 
  '初始化后状态' as check_type,
  COUNT(*) as "总场景数",
  COUNT(*) FILTER (WHERE tier = 1) as "Tier1场景数",
  COUNT(*) FILTER (WHERE tier = 2) as "Tier2场景数",
  COUNT(*) FILTER (WHERE tier = 3) as "Tier3场景数",
  COUNT(*) FILTER (WHERE tier IS NULL) as "tier仍为NULL",
  COUNT(*) FILTER (WHERE tier = 1 AND is_published = TRUE AND noindex = FALSE) as "Tier1且已发布且可索引"
FROM use_cases;
