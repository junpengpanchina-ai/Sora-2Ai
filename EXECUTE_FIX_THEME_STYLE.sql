-- 在 Supabase SQL Editor 中执行此脚本以修复 theme_style 约束
-- 这将允许保存 'christmas' 主题样式

-- 删除旧约束
ALTER TABLE homepage_settings 
  DROP CONSTRAINT IF EXISTS homepage_settings_theme_style_check;

-- 添加新约束（包含 christmas）
ALTER TABLE homepage_settings 
  ADD CONSTRAINT homepage_settings_theme_style_check 
  CHECK (theme_style IN ('cosmic', 'minimal', 'modern', 'classic', 'christmas'));

-- 验证约束
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'homepage_settings'::regclass
  AND conname LIKE '%theme_style%';

