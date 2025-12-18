-- 036_add_industry_to_use_cases.sql
-- 为 use_cases 表添加 industry 字段，用于筛选和管理

-- 添加 industry 字段
ALTER TABLE use_cases 
ADD COLUMN IF NOT EXISTS industry TEXT;

-- 创建索引以便快速筛选
CREATE INDEX IF NOT EXISTS idx_use_cases_industry ON use_cases(industry);

-- 添加注释
COMMENT ON COLUMN use_cases.industry IS 'Industry category for filtering use cases (e.g., e-commerce, education, healthcare)';

