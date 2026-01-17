-- 067_migrate_remaining_prompts.sql
-- 迁移剩余的 prompt_library 数据到 prompt_templates
-- 如果迁移 064 的数据迁移部分没有完全执行，可以运行此脚本
--
-- 使用说明：
-- 1. 先运行 066_check_migration_status.sql 检查状态
-- 2. 如果有未迁移的数据，运行此脚本
-- 3. 可以多次运行，会自动跳过已存在的记录

-- ============================================
-- 迁移 prompt_library 到 prompt_templates（补充迁移）
-- ============================================

DO $$
DECLARE
  migrated_count INTEGER;
  total_to_migrate INTEGER;
BEGIN
  -- 统计需要迁移的数量
  SELECT COUNT(*) INTO total_to_migrate
  FROM prompt_library pl
  WHERE pl.scene_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM prompt_templates pt
      WHERE pt.scene_id = pl.scene_id
        AND pt.model_id = COALESCE(pl.model, 'sora')
        AND pt.role = COALESCE(pl.role, 'default')
    );
  
  RAISE NOTICE '📊 发现 % 个 prompt 需要迁移', total_to_migrate;
  
  IF total_to_migrate = 0 THEN
    RAISE NOTICE '✅ 所有数据已迁移，无需执行';
    RETURN;
  END IF;
  
  -- 执行迁移
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
    pl.scene_id,
    COALESCE(pl.model, 'sora') as model_id,
    COALESCE(pl.role, 'default') as role,
    pl.prompt as content,
    '{}'::jsonb as variables,
    COALESCE(pl.version, 1) as version,
    CASE 
      WHEN pl.is_published THEN 'active'
      ELSE 'draft'
    END as status,
    pl.is_published,
    100 as weight,
    100 as rollout_pct,
    pl.locale,
    pl.created_at,
    pl.updated_at
  FROM prompt_library pl
  WHERE pl.scene_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM prompt_templates pt
      WHERE pt.scene_id = pl.scene_id
        AND pt.model_id = COALESCE(pl.model, 'sora')
        AND pt.role = COALESCE(pl.role, 'default')
    )
  ON CONFLICT DO NOTHING;
  
  GET DIAGNOSTICS migrated_count = ROW_COUNT;
  
  RAISE NOTICE '✅ 成功迁移 % 个 prompt 到 prompt_templates', migrated_count;
  
  -- 检查是否还有未迁移的
  SELECT COUNT(*) INTO total_to_migrate
  FROM prompt_library pl
  WHERE pl.scene_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM prompt_templates pt
      WHERE pt.scene_id = pl.scene_id
        AND pt.model_id = COALESCE(pl.model, 'sora')
        AND pt.role = COALESCE(pl.role, 'default')
    );
  
  IF total_to_migrate > 0 THEN
    RAISE NOTICE '⚠️  仍有 % 个 prompt 未迁移（可能因为唯一约束冲突）', total_to_migrate;
  ELSE
    RAISE NOTICE '🎉 所有数据迁移完成！';
  END IF;
  
END $$;

-- ============================================
-- 验证迁移结果
-- ============================================

SELECT 
  '迁移结果统计' as check_type,
  (SELECT COUNT(*) FROM prompt_library WHERE scene_id IS NOT NULL) as "prompt_library中已关联场景的数量",
  (SELECT COUNT(*) FROM prompt_templates WHERE owner_scope = 'scene' AND scene_id IS NOT NULL) as "prompt_templates中场景模板数量",
  (SELECT COUNT(*) FROM prompt_library pl
   WHERE pl.scene_id IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM prompt_templates pt
       WHERE pt.scene_id = pl.scene_id
         AND pt.model_id = COALESCE(pl.model, 'sora')
         AND pt.role = COALESCE(pl.role, 'default')
     )
  ) as "仍未迁移的数量";
