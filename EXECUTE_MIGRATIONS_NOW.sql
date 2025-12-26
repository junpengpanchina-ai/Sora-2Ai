-- ============================================
-- 数据库迁移执行文件
-- 请按顺序在 Supabase SQL Editor 中执行
-- ============================================

-- ============================================
-- 迁移 1: 为批量生成任务表添加GEO字段
-- ============================================
-- 文件: 043_add_geo_to_batch_generation_tasks.sql

ALTER TABLE batch_generation_tasks
ADD COLUMN IF NOT EXISTS geo TEXT DEFAULT 'US';

-- 添加注释
COMMENT ON COLUMN batch_generation_tasks.geo IS 'GEO地区代码，用于模型选择策略（如 US, CN, GB）';

-- ============================================
-- 迁移 2: 创建场景应用模型配置表
-- ============================================
-- 文件: 044_create_scene_model_configs.sql

CREATE TABLE IF NOT EXISTS scene_model_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  use_case_type TEXT UNIQUE NOT NULL CHECK (use_case_type IN (
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
  -- 按行业分类的模型（可选，优先级高于default_model）
  hot_industry_model TEXT, -- 热门行业使用的模型
  cold_industry_model TEXT, -- 冷门行业使用的模型
  professional_industry_model TEXT, -- 专业行业使用的模型
  -- 场景启用状态
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE, -- 是否启用该场景配置
  -- 配置说明
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_scene_model_configs_type ON scene_model_configs(use_case_type);
CREATE INDEX IF NOT EXISTS idx_scene_model_configs_enabled ON scene_model_configs(is_enabled);

-- 更新时间触发器
DROP TRIGGER IF EXISTS trg_scene_model_configs_updated_at ON scene_model_configs;
CREATE TRIGGER trg_scene_model_configs_updated_at
  BEFORE UPDATE ON scene_model_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS 策略
ALTER TABLE scene_model_configs ENABLE ROW LEVEL SECURITY;

-- 公开访问：允许所有人查看配置（只读）
DROP POLICY IF EXISTS scene_model_configs_public_select ON scene_model_configs;
CREATE POLICY scene_model_configs_public_select
  ON scene_model_configs
  FOR SELECT
  TO anon, authenticated
  USING (is_enabled = TRUE);

-- 管理员完全访问
DROP POLICY IF EXISTS scene_model_configs_service_role_all ON scene_model_configs;
CREATE POLICY scene_model_configs_service_role_all
  ON scene_model_configs
  FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

-- 添加注释
COMMENT ON TABLE scene_model_configs IS '场景应用模型配置表：按场景应用配置模型，自动应用到所有行业';

-- 插入默认配置（推荐配置）
INSERT INTO scene_model_configs (use_case_type, default_model, fallback_model, ultimate_model, hot_industry_model, cold_industry_model, professional_industry_model) VALUES
  ('advertising-promotion', 'gemini-2.5-flash', 'gemini-3-flash', 'gemini-3-pro', 'gemini-2.5-flash', 'gemini-3-flash', 'gemini-3-flash'),
  ('social-media-content', 'gemini-2.5-flash', 'gemini-3-flash', 'gemini-3-pro', 'gemini-2.5-flash', 'gemini-3-flash', 'gemini-3-flash'),
  ('product-demo-showcase', 'gemini-2.5-flash', 'gemini-3-flash', 'gemini-3-pro', 'gemini-2.5-flash', 'gemini-3-flash', 'gemini-3-pro'),
  ('education-explainer', 'gemini-2.5-flash', 'gemini-3-flash', 'gemini-3-pro', 'gemini-2.5-flash', 'gemini-3-flash', 'gemini-3-flash'),
  ('brand-storytelling', 'gemini-2.5-flash', 'gemini-3-flash', 'gemini-3-pro', 'gemini-2.5-flash', 'gemini-3-flash', 'gemini-3-flash'),
  ('ugc-creator-content', 'gemini-2.5-flash', 'gemini-3-flash', 'gemini-3-pro', 'gemini-2.5-flash', 'gemini-3-flash', 'gemini-3-flash')
ON CONFLICT (use_case_type) DO NOTHING;

-- ============================================
-- 验证迁移结果
-- ============================================

-- 检查 scene_model_configs 表
SELECT 
  use_case_type,
  default_model,
  fallback_model,
  ultimate_model,
  hot_industry_model,
  cold_industry_model,
  professional_industry_model,
  is_enabled
FROM scene_model_configs 
ORDER BY use_case_type;

-- 应该看到6条记录

-- 检查 batch_generation_tasks 表是否有 geo 字段
SELECT 
  column_name, 
  data_type,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'batch_generation_tasks'
AND column_name = 'geo';

-- 应该看到 geo 字段，默认值为 'US'

