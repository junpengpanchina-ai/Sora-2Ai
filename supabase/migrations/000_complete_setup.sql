-- ============================================
-- 完整的数据库设置脚本
-- 一次性执行所有迁移
-- ============================================

-- ============================================
-- 第一部分: 创建 users 表
-- ============================================

-- 创建 users 表
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  google_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'banned'))
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 创建触发器
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 第二部分: 创建用户自动处理函数和触发器
-- ============================================

-- 创建处理新用户的函数
-- 当 Supabase Auth 创建新用户时，自动在 users 表中创建对应记录
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  google_id_value TEXT;
  user_email TEXT;
  user_name TEXT;
  user_avatar TEXT;
BEGIN
  -- 从 user_metadata 获取 Google 信息
  google_id_value := COALESCE(
    NEW.raw_user_meta_data->>'provider_id',
    NEW.raw_user_meta_data->>'sub',
    NEW.id::TEXT
  );
  
  user_email := COALESCE(NEW.email, NEW.raw_user_meta_data->>'email', '');
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'display_name'
  );
  user_avatar := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture',
    NEW.raw_user_meta_data->>'avatar'
  );

  -- 检查是否已存在（避免重复插入）
  IF NOT EXISTS (
    SELECT 1 FROM public.users WHERE google_id = google_id_value
  ) THEN
    INSERT INTO public.users (
      google_id,
      email,
      name,
      avatar_url,
      last_login_at
    ) VALUES (
      google_id_value,
      user_email,
      NULLIF(user_name, ''),
      NULLIF(user_avatar, ''),
      NOW()
    );
  ELSE
    -- 如果已存在，更新最后登录时间
    UPDATE public.users
    SET 
      last_login_at = NOW(),
      name = COALESCE(NULLIF(user_name, ''), name),
      avatar_url = COALESCE(NULLIF(user_avatar, ''), avatar_url)
    WHERE google_id = google_id_value;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器（在 auth.users 表上）
-- 注意：这需要在 Supabase Dashboard 的 SQL Editor 中运行
-- 因为需要访问 auth schema
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 完成提示
-- ============================================
-- 执行完成后，应该看到 "Success" 消息
-- 可以在 Table Editor 中查看 users 表是否已创建

