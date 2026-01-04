-- 优化首页设置，改进 Hero 文案和 CTA，使其更符合消费者需求
-- 从 "Best Sora Alternative" 转向价值承诺

UPDATE homepage_settings
SET 
  hero_badge_text = 'AI Video Generator',
  hero_h1_text = 'Create High-Quality AI Videos from Text — Fast, Simple, No Editing Skills',
  hero_h1_text_logged_in = 'Welcome back, {name}! Ready to Create Your Next Video?',
  hero_description = 'Generate marketing videos, social media clips, product demos, and explainer videos using AI. No camera. No editing software. Just type and create.',
  cta_primary_text = 'Start Generating Videos Free',
  cta_primary_text_logged_out = 'Start Generating Videos Free',
  cta_secondary_text = 'View AI Video Examples',
  updated_at = NOW()
WHERE is_active = true;

-- 如果没有激活的配置，确保默认配置也是优化后的
-- 注意：这里只更新文本字段，保留现有的图片和视频路径
INSERT INTO homepage_settings (
  id,
  hero_badge_text,
  hero_h1_text,
  hero_h1_text_logged_in,
  hero_description,
  cta_primary_text,
  cta_primary_text_logged_out,
  cta_secondary_text,
  theme_style,
  is_active
)
SELECT 
  '00000000-0000-0000-0000-000000000001',
  'AI Video Generator',
  'Create High-Quality AI Videos from Text — Fast, Simple, No Editing Skills',
  'Welcome back, {name}! Ready to Create Your Next Video?',
  'Generate marketing videos, social media clips, product demos, and explainer videos using AI. No camera. No editing software. Just type and create.',
  'Start Generating Videos Free',
  'Start Generating Videos Free',
  'View AI Video Examples',
  'cosmic',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM homepage_settings WHERE is_active = true
);

