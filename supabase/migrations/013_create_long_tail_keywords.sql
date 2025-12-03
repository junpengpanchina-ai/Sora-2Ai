-- 013_create_long_tail_keywords.sql
-- Track optimized long-tail keyword landing pages for SEO

CREATE TABLE IF NOT EXISTS long_tail_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL,
  intent TEXT NOT NULL CHECK (intent IN ('information', 'comparison', 'transaction')),
  product TEXT,
  service TEXT,
  region TEXT,
  pain_point TEXT,
  search_volume INTEGER,
  competition_score NUMERIC(6,3),
  priority INTEGER NOT NULL DEFAULT 0,
  page_slug TEXT NOT NULL,
  title TEXT,
  meta_description TEXT,
  h1 TEXT,
  intro_paragraph TEXT,
  steps JSONB NOT NULL DEFAULT '[]'::JSONB,
  faq JSONB NOT NULL DEFAULT '[]'::JSONB,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  last_generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_long_tail_keywords_slug
  ON long_tail_keywords(page_slug);

CREATE INDEX IF NOT EXISTS idx_long_tail_keywords_status_updated_at
  ON long_tail_keywords(status, updated_at DESC);

DROP TRIGGER IF EXISTS trg_long_tail_keywords_updated_at ON long_tail_keywords;
CREATE TRIGGER trg_long_tail_keywords_updated_at
  BEFORE UPDATE ON long_tail_keywords
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE long_tail_keywords ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS long_tail_keywords_public_select ON long_tail_keywords;
CREATE POLICY long_tail_keywords_public_select
  ON long_tail_keywords
  FOR SELECT
  TO anon
  USING (status = 'published');

DROP POLICY IF EXISTS long_tail_keywords_authenticated_select ON long_tail_keywords;
CREATE POLICY long_tail_keywords_authenticated_select
  ON long_tail_keywords
  FOR SELECT
  TO authenticated
  USING (status = 'published');


