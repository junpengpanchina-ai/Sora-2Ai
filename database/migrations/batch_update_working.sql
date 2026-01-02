-- ============================================
-- 批量更新 Purchase Intent（工作版本）
-- ============================================
-- 使用更简单直接的方法，避免 CTE 问题
-- ============================================

-- 方法：直接 UPDATE，使用子查询
UPDATE page_meta pm
SET 
  purchase_intent = (
    SELECT CASE
      WHEN uc.use_case_type IN ('product-demo-showcase', 'advertising-promotion') THEN 3
      WHEN uc.use_case_type IN ('education-explainer', 'ugc-creator-content') THEN 2
      WHEN uc.use_case_type = 'brand-storytelling' THEN 1
      WHEN uc.use_case_type = 'social-media-content' THEN 0
      ELSE 0
    END
    FROM use_cases uc
    WHERE uc.id = pm.page_id
    LIMIT 1
  ),
  layer = (
    SELECT CASE
      WHEN uc.use_case_type IN ('product-demo-showcase', 'advertising-promotion') THEN 'conversion'
      WHEN uc.use_case_type IN ('education-explainer', 'ugc-creator-content') THEN 'conversion'
      ELSE 'asset'
    END
    FROM use_cases uc
    WHERE uc.id = pm.page_id
    LIMIT 1
  )
WHERE pm.page_type = 'use_case'
  AND pm.status = 'published'
  AND pm.purchase_intent = 0
  AND pm.page_id IN (
    SELECT page_id
    FROM page_meta
    WHERE page_type = 'use_case'
      AND status = 'published'
      AND purchase_intent = 0
    LIMIT 2000
  );

-- 检查进度
SELECT COUNT(*) as remaining
FROM page_meta
WHERE page_type = 'use_case'
  AND status = 'published'
  AND purchase_intent = 0;

