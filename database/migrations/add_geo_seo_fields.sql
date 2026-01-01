-- ============================================
-- GEO & SEO 运营字段增量迁移
-- ============================================
-- 说明：不推翻现有表，只增量加字段
-- 适用表：use_cases, long_tail_keywords
-- ============================================

-- ============================================
-- 1. 新增表：Index Health 日报快照
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
-- 2. 新增表：页面优先队列表（高转化挑选输出）
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
-- 3. 给 use_cases 表加字段（增量）
-- ============================================
ALTER TABLE use_cases
  -- 内容与结构
  ADD COLUMN IF NOT EXISTS page_type TEXT DEFAULT 'use_case',
  ADD COLUMN IF NOT EXISTS variant_id TEXT,
  ADD COLUMN IF NOT EXISTS geo_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS geo_level TEXT DEFAULT 'G-None',
  ADD COLUMN IF NOT EXISTS purchase_intent SMALLINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS trend_pressure SMALLINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS layer TEXT DEFAULT 'asset',
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft',

  -- 转化模块
  ADD COLUMN IF NOT EXISTS prompt_preview_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS prompt_preview_text TEXT,
  ADD COLUMN IF NOT EXISTS cta_variant TEXT DEFAULT 'continue',
  ADD COLUMN IF NOT EXISTS paywall_variant TEXT DEFAULT 'export_lock',

  -- 索引/发布节奏
  ADD COLUMN IF NOT EXISTS publish_batch INTEGER,
  ADD COLUMN IF NOT EXISTS publish_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS index_state TEXT DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS last_index_check_at TIMESTAMPTZ,

  -- 质量/同构风险
  ADD COLUMN IF NOT EXISTS dup_hash TEXT,
  ADD COLUMN IF NOT EXISTS dup_cluster INTEGER,
  ADD COLUMN IF NOT EXISTS content_len INTEGER,
  ADD COLUMN IF NOT EXISTS last_generated_at TIMESTAMPTZ;

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_use_cases_geo_level ON use_cases(geo_level);
CREATE INDEX IF NOT EXISTS idx_use_cases_purchase_intent ON use_cases(purchase_intent);
CREATE INDEX IF NOT EXISTS idx_use_cases_layer ON use_cases(layer);
CREATE INDEX IF NOT EXISTS idx_use_cases_status ON use_cases(status);
CREATE INDEX IF NOT EXISTS idx_use_cases_dup_cluster ON use_cases(dup_cluster);
CREATE INDEX IF NOT EXISTS idx_use_cases_publish_date ON use_cases(publish_date);

-- ============================================
-- 4. 给 long_tail_keywords 表加字段（增量）
-- ============================================
ALTER TABLE long_tail_keywords
  -- 内容与结构
  ADD COLUMN IF NOT EXISTS page_type TEXT DEFAULT 'keyword',
  ADD COLUMN IF NOT EXISTS variant_id TEXT,
  ADD COLUMN IF NOT EXISTS geo_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS geo_level TEXT DEFAULT 'G-None',
  ADD COLUMN IF NOT EXISTS purchase_intent SMALLINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS trend_pressure SMALLINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS layer TEXT DEFAULT 'asset',
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft',

  -- 转化模块
  ADD COLUMN IF NOT EXISTS prompt_preview_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS prompt_preview_text TEXT,
  ADD COLUMN IF NOT EXISTS cta_variant TEXT DEFAULT 'continue',
  ADD COLUMN IF NOT EXISTS paywall_variant TEXT DEFAULT 'export_lock',

  -- 索引/发布节奏
  ADD COLUMN IF NOT EXISTS publish_batch INTEGER,
  ADD COLUMN IF NOT EXISTS publish_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS index_state TEXT DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS last_index_check_at TIMESTAMPTZ,

  -- 质量/同构风险
  ADD COLUMN IF NOT EXISTS dup_hash TEXT,
  ADD COLUMN IF NOT EXISTS dup_cluster INTEGER,
  ADD COLUMN IF NOT EXISTS content_len INTEGER,
  ADD COLUMN IF NOT EXISTS last_generated_at TIMESTAMPTZ;

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_keywords_geo_level ON long_tail_keywords(geo_level);
CREATE INDEX IF NOT EXISTS idx_keywords_purchase_intent ON long_tail_keywords(purchase_intent);
CREATE INDEX IF NOT EXISTS idx_keywords_layer ON long_tail_keywords(layer);
CREATE INDEX IF NOT EXISTS idx_keywords_status ON long_tail_keywords(status);
CREATE INDEX IF NOT EXISTS idx_keywords_dup_cluster ON long_tail_keywords(dup_cluster);
CREATE INDEX IF NOT EXISTS idx_keywords_publish_date ON long_tail_keywords(publish_date);

-- ============================================
-- 5. 创建视图：统一页面主表视图（可选）
-- ============================================
CREATE OR REPLACE VIEW unified_pages AS
SELECT 
  'use_case' AS page_type,
  id::TEXT AS page_id,
  page_type AS original_page_type,
  variant_id,
  geo_score,
  geo_level,
  purchase_intent,
  trend_pressure,
  layer,
  status,
  prompt_preview_enabled,
  prompt_preview_text,
  cta_variant,
  paywall_variant,
  publish_batch,
  publish_date,
  index_state,
  last_index_check_at,
  dup_hash,
  dup_cluster,
  content_len,
  last_generated_at
FROM use_cases
WHERE status = 'published'

UNION ALL

SELECT 
  'keyword' AS page_type,
  id::TEXT AS page_id,
  page_type AS original_page_type,
  variant_id,
  geo_score,
  geo_level,
  purchase_intent,
  trend_pressure,
  layer,
  status,
  prompt_preview_enabled,
  prompt_preview_text,
  cta_variant,
  paywall_variant,
  publish_batch,
  publish_date,
  index_state,
  last_index_check_at,
  dup_hash,
  dup_cluster,
  content_len,
  last_generated_at
FROM long_tail_keywords
WHERE status = 'published';

-- ============================================
-- 6. 创建函数：计算 Index Health
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
-- 7. 创建函数：获取当天 Index Health
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

