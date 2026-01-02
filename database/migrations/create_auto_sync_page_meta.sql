-- ============================================
-- 自动同步 page_meta（新增 use_cases 时）
-- ============================================
-- 功能：当新增或更新 use_cases 时，自动创建/更新对应的 page_meta 记录
-- ============================================

-- ============================================
-- 方案 1：使用触发器（推荐，自动同步）
-- ============================================

-- 创建函数：计算 Purchase Intent
CREATE OR REPLACE FUNCTION calculate_purchase_intent(use_case_type TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN CASE
    WHEN use_case_type IN ('product-demo-showcase', 'advertising-promotion') THEN 3
    WHEN use_case_type IN ('education-explainer', 'ugc-creator-content') THEN 2
    WHEN use_case_type = 'brand-storytelling' THEN 1
    WHEN use_case_type = 'social-media-content' THEN 0
    ELSE 0
  END;
END;
$$ LANGUAGE plpgsql;

-- 创建函数：计算 Layer
CREATE OR REPLACE FUNCTION calculate_layer(use_case_type TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE
    WHEN use_case_type IN ('product-demo-showcase', 'advertising-promotion') THEN 'conversion'
    WHEN use_case_type IN ('education-explainer', 'ugc-creator-content') THEN 'conversion'
    ELSE 'asset'
  END;
END;
$$ LANGUAGE plpgsql;

-- 创建函数：自动同步 page_meta
CREATE OR REPLACE FUNCTION sync_page_meta_from_use_case()
RETURNS TRIGGER AS $$
DECLARE
  v_purchase_intent INTEGER;
  v_layer TEXT;
BEGIN
  -- 计算 purchase_intent 和 layer
  v_purchase_intent := calculate_purchase_intent(NEW.use_case_type);
  v_layer := calculate_layer(NEW.use_case_type);

  -- 插入或更新 page_meta
  INSERT INTO page_meta (
    page_type,
    page_id,
    page_slug,
    purchase_intent,
    layer,
    status,
    geo_score,
    geo_level
  ) VALUES (
    'use_case',
    NEW.id,
    NEW.page_slug,
    v_purchase_intent,
    v_layer,
    CASE WHEN NEW.is_published THEN 'published' ELSE 'draft' END,
    0,  -- 默认 geo_score
    'G-None'  -- 默认 geo_level
  )
  ON CONFLICT (page_type, page_id) 
  DO UPDATE SET
    page_slug = EXCLUDED.page_slug,
    purchase_intent = EXCLUDED.purchase_intent,
    layer = EXCLUDED.layer,
    status = EXCLUDED.status,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器：在 use_cases 插入时自动同步
DROP TRIGGER IF EXISTS trigger_sync_page_meta_on_insert ON use_cases;
CREATE TRIGGER trigger_sync_page_meta_on_insert
  AFTER INSERT ON use_cases
  FOR EACH ROW
  EXECUTE FUNCTION sync_page_meta_from_use_case();

-- 创建触发器：在 use_cases 更新时自动同步
DROP TRIGGER IF EXISTS trigger_sync_page_meta_on_update ON use_cases;
CREATE TRIGGER trigger_sync_page_meta_on_update
  AFTER UPDATE OF use_case_type, is_published, page_slug ON use_cases
  FOR EACH ROW
  WHEN (OLD.use_case_type IS DISTINCT FROM NEW.use_case_type 
     OR OLD.is_published IS DISTINCT FROM NEW.is_published
     OR OLD.page_slug IS DISTINCT FROM NEW.page_slug)
  EXECUTE FUNCTION sync_page_meta_from_use_case();

-- ============================================
-- 方案 2：手动同步函数（可选，用于批量同步）
-- ============================================

-- 创建函数：手动同步单个 use_case
CREATE OR REPLACE FUNCTION sync_single_page_meta(p_use_case_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_use_case_type TEXT;
  v_is_published BOOLEAN;
  v_page_slug TEXT;
  v_purchase_intent INTEGER;
  v_layer TEXT;
BEGIN
  -- 获取 use_case 信息
  SELECT use_case_type, is_published, page_slug
  INTO v_use_case_type, v_is_published, v_page_slug
  FROM use_cases
  WHERE id = p_use_case_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- 计算 purchase_intent 和 layer
  v_purchase_intent := calculate_purchase_intent(v_use_case_type);
  v_layer := calculate_layer(v_use_case_type);

  -- 插入或更新 page_meta
  INSERT INTO page_meta (
    page_type,
    page_id,
    page_slug,
    purchase_intent,
    layer,
    status,
    geo_score,
    geo_level
  ) VALUES (
    'use_case',
    p_use_case_id,
    v_page_slug,
    v_purchase_intent,
    v_layer,
    CASE WHEN v_is_published THEN 'published' ELSE 'draft' END,
    0,
    'G-None'
  )
  ON CONFLICT (page_type, page_id) 
  DO UPDATE SET
    page_slug = EXCLUDED.page_slug,
    purchase_intent = EXCLUDED.purchase_intent,
    layer = EXCLUDED.layer,
    status = EXCLUDED.status,
    updated_at = NOW();

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 创建函数：批量同步所有 use_cases
CREATE OR REPLACE FUNCTION sync_all_page_meta_from_use_cases()
RETURNS TABLE (
  synced_count INTEGER,
  updated_count INTEGER
) AS $$
DECLARE
  v_synced INTEGER := 0;
  v_updated INTEGER := 0;
  v_record RECORD;
BEGIN
  FOR v_record IN 
    SELECT id, use_case_type, is_published, page_slug
    FROM use_cases
  LOOP
    -- 使用 INSERT ... ON CONFLICT 自动处理
    INSERT INTO page_meta (
      page_type,
      page_id,
      page_slug,
      purchase_intent,
      layer,
      status,
      geo_score,
      geo_level
    ) VALUES (
      'use_case',
      v_record.id,
      v_record.page_slug,
      calculate_purchase_intent(v_record.use_case_type),
      calculate_layer(v_record.use_case_type),
      CASE WHEN v_record.is_published THEN 'published' ELSE 'draft' END,
      0,
      'G-None'
    )
    ON CONFLICT (page_type, page_id) 
    DO UPDATE SET
      page_slug = EXCLUDED.page_slug,
      purchase_intent = EXCLUDED.purchase_intent,
      layer = EXCLUDED.layer,
      status = EXCLUDED.status,
      updated_at = NOW();

    IF FOUND THEN
      v_synced := v_synced + 1;
    END IF;
  END LOOP;

  RETURN QUERY SELECT v_synced, v_updated;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 测试触发器
-- ============================================

-- 测试：插入一个新的 use_case（触发器会自动创建 page_meta）
-- INSERT INTO use_cases (id, use_case_type, is_published, page_slug)
-- VALUES (gen_random_uuid(), 'product-demo-showcase', true, 'test-slug');

-- 检查是否自动创建了 page_meta
-- SELECT * FROM page_meta WHERE page_id = '上面插入的 id';

-- ============================================
-- 验证触发器是否创建成功
-- ============================================

SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name LIKE '%sync_page_meta%'
ORDER BY trigger_name;

