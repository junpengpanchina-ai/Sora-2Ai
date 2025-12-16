-- 034_create_use_cases_table.sql
-- 创建使用场景表，用于生成公开的 SEO 使用场景页面

CREATE TABLE IF NOT EXISTS use_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  h1 TEXT NOT NULL,
  description TEXT NOT NULL,
  content TEXT NOT NULL,
  use_case_type TEXT NOT NULL CHECK (use_case_type IN ('marketing', 'social-media', 'youtube', 'tiktok', 'product-demo', 'ads', 'education', 'other')),
  featured_prompt_ids UUID[] DEFAULT ARRAY[]::UUID[],
  related_use_case_ids UUID[] DEFAULT ARRAY[]::UUID[],
  seo_keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_by_admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_use_cases_slug ON use_cases(slug);
CREATE INDEX IF NOT EXISTS idx_use_cases_published ON use_cases(is_published);
CREATE INDEX IF NOT EXISTS idx_use_cases_type ON use_cases(use_case_type);
CREATE INDEX IF NOT EXISTS idx_use_cases_updated_at ON use_cases(updated_at DESC);

-- 更新时间触发器
DROP TRIGGER IF EXISTS trg_use_cases_updated_at ON use_cases;
CREATE TRIGGER trg_use_cases_updated_at
  BEFORE UPDATE ON use_cases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS 策略
ALTER TABLE use_cases ENABLE ROW LEVEL SECURITY;

-- 公开访问：允许所有人查看已发布的使用场景
DROP POLICY IF EXISTS use_cases_public_select ON use_cases;
CREATE POLICY use_cases_public_select
  ON use_cases
  FOR SELECT
  TO anon, authenticated
  USING (is_published = TRUE);

-- 管理员完全访问
DROP POLICY IF EXISTS use_cases_service_role_all ON use_cases;
CREATE POLICY use_cases_service_role_all
  ON use_cases
  FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

