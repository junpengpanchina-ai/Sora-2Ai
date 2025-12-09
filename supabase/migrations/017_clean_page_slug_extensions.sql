-- 017_clean_page_slug_extensions.sql
-- 清理 long_tail_keywords 表中 page_slug 字段的文件扩展名（如 .xml, .html 等）

-- 更新所有包含文件扩展名的 page_slug
-- 移除常见的文件扩展名：.xml, .html, .htm, .json, .txt
UPDATE long_tail_keywords
SET 
  page_slug = REGEXP_REPLACE(
    page_slug,
    '\.(xml|html|htm|json|txt)$',
    '',
    'i'
  ),
  updated_at = NOW()
WHERE 
  page_slug ~* '\.(xml|html|htm|json|txt)$';

-- 如果更新后出现重复的 page_slug，需要手动处理
-- 这里我们添加一个临时后缀来避免唯一性冲突
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
    -- 为重复的记录添加数字后缀
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

-- 验证：显示所有仍包含文件扩展名的记录（应该为空）
-- SELECT id, page_slug 
-- FROM long_tail_keywords 
-- WHERE page_slug ~* '\.(xml|html|htm|json|txt)$';

