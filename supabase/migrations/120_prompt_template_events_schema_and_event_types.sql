-- 120_prompt_template_events_schema_and_event_types.sql
-- Normalize prompt_template_events schema for stable LTV metrics:
-- - add request_id (idempotency)
-- - add props (jsonb payload)
-- - expand event_type whitelist (strict, stable naming)

-- 1) Add columns (non-breaking)
ALTER TABLE public.prompt_template_events
  ADD COLUMN IF NOT EXISTS request_id TEXT;

ALTER TABLE public.prompt_template_events
  ADD COLUMN IF NOT EXISTS props JSONB NOT NULL DEFAULT '{}'::JSONB;

-- 2) Ensure event_type whitelist is strict and extensible
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'prompt_template_events_event_type_check'
      AND conrelid = 'public.prompt_template_events'::regclass
  ) THEN
    ALTER TABLE public.prompt_template_events
      DROP CONSTRAINT prompt_template_events_event_type_check;
  END IF;
END $$;

ALTER TABLE public.prompt_template_events
  ADD CONSTRAINT prompt_template_events_event_type_check
  CHECK (
    event_type IN (
      -- core (LTV)
      'execute',
      'success',
      'failure',
      'paid',
      -- exposure
      'impression',
      -- optional but recommended (reuse / AB / habit signals)
      'variant_shown',
      'variant_generate',
      'favorite',
      'reuse'
    )
  );

-- 3) Indexes for queries / dashboards
CREATE INDEX IF NOT EXISTS idx_pte_prompt_occurred_at ON public.prompt_template_events(prompt_template_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_pte_user_occurred_at ON public.prompt_template_events(user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_pte_session ON public.prompt_template_events(session_id);

-- Idempotency key (optional): prevent duplicate inserts when request_id is provided
CREATE UNIQUE INDEX IF NOT EXISTS idx_pte_request_id_unique
  ON public.prompt_template_events(request_id)
  WHERE request_id IS NOT NULL;

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 120 completed: prompt_template_events request_id+props + strict event_type whitelist';
END $$;

