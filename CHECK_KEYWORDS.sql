-- 检查这两个关键词的 page_slug 值
-- 在 Supabase SQL Editor 中执行此查询

-- 检查第一个关键词
SELECT 
  id,
  keyword,
  page_slug,
  status,
  updated_at
FROM long_tail_keywords
WHERE page_slug LIKE '%keywords-romania-buy-sora2-credits%'
   OR keyword LIKE '%cumpără credite Sora2%'
ORDER BY updated_at DESC;

-- 检查第二个关键词
SELECT 
  id,
  keyword,
  page_slug,
  status,
  updated_at
FROM long_tail_keywords
WHERE page_slug LIKE '%keywords-romania-sora2-vs-runway%'
   OR keyword LIKE '%Sora2 vs Runway%'
ORDER BY updated_at DESC;

-- 检查所有包含文件扩展名的 page_slug
SELECT 
  id,
  keyword,
  page_slug,
  status
FROM long_tail_keywords
WHERE page_slug ~* '\.(xml|html|htm|json|txt)$'
ORDER BY updated_at DESC;

