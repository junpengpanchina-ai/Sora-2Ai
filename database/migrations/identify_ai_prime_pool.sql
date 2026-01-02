-- ============================================
-- 识别 AI-Prime Pool（最可能被 AI 引用的 10% 页面）
-- ============================================
-- 目标：用"结构信号"直接筛选，不用猜、不用等 AI 官方数据
-- ============================================

-- ============================================
-- AI 引用高概率页面的 6 个硬条件
-- ============================================
-- 只要满足 ≥4 条，就进入 AI-Prime Pool（前 10%）
-- ============================================

-- 条件说明：
-- 1. 有 Answer-first 且 ≤160 词（SGE/AI 最爱直接摘）
-- 2. 有 Neutral Definition（定义句是引用率最高块）
-- 3. 有 Limitations / Boundary（AI 判断"可信"的关键信号）
-- 4. 全文 无 CTA / 无 you / 无 we（避免商业偏向）
-- 5. 结构段落数固定（6–8）（AI 更容易稳定抽取）
-- 6. 行业 + 场景明确（非泛词）（AI 需要"可定位概念"）

-- ============================================
-- 步骤 1：为 page_meta 添加 AI-Prime 相关字段（如果还没有）
-- ============================================

ALTER TABLE page_meta
  ADD COLUMN IF NOT EXISTS has_answer_first BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS answer_first_word_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS has_neutral_definition BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS has_limitations BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS has_cta BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS paragraph_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_prime_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_ai_prime BOOLEAN DEFAULT FALSE;

-- ============================================
-- 步骤 2：识别 AI-Prime Pool（满足 ≥4 个条件）
-- ============================================

-- 注意：这个查询需要根据实际内容分析结果来更新字段
-- 这里提供一个示例查询，实际使用时需要先分析内容

WITH ai_prime_candidates AS (
  SELECT 
    pm.page_id,
    pm.page_type,
    pm.page_slug,
    pm.geo_level,
    pm.purchase_intent,
    -- 计算满足的条件数
    (
      CASE WHEN pm.has_answer_first = TRUE AND pm.answer_first_word_count <= 160 THEN 1 ELSE 0 END +
      CASE WHEN pm.has_neutral_definition = TRUE THEN 1 ELSE 0 END +
      CASE WHEN pm.has_limitations = TRUE THEN 1 ELSE 0 END +
      CASE WHEN pm.has_cta = FALSE THEN 1 ELSE 0 END +
      CASE WHEN pm.paragraph_count BETWEEN 6 AND 8 THEN 1 ELSE 0 END +
      CASE WHEN pm.purchase_intent <= 1 THEN 1 ELSE 0 END
    ) as condition_count,
    pm.geo_score,
    pm.index_state
  FROM page_meta pm
  WHERE pm.page_type = 'use_case'
    AND pm.status = 'published'
    AND pm.geo_level = 'G-A'
)
SELECT 
  page_id,
  page_slug,
  geo_level,
  purchase_intent,
  condition_count,
  geo_score,
  CASE 
    WHEN condition_count >= 4 THEN 'AI-Prime'
    WHEN condition_count >= 3 THEN 'AI-Candidate'
    ELSE 'Standard'
  END as ai_status
FROM ai_prime_candidates
WHERE condition_count >= 4  -- AI-Prime Pool（≥4 个条件）
ORDER BY condition_count DESC, geo_score DESC
LIMIT 1000;  -- 约 10% 的页面

-- ============================================
-- 步骤 3：更新 AI-Prime 标记
-- ============================================

-- 更新 AI-Prime 分数和标记
UPDATE page_meta pm
SET 
  ai_prime_score = (
    CASE WHEN pm.has_answer_first = TRUE AND pm.answer_first_word_count <= 160 THEN 1 ELSE 0 END +
    CASE WHEN pm.has_neutral_definition = TRUE THEN 1 ELSE 0 END +
    CASE WHEN pm.has_limitations = TRUE THEN 1 ELSE 0 END +
    CASE WHEN pm.has_cta = FALSE THEN 1 ELSE 0 END +
    CASE WHEN pm.paragraph_count BETWEEN 6 AND 8 THEN 1 ELSE 0 END +
    CASE WHEN pm.purchase_intent <= 1 THEN 1 ELSE 0 END
  ),
  is_ai_prime = (
    CASE WHEN pm.has_answer_first = TRUE AND pm.answer_first_word_count <= 160 THEN 1 ELSE 0 END +
    CASE WHEN pm.has_neutral_definition = TRUE THEN 1 ELSE 0 END +
    CASE WHEN pm.has_limitations = TRUE THEN 1 ELSE 0 END +
    CASE WHEN pm.has_cta = FALSE THEN 1 ELSE 0 END +
    CASE WHEN pm.paragraph_count BETWEEN 6 AND 8 THEN 1 ELSE 0 END +
    CASE WHEN pm.purchase_intent <= 1 THEN 1 ELSE 0 END
  ) >= 4
WHERE pm.page_type = 'use_case'
  AND pm.status = 'published';

-- ============================================
-- 步骤 4：查看 AI-Prime Pool 统计
-- ============================================

SELECT 
  COUNT(*) as total_ai_prime,
  COUNT(*) * 100.0 / (SELECT COUNT(*) FROM page_meta WHERE page_type = 'use_case' AND status = 'published') as percentage
FROM page_meta
WHERE is_ai_prime = TRUE
  AND page_type = 'use_case'
  AND status = 'published';

-- ============================================
-- 步骤 5：查看 AI-Prime Pool 分布
-- ============================================

SELECT 
  ai_prime_score,
  COUNT(*) as count,
  COUNT(*) * 100.0 / (SELECT COUNT(*) FROM page_meta WHERE page_type = 'use_case' AND status = 'published') as percentage
FROM page_meta
WHERE page_type = 'use_case'
  AND status = 'published'
GROUP BY ai_prime_score
ORDER BY ai_prime_score DESC;

