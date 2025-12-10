-- 020_force_unify_keywords_prefix.sql
-- 强制统一所有 page_slug 为 keywords- 前缀格式（简化版本）

-- 第一步：直接更新所有不以 keywords- 开头的记录
UPDATE long_tail_keywords
SET 
  page_slug = 'keywords-' || page_slug,
  updated_at = NOW()
WHERE 
  page_slug NOT LIKE 'keywords-%'
  AND page_slug IS NOT NULL
  AND page_slug != '';

-- 第二步：处理可能的重复（在添加前缀后可能产生的重复）
-- 先检查是否有重复
DO $$
DECLARE
  dup_record RECORD;
  new_slug TEXT;
  counter INTEGER;
  base_slug TEXT;
BEGIN
  -- 查找所有重复的 page_slug
  FOR dup_record IN
    SELECT page_slug, COUNT(*) as cnt
    FROM long_tail_keywords
    GROUP BY page_slug
    HAVING COUNT(*) > 1
  LOOP
    base_slug := dup_record.page_slug;
    counter := 1;
    
    -- 为重复组中的每条记录（除了第一条）添加数字后缀
    FOR dup_record IN
      SELECT id, page_slug
      FROM long_tail_keywords
      WHERE page_slug = base_slug
      ORDER BY created_at ASC
      OFFSET 1
    LOOP
      -- 生成新的唯一 slug
      new_slug := base_slug || '-' || counter;
      
      -- 确保新 slug 是唯一的
      WHILE EXISTS (SELECT 1 FROM long_tail_keywords WHERE page_slug = new_slug) LOOP
        counter := counter + 1;
        new_slug := base_slug || '-' || counter;
      END LOOP;
      
      -- 更新记录
      UPDATE long_tail_keywords
      SET 
        page_slug = new_slug,
        updated_at = NOW()
      WHERE id = dup_record.id;
      
      counter := counter + 1;
    END LOOP;
  END LOOP;
END $$;

-- 验证：显示更新后的统计信息
SELECT 
  '更新完成' as status,
  COUNT(*) as total_records,
  COUNT(CASE WHEN page_slug LIKE 'keywords-%' THEN 1 END) as unified_records,
  COUNT(CASE WHEN page_slug NOT LIKE 'keywords-%' THEN 1 END) as non_unified_records
FROM long_tail_keywords;

