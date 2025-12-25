-- 040_verify_migration.sql
-- 验证 use_case_type 重构迁移是否成功

-- 查询1: 查看新类型的分布情况
SELECT 
  use_case_type,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM use_cases), 2) as percentage
FROM use_cases
GROUP BY use_case_type
ORDER BY count DESC;

-- 查询2: 检查是否还有旧类型（应该返回0行）
SELECT 
  use_case_type,
  COUNT(*) as count
FROM use_cases
WHERE use_case_type IN ('ads', 'marketing', 'social-media', 'youtube', 'tiktok', 'instagram', 'twitter', 'product-demo', 'education', 'other')
GROUP BY use_case_type;

-- 查询3: 验证约束是否正确（应该只看到6个新类型）
SELECT DISTINCT use_case_type
FROM use_cases
ORDER BY use_case_type;

-- 查询4: 总数验证
SELECT 
  COUNT(*) as total_records,
  COUNT(DISTINCT use_case_type) as distinct_types
FROM use_cases;

