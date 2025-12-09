-- 019_fix_missing_keywords_prefix.sql
-- 修复所有没有 keywords- 前缀的 page_slug，确保完全统一

-- 第一步：更新所有没有 keywords- 前缀的 page_slug
UPDATE long_tail_keywords
SET 
  page_slug = CASE 
    -- 如果已经以 keywords- 开头，保持不变
    WHEN page_slug LIKE 'keywords-%' THEN page_slug
    -- 如果以 keywords 开头但不是 keywords-，添加连字符
    WHEN page_slug LIKE 'keywords%' AND page_slug NOT LIKE 'keywords-%' THEN 
      'keywords-' || SUBSTRING(page_slug FROM 9)  -- 跳过 'keywords' 8个字符
    -- 其他所有情况，添加 keywords- 前缀
    ELSE 'keywords-' || page_slug
  END,
  updated_at = NOW()
WHERE 
  -- 只更新不以 keywords- 开头的记录
  page_slug NOT LIKE 'keywords-%';

-- 第二步：处理可能的重复 page_slug（为重复项添加数字后缀）
DO $$
DECLARE
  duplicate_group RECORD;
  duplicate_item RECORD;
  new_slug TEXT;
  counter INTEGER;
  base_slug TEXT;
BEGIN
  -- 查找所有重复的 page_slug 组
  FOR duplicate_group IN
    SELECT page_slug, COUNT(*) as cnt
    FROM long_tail_keywords
    GROUP BY page_slug
    HAVING COUNT(*) > 1
    ORDER BY page_slug
  LOOP
    base_slug := duplicate_group.page_slug;
    counter := 1;
    
    -- 为每个重复组中的记录（除了第一条）添加数字后缀
    FOR duplicate_item IN
      SELECT id, page_slug, created_at
      FROM long_tail_keywords
      WHERE page_slug = base_slug
      ORDER BY created_at ASC
      OFFSET 1  -- 跳过第一条，保留最早的记录
    LOOP
      -- 生成新的唯一 slug
      new_slug := base_slug || '-' || counter;
      
      -- 确保新 slug 是唯一的（如果已经存在，增加计数器）
      WHILE EXISTS (SELECT 1 FROM long_tail_keywords WHERE page_slug = new_slug) LOOP
        counter := counter + 1;
        new_slug := base_slug || '-' || counter;
      END LOOP;
      
      -- 更新记录
      UPDATE long_tail_keywords
      SET 
        page_slug = new_slug,
        updated_at = NOW()
      WHERE id = duplicate_item.id;
      
      counter := counter + 1;
    END LOOP;
  END LOOP;
END $$;

-- 第三步：验证结果（显示需要修复的记录）
-- 执行以下查询来检查是否还有未统一的记录：
-- SELECT 
--   id,
--   keyword,
--   page_slug,
--   CASE 
--     WHEN page_slug LIKE 'keywords-%' THEN '✓ 已统一'
--     ELSE '✗ 需要修复'
--   END as status
-- FROM long_tail_keywords
-- WHERE page_slug NOT LIKE 'keywords-%'
-- ORDER BY updated_at DESC;

-- 第四步：最终验证（显示所有记录的前缀状态）
-- SELECT 
--   COUNT(*) as total_records,
--   COUNT(CASE WHEN page_slug LIKE 'keywords-%' THEN 1 END) as unified_records,
--   COUNT(CASE WHEN page_slug NOT LIKE 'keywords-%' THEN 1 END) as non_unified_records
-- FROM long_tail_keywords;

