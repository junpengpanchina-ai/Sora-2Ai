-- ============================================
-- 检查遗漏的记录（SQL 版本）
-- ============================================
-- 使用 SQL 直接查询，更准确
-- ============================================

-- 1. 总览
SELECT 
  '总发布数' as metric,
  COUNT(*)::text as value
FROM page_meta
WHERE page_type = 'use_case'
  AND status = 'published'
UNION ALL
SELECT 
  'Intent > 0' as metric,
  COUNT(*)::text as value
FROM page_meta
WHERE page_type = 'use_case'
  AND status = 'published'
  AND purchase_intent > 0
UNION ALL
SELECT 
  'Intent = 0' as metric,
  COUNT(*)::text as value
FROM page_meta
WHERE page_type = 'use_case'
  AND status = 'published'
  AND purchase_intent = 0;

-- 2. 检查有 use_cases 但 intent=0 的记录（应该更新但没更新）
SELECT 
  COUNT(*) as should_be_updated,
  '有 use_cases 但 intent=0（非 social-media-content）' as description
FROM page_meta pm
INNER JOIN use_cases uc ON pm.page_id = uc.id
WHERE pm.page_type = 'use_case'
  AND pm.status = 'published'
  AND pm.purchase_intent = 0
  AND uc.use_case_type NOT IN ('social-media-content');

-- 3. 检查这些记录的 use_case_type 分布
SELECT 
  uc.use_case_type,
  COUNT(*) as count
FROM page_meta pm
INNER JOIN use_cases uc ON pm.page_id = uc.id
WHERE pm.page_type = 'use_case'
  AND pm.status = 'published'
  AND pm.purchase_intent = 0
  AND uc.use_case_type NOT IN ('social-media-content')
GROUP BY uc.use_case_type
ORDER BY count DESC;

-- 4. 检查没有 use_cases 但 intent > 0 的记录（异常情况）
SELECT 
  COUNT(*) as abnormal_records,
  '无 use_cases 但 intent > 0' as description
FROM page_meta pm
WHERE pm.page_type = 'use_case'
  AND pm.status = 'published'
  AND pm.purchase_intent > 0
  AND NOT EXISTS (
    SELECT 1 FROM use_cases uc WHERE uc.id = pm.page_id
  );

-- 5. 总结：需要更新的记录
SELECT 
  COUNT(*) as need_update,
  '需要更新的记录总数' as description
FROM page_meta pm
INNER JOIN use_cases uc ON pm.page_id = uc.id
WHERE pm.page_type = 'use_case'
  AND pm.status = 'published'
  AND pm.purchase_intent = 0
  AND uc.use_case_type NOT IN ('social-media-content');

