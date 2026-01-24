-- ============================================================================
-- SEO Daily Metrics Schema
-- Version: 1.0
-- Date: 2026-01-24
-- Purpose: Index Health Dashboard & Scaling Gate data foundation
-- ============================================================================

-- ============================================================================
-- A) seo_daily_metrics (每日事实表)
-- ============================================================================

CREATE TABLE IF NOT EXISTS seo_daily_metrics (
  date DATE PRIMARY KEY,
  
  -- Sitemap stats
  sitemap_tier1_urls INT DEFAULT 0,        -- tier1-0 URL count (should be ~1000)
  sitemap_core_urls INT DEFAULT 0,         -- sitemap-core URL count
  sitemap_tier2_urls INT DEFAULT 0,        -- tier2 total URL count
  
  -- GSC Pages report
  gsc_discovered_urls INT DEFAULT 0,       -- Pages: Discovered
  gsc_indexed_urls INT DEFAULT 0,          -- Pages: Indexed
  gsc_crawled_not_indexed_urls INT DEFAULT 0, -- Pages: Crawled - not indexed
  gsc_excluded_urls INT DEFAULT 0,         -- Pages: Excluded (total)
  gsc_duplicate_urls INT DEFAULT 0,        -- Pages: Duplicate without canonical
  gsc_soft_404_urls INT DEFAULT 0,         -- Pages: Soft 404
  
  -- GSC Crawl stats
  crawl_requests INT DEFAULT 0,            -- Crawl stats: total requests
  crawl_bytes BIGINT DEFAULT 0,            -- Crawl stats: total bytes
  crawl_avg_response_ms INT DEFAULT 0,     -- Crawl stats: avg response time
  
  -- Flags
  systemic_errors_flag BOOLEAN DEFAULT FALSE, -- Any systemic errors (5xx/canonical/robots)
  
  -- Metadata
  notes TEXT,                              -- Manual notes
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for date range queries
CREATE INDEX IF NOT EXISTS idx_seo_daily_metrics_date ON seo_daily_metrics(date DESC);

-- ============================================================================
-- B) v_index_health (计算视图)
-- ============================================================================

CREATE OR REPLACE VIEW v_index_health AS
SELECT
  m.date,
  
  -- Raw counts
  m.gsc_discovered_urls,
  m.gsc_indexed_urls,
  m.gsc_crawled_not_indexed_urls,
  m.crawl_requests,
  
  -- Index Rate (core metric)
  ROUND(
    m.gsc_indexed_urls::NUMERIC / NULLIF(m.gsc_discovered_urls, 0),
    4
  ) AS index_rate,
  
  -- CNI Rate (Crawled Not Indexed rate)
  ROUND(
    m.gsc_crawled_not_indexed_urls::NUMERIC / NULLIF(m.gsc_discovered_urls, 0),
    4
  ) AS cni_rate,
  
  -- Duplicate Rate
  ROUND(
    m.gsc_duplicate_urls::NUMERIC / NULLIF(m.gsc_indexed_urls, 0),
    4
  ) AS duplicate_rate,
  
  -- Daily deltas (vs previous day)
  m.gsc_discovered_urls - LAG(m.gsc_discovered_urls) OVER (ORDER BY m.date) AS discover_delta_1d,
  m.gsc_indexed_urls - LAG(m.gsc_indexed_urls) OVER (ORDER BY m.date) AS index_delta_1d,
  m.crawl_requests - LAG(m.crawl_requests) OVER (ORDER BY m.date) AS crawl_delta_1d,
  
  -- 7-day moving averages
  ROUND(
    AVG(m.gsc_indexed_urls::NUMERIC / NULLIF(m.gsc_discovered_urls, 0)) 
    OVER (ORDER BY m.date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW),
    4
  ) AS index_rate_7d_ma,
  
  -- Gate state classification
  CASE
    WHEN m.gsc_indexed_urls::NUMERIC / NULLIF(m.gsc_discovered_urls, 0) >= 0.70 THEN 'GREEN'
    WHEN m.gsc_indexed_urls::NUMERIC / NULLIF(m.gsc_discovered_urls, 0) >= 0.40 THEN 'YELLOW'
    ELSE 'RED'
  END AS gate_state,
  
  -- Gate action
  CASE
    WHEN m.gsc_indexed_urls::NUMERIC / NULLIF(m.gsc_discovered_urls, 0) >= 0.70 THEN 'ALLOW_SCALE'
    WHEN m.gsc_indexed_urls::NUMERIC / NULLIF(m.gsc_discovered_urls, 0) >= 0.40 THEN 'FREEZE'
    ELSE 'BLOCK_AND_ROLLBACK'
  END AS gate_action,
  
  -- Flags
  m.systemic_errors_flag,
  m.notes

FROM seo_daily_metrics m
ORDER BY m.date DESC;

-- ============================================================================
-- C) seo_gate_decisions (决策审计表)
-- ============================================================================

CREATE TABLE IF NOT EXISTS seo_gate_decisions (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL,
  
  -- Decision outcome
  gate_state TEXT NOT NULL,                -- GREEN / YELLOW / RED
  gate_action TEXT NOT NULL,               -- ALLOW_SCALE / FREEZE / BLOCK_AND_ROLLBACK
  reason_code TEXT NOT NULL,               -- SAFE_TO_SCALE / BLOCKED_LOW_INDEX_RATE / etc.
  
  -- Metrics at decision time
  index_rate NUMERIC(5,4),
  index_rate_7d_ma NUMERIC(5,4),
  volatility_7d NUMERIC(5,4),
  crawl_slope_7d NUMERIC(10,4),
  
  -- sitemap-core admission
  core_admission_eligible BOOLEAN DEFAULT FALSE,
  core_admission_detail JSONB,
  
  -- Full decision payload
  decision_json JSONB,
  
  -- Actor
  actor TEXT DEFAULT 'system',             -- system / manual
  actor_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for date lookups
CREATE INDEX IF NOT EXISTS idx_seo_gate_decisions_date ON seo_gate_decisions(date DESC);

-- ============================================================================
-- D) v_latest_gate_decision (最新决策视图)
-- ============================================================================

CREATE OR REPLACE VIEW v_latest_gate_decision AS
SELECT
  d.*,
  h.gsc_discovered_urls,
  h.gsc_indexed_urls,
  h.index_rate AS current_index_rate,
  h.index_rate_7d_ma AS current_7d_ma
FROM seo_gate_decisions d
LEFT JOIN v_index_health h ON d.date = h.date
ORDER BY d.created_at DESC
LIMIT 1;

-- ============================================================================
-- E) Helper function: Insert daily metrics
-- ============================================================================

CREATE OR REPLACE FUNCTION upsert_seo_daily_metrics(
  p_date DATE,
  p_discovered INT,
  p_indexed INT,
  p_crawled_not_indexed INT,
  p_excluded INT DEFAULT 0,
  p_duplicate INT DEFAULT 0,
  p_soft_404 INT DEFAULT 0,
  p_crawl_requests INT DEFAULT 0,
  p_crawl_bytes BIGINT DEFAULT 0,
  p_crawl_avg_ms INT DEFAULT 0,
  p_systemic_errors BOOLEAN DEFAULT FALSE,
  p_notes TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO seo_daily_metrics (
    date,
    gsc_discovered_urls,
    gsc_indexed_urls,
    gsc_crawled_not_indexed_urls,
    gsc_excluded_urls,
    gsc_duplicate_urls,
    gsc_soft_404_urls,
    crawl_requests,
    crawl_bytes,
    crawl_avg_response_ms,
    systemic_errors_flag,
    notes,
    updated_at
  ) VALUES (
    p_date,
    p_discovered,
    p_indexed,
    p_crawled_not_indexed,
    p_excluded,
    p_duplicate,
    p_soft_404,
    p_crawl_requests,
    p_crawl_bytes,
    p_crawl_avg_ms,
    p_systemic_errors,
    p_notes,
    NOW()
  )
  ON CONFLICT (date) DO UPDATE SET
    gsc_discovered_urls = EXCLUDED.gsc_discovered_urls,
    gsc_indexed_urls = EXCLUDED.gsc_indexed_urls,
    gsc_crawled_not_indexed_urls = EXCLUDED.gsc_crawled_not_indexed_urls,
    gsc_excluded_urls = EXCLUDED.gsc_excluded_urls,
    gsc_duplicate_urls = EXCLUDED.gsc_duplicate_urls,
    gsc_soft_404_urls = EXCLUDED.gsc_soft_404_urls,
    crawl_requests = EXCLUDED.crawl_requests,
    crawl_bytes = EXCLUDED.crawl_bytes,
    crawl_avg_response_ms = EXCLUDED.crawl_avg_response_ms,
    systemic_errors_flag = EXCLUDED.systemic_errors_flag,
    notes = COALESCE(EXCLUDED.notes, seo_daily_metrics.notes),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- F) Helper function: Record gate decision
-- ============================================================================

CREATE OR REPLACE FUNCTION record_gate_decision(
  p_date DATE,
  p_state TEXT,
  p_action TEXT,
  p_reason_code TEXT,
  p_index_rate NUMERIC,
  p_index_rate_7d_ma NUMERIC DEFAULT NULL,
  p_volatility_7d NUMERIC DEFAULT NULL,
  p_crawl_slope_7d NUMERIC DEFAULT NULL,
  p_core_eligible BOOLEAN DEFAULT FALSE,
  p_core_detail JSONB DEFAULT NULL,
  p_decision_json JSONB DEFAULT NULL,
  p_actor TEXT DEFAULT 'system',
  p_notes TEXT DEFAULT NULL
)
RETURNS BIGINT AS $$
DECLARE
  v_id BIGINT;
BEGIN
  INSERT INTO seo_gate_decisions (
    date,
    gate_state,
    gate_action,
    reason_code,
    index_rate,
    index_rate_7d_ma,
    volatility_7d,
    crawl_slope_7d,
    core_admission_eligible,
    core_admission_detail,
    decision_json,
    actor,
    actor_notes
  ) VALUES (
    p_date,
    p_state,
    p_action,
    p_reason_code,
    p_index_rate,
    p_index_rate_7d_ma,
    p_volatility_7d,
    p_crawl_slope_7d,
    p_core_eligible,
    p_core_detail,
    p_decision_json,
    p_actor,
    p_notes
  )
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- G) Dashboard summary view
-- ============================================================================

CREATE OR REPLACE VIEW v_seo_dashboard_summary AS
SELECT
  -- Latest metrics
  (SELECT date FROM v_index_health LIMIT 1) AS latest_date,
  (SELECT index_rate FROM v_index_health LIMIT 1) AS current_index_rate,
  (SELECT index_rate_7d_ma FROM v_index_health LIMIT 1) AS current_7d_ma,
  (SELECT gate_state FROM v_index_health LIMIT 1) AS current_state,
  (SELECT gate_action FROM v_index_health LIMIT 1) AS current_action,
  
  -- Totals
  (SELECT gsc_discovered_urls FROM v_index_health LIMIT 1) AS total_discovered,
  (SELECT gsc_indexed_urls FROM v_index_health LIMIT 1) AS total_indexed,
  (SELECT gsc_crawled_not_indexed_urls FROM v_index_health LIMIT 1) AS total_cni,
  
  -- Trends (7 day)
  (SELECT SUM(index_delta_1d) FROM v_index_health WHERE date > CURRENT_DATE - 7) AS indexed_change_7d,
  (SELECT SUM(discover_delta_1d) FROM v_index_health WHERE date > CURRENT_DATE - 7) AS discovered_change_7d,
  
  -- sitemap-core admission
  CASE
    WHEN (SELECT index_rate FROM v_index_health LIMIT 1) >= 0.65 THEN TRUE
    ELSE FALSE
  END AS core_admission_rate_check;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE seo_daily_metrics IS 'Daily SEO metrics from GSC and sitemap stats';
COMMENT ON TABLE seo_gate_decisions IS 'Audit log of all scaling gate decisions';
COMMENT ON VIEW v_index_health IS 'Computed metrics for Index Health Dashboard';
COMMENT ON VIEW v_latest_gate_decision IS 'Most recent gate decision with context';
COMMENT ON VIEW v_seo_dashboard_summary IS 'Single-row dashboard summary';
