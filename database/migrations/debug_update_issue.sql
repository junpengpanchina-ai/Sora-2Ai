-- ============================================
-- 详细调试：为什么 UPDATE 没有更新任何行
-- ============================================

-- 1. 检查 batch CTE 能找到多少记录
WITH batch AS (
  SELECT pm.page_id
  FROM page_meta pm
  WHERE pm.page_type = 'use_case'
    AND pm.status = 'published'
    AND pm.purchase_intent = 0
  LIMIT 10
)
SELECT 
  'batch_count' as check_type,
  COUNT(*)::text as result
FROM batch
UNION ALL
-- 2. 检查这些记录能否 JOIN 到 use_cases
SELECT 
  'join_count' as check_type,
  COUNT(*)::text as result
FROM (
  SELECT pm.page_id
  FROM page_meta pm
  WHERE pm.page_type = 'use_case'
    AND pm.status = 'published'
    AND pm.purchase_intent = 0
  LIMIT 10
) b
INNER JOIN use_cases uc ON b.page_id = uc.id
UNION ALL
-- 3. 检查 updates CTE 能生成多少记录
SELECT 
  'updates_count' as check_type,
  COUNT(*)::text as result
FROM (
  WITH batch AS (
    SELECT pm.page_id
    FROM page_meta pm
    WHERE pm.page_type = 'use_case'
      AND pm.status = 'published'
      AND pm.purchase_intent = 0
    LIMIT 10
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
      END as purchase_intent
    FROM batch b
    INNER JOIN use_cases uc ON b.page_id = uc.id
  )
  SELECT * FROM updates
) sub;

-- 4. 检查前 5 条记录的详细信息
WITH batch AS (
  SELECT pm.page_id
  FROM page_meta pm
  WHERE pm.page_type = 'use_case'
    AND pm.status = 'published'
    AND pm.purchase_intent = 0
  LIMIT 5
)
SELECT 
  b.page_id,
  uc.id as use_case_id,
  uc.use_case_type,
  pm_current.purchase_intent as current_intent,
  CASE
    WHEN uc.use_case_type IN ('product-demo-showcase', 'advertising-promotion') THEN 3
    WHEN uc.use_case_type IN ('education-explainer', 'ugc-creator-content') THEN 2
    WHEN uc.use_case_type = 'brand-storytelling' THEN 1
    WHEN uc.use_case_type = 'social-media-content' THEN 0
    ELSE 0
  END as new_intent
FROM batch b
INNER JOIN use_cases uc ON b.page_id = uc.id
LEFT JOIN page_meta pm_current ON pm_current.page_id = b.page_id
LIMIT 5;

