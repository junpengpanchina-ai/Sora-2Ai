-- 124_prompt_template_gate_score_and_lifecycle.sql
-- Adds:
-- - gate_score_7d (sortable numeric score)
-- - gate_color_7d (R/Y/G based on gate_score_7d + minimum usage)
-- - last_execute_at (recency signal)
-- - lifecycle recommendation (hard_kill / freeze / promote / keep)
--
-- Philosophy:
-- - Keep the existing boolean gate_pass (strict, conservative).
-- - Add a simple numeric score for ranking and operator intuition.
-- - Add a "recommended action" field that can be surfaced in Admin UI,
--   but DOES NOT auto-mutate prompt_templates without an explicit operator action.

-- IMPORTANT:
-- Postgres does NOT allow CREATE OR REPLACE VIEW to reorder/rename columns.
-- This migration adds new columns into v_prompt_template_gate, so we must DROP and recreate.
-- We use CASCADE because admin list views depend on it, and we recreate them below.
DROP VIEW IF EXISTS public.v_prompt_templates_admin_list CASCADE;
DROP VIEW IF EXISTS public.v_prompt_template_lifecycle CASCADE;
DROP VIEW IF EXISTS public.v_prompt_template_gate CASCADE;

-- ============================================
-- 1) Extend 7d Gate view with score + recency
-- ============================================
CREATE VIEW public.v_prompt_template_gate AS
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
last_exec AS (
  SELECT
    prompt_template_id,
    MAX(occurred_at) FILTER (WHERE event_type = 'execute') AS last_execute_at
  FROM public.prompt_template_events
  WHERE prompt_template_id IS NOT NULL
  GROUP BY prompt_template_id
),
gate AS (
  SELECT
    u.prompt_template_id,
    COALESCE(u.executions_7d, 0) AS executions_7d,
    COALESCE(u.success_7d, 0) AS success_7d,
    COALESCE(u.failure_7d, 0) AS failure_7d,
    COALESCE(u.success_rate_7d, 0) AS success_rate_7d,
    COALESCE(le.last_execute_at, NULL) AS last_execute_at,

    COALESCE(r.delta_cr, 0) AS delta_cr_7d,
    COALESCE(r.roi_value_cents_7d, 0) AS roi_value_cents_7d,

    (COALESCE(u.failure_7d, 0) = 0) AS no_failures_7d,
    (COALESCE(u.executions_7d, 0) >= (SELECT exec_p90 FROM p90)) AS pass_usage_p90,
    (COALESCE(u.success_rate_7d, 0) >= 0.65) AS pass_success,
    (COALESCE(r.delta_cr, 0) > 0) AS pass_delta_cr,
    (COALESCE(u.failure_7d, 0) = 0) AS pass_stability,
    ((SELECT status FROM public.site_gate_status WHERE id = 1) = 'GREEN') AS pass_seo_gate,

    -- GateScore (0-1-ish): 0.6×S + 0.4×log(U+1) normalized.
    -- We normalize log(U+1) by log(101) and cap at 1 for U>=100 to keep score stable.
    (
      0.6 * COALESCE(u.success_rate_7d, 0)
      + 0.4 * LEAST(1, LN(COALESCE(u.executions_7d, 0) + 1) / LN(101))
    )::NUMERIC(6, 4) AS gate_score_7d
  FROM usage u
  LEFT JOIN roi r ON r.prompt_template_id = u.prompt_template_id
  LEFT JOIN last_exec le ON le.prompt_template_id = u.prompt_template_id
)
SELECT
  g.*,
  CASE
    WHEN g.gate_score_7d >= 0.65 AND g.executions_7d >= 20 THEN 'GREEN'
    WHEN g.gate_score_7d >= 0.35 THEN 'YELLOW'
    ELSE 'RED'
  END AS gate_color_7d,
  (
    g.pass_usage_p90 AND
    g.pass_success AND
    g.pass_delta_cr AND
    g.pass_stability AND
    g.pass_seo_gate
  ) AS gate_pass
FROM gate g;

-- ============================================
-- 2) Lifecycle recommendation (no side effects)
-- ============================================
CREATE VIEW public.v_prompt_template_lifecycle AS
SELECT
  pt.id AS prompt_template_id,

  g.executions_7d,
  g.success_7d,
  g.failure_7d,
  g.success_rate_7d,
  g.gate_score_7d,
  g.gate_color_7d,
  g.last_execute_at,

  l.executions_30d,
  l.completion_rate_30d,
  l.reuse_rate_30d,
  l.delta_cr_30d,
  lg.ltv_gate_color,

  CASE
    -- Hard kill: enough samples but extremely low completion
    WHEN COALESCE(g.executions_7d, 0) >= 20 AND COALESCE(g.success_rate_7d, 0) < 0.15 THEN 'HARD_KILL'
    WHEN COALESCE(g.failure_7d, 0) >= 10 AND COALESCE(g.success_7d, 0) = 0 THEN 'HARD_KILL'

    -- Freeze: low success or stale (no calls in 7d)
    WHEN COALESCE(g.executions_7d, 0) >= 10 AND COALESCE(g.success_rate_7d, 0) < 0.30 THEN 'FREEZE'
    WHEN g.last_execute_at IS NULL OR g.last_execute_at < NOW() - INTERVAL '7 days' THEN 'FREEZE'

    -- Promote: good scale + solid quality + good score (operator still reviews)
    WHEN COALESCE(l.executions_30d, 0) >= 50
      AND COALESCE(l.completion_rate_30d, 0) >= 0.65
      AND COALESCE(g.gate_score_7d, 0) >= 0.70
    THEN 'PROMOTE'

    ELSE 'KEEP'
  END AS lifecycle_recommendation,

  (
    CASE
      WHEN (COALESCE(g.executions_7d, 0) >= 20 AND COALESCE(g.success_rate_7d, 0) < 0.15) THEN TRUE
      WHEN (COALESCE(g.failure_7d, 0) >= 10 AND COALESCE(g.success_7d, 0) = 0) THEN TRUE
      WHEN (COALESCE(g.executions_7d, 0) >= 10 AND COALESCE(g.success_rate_7d, 0) < 0.30) THEN TRUE
      WHEN (g.last_execute_at IS NULL OR g.last_execute_at < NOW() - INTERVAL '7 days') THEN TRUE
      ELSE FALSE
    END
  ) AS lifecycle_should_unpublish
FROM public.prompt_templates pt
LEFT JOIN public.v_prompt_template_gate g ON g.prompt_template_id = pt.id
LEFT JOIN public.v_prompt_template_ltv_30d l ON l.prompt_template_id = pt.id
LEFT JOIN public.v_prompt_template_ltv_gate lg ON lg.prompt_template_id = pt.id;

-- ============================================
-- 3) Extend admin list view with score + lifecycle
-- ============================================
-- Recreate view (re-runnable; avoid "cannot drop columns from view")
DROP VIEW IF EXISTS public.v_prompt_templates_admin_list CASCADE;

CREATE VIEW public.v_prompt_templates_admin_list AS
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
  g.success_7d,
  g.failure_7d,
  g.success_rate_7d,
  g.delta_cr_7d,
  g.roi_value_cents_7d,
  g.gate_score_7d,
  g.gate_color_7d,
  g.last_execute_at,
  g.gate_pass,
  g.pass_usage_p90,
  g.pass_success,
  g.pass_delta_cr,
  g.pass_stability,
  g.pass_seo_gate,

  COALESCE(ab.data_sufficient, FALSE) AS ab_data_sufficient,
  COALESCE(ab.variant_count_14d, 0) AS variant_count_14d,

  -- LTV-driving (30d)
  l.executions_30d,
  l.completion_rate_30d,
  l.reuse_rate_30d,
  l.delta_cr_30d,
  l.prompt_paid_rate_30d,
  l.baseline_paid_rate_30d,
  l.t_first_success_median_sec_30d,
  l.t_first_success_avg_sec_30d,

  -- Gate (R/Y/G)
  lg.ltv_gate_color,

  -- Lifecycle (operator recommendation)
  lc.lifecycle_recommendation,
  lc.lifecycle_should_unpublish
FROM public.prompt_templates pt
LEFT JOIN public.v_prompt_template_gate g ON g.prompt_template_id = pt.id
LEFT JOIN (
  SELECT
    prompt_template_id,
    BOOL_OR(data_sufficient) AS data_sufficient,
    COUNT(DISTINCT variant_label) AS variant_count_14d
  FROM public.v_prompt_template_ab
  GROUP BY prompt_template_id
) ab ON ab.prompt_template_id = pt.id
LEFT JOIN public.v_prompt_template_ltv_30d l ON l.prompt_template_id = pt.id
LEFT JOIN public.v_prompt_template_ltv_gate lg ON lg.prompt_template_id = pt.id
LEFT JOIN public.v_prompt_template_lifecycle lc ON lc.prompt_template_id = pt.id;

-- ============================================
-- 4) Update admin RPC sort whitelist
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
    'updated_at','created_at',
    'executions_7d','success_rate_7d','delta_cr_7d','roi_value_cents_7d','gate_pass','gate_score_7d','last_execute_at',
    'executions_30d','completion_rate_30d','reuse_rate_30d','delta_cr_30d','prompt_paid_rate_30d','t_first_success_median_sec_30d',
    'model_id','role','version'
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
  RAISE NOTICE '✅ Migration 124 completed: gate_score_7d + lifecycle recommendation (admin list + RPC updated)';
END $$;

