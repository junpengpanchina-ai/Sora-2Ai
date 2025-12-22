-- 添加管理员会话延长函数
-- 用于在批量生成过程中自动刷新会话，避免会话过期

DROP FUNCTION IF EXISTS admin_extend_session(TEXT, TIMESTAMP WITH TIME ZONE);
CREATE OR REPLACE FUNCTION admin_extend_session(
  p_token_hash TEXT,
  p_expires_at TIMESTAMP WITH TIME ZONE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated BOOLEAN;
BEGIN
  -- 更新会话过期时间
  UPDATE admin_sessions
  SET expires_at = p_expires_at,
      updated_at = NOW()
  WHERE token_hash = p_token_hash
    AND expires_at > NOW(); -- 只更新未过期的会话
  
  GET DIAGNOSTICS updated = ROW_COUNT;
  
  RETURN updated > 0;
END;
$$;

REVOKE ALL ON FUNCTION admin_extend_session(TEXT, TIMESTAMP WITH TIME ZONE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_extend_session(TEXT, TIMESTAMP WITH TIME ZONE) TO anon, authenticated, service_role;

