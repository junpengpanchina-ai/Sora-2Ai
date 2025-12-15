-- 031_create_dynamic_page_seo.sql
-- 创建用于管理动态页面SEO的表
-- 支持管理 /video?prompt=... 等动态页面的SEO属性

-- 首先确保 admin_users 表有 is_active 字段（如果不存在则添加）
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

CREATE TABLE IF NOT EXISTS dynamic_page_seo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_path TEXT NOT NULL, -- 页面路径，如 '/video'
  page_params JSONB, -- 页面参数，如 {"prompt": "..."}
  page_url TEXT NOT NULL UNIQUE, -- 完整URL，如 '/video?prompt=...'
  title TEXT NOT NULL, -- SEO标题
  description TEXT, -- SEO描述
  h1_text TEXT, -- H1标签文本
  seo_content TEXT, -- SEO友好的文本内容（用于提高字数）
  meta_keywords TEXT[], -- 关键词数组
  is_active BOOLEAN NOT NULL DEFAULT TRUE, -- 是否启用
  priority INTEGER DEFAULT 0, -- 优先级（数字越大优先级越高）
  created_by_admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_dynamic_page_seo_page_path ON dynamic_page_seo(page_path);
CREATE INDEX IF NOT EXISTS idx_dynamic_page_seo_page_url ON dynamic_page_seo(page_url);
CREATE INDEX IF NOT EXISTS idx_dynamic_page_seo_active ON dynamic_page_seo(is_active);
CREATE INDEX IF NOT EXISTS idx_dynamic_page_seo_priority ON dynamic_page_seo(priority DESC);
CREATE INDEX IF NOT EXISTS idx_dynamic_page_seo_params ON dynamic_page_seo USING GIN(page_params);

-- 创建更新时间触发器
DROP TRIGGER IF EXISTS trg_dynamic_page_seo_updated_at ON dynamic_page_seo;
CREATE TRIGGER trg_dynamic_page_seo_updated_at
  BEFORE UPDATE ON dynamic_page_seo
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 启用行级安全
ALTER TABLE dynamic_page_seo ENABLE ROW LEVEL SECURITY;

-- 公开读取策略（所有人都可以读取启用的SEO信息）
DROP POLICY IF EXISTS dynamic_page_seo_public_select ON dynamic_page_seo;
CREATE POLICY dynamic_page_seo_public_select
  ON dynamic_page_seo
  FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE);

-- 管理员可以完全管理
-- 注意：如果 admin_users 表没有 is_active 字段，请先执行：
-- ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
DROP POLICY IF EXISTS dynamic_page_seo_admin_all ON dynamic_page_seo;
CREATE POLICY dynamic_page_seo_admin_all
  ON dynamic_page_seo
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND (admin_users.is_active IS NULL OR admin_users.is_active = TRUE)
    )
  );

COMMENT ON TABLE dynamic_page_seo IS '动态页面SEO管理表，用于管理 /video?prompt=... 等动态页面的SEO属性';
COMMENT ON COLUMN dynamic_page_seo.page_path IS '页面路径，如 /video';
COMMENT ON COLUMN dynamic_page_seo.page_params IS '页面参数JSON，如 {"prompt": "..."}';
COMMENT ON COLUMN dynamic_page_seo.page_url IS '完整URL，用于唯一标识页面';
COMMENT ON COLUMN dynamic_page_seo.seo_content IS 'SEO友好的文本内容，用于提高页面字数';
