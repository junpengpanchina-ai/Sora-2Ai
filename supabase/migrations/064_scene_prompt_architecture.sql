-- 064_scene_prompt_architecture.sql
-- Scene ↔ Prompt 架构重构：Scene 是稳定语义锚点，Prompt 是可迭代资产
--
-- 核心原则：
-- - Scene 是内容与SEO的第一公民（稳定语义锚点）
-- - Prompt 是内部资产/能力实现（版本化、可灰度、可回滚）
-- - 数据驱动：自动绑定到 AI_CITATION_SCORE 高的 Scene

-- ============================================
-- 1. 增强 scenes 表（use_cases 的增强版）
-- ============================================

-- 注意：如果 use_cases 表已存在，我们添加新字段
-- 如果不存在，创建新表（但通常 use_cases 已存在）

-- 添加 SEO/GEO 控制字段到 use_cases（如果不存在）
ALTER TABLE use_cases
  ADD COLUMN IF NOT EXISTS tier SMALLINT DEFAULT 2,
  ADD COLUMN IF NOT EXISTS in_sitemap BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS noindex BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS canonical_url TEXT,
  ADD COLUMN IF NOT EXISTS ai_citation_score NUMERIC(6,3) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS index_health_status TEXT DEFAULT 'unknown';

-- 创建索引
CREATE INDEX IF NOT EXISTS use_cases_tier_idx ON use_cases(tier);
CREATE INDEX IF NOT EXISTS use_cases_sitemap_idx ON use_cases(in_sitemap);
CREATE INDEX IF NOT EXISTS use_cases_noindex_idx ON use_cases(noindex);
CREATE INDEX IF NOT EXISTS use_cases_ai_score_idx ON use_cases(ai_citation_score DESC);

-- 添加注释
COMMENT ON COLUMN use_cases.tier IS 'Tier等级：1(核心)/2(重要)/3(一般)';
COMMENT ON COLUMN use_cases.in_sitemap IS '是否在sitemap中';
COMMENT ON COLUMN use_cases.noindex IS '是否禁止索引';
COMMENT ON COLUMN use_cases.ai_citation_score IS 'AI引用分数（0-1），用于数据驱动绑定';
COMMENT ON COLUMN use_cases.index_health_status IS '索引健康状态：ok/warn/bad/unknown';

-- ============================================
-- 2. 创建 prompt_templates 表（版本化+角色+模型）
-- ============================================

CREATE TABLE IF NOT EXISTS public.prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 归属
  owner_scope TEXT NOT NULL DEFAULT 'scene' CHECK (owner_scope IN ('scene', 'global')),
  scene_id UUID REFERENCES public.use_cases(id) ON DELETE CASCADE,

  -- 模型/用途
  model_id TEXT NOT NULL,                    -- sora / veo_fast / veo_pro / gemini_2_5 / gemini_3_pro...
  role TEXT NOT NULL,                        -- default / fast / high_quality / social / ads / compliance_safe
  content TEXT NOT NULL,                     -- 模板正文（可包含变量 {{...}}）
  variables JSONB DEFAULT '{}'::jsonb,        -- 可选：变量 schema/默认值

  -- 版本化
  version INTEGER NOT NULL DEFAULT 1,
  parent_id UUID REFERENCES public.prompt_templates(id), -- 可选：来源版本
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'deprecated')),
  is_published BOOLEAN NOT NULL DEFAULT FALSE,

  -- 灰度/AB
  weight INTEGER NOT NULL DEFAULT 100,            -- 0-1000，控制抽样概率
  rollout_pct INTEGER NOT NULL DEFAULT 100,       -- 0-100
  min_plan TEXT,                              -- starter/creator/studio/pro (可选)
  locale TEXT,                                -- en/ja/zh/... (可选)

  -- 维护字段
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS prompt_templates_scene_idx ON public.prompt_templates(scene_id);
CREATE INDEX IF NOT EXISTS prompt_templates_model_role_idx ON public.prompt_templates(model_id, role);
CREATE INDEX IF NOT EXISTS prompt_templates_status_idx ON public.prompt_templates(status);
CREATE INDEX IF NOT EXISTS prompt_templates_published_idx ON public.prompt_templates(is_published);
CREATE INDEX IF NOT EXISTS prompt_templates_owner_scope_idx ON public.prompt_templates(owner_scope);

-- 关键约束：每个 scene + model_id + role 只允许一个"published + active"
CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_published
ON public.prompt_templates(scene_id, model_id, role)
WHERE status = 'active' AND is_published = TRUE;

-- 添加注释
COMMENT ON TABLE public.prompt_templates IS '提示词模板库：版本化+角色+模型，支持灰度发布和AB测试';
COMMENT ON COLUMN public.prompt_templates.owner_scope IS '归属范围：scene(场景模板) / global(全局模板)';
COMMENT ON COLUMN public.prompt_templates.model_id IS '模型ID：sora/veo_fast/veo_pro/gemini_2_5/gemini_3_pro等';
COMMENT ON COLUMN public.prompt_templates.role IS '用途角色：default/fast/high_quality/social/ads/compliance_safe';
COMMENT ON COLUMN public.prompt_templates.weight IS '权重：0-1000，控制抽样概率（AB测试）';
COMMENT ON COLUMN public.prompt_templates.rollout_pct IS '灰度百分比：0-100，控制发布范围';

-- ============================================
-- 3. 创建 scene_prompt_bindings 表（绑定表：一场景多模板）
-- ============================================

CREATE TABLE IF NOT EXISTS public.scene_prompt_bindings (
  id BIGSERIAL PRIMARY KEY,
  scene_id UUID NOT NULL REFERENCES public.use_cases(id) ON DELETE CASCADE,
  prompt_id UUID NOT NULL REFERENCES public.prompt_templates(id) ON DELETE CASCADE,

  -- 绑定语义
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  priority INTEGER NOT NULL DEFAULT 100,          -- 越小越靠前
  enabled BOOLEAN NOT NULL DEFAULT TRUE,

  -- 数据驱动字段（自动维护）
  last_used_at TIMESTAMPTZ,
  success_rate NUMERIC(5,2) DEFAULT 0,        -- 0-100
  quality_score NUMERIC(6,3) DEFAULT 0,       -- 0-1 or 0-100
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(scene_id, prompt_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS spb_scene_idx ON public.scene_prompt_bindings(scene_id, enabled, priority);
CREATE INDEX IF NOT EXISTS spb_default_idx ON public.scene_prompt_bindings(scene_id, is_default);
CREATE INDEX IF NOT EXISTS spb_prompt_idx ON public.scene_prompt_bindings(prompt_id);

-- 添加注释
COMMENT ON TABLE public.scene_prompt_bindings IS '场景-提示词绑定表：支持数据驱动的自动绑定和排序';
COMMENT ON COLUMN public.scene_prompt_bindings.priority IS '优先级：越小越靠前，用于排序';
COMMENT ON COLUMN public.scene_prompt_bindings.success_rate IS '成功率：0-100，数据驱动维护';
COMMENT ON COLUMN public.scene_prompt_bindings.quality_score IS '质量分数：0-1或0-100，数据驱动维护';

-- ============================================
-- 4. 从 prompt_library 迁移数据到 prompt_templates（可选）
-- ============================================

-- 迁移现有 prompt_library 数据到 prompt_templates
-- 注意：只迁移已关联场景的 prompt（scene_id 不为空）
INSERT INTO public.prompt_templates (
  owner_scope,
  scene_id,
  model_id,
  role,
  content,
  version,
  status,
  is_published,
  locale,
  created_at,
  updated_at
)
SELECT 
  'scene',
  scene_id,
  COALESCE(model, 'sora') as model_id,
  COALESCE(role, 'default') as role,
  prompt as content,
  COALESCE(version, 1) as version,
  CASE 
    WHEN is_published THEN 'active'
    ELSE 'draft'
  END as status,
  is_published,
  locale,
  created_at,
  updated_at
FROM prompt_library
WHERE scene_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.prompt_templates pt
    WHERE pt.scene_id = prompt_library.scene_id
      AND pt.model_id = COALESCE(prompt_library.model, 'sora')
      AND pt.role = COALESCE(prompt_library.role, 'default')
  )
ON CONFLICT DO NOTHING;

-- ============================================
-- 5. 创建自动绑定辅助函数
-- ============================================

-- 函数：获取场景的默认 prompt（按优先级和权重）
CREATE OR REPLACE FUNCTION get_scene_default_prompt_v2(
  scene_uuid UUID,
  model_name TEXT DEFAULT 'veo_fast',
  role_name TEXT DEFAULT 'default'
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  model_id TEXT,
  role TEXT,
  version INTEGER,
  weight INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pt.id,
    pt.content,
    pt.model_id,
    pt.role,
    pt.version,
    pt.weight
  FROM public.prompt_templates pt
  LEFT JOIN public.scene_prompt_bindings spb ON spb.prompt_id = pt.id
  WHERE pt.scene_id = scene_uuid
    AND pt.model_id = model_name
    AND pt.role = role_name
    AND pt.status = 'active'
    AND pt.is_published = TRUE
    AND (spb.enabled IS NULL OR spb.enabled = TRUE)
  ORDER BY 
    COALESCE(spb.is_default, FALSE) DESC,
    COALESCE(spb.priority, 100) ASC,
    pt.weight DESC,
    pt.version DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- 函数：找出 Tier1 高分但缺 prompt 的 scenes
CREATE OR REPLACE FUNCTION find_scenes_missing_prompts(
  min_score NUMERIC DEFAULT 0.65,
  limit_count INTEGER DEFAULT 5000
)
RETURNS TABLE (
  scene_id UUID,
  scene_slug TEXT,
  scene_title TEXT,
  ai_citation_score NUMERIC,
  missing_models TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.slug,
    s.title,
    s.ai_citation_score,
    ARRAY_AGG(DISTINCT expected.model_id) FILTER (WHERE expected.model_id IS NOT NULL) as missing_models
  FROM public.use_cases s
  CROSS JOIN (
    SELECT unnest(ARRAY['veo_fast', 'veo_pro', 'sora']) as model_id
  ) expected
  LEFT JOIN public.prompt_templates p
    ON p.scene_id = s.id
    AND p.model_id = expected.model_id
    AND p.role = 'default'
    AND p.status = 'active'
    AND p.is_published = TRUE
  WHERE s.tier = 1
    AND s.noindex = FALSE
    AND s.in_sitemap = TRUE
    AND s.ai_citation_score >= min_score
    AND p.id IS NULL
  GROUP BY s.id, s.slug, s.title, s.ai_citation_score
  HAVING COUNT(p.id) = 0
  ORDER BY s.ai_citation_score DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. 更新时间触发器
-- ============================================

-- prompt_templates 更新时间触发器
CREATE OR REPLACE FUNCTION update_prompt_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_prompt_templates_updated_at ON public.prompt_templates;
CREATE TRIGGER trigger_update_prompt_templates_updated_at
  BEFORE UPDATE ON public.prompt_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_prompt_templates_updated_at();

-- scene_prompt_bindings 更新时间触发器
CREATE OR REPLACE FUNCTION update_scene_prompt_bindings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_scene_prompt_bindings_updated_at ON public.scene_prompt_bindings;
CREATE TRIGGER trigger_update_scene_prompt_bindings_updated_at
  BEFORE UPDATE ON public.scene_prompt_bindings
  FOR EACH ROW
  EXECUTE FUNCTION update_scene_prompt_bindings_updated_at();

-- ============================================
-- 完成
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 064 completed: Scene-Prompt architecture refactored';
  RAISE NOTICE 'Enhanced use_cases table with SEO/GEO fields';
  RAISE NOTICE 'Created prompt_templates table (versioned, role-based, model-specific)';
  RAISE NOTICE 'Created scene_prompt_bindings table (data-driven bindings)';
  RAISE NOTICE 'Migrated data from prompt_library to prompt_templates';
  RAISE NOTICE 'Created helper functions: get_scene_default_prompt_v2, find_scenes_missing_prompts';
END $$;
