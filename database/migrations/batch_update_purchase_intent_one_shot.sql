-- ============================================
-- 批量更新 Purchase Intent（一次性版本）
-- ============================================
-- 说明：尝试一次性更新所有记录
-- 如果超时，请使用 batch_update_purchase_intent_auto.sql
-- ============================================

-- 方法：使用子查询，避免 JOIN 导致的性能问题
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
  AND pm.purchase_intent = 0;

-- 如果上面的方法还是超时，使用这个优化版本（使用 EXISTS 而不是子查询）
-- UPDATE page_meta pm
-- SET 
--   purchase_intent = CASE
--     WHEN EXISTS (
--       SELECT 1 FROM use_cases uc 
--       WHERE uc.id = pm.page_id 
--       AND uc.use_case_type IN ('product-demo-showcase', 'advertising-promotion')
--     ) THEN 3
--     WHEN EXISTS (
--       SELECT 1 FROM use_cases uc 
--       WHERE uc.id = pm.page_id 
--       AND uc.use_case_type IN ('education-explainer', 'ugc-creator-content')
--     ) THEN 2
--     WHEN EXISTS (
--       SELECT 1 FROM use_cases uc 
--       WHERE uc.id = pm.page_id 
--       AND uc.use_case_type = 'brand-storytelling'
--     ) THEN 1
--     WHEN EXISTS (
--       SELECT 1 FROM use_cases uc 
--       WHERE uc.id = pm.page_id 
--       AND uc.use_case_type = 'social-media-content'
--     ) THEN 0
--     ELSE 0
--   END,
--   layer = CASE
--     WHEN EXISTS (
--       SELECT 1 FROM use_cases uc 
--       WHERE uc.id = pm.page_id 
--       AND uc.use_case_type IN ('product-demo-showcase', 'advertising-promotion')
--     ) THEN 'conversion'
--     WHEN EXISTS (
--       SELECT 1 FROM use_cases uc 
--       WHERE uc.id = pm.page_id 
--       AND uc.use_case_type IN ('education-explainer', 'ugc-creator-content')
--     ) THEN 'conversion'
--     ELSE 'asset'
--   END
-- WHERE pm.page_type = 'use_case'
--   AND pm.status = 'published'
--   AND pm.purchase_intent = 0;

