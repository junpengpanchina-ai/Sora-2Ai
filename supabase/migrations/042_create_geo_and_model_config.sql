-- 042_create_geo_and_model_config.sql
-- 创建GEO配置表和行业×场景×模型配置表

-- 1. GEO配置表（存储不同地区的配置）
CREATE TABLE IF NOT EXISTS geo_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  geo_code TEXT UNIQUE NOT NULL, -- 地区代码，如 'US', 'CN', 'GB' 等
  geo_name TEXT NOT NULL, -- 地区名称，如 'United States', 'China', 'United Kingdom'
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  default_model TEXT NOT NULL DEFAULT 'gemini-2.5-flash', -- 该地区的默认模型
  priority INTEGER DEFAULT 0, -- 优先级，数字越大优先级越高
  notes TEXT, -- 备注
  created_by_admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_geo_configs_code ON geo_configs(geo_code);
CREATE INDEX IF NOT EXISTS idx_geo_configs_active ON geo_configs(is_active);
CREATE INDEX IF NOT EXISTS idx_geo_configs_priority ON geo_configs(priority DESC);

-- 2. 行业×场景×模型配置表（存储每个行业在不同场景下应该使用的模型）
CREATE TABLE IF NOT EXISTS industry_scene_model_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  industry TEXT NOT NULL, -- 行业名称，如 'E-commerce', 'SaaS', 'Dental Clinics'
  use_case_type TEXT NOT NULL CHECK (use_case_type IN (
    'advertising-promotion',
    'social-media-content',
    'product-demo-showcase',
    'brand-storytelling',
    'education-explainer',
    'ugc-creator-content'
  )),
  -- 模型选择策略
  default_model TEXT NOT NULL DEFAULT 'gemini-2.5-flash', -- 默认模型
  fallback_model TEXT, -- Fallback模型（如果default失败）
  ultimate_model TEXT, -- 终极模型（如果fallback也失败）
  -- 行业分类
  industry_category TEXT, -- 'hot' (热门), 'cold' (冷门), 'professional' (专业), 'restricted' (限制)
  industry_tier TEXT, -- 'A' (高价), 'B' (流量), 'C' (限制)
  -- 场景启用状态
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE, -- 是否启用该场景
  priority INTEGER DEFAULT 0, -- 优先级
  -- 配置说明
  notes TEXT,
  created_by_admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- 唯一约束：同一行业同一场景只能有一条配置
  UNIQUE(industry, use_case_type)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_industry_scene_model_industry ON industry_scene_model_configs(industry);
CREATE INDEX IF NOT EXISTS idx_industry_scene_model_type ON industry_scene_model_configs(use_case_type);
CREATE INDEX IF NOT EXISTS idx_industry_scene_model_category ON industry_scene_model_configs(industry_category);
CREATE INDEX IF NOT EXISTS idx_industry_scene_model_tier ON industry_scene_model_configs(industry_tier);
CREATE INDEX IF NOT EXISTS idx_industry_scene_model_enabled ON industry_scene_model_configs(is_enabled);

-- 更新时间触发器
DROP TRIGGER IF EXISTS trg_geo_configs_updated_at ON geo_configs;
CREATE TRIGGER trg_geo_configs_updated_at
  BEFORE UPDATE ON geo_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_industry_scene_model_configs_updated_at ON industry_scene_model_configs;
CREATE TRIGGER trg_industry_scene_model_configs_updated_at
  BEFORE UPDATE ON industry_scene_model_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS 策略
ALTER TABLE geo_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE industry_scene_model_configs ENABLE ROW LEVEL SECURITY;

-- 公开访问：允许所有人查看配置（只读）
DROP POLICY IF EXISTS geo_configs_public_select ON geo_configs;
CREATE POLICY geo_configs_public_select
  ON geo_configs
  FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE);

DROP POLICY IF EXISTS industry_scene_model_configs_public_select ON industry_scene_model_configs;
CREATE POLICY industry_scene_model_configs_public_select
  ON industry_scene_model_configs
  FOR SELECT
  TO anon, authenticated
  USING (is_enabled = TRUE);

-- 管理员完全访问
DROP POLICY IF EXISTS geo_configs_service_role_all ON geo_configs;
CREATE POLICY geo_configs_service_role_all
  ON geo_configs
  FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

DROP POLICY IF EXISTS industry_scene_model_configs_service_role_all ON industry_scene_model_configs;
CREATE POLICY industry_scene_model_configs_service_role_all
  ON industry_scene_model_configs
  FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

-- 添加注释
COMMENT ON TABLE geo_configs IS 'GEO配置表：存储不同地区的默认模型和配置';
COMMENT ON TABLE industry_scene_model_configs IS '行业×场景×模型配置表：存储每个行业在不同场景下应该使用的模型';

-- 插入默认GEO配置
INSERT INTO geo_configs (geo_code, geo_name, default_model, priority) VALUES
  ('US', 'United States', 'gemini-2.5-flash', 100),
  ('CN', 'China', 'gemini-2.5-flash', 90),
  ('GB', 'United Kingdom', 'gemini-2.5-flash', 80),
  ('CA', 'Canada', 'gemini-2.5-flash', 70),
  ('AU', 'Australia', 'gemini-2.5-flash', 60)
ON CONFLICT (geo_code) DO NOTHING;

