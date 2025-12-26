-- 043_add_geo_to_batch_generation_tasks.sql
-- 为批量生成任务表添加GEO字段

ALTER TABLE batch_generation_tasks
ADD COLUMN IF NOT EXISTS geo TEXT DEFAULT 'US';

-- 添加注释
COMMENT ON COLUMN batch_generation_tasks.geo IS 'GEO地区代码，用于模型选择策略（如 US, CN, GB）';

