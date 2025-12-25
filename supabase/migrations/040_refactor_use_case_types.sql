-- 040_refactor_use_case_types.sql
-- 重构 use_case_type 为6个固定的视频任务类型（跨行业通用）
-- 
-- 优化版本：使用单个 CASE WHEN 语句一次性更新，适合大数据量（110,515+ 条记录）
-- 
-- 新的6个类型：
-- 1. advertising-promotion (广告转化) - 原 ads, 部分 marketing
-- 2. social-media-content (短视频内容) - 原 social-media, youtube, tiktok, instagram, twitter
-- 3. product-demo-showcase (产品演示) - 原 product-demo
-- 4. brand-storytelling (品牌叙事) - 原 部分 marketing
-- 5. education-explainer (讲解说明) - 原 education
-- 6. ugc-creator-content (UGC/测评) - 新增

-- ⚠️ 重要执行顺序：先删除约束 -> 再更新数据 -> 最后添加新约束

-- 步骤1: 删除旧的CHECK约束（必须最先执行）
ALTER TABLE use_cases 
  DROP CONSTRAINT IF EXISTS use_cases_use_case_type_check;

-- 步骤2: 使用单个 CASE WHEN 语句一次性更新所有数据（最优化，只扫描表一次）
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

-- 步骤3: 添加新的CHECK约束，只包含6个新类型
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

-- 步骤4: 添加注释说明
COMMENT ON COLUMN use_cases.use_case_type IS 'Video task type (cross-industry universal): advertising-promotion, social-media-content, product-demo-showcase, brand-storytelling, education-explainer, ugc-creator-content';
