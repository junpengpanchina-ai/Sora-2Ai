-- 040_refactor_use_case_types_simple.sql
-- 重构 use_case_type 为6个固定的视频任务类型（最简化版本，适合大数据量）
-- 
-- 新的6个类型：
-- 1. advertising-promotion (广告转化) - 原 ads, marketing
-- 2. social-media-content (短视频内容) - 原 social-media, youtube, tiktok, instagram, twitter
-- 3. product-demo-showcase (产品演示) - 原 product-demo
-- 4. brand-storytelling (品牌叙事) - 新增（后续可手动调整）
-- 5. education-explainer (讲解说明) - 原 education
-- 6. ugc-creator-content (UGC/测评) - 新增（后续可手动调整）

-- 步骤1: 删除旧的CHECK约束
ALTER TABLE use_cases DROP CONSTRAINT IF EXISTS use_cases_use_case_type_check;

-- 步骤2: 使用单个UPDATE语句一次性更新所有数据（只扫描表一次，性能最优）
UPDATE use_cases 
SET use_case_type = CASE 
  WHEN use_case_type = 'ads' THEN 'advertising-promotion'
  WHEN use_case_type = 'marketing' THEN 'advertising-promotion'
  WHEN use_case_type IN ('social-media', 'youtube', 'tiktok', 'instagram', 'twitter') THEN 'social-media-content'
  WHEN use_case_type = 'product-demo' THEN 'product-demo-showcase'
  WHEN use_case_type = 'education' THEN 'education-explainer'
  WHEN use_case_type = 'other' THEN 'social-media-content'
  ELSE use_case_type
END
WHERE use_case_type IN ('ads', 'marketing', 'social-media', 'youtube', 'tiktok', 'instagram', 'twitter', 'product-demo', 'education', 'other');

-- 步骤3: 添加新的CHECK约束
ALTER TABLE use_cases
  ADD CONSTRAINT use_cases_use_case_type_check 
  CHECK (use_case_type IN (
    'advertising-promotion',
    'social-media-content',
    'product-demo-showcase',
    'brand-storytelling',
    'education-explainer',
    'ugc-creator-content'
  ));

-- 步骤4: 添加注释
COMMENT ON COLUMN use_cases.use_case_type IS 'Video task type (cross-industry universal): advertising-promotion, social-media-content, product-demo-showcase, brand-storytelling, education-explainer, ugc-creator-content';

