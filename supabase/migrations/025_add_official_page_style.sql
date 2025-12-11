-- 025_add_official_page_style.sql
-- 添加官网风格选项到 page_style 字段

-- 更新约束以支持新的页面风格
ALTER TABLE long_tail_keywords
  DROP CONSTRAINT IF EXISTS long_tail_keywords_page_style_check;

ALTER TABLE long_tail_keywords
  ADD CONSTRAINT long_tail_keywords_page_style_check 
  CHECK (page_style IN ('default', 'christmas', 'official'));

-- 更新注释说明
COMMENT ON COLUMN long_tail_keywords.page_style IS '页面风格: default(默认风格), christmas(圣诞节风格，包含动态背景和背景音乐), official(官网风格)';
