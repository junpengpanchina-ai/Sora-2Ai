-- 070_check_scene_status.sql
-- 检查场景状态，了解为什么没有 Tier1 场景

-- ============================================
-- 1. 检查场景的发布和索引状态
-- ============================================

SELECT 
  '场景状态分布' as check_type,
  COUNT(*) as "总场景数",
  COUNT(*) FILTER (WHERE is_published = TRUE) as "已发布",
  COUNT(*) FILTER (WHERE is_published = FALSE) as "未发布",
  COUNT(*) FILTER (WHERE noindex = TRUE) as "noindex=true",
  COUNT(*) FILTER (WHERE noindex = FALSE) as "noindex=false",
  COUNT(*) FILTER (WHERE noindex IS NULL) as "noindex=NULL",
  COUNT(*) FILTER (WHERE is_published = TRUE AND noindex = FALSE) as "已发布且可索引",
  COUNT(*) FILTER (WHERE is_published = TRUE AND noindex = TRUE) as "已发布但不可索引"
FROM use_cases;

-- ============================================
-- 2. 检查当前 tier 分布
-- ============================================

SELECT 
  '当前 Tier 分布' as check_type,
  COUNT(*) FILTER (WHERE tier = 1) as "Tier1",
  COUNT(*) FILTER (WHERE tier = 2) as "Tier2",
  COUNT(*) FILTER (WHERE tier = 3) as "Tier3",
  COUNT(*) FILTER (WHERE tier IS NULL) as "tier=NULL"
FROM use_cases;

-- ============================================
-- 3. 检查 Tier2 场景的详细状态
-- ============================================

SELECT 
  'Tier2 场景状态' as check_type,
  COUNT(*) as "Tier2总数",
  COUNT(*) FILTER (WHERE is_published = TRUE) as "已发布",
  COUNT(*) FILTER (WHERE is_published = FALSE) as "未发布",
  COUNT(*) FILTER (WHERE noindex = TRUE) as "noindex=true",
  COUNT(*) FILTER (WHERE noindex = FALSE) as "noindex=false",
  COUNT(*) FILTER (WHERE noindex IS NULL) as "noindex=NULL"
FROM use_cases
WHERE tier = 2;

-- ============================================
-- 4. 如果所有场景都是 noindex = TRUE，提供调整建议
-- ============================================

-- 如果大部分场景都是 noindex = TRUE，可以考虑：
-- 选项 A：将已发布且 noindex = TRUE 的场景也设置为 Tier1（如果业务允许）
-- 选项 B：先更新一些场景的 noindex = FALSE，然后再设置 tier
-- 选项 C：调整 tier 设置策略，不依赖 noindex
