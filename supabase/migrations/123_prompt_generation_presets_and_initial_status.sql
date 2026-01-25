-- 123_prompt_generation_presets_and_initial_status.sql
-- Prompt asset automation presets + initial publish/rollout controls for generated prompt_templates.

-- ============================================
-- 1) Presets table
-- ============================================
CREATE TABLE IF NOT EXISTS public.prompt_generation_presets (
  preset_id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  config JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column'
  ) THEN
    DROP TRIGGER IF EXISTS trg_prompt_generation_presets_updated_at ON public.prompt_generation_presets;
    CREATE TRIGGER trg_prompt_generation_presets_updated_at
      BEFORE UPDATE ON public.prompt_generation_presets
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Seed: LOCKDOWN preset (15 industries x 4 scenes x (2 baseline + 2 variant) = 240 prompts)
INSERT INTO public.prompt_generation_presets (preset_id, display_name, description, enabled, config)
VALUES (
  'lockdown_core_15x4',
  'LOCKDOWN · Core Prompt Expansion (15x4)',
  'Safe prompt asset expansion during SEO lockdown. Global prompts only; gated by LTV + SEO isolation.',
  TRUE,
  '{
    "scenes": ["ad_promo","product_explainer","social_short","landing_hero"],
    "industries": [
      "ecommerce","mobile_apps","saas","local_business","education","fitness","real_estate","travel","gaming","finance",
      "ai_tools","social_creators","restaurants","beauty_skincare","corporate_branding"
    ],
    "generation_plan": { "baseline_per_cell": 2, "variant_per_cell": 2 },
    "model_strategy": { "baseline": "gemini-2.5-flash", "variant": "gemini-3-flash", "fallback": "gemini-3-pro" },
    "locale": "en",
    "owner_scope": "global",
    "model_id": "sora",
    "baseline_role": "default",
    "variant_role": "high_quality",
    "hard_limits": { "max_total_prompts": 300, "max_active_prompts": 500 },
    "initial_status": { "status": "active", "is_published": true, "rollout_pct": 10, "weight": 1 }
  }'::JSONB
)
ON CONFLICT (preset_id) DO NOTHING;

-- ============================================
-- 2) prompt_generation_tasks: initial output controls + preset reference
-- ============================================
ALTER TABLE public.prompt_generation_tasks
  ADD COLUMN IF NOT EXISTS preset_id TEXT REFERENCES public.prompt_generation_presets(preset_id) ON DELETE SET NULL;

ALTER TABLE public.prompt_generation_tasks
  ADD COLUMN IF NOT EXISTS initial_status TEXT NOT NULL DEFAULT 'draft' CHECK (initial_status IN ('draft','active','deprecated'));

ALTER TABLE public.prompt_generation_tasks
  ADD COLUMN IF NOT EXISTS initial_is_published BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.prompt_generation_tasks
  ADD COLUMN IF NOT EXISTS initial_weight INTEGER NOT NULL DEFAULT 100 CHECK (initial_weight >= 0 AND initial_weight <= 1000);

ALTER TABLE public.prompt_generation_tasks
  ADD COLUMN IF NOT EXISTS initial_rollout_pct INTEGER NOT NULL DEFAULT 100 CHECK (initial_rollout_pct >= 0 AND initial_rollout_pct <= 100);

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 123 completed: prompt_generation_presets + initial status/publish controls';
END $$;

