-- ============================================
-- 为缺失的 use_cases 创建 page_meta 记录
-- ============================================
-- 目标：为所有没有 page_meta 的 use_cases 创建记录
-- ============================================

-- ============================================
-- 步骤 1：检查缺失记录数量
-- ============================================

SELECT 
  COUNT(DISTINCT uc.id) as total_use_cases,
  COUNT(DISTINCT pm.page_id) as total_page_meta,
  COUNT(DISTINCT uc.id) - COUNT(DISTINCT pm.page_id) as missing_page_meta
FROM use_cases uc
LEFT JOIN page_meta pm ON pm.page_id = uc.id AND pm.page_type = 'use_case';

-- ============================================
-- 步骤 2：为缺失的记录创建 page_meta（批量插入）
-- ============================================
-- 使用 INSERT ... ON CONFLICT DO NOTHING 避免重复
-- ============================================

INSERT INTO page_meta (
  page_type,
  page_id,
  page_slug,
  purchase_intent,
  layer,
  status,
  geo_score,
  geo_level
)
SELECT 
  'use_case' as page_type,
  uc.id as page_id,
  uc.slug as page_slug,
  -- 计算 purchase_intent
  CASE
    WHEN uc.use_case_type IN ('product-demo-showcase', 'advertising-promotion') THEN 3
    WHEN uc.use_case_type IN ('education-explainer', 'ugc-creator-content') THEN 2
    WHEN uc.use_case_type = 'brand-storytelling' THEN 1
    WHEN uc.use_case_type = 'social-media-content' THEN 0
    ELSE 0
  END as purchase_intent,
  -- 计算 layer
  CASE
    WHEN uc.use_case_type IN ('product-demo-showcase', 'advertising-promotion') THEN 'conversion'
    WHEN uc.use_case_type IN ('education-explainer', 'ugc-creator-content') THEN 'conversion'
    ELSE 'asset'
  END as layer,
  -- 设置 status
  CASE 
    WHEN uc.is_published = TRUE THEN 'published'
    ELSE 'draft'
  END as status,
  0 as geo_score,
  'G-None' as geo_level
FROM use_cases uc
LEFT JOIN page_meta pm ON pm.page_id = uc.id AND pm.page_type = 'use_case'
WHERE pm.page_id IS NULL  -- 只处理没有 page_meta 的记录
ON CONFLICT (page_type, page_id) DO NOTHING;

-- ============================================
-- 步骤 3：验证结果
-- ============================================

SELECT 
  COUNT(DISTINCT uc.id) as total_use_cases,
  COUNT(DISTINCT pm.page_id) as total_page_meta,
  COUNT(DISTINCT uc.id) - COUNT(DISTINCT pm.page_id) as missing_page_meta
FROM use_cases uc
LEFT JOIN page_meta pm ON pm.page_id = uc.id AND pm.page_type = 'use_case';

-- 如果 missing_page_meta = 0，说明所有记录都已同步

-- ============================================
-- 步骤 4：查看新创建的记录统计
-- ============================================

SELECT 
  purchase_intent,
  layer,
  status,
  COUNT(*) as count
FROM page_meta
WHERE page_type = 'use_case'
  AND created_at >= NOW() - INTERVAL '1 hour'  -- 最近 1 小时创建的
GROUP BY purchase_intent, layer, status
ORDER BY purchase_intent DESC, layer, status;

