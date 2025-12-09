-- CHECK_KEYWORDS_PREFIX.sql
-- 检查所有 page_slug 是否都已统一为 keywords- 前缀格式

-- 1. 查看所有未统一的记录
SELECT 
  id,
  keyword,
  page_slug,
  status,
  created_at,
  updated_at,
  '✗ 需要修复' as status_label
FROM long_tail_keywords
WHERE page_slug NOT LIKE 'keywords-%'
ORDER BY updated_at DESC;

-- 2. 统计信息
SELECT 
  COUNT(*) as total_records,
  COUNT(CASE WHEN page_slug LIKE 'keywords-%' THEN 1 END) as unified_records,
  COUNT(CASE WHEN page_slug NOT LIKE 'keywords-%' THEN 1 END) as non_unified_records,
  ROUND(
    COUNT(CASE WHEN page_slug LIKE 'keywords-%' THEN 1 END) * 100.0 / COUNT(*),
    2
  ) as unified_percentage
FROM long_tail_keywords;

-- 3. 查看所有记录的前缀状态（前20条）
SELECT 
  id,
  keyword,
  page_slug,
  CASE 
    WHEN page_slug LIKE 'keywords-%' THEN '✓ 已统一'
    ELSE '✗ 需要修复'
  END as format_status,
  created_at,
  updated_at
FROM long_tail_keywords
ORDER BY updated_at DESC
LIMIT 20;

