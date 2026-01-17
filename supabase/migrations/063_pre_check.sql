-- 063_pre_check.sql
-- 在执行迁移 063 之前，检查当前状态
-- 如果这个查询显示字段已存在，说明迁移已经执行过了

-- ============================================
-- 检查 prompt_library 表当前有哪些字段
-- ============================================
SELECT 
  '当前 prompt_library 表字段' as check_type,
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'prompt_library'
ORDER BY ordinal_position;

-- ============================================
-- 检查是否存在 scene_id 字段（迁移后应该有）
-- ============================================
SELECT 
  'scene_id 字段检查' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'prompt_library' 
        AND column_name = 'scene_id'
    ) THEN '✅ scene_id 字段已存在 - 迁移可能已执行'
    ELSE '❌ scene_id 字段不存在 - 需要执行迁移 063'
  END as status;

-- ============================================
-- 如果字段不存在，显示提示信息
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'prompt_library' 
      AND column_name = 'scene_id'
  ) THEN
    RAISE NOTICE '⚠️  迁移 063 尚未执行。请先执行: supabase/migrations/063_refactor_prompt_scene_relationship.sql';
  ELSE
    RAISE NOTICE '✅ 迁移 063 似乎已执行。可以运行验证脚本: 063_verify_migration.sql';
  END IF;
END $$;
