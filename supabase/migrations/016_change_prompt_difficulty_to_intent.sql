-- 016_change_prompt_difficulty_to_intent.sql
-- 将 prompt_library 表的 difficulty 字段改为 intent 字段
-- 从 'beginner'/'intermediate'/'advanced' 改为 'information'/'comparison'/'transaction'

-- 1. 添加新的 intent 列（临时）
ALTER TABLE prompt_library
  ADD COLUMN IF NOT EXISTS intent TEXT;

-- 2. 将 difficulty 值映射到 intent 值
-- beginner -> information (默认信息型)
-- intermediate -> comparison (默认对比型)
-- advanced -> transaction (默认交易型)
UPDATE prompt_library
SET intent = CASE
  WHEN difficulty = 'beginner' THEN 'information'
  WHEN difficulty = 'intermediate' THEN 'comparison'
  WHEN difficulty = 'advanced' THEN 'transaction'
  ELSE 'information'  -- 默认值
END;

-- 3. 设置 intent 为 NOT NULL
ALTER TABLE prompt_library
  ALTER COLUMN intent SET NOT NULL;

-- 4. 添加 CHECK 约束
ALTER TABLE prompt_library
  ADD CONSTRAINT prompt_library_intent_check 
  CHECK (intent IN ('information', 'comparison', 'transaction'));

-- 5. 删除旧的 difficulty 列
ALTER TABLE prompt_library
  DROP COLUMN IF EXISTS difficulty;

-- 6. 重命名 intent 列为 difficulty（保持向后兼容，但实际存储的是 intent 值）
ALTER TABLE prompt_library
  RENAME COLUMN intent TO difficulty;

-- 7. 更新索引（如果有基于 difficulty 的索引）
DROP INDEX IF EXISTS idx_prompt_library_difficulty;
CREATE INDEX IF NOT EXISTS idx_prompt_library_difficulty ON prompt_library(difficulty);

