-- 022_fix_keywords_slug_prefix.sql
-- 修复长尾词 slug 中重复的 keywords- 前缀

-- 步骤 1: 检查有多少 slug 有重复前缀
DO $$
DECLARE
  count_duplicate INTEGER;
BEGIN
  SELECT COUNT(*) INTO count_duplicate
  FROM long_tail_keywords
  WHERE page_slug LIKE 'keywords-keywords-%';
  
  RAISE NOTICE 'Found % slugs with duplicate keywords- prefix', count_duplicate;
END $$;

-- 步骤 2: 修复重复的 keywords- 前缀
-- 将所有 keywords-keywords- 替换为 keywords-
UPDATE long_tail_keywords
SET page_slug = REPLACE(page_slug, 'keywords-keywords-', 'keywords-')
WHERE page_slug LIKE 'keywords-keywords-%';

-- 步骤 3: 处理可能的 keywords-keywords-keywords- 情况（三层重复）
UPDATE long_tail_keywords
SET page_slug = REPLACE(page_slug, 'keywords-keywords-keywords-', 'keywords-')
WHERE page_slug LIKE 'keywords-keywords-keywords-%';

-- 步骤 4: 如果 slug 不以 keywords- 开头，添加前缀（可选，根据你的需求）
-- 注意：这个操作可能不需要，取决于你的业务逻辑
-- UPDATE long_tail_keywords
-- SET page_slug = 'keywords-' || page_slug
-- WHERE page_slug NOT LIKE 'keywords-%' AND page_slug != '';

-- 步骤 5: 验证修复结果
DO $$
DECLARE
  count_remaining INTEGER;
BEGIN
  SELECT COUNT(*) INTO count_remaining
  FROM long_tail_keywords
  WHERE page_slug LIKE 'keywords-keywords-%';
  
  IF count_remaining > 0 THEN
    RAISE WARNING 'Still have % slugs with duplicate keywords- prefix', count_remaining;
  ELSE
    RAISE NOTICE 'All duplicate prefixes have been fixed';
  END IF;
END $$;

-- 注意：这个迁移不会导致数据丢失，只是清理 URL 格式
-- 如果担心，可以先备份：
-- CREATE TABLE long_tail_keywords_backup AS SELECT * FROM long_tail_keywords;

