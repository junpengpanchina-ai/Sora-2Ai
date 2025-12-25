-- 创建管理员聊天历史记录表
-- 支持多图片、文字消息，保存完整的对话历史

-- 聊天会话表
CREATE TABLE IF NOT EXISTS admin_chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  title TEXT, -- 会话标题（自动生成或手动设置）
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 聊天消息表
CREATE TABLE IF NOT EXISTS admin_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES admin_chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('system', 'user', 'assistant')),
  content TEXT, -- 文本内容（可为空，如果只有图片）
  images JSONB DEFAULT '[]', -- 图片数组，存储图片的 base64 或 URL
  model TEXT, -- 使用的模型（gemini-2-flash, gemini-3-flash, gemini-3-pro）
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_admin_chat_sessions_admin_user_id ON admin_chat_sessions(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_chat_sessions_updated_at ON admin_chat_sessions(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_chat_messages_session_id ON admin_chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_admin_chat_messages_created_at ON admin_chat_messages(created_at);

-- 创建触发器：自动更新 updated_at
CREATE OR REPLACE FUNCTION update_admin_chat_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_admin_chat_sessions_updated_at
  BEFORE UPDATE ON admin_chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_chat_sessions_updated_at();

-- 添加 RLS 策略
-- 注意：管理员使用自定义认证系统，API 路由会通过 validateAdminSession 验证权限
-- 这里使用 service_role 策略，允许服务端访问（API 路由已验证权限）
ALTER TABLE admin_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_chat_messages ENABLE ROW LEVEL SECURITY;

-- 默认策略：拒绝所有访问
CREATE POLICY admin_chat_sessions_default_policy ON admin_chat_sessions
  USING (false);

CREATE POLICY admin_chat_messages_default_policy ON admin_chat_messages
  USING (false);

-- 允许 service_role 访问（API 路由已验证权限）
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

