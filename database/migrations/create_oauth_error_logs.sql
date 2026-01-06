-- 创建 OAuth 错误日志表（可选）
-- 如果表不存在，代码会静默失败，只记录到 console
-- 这个表用于可观测性：了解最常见的失败原因分布

CREATE TABLE IF NOT EXISTS oauth_error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error TEXT NOT NULL,
  error_description TEXT,
  error_code TEXT,
  origin TEXT,
  pathname TEXT,
  user_agent TEXT,
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引以便快速查询
CREATE INDEX IF NOT EXISTS idx_oauth_error_logs_error_code ON oauth_error_logs(error_code);
CREATE INDEX IF NOT EXISTS idx_oauth_error_logs_timestamp ON oauth_error_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_oauth_error_logs_created_at ON oauth_error_logs(created_at DESC);

-- 添加注释
COMMENT ON TABLE oauth_error_logs IS 'OAuth 登录错误日志表，用于可观测性和故障排查';
COMMENT ON COLUMN oauth_error_logs.error IS '错误消息（限制 200 字符）';
COMMENT ON COLUMN oauth_error_logs.error_description IS '错误描述（限制 500 字符）';
COMMENT ON COLUMN oauth_error_logs.error_code IS '错误代码（如 invalid_client, redirect_uri_mismatch 等）';
COMMENT ON COLUMN oauth_error_logs.origin IS '请求来源（window.location.origin）';
COMMENT ON COLUMN oauth_error_logs.pathname IS '请求路径';
COMMENT ON COLUMN oauth_error_logs.user_agent IS '用户代理（限制 200 字符）';
COMMENT ON COLUMN oauth_error_logs.timestamp IS '错误发生时间（客户端时间）';
COMMENT ON COLUMN oauth_error_logs.created_at IS '记录创建时间（服务器时间）';

