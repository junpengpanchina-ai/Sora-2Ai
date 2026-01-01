-- ============================================
-- 为现有页面创建 page_meta 记录
-- ============================================
-- 说明：根据实际表结构创建 page_meta 记录
-- ============================================

-- ============================================
-- 1. 为 use_cases 创建 page_meta 记录
-- ============================================
-- 注意：use_cases 表使用 is_published (BOOLEAN)，不是 status
INSERT INTO page_meta (page_type, page_id, page_slug, status)
SELECT 
  'use_case' as page_type,
  id as page_id,
  slug as page_slug,
  CASE 
    WHEN is_published = TRUE THEN 'published'
    ELSE 'draft'
  END as status
FROM use_cases
ON CONFLICT (page_type, page_id) DO NOTHING;

-- ============================================
-- 2. 为 long_tail_keywords 创建 page_meta 记录
-- ============================================
-- 注意：long_tail_keywords 表使用 status (TEXT: 'draft' | 'published')
INSERT INTO page_meta (page_type, page_id, page_slug, status)
SELECT 
  'keyword' as page_type,
  id as page_id,
  page_slug as page_slug,
  status  -- long_tail_keywords 已经有 status 字段
FROM long_tail_keywords
WHERE status = 'published'
ON CONFLICT (page_type, page_id) DO NOTHING;

-- ============================================
-- 3. 查看创建结果
-- ============================================
SELECT 
  page_type,
  status,
  COUNT(*) as count
FROM page_meta
GROUP BY page_type, status
ORDER BY page_type, status;

