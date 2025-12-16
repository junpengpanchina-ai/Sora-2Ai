-- 035_create_compare_pages_table.sql
-- 创建对比页表，用于生成 Sora vs 其他工具的对比 SEO 页面

CREATE TABLE IF NOT EXISTS compare_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  h1 TEXT NOT NULL,
  description TEXT NOT NULL,
  content TEXT NOT NULL,
  tool_a_name TEXT NOT NULL DEFAULT 'OpenAI Sora',
  tool_b_name TEXT NOT NULL,
  comparison_points JSONB DEFAULT '[]'::JSONB,
  winner TEXT CHECK (winner IN ('tool_a', 'tool_b', 'tie', NULL)),
  seo_keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_by_admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_compare_pages_slug ON compare_pages(slug);
CREATE INDEX IF NOT EXISTS idx_compare_pages_published ON compare_pages(is_published);
CREATE INDEX IF NOT EXISTS idx_compare_pages_tool_b ON compare_pages(tool_b_name);
CREATE INDEX IF NOT EXISTS idx_compare_pages_updated_at ON compare_pages(updated_at DESC);

-- 更新时间触发器
DROP TRIGGER IF EXISTS trg_compare_pages_updated_at ON compare_pages;
CREATE TRIGGER trg_compare_pages_updated_at
  BEFORE UPDATE ON compare_pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS 策略
ALTER TABLE compare_pages ENABLE ROW LEVEL SECURITY;

-- 公开访问：允许所有人查看已发布的对比页
DROP POLICY IF EXISTS compare_pages_public_select ON compare_pages;
CREATE POLICY compare_pages_public_select
  ON compare_pages
  FOR SELECT
  TO anon, authenticated
  USING (is_published = TRUE);

-- 管理员完全访问
DROP POLICY IF EXISTS compare_pages_service_role_all ON compare_pages;
CREATE POLICY compare_pages_service_role_all
  ON compare_pages
  FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

