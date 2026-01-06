-- ============================================
-- 查看总注册用户数的 SQL 查询
-- ============================================

-- 方法 1: 简单统计总用户数
SELECT COUNT(*) AS total_users
FROM users;

-- 方法 2: 详细统计（包含状态分布）
SELECT 
    COUNT(*) AS total_users,
    COUNT(*) FILTER (WHERE status = 'active') AS active_users,
    COUNT(*) FILTER (WHERE status = 'inactive') AS inactive_users,
    COUNT(*) FILTER (WHERE status = 'banned') AS banned_users
FROM users;

-- 方法 3: 按注册时间统计（最近30天）
SELECT 
    COUNT(*) AS total_users,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') AS users_last_30_days,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') AS users_last_7_days,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 day') AS users_last_24_hours
FROM users;

-- 方法 4: 按注册日期分组统计（每日新增用户）
SELECT 
    DATE(created_at) AS registration_date,
    COUNT(*) AS new_users
FROM users
GROUP BY DATE(created_at)
ORDER BY registration_date DESC
LIMIT 30;

-- 方法 5: 完整用户统计（包含积分、最后登录等）
SELECT 
    COUNT(*) AS total_users,
    COUNT(*) FILTER (WHERE credits > 0) AS users_with_credits,
    COUNT(*) FILTER (WHERE last_login_at IS NOT NULL) AS users_with_login,
    COUNT(*) FILTER (WHERE last_login_at >= NOW() - INTERVAL '30 days') AS active_users_30d,
    SUM(credits) AS total_credits,
    AVG(credits) AS avg_credits,
    MIN(created_at) AS first_user_registered,
    MAX(created_at) AS latest_user_registered
FROM users;

-- 方法 6: 用户增长趋势（按月统计）
SELECT 
    DATE_TRUNC('month', created_at) AS month,
    COUNT(*) AS new_users,
    SUM(COUNT(*)) OVER (ORDER BY DATE_TRUNC('month', created_at)) AS cumulative_users
FROM users
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC
LIMIT 12;

-- 方法 7: 查看最近注册的用户（前10名）
SELECT 
    id,
    email,
    name,
    credits,
    status,
    created_at,
    last_login_at
FROM users
ORDER BY created_at DESC
LIMIT 10;

-- 方法 8: 统计有充值记录的用户数
SELECT 
    COUNT(DISTINCT u.id) AS users_with_recharges
FROM users u
INNER JOIN recharge_records rr ON u.id = rr.user_id
WHERE rr.status = 'completed';

-- 方法 9: 统计有视频生成记录的用户数
SELECT 
    COUNT(DISTINCT u.id) AS users_with_videos
FROM users u
INNER JOIN video_tasks vt ON u.id = vt.user_id;

-- 方法 10: 综合统计（最详细）
SELECT 
    -- 总用户数
    (SELECT COUNT(*) FROM users) AS total_users,
    
    -- 活跃用户（30天内登录）
    (SELECT COUNT(*) FROM users WHERE last_login_at >= NOW() - INTERVAL '30 days') AS active_users_30d,
    
    -- 有积分的用户
    (SELECT COUNT(*) FROM users WHERE credits > 0) AS users_with_credits,
    
    -- 有充值记录的用户
    (SELECT COUNT(DISTINCT user_id) FROM recharge_records WHERE status = 'completed') AS users_with_recharges,
    
    -- 有视频生成记录的用户
    (SELECT COUNT(DISTINCT user_id) FROM video_tasks) AS users_with_videos,
    
    -- 总积分
    (SELECT SUM(credits) FROM users) AS total_credits,
    
    -- 总充值金额
    (SELECT SUM(amount) FROM recharge_records WHERE status = 'completed') AS total_recharge_amount;



