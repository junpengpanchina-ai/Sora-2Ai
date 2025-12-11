-- 024_add_page_style_to_keywords.sql
-- 添加页面风格字段到 long_tail_keywords 表，支持圣诞节风格和默认风格

-- 添加 page_style 字段
ALTER TABLE long_tail_keywords
  ADD COLUMN IF NOT EXISTS page_style TEXT DEFAULT 'default';

-- 添加约束
ALTER TABLE long_tail_keywords
  DROP CONSTRAINT IF EXISTS long_tail_keywords_page_style_check;

ALTER TABLE long_tail_keywords
  ADD CONSTRAINT long_tail_keywords_page_style_check 
  CHECK (page_style IN ('default', 'christmas'));

-- 添加注释说明
COMMENT ON COLUMN long_tail_keywords.page_style IS '页面风格: default(默认风格), christmas(圣诞节风格，包含动态背景和背景音乐)';

