-- 121_paid_logic_from_revenue_cents.sql
-- Align "paid users" logic with real schema: use revenue_cents > 0 (and stay compatible with event_type='paid' if present)
--
-- Why:
-- - Some clients prefer not to emit a dedicated 'paid' event_type.
-- - prompt_template_events already has revenue_cents, which is a stable, future-proof signal.

-- ============================================
-- 1) Patch 7d ROI view to treat revenue_cents > 0 as "paid"
-- ============================================
CREATE OR REPLACE VIEW public.v_prompt_template_7d_roi AS
WITH p AS (
  SELECT
    prompt_template_id,
    COUNT(DISTINCT user_id) FILTER (WHERE event_type = 'execute') AS prompt_users_7d,
    COUNT(DISTINCT user_id) FILTER (
      WHERE (revenue_cents > 0) OR (event_type = 'paid')
    ) AS prompt_paid_users_7d
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

-- ============================================
-- 2) Add compatibility view names (optional)
-- ============================================
CREATE OR REPLACE VIEW public.v_prompt_template_user_first_success AS
SELECT
  user_id,
  prompt_template_id,
  first_exec_at,
  first_success_at,
  t_first_success_sec
FROM public.v_prompt_template_user_first_success_30d;

-- ============================================
-- 3) Patch 30d LTV view to treat revenue_cents > 0 as "paid"
-- ============================================
CREATE OR REPLACE VIEW public.v_prompt_template_ltv_30d AS
WITH window_events AS (
  SELECT
    prompt_template_id,
    user_id,
    event_type,
    revenue_cents
  FROM public.prompt_template_events
  WHERE occurred_at >= NOW() - INTERVAL '30 days'
    AND prompt_template_id IS NOT NULL
),
agg_events AS (
  SELECT
    prompt_template_id,
    COUNT(*) FILTER (WHERE event_type = 'execute') AS executions_30d,
    COUNT(*) FILTER (WHERE event_type = 'success') AS success_30d
  FROM window_events
  GROUP BY 1
),
per_user AS (
  SELECT
    prompt_template_id,
    user_id,
    COUNT(*) FILTER (WHERE event_type = 'execute') AS exec_cnt,
    SUM(COALESCE(revenue_cents, 0)) AS revenue_cents_30d,
    COUNT(*) FILTER (WHERE event_type = 'paid') AS paid_cnt
  FROM window_events
  WHERE user_id IS NOT NULL
  GROUP BY 1, 2
),
agg_users AS (
  SELECT
    prompt_template_id,
    COUNT(*) FILTER (WHERE exec_cnt > 0) AS prompt_users_30d,
    COUNT(*) FILTER (WHERE exec_cnt > 0 AND (revenue_cents_30d > 0 OR paid_cnt > 0)) AS prompt_paid_users_30d,
    COUNT(*) FILTER (WHERE exec_cnt >= 2) AS reused_users_30d
  FROM per_user
  GROUP BY 1
),
baseline AS (
  SELECT
    COALESCE(SUM(nonprompt_paid_users), 0)::NUMERIC AS nonprompt_paid_users_30d,
    COALESCE(SUM(nonprompt_users), 0)::NUMERIC AS nonprompt_users_30d,
    COALESCE(MAX(ltv_cents), 0) AS ltv_cents
  FROM public.app_metrics_daily
  WHERE date >= (NOW() - INTERVAL '30 days')::DATE
),
t AS (
  SELECT
    prompt_template_id,
    percentile_cont(0.5) WITHIN GROUP (ORDER BY t_first_success_sec) AS t_first_success_median_sec_30d,
    AVG(t_first_success_sec)::NUMERIC(10, 2) AS t_first_success_avg_sec_30d
  FROM public.v_prompt_template_user_first_success_30d
  GROUP BY 1
),
calc AS (
  SELECT
    COALESCE(e.prompt_template_id, u.prompt_template_id) AS prompt_template_id,

    COALESCE(e.executions_30d, 0) AS executions_30d,
    COALESCE(e.success_30d, 0) AS success_30d,

    COALESCE(u.prompt_users_30d, 0) AS prompt_users_30d,
    COALESCE(u.prompt_paid_users_30d, 0) AS prompt_paid_users_30d,
    COALESCE(u.reused_users_30d, 0) AS reused_users_30d,

    CASE WHEN COALESCE(e.executions_30d, 0) = 0 THEN 0
         ELSE COALESCE(e.success_30d, 0)::NUMERIC / COALESCE(e.executions_30d, 0)::NUMERIC END AS completion_rate_30d,

    CASE WHEN COALESCE(u.prompt_users_30d, 0) = 0 THEN 0
         ELSE COALESCE(u.reused_users_30d, 0)::NUMERIC / COALESCE(u.prompt_users_30d, 0)::NUMERIC END AS reuse_rate_30d,

    CASE WHEN COALESCE(u.prompt_users_30d, 0) = 0 THEN 0
         ELSE COALESCE(u.prompt_paid_users_30d, 0)::NUMERIC / COALESCE(u.prompt_users_30d, 0)::NUMERIC END AS prompt_paid_rate_30d,

    CASE WHEN b.nonprompt_users_30d = 0 THEN 0
         ELSE b.nonprompt_paid_users_30d / b.nonprompt_users_30d END AS baseline_paid_rate_30d,

    (
      CASE WHEN COALESCE(u.prompt_users_30d, 0) = 0 THEN 0
           ELSE COALESCE(u.prompt_paid_users_30d, 0)::NUMERIC / COALESCE(u.prompt_users_30d, 0)::NUMERIC END
      -
      CASE WHEN b.nonprompt_users_30d = 0 THEN 0
           ELSE b.nonprompt_paid_users_30d / b.nonprompt_users_30d END
    ) AS delta_cr_30d,

    b.ltv_cents
  FROM agg_events e
  FULL OUTER JOIN agg_users u
    ON u.prompt_template_id = e.prompt_template_id
  CROSS JOIN baseline b
)
SELECT
  c.*,
  t.t_first_success_median_sec_30d,
  t.t_first_success_avg_sec_30d
FROM calc c
LEFT JOIN t ON t.prompt_template_id = c.prompt_template_id;

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 121 completed: paid users derived from revenue_cents (compatible with event_type=paid)';
END $$;

