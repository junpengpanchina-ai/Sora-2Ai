-- 021_simple_unify_keywords.sql
-- 简化版本：直接更新所有记录，处理重复问题

-- 步骤1：先处理可能产生的重复问题
-- 如果添加 keywords- 前缀后会产生重复，先为这些记录添加后缀
DO $$
DECLARE
  rec RECORD;
  new_slug TEXT;
  counter INTEGER;
BEGIN
  -- 查找添加前缀后会产生重复的记录
  FOR rec IN
    SELECT 
      t1.id,
      t1.page_slug,
      COUNT(*) OVER (PARTITION BY 'keywords-' || t1.page_slug) as dup_count,
      ROW_NUMBER() OVER (PARTITION BY 'keywords-' || t1.page_slug ORDER BY t1.created_at) as rn
    FROM long_tail_keywords t1
    WHERE t1.page_slug NOT LIKE 'keywords-%'
      AND EXISTS (
        SELECT 1 
        FROM long_tail_keywords t2 
        WHERE t2.id != t1.id 
          AND 'keywords-' || t1.page_slug = 'keywords-' || t2.page_slug
      )
  LOOP
    -- 如果不是第一条记录，添加后缀
    IF rec.rn > 1 THEN
      counter := 1;
      new_slug := 'keywords-' || rec.page_slug || '-' || counter;
      
      -- 确保新 slug 是唯一的
      WHILE EXISTS (SELECT 1 FROM long_tail_keywords WHERE page_slug = new_slug) LOOP
        counter := counter + 1;
        new_slug := 'keywords-' || rec.page_slug || '-' || counter;
      END LOOP;
      
      UPDATE long_tail_keywords
      SET 
        page_slug = new_slug,
        updated_at = NOW()
      WHERE id = rec.id;
    END IF;
  END LOOP;
END $$;

-- 步骤2：更新所有剩余的不以 keywords- 开头的记录
UPDATE long_tail_keywords
SET 
  page_slug = 'keywords-' || page_slug,
  updated_at = NOW()
WHERE 
  page_slug NOT LIKE 'keywords-%'
  AND page_slug IS NOT NULL
  AND page_slug != '';

-- 步骤3：验证结果
SELECT 
  '更新完成' as status,
  COUNT(*) as total_records,
  COUNT(CASE WHEN page_slug LIKE 'keywords-%' THEN 1 END) as unified_count,
  COUNT(CASE WHEN page_slug NOT LIKE 'keywords-%' THEN 1 END) as non_unified_count
FROM long_tail_keywords;

