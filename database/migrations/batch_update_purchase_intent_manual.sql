-- ============================================
-- 批量更新 Purchase Intent（手动分段执行）
-- ============================================
-- 说明：每次执行更新 2,000 条，手动重复执行直到完成
-- 优点：完全可控，不会超时
-- ============================================

-- ============================================
-- 执行方法：
-- 1. 复制下面的 SQL 到 Dashboard SQL Editor
-- 2. 执行
-- 3. 查看结果（应该显示更新了 2,000 条或更少）
-- 4. 重复执行，直到返回 "0 rows affected"
-- ============================================

WITH batch AS (
  SELECT pm.page_id
  FROM page_meta pm
  WHERE pm.page_type = 'use_case'
    AND pm.status = 'published'
    AND pm.purchase_intent = 0
  LIMIT 2000
),
updates AS (
  SELECT 
    b.page_id,
    CASE
      WHEN uc.use_case_type IN ('product-demo-showcase', 'advertising-promotion') THEN 3
      WHEN uc.use_case_type IN ('education-explainer', 'ugc-creator-content') THEN 2
      WHEN uc.use_case_type = 'brand-storytelling' THEN 1
      WHEN uc.use_case_type = 'social-media-content' THEN 0
      ELSE 0
    END as purchase_intent,
    CASE
      WHEN uc.use_case_type IN ('product-demo-showcase', 'advertising-promotion') THEN 'conversion'
      WHEN uc.use_case_type IN ('education-explainer', 'ugc-creator-content') THEN 'conversion'
      ELSE 'asset'
    END as layer
  FROM batch b
  INNER JOIN use_cases uc ON b.page_id = uc.id
)
UPDATE page_meta pm
SET 
  purchase_intent = u.purchase_intent,
  layer = u.layer
FROM updates u
WHERE pm.page_id = u.page_id;

-- ============================================
-- 执行后检查进度（可选，单独执行）
-- ============================================

-- 查看还有多少未更新
-- SELECT COUNT(*) as remaining
-- FROM page_meta
-- WHERE page_type = 'use_case'
--   AND status = 'published'
--   AND purchase_intent = 0;

