-- 068_diagnose_scene_data.sql
-- 诊断场景数据状态，帮助理解为什么设置脚本没有生效

-- ============================================
-- 1. 检查 use_cases 表的基本情况
-- ============================================

SELECT 
  'use_cases 表基本情况' as check_type,
  COUNT(*) as "总场景数",
  COUNT(*) FILTER (WHERE tier IS NOT NULL) as "有tier的场景数",
  COUNT(*) FILTER (WHERE tier = 1) as "Tier1场景数",
  COUNT(*) FILTER (WHERE tier = 2) as "Tier2场景数",
  COUNT(*) FILTER (WHERE tier = 3) as "Tier3场景数",
  COUNT(*) FILTER (WHERE is_published = TRUE) as "已发布场景数",
  COUNT(*) FILTER (WHERE tier = 1 AND is_published = TRUE) as "Tier1且已发布",
  COUNT(*) FILTER (WHERE tier = 1 AND is_published = TRUE AND noindex = FALSE) as "Tier1且已发布且noindex=false"
FROM use_cases;

-- ============================================
-- 2. 检查 Tier1 场景的详细状态
-- ============================================

SELECT 
  'Tier1 场景详细状态' as check_type,
  COUNT(*) as "Tier1总数",
  COUNT(*) FILTER (WHERE is_published = TRUE) as "已发布",
  COUNT(*) FILTER (WHERE is_published = FALSE) as "未发布",
  COUNT(*) FILTER (WHERE noindex = TRUE) as "noindex=true",
  COUNT(*) FILTER (WHERE noindex = FALSE) as "noindex=false",
  COUNT(*) FILTER (WHERE in_sitemap = TRUE) as "in_sitemap=true",
  COUNT(*) FILTER (WHERE in_sitemap = FALSE) as "in_sitemap=false",
  COUNT(*) FILTER (WHERE in_sitemap IS NULL) as "in_sitemap=NULL",
  COUNT(*) FILTER (WHERE ai_citation_score IS NOT NULL) as "有AI分数",
  COUNT(*) FILTER (WHERE ai_citation_score >= 0.65) as "AI分数>=0.65"
FROM use_cases
WHERE tier = 1;

-- ============================================
-- 3. 检查符合设置条件的场景（应该被设置但还没设置的）
-- ============================================

SELECT 
  '应该被设置但还没设置的场景' as check_type,
  COUNT(*) as "符合条件的场景数",
  COUNT(*) FILTER (WHERE in_sitemap IS NULL OR in_sitemap = FALSE) as "in_sitemap未设置",
  COUNT(*) FILTER (WHERE ai_citation_score IS NULL OR ai_citation_score = 0) as "AI分数未设置"
FROM use_cases
WHERE tier = 1
  AND is_published = TRUE
  AND noindex = FALSE;

-- ============================================
-- 4. 显示一些示例场景（用于调试）
-- ============================================

SELECT 
  id,
  slug,
  title,
  tier,
  is_published,
  noindex,
  in_sitemap,
  ai_citation_score,
  created_at
FROM use_cases
WHERE tier = 1
  AND is_published = TRUE
LIMIT 10;
