-- 063_refactor_prompt_scene_relationship.sql
-- 重构 Prompt 与 Scene 的关系，建立正确的层级结构
-- 
-- 核心原则：
-- - Scene (Use Case) 是内容与SEO的第一公民
-- - Prompt 是内部资产/能力实现，不参与SEO/GEO
-- - 一个 Scene 可以对应多个 Prompt（不同role/model/version）

-- ============================================
-- 1. 添加新字段到 prompt_library 表
-- ============================================

ALTER TABLE prompt_library
  -- 关联场景（外键）
  ADD COLUMN IF NOT EXISTS scene_id UUID REFERENCES use_cases(id) ON DELETE SET NULL,
  
  -- Prompt 角色和用途
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'default' CHECK (
    role IN ('default', 'fast', 'high_quality', 'long_form', 'ads', 'social', 'compliance_safe')
  ),
  
  -- 模型支持
  ADD COLUMN IF NOT EXISTS model TEXT DEFAULT 'sora' CHECK (
    model IN ('sora', 'veo', 'gemini', 'universal')
  ),
  
  -- 版本管理
  ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
  
  -- SEO 控制（默认不进索引和sitemap）
  ADD COLUMN IF NOT EXISTS is_indexable BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_in_sitemap BOOLEAN DEFAULT FALSE;

-- ============================================
-- 2. 迁移现有数据：将 featured_prompt_ids 关联到 scene_id
-- ============================================

-- 为现有的 prompt 关联场景
-- 通过 use_cases.featured_prompt_ids 数组字段反向关联
UPDATE prompt_library p
SET scene_id = uc.id
FROM use_cases uc
WHERE p.id = ANY(uc.featured_prompt_ids)
  AND p.scene_id IS NULL;

-- 设置默认值（确保所有字段都有值）
UPDATE prompt_library 
SET role = 'default' 
WHERE role IS NULL;

UPDATE prompt_library 
SET model = 'sora' 
WHERE model IS NULL;

UPDATE prompt_library 
SET version = 1 
WHERE version IS NULL;

UPDATE prompt_library 
SET is_indexable = FALSE 
WHERE is_indexable IS NULL;

UPDATE prompt_library 
SET is_in_sitemap = FALSE 
WHERE is_in_sitemap IS NULL;

-- ============================================
-- 3. 创建索引优化查询
-- ============================================

CREATE INDEX IF NOT EXISTS idx_prompt_library_scene_id 
  ON prompt_library(scene_id) 
  WHERE scene_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_prompt_library_role 
  ON prompt_library(role);

CREATE INDEX IF NOT EXISTS idx_prompt_library_model 
  ON prompt_library(model);

-- 复合索引：按场景和角色查询（常用查询）
CREATE INDEX IF NOT EXISTS idx_prompt_library_scene_role 
  ON prompt_library(scene_id, role) 
  WHERE scene_id IS NOT NULL;

-- 复合索引：按场景、角色和模型查询
CREATE INDEX IF NOT EXISTS idx_prompt_library_scene_role_model 
  ON prompt_library(scene_id, role, model) 
  WHERE scene_id IS NOT NULL;

-- ============================================
-- 4. 添加注释说明字段用途
-- ============================================

COMMENT ON COLUMN prompt_library.scene_id IS 
  '关联的使用场景ID。Prompt是场景的实现层，不应该独立存在。';

COMMENT ON COLUMN prompt_library.role IS 
  'Prompt用途标签：default(推荐), fast(快速), high_quality(高质量), long_form(长视频), ads(广告), social(社交媒体), compliance_safe(合规安全)';

COMMENT ON COLUMN prompt_library.model IS 
  '支持的模型：sora, veo, gemini, universal(通用)';

COMMENT ON COLUMN prompt_library.version IS 
  '版本号，用于跟踪prompt的演进';

COMMENT ON COLUMN prompt_library.is_indexable IS 
  '是否可被搜索引擎索引。默认false，因为prompt是内部资产，不是内容主体。';

COMMENT ON COLUMN prompt_library.is_in_sitemap IS 
  '是否出现在sitemap中。默认false，因为prompt页面不应该被索引。';

-- ============================================
-- 5. 创建辅助函数：获取场景的推荐prompt
-- ============================================

CREATE OR REPLACE FUNCTION get_scene_default_prompt(scene_uuid UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  prompt TEXT,
  role TEXT,
  model TEXT,
  version INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.description,
    p.prompt,
    p.role,
    p.model,
    p.version
  FROM prompt_library p
  WHERE p.scene_id = scene_uuid
    AND p.role = 'default'
    AND p.is_published = TRUE
  ORDER BY p.version DESC, p.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. 创建辅助函数：获取场景的所有prompt（按角色分组）
-- ============================================

CREATE OR REPLACE FUNCTION get_scene_prompts_by_role(scene_uuid UUID)
RETURNS TABLE (
  role TEXT,
  prompts JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.role,
    jsonb_agg(
      jsonb_build_object(
        'id', p.id,
        'title', p.title,
        'description', p.description,
        'prompt', p.prompt,
        'model', p.model,
        'version', p.version
      )
      ORDER BY p.version DESC, p.created_at DESC
    ) as prompts
  FROM prompt_library p
  WHERE p.scene_id = scene_uuid
    AND p.is_published = TRUE
  GROUP BY p.role
  ORDER BY 
    CASE p.role
      WHEN 'default' THEN 1
      WHEN 'fast' THEN 2
      WHEN 'high_quality' THEN 3
      WHEN 'social' THEN 4
      WHEN 'ads' THEN 5
      WHEN 'long_form' THEN 6
      WHEN 'compliance_safe' THEN 7
      ELSE 8
    END;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. 数据验证：确保关键字段不为空（可选，根据需要调整）
-- ============================================

-- 注意：这里不强制 scene_id 非空，因为可能有一些遗留的独立 prompt
-- 但建议在应用层确保新创建的 prompt 都关联 scene

-- ============================================
-- 完成
-- ============================================

-- 输出迁移完成信息
DO $$
BEGIN
  RAISE NOTICE 'Migration 063 completed: Prompt-Scene relationship refactored';
  RAISE NOTICE 'New fields added: scene_id, role, model, version, is_indexable, is_in_sitemap';
  RAISE NOTICE 'Indexes created for optimized queries';
  RAISE NOTICE 'Helper functions created: get_scene_default_prompt, get_scene_prompts_by_role';
END $$;
