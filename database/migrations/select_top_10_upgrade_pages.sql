-- ============================================
-- 自动挑出最该升级的 10 个页面
-- ============================================
-- 使用推荐权重公式，选出最值得升级成"赚钱页"的页面
-- ============================================

-- ============================================
-- 推荐权重公式（直接可用）
-- ============================================
-- priority_score =
--   (ai_prime_score * 0.45)
--   + (ai_signal_score * 0.30)
--   + (purchase_intent * 0.15)
--   + (index_health_weight * 0.10)
-- ============================================

-- 注意：需要先执行 identify_ai_prime_pool.sql 来填充 ai_prime_score
-- 需要从 GSC 数据中计算 ai_signal_score（或使用默认值）

-- ============================================
-- 步骤 1：为 page_meta 添加 ai_signal_score 字段（如果还没有）
-- ============================================

ALTER TABLE page_meta
  ADD COLUMN IF NOT EXISTS ai_signal_score INTEGER DEFAULT 0;

-- ============================================
-- 步骤 2：选择最该升级的 10 个页面
-- ============================================

SELECT
  pm.page_id,
  pm.page_slug,
  pm.ai_prime_score,
  COALESCE(pm.ai_signal_score, 0) as ai_signal_score,
  pm.purchase_intent,
  pm.geo_score,
  pm.geo_level,
  -- 计算 index_health_weight
  CASE
    WHEN pm.index_state = 'indexed' THEN 1.0
    WHEN pm.index_state = 'crawled' THEN 0.5
    ELSE 0
  END as index_health_weight,
  -- 计算 upgrade_priority（推荐权重公式）
  (
    COALESCE(pm.ai_prime_score, 0) * 0.45 +
    COALESCE(pm.ai_signal_score, 0) * 0.30 +
    pm.purchase_intent * 0.15 +
    CASE
      WHEN pm.index_state = 'indexed' THEN 1.0
      WHEN pm.index_state = 'crawled' THEN 0.5
      ELSE 0
    END * 0.10
  ) AS upgrade_priority,
  pm.layer,
  pm.status
FROM page_meta pm
WHERE
  pm.status = 'published'
  AND pm.page_type = 'use_case'
  AND pm.geo_level = 'G-A'
  AND COALESCE(pm.ai_prime_score, 0) >= 4  -- AI-Prime Pool
ORDER BY upgrade_priority DESC
LIMIT 10;

-- ============================================
-- 步骤 3：查看这 10 个页面的详细信息
-- ============================================

-- 如果需要查看完整的页面信息，可以 JOIN use_cases 表
SELECT
  pm.page_id,
  pm.page_slug,
  uc.title,
  uc.use_case_type,
  uc.industry,
  pm.ai_prime_score,
  COALESCE(pm.ai_signal_score, 0) as ai_signal_score,
  pm.purchase_intent,
  pm.layer,
  (
    COALESCE(pm.ai_prime_score, 0) * 0.45 +
    COALESCE(pm.ai_signal_score, 0) * 0.30 +
    pm.purchase_intent * 0.15 +
    CASE
      WHEN pm.index_state = 'indexed' THEN 1.0
      WHEN pm.index_state = 'crawled' THEN 0.5
      ELSE 0
    END * 0.10
  ) AS upgrade_priority
FROM page_meta pm
INNER JOIN use_cases uc ON pm.page_id = uc.id
WHERE
  pm.status = 'published'
  AND pm.page_type = 'use_case'
  AND pm.geo_level = 'G-A'
  AND COALESCE(pm.ai_prime_score, 0) >= 4
ORDER BY upgrade_priority DESC
LIMIT 10;

