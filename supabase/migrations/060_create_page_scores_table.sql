-- 创建 page_scores 表用于存储 AI Citation Score
-- 用于缓存和追踪页面评分

CREATE TABLE IF NOT EXISTS page_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL UNIQUE, -- 页面 URL（如 /use-cases/slug）
  tier INTEGER NOT NULL DEFAULT 3, -- 1=Tier1, 2=Tier2, 3=Tier3
  ai_citation_score INTEGER NOT NULL DEFAULT 0, -- 0-100
  recalc_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  signals JSONB, -- 存储评分信号详情（方便 debug）
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_page_scores_url ON page_scores(url);
CREATE INDEX IF NOT EXISTS idx_page_scores_tier ON page_scores(tier);
CREATE INDEX IF NOT EXISTS idx_page_scores_score ON page_scores(ai_citation_score DESC);
CREATE INDEX IF NOT EXISTS idx_page_scores_recalc_at ON page_scores(recalc_at);

-- 添加注释
COMMENT ON TABLE page_scores IS '存储页面的 AI Citation Score 和评分信号';
COMMENT ON COLUMN page_scores.url IS '页面 URL（相对路径，如 /use-cases/slug）';
COMMENT ON COLUMN page_scores.tier IS '页面层级：1=Tier1, 2=Tier2, 3=Tier3';
COMMENT ON COLUMN page_scores.ai_citation_score IS 'AI 引用概率评分（0-100）';
COMMENT ON COLUMN page_scores.signals IS '评分信号详情（JSONB，包含各维度得分）';

-- 自动更新 updated_at
CREATE OR REPLACE FUNCTION update_page_scores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_page_scores_updated_at
  BEFORE UPDATE ON page_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_page_scores_updated_at();
