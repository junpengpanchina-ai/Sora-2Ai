-- P2 Step 4: 一次性迁移 users.credits → wallets（只补空，不覆盖已有）
-- 执行前：确认 check-recharge 已不写 users.credits，且新支付全走 wallets
-- 建议：先对 wallets、users 做备份或快照

-- 0) 预览：将被迁移的人数（先跑一次看数字）
-- SELECT count(*) AS will_migrate
-- FROM public.users u
-- JOIN public.wallets w ON w.user_id = u.id
-- WHERE coalesce(u.credits, 0) > 0
--   AND (coalesce(w.permanent_credits, 0) + coalesce(w.bonus_credits, 0)) = 0;

-- 1) 为「有 credits、无 wallets」的用户建钱包并直接写入 permanent_credits
INSERT INTO public.wallets (user_id, permanent_credits, bonus_credits, updated_at)
SELECT u.id, u.credits, 0, now()
FROM users u
LEFT JOIN public.wallets w ON w.user_id = u.id
WHERE w.user_id IS NULL
  AND u.credits IS NOT NULL AND u.credits > 0
ON CONFLICT (user_id) DO NOTHING;

-- 2) 对「已有钱包但余额为 0」的用户，用 users.credits 补 permanent_credits
UPDATE public.wallets w
SET permanent_credits = coalesce(u.credits, 0), updated_at = now()
FROM public.users u
WHERE w.user_id = u.id
  AND coalesce(u.credits, 0) > 0
  AND (coalesce(w.permanent_credits, 0) + coalesce(w.bonus_credits, 0)) = 0;
