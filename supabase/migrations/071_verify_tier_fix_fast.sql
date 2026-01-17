-- 071_verify_tier_fix_fast.sql
-- 快速验证 Tier 修复结果（优化版本，避免超时）
--
-- 说明：
-- 使用更简单的查询，只检查关键指标，避免扫描大量数据

-- ============================================
-- 快速验证（只检查关键指标）
-- ============================================

-- 1. 检查 Tier 分布（使用索引，快速）
SELECT 
  'Tier分布' as check_type,
  COUNT(*) FILTER (WHERE tier = 1) as "Tier1场景数",
  COUNT(*) FILTER (WHERE tier = 2) as "Tier2场景数",
  COUNT(*) FILTER (WHERE tier = 3) as "Tier3场景数"
FROM use_cases
WHERE tier IN (1, 2, 3);  -- 只查询有 tier 的场景，利用索引

-- 2. 检查 Tier1 场景的关键条件（简化查询）
SELECT 
  'Tier1关键指标' as check_type,
  COUNT(*) as "Tier1总数",
  COUNT(*) FILTER (WHERE is_published = TRUE) as "Tier1且已发布"
FROM use_cases
WHERE tier = 1;  -- 利用 tier 索引

-- 3. 检查是否有 Tier1 场景（最快）
SELECT 
  '快速检查' as check_type,
  EXISTS(SELECT 1 FROM use_cases WHERE tier = 1 LIMIT 1) as "是否有Tier1场景",
  (SELECT COUNT(*) FROM use_cases WHERE tier = 1 LIMIT 100) as "Tier1场景数（前100）"
FROM use_cases
LIMIT 1;
