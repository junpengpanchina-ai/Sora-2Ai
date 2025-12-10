-- DIAGNOSE_KEYWORDS.sql
-- 诊断脚本：检查为什么迁移脚本没有生效

-- 1. 检查是否有唯一性约束
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'long_tail_keywords'::regclass
  AND conname LIKE '%page_slug%';

-- 2. 检查当前状态：有多少记录需要更新
SELECT 
  '需要更新的记录数' as description,
  COUNT(*) as count
FROM long_tail_keywords
WHERE page_slug NOT LIKE 'keywords-%'
  AND page_slug IS NOT NULL
  AND page_slug != '';

-- 3. 查看具体需要更新的记录（前10条）
SELECT 
  id,
  keyword,
  page_slug as current_slug,
  'keywords-' || page_slug as would_become,
  status,
  created_at,
  updated_at
FROM long_tail_keywords
WHERE page_slug NOT LIKE 'keywords-%'
  AND page_slug IS NOT NULL
  AND page_slug != ''
ORDER BY updated_at DESC
LIMIT 10;

-- 4. 检查是否有重复的 page_slug（这可能导致更新失败）
SELECT 
  page_slug,
  COUNT(*) as duplicate_count,
  array_agg(id ORDER BY created_at) as ids
FROM long_tail_keywords
WHERE page_slug NOT LIKE 'keywords-%'
GROUP BY page_slug
HAVING COUNT(*) > 1;

-- 5. 检查添加前缀后是否会产生重复
SELECT 
  'keywords-' || page_slug as new_slug,
  COUNT(*) as would_be_duplicate_count
FROM long_tail_keywords
WHERE page_slug NOT LIKE 'keywords-%'
GROUP BY 'keywords-' || page_slug
HAVING COUNT(*) > 1;

