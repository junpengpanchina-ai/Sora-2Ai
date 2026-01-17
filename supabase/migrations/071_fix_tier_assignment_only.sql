-- 071_fix_tier_assignment_only.sql
-- 只包含 DO $$ 块部分，用于快速执行（避免验证查询超时）
--
-- 说明：
-- 这个脚本只包含修复逻辑，不包含验证查询
-- 执行后查看 NOTICE 消息确认修复成功

-- ============================================
-- 重新分配 Tier
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
