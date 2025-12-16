-- ============================================
-- 更新首页SEO关键词策略
-- 从 "Sora2" 转向 "Sora Alternative" 和 "Text to Video AI"
-- ============================================

-- 更新 homepage_settings 表中的 H1 和描述文本
UPDATE homepage_settings
SET 
  hero_badge_text = 'Best Sora Alternative',
  hero_h1_text = 'Best Sora Alternatives for AI Video Generation',
  hero_h1_text_logged_in = 'Welcome back, {name}! Create AI Videos Like Sora',
  hero_description = 'Find the best Sora alternatives for creating stunning text-to-video content. Our free AI video generator lets you create professional videos from text prompts in seconds. Compare top Sora alternatives and start creating today.',
  updated_at = NOW()
WHERE is_active = true;

-- 如果还没有激活的配置，插入新的配置
INSERT INTO homepage_settings (
  id,
  hero_badge_text,
  hero_h1_text,
  hero_h1_text_logged_in,
  hero_description,
  theme_style,
  is_active
)
SELECT 
  '00000000-0000-0000-0000-000000000001',
  'Best Sora Alternative',
  'Best Sora Alternatives for AI Video Generation',
  'Welcome back, {name}! Create AI Videos Like Sora',
  'Find the best Sora alternatives for creating stunning text-to-video content. Our free AI video generator lets you create professional videos from text prompts in seconds. Compare top Sora alternatives and start creating today.',
  'cosmic',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM homepage_settings WHERE is_active = true
);

-- ============================================
-- 验证更新结果
-- ============================================
SELECT 
  hero_badge_text,
  hero_h1_text,
  hero_h1_text_logged_in,
  hero_description,
  is_active,
  updated_at
FROM homepage_settings
WHERE is_active = true;

