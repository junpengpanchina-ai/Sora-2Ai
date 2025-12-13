-- 创建首页配置表
-- 用于存储首页的图片、视频、标题、描述、风格等配置

CREATE TABLE IF NOT EXISTS homepage_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Hero Section 配置
  hero_badge_text TEXT DEFAULT 'Sora 2 AI Control Center',
  hero_h1_text TEXT DEFAULT 'Turn cinematic ideas into deployable Sora 2.0 workflows.',
  hero_h1_text_logged_in TEXT DEFAULT 'Welcome back, Creator!',
  hero_description TEXT DEFAULT 'Operate from a focused dashboard that keeps the cosmic atmosphere but prioritizes productivity. Track pipeline health, credits, and the next action without leaving your control surface.',
  
  -- 图片配置 (存储R2路径)
  hero_image_paths TEXT[], -- 首页展示的图片路径数组
  hero_image_alt_texts TEXT[], -- 对应的alt文本数组
  
  -- 视频配置 (存储R2路径)
  hero_video_paths TEXT[], -- 首页展示的视频路径数组
  
  -- 风格配置
  theme_style TEXT DEFAULT 'cosmic' CHECK (theme_style IN ('cosmic', 'minimal', 'modern', 'classic', 'christmas')),
  primary_color TEXT DEFAULT '#3B82F6', -- 主色调
  secondary_color TEXT DEFAULT '#8B5CF6', -- 次色调
  accent_color TEXT DEFAULT '#F59E0B', -- 强调色
  background_gradient TEXT DEFAULT 'cosmic-space', -- 背景渐变样式
  
  -- 按钮文本配置
  cta_primary_text TEXT DEFAULT 'Open Video Console',
  cta_primary_text_logged_out TEXT DEFAULT 'Sign in to Start',
  cta_secondary_text TEXT DEFAULT 'Browse Prompt Library',
  
  -- 元数据
  is_active BOOLEAN DEFAULT true, -- 是否启用此配置
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES admin_users(id),
  updated_by UUID REFERENCES admin_users(id)
);

-- 创建唯一索引，确保只有一个激活的配置
CREATE UNIQUE INDEX IF NOT EXISTS idx_homepage_settings_active 
  ON homepage_settings(is_active) 
  WHERE is_active = true;

-- 创建更新时间触发器
CREATE TRIGGER update_homepage_settings_updated_at
  BEFORE UPDATE ON homepage_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 插入默认配置
INSERT INTO homepage_settings (
  id,
  hero_badge_text,
  hero_h1_text,
  hero_h1_text_logged_in,
  hero_description,
  hero_image_paths,
  hero_image_alt_texts,
  hero_video_paths,
  theme_style,
  is_active
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Sora 2 AI Control Center',
  'Turn cinematic ideas into deployable Sora 2.0 workflows.',
  'Welcome back, Creator!',
  'Operate from a focused dashboard that keeps the cosmic atmosphere but prioritizes productivity. Track pipeline health, credits, and the next action without leaving your control surface.',
  ARRAY[
    '2b827a33e43a48b2b583ed428977712c.png',
    '460bef39f6e34f82912a27e357827963.png',
    '5995d3bfdb674ecebaccc581ed8940b3.png',
    '7b0be82bb2134fca87519cbecf30aca9.png',
    '80dc75a06d0b49c29bdb78eb45dc70a0.png',
    'b451ac136a474a9f91398a403af2d2a6.png',
    'e6e1ebc8cea34e83a106009a485b1cbb.png',
    'f566981bc27549b7a2389a6887e9c840.png'
  ],
  ARRAY[
    'Image 1',
    'Image 2',
    'Image 3',
    'Image 4',
    'Image 5',
    'Image 6',
    'Image 7',
    'Image 8'
  ],
  ARRAY[
    'vdieo/b8edbf0aa26b4afa85b7095b91414f3d.mp4',
    'vdieo/微信视频2025-11-09_223443_366.mp4',
    'vdieo/微信视频2025-11-09_223856_981.mp4',
    'vdieo/微信视频2025-11-09_224357_417.mp4',
    'vdieo/微信视频2025-11-09_224947_118.mp4'
  ],
  'cosmic',
  true
) ON CONFLICT DO NOTHING;

-- 添加 RLS 策略
-- 允许公共读取，只有 service_role 可以写入（通过 API 路由控制）
ALTER TABLE homepage_settings ENABLE ROW LEVEL SECURITY;

-- 允许所有人读取（公共访问）
DROP POLICY IF EXISTS "Allow public read access to homepage settings" ON homepage_settings;
CREATE POLICY "Allow public read access to homepage settings"
  ON homepage_settings
  FOR SELECT
  USING (true);

-- 允许 service_role 完全访问（用于管理员 API）
DROP POLICY IF EXISTS "Allow service role full access to homepage settings" ON homepage_settings;
CREATE POLICY "Allow service role full access to homepage settings"
  ON homepage_settings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

