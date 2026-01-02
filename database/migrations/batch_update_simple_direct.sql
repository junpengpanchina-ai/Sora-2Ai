-- ============================================
-- 批量更新 Purchase Intent（最简单直接版本）
-- ============================================
-- 不使用 CTE，直接 UPDATE，最可靠
-- ============================================

-- 每次执行更新 2,000 条
-- 重复执行直到 remaining = 0

UPDATE page_meta
SET 
  purchase_intent = COALESCE((
    SELECT CASE
      WHEN uc.use_case_type IN ('product-demo-showcase', 'advertising-promotion') THEN 3
      WHEN uc.use_case_type IN ('education-explainer', 'ugc-creator-content') THEN 2
      WHEN uc.use_case_type = 'brand-storytelling' THEN 1
      WHEN uc.use_case_type = 'social-media-content' THEN 0
      ELSE 0
    END
    FROM use_cases uc
    WHERE uc.id = page_meta.page_id
    LIMIT 1
  ), 0),
  layer = COALESCE((
    SELECT CASE
      WHEN uc.use_case_type IN ('product-demo-showcase', 'advertising-promotion') THEN 'conversion'
      WHEN uc.use_case_type IN ('education-explainer', 'ugc-creator-content') THEN 'conversion'
      ELSE 'asset'
    END
    FROM use_cases uc
    WHERE uc.id = page_meta.page_id
    LIMIT 1
  ), 'asset')
WHERE page_type = 'use_case'
  AND status = 'published'
  AND purchase_intent = 0
  AND page_id IN (
    SELECT page_id
    FROM page_meta
    WHERE page_type = 'use_case'
      AND status = 'published'
      AND purchase_intent = 0
    LIMIT 2000
  );

-- ============================================
-- 执行后检查进度
-- ============================================

SELECT COUNT(*) as remaining
FROM page_meta
WHERE page_type = 'use_case'
  AND status = 'published'
  AND purchase_intent = 0;

