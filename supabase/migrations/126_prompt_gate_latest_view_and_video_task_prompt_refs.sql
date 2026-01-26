-- 126_prompt_gate_latest_view_and_video_task_prompt_refs.sql
-- Adds:
-- - video_tasks.prompt_template_id + scene_id + variant_label (bridge prompt assets into video generation chain)
-- - v_prompt_gate_latest (latest snapshot per prompt_template_id for fast admin queries)

-- ============================================
-- 1) video_tasks: link back to prompt template
-- ============================================
-- NOTE: Do NOT add FK constraints here.
-- This is a low-level generation pipeline table; we only need attribution, not referential enforcement.
-- FK constraints could turn transient data issues into hard failures (bad for production generation reliability).
ALTER TABLE public.video_tasks
  ADD COLUMN IF NOT EXISTS prompt_template_id UUID;

ALTER TABLE public.video_tasks
  ADD COLUMN IF NOT EXISTS scene_id UUID;

ALTER TABLE public.video_tasks
  ADD COLUMN IF NOT EXISTS variant_label TEXT;

CREATE INDEX IF NOT EXISTS idx_video_tasks_prompt_template ON public.video_tasks(prompt_template_id);
CREATE INDEX IF NOT EXISTS idx_video_tasks_scene ON public.video_tasks(scene_id);

-- ============================================
-- 2) Latest gate snapshot view (one row per prompt)
-- ============================================
DROP VIEW IF EXISTS public.v_prompt_gate_latest;
CREATE VIEW public.v_prompt_gate_latest AS
SELECT DISTINCT ON (s.prompt_template_id)
  s.prompt_template_id AS prompt_id,
  s.created_at AS gated_at,
  s.window_start,
  s.window_end,
  s.usage_count,
  s.success_count,
  s.failure_count AS fail_count,
  s.moderation_count,
  s.third_party_count,
  s.success_rate,
  s.efficiency AS eff,
  s.roi_proxy,
  s.gate_score,
  s.gate_status,
  s.decisions
FROM public.prompt_gate_snapshots s
ORDER BY s.prompt_template_id, s.window_end DESC, s.created_at DESC;

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 126 completed: v_prompt_gate_latest + video_tasks prompt refs';
END $$;

