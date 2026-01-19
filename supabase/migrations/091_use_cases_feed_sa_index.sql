-- 091: S、A 级（tier 1,2）列表的复合索引，支持「策略展示 5 万条、S&A 级别」的筛选
-- 条件: is_published AND (quality_status approved|null) AND tier IN (1,2) ORDER BY created_at DESC

CREATE INDEX IF NOT EXISTS idx_use_cases_feed_sa
  ON public.use_cases (created_at DESC)
  WHERE is_published = true
    AND (quality_status = 'approved' OR quality_status IS NULL)
    AND tier IN (1, 2);

COMMENT ON INDEX idx_use_cases_feed_sa IS 'S+A tier filter: /use-cases?tier=s-a, supports 50k scale';
