-- 071_fix_tier_assignment.sql
-- 修复 Tier 分配：将符合条件的 Tier2 场景重新设置为 Tier1
--
-- 说明：
-- 从诊断结果看，所有 Tier2 场景都是 noindex = FALSE，但按策略应该设置为 Tier1
-- 这个脚本会将这些场景重新分配到正确的 tier

-- ============================================
-- 1. 检查需要修复的场景
-- ============================================

SELECT 
  '需要修复的场景' as check_type,
  COUNT(*) as "当前为Tier2但应该是Tier1的场景数",
  COUNT(*) FILTER (WHERE is_published = TRUE AND noindex = FALSE) as "已发布且可索引",
  COUNT(*) FILTER (WHERE is_published = TRUE AND noindex = TRUE) as "已发布但不可索引",
  COUNT(*) FILTER (WHERE is_published = FALSE) as "未发布"
FROM use_cases
WHERE tier = 2;

-- ============================================
-- 2. 重新分配 Tier
-- ============================================

DO $$
DECLARE
  tier1_count INTEGER;
  tier3_count INTEGER;
BEGIN
  -- Tier1: 已发布且可索引的场景（当前为 Tier2 的）
  UPDATE use_cases
  SET tier = 1
  WHERE tier = 2
    AND is_published = TRUE
    AND noindex = FALSE;
  
  GET DIAGNOSTICS tier1_count = ROW_COUNT;
  RAISE NOTICE '✅ 将 % 个场景从 Tier2 调整为 Tier1', tier1_count;
  
  -- Tier2: 已发布但不可索引的场景（保持 Tier2）
  -- 这部分不需要修改，因为已经是 Tier2
  
  -- Tier3: 未发布的场景（当前为 Tier2 的）
  UPDATE use_cases
  SET tier = 3
  WHERE tier = 2
    AND is_published = FALSE;
  
  GET DIAGNOSTICS tier3_count = ROW_COUNT;
  IF tier3_count > 0 THEN
    RAISE NOTICE '✅ 将 % 个场景从 Tier2 调整为 Tier3', tier3_count;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '📊 修复后统计：';
  RAISE NOTICE '  - Tier1 场景数: %', tier1_count;
  RAISE NOTICE '  - Tier2 场景数: %', (SELECT COUNT(*) FROM use_cases WHERE tier = 2 LIMIT 1);
  RAISE NOTICE '  - Tier3 场景数: %', tier3_count;
  
END $$;

-- ============================================
-- 3. 验证修复结果（使用子查询，避免超时）
-- ============================================

-- 注意：如果这个查询仍然超时，可以跳过验证
-- DO $$ 块中的 NOTICE 消息已经显示了修复后的统计信息
-- 如果看到 NOTICE: ✅ 将 X 个场景从 Tier2 调整为 Tier1，说明修复成功

-- 最简单的验证：只检查是否存在 Tier1 场景（最快）
SELECT 
  '修复后状态' as check_type,
  EXISTS(SELECT 1 FROM use_cases WHERE tier = 1 LIMIT 1) as "是否有Tier1场景",
  EXISTS(SELECT 1 FROM use_cases WHERE tier = 2 LIMIT 1) as "是否有Tier2场景",
  EXISTS(SELECT 1 FROM use_cases WHERE tier = 3 LIMIT 1) as "是否有Tier3场景";

-- 如果上面的查询仍然超时，使用这个更简单的查询：
-- SELECT EXISTS(SELECT 1 FROM use_cases WHERE tier = 1 LIMIT 1) as "是否有Tier1场景";
