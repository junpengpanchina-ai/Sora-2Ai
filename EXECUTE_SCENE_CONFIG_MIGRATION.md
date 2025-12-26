# 执行场景配置迁移 - 详细步骤

## 📋 需要执行的迁移文件

1. **043_add_geo_to_batch_generation_tasks.sql** - 为批量生成任务表添加GEO字段
2. **044_create_scene_model_configs.sql** - 创建场景应用模型配置表

## ✅ 执行步骤

### 步骤 1: 打开 Supabase Dashboard

1. 访问 [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. 登录你的账号
3. 选择你的项目

### 步骤 2: 进入 SQL Editor

1. 在左侧菜单中找到 **SQL Editor**
2. 点击 **SQL Editor**
3. 点击 **New query**（新建查询）

### 步骤 3: 执行第一个迁移（添加GEO字段）

复制以下 SQL 并执行：

```sql
-- 043_add_geo_to_batch_generation_tasks.sql
-- 为批量生成任务表添加GEO字段

ALTER TABLE batch_generation_tasks
ADD COLUMN IF NOT EXISTS geo TEXT DEFAULT 'US';

-- 添加注释
COMMENT ON COLUMN batch_generation_tasks.geo IS 'GEO地区代码，用于模型选择策略（如 US, CN, GB）';
```

✅ 应该看到："Success. No rows returned"

### 步骤 4: 执行第二个迁移（创建场景配置表）

复制以下 SQL 并执行：

```sql
-- 044_create_scene_model_configs.sql
-- 创建场景应用模型配置表（简化版，按场景应用配置，自动应用到所有行业）

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
```

✅ 应该看到："Success. No rows returned"

### 步骤 5: 验证迁移成功

在 SQL Editor 中运行：

```sql
-- 检查 scene_model_configs 表
SELECT * FROM scene_model_configs ORDER BY use_case_type;

-- 应该看到6条记录，每个场景应用一条

-- 检查 batch_generation_tasks 表是否有 geo 字段
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'batch_generation_tasks'
AND column_name = 'geo';
```

## ✅ 验证清单

- [ ] `scene_model_configs` 表已创建
- [ ] 6个场景应用的默认配置已插入
- [ ] `batch_generation_tasks` 表有 `geo` 字段
- [ ] 索引已创建
- [ ] RLS 策略已配置

## 🎉 完成！

迁移完成后，你可以：

1. **访问场景配置界面**：
   - 进入 Admin后台 → **"场景配置"** tab
   - 应该能看到6个场景应用卡片，每个都有默认配置

2. **开始使用**：
   - 在批量生成界面选择 GEO 和场景类型
   - 系统会自动使用配置的模型

## 📚 相关文档

- `SCENE_CONFIG_SIMPLE_GUIDE.md` - 详细使用指南
- `supabase/migrations/044_create_scene_model_configs.sql` - 迁移文件
- `app/admin/AdminSceneModelConfig.tsx` - 场景配置组件

