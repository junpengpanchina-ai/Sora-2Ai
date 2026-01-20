-- 092_admin_credit_mismatch_view.sql
-- VIEW for legacy users.credits vs wallets mismatch (read-only, admin-only via service role)

CREATE OR REPLACE VIEW public.admin_credit_mismatch AS
SELECT
  u.id AS user_id,
  u.email,
  COALESCE(u.credits, 0) AS legacy_credits,
  COALESCE(w.permanent_credits, 0) AS wallet_permanent,
  COALESCE(w.bonus_credits, 0) AS wallet_bonus,
  (COALESCE(w.permanent_credits, 0) + COALESCE(w.bonus_credits, 0)) AS wallet_total,
  (COALESCE(u.credits, 0) - (COALESCE(w.permanent_credits, 0) + COALESCE(w.bonus_credits, 0))) AS diff,
  ABS(COALESCE(u.credits, 0) - (COALESCE(w.permanent_credits, 0) + COALESCE(w.bonus_credits, 0))) AS abs_diff
FROM public.users u
LEFT JOIN public.wallets w ON w.user_id = u.id
WHERE COALESCE(u.credits, 0) <> 0
  AND (COALESCE(w.permanent_credits, 0) + COALESCE(w.bonus_credits, 0)) <> COALESCE(u.credits, 0);


