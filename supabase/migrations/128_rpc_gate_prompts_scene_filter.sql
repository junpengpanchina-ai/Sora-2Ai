-- 128_rpc_gate_prompts_scene_filter.sql
-- Adds optional scene filter to rpc_gate_prompts.
--
-- Important:
-- - We MUST drop the old 2-arg function to avoid ambiguity when calling via supabase.rpc(...).
-- - When p_scene_id is provided, we DO NOT write back to prompt_templates and DO NOT insert prompt_gate_snapshots.
--   Otherwise a "scene-only gate run" could overwrite global asset fields or pollute latest snapshots.

DROP FUNCTION IF EXISTS public.rpc_gate_prompts(INTEGER, BOOLEAN);

CREATE OR REPLACE FUNCTION public.rpc_gate_prompts(
  p_window_days INTEGER DEFAULT 7,
  p_writeback BOOLEAN DEFAULT TRUE,
  p_scene_id UUID DEFAULT NULL
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
  v_global_writeback BOOLEAN := (p_writeback = TRUE AND p_scene_id IS NULL);
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
      AND (p_scene_id IS NULL OR e.scene_id = p_scene_id)
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
  )
  SELECT
    s.prompt_template_id,
    s.usage_count,
    s.success_rate,
    s.gate_score,
    s.gate_status,
    s.kill_reason
  FROM scored s;

  IF v_global_writeback THEN
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
      s.success_rate,
      0,
      s.gate_score,
      s.gate_status,
      jsonb_build_object(
        'window_days', p_window_days,
        'formula', '0.6*S + 0.4*ln(U+1)/ln(101)',
        'kill_reason', s.kill_reason
      )
    FROM (
      SELECT * FROM scored
    ) s;

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
      SELECT
        prompt_template_id,
        usage_count,
        success_rate,
        gate_score,
        gate_status,
        kill_reason,
        last_used_at
      FROM scored
    ) x
    WHERE pt.id = x.prompt_template_id;
  END IF;
END;
$$;

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 128 completed: rpc_gate_prompts supports p_scene_id (no writeback for scene runs)';
END $$;

