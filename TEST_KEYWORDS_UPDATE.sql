-- TEST_KEYWORDS_UPDATE.sql
-- 测试脚本：先查看需要更新的记录，然后执行更新

-- 1. 查看需要更新的记录（执行更新前）
SELECT 
  id,
  keyword,
  page_slug as current_slug,
  'keywords-' || page_slug as new_slug,
  status,
  updated_at
FROM long_tail_keywords
WHERE page_slug NOT LIKE 'keywords-%'
  AND page_slug IS NOT NULL
  AND page_slug != ''
ORDER BY updated_at DESC
LIMIT 20;

-- 2. 统计需要更新的记录数
SELECT 
  COUNT(*) as records_to_update
FROM long_tail_keywords
WHERE page_slug NOT LIKE 'keywords-%'
  AND page_slug IS NOT NULL
  AND page_slug != '';

-- 3. 执行更新（取消注释下面的 UPDATE 语句来执行）
-- UPDATE long_tail_keywords
-- SET 
--   page_slug = 'keywords-' || page_slug,
--   updated_at = NOW()
-- WHERE 
--   page_slug NOT LIKE 'keywords-%'
--   AND page_slug IS NOT NULL
--   AND page_slug != '';

-- 4. 验证更新结果（执行更新后运行）
-- SELECT 
--   id,
--   keyword,
--   page_slug,
--   CASE 
--     WHEN page_slug LIKE 'keywords-%' THEN '✓ 已统一'
--     ELSE '✗ 需要修复'
--   END as status
-- FROM long_tail_keywords
-- ORDER BY updated_at DESC
-- LIMIT 20;

