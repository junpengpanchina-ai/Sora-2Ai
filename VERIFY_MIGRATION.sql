-- 验证数据库迁移是否成功
-- 在 Supabase SQL Editor 中执行此查询

-- 1. 检查表是否创建成功（应该返回 5 行）
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('wallets', 'user_entitlements', 'usage_daily', 'purchases', 'risk_devices')
ORDER BY table_name;

-- 预期结果：
-- purchases
-- risk_devices
-- usage_daily
-- user_entitlements
-- wallets

-- 2. 检查函数是否创建成功（应该返回 3 行）
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('deduct_credits', 'check_and_increment_daily_usage', 'apply_purchase')
ORDER BY routine_name;

-- 预期结果：
-- apply_purchase
-- check_and_increment_daily_usage
-- deduct_credits

