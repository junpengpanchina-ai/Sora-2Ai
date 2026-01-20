-- P2 Step 3: 影子校验 — 双读比对，只查不写，用于日志 / Admin
-- 建议：cron 每日或 Admin 手动触发

SELECT
  u.id AS user_id,
  u.credits AS legacy_credits,
  COALESCE(w.permanent_credits, 0) AS wallet_permanent,
  COALESCE(w.bonus_credits, 0) AS wallet_bonus,
  (COALESCE(w.permanent_credits, 0) + COALESCE(w.bonus_credits, 0)) AS wallet_total,
  u.credits - (COALESCE(w.permanent_credits, 0) + COALESCE(w.bonus_credits, 0)) AS diff
FROM users u
LEFT JOIN public.wallets w ON w.user_id = u.id
WHERE u.credits IS NOT NULL AND u.credits != 0
  AND (COALESCE(w.permanent_credits, 0) + COALESCE(w.bonus_credits, 0)) != u.credits;
