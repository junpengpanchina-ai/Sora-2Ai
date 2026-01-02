-- ============================================
-- 简化版测试：自动同步功能
-- ============================================
-- 只测试触发器是否正常工作，不测试完整功能
-- ============================================

-- ============================================
-- 测试 1：插入新 use_case（应该自动创建 page_meta）
-- ============================================

-- 插入测试记录（包含所有必需字段）
INSERT INTO use_cases (
  id, 
  use_case_type, 
  is_published, 
  slug,
  title,
  h1,
  description,
  content
)
VALUES (
  gen_random_uuid(), 
  'product-demo-showcase', 
  true, 
  'test-auto-sync-simple',
  'Test Product Demo',
  'Test Product Demo',
  'Test description for auto-sync.',
  'Test content for auto-sync.'
);

-- 检查是否自动创建了 page_meta
SELECT 
  pm.page_id,
  pm.page_type,
  pm.page_slug,
  pm.purchase_intent,
  pm.layer,
  pm.status,
  uc.use_case_type,
  uc.is_published
FROM page_meta pm
INNER JOIN use_cases uc ON pm.page_id = uc.id
WHERE uc.slug = 'test-auto-sync-simple';

-- 预期结果：
-- purchase_intent = 3
-- layer = 'conversion'
-- status = 'published'

-- ============================================
-- 测试 2：更新 use_case_type（应该自动更新 page_meta）
-- ============================================

-- 更新 use_case_type
UPDATE use_cases 
SET use_case_type = 'education-explainer'
WHERE slug = 'test-auto-sync-simple';

-- 检查 page_meta 是否自动更新
SELECT 
  pm.purchase_intent,
  pm.layer,
  uc.use_case_type
FROM page_meta pm
INNER JOIN use_cases uc ON pm.page_id = uc.id
WHERE uc.slug = 'test-auto-sync-simple';

-- 预期结果：
-- purchase_intent = 2 (从 3 变成 2)
-- layer = 'conversion' (保持不变)

-- ============================================
-- 清理测试数据（可选）
-- ============================================

-- 删除测试记录
-- DELETE FROM use_cases WHERE slug = 'test-auto-sync-simple';

