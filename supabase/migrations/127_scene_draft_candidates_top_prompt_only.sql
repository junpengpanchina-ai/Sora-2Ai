-- 127_scene_draft_candidates_top_prompt_only.sql
-- Scene Draft promotion rule:
-- Only prompts that are top_prompt + green + active + not frozen are eligible to be attached to Scene Draft.

DROP VIEW IF EXISTS public.v_scene_draft_prompt_candidates;
CREATE VIEW public.v_scene_draft_prompt_candidates AS
SELECT
  pt.id AS prompt_template_id,
  pt.scene_id,
  pt.model_id,
  pt.role,
  pt.version,
  pt.top_prompt,
  pt.is_active,
  pt.gate_status,
  pt.gate_score,
  pt.freeze_until,
  pt.last_gated_at,
  pt.last_used_at
FROM public.prompt_templates pt
WHERE pt.top_prompt = TRUE
  AND pt.is_active = TRUE
  AND pt.gate_status = 'green'
  AND (pt.freeze_until IS NULL OR pt.freeze_until <= NOW());

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 127 completed: v_scene_draft_prompt_candidates (top_prompt only)';
END $$;

