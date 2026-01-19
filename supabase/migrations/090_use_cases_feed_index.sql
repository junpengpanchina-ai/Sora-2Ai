-- 090: 为 /use-cases 列表查询添加复合索引，缓解 statement timeout (57014)
-- 查询条件: is_published=true AND (quality_status='approved' OR quality_status IS NULL) ORDER BY created_at DESC

CREATE INDEX IF NOT EXISTS idx_use_cases_feed
  ON public.use_cases (created_at DESC)
  WHERE is_published = true AND (quality_status = 'approved' OR quality_status IS NULL);

COMMENT ON INDEX idx_use_cases_feed IS 'Feed list: /use-cases and /api/use-cases, reduces statement timeout (57014)';
