-- ============================================
-- 为缺失的 use_cases 创建 page_meta 记录（分批处理）
-- ============================================
-- 如果一次性插入 8,180 条记录可能超时，使用分批处理
-- ============================================

-- ============================================
-- 方案 1：手动分批（推荐，最安全）
-- ============================================
-- 每次执行插入 2,000 条，重复执行直到 missing = 0
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
  CASE
    WHEN uc.use_case_type IN ('product-demo-showcase', 'advertising-promotion') THEN 3
    WHEN uc.use_case_type IN ('education-explainer', 'ugc-creator-content') THEN 2
    WHEN uc.use_case_type = 'brand-storytelling' THEN 1
    WHEN uc.use_case_type = 'social-media-content' THEN 0
    ELSE 0
  END as purchase_intent,
  CASE
    WHEN uc.use_case_type IN ('product-demo-showcase', 'advertising-promotion') THEN 'conversion'
    WHEN uc.use_case_type IN ('education-explainer', 'ugc-creator-content') THEN 'conversion'
    ELSE 'asset'
  END as layer,
  CASE 
    WHEN uc.is_published = TRUE THEN 'published'
    ELSE 'draft'
  END as status,
  0 as geo_score,
  'G-None' as geo_level
FROM use_cases uc
LEFT JOIN page_meta pm ON pm.page_id = uc.id AND pm.page_type = 'use_case'
WHERE pm.page_id IS NULL
LIMIT 2000  -- 每次处理 2,000 条
ON CONFLICT (page_type, page_id) DO NOTHING;

-- ============================================
-- 执行后检查进度
-- ============================================

SELECT 
  COUNT(DISTINCT uc.id) as total_use_cases,
  COUNT(DISTINCT pm.page_id) as total_page_meta,
  COUNT(DISTINCT uc.id) - COUNT(DISTINCT pm.page_id) as missing_page_meta
FROM use_cases uc
LEFT JOIN page_meta pm ON pm.page_id = uc.id AND pm.page_type = 'use_case';

-- 如果 missing_page_meta > 0，重复执行上面的 INSERT 语句
-- 预计需要执行 5 次（8,180 / 2,000 ≈ 5）

-- ============================================
-- 方案 2：自动化分批（如果方案 1 太慢）
-- ============================================
-- 使用 DO 块自动循环，但可能超时
-- ============================================

DO $$
DECLARE
  v_batch_size INTEGER := 2000;
  v_processed INTEGER;
  v_total_missing INTEGER;
BEGIN
  LOOP
    -- 插入一批记录
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
      CASE
        WHEN uc.use_case_type IN ('product-demo-showcase', 'advertising-promotion') THEN 3
        WHEN uc.use_case_type IN ('education-explainer', 'ugc-creator-content') THEN 2
        WHEN uc.use_case_type = 'brand-storytelling' THEN 1
        WHEN uc.use_case_type = 'social-media-content' THEN 0
        ELSE 0
      END as purchase_intent,
      CASE
        WHEN uc.use_case_type IN ('product-demo-showcase', 'advertising-promotion') THEN 'conversion'
        WHEN uc.use_case_type IN ('education-explainer', 'ugc-creator-content') THEN 'conversion'
        ELSE 'asset'
      END as layer,
      CASE 
        WHEN uc.is_published = TRUE THEN 'published'
        ELSE 'draft'
      END as status,
      0 as geo_score,
      'G-None' as geo_level
    FROM use_cases uc
    LEFT JOIN page_meta pm ON pm.page_id = uc.id AND pm.page_type = 'use_case'
    WHERE pm.page_id IS NULL
    LIMIT v_batch_size
    ON CONFLICT (page_type, page_id) DO NOTHING;
    
    GET DIAGNOSTICS v_processed = ROW_COUNT;
    
    -- 检查是否还有缺失的记录
    SELECT COUNT(*)
    INTO v_total_missing
    FROM use_cases uc
    LEFT JOIN page_meta pm ON pm.page_id = uc.id AND pm.page_type = 'use_case'
    WHERE pm.page_id IS NULL;
    
    -- 如果没有处理任何记录，或者没有缺失记录了，退出循环
    EXIT WHEN v_processed = 0 OR v_total_missing = 0;
    
    -- 延迟 1 秒，避免数据库压力过大
    PERFORM pg_sleep(1);
  END LOOP;
END $$;

-- ============================================
-- 最终验证
-- ============================================

SELECT 
  COUNT(DISTINCT uc.id) as total_use_cases,
  COUNT(DISTINCT pm.page_id) as total_page_meta,
  COUNT(DISTINCT uc.id) - COUNT(DISTINCT pm.page_id) as missing_page_meta
FROM use_cases uc
LEFT JOIN page_meta pm ON pm.page_id = uc.id AND pm.page_type = 'use_case';

