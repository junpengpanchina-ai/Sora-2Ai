-- ============================================
-- 优化的批量更新 Purchase Intent 存储过程
-- ============================================
-- 优化：使用子查询而不是 JOIN，避免超时
-- ============================================

CREATE OR REPLACE FUNCTION batch_update_purchase_intent_single(
  p_batch_size INTEGER DEFAULT 1000
)
RETURNS INTEGER AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  -- 直接更新，使用子查询避免 JOIN 性能问题
  UPDATE page_meta pm
  SET 
    purchase_intent = (
      SELECT CASE
        WHEN uc.use_case_type IN ('product-demo-showcase', 'advertising-promotion') THEN 3
        WHEN uc.use_case_type IN ('education-explainer', 'ugc-creator-content') THEN 2
        WHEN uc.use_case_type = 'brand-storytelling' THEN 1
        WHEN uc.use_case_type = 'social-media-content' THEN 0
        ELSE 0
      END
      FROM use_cases uc
      WHERE uc.id = pm.page_id
      LIMIT 1
    ),
    layer = (
      SELECT CASE
        WHEN uc.use_case_type IN ('product-demo-showcase', 'advertising-promotion') THEN 'conversion'
        WHEN uc.use_case_type IN ('education-explainer', 'ugc-creator-content') THEN 'conversion'
        ELSE 'asset'
      END
      FROM use_cases uc
      WHERE uc.id = pm.page_id
      LIMIT 1
    )
  WHERE pm.page_type = 'use_case'
    AND pm.status = 'published'
    AND pm.purchase_intent = 0
    AND pm.page_id IN (
      SELECT page_id
      FROM page_meta
      WHERE page_type = 'use_case'
        AND status = 'published'
        AND purchase_intent = 0
      LIMIT p_batch_size
    );
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$$ LANGUAGE plpgsql;

-- 测试
-- SELECT batch_update_purchase_intent_single(1000);

