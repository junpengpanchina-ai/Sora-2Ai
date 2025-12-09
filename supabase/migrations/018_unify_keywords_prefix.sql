-- 018_unify_keywords_prefix.sql
-- 统一所有 long_tail_keywords 表中 page_slug 字段，确保都以 keywords- 开头

-- 更新所有没有 keywords- 前缀的 page_slug
UPDATE long_tail_keywords
SET 
  page_slug = CASE 
    -- 如果已经以 keywords- 开头，保持不变
    WHEN page_slug LIKE 'keywords-%' THEN page_slug
    -- 如果以 keywords 开头但不是 keywords-，添加连字符
    WHEN page_slug LIKE 'keywords%' AND page_slug NOT LIKE 'keywords-%' THEN 
      'keywords-' || SUBSTRING(page_slug FROM 9)  -- 跳过 'keywords' 8个字符
    -- 其他情况，添加 keywords- 前缀
    ELSE 'keywords-' || page_slug
  END,
  updated_at = NOW()
WHERE 
  -- 只更新不以 keywords- 开头的记录
  page_slug NOT LIKE 'keywords-%';

-- 如果更新后出现重复的 page_slug，需要处理重复项
-- 为重复的记录添加数字后缀
DO $$
DECLARE
  duplicate_record RECORD;
  new_slug TEXT;
  counter INTEGER;
BEGIN
  -- 查找重复的 page_slug
  FOR duplicate_record IN
    SELECT page_slug, COUNT(*) as cnt
    FROM long_tail_keywords
    GROUP BY page_slug
    HAVING COUNT(*) > 1
  LOOP
    -- 为重复的记录添加数字后缀（保留第一条，从第二条开始添加后缀）
    counter := 1;
    FOR duplicate_record IN
      SELECT id, page_slug
      FROM long_tail_keywords
      WHERE page_slug = duplicate_record.page_slug
      ORDER BY created_at
      OFFSET 1  -- 跳过第一条，保留原始的
    LOOP
      new_slug := duplicate_record.page_slug || '-' || counter;
      
      -- 确保新 slug 也是唯一的
      WHILE EXISTS (SELECT 1 FROM long_tail_keywords WHERE page_slug = new_slug) LOOP
        counter := counter + 1;
        new_slug := duplicate_record.page_slug || '-' || counter;
      END LOOP;
      
      UPDATE long_tail_keywords
      SET 
        page_slug = new_slug,
        updated_at = NOW()
      WHERE id = duplicate_record.id;
      
      counter := counter + 1;
    END LOOP;
  END LOOP;
END $$;

-- 验证更新结果（可选，用于检查）
-- SELECT 
--   id,
--   keyword,
--   page_slug,
--   CASE 
--     WHEN page_slug LIKE 'keywords-%' THEN '✓ 正确格式'
--     ELSE '✗ 需要修复'
--   END as format_status
-- FROM long_tail_keywords
-- ORDER BY updated_at DESC
-- LIMIT 20;

