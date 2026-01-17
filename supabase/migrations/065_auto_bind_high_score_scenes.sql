-- 065_auto_bind_high_score_scenes.sql
-- 自动绑定脚本：将 Prompt 自动绑定到 AI_CITATION_SCORE 高的 Scene
-- 
-- 使用说明：
-- 1. 先准备一个 seed prompt（全局模板或行业通用模板）
-- 2. 运行此脚本，自动为 Tier1 高分场景补齐缺失的 prompt
-- 3. 可以多次运行，会自动跳过已存在的绑定

-- ============================================
-- 配置参数（修改这里）
-- ============================================

-- 最小 AI Citation Score 阈值
DO $$
DECLARE
  min_score NUMERIC := 0.65;
  seed_prompt_id UUID;  -- 需要先设置一个 seed prompt ID
  var_count INTEGER;    -- 用于统计插入的行数
BEGIN
  -- ⚠️ 重要：需要先创建一个 seed prompt（全局模板）
  -- 或者从现有的 prompt_templates 中选择一个作为模板
  -- 示例：SELECT id FROM prompt_templates WHERE owner_scope = 'global' LIMIT 1;
  
  -- 如果 seed_prompt_id 未设置，尝试从现有数据中找一个
  SELECT id INTO seed_prompt_id
  FROM prompt_templates
  WHERE owner_scope = 'global'
    OR (owner_scope = 'scene' AND scene_id IS NOT NULL)
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF seed_prompt_id IS NULL THEN
    RAISE NOTICE '⚠️  未找到 seed prompt，请先创建一个全局模板或场景模板';
    RETURN;
  END IF;
  
  RAISE NOTICE '使用 seed prompt ID: %', seed_prompt_id;
  RAISE NOTICE '最小 AI Citation Score: %', min_score;
  
  -- ============================================
  -- 步骤 1：为 Tier1 高分场景补齐默认 prompt（veo_fast + default）
  -- ============================================
  
  INSERT INTO public.prompt_templates (
    owner_scope,
    scene_id,
    model_id,
    role,
    content,
    variables,
    version,
    status,
    is_published,
    weight,
    rollout_pct,
    locale,
    created_at,
    updated_at
  )
  SELECT
    'scene',
    s.id,
    'veo_fast',
    'default',
    sp.content,
    sp.variables,
    1,
    'active',
    TRUE,
    100,
    100,
    COALESCE(sp.locale, 'en'),
    NOW(),
    NOW()
  FROM public.use_cases s
  CROSS JOIN public.prompt_templates sp
  WHERE sp.id = seed_prompt_id
    AND s.tier = 1
    AND s.noindex = FALSE
    AND s.in_sitemap = TRUE
    AND s.ai_citation_score >= min_score
    AND NOT EXISTS (
      SELECT 1 FROM public.prompt_templates p
      WHERE p.scene_id = s.id
        AND p.model_id = 'veo_fast'
        AND p.role = 'default'
        AND p.status = 'active'
        AND p.is_published = TRUE
    )
  ON CONFLICT DO NOTHING;
  
  GET DIAGNOSTICS var_count = ROW_COUNT;
  RAISE NOTICE '✅ 为 % 个场景创建了 veo_fast + default 模板', var_count;
  
  -- ============================================
  -- 步骤 2：为 Tier1 高分场景补齐高质量 prompt（veo_pro + high_quality）
  -- ============================================
  
  INSERT INTO public.prompt_templates (
    owner_scope,
    scene_id,
    model_id,
    role,
    content,
    variables,
    version,
    status,
    is_published,
    weight,
    rollout_pct,
    locale,
    created_at,
    updated_at
  )
  SELECT
    'scene',
    s.id,
    'veo_pro',
    'high_quality',
    sp.content,
    sp.variables,
    1,
    'active',
    TRUE,
    100,
    100,
    COALESCE(sp.locale, 'en'),
    NOW(),
    NOW()
  FROM public.use_cases s
  CROSS JOIN public.prompt_templates sp
  WHERE sp.id = seed_prompt_id
    AND s.tier = 1
    AND s.noindex = FALSE
    AND s.in_sitemap = TRUE
    AND s.ai_citation_score >= min_score
    AND NOT EXISTS (
      SELECT 1 FROM public.prompt_templates p
      WHERE p.scene_id = s.id
        AND p.model_id = 'veo_pro'
        AND p.role = 'high_quality'
        AND p.status = 'active'
        AND p.is_published = TRUE
    )
  ON CONFLICT DO NOTHING;
  
  GET DIAGNOSTICS var_count = ROW_COUNT;
  RAISE NOTICE '✅ 为 % 个场景创建了 veo_pro + high_quality 模板', var_count;
  
  -- ============================================
  -- 步骤 3：创建 scene_prompt_bindings（如果使用绑定表）
  -- ============================================
  
  INSERT INTO public.scene_prompt_bindings (
    scene_id,
    prompt_id,
    is_default,
    priority,
    enabled
  )
  SELECT 
    p.scene_id,
    p.id,
    CASE WHEN p.role = 'default' THEN TRUE ELSE FALSE END,
    CASE 
      WHEN p.role = 'default' THEN 1
      WHEN p.role = 'high_quality' THEN 2
      ELSE 100
    END,
    TRUE
  FROM public.prompt_templates p
  WHERE p.scene_id IN (
    SELECT id FROM public.use_cases
    WHERE tier = 1
      AND noindex = FALSE
      AND in_sitemap = TRUE
      AND ai_citation_score >= min_score
  )
    AND p.model_id IN ('veo_fast', 'veo_pro')
    AND p.role IN ('default', 'high_quality')
    AND p.status = 'active'
    AND p.is_published = TRUE
  ON CONFLICT (scene_id, prompt_id) DO NOTHING;
  
  GET DIAGNOSTICS var_count = ROW_COUNT;
  RAISE NOTICE '✅ 创建了 % 个场景-提示词绑定', var_count;
  
  -- ============================================
  -- 步骤 4：统计报告
  -- ============================================
  
  RAISE NOTICE '';
  RAISE NOTICE '📊 自动绑定完成统计：';
  RAISE NOTICE '  - Tier1 高分场景总数: %', (
    SELECT COUNT(*) FROM public.use_cases
    WHERE tier = 1 AND noindex = FALSE AND in_sitemap = TRUE AND ai_citation_score >= min_score
  );
  RAISE NOTICE '  - 已有 default prompt 的场景数: %', (
    SELECT COUNT(DISTINCT scene_id) FROM public.prompt_templates
    WHERE model_id = 'veo_fast' AND role = 'default' AND status = 'active' AND is_published = TRUE
      AND scene_id IN (
        SELECT id FROM public.use_cases
        WHERE tier = 1 AND noindex = FALSE AND in_sitemap = TRUE AND ai_citation_score >= min_score
      )
  );
  RAISE NOTICE '  - 已有 high_quality prompt 的场景数: %', (
    SELECT COUNT(DISTINCT scene_id) FROM public.prompt_templates
    WHERE model_id = 'veo_pro' AND role = 'high_quality' AND status = 'active' AND is_published = TRUE
      AND scene_id IN (
        SELECT id FROM public.use_cases
        WHERE tier = 1 AND noindex = FALSE AND in_sitemap = TRUE AND ai_citation_score >= min_score
      )
  );
  
END $$;

-- ============================================
-- 查询：找出仍然缺失 prompt 的场景（用于验证）
-- ============================================

-- 运行此查询查看哪些场景仍然缺失 prompt
SELECT 
  s.id,
  s.slug,
  s.title,
  s.ai_citation_score,
  COUNT(DISTINCT p.id) FILTER (WHERE p.model_id = 'veo_fast' AND p.role = 'default') as has_default,
  COUNT(DISTINCT p.id) FILTER (WHERE p.model_id = 'veo_pro' AND p.role = 'high_quality') as has_high_quality
FROM public.use_cases s
LEFT JOIN public.prompt_templates p ON p.scene_id = s.id
  AND p.status = 'active'
  AND p.is_published = TRUE
WHERE s.tier = 1
  AND s.noindex = FALSE
  AND s.in_sitemap = TRUE
  AND s.ai_citation_score >= 0.65
GROUP BY s.id, s.slug, s.title, s.ai_citation_score
HAVING COUNT(DISTINCT p.id) FILTER (WHERE p.model_id = 'veo_fast' AND p.role = 'default') = 0
   OR COUNT(DISTINCT p.id) FILTER (WHERE p.model_id = 'veo_pro' AND p.role = 'high_quality') = 0
ORDER BY s.ai_citation_score DESC
LIMIT 20;
