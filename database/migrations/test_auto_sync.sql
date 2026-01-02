-- ============================================
-- 测试自动同步功能
-- ============================================
-- 验证触发器是否正常工作
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
  'test-auto-sync-demo',
  'Test Product Demo Showcase',
  'Test Product Demo Showcase',
  'This is a test description for auto-sync testing.',
  'This is test content for auto-sync testing.'
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
WHERE uc.slug = 'test-auto-sync-demo';

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
WHERE slug = 'test-auto-sync-demo';

-- 检查 page_meta 是否自动更新
SELECT 
  pm.purchase_intent,
  pm.layer,
  uc.use_case_type
FROM page_meta pm
INNER JOIN use_cases uc ON pm.page_id = uc.id
WHERE uc.slug = 'test-auto-sync-demo';

-- 预期结果：
-- purchase_intent = 2 (从 3 变成 2)
-- layer = 'conversion' (保持不变)

-- ============================================
-- 测试 3：更新 is_published（应该自动更新 status）
-- ============================================

-- 更新 is_published
UPDATE use_cases 
SET is_published = false
WHERE slug = 'test-auto-sync-demo';

-- 检查 page_meta 是否自动更新
SELECT 
  pm.status,
  uc.is_published
FROM page_meta pm
INNER JOIN use_cases uc ON pm.page_id = uc.id
WHERE uc.slug = 'test-auto-sync-demo';

-- 预期结果：
-- status = 'draft' (从 'published' 变成 'draft')

-- ============================================
-- 测试 4：清理测试数据（可选）
-- ============================================

-- 删除测试记录
-- DELETE FROM use_cases WHERE slug = 'test-auto-sync-demo';
-- (page_meta 应该通过外键约束自动删除，或者需要手动删除)

-- ============================================
-- 测试 5：批量测试不同 use_case_type
-- ============================================

-- 测试不同类型的 use_case（包含所有必需字段）
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
VALUES 
  (gen_random_uuid(), 'product-demo-showcase', true, 'test-type-3', 'Test Type 3', 'Test Type 3', 'Test description', 'Test content'),
  (gen_random_uuid(), 'education-explainer', true, 'test-type-2', 'Test Type 2', 'Test Type 2', 'Test description', 'Test content'),
  (gen_random_uuid(), 'brand-storytelling', true, 'test-type-1', 'Test Type 1', 'Test Type 1', 'Test description', 'Test content'),
  (gen_random_uuid(), 'social-media-content', true, 'test-type-0', 'Test Type 0', 'Test Type 0', 'Test description', 'Test content');

-- 检查所有测试记录的 page_meta
SELECT 
  uc.slug,
  uc.use_case_type,
  pm.purchase_intent,
  pm.layer,
  pm.status
FROM use_cases uc
LEFT JOIN page_meta pm ON pm.page_id = uc.id AND pm.page_type = 'use_case'
WHERE uc.slug LIKE 'test-type-%'
ORDER BY pm.purchase_intent DESC;

-- 预期结果：
-- test-type-3: purchase_intent = 3, layer = 'conversion'
-- test-type-2: purchase_intent = 2, layer = 'conversion'
-- test-type-1: purchase_intent = 1, layer = 'asset'
-- test-type-0: purchase_intent = 0, layer = 'asset'

-- ============================================
-- 验证：检查触发器是否正常工作
-- ============================================

-- 统计：有多少 use_cases 有对应的 page_meta
SELECT 
  COUNT(DISTINCT uc.id) as total_use_cases,
  COUNT(DISTINCT pm.page_id) as total_page_meta,
  COUNT(DISTINCT uc.id) - COUNT(DISTINCT pm.page_id) as missing_page_meta
FROM use_cases uc
LEFT JOIN page_meta pm ON pm.page_id = uc.id AND pm.page_type = 'use_case';

-- 如果 missing_page_meta > 0，说明有些记录没有自动同步
-- 可能原因：
-- 1. 触发器未正确创建
-- 2. 这些记录是在创建触发器之前插入的

