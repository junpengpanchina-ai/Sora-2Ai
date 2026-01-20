-- P2 Step 4 回滚（慎用、保守）
-- 只回滚「可安全认定」为迁移写入的用户：bonus=0 且 permanent=users.credits，且 credits>0
-- 无法 100% 区分迁移 vs 真实新购，故宁可少回滚、不误伤

-- 1) 预览：满足「可安全回滚」条件的用户
-- SELECT u.id, u.credits, w.permanent_credits, w.bonus_credits
-- FROM public.users u
-- JOIN public.wallets w ON w.user_id = u.id
-- WHERE coalesce(w.bonus_credits, 0) = 0
--   AND coalesce(w.permanent_credits, 0) = coalesce(u.credits, 0)
--   AND coalesce(u.credits, 0) > 0;

-- 2) 执行回滚：只对上述强条件用户，把 permanent_credits 置 0
-- UPDATE public.wallets w
-- SET permanent_credits = 0, updated_at = now()
-- FROM public.users u
-- WHERE w.user_id = u.id
--   AND coalesce(w.bonus_credits, 0) = 0
--   AND coalesce(w.permanent_credits, 0) = coalesce(u.credits, 0)
--   AND coalesce(u.credits, 0) > 0;
