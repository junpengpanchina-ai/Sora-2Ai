-- ============================================
-- GEO & SEO 运营字段（方案 A：page_meta 表）
-- ============================================
-- 说明：不修改原表，所有运营字段统一在 page_meta
-- 优点：零风险、上线快、以后迁移也轻松
-- ============================================

-- ============================================
-- 1. 统一页面运营元数据表（不动原表）
-- ============================================
CREATE TABLE IF NOT EXISTS page_meta (
  page_type TEXT NOT NULL,              -- use_case / keyword / industry / core_sample
  page_id UUID NOT NULL,                -- 对应原表主键
  page_slug TEXT,                       -- 可选：方便查询

  -- GEO / 结构
  variant_id TEXT,
  geo_score INTEGER NOT NULL DEFAULT 0,
  geo_level TEXT NOT NULL DEFAULT 'G-None',

  -- 商业转化
  purchase_intent SMALLINT NOT NULL DEFAULT 0,   -- 0-3
  trend_pressure SMALLINT NOT NULL DEFAULT 0,    -- 0-4
  layer TEXT NOT NULL DEFAULT 'asset',           -- asset / conversion / core_sample

  -- 转化模块
  prompt_preview_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  prompt_preview_text TEXT,
  cta_variant TEXT NOT NULL DEFAULT 'continue',
  paywall_variant TEXT NOT NULL DEFAULT 'export_lock',

  -- 发布与索引
  status TEXT NOT NULL DEFAULT 'draft',          -- draft / published / paused
  publish_batch INTEGER,
  publish_date TIMESTAMPTZ,
  index_state TEXT NOT NULL DEFAULT 'unknown',   -- unknown / discovered / crawled / indexed / excluded
  last_index_check_at TIMESTAMPTZ,

  -- 同构/质量
  dup_hash TEXT,
  dup_cluster INTEGER,
  content_len INTEGER,
  last_generated_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (page_type, page_id)
);

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_page_meta_layer ON page_meta(layer);
CREATE INDEX IF NOT EXISTS idx_page_meta_status ON page_meta(status);
CREATE INDEX IF NOT EXISTS idx_page_meta_geo ON page_meta(geo_score DESC);
CREATE INDEX IF NOT EXISTS idx_page_meta_intent ON page_meta(purchase_intent DESC);
CREATE INDEX IF NOT EXISTS idx_page_meta_publish ON page_meta(publish_date DESC);
CREATE INDEX IF NOT EXISTS idx_page_meta_dup_cluster ON page_meta(dup_cluster);
CREATE INDEX IF NOT EXISTS idx_page_meta_page_slug ON page_meta(page_slug);

-- ============================================
-- 2. 新增表：Index Health 日报快照
-- ============================================
CREATE TABLE IF NOT EXISTS index_health_daily (
  day DATE PRIMARY KEY,
  discovered INTEGER NOT NULL DEFAULT 0,
  crawled INTEGER NOT NULL DEFAULT 0,
  indexed INTEGER NOT NULL DEFAULT 0,
  crawl_requests_per_day INTEGER,
  sitemap_last_read_at TIMESTAMPTZ,
  sitemap_success BOOLEAN,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_index_health_daily_day ON index_health_daily(day DESC);

-- ============================================
-- 3. 新增表：页面优先队列表（高转化挑选输出）
-- ============================================
CREATE TABLE IF NOT EXISTS page_priority_queue (
  id BIGSERIAL PRIMARY KEY,
  run_id UUID NOT NULL,
  page_type TEXT NOT NULL,           -- use_case / keyword / industry / core_sample
  page_id UUID NOT NULL,
  score_total NUMERIC(6,2) NOT NULL,
  score_geo NUMERIC(6,2) NOT NULL,
  score_intent NUMERIC(6,2) NOT NULL,
  score_index NUMERIC(6,2) NOT NULL,
  score_risk NUMERIC(6,2) NOT NULL,
  reason JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_priority_queue_run ON page_priority_queue(run_id);
CREATE INDEX IF NOT EXISTS idx_priority_queue_score ON page_priority_queue(score_total DESC);
CREATE INDEX IF NOT EXISTS idx_priority_queue_page ON page_priority_queue(page_type, page_id);

-- ============================================
-- 4. 创建视图：统一页面视图（关联原表 + page_meta）
-- ============================================
-- 注意：这里需要根据你的实际表名调整
-- 示例假设表名为 use_cases 和 long_tail_keywords

CREATE OR REPLACE VIEW unified_pages AS
SELECT 
  pm.page_type,
  pm.page_id,
  pm.page_slug,
  pm.variant_id,
  pm.geo_score,
  pm.geo_level,
  pm.purchase_intent,
  pm.trend_pressure,
  pm.layer,
  pm.status,
  pm.prompt_preview_enabled,
  pm.prompt_preview_text,
  pm.cta_variant,
  pm.paywall_variant,
  pm.publish_batch,
  pm.publish_date,
  pm.index_state,
  pm.last_index_check_at,
  pm.dup_hash,
  pm.dup_cluster,
  pm.content_len,
  pm.last_generated_at,
  pm.created_at,
  pm.updated_at
FROM page_meta pm
WHERE pm.status = 'published';

-- ============================================
-- 5. 创建函数：计算 Index Health
-- ============================================
CREATE OR REPLACE FUNCTION calculate_index_health(
  p_discovered INTEGER,
  p_crawled INTEGER,
  p_indexed INTEGER
) RETURNS NUMERIC(5,2) AS $$
BEGIN
  IF (p_discovered + p_crawled) = 0 THEN
    RETURN 0;
  END IF;
  RETURN ROUND((p_indexed::NUMERIC / (p_discovered + p_crawled)::NUMERIC) * 100, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- 6. 创建函数：获取当天 Index Health
-- ============================================
CREATE OR REPLACE FUNCTION get_current_index_health()
RETURNS NUMERIC(5,2) AS $$
DECLARE
  v_record RECORD;
BEGIN
  SELECT * INTO v_record
  FROM index_health_daily
  ORDER BY day DESC
  LIMIT 1;
  
  IF v_record IS NULL THEN
    RETURN NULL;
  END IF;
  
  RETURN calculate_index_health(
    v_record.discovered,
    v_record.crawled,
    v_record.indexed
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. 创建触发器：自动更新 updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_page_meta_updated_at
  BEFORE UPDATE ON page_meta
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. 创建函数：获取或创建 page_meta（方便使用）
-- ============================================
CREATE OR REPLACE FUNCTION get_or_create_page_meta(
  p_page_type TEXT,
  p_page_id UUID,
  p_page_slug TEXT DEFAULT NULL
)
RETURNS TABLE (
  page_type TEXT,
  page_id UUID,
  page_slug TEXT,
  geo_score INTEGER,
  geo_level TEXT,
  purchase_intent SMALLINT,
  layer TEXT,
  status TEXT
) AS $$
BEGIN
  -- 如果不存在，创建默认记录
  INSERT INTO page_meta (page_type, page_id, page_slug)
  VALUES (p_page_type, p_page_id, p_page_slug)
  ON CONFLICT (page_type, page_id) DO NOTHING;
  
  -- 返回记录
  RETURN QUERY
  SELECT 
    pm.page_type,
    pm.page_id,
    pm.page_slug,
    pm.geo_score,
    pm.geo_level,
    pm.purchase_intent,
    pm.layer,
    pm.status
  FROM page_meta pm
  WHERE pm.page_type = p_page_type AND pm.page_id = p_page_id;
END;
$$ LANGUAGE plpgsql;

