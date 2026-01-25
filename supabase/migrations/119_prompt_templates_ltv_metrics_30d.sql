-- 119_prompt_templates_ltv_metrics_30d.sql
-- Adds 30d LTV-driving metrics for prompt templates:
-- - T_first_success (median/avg seconds)
-- - completion_rate (success/execute)
-- - reuse_rate (users with >=2 executes / users executed)
-- - delta_cr (prompt paid rate - baseline nonprompt paid rate)
--
-- Notes:
-- - Uses prompt_template_events as the fact table (event_type includes: execute|success|paid|failure|impression)
-- - Uses app_metrics_daily for the non-prompt baseline (nonprompt_users, nonprompt_paid_users, ltv_cents)
-- - Window: rolling last 30 days

-- ============================================
-- 1) User-level first success latency (30d)
-- ============================================
CREATE OR REPLACE VIEW public.v_prompt_template_user_first_success_30d AS
WITH first_exec AS (
  SELECT
    user_id,
    prompt_template_id,
    MIN(occurred_at) AS first_exec_at
  FROM public.prompt_template_events
  WHERE occurred_at >= NOW() - INTERVAL '30 days'
    AND user_id IS NOT NULL
    AND prompt_template_id IS NOT NULL
    AND event_type = 'execute'
  GROUP BY 1, 2
),
first_success AS (
  SELECT
    e.user_id,
    e.prompt_template_id,
    MIN(e.occurred_at) AS first_success_at
  FROM public.prompt_template_events e
  JOIN first_exec x
    ON x.user_id = e.user_id
   AND x.prompt_template_id = e.prompt_template_id
  WHERE e.occurred_at >= NOW() - INTERVAL '30 days'
    AND e.occurred_at >= x.first_exec_at
    AND e.event_type = 'success'
  GROUP BY 1, 2
)
SELECT
  x.user_id,
  x.prompt_template_id,
  x.first_exec_at,
  s.first_success_at,
  EXTRACT(EPOCH FROM (s.first_success_at - x.first_exec_at))::INT AS t_first_success_sec
FROM first_exec x
JOIN first_success s
  ON s.user_id = x.user_id
 AND s.prompt_template_id = x.prompt_template_id
WHERE s.first_success_at IS NOT NULL;

-- ============================================
-- 2) Prompt-template level LTV metrics (30d)
-- ============================================
CREATE OR REPLACE VIEW public.v_prompt_template_ltv_30d AS
WITH window_events AS (
  SELECT
    prompt_template_id,
    user_id,
    event_type
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
    COUNT(*) FILTER (WHERE event_type = 'paid') AS paid_cnt
  FROM window_events
  WHERE user_id IS NOT NULL
  GROUP BY 1, 2
),
agg_users AS (
  SELECT
    prompt_template_id,
    COUNT(*) FILTER (WHERE exec_cnt > 0) AS prompt_users_30d,
    COUNT(*) FILTER (WHERE exec_cnt > 0 AND paid_cnt > 0) AS prompt_paid_users_30d,
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

-- ============================================
-- 3) Extend admin list view with 30d LTV columns
-- ============================================
-- NOTE: Postgres限制：CREATE OR REPLACE VIEW 不能“删除列/改变已有列定义”。
-- 如果你之前手动改过 v_prompt_templates_admin_list（列更多/不同），会报：
--   ERROR: 42P16: cannot drop columns from view
-- 解决：先 DROP VIEW 再重建（这里做成可重复执行）。
DROP VIEW IF EXISTS public.v_prompt_templates_admin_list CASCADE;
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
  COALESCE(ab.variant_count_14d, 0) AS variant_count_14d,

  -- LTV-driving (30d)
  l.executions_30d,
  l.completion_rate_30d,
  l.reuse_rate_30d,
  l.delta_cr_30d,
  l.prompt_paid_rate_30d,
  l.baseline_paid_rate_30d,
  l.t_first_success_median_sec_30d,
  l.t_first_success_avg_sec_30d
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
LEFT JOIN public.v_prompt_template_ltv_30d l ON l.prompt_template_id = pt.id;

-- ============================================
-- 4) Update admin RPC to allow sorting by new columns
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
    'executions_7d','success_rate_7d','delta_cr_7d','roi_value_cents_7d','gate_pass',
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
  RAISE NOTICE '✅ Migration 119 completed: 30d LTV views + admin RPC sort fields';
END $$;

