-- ============================================
-- 修复孤立的 page_meta 记录
-- ============================================
-- 问题：63,083 条 page_meta 记录没有对应的 use_cases
-- 解决方案：为这些记录设置默认值
-- ============================================

-- 方案 1：为孤立记录设置默认值（推荐）
-- 这些记录可能是其他类型的页面，或者 use_cases 已被删除
UPDATE page_meta
SET 
  purchase_intent = 0,  -- 保持为 0（低优先级）
  layer = 'asset'       -- 设置为 asset 层
WHERE page_type = 'use_case'
  AND status = 'published'
  AND purchase_intent = 0
  AND NOT EXISTS (
    SELECT 1 
    FROM use_cases uc 
    WHERE uc.id = page_meta.page_id
  );

-- 检查修复结果
SELECT COUNT(*) as remaining_orphaned
FROM page_meta
WHERE page_type = 'use_case'
  AND status = 'published'
  AND purchase_intent = 0
  AND NOT EXISTS (
    SELECT 1 
    FROM use_cases uc 
    WHERE uc.id = page_meta.page_id
  );

-- ============================================
-- 方案 2：删除孤立记录（如果确认不需要）
-- ============================================
-- 警告：执行前请先备份数据！
-- 
-- DELETE FROM page_meta
-- WHERE page_type = 'use_case'
--   AND status = 'published'
--   AND purchase_intent = 0
--   AND NOT EXISTS (
--     SELECT 1 
--     FROM use_cases uc 
--     WHERE uc.id = page_meta.page_id
--   );

-- ============================================
-- 方案 3：检查这些记录是否应该存在
-- ============================================
-- 查看孤立记录的详细信息
-- SELECT 
--   pm.page_id,
--   pm.page_slug,
--   pm.created_at,
--   pm.updated_at
-- FROM page_meta pm
-- WHERE pm.page_type = 'use_case'
--   AND pm.status = 'published'
--   AND pm.purchase_intent = 0
--   AND NOT EXISTS (
--     SELECT 1 
--     FROM use_cases uc 
--     WHERE uc.id = pm.page_id
--   )
-- LIMIT 100;

