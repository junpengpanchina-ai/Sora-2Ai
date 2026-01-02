-- ============================================
-- 为 page_meta 添加 AI-Prime 相关字段
-- ============================================
-- 这是执行 select_top_10_upgrade_pages.sql 的前置步骤
-- ============================================

ALTER TABLE page_meta
  ADD COLUMN IF NOT EXISTS has_answer_first BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS answer_first_word_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS has_neutral_definition BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS has_limitations BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS has_cta BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS paragraph_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_prime_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_ai_prime BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS ai_signal_score INTEGER DEFAULT 0;

-- ============================================
-- 验证字段已添加
-- ============================================

SELECT 
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'page_meta'
  AND column_name IN (
    'ai_prime_score',
    'ai_signal_score',
    'has_answer_first',
    'has_limitations',
    'has_cta',
    'paragraph_count'
  )
ORDER BY column_name;

