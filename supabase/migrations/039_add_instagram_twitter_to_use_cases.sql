-- 039_add_instagram_twitter_to_use_cases.sql
-- 添加 Instagram 和 Twitter (X) 类型到 use_cases 表

-- 删除旧的 CHECK 约束
ALTER TABLE use_cases 
  DROP CONSTRAINT IF EXISTS use_cases_use_case_type_check;

-- 添加新的 CHECK 约束，包含 instagram 和 twitter
ALTER TABLE use_cases
  ADD CONSTRAINT use_cases_use_case_type_check 
  CHECK (use_case_type IN (
    'marketing', 
    'social-media', 
    'youtube', 
    'tiktok', 
    'instagram',
    'twitter',
    'product-demo', 
    'ads', 
    'education', 
    'other'
  ));

