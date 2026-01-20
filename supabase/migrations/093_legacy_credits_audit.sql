-- 093_legacy_credits_audit.sql
-- Audit table and trigger for users.credits writes, to support legacy_credits_write_events

BEGIN;

CREATE TABLE IF NOT EXISTS public.legacy_credits_audit (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL,
  old_credits integer,
  new_credits integer,
  source text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.audit_users_credits_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.credits IS DISTINCT FROM OLD.credits THEN
    INSERT INTO public.legacy_credits_audit(user_id, old_credits, new_credits, source)
    VALUES (OLD.id, OLD.credits, NEW.credits, current_setting('application_name', true));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_users_credits_change ON public.users;
CREATE TRIGGER trg_audit_users_credits_change
AFTER UPDATE OF credits ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.audit_users_credits_change();

COMMIT;

