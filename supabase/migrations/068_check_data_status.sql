-- 068_check_data_status.sql
-- 检查当前数据状态，确认是否有需要更新的记录
--
-- 说明：
-- 如果脚本执行成功但没有更新任何记录，可能所有记录都已经设置好了
-- 这个脚本会检查当前数据状态

-- ============================================
-- 1. 检查符合条件的场景数量（快速查询）
-- ============================================

-- 检查需要设置 in_sitemap 的场景数量（只检查前 1000 条，避免超时）
SELECT 
  '需要设置in_sitemap的场景（样本）' as check_type,
  COUNT(*) as "符合条件的场景数（前1000条样本）"
FROM (
  SELECT * 
  FROM use_cases
  WHERE is_published = TRUE
    AND noindex = FALSE
    AND (in_sitemap IS NULL OR in_sitemap = FALSE)
  LIMIT 1000
) sample;

-- ============================================
-- 2. 检查已经设置了 in_sitemap 的场景数量（样本）
-- ============================================

SELECT 
  '已设置in_sitemap的场景（样本）' as check_type,
  COUNT(*) as "已设置的场景数（前1000条样本）"
FROM (
  SELECT * 
  FROM use_cases
  WHERE is_published = TRUE
    AND noindex = FALSE
    AND in_sitemap = TRUE
  LIMIT 1000
) sample;

-- ============================================
-- 3. 检查需要设置 AI 分数的场景数量（样本）
-- ============================================

SELECT 
  '需要设置AI分数的场景（样本）' as check_type,
  COUNT(*) as "符合条件的场景数（前1000条样本）"
FROM (
  SELECT * 
  FROM use_cases
  WHERE is_published = TRUE
    AND noindex = FALSE
    AND in_sitemap = TRUE
    AND (ai_citation_score IS NULL OR ai_citation_score = 0)
  LIMIT 1000
) sample;

-- ============================================
-- 4. 检查已经设置了 AI 分数的场景数量（样本）
-- ============================================

SELECT 
  '已设置AI分数的场景（样本）' as check_type,
  COUNT(*) as "已设置的场景数（前1000条样本）"
FROM (
  SELECT * 
  FROM use_cases
  WHERE is_published = TRUE
    AND noindex = FALSE
    AND ai_citation_score >= 0.65
  LIMIT 1000
) sample;

-- ============================================
-- 5. 显示一些示例记录（用于调试）
-- ============================================

SELECT 
  id,
  slug,
  is_published,
  noindex,
  in_sitemap,
  ai_citation_score
FROM use_cases
WHERE is_published = TRUE
  AND noindex = FALSE
LIMIT 10;
