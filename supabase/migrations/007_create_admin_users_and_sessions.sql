-- 007_create_admin_users_and_sessions.sql
-- 管理员账号表与登录会话表

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  is_super_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  token_hash TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token_hash ON admin_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions(expires_at);

DROP TRIGGER IF EXISTS trg_admin_users_updated_at ON admin_users;
CREATE TRIGGER trg_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_users_default_policy ON admin_users;
CREATE POLICY admin_users_default_policy ON admin_users
  USING (false);

DROP POLICY IF EXISTS admin_sessions_default_policy ON admin_sessions;
CREATE POLICY admin_sessions_default_policy ON admin_sessions
  USING (false);

DROP FUNCTION IF EXISTS admin_create_session(TEXT, TEXT, TEXT, TIMESTAMP WITH TIME ZONE);
CREATE OR REPLACE FUNCTION admin_create_session(
  p_username TEXT,
  p_password TEXT,
  p_token_hash TEXT,
  p_expires_at TIMESTAMP WITH TIME ZONE
)
RETURNS admin_sessions
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_record admin_users;
  session_record admin_sessions;
BEGIN
  SELECT * INTO admin_record
  FROM admin_users
  WHERE username = p_username;

  IF NOT FOUND OR admin_record.password_hash <> crypt(p_password, admin_record.password_hash) THEN
    RAISE EXCEPTION 'Invalid credentials' USING ERRCODE = 'P0001';
  END IF;

  DELETE FROM admin_sessions
  WHERE admin_user_id = admin_record.id AND expires_at < NOW();

  INSERT INTO admin_sessions (admin_user_id, token_hash, expires_at)
  VALUES (admin_record.id, p_token_hash, p_expires_at)
  RETURNING * INTO session_record;

  RETURN session_record;
END;
$$;

DROP FUNCTION IF EXISTS admin_validate_session(TEXT);
CREATE OR REPLACE FUNCTION admin_validate_session(p_token_hash TEXT)
RETURNS admin_users
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_record admin_sessions;
  admin_record admin_users;
BEGIN
  DELETE FROM admin_sessions
  WHERE expires_at < NOW();

  SELECT * INTO session_record
  FROM admin_sessions
  WHERE token_hash = p_token_hash
    AND expires_at > NOW();

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT * INTO admin_record
  FROM admin_users
  WHERE id = session_record.admin_user_id;

  RETURN admin_record;
END;
$$;

DROP FUNCTION IF EXISTS admin_delete_session(TEXT);
CREATE OR REPLACE FUNCTION admin_delete_session(p_token_hash TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted BOOLEAN;
BEGIN
  DELETE FROM admin_sessions
  WHERE token_hash = p_token_hash;
  GET DIAGNOSTICS deleted = ROW_COUNT;
  RETURN deleted;
END;
$$;

REVOKE ALL ON FUNCTION admin_create_session(TEXT, TEXT, TEXT, TIMESTAMP WITH TIME ZONE) FROM PUBLIC;
REVOKE ALL ON FUNCTION admin_validate_session(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION admin_delete_session(TEXT) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION admin_create_session(TEXT, TEXT, TEXT, TIMESTAMP WITH TIME ZONE) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION admin_validate_session(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION admin_delete_session(TEXT) TO anon, authenticated, service_role;

-- 首个管理员需在 Supabase SQL 编辑器中手动创建，勿将明文密码写入版本库。示例：
-- INSERT INTO admin_users (username, password_hash, is_super_admin)
-- SELECT '你的用户名', crypt('你的密码', gen_salt('bf')), true
-- WHERE NOT EXISTS (SELECT 1 FROM admin_users WHERE username = '你的用户名');

