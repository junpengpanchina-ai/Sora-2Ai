-- ============================================
-- 创建批量更新 Purchase Intent 的存储过程
-- ============================================
-- 说明：创建后可以通过 RPC 调用，或通过 TypeScript 脚本调用
-- ============================================

CREATE OR REPLACE FUNCTION batch_update_purchase_intent_single(
  p_batch_size INTEGER DEFAULT 1000
)
RETURNS INTEGER AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  WITH batch AS (
    SELECT pm.page_id
    FROM page_meta pm
    WHERE pm.page_type = 'use_case'
      AND pm.status = 'published'
      AND pm.purchase_intent = 0
    LIMIT p_batch_size
  ),
  updates AS (
    SELECT 
      b.page_id,
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
      END as layer
    FROM batch b
    INNER JOIN use_cases uc ON b.page_id = uc.id
  )
  UPDATE page_meta pm
  SET 
    purchase_intent = u.purchase_intent,
    layer = u.layer
  FROM updates u
  WHERE pm.page_id = u.page_id;
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$$ LANGUAGE plpgsql;

-- 使用方式：
-- SELECT batch_update_purchase_intent_single(1000);
-- 重复执行直到返回 0

