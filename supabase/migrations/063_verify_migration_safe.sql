-- 063_verify_migration_safe.sql
-- 安全版本的验证脚本 - 先检查字段是否存在再执行验证
-- 在 Supabase SQL Editor 中运行此查询来验证迁移结果

-- ============================================
-- 预检查：确认迁移是否已执行
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
    RAISE EXCEPTION '迁移 063 尚未执行！请先执行: 063_refactor_prompt_scene_relationship.sql';
  END IF;
END $$;

-- ============================================
-- 1. 检查新字段
-- ============================================
SELECT 
  '新字段检查' as check_type,
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'prompt_library'
  AND column_name IN ('scene_id', 'role', 'model', 'version', 'is_indexable', 'is_in_sitemap')
ORDER BY column_name;

-- ============================================
-- 2. 检查索引
-- ============================================
SELECT 
  '索引检查' as check_type,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'prompt_library'
  AND indexname LIKE 'idx_prompt_library_%'
ORDER BY indexname;

-- ============================================
-- 3. 检查辅助函数
-- ============================================
SELECT 
  '函数检查' as check_type,
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('get_scene_default_prompt', 'get_scene_prompts_by_role')
ORDER BY routine_name;

-- ============================================
-- 4. 检查数据迁移（只在字段存在时执行）
-- ============================================
SELECT 
  '数据迁移检查' as check_type,
  COUNT(*) as total_prompts,
  COUNT(scene_id) as prompts_with_scene,
  COUNT(*) - COUNT(scene_id) as prompts_without_scene,
  COUNT(CASE WHEN role = 'default' THEN 1 END) as default_role_count,
  COUNT(CASE WHEN model = 'sora' THEN 1 END) as sora_model_count,
  COUNT(CASE WHEN is_indexable = FALSE THEN 1 END) as not_indexable_count,
  COUNT(CASE WHEN is_in_sitemap = FALSE THEN 1 END) as not_in_sitemap_count
FROM prompt_library;

-- ============================================
-- 5. 检查场景关联示例（如果有数据）
-- ============================================
SELECT 
  '场景关联示例' as check_type,
  uc.id as scene_id,
  uc.title as scene_title,
  COUNT(p.id) as prompt_count
FROM use_cases uc
LEFT JOIN prompt_library p ON p.scene_id = uc.id
GROUP BY uc.id, uc.title
HAVING COUNT(p.id) > 0
ORDER BY prompt_count DESC
LIMIT 5;
