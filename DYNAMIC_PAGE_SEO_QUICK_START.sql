-- 动态页面SEO管理 - 快速开始SQL脚本
-- 用于验证表结构和创建示例数据

-- ============================================
-- 1. 验证表结构
-- ============================================
-- 查看表的所有列
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'dynamic_page_seo'
ORDER BY ordinal_position;

-- ============================================
-- 2. 查看当前所有记录（应该为空）
-- ============================================
SELECT * FROM dynamic_page_seo;

-- ============================================
-- 3. 创建第一条示例SEO配置
-- ============================================
-- 为 "/video?prompt=A sweeping aerial shot..." 页面创建SEO配置
INSERT INTO dynamic_page_seo (
  page_path,
  page_url,
  page_params,
  title,
  description,
  h1_text,
  seo_content,
  meta_keywords,
  is_active,
  priority
) VALUES (
  '/video',
  '/video?prompt=A sweeping aerial shot over a futuristic coastal city at sunset, glass skyscrapers with neon lights, flying vehicles leaving light trails, camera gliding through the skyline with lens flares, ultra realistic, shot on 8k cinema camera.',
  '{"prompt": "A sweeping aerial shot over a futuristic coastal city at sunset, glass skyscrapers with neon lights, flying vehicles leaving light trails, camera gliding through the skyline with lens flares, ultra realistic, shot on 8k cinema camera."}',
  'Generate: A sweeping aerial shot over a futuristic coastal city',
  'Create stunning AI-generated videos of futuristic coastal cities at sunset using OpenAI Sora 2.0. Transform your text prompts into professional-quality videos with neon lights, flying vehicles, and cinematic effects.',
  'Generate Video: A sweeping aerial shot over a futuristic coastal city',
  'This page is dedicated to generating AI videos based on the prompt: "A sweeping aerial shot over a futuristic coastal city at sunset, glass skyscrapers with neon lights, flying vehicles leaving light trails, camera gliding through the skyline with lens flares, ultra realistic, shot on 8k cinema camera." Our platform uses OpenAI Sora 2.0 technology to create high-quality, professional videos from text descriptions. Each video is generated with attention to detail, ensuring cinematic quality and visual appeal. The futuristic cityscape with neon lights and flying vehicles creates a stunning visual experience that captures the imagination. Whether you are creating marketing content, social media videos, or creative projects, our AI video generation platform makes it easy to bring your ideas to life. The video generation process is simple: enter your detailed text description, select your preferred aspect ratio and duration, and let our AI do the rest. All videos are generated in high quality and can be downloaded immediately after completion. This specific prompt creates a breathtaking aerial view of a futuristic metropolis, combining elements of science fiction with realistic cinematography techniques.',
  ARRAY['AI video generation', 'futuristic city', 'aerial shot', 'Sora 2.0', 'neon lights', 'flying vehicles', 'cinematic'],
  TRUE,
  10
) RETURNING *;

-- ============================================
-- 4. 验证数据已插入
-- ============================================
SELECT 
  id,
  page_path,
  page_url,
  title,
  description,
  h1_text,
  LENGTH(seo_content) as seo_content_length,
  is_active,
  priority,
  created_at
FROM dynamic_page_seo
ORDER BY created_at DESC;

-- ============================================
-- 5. 为其他低字数页面创建配置（示例）
-- ============================================

-- 示例2: Close-up of two curious red pandas
INSERT INTO dynamic_page_seo (
  page_path,
  page_url,
  page_params,
  title,
  description,
  h1_text,
  seo_content,
  meta_keywords,
  is_active,
  priority
) VALUES (
  '/video',
  '/video?prompt=Close-up of two curious red pandas exploring a glowing forest, soft volumetric light beams, dust particles floating in the air, shallow depth of field, whimsical mood, Pixar style.',
  '{"prompt": "Close-up of two curious red pandas exploring a glowing forest, soft volumetric light beams, dust particles floating in the air, shallow depth of field, whimsical mood, Pixar style."}',
  'Generate: Close-up of two curious red pandas exploring a glowing forest',
  'Create adorable AI-generated videos of red pandas in a magical glowing forest using OpenAI Sora 2.0. Pixar-style animation with soft lighting and whimsical atmosphere.',
  'Generate Video: Close-up of two curious red pandas exploring a glowing forest',
  'This page is dedicated to generating AI videos featuring red pandas in a magical forest setting. The prompt describes a close-up view of two curious red pandas exploring a glowing forest environment, with soft volumetric light beams creating an ethereal atmosphere. Dust particles float gently in the air, adding depth and magic to the scene. The shallow depth of field creates a cinematic focus on the pandas, while the whimsical mood and Pixar style ensure a charming and family-friendly result. Our platform uses OpenAI Sora 2.0 technology to bring this enchanting scene to life, creating high-quality videos that capture the playful nature of red pandas in a fantastical setting. Whether you are creating content for children, nature documentaries, or creative projects, this video generation option provides a unique and captivating visual experience.',
  ARRAY['AI video generation', 'red pandas', 'glowing forest', 'Pixar style', 'whimsical', 'nature'],
  TRUE,
  10
) RETURNING *;

-- ============================================
-- 6. 查询所有配置（按优先级排序）
-- ============================================
SELECT 
  page_url,
  title,
  is_active,
  priority,
  LENGTH(seo_content) as content_length,
  created_at
FROM dynamic_page_seo
WHERE is_active = TRUE
ORDER BY priority DESC, created_at DESC;

-- ============================================
-- 7. 根据URL查询特定配置
-- ============================================
-- 替换下面的URL为你要查询的实际URL
SELECT * FROM dynamic_page_seo
WHERE page_url = '/video?prompt=A sweeping aerial shot over a futuristic coastal city at sunset, glass skyscrapers with neon lights, flying vehicles leaving light trails, camera gliding through the skyline with lens flares, ultra realistic, shot on 8k cinema camera.'
AND is_active = TRUE;

-- ============================================
-- 8. 统计信息
-- ============================================
SELECT 
  COUNT(*) as total_configs,
  COUNT(*) FILTER (WHERE is_active = TRUE) as active_configs,
  COUNT(*) FILTER (WHERE is_active = FALSE) as inactive_configs,
  AVG(LENGTH(seo_content)) as avg_content_length,
  MIN(LENGTH(seo_content)) as min_content_length,
  MAX(LENGTH(seo_content)) as max_content_length
FROM dynamic_page_seo;
