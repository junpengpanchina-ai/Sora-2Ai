-- 确保 users 表有 credits 字段
-- 如果字段不存在，添加它
-- 如果字段存在但为 null，更新为 0

-- 添加 credits 字段（如果不存在）
ALTER TABLE users ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 0 CHECK (credits >= 0);

-- 更新所有 credits 为 null 的记录为 0
UPDATE users SET credits = 0 WHERE credits IS NULL;

-- 验证
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name = 'credits';

