-- 检查特定关键词的 page_slug 值
-- 在 Supabase SQL Editor 中执行此查询

-- 检查这个特定的关键词
SELECT 
  id,
  keyword,
  page_slug,
  status,
  updated_at,
  -- 检查是否包含文件扩展名
  CASE 
    WHEN page_slug ~* '\.(xml|html|htm|json|txt)$' THEN '包含扩展名'
    ELSE '无扩展名'
  END as extension_status
FROM long_tail_keywords
WHERE keyword LIKE '%Sora2 vs Runway România%'
   OR page_slug LIKE '%keywords-romania-sora2-vs-runway%'
ORDER BY updated_at DESC;

-- 如果发现包含 .xml 后缀，执行以下更新
-- UPDATE long_tail_keywords
-- SET 
--   page_slug = REGEXP_REPLACE(page_slug, '\.(xml|html|htm|json|txt)$', '', 'i'),
--   updated_at = NOW()
-- WHERE page_slug ~* '\.(xml|html|htm|json|txt)$'
--   AND (keyword LIKE '%Sora2 vs Runway România%' OR page_slug LIKE '%keywords-romania-sora2-vs-runway%');

