-- 134_redirect_hit_daily_counts.sql
-- 重定向命中量统计表：记录每天命中重定向 pattern 的次数
-- 用于 Index Gate 证据链：监控重定向 pattern 是否收敛

CREATE TABLE IF NOT EXISTS public.redirect_hit_daily_counts (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL,
  pattern TEXT NOT NULL,              -- 重定向 pattern（如 'video_prompt_param', 'keywords_repeated_prefix'）
  hits INTEGER NOT NULL DEFAULT 0,    -- 当日命中次数
  sample_url TEXT,                    -- 示例 URL（用于调试）
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(date, pattern)
);

CREATE INDEX IF NOT EXISTS redirect_hit_daily_counts_date_idx ON public.redirect_hit_daily_counts(date);
CREATE INDEX IF NOT EXISTS redirect_hit_daily_counts_pattern_idx ON public.redirect_hit_daily_counts(pattern);

-- 更新 updated_at 的触发器
CREATE OR REPLACE FUNCTION public.tg_redirect_hit_daily_counts_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS redirect_hit_daily_counts_set_updated_at ON public.redirect_hit_daily_counts;
CREATE TRIGGER redirect_hit_daily_counts_set_updated_at
  BEFORE UPDATE ON public.redirect_hit_daily_counts
  FOR EACH ROW
  EXECUTE FUNCTION public.tg_redirect_hit_daily_counts_updated_at();

COMMENT ON TABLE public.redirect_hit_daily_counts IS '重定向命中量统计：用于 Index Gate 监控，pattern hit 必须下降';
COMMENT ON COLUMN public.redirect_hit_daily_counts.pattern IS '重定向 pattern（如 video_prompt_param, keywords_repeated_prefix）';
COMMENT ON COLUMN public.redirect_hit_daily_counts.hits IS '当日命中次数';
COMMENT ON COLUMN public.redirect_hit_daily_counts.sample_url IS '示例 URL（用于调试）';

-- 初始化今日数据（如果不存在）
INSERT INTO public.redirect_hit_daily_counts (date, pattern, hits, sample_url)
VALUES 
  (CURRENT_DATE, 'video_prompt_param', 0, NULL),
  (CURRENT_DATE, 'keywords_repeated_prefix', 0, NULL)
ON CONFLICT (date, pattern) DO NOTHING;
