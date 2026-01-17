-- 063_migrate_data_batch.sql
-- 数据迁移脚本 - 将 featured_prompt_ids 关联到 scene_id
-- ⚠️ 这个脚本需要在上面的结构迁移执行成功后再运行
-- 
-- 说明：分批执行数据迁移，避免超时
-- 如果数据量大，可能需要多次运行这个脚本

-- ============================================
-- 方法 1：分批迁移（推荐）- 每次处理 100 个 use cases
-- ============================================

-- 为现有的 prompt 关联场景
-- 通过 use_cases.featured_prompt_ids 数组字段反向关联
-- 使用 CTE 和 LIMIT 分批处理
WITH use_cases_batch AS (
  SELECT 
    uc.id as scene_id,
    uc.featured_prompt_ids
  FROM use_cases uc
  WHERE uc.featured_prompt_ids IS NOT NULL 
    AND array_length(uc.featured_prompt_ids, 1) > 0
    AND EXISTS (
      SELECT 1 
      FROM prompt_library p 
      WHERE p.id = ANY(uc.featured_prompt_ids)
        AND p.scene_id IS NULL
    )
  LIMIT 100  -- 每次处理 100 个 use cases
)
UPDATE prompt_library p
SET scene_id = uc_batch.scene_id
FROM use_cases_batch uc_batch
WHERE p.id = ANY(uc_batch.featured_prompt_ids)
  AND p.scene_id IS NULL;

-- ============================================
-- 方法 2：如果有大量数据，可以使用这个循环版本
-- ============================================

-- ⚠️ 注意：这个方法会循环执行，直到所有数据都迁移完成
-- 如果数据量很大，建议手动分批执行上面的方法 1

DO $$
DECLARE
  batch_count INTEGER := 0;
  total_updated INTEGER := 1;
BEGIN
  -- 循环执行，直到没有更多数据需要迁移
  WHILE total_updated > 0 LOOP
    -- 执行一批迁移
    WITH use_cases_batch AS (
      SELECT 
        uc.id as scene_id,
        uc.featured_prompt_ids
      FROM use_cases uc
      WHERE uc.featured_prompt_ids IS NOT NULL 
        AND array_length(uc.featured_prompt_ids, 1) > 0
        AND EXISTS (
          SELECT 1 
          FROM prompt_library p 
          WHERE p.id = ANY(uc.featured_prompt_ids)
            AND p.scene_id IS NULL
        )
      LIMIT 100
    )
    UPDATE prompt_library p
    SET scene_id = uc_batch.scene_id
    FROM use_cases_batch uc_batch
    WHERE p.id = ANY(uc_batch.featured_prompt_ids)
      AND p.scene_id IS NULL;
    
    GET DIAGNOSTICS total_updated = ROW_COUNT;
    batch_count := batch_count + 1;
    
    -- 避免无限循环
    IF batch_count > 1000 THEN
      RAISE NOTICE '⚠️  已执行 % 批次，可能还有数据未迁移。请手动检查。', batch_count;
      EXIT;
    END IF;
    
    -- 如果没有更新，退出循环
    IF total_updated = 0 THEN
      RAISE NOTICE '✅ 数据迁移完成，共执行 % 批次', batch_count;
      EXIT;
    END IF;
    
    RAISE NOTICE '批次 %: 迁移了 % 条记录', batch_count, total_updated;
  END LOOP;
END $$;

-- ============================================
-- 验证迁移结果
-- ============================================

SELECT 
  '数据迁移统计' as check_type,
  COUNT(*) as total_prompts,
  COUNT(scene_id) as prompts_with_scene,
  COUNT(*) - COUNT(scene_id) as prompts_without_scene,
  (COUNT(scene_id)::float / NULLIF(COUNT(*), 0) * 100)::numeric(5,2) as migration_percentage
FROM prompt_library;

-- ============================================
-- 检查哪些 use_cases 还有未关联的 prompts
-- ============================================

SELECT 
  '未关联的 prompts 统计' as check_type,
  uc.id as use_case_id,
  uc.title as use_case_title,
  array_length(uc.featured_prompt_ids, 1) as total_featured_prompts,
  COUNT(p.id) as already_linked_prompts,
  array_length(uc.featured_prompt_ids, 1) - COUNT(p.id) as remaining_unlinked
FROM use_cases uc
LEFT JOIN prompt_library p ON p.id = ANY(uc.featured_prompt_ids) AND p.scene_id = uc.id
WHERE uc.featured_prompt_ids IS NOT NULL 
  AND array_length(uc.featured_prompt_ids, 1) > 0
GROUP BY uc.id, uc.title, uc.featured_prompt_ids
HAVING array_length(uc.featured_prompt_ids, 1) - COUNT(p.id) > 0
ORDER BY remaining_unlinked DESC
LIMIT 10;
