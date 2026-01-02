-- ============================================
-- 调试批量更新问题
-- ============================================
-- 检查为什么 UPDATE 没有更新任何行
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
SELECT COUNT(*) as batch_count FROM batch;

-- 2. 检查这些记录能否 JOIN 到 use_cases
WITH batch AS (
  SELECT pm.page_id
  FROM page_meta pm
  WHERE pm.page_type = 'use_case'
    AND pm.status = 'published'
    AND pm.purchase_intent = 0
  LIMIT 10
)
SELECT 
  b.page_id,
  uc.id as use_case_id,
  uc.use_case_type
FROM batch b
LEFT JOIN use_cases uc ON b.page_id = uc.id
LIMIT 10;

-- 3. 检查 updates CTE 能生成多少记录
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
    END as purchase_intent,
    CASE
      WHEN uc.use_case_type IN ('product-demo-showcase', 'advertising-promotion') THEN 'conversion'
      WHEN uc.use_case_type IN ('education-explainer', 'ugc-creator-content') THEN 'conversion'
      ELSE 'asset'
    END as layer
  FROM batch b
  INNER JOIN use_cases uc ON b.page_id = uc.id
)
SELECT COUNT(*) as updates_count FROM updates;

-- 4. 检查是否有 page_id 不匹配的问题
SELECT 
  COUNT(*) as page_meta_without_use_case
FROM page_meta pm
WHERE pm.page_type = 'use_case'
  AND pm.status = 'published'
  AND pm.purchase_intent = 0
  AND NOT EXISTS (
    SELECT 1 FROM use_cases uc WHERE uc.id = pm.page_id
  );

