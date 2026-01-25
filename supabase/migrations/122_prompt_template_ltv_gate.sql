-- 122_prompt_template_ltv_gate.sql
-- Turns 4 LTV metrics into a simple Red/Yellow/Green gate for quick admin decisions.
--
-- Inputs (from v_prompt_template_ltv_30d):
-- - t_first_success_median_sec_30d (seconds)
-- - completion_rate_30d (0-1)
-- - reuse_rate_30d (0-1)
-- - delta_cr_30d (0-1, can be negative)

-- ============================================
-- 1) LTV Gate view (R/Y/G)
-- ============================================
CREATE OR REPLACE VIEW public.v_prompt_template_ltv_gate AS
SELECT
  l.prompt_template_id,
  l.executions_30d,
  l.prompt_users_30d,
  l.t_first_success_median_sec_30d,
  l.completion_rate_30d,
  l.reuse_rate_30d,
  l.delta_cr_30d,
  CASE
    -- RED: any hard-fail
    WHEN l.completion_rate_30d < 0.65
      OR COALESCE(l.t_first_success_median_sec_30d, 999999) > 180
      OR l.reuse_rate_30d < 0.15
      OR l.delta_cr_30d < 0
    THEN 'RED'

    -- GREEN: all strong-pass
    WHEN COALESCE(l.t_first_success_median_sec_30d, 999999) <= 60
      AND l.completion_rate_30d >= 0.80
      AND l.reuse_rate_30d >= 0.30
      AND l.delta_cr_30d > 0
    THEN 'GREEN'

    ELSE 'YELLOW'
  END AS ltv_gate_color
FROM public.v_prompt_template_ltv_30d l;

-- ============================================
-- 2) Extend admin list view with ltv_gate_color
-- ============================================
-- NOTE: keep re-runnable and avoid "cannot drop columns from view"
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
  l.t_first_success_avg_sec_30d,

  -- Gate (R/Y/G)
  lg.ltv_gate_color
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
LEFT JOIN public.v_prompt_template_ltv_gate lg ON lg.prompt_template_id = pt.id;

-- ============================================
-- 3) Recreate admin RPC (same signature; keeps existing API stable)
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
  RAISE NOTICE '✅ Migration 122 completed: LTV gate (R/Y/G) + admin list column ltv_gate_color';
END $$;

