-- 010_add_rls_policies.sql
-- 为所有表添加 Row Level Security (RLS) 策略，确保数据安全

-- ============================================
-- 1. users 表 - 用户只能查看和修改自己的数据
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS users_select_own ON users;
CREATE POLICY users_select_own
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS users_update_own ON users;
CREATE POLICY users_update_own
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 允许服务端角色（service_role）访问所有用户数据（用于管理功能）
DROP POLICY IF EXISTS users_service_role_all ON users;
CREATE POLICY users_service_role_all
  ON users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 2. video_tasks 表 - 用户只能查看和修改自己的任务
-- ============================================
ALTER TABLE video_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS video_tasks_select_own ON video_tasks;
CREATE POLICY video_tasks_select_own
  ON video_tasks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS video_tasks_insert_own ON video_tasks;
CREATE POLICY video_tasks_insert_own
  ON video_tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS video_tasks_update_own ON video_tasks;
CREATE POLICY video_tasks_update_own
  ON video_tasks
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 允许服务端角色访问所有任务（用于 webhook 回调等）
DROP POLICY IF EXISTS video_tasks_service_role_all ON video_tasks;
CREATE POLICY video_tasks_service_role_all
  ON video_tasks
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 3. recharge_records 表 - 用户只能查看自己的充值记录
-- ============================================
ALTER TABLE recharge_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS recharge_records_select_own ON recharge_records;
CREATE POLICY recharge_records_select_own
  ON recharge_records
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS recharge_records_insert_own ON recharge_records;
CREATE POLICY recharge_records_insert_own
  ON recharge_records
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 允许服务端角色访问所有充值记录（用于支付处理）
DROP POLICY IF EXISTS recharge_records_service_role_all ON recharge_records;
CREATE POLICY recharge_records_service_role_all
  ON recharge_records
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 4. consumption_records 表 - 用户只能查看自己的消费记录
-- ============================================
ALTER TABLE consumption_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS consumption_records_select_own ON consumption_records;
CREATE POLICY consumption_records_select_own
  ON consumption_records
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS consumption_records_insert_own ON consumption_records;
CREATE POLICY consumption_records_insert_own
  ON consumption_records
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 允许服务端角色访问所有消费记录（用于退款等操作）
DROP POLICY IF EXISTS consumption_records_service_role_all ON consumption_records;
CREATE POLICY consumption_records_service_role_all
  ON consumption_records
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 5. after_sales_issues 表 - 允许匿名用户提交，但只能查看自己的问题
-- ============================================
ALTER TABLE after_sales_issues ENABLE ROW LEVEL SECURITY;

-- 注意：after_sales_issues 表没有 user_id 字段，只有 contact_email
-- 允许匿名用户和认证用户提交问题（用于客服反馈）
DROP POLICY IF EXISTS after_sales_issues_insert_all ON after_sales_issues;
CREATE POLICY after_sales_issues_insert_all
  ON after_sales_issues
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 允许认证用户查看自己提交的问题（通过 email 匹配）
-- 注意：如果用户未登录，则无法查看任何问题
DROP POLICY IF EXISTS after_sales_issues_select_own ON after_sales_issues;
CREATE POLICY after_sales_issues_select_own
  ON after_sales_issues
  FOR SELECT
  TO authenticated
  USING (
    contact_email IS NOT NULL 
    AND contact_email = (SELECT email FROM users WHERE id = auth.uid())
  );

-- 允许认证用户更新自己提交的问题
DROP POLICY IF EXISTS after_sales_issues_update_own ON after_sales_issues;
CREATE POLICY after_sales_issues_update_own
  ON after_sales_issues
  FOR UPDATE
  TO authenticated
  USING (
    contact_email IS NOT NULL 
    AND contact_email = (SELECT email FROM users WHERE id = auth.uid())
  )
  WITH CHECK (
    contact_email IS NOT NULL 
    AND contact_email = (SELECT email FROM users WHERE id = auth.uid())
  );

-- 允许服务端角色访问所有问题（用于管理员处理）
DROP POLICY IF EXISTS after_sales_issues_service_role_all ON after_sales_issues;
CREATE POLICY after_sales_issues_service_role_all
  ON after_sales_issues
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 6. prompt_library 表 - 允许 service_role 完全访问（用于管理员功能）
-- ============================================
-- 注意：prompt_library 表在 009 迁移中已启用 RLS，并创建了公共访问策略
-- 这里添加 service_role 策略，允许管理员访问所有提示词（包括未发布的）

DROP POLICY IF EXISTS prompt_library_service_role_all ON prompt_library;
CREATE POLICY prompt_library_service_role_all
  ON prompt_library
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 注意：
-- 1. 所有策略都使用 auth.uid() 来识别当前用户
-- 2. service_role 被授予完全访问权限，用于服务端操作（如 webhook、支付处理、管理员功能等）
-- 3. 匿名用户（anon）默认无法访问这些表的数据
-- 4. 如果需要允许匿名用户访问某些数据，需要单独创建策略
-- 5. prompt_library 表允许 anon/authenticated 用户查看已发布的内容（在 009 迁移中已配置）
-- 6. prompt_library 表允许 service_role 访问所有内容（包括未发布的），用于管理员功能
-- ============================================

