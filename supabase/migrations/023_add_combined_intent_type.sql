-- 023_add_combined_intent_type.sql
-- 添加新的意图类型：信息 + 对比 + 交易型 (information_comparison_transaction)
-- 用于支持快速批量创建更多长尾词页面，布局全球市场

-- 1. 删除旧的约束
ALTER TABLE long_tail_keywords 
  DROP CONSTRAINT IF EXISTS long_tail_keywords_intent_check;

-- 2. 添加新的约束，包含新的意图类型
ALTER TABLE long_tail_keywords
  ADD CONSTRAINT long_tail_keywords_intent_check 
  CHECK (intent IN ('information', 'comparison', 'transaction', 'information_comparison_transaction'));

-- 3. 添加注释说明
COMMENT ON COLUMN long_tail_keywords.intent IS '搜索意图类型: information(信息型), comparison(对比型), transaction(交易型), information_comparison_transaction(信息+对比+交易型，用于快速批量布局全球市场)';

