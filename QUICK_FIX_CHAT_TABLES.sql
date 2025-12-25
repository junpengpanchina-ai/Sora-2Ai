-- ============================================
-- 快速修复：创建聊天功能所需的数据库表
-- 在 Supabase SQL Editor 中直接执行此文件
-- ============================================

-- 步骤 1: 检查 admin_users 表是否存在（必需）
-- 如果不存在，请先执行 007_create_admin_users_and_sessions.sql

-- 步骤 2: 创建聊天会话表
CREATE TABLE IF NOT EXISTS admin_chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 步骤 3: 创建聊天消息表
CREATE TABLE IF NOT EXISTS admin_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES admin_chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('system', 'user', 'assistant')),
  content TEXT,
  images JSONB DEFAULT '[]',
  model TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 步骤 4: 创建索引（提升查询性能）
CREATE INDEX IF NOT EXISTS idx_admin_chat_sessions_admin_user_id 
  ON admin_chat_sessions(admin_user_id);

CREATE INDEX IF NOT EXISTS idx_admin_chat_sessions_updated_at 
  ON admin_chat_sessions(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_chat_messages_session_id 
  ON admin_chat_messages(session_id);

CREATE INDEX IF NOT EXISTS idx_admin_chat_messages_created_at 
  ON admin_chat_messages(created_at);

-- 步骤 5: 创建自动更新 updated_at 的触发器函数
CREATE OR REPLACE FUNCTION update_admin_chat_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 步骤 6: 创建触发器
DROP TRIGGER IF EXISTS trigger_update_admin_chat_sessions_updated_at ON admin_chat_sessions;

CREATE TRIGGER trigger_update_admin_chat_sessions_updated_at
  BEFORE UPDATE ON admin_chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_chat_sessions_updated_at();

-- 步骤 7: 启用 RLS（行级安全）
ALTER TABLE admin_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_chat_messages ENABLE ROW LEVEL SECURITY;

-- 步骤 8: 删除可能存在的旧策略（如果存在）
DROP POLICY IF EXISTS admin_chat_sessions_default_policy ON admin_chat_sessions;
DROP POLICY IF EXISTS admin_chat_messages_default_policy ON admin_chat_messages;
DROP POLICY IF EXISTS admin_chat_sessions_service_role_all ON admin_chat_sessions;
DROP POLICY IF EXISTS admin_chat_messages_service_role_all ON admin_chat_messages;

-- 步骤 9: 创建默认策略（拒绝所有访问）
CREATE POLICY admin_chat_sessions_default_policy 
  ON admin_chat_sessions
  USING (false);

CREATE POLICY admin_chat_messages_default_policy 
  ON admin_chat_messages
  USING (false);

-- 步骤 10: 创建 service_role 策略（允许服务端访问）
CREATE POLICY admin_chat_sessions_service_role_all
  ON admin_chat_sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY admin_chat_messages_service_role_all
  ON admin_chat_messages
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 验证：检查表是否创建成功
-- ============================================
SELECT 
  'admin_chat_sessions' as table_name,
  COUNT(*) as row_count
FROM admin_chat_sessions
UNION ALL
SELECT 
  'admin_chat_messages' as table_name,
  COUNT(*) as row_count
FROM admin_chat_messages;

-- 如果看到两个表都有 row_count = 0，说明创建成功！

