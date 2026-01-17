-- 066_check_migration_status.sql
-- 检查迁移状态：验证哪些数据已迁移，哪些还需要迁移
-- 在 Supabase SQL Editor 中运行此查询来检查迁移状态

-- ============================================
-- 1. 检查表结构是否已创建
-- ============================================

SELECT 
  '表结构检查' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'prompt_templates'
    ) THEN '✅ prompt_templates 表已创建'
    ELSE '❌ prompt_templates 表未创建 - 需要执行迁移 064'
  END as status
UNION ALL
SELECT 
  '表结构检查',
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'scene_prompt_bindings'
    ) THEN '✅ scene_prompt_bindings 表已创建'
    ELSE '❌ scene_prompt_bindings 表未创建 - 需要执行迁移 064'
  END
UNION ALL
SELECT 
  '表结构检查',
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'use_cases' 
        AND column_name = 'tier'
    ) THEN '✅ use_cases.tier 字段已创建'
    ELSE '❌ use_cases.tier 字段未创建 - 需要执行迁移 064'
  END
UNION ALL
SELECT 
  '表结构检查',
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'use_cases' 
        AND column_name = 'ai_citation_score'
    ) THEN '✅ use_cases.ai_citation_score 字段已创建'
    ELSE '❌ use_cases.ai_citation_score 字段未创建 - 需要执行迁移 064'
  END;

-- ============================================
-- 2. 检查 prompt_library 到 prompt_templates 的数据迁移
-- ============================================

SELECT 
  '数据迁移检查' as check_type,
  'prompt_library 总数' as metric,
  COUNT(*)::text as value
FROM prompt_library
UNION ALL
SELECT 
  '数据迁移检查',
  'prompt_library 中已关联场景的数量',
  COUNT(*)::text
FROM prompt_library
WHERE scene_id IS NOT NULL
UNION ALL
SELECT 
  '数据迁移检查',
  'prompt_templates 总数',
  COUNT(*)::text
FROM prompt_templates
UNION ALL
SELECT 
  '数据迁移检查',
  'prompt_templates 中场景模板数量',
  COUNT(*)::text
FROM prompt_templates
WHERE owner_scope = 'scene' AND scene_id IS NOT NULL
UNION ALL
SELECT 
  '数据迁移检查',
  'prompt_templates 中全局模板数量',
  COUNT(*)::text
FROM prompt_templates
WHERE owner_scope = 'global';

-- ============================================
-- 3. 检查哪些 prompt_library 数据还未迁移到 prompt_templates
-- ============================================

SELECT 
  '未迁移数据检查' as check_type,
  COUNT(*) as "未迁移的prompt数量",
  COUNT(DISTINCT scene_id) as "涉及的场景数量"
FROM prompt_library pl
WHERE pl.scene_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM prompt_templates pt
    WHERE pt.scene_id = pl.scene_id
      AND pt.model_id = COALESCE(pl.model, 'sora')
      AND pt.role = COALESCE(pl.role, 'default')
  );

-- ============================================
-- 4. 检查 Tier1 高分场景的 prompt 覆盖情况
-- ============================================

SELECT 
  'Tier1场景检查' as check_type,
  COUNT(*) as "Tier1场景总数",
  COUNT(DISTINCT pt.scene_id) FILTER (WHERE pt.model_id = 'veo_fast' AND pt.role = 'default' AND pt.status = 'active' AND pt.is_published = TRUE) as "有default_prompt的场景数",
  COUNT(DISTINCT pt.scene_id) FILTER (WHERE pt.model_id = 'veo_pro' AND pt.role = 'high_quality' AND pt.status = 'active' AND pt.is_published = TRUE) as "有high_quality_prompt的场景数"
FROM use_cases uc
LEFT JOIN prompt_templates pt ON pt.scene_id = uc.id
WHERE uc.tier = 1
  AND uc.noindex = FALSE
  AND uc.in_sitemap = TRUE
  AND uc.ai_citation_score >= 0.65;

-- ============================================
-- 5. 找出仍然缺失 prompt 的 Tier1 高分场景（详细列表）
-- ============================================

SELECT 
  '缺失Prompt的场景列表' as check_type,
  uc.id as scene_id,
  uc.slug,
  uc.title,
  uc.ai_citation_score,
  CASE 
    WHEN NOT EXISTS (
      SELECT 1 FROM prompt_templates pt
      WHERE pt.scene_id = uc.id
        AND pt.model_id = 'veo_fast'
        AND pt.role = 'default'
        AND pt.status = 'active'
        AND pt.is_published = TRUE
    ) THEN '❌ 缺少 veo_fast + default'
    ELSE '✅ 已有 veo_fast + default'
  END as default_status,
  CASE 
    WHEN NOT EXISTS (
      SELECT 1 FROM prompt_templates pt
      WHERE pt.scene_id = uc.id
        AND pt.model_id = 'veo_pro'
        AND pt.role = 'high_quality'
        AND pt.status = 'active'
        AND pt.is_published = TRUE
    ) THEN '❌ 缺少 veo_pro + high_quality'
    ELSE '✅ 已有 veo_pro + high_quality'
  END as high_quality_status
FROM use_cases uc
WHERE uc.tier = 1
  AND uc.noindex = FALSE
  AND uc.in_sitemap = TRUE
  AND uc.ai_citation_score >= 0.65
  AND (
    NOT EXISTS (
      SELECT 1 FROM prompt_templates pt
      WHERE pt.scene_id = uc.id
        AND pt.model_id = 'veo_fast'
        AND pt.role = 'default'
        AND pt.status = 'active'
        AND pt.is_published = TRUE
    )
    OR NOT EXISTS (
      SELECT 1 FROM prompt_templates pt
      WHERE pt.scene_id = uc.id
        AND pt.model_id = 'veo_pro'
        AND pt.role = 'high_quality'
        AND pt.status = 'active'
        AND pt.is_published = TRUE
    )
  )
ORDER BY uc.ai_citation_score DESC
LIMIT 50;

-- ============================================
-- 6. 检查 scene_prompt_bindings 绑定情况
-- ============================================

SELECT 
  '绑定表检查' as check_type,
  COUNT(*) as "绑定总数",
  COUNT(DISTINCT scene_id) as "已绑定的场景数",
  COUNT(DISTINCT prompt_id) as "已绑定的prompt数",
  COUNT(*) FILTER (WHERE is_default = TRUE) as "默认绑定数",
  COUNT(*) FILTER (WHERE enabled = TRUE) as "启用的绑定数"
FROM scene_prompt_bindings;

-- ============================================
-- 7. 检查 use_cases 表的新字段数据填充情况
-- ============================================

SELECT 
  'use_cases字段检查' as check_type,
  COUNT(*) as "总场景数",
  COUNT(tier) as "有tier值的场景数",
  COUNT(in_sitemap) FILTER (WHERE in_sitemap = TRUE) as "in_sitemap为true的场景数",
  COUNT(noindex) FILTER (WHERE noindex = FALSE) as "noindex为false的场景数",
  COUNT(ai_citation_score) FILTER (WHERE ai_citation_score >= 0.65) as "AI分数>=0.65的场景数",
  COUNT(index_health_status) as "有健康状态的场景数"
FROM use_cases;

-- ============================================
-- 8. 迁移建议汇总
-- ============================================

DO $$
DECLARE
  missing_tables INTEGER;
  missing_columns INTEGER;
  unmigrated_prompts INTEGER;
  missing_bindings INTEGER;
BEGIN
  -- 检查缺失的表
  SELECT COUNT(*) INTO missing_tables
  FROM (
    SELECT 'prompt_templates' as table_name
    UNION ALL SELECT 'scene_prompt_bindings'
  ) expected
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.tables t
    WHERE t.table_schema = 'public' AND t.table_name = expected.table_name
  );
  
  -- 检查缺失的字段
  SELECT COUNT(*) INTO missing_columns
  FROM (
    SELECT 'tier' as column_name
    UNION ALL SELECT 'ai_citation_score'
    UNION ALL SELECT 'in_sitemap'
    UNION ALL SELECT 'noindex'
  ) expected
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.columns c
    WHERE c.table_schema = 'public' 
      AND c.table_name = 'use_cases' 
      AND c.column_name = expected.column_name
  );
  
  -- 检查未迁移的 prompt
  SELECT COUNT(*) INTO unmigrated_prompts
  FROM prompt_library pl
  WHERE pl.scene_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM prompt_templates pt
      WHERE pt.scene_id = pl.scene_id
        AND pt.model_id = COALESCE(pl.model, 'sora')
        AND pt.role = COALESCE(pl.role, 'default')
    );
  
  -- 检查缺失的绑定
  SELECT COUNT(*) INTO missing_bindings
  FROM use_cases uc
  WHERE uc.tier = 1
    AND uc.noindex = FALSE
    AND uc.in_sitemap = TRUE
    AND uc.ai_citation_score >= 0.65
    AND EXISTS (
      SELECT 1 FROM prompt_templates pt
      WHERE pt.scene_id = uc.id
        AND pt.status = 'active'
        AND pt.is_published = TRUE
    )
    AND NOT EXISTS (
      SELECT 1 FROM scene_prompt_bindings spb
      WHERE spb.scene_id = uc.id
    );
  
  -- 输出建议
  RAISE NOTICE '';
  RAISE NOTICE '📊 迁移状态检查结果：';
  RAISE NOTICE '';
  
  IF missing_tables > 0 OR missing_columns > 0 THEN
    RAISE NOTICE '⚠️  需要执行迁移 064：';
    IF missing_tables > 0 THEN
      RAISE NOTICE '   - 缺失 % 个表，需要创建表结构', missing_tables;
    END IF;
    IF missing_columns > 0 THEN
      RAISE NOTICE '   - 缺失 % 个字段，需要添加字段', missing_columns;
    END IF;
  ELSE
    RAISE NOTICE '✅ 迁移 064 已完成：表结构已创建';
  END IF;
  
  RAISE NOTICE '';
  
  IF unmigrated_prompts > 0 THEN
    RAISE NOTICE '⚠️  有 % 个 prompt 还未从 prompt_library 迁移到 prompt_templates', unmigrated_prompts;
    RAISE NOTICE '   建议：重新运行迁移 064 的数据迁移部分，或手动迁移';
  ELSE
    RAISE NOTICE '✅ 数据迁移完成：所有 prompt_library 数据已迁移到 prompt_templates';
  END IF;
  
  RAISE NOTICE '';
  
  IF missing_bindings > 0 THEN
    RAISE NOTICE '⚠️  有 % 个 Tier1 高分场景的 prompt 还未创建绑定关系', missing_bindings;
    RAISE NOTICE '   建议：执行迁移 065（自动绑定脚本）';
  ELSE
    RAISE NOTICE '✅ 绑定关系完整：所有 Tier1 高分场景都有绑定关系';
  END IF;
  
  RAISE NOTICE '';
  
  IF missing_tables = 0 AND missing_columns = 0 AND unmigrated_prompts = 0 AND missing_bindings = 0 THEN
    RAISE NOTICE '🎉 所有迁移已完成！';
  END IF;
  
END $$;
