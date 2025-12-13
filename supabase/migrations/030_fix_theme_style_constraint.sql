-- 修复 homepage_settings 表的 theme_style 约束，添加 'christmas' 选项
-- 删除旧约束并添加新约束（包含 christmas）

ALTER TABLE homepage_settings 
  DROP CONSTRAINT IF EXISTS homepage_settings_theme_style_check;

ALTER TABLE homepage_settings 
  ADD CONSTRAINT homepage_settings_theme_style_check 
  CHECK (theme_style IN ('cosmic', 'minimal', 'modern', 'classic', 'christmas'));

