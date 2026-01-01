-- ============================================
-- 批量更新 Purchase Intent（按 ID 范围分段）
-- ============================================
-- 说明：如果 DO 块还是超时，使用这个方案
-- 手动分段执行，每次执行一个范围
-- ============================================

-- ============================================
-- 方法：按 page_id 的 UUID 范围分段更新
-- ============================================
-- 每次执行一个范围，避免超时
-- 可以根据需要调整范围大小

-- 范围 1: 更新前 10,000 条（按 page_id 排序）
WITH batch AS (
  SELECT pm.page_id
  FROM page_meta pm
  WHERE pm.page_type = 'use_case'
    AND pm.status = 'published'
    AND pm.purchase_intent = 0
  ORDER BY pm.page_id
  LIMIT 10000
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

-- 执行后检查进度
SELECT 
  COUNT(*) as remaining,
  MIN(page_id) as next_start_id
FROM page_meta
WHERE page_type = 'use_case'
  AND status = 'published'
  AND purchase_intent = 0;

-- ============================================
-- 范围 2: 继续更新下一批 10,000 条
-- ============================================
-- 重复执行上面的 SQL，直到 remaining = 0

-- ============================================
-- 或者：使用 WHERE 条件限制范围
-- ============================================

-- 先找到第一个未更新的 page_id
-- SELECT MIN(page_id) as start_id
-- FROM page_meta
-- WHERE page_type = 'use_case'
--   AND status = 'published'
--   AND purchase_intent = 0;

-- 然后使用这个 ID 作为起点（示例）
-- WITH batch AS (
--   SELECT pm.page_id
--   FROM page_meta pm
--   WHERE pm.page_type = 'use_case'
--     AND pm.status = 'published'
--     AND pm.purchase_intent = 0
--     AND pm.page_id >= '找到的 start_id'  -- 从这里开始
--   ORDER BY pm.page_id
--   LIMIT 10000
-- )
-- ... 其余代码相同

