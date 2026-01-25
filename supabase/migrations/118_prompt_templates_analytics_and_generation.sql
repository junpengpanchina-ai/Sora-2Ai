-- 118_prompt_templates_analytics_and_generation.sql
-- Prompt Templates analytics (dashboard + A/B) + batch generation tasks
-- 目标：
-- - 为 Admin Dashboard 提供可计算的 Usage/Success/ΔCR/ROI/Gate 指标（即使当前数据为空，也能落结构）
-- - 为 Prompt A/B 提供最小样本量判断（data_sufficient）
-- - 为 Admin 批量自动生成 Prompt Templates 提供任务表（链式处理 / 可暂停 / 可终止）
--
-- 注意：本迁移围绕 prompt_templates（V2 架构）而非 prompt_library（旧库/公开库）。

-- ============================================
-- 1) Site Gate Status（SEO Gate 的单点状态）
-- ============================================
CREATE TABLE IF NOT EXISTS public.site_gate_status (
  id SMALLINT PRIMARY KEY DEFAULT 1,
  status TEXT NOT NULL CHECK (status IN ('GREEN', 'YELLOW', 'RED')),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 保证只有一行
INSERT INTO public.site_gate_status (id, status)
VALUES (1, 'GREEN')
ON CONFLICT (id) DO NOTHING;

-- 更新时间触发器（复用已有 update_updated_at_column 如果存在）
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column'
  ) THEN
    DROP TRIGGER IF EXISTS trg_site_gate_status_updated_at ON public.site_gate_status;
    CREATE TRIGGER trg_site_gate_status_updated_at
      BEFORE UPDATE ON public.site_gate_status
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ============================================
-- 2) Prompt Template Events（事实表：用于 Dashboard / A/B）
-- ============================================
CREATE TABLE IF NOT EXISTS public.prompt_template_events (
  id BIGSERIAL PRIMARY KEY,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- NOTE: cannot use GENERATED ALWAYS here because timestamptz->date depends on timezone
  -- (Postgres requires generated expressions to be IMMUTABLE).
  -- We store date explicitly and set it via trigger using a fixed timezone (UTC).
  date DATE NOT NULL,

  -- 关联
  user_id UUID,
  session_id TEXT,
  scene_id UUID REFERENCES public.use_cases(id) ON DELETE SET NULL,
  prompt_template_id UUID REFERENCES public.prompt_templates(id) ON DELETE SET NULL,

  -- 实验维度（可选：同一个 prompt_template 的不同版本/父子关系）
  variant_label TEXT, -- e.g. A/B/C (optional)

  -- 事件类型（最小集合）
  event_type TEXT NOT NULL CHECK (event_type IN ('impression', 'execute', 'success', 'failure', 'paid')),

  -- 付费/收入（可选：如果你有账本可写入）
  revenue_cents INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_pte_date ON public.prompt_template_events(date);
CREATE INDEX IF NOT EXISTS idx_pte_prompt ON public.prompt_template_events(prompt_template_id);
CREATE INDEX IF NOT EXISTS idx_pte_scene ON public.prompt_template_events(scene_id);
CREATE INDEX IF NOT EXISTS idx_pte_type ON public.prompt_template_events(event_type);

-- Keep date consistent with occurred_at (UTC)
CREATE OR REPLACE FUNCTION public.set_prompt_template_events_date()
RETURNS TRIGGER AS $$
BEGIN
  NEW.date := (NEW.occurred_at AT TIME ZONE 'UTC')::DATE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prompt_template_events_date ON public.prompt_template_events;
CREATE TRIGGER trg_prompt_template_events_date
  BEFORE INSERT OR UPDATE OF occurred_at ON public.prompt_template_events
  FOR EACH ROW
  EXECUTE FUNCTION public.set_prompt_template_events_date();

-- ============================================
-- 3) Prompt Generation Tasks（Admin 批量生成任务表）
-- ============================================
CREATE TABLE IF NOT EXISTS public.prompt_generation_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  requested_by_admin_id UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),

  -- 参数（支持 industry x scene 的笛卡尔组合）
  industries TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  scenes TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[], -- 存 slug 或 title；scene_id 建议由 worker 解析后写入
  scene_ids UUID[] DEFAULT ARRAY[]::UUID[],       -- 可选：直接指定 use_cases.id
  per_cell_count INTEGER NOT NULL DEFAULT 10,
  locale TEXT NOT NULL DEFAULT 'en',

  -- 生成策略（默认与你 SOP 一致）
  primary_model TEXT NOT NULL DEFAULT 'gemini-2.5-flash',
  secondary_model TEXT NOT NULL DEFAULT 'gemini-3-flash',
  fallback_model TEXT NOT NULL DEFAULT 'gemini-3-pro',

  -- 产物归属（prompt_templates）
  owner_scope TEXT NOT NULL DEFAULT 'scene' CHECK (owner_scope IN ('scene', 'global')),
  model_id TEXT NOT NULL DEFAULT 'sora',
  role TEXT NOT NULL DEFAULT 'default',

  -- 控制
  max_total_prompts INTEGER NOT NULL DEFAULT 1200,
  max_retries_per_cell INTEGER NOT NULL DEFAULT 2,

  -- 进度
  current_cell_index INTEGER NOT NULL DEFAULT 0,
  total_planned INTEGER NOT NULL DEFAULT 0,
  total_created INTEGER NOT NULL DEFAULT 0,
  progress INTEGER NOT NULL DEFAULT 0,
  should_stop BOOLEAN NOT NULL DEFAULT FALSE,
  is_paused BOOLEAN NOT NULL DEFAULT FALSE,
  last_error TEXT,

  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column'
  ) THEN
    DROP TRIGGER IF EXISTS trg_prompt_generation_tasks_updated_at ON public.prompt_generation_tasks;
    CREATE TRIGGER trg_prompt_generation_tasks_updated_at
      BEFORE UPDATE ON public.prompt_generation_tasks
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ============================================
-- 4) Views: Daily metrics / 7d ROI / Gate / A/B
-- ============================================

-- 4.1 Daily: Usage & Success
CREATE OR REPLACE VIEW public.v_prompt_template_daily_metrics AS
SELECT
  date,
  prompt_template_id,
  COUNT(*) FILTER (WHERE event_type = 'impression') AS impressions,
  COUNT(*) FILTER (WHERE event_type = 'execute') AS executions,
  COUNT(*) FILTER (WHERE event_type = 'success') AS success_count,
  COUNT(*) FILTER (WHERE event_type = 'failure') AS failure_count,
  CASE
    WHEN COUNT(*) FILTER (WHERE event_type = 'execute') = 0 THEN 0
    ELSE (COUNT(*) FILTER (WHERE event_type = 'success')::NUMERIC
      / COUNT(*) FILTER (WHERE event_type = 'execute')::NUMERIC)
  END AS success_rate,
  COUNT(DISTINCT user_id) FILTER (WHERE event_type = 'execute') AS exec_users
FROM public.prompt_template_events
WHERE prompt_template_id IS NOT NULL
GROUP BY date, prompt_template_id;

-- 4.2 7d ROI inputs (ΔCR needs a baseline; we keep a minimal baseline table)
CREATE TABLE IF NOT EXISTS public.app_metrics_daily (
  date DATE PRIMARY KEY,
  active_users INTEGER NOT NULL DEFAULT 0,
  nonprompt_users INTEGER NOT NULL DEFAULT 0,
  nonprompt_paid_users INTEGER NOT NULL DEFAULT 0,
  ltv_cents INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column'
  ) THEN
    DROP TRIGGER IF EXISTS trg_app_metrics_daily_updated_at ON public.app_metrics_daily;
    CREATE TRIGGER trg_app_metrics_daily_updated_at
      BEFORE UPDATE ON public.app_metrics_daily
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

CREATE OR REPLACE VIEW public.v_prompt_template_7d_roi AS
WITH p AS (
  SELECT
    prompt_template_id,
    COUNT(DISTINCT user_id) FILTER (WHERE event_type = 'execute') AS prompt_users_7d,
    COUNT(DISTINCT user_id) FILTER (WHERE event_type = 'paid') AS prompt_paid_users_7d
  FROM public.prompt_template_events
  WHERE occurred_at >= NOW() - INTERVAL '7 days'
    AND prompt_template_id IS NOT NULL
  GROUP BY prompt_template_id
),
b AS (
  SELECT
    SUM(nonprompt_paid_users) AS nonprompt_paid_users_7d,
    SUM(nonprompt_users) AS nonprompt_users_7d,
    MAX(ltv_cents) AS ltv_cents
  FROM public.app_metrics_daily
  WHERE date >= (NOW() - INTERVAL '7 days')::DATE
),
calc AS (
  SELECT
    p.prompt_template_id,
    p.prompt_users_7d,
    p.prompt_paid_users_7d,
    CASE WHEN p.prompt_users_7d = 0 THEN 0
         ELSE p.prompt_paid_users_7d::NUMERIC / p.prompt_users_7d::NUMERIC END AS prompt_cr,
    CASE WHEN b.nonprompt_users_7d = 0 THEN 0
         ELSE b.nonprompt_paid_users_7d::NUMERIC / b.nonprompt_users_7d::NUMERIC END AS baseline_cr,
    (
      CASE WHEN p.prompt_users_7d = 0 THEN 0
           ELSE p.prompt_paid_users_7d::NUMERIC / p.prompt_users_7d::NUMERIC END
      -
      CASE WHEN b.nonprompt_users_7d = 0 THEN 0
           ELSE b.nonprompt_paid_users_7d::NUMERIC / b.nonprompt_users_7d::NUMERIC END
    ) AS delta_cr,
    b.ltv_cents
  FROM p CROSS JOIN b
)
SELECT
  prompt_template_id,
  prompt_users_7d,
  prompt_paid_users_7d,
  prompt_cr,
  baseline_cr,
  delta_cr,
  ltv_cents,
  (prompt_users_7d::NUMERIC * GREATEST(delta_cr, 0) * ltv_cents::NUMERIC) AS roi_value_cents_7d
FROM calc;

-- 4.3 Gate view (P90 usage + stability + ΔCR + SEO gate)
CREATE OR REPLACE VIEW public.v_prompt_template_gate AS
WITH usage AS (
  SELECT
    prompt_template_id,
    SUM(executions) AS executions_7d,
    SUM(success_count) AS success_7d,
    SUM(failure_count) AS failure_7d,
    CASE WHEN SUM(executions) = 0 THEN 0
         ELSE SUM(success_count)::NUMERIC / SUM(executions)::NUMERIC END AS success_rate_7d
  FROM public.v_prompt_template_daily_metrics
  WHERE date >= (NOW() - INTERVAL '7 days')::DATE
  GROUP BY prompt_template_id
),
p90 AS (
  SELECT
    COALESCE(percentile_cont(0.9) WITHIN GROUP (ORDER BY executions_7d), 0) AS exec_p90
  FROM usage
),
roi AS (
  SELECT * FROM public.v_prompt_template_7d_roi
),
gate AS (
  SELECT
    u.prompt_template_id,
    COALESCE(u.executions_7d, 0) AS executions_7d,
    COALESCE(u.success_rate_7d, 0) AS success_rate_7d,
    COALESCE(r.delta_cr, 0) AS delta_cr_7d,
    COALESCE(r.roi_value_cents_7d, 0) AS roi_value_cents_7d,
    (COALESCE(u.failure_7d, 0) = 0) AS no_failures_7d,
    (COALESCE(u.executions_7d, 0) >= (SELECT exec_p90 FROM p90)) AS pass_usage_p90,
    (COALESCE(u.success_rate_7d, 0) >= 0.65) AS pass_success,
    (COALESCE(r.delta_cr, 0) > 0) AS pass_delta_cr,
    (COALESCE(u.failure_7d, 0) = 0) AS pass_stability,
    ((SELECT status FROM public.site_gate_status WHERE id = 1) = 'GREEN') AS pass_seo_gate
  FROM usage u
  LEFT JOIN roi r ON r.prompt_template_id = u.prompt_template_id
)
SELECT
  g.*,
  (
    g.pass_usage_p90 AND
    g.pass_success AND
    g.pass_delta_cr AND
    g.pass_stability AND
    g.pass_seo_gate
  ) AS gate_pass
FROM gate g;

-- 4.4 A/B sample sufficiency (14d)
CREATE OR REPLACE VIEW public.v_prompt_template_ab AS
WITH m AS (
  SELECT
    prompt_template_id,
    variant_label,
    COUNT(*) FILTER (WHERE event_type = 'execute') AS executions,
    COUNT(*) FILTER (WHERE event_type = 'success') AS success_count,
    COUNT(DISTINCT user_id) FILTER (WHERE event_type = 'paid') AS paid_users,
    CASE WHEN COUNT(*) FILTER (WHERE event_type = 'execute') = 0 THEN 0
         ELSE COUNT(*) FILTER (WHERE event_type = 'success')::NUMERIC
              / COUNT(*) FILTER (WHERE event_type = 'execute')::NUMERIC END AS success_rate
  FROM public.prompt_template_events
  WHERE prompt_template_id IS NOT NULL
    AND occurred_at >= NOW() - INTERVAL '14 days'
  GROUP BY prompt_template_id, variant_label
)
SELECT
  m.*,
  (m.executions >= 100) AS pass_min_exec,
  (m.paid_users >= 20) AS pass_min_paid,
  (m.executions >= 100 AND m.paid_users >= 20) AS data_sufficient
FROM m;

-- 4.5 Admin list view: prompt_templates + gate + AB flags
CREATE OR REPLACE VIEW public.v_prompt_templates_admin_list AS
SELECT
  pt.id,
  pt.owner_scope,
  pt.scene_id,
  pt.model_id,
  pt.role,
  pt.content,
  pt.variables,
  pt.version,
  pt.parent_id,
  pt.status,
  pt.is_published,
  pt.weight,
  pt.rollout_pct,
  pt.min_plan,
  pt.locale,
  pt.notes,
  pt.created_by,
  pt.created_at,
  pt.updated_at,

  g.executions_7d,
  g.success_rate_7d,
  g.delta_cr_7d,
  g.roi_value_cents_7d,
  g.gate_pass,
  g.pass_usage_p90,
  g.pass_success,
  g.pass_delta_cr,
  g.pass_stability,
  g.pass_seo_gate,

  COALESCE(ab.data_sufficient, FALSE) AS ab_data_sufficient,
  COALESCE(ab.variant_count_14d, 0) AS variant_count_14d
FROM public.prompt_templates pt
LEFT JOIN public.v_prompt_template_gate g ON g.prompt_template_id = pt.id
LEFT JOIN (
  SELECT
    prompt_template_id,
    BOOL_OR(data_sufficient) AS data_sufficient,
    COUNT(DISTINCT variant_label) AS variant_count_14d
  FROM public.v_prompt_template_ab
  GROUP BY prompt_template_id
) ab ON ab.prompt_template_id = pt.id;

-- ============================================
-- 5) RPC: Admin pagination for prompt_templates list
-- ============================================
CREATE OR REPLACE FUNCTION public.rpc_get_prompt_templates_admin_page(
  page INTEGER DEFAULT 1,
  page_size INTEGER DEFAULT 50,
  q TEXT DEFAULT NULL,
  owner_scope_filter TEXT DEFAULT NULL,
  scene_id_filter UUID DEFAULT NULL,
  status_filter TEXT DEFAULT NULL,
  gate_only BOOLEAN DEFAULT FALSE,
  experiments_only BOOLEAN DEFAULT FALSE,
  sort_by TEXT DEFAULT 'updated_at',
  sort_dir TEXT DEFAULT 'desc'
)
RETURNS TABLE (
  total_count BIGINT,
  items JSONB
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_offset INTEGER := GREATEST((page - 1) * page_size, 0);
  v_sort_by TEXT := LOWER(COALESCE(sort_by, 'updated_at'));
  v_sort_dir TEXT := LOWER(COALESCE(sort_dir, 'desc'));
  v_order_sql TEXT;
BEGIN
  -- whitelist sortable fields
  IF v_sort_by NOT IN (
    'updated_at','created_at','executions_7d','success_rate_7d','delta_cr_7d','roi_value_cents_7d','gate_pass','model_id','role','version'
  ) THEN
    v_sort_by := 'updated_at';
  END IF;
  IF v_sort_dir NOT IN ('asc','desc') THEN
    v_sort_dir := 'desc';
  END IF;
  v_order_sql := FORMAT('%I %s', v_sort_by, v_sort_dir);

  EXECUTE FORMAT($sql$
    SELECT COUNT(*)
    FROM public.v_prompt_templates_admin_list
    WHERE ($1 IS NULL OR content ILIKE '%%' || $1 || '%%')
      AND ($2 IS NULL OR owner_scope = $2)
      AND ($3 IS NULL OR scene_id = $3)
      AND ($4 IS NULL OR status = $4)
      AND ($5 = FALSE OR gate_pass = TRUE)
      AND (
        $6 = FALSE OR
        (rollout_pct < 100 OR parent_id IS NOT NULL)
      )
  $sql$)
  INTO total_count
  USING q, owner_scope_filter, scene_id_filter, status_filter, gate_only, experiments_only;

  EXECUTE FORMAT($sql$
    SELECT COALESCE(JSONB_AGG(TO_JSONB(t)), '[]'::JSONB)
    FROM (
      SELECT *
      FROM public.v_prompt_templates_admin_list
      WHERE ($1 IS NULL OR content ILIKE '%%' || $1 || '%%')
        AND ($2 IS NULL OR owner_scope = $2)
        AND ($3 IS NULL OR scene_id = $3)
        AND ($4 IS NULL OR status = $4)
        AND ($5 = FALSE OR gate_pass = TRUE)
        AND (
          $6 = FALSE OR
          (rollout_pct < 100 OR parent_id IS NOT NULL)
        )
      ORDER BY %s
      LIMIT $7 OFFSET $8
    ) t
  $sql$, v_order_sql)
  INTO items
  USING q, owner_scope_filter, scene_id_filter, status_filter, gate_only, experiments_only, page_size, v_offset;

  RETURN NEXT;
END;
$$;

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 118 completed: prompt_templates analytics + generation tasks + admin RPC';
END $$;

