-- 129_keyword_optimization_overrides.sql
-- 关键词优化：审核期间手动微调关键词，预留 Google Trends API 集成
-- 优先级高的手动调整关键词将在合并趋势数据时优先展示

CREATE TABLE IF NOT EXISTS keyword_optimization_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  adjustment_reason TEXT,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'trends_api')),
  search_volume INTEGER,
  trend_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_keyword_optimization_keyword
  ON keyword_optimization_overrides(keyword);

CREATE INDEX IF NOT EXISTS idx_keyword_optimization_priority
  ON keyword_optimization_overrides(priority);

CREATE INDEX IF NOT EXISTS idx_keyword_optimization_status
  ON keyword_optimization_overrides(status);

CREATE INDEX IF NOT EXISTS idx_keyword_optimization_updated_at
  ON keyword_optimization_overrides(updated_at DESC);

DROP TRIGGER IF EXISTS trg_keyword_optimization_overrides_updated_at ON keyword_optimization_overrides;
CREATE TRIGGER trg_keyword_optimization_overrides_updated_at
  BEFORE UPDATE ON keyword_optimization_overrides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE keyword_optimization_overrides ENABLE ROW LEVEL SECURITY;

-- 无策略：anon/authenticated 无权限；admin 通过 service role（绕过 RLS）操作
