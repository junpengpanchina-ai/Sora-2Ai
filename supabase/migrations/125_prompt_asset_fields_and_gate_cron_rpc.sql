-- 125_prompt_asset_fields_and_gate_cron_rpc.sql
-- Implements "Prompt as Asset" governance:
-- - Add asset lifecycle fields to prompt_templates (is_active, gate_status, gate_score, freeze_until, etc.)
-- - Add snapshots table prompt_gate_snapshots (materialized metrics window)
-- - Add RPC:
--    - rpc_gate_prompts(window_days, writeback) -> computes Gate + optional writeback + snapshot insert
--    - rpc_apply_prompt_retention(freeze_days) -> applies soft/hard retention based on latest snapshot
-- - Ensure runtime selection respects is_active & freeze_until

-- ============================================
-- 1) prompt_templates: asset fields (minimal invasion)
-- ============================================
ALTER TABLE public.prompt_templates
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE public.prompt_templates
  ADD COLUMN IF NOT EXISTS gate_status TEXT NOT NULL DEFAULT 'unknown'
    CHECK (gate_status IN ('unknown','green','yellow','red'));

ALTER TABLE public.prompt_templates
  ADD COLUMN IF NOT EXISTS gate_score NUMERIC NOT NULL DEFAULT 0;

ALTER TABLE public.prompt_templates
  ADD COLUMN IF NOT EXISTS last_gated_at TIMESTAMPTZ;

ALTER TABLE public.prompt_templates
  ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ;

ALTER TABLE public.prompt_templates
  ADD COLUMN IF NOT EXISTS kill_reason TEXT;

ALTER TABLE public.prompt_templates
  ADD COLUMN IF NOT EXISTS top_prompt BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.prompt_templates
  ADD COLUMN IF NOT EXISTS freeze_until TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_prompt_templates_gate_status ON public.prompt_templates(gate_status);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_top_prompt ON public.prompt_templates(top_prompt);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_is_active ON public.prompt_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_freeze_until ON public.prompt_templates(freeze_until);

-- ============================================
-- 2) Snapshots table (fast admin + trends)
-- ============================================
CREATE TABLE IF NOT EXISTS public.prompt_gate_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,

  prompt_template_id UUID NOT NULL REFERENCES public.prompt_templates(id) ON DELETE CASCADE,

  usage_count INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  failure_count INTEGER NOT NULL DEFAULT 0,
  moderation_count INTEGER NOT NULL DEFAULT 0,
  third_party_count INTEGER NOT NULL DEFAULT 0,

  success_rate NUMERIC NOT NULL DEFAULT 0,
  efficiency NUMERIC NOT NULL DEFAULT 0,
  roi_proxy NUMERIC NOT NULL DEFAULT 0,

  gate_score NUMERIC NOT NULL DEFAULT 0,
  gate_status TEXT NOT NULL DEFAULT 'unknown' CHECK (gate_status IN ('green','yellow','red','unknown')),

  decisions JSONB NOT NULL DEFAULT '{}'::JSONB
);

CREATE INDEX IF NOT EXISTS idx_prompt_gate_snapshots_prompt_time
  ON public.prompt_gate_snapshots(prompt_template_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_prompt_gate_snapshots_window
  ON public.prompt_gate_snapshots(window_end DESC);

-- ============================================
-- 3) Helper: classify failure types from events.props (best-effort)
-- ============================================
-- We reuse public.prompt_template_events as the canonical fact table.
-- Expected optional fields:
--   props.failure_type ∈ {'moderation','third_party','provider_5xx','timeout',...}
--   props.provider / props.model / etc.

-- ============================================
-- 4) RPC: Gate computation (+ optional writeback + snapshot)
-- ============================================
CREATE OR REPLACE FUNCTION public.rpc_gate_prompts(
  p_window_days INTEGER DEFAULT 7,
  p_writeback BOOLEAN DEFAULT TRUE
)
RETURNS TABLE (
  prompt_template_id UUID,
  usage_count INTEGER,
  success_rate NUMERIC,
  gate_score NUMERIC,
  gate_status TEXT,
  kill_reason TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start TIMESTAMPTZ := NOW() - (GREATEST(p_window_days, 1)::TEXT || ' days')::INTERVAL;
  v_end   TIMESTAMPTZ := NOW();
BEGIN
  RETURN QUERY
  WITH agg AS (
    SELECT
      e.prompt_template_id,
      COUNT(*) FILTER (WHERE e.event_type = 'execute')::INT AS usage_count,
      COUNT(*) FILTER (WHERE e.event_type = 'success')::INT AS success_count,
      COUNT(*) FILTER (WHERE e.event_type = 'failure')::INT AS failure_count,
      COUNT(*) FILTER (
        WHERE e.event_type = 'failure' AND COALESCE(e.props->>'failure_type','') = 'moderation'
      )::INT AS moderation_count,
      COUNT(*) FILTER (
        WHERE e.event_type = 'failure' AND COALESCE(e.props->>'failure_type','') = 'third_party'
      )::INT AS third_party_count,
      MAX(e.occurred_at) FILTER (WHERE e.event_type = 'execute') AS last_used_at
    FROM public.prompt_template_events e
    WHERE e.prompt_template_id IS NOT NULL
      AND e.occurred_at >= v_start
      AND e.occurred_at < v_end
    GROUP BY e.prompt_template_id
  ),
  metrics AS (
    SELECT
      a.prompt_template_id,
      a.usage_count,
      a.success_count,
      a.failure_count,
      a.moderation_count,
      a.third_party_count,
      a.last_used_at,
      CASE WHEN a.usage_count = 0 THEN 0
           ELSE (a.success_count::NUMERIC / a.usage_count::NUMERIC)
      END AS success_rate
    FROM agg a
  ),
  scored AS (
    SELECT
      m.*,
      -- GateScore = 0.6*S + 0.4*log(U+1) normalized. Cap usage component at U>=100 for stability.
      (
        0.6 * m.success_rate
        + 0.4 * LEAST(1, LN(m.usage_count + 1) / LN(101))
      ) AS gate_score,
      CASE
        -- Hard kill
        WHEN m.usage_count >= 20 AND m.success_rate < 0.15 THEN 'red'
        WHEN m.moderation_count >= 3 THEN 'red'
        WHEN m.failure_count >= 10 AND m.success_count = 0 THEN 'red'

        -- Green (must have samples)
        WHEN m.usage_count >= 20 AND (
          0.6 * m.success_rate + 0.4 * LEAST(1, LN(m.usage_count + 1) / LN(101))
        ) >= 0.65 THEN 'green'

        -- Yellow band
        WHEN (
          0.6 * m.success_rate + 0.4 * LEAST(1, LN(m.usage_count + 1) / LN(101))
        ) >= 0.35 THEN 'yellow'

        ELSE 'red'
      END AS gate_status,
      CASE
        WHEN m.usage_count >= 20 AND m.success_rate < 0.15 THEN 'hard_kill_low_success'
        WHEN m.moderation_count >= 3 THEN 'hard_kill_moderation'
        WHEN m.failure_count >= 10 AND m.success_count = 0 THEN 'hard_kill_consecutive_failures'
        ELSE NULL
      END AS kill_reason
    FROM metrics m
  )
  SELECT
    s.prompt_template_id,
    s.usage_count,
    s.success_rate,
    s.gate_score,
    s.gate_status,
    s.kill_reason
  FROM scored s;

  IF p_writeback THEN
    -- Snapshot insert (window)
    INSERT INTO public.prompt_gate_snapshots (
      window_start, window_end, prompt_template_id,
      usage_count, success_count, failure_count, moderation_count, third_party_count,
      success_rate, efficiency, roi_proxy,
      gate_score, gate_status, decisions
    )
    SELECT
      v_start, v_end, s.prompt_template_id,
      s.usage_count, s.success_count, s.failure_count, s.moderation_count, s.third_party_count,
      s.success_rate,
      s.success_rate, -- efficiency (LOCKDOWN simplified)
      0,              -- roi_proxy (LOCKDOWN default)
      s.gate_score,
      s.gate_status,
      jsonb_build_object(
        'window_days', p_window_days,
        'formula', '0.6*S + 0.4*ln(U+1)/ln(101)',
        'kill_reason', s.kill_reason
      )
    FROM (
      WITH agg AS (
        SELECT
          e.prompt_template_id,
          COUNT(*) FILTER (WHERE e.event_type = 'execute')::INT AS usage_count,
          COUNT(*) FILTER (WHERE e.event_type = 'success')::INT AS success_count,
          COUNT(*) FILTER (WHERE e.event_type = 'failure')::INT AS failure_count,
          COUNT(*) FILTER (
            WHERE e.event_type = 'failure' AND COALESCE(e.props->>'failure_type','') = 'moderation'
          )::INT AS moderation_count,
          COUNT(*) FILTER (
            WHERE e.event_type = 'failure' AND COALESCE(e.props->>'failure_type','') = 'third_party'
          )::INT AS third_party_count,
          MAX(e.occurred_at) FILTER (WHERE e.event_type = 'execute') AS last_used_at
        FROM public.prompt_template_events e
        WHERE e.prompt_template_id IS NOT NULL
          AND e.occurred_at >= v_start
          AND e.occurred_at < v_end
        GROUP BY e.prompt_template_id
      ),
      metrics AS (
        SELECT
          a.*,
          CASE WHEN a.usage_count = 0 THEN 0
               ELSE (a.success_count::NUMERIC / a.usage_count::NUMERIC)
          END AS success_rate
        FROM agg a
      )
      SELECT
        m.prompt_template_id,
        m.usage_count,
        m.success_count,
        m.failure_count,
        m.moderation_count,
        m.third_party_count,
        m.last_used_at,
        m.success_rate,
        (
          0.6 * m.success_rate
          + 0.4 * LEAST(1, LN(m.usage_count + 1) / LN(101))
        ) AS gate_score,
        CASE
          WHEN m.usage_count >= 20 AND m.success_rate < 0.15 THEN 'red'
          WHEN m.moderation_count >= 3 THEN 'red'
          WHEN m.failure_count >= 10 AND m.success_count = 0 THEN 'red'
          WHEN m.usage_count >= 20 AND (
            0.6 * m.success_rate + 0.4 * LEAST(1, LN(m.usage_count + 1) / LN(101))
          ) >= 0.65 THEN 'green'
          WHEN (
            0.6 * m.success_rate + 0.4 * LEAST(1, LN(m.usage_count + 1) / LN(101))
          ) >= 0.35 THEN 'yellow'
          ELSE 'red'
        END AS gate_status,
        CASE
          WHEN m.usage_count >= 20 AND m.success_rate < 0.15 THEN 'hard_kill_low_success'
          WHEN m.moderation_count >= 3 THEN 'hard_kill_moderation'
          WHEN m.failure_count >= 10 AND m.success_count = 0 THEN 'hard_kill_consecutive_failures'
          ELSE NULL
        END AS kill_reason
      FROM metrics m
    ) s;

    -- Writeback to prompt_templates (asset fields)
    UPDATE public.prompt_templates pt
    SET
      last_gated_at = v_end,
      last_used_at = COALESCE(x.last_used_at, pt.last_used_at),
      gate_score = COALESCE(x.gate_score, 0),
      gate_status = COALESCE(x.gate_status, 'unknown'),
      kill_reason = COALESCE(x.kill_reason, pt.kill_reason),
      is_active = CASE WHEN x.kill_reason IS NOT NULL THEN FALSE ELSE pt.is_active END,
      top_prompt = CASE
        WHEN x.usage_count >= 50 AND x.success_rate >= 0.65 AND x.gate_score >= 0.70 THEN TRUE
        ELSE pt.top_prompt
      END
    FROM (
      WITH agg AS (
        SELECT
          e.prompt_template_id,
          COUNT(*) FILTER (WHERE e.event_type = 'execute')::INT AS usage_count,
          COUNT(*) FILTER (WHERE e.event_type = 'success')::INT AS success_count,
          COUNT(*) FILTER (WHERE e.event_type = 'failure')::INT AS failure_count,
          COUNT(*) FILTER (
            WHERE e.event_type = 'failure' AND COALESCE(e.props->>'failure_type','') = 'moderation'
          )::INT AS moderation_count,
          MAX(e.occurred_at) FILTER (WHERE e.event_type = 'execute') AS last_used_at
        FROM public.prompt_template_events e
        WHERE e.prompt_template_id IS NOT NULL
          AND e.occurred_at >= v_start
          AND e.occurred_at < v_end
        GROUP BY e.prompt_template_id
      ),
      metrics AS (
        SELECT
          a.*,
          CASE WHEN a.usage_count = 0 THEN 0
               ELSE (a.success_count::NUMERIC / a.usage_count::NUMERIC)
          END AS success_rate
        FROM agg a
      )
      SELECT
        m.prompt_template_id,
        m.usage_count,
        m.success_rate,
        m.last_used_at,
        (
          0.6 * m.success_rate
          + 0.4 * LEAST(1, LN(m.usage_count + 1) / LN(101))
        ) AS gate_score,
        CASE
          WHEN m.usage_count >= 20 AND m.success_rate < 0.15 THEN 'red'
          WHEN m.moderation_count >= 3 THEN 'red'
          WHEN m.failure_count >= 10 AND m.success_count = 0 THEN 'red'
          WHEN m.usage_count >= 20 AND (
            0.6 * m.success_rate + 0.4 * LEAST(1, LN(m.usage_count + 1) / LN(101))
          ) >= 0.65 THEN 'green'
          WHEN (
            0.6 * m.success_rate + 0.4 * LEAST(1, LN(m.usage_count + 1) / LN(101))
          ) >= 0.35 THEN 'yellow'
          ELSE 'red'
        END AS gate_status,
        CASE
          WHEN m.usage_count >= 20 AND m.success_rate < 0.15 THEN 'hard_kill_low_success'
          WHEN m.moderation_count >= 3 THEN 'hard_kill_moderation'
          WHEN m.failure_count >= 10 AND m.success_count = 0 THEN 'hard_kill_consecutive_failures'
          ELSE NULL
        END AS kill_reason
      FROM metrics m
    ) x
    WHERE pt.id = x.prompt_template_id;
  END IF;
END;
$$;

-- ============================================
-- 5) RPC: Apply retention policy from latest snapshots
-- ============================================
CREATE OR REPLACE FUNCTION public.rpc_apply_prompt_retention(
  p_freeze_days INTEGER DEFAULT 7
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Soft freeze: yellow + enough usage + low success
  UPDATE public.prompt_templates pt
  SET
    freeze_until = NOW() + (GREATEST(p_freeze_days, 1)::TEXT || ' days')::INTERVAL,
    gate_status = 'yellow'
  WHERE pt.is_active = TRUE
    AND pt.id IN (
      SELECT s.prompt_template_id
      FROM public.prompt_gate_snapshots s
      WHERE s.created_at >= NOW() - INTERVAL '1 day'
        AND s.usage_count >= 10
        AND s.success_rate < 0.30
        AND s.gate_status IN ('yellow','red')
    );

  -- Hard deactivate: red snapshot
  UPDATE public.prompt_templates pt
  SET
    is_active = FALSE,
    gate_status = 'red'
  WHERE pt.id IN (
    SELECT s.prompt_template_id
    FROM public.prompt_gate_snapshots s
    WHERE s.created_at >= NOW() - INTERVAL '1 day'
      AND s.gate_status = 'red'
  );
END;
$$;

-- ============================================
-- 6) Runtime selection must respect is_active & freeze_until
-- ============================================
CREATE OR REPLACE FUNCTION public.get_scene_default_prompt_v2(
  scene_uuid UUID,
  model_name TEXT DEFAULT 'veo_fast',
  role_name TEXT DEFAULT 'default'
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  model_id TEXT,
  role TEXT,
  version INTEGER,
  weight INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pt.id,
    pt.content,
    pt.model_id,
    pt.role,
    pt.version,
    pt.weight
  FROM public.prompt_templates pt
  LEFT JOIN public.scene_prompt_bindings spb ON spb.prompt_id = pt.id
  WHERE pt.scene_id = scene_uuid
    AND pt.model_id = model_name
    AND pt.role = role_name
    AND pt.status = 'active'
    AND pt.is_published = TRUE
    AND pt.is_active = TRUE
    AND (pt.freeze_until IS NULL OR pt.freeze_until <= NOW())
    AND (spb.enabled IS NULL OR spb.enabled = TRUE)
  ORDER BY 
    COALESCE(spb.is_default, FALSE) DESC,
    COALESCE(spb.priority, 100) ASC,
    pt.weight DESC,
    pt.version DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7) Extend admin list view with asset fields (keep existing gate_score_7d etc)
-- ============================================
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

  -- Asset fields (writeback)
  pt.is_active,
  pt.gate_status,
  pt.gate_score,
  pt.last_gated_at,
  pt.last_used_at,
  pt.kill_reason,
  pt.top_prompt,
  pt.freeze_until,

  -- 7d analytics/gate (derived)
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

  -- Lifecycle recommendation (derived)
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
-- 8) Update admin RPC whitelist to support new asset fields sorting
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
    'gate_score','gate_status','top_prompt','is_active','freeze_until','last_gated_at','last_used_at',
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
  RAISE NOTICE '✅ Migration 125 completed: prompt asset fields + gate RPC + retention RPC + admin list updated';
END $$;

