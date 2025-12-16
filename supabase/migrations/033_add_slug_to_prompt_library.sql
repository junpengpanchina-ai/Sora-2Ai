-- 033_add_slug_to_prompt_library.sql
-- 为 prompt_library 表添加 slug 字段，用于生成独立的 SEO 页面

-- 添加 slug 字段
ALTER TABLE prompt_library
  ADD COLUMN IF NOT EXISTS slug TEXT;

-- 创建唯一索引（每个locale下的slug唯一）
CREATE UNIQUE INDEX IF NOT EXISTS idx_prompt_library_locale_slug 
  ON prompt_library(locale, slug) 
  WHERE slug IS NOT NULL;

-- 为现有数据生成 slug（基于 title）
-- 使用正则表达式将 title 转换为 URL 友好的 slug
UPDATE prompt_library
SET slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(title, '[^a-zA-Z0-9\s-]', '', 'g'),
        '\s+', '-', 'g'
      ),
      '-+', '-', 'g'
    ),
    '^-|-$', '', 'g'
  )
)
WHERE slug IS NULL OR slug = '';

-- 如果有重复的 slug，添加序号
WITH numbered_prompts AS (
  SELECT 
    id,
    locale,
    slug,
    ROW_NUMBER() OVER (PARTITION BY locale, slug ORDER BY created_at) as rn
  FROM prompt_library
  WHERE slug IS NOT NULL
)
UPDATE prompt_library p
SET slug = p.slug || '-' || (n.rn - 1)::TEXT
FROM numbered_prompts n
WHERE p.id = n.id AND n.rn > 1;

-- 添加索引用于快速查找
CREATE INDEX IF NOT EXISTS idx_prompt_library_slug ON prompt_library(slug) WHERE slug IS NOT NULL;

