-- 批量创建动态页面SEO配置
-- 解决"7页字数较少"的问题
-- 为所有低字数的 /video?prompt=... 页面创建SEO配置

-- ============================================
-- 配置1: A sweeping aerial shot over a futuristic coastal city
-- ============================================
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
  'This page is dedicated to generating AI videos based on the prompt: "A sweeping aerial shot over a futuristic coastal city at sunset, glass skyscrapers with neon lights, flying vehicles leaving light trails, camera gliding through the skyline with lens flares, ultra realistic, shot on 8k cinema camera." Our platform uses OpenAI Sora 2.0 technology to create high-quality, professional videos from text descriptions. Each video is generated with attention to detail, ensuring cinematic quality and visual appeal. The futuristic cityscape with neon lights and flying vehicles creates a stunning visual experience that captures the imagination. Whether you are creating marketing content, social media videos, or creative projects, our AI video generation platform makes it easy to bring your ideas to life. The video generation process is simple: enter your detailed text description, select your preferred aspect ratio and duration, and let our AI do the rest. All videos are generated in high quality and can be downloaded immediately after completion. This specific prompt creates a breathtaking aerial view of a futuristic metropolis, combining elements of science fiction with realistic cinematography techniques. The 8k cinema camera quality ensures every detail is captured with precision, from the glass skyscrapers reflecting the sunset to the neon lights illuminating the city streets below.',
  ARRAY['AI video generation', 'futuristic city', 'aerial shot', 'Sora 2.0', 'neon lights', 'flying vehicles', 'cinematic'],
  TRUE,
  10
) ON CONFLICT (page_url) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  h1_text = EXCLUDED.h1_text,
  seo_content = EXCLUDED.seo_content,
  meta_keywords = EXCLUDED.meta_keywords,
  updated_at = NOW();

-- ============================================
-- 配置2: Close-up of two curious red pandas
-- ============================================
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
  'This page is dedicated to generating AI videos featuring red pandas in a magical forest setting. The prompt describes a close-up view of two curious red pandas exploring a glowing forest environment, with soft volumetric light beams creating an ethereal atmosphere. Dust particles float gently in the air, adding depth and magic to the scene. The shallow depth of field creates a cinematic focus on the pandas, while the whimsical mood and Pixar style ensure a charming and family-friendly result. Our platform uses OpenAI Sora 2.0 technology to bring this enchanting scene to life, creating high-quality videos that capture the playful nature of red pandas in a fantastical setting. Whether you are creating content for children, nature documentaries, or creative projects, this video generation option provides a unique and captivating visual experience. The Pixar-style animation brings a sense of warmth and wonder to the video, making it perfect for educational content, social media posts, or marketing materials that aim to evoke positive emotions and connection with nature.',
  ARRAY['AI video generation', 'red pandas', 'glowing forest', 'Pixar style', 'whimsical', 'nature', 'wildlife'],
  TRUE,
  10
) ON CONFLICT (page_url) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  h1_text = EXCLUDED.h1_text,
  seo_content = EXCLUDED.seo_content,
  meta_keywords = EXCLUDED.meta_keywords,
  updated_at = NOW();

-- ============================================
-- 配置3: Editorial fashion walk on a reflective runway
-- ============================================
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
  '/video?prompt=Editorial fashion walk on a reflective runway, bold neon purple and teal lighting, model wearing avant-garde metallic outfit, camera dolly backward with subtle parallax, crisp reflections on glossy floor.',
  '{"prompt": "Editorial fashion walk on a reflective runway, bold neon purple and teal lighting, model wearing avant-garde metallic outfit, camera dolly backward with subtle parallax, crisp reflections on glossy floor."}',
  'Generate: Editorial fashion walk on a reflective runway',
  'Create professional AI-generated fashion videos with bold neon lighting and avant-garde styling using OpenAI Sora 2.0. Perfect for fashion brands and editorial content.',
  'Generate Video: Editorial fashion walk on a reflective runway',
  'This page is dedicated to generating AI videos for fashion and editorial content. The prompt describes an editorial fashion walk on a reflective runway, featuring bold neon purple and teal lighting that creates a dramatic and modern atmosphere. The model wears an avant-garde metallic outfit that catches and reflects the vibrant lighting, creating stunning visual effects. The camera moves backward with subtle parallax, adding depth and movement to the scene. The crisp reflections on the glossy floor create a mirror-like effect that doubles the visual impact of the fashion presentation. Our platform uses OpenAI Sora 2.0 technology to create high-quality fashion videos that rival professional production quality. Whether you are creating content for fashion brands, editorial magazines, social media campaigns, or marketing materials, this video generation option provides a sophisticated and visually striking result. The combination of bold colors, avant-garde styling, and professional cinematography makes this perfect for brands looking to stand out in the competitive fashion industry.',
  ARRAY['AI video generation', 'fashion', 'editorial', 'runway', 'neon lighting', 'avant-garde', 'Sora 2.0'],
  TRUE,
  10
) ON CONFLICT (page_url) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  h1_text = EXCLUDED.h1_text,
  seo_content = EXCLUDED.seo_content,
  meta_keywords = EXCLUDED.meta_keywords,
  updated_at = NOW();

-- ============================================
-- 配置4: Slow-motion shot of a basketball player
-- ============================================
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
  '/video?prompt=Slow-motion shot of a basketball player leaping for a dunk during a street game, sweat particles, motion trails, dynamic crowd in the background, golden hour lighting, handheld documentary style.',
  '{"prompt": "Slow-motion shot of a basketball player leaping for a dunk during a street game, sweat particles, motion trails, dynamic crowd in the background, golden hour lighting, handheld documentary style."}',
  'Generate: Slow-motion shot of a basketball player leaping for a dunk',
  'Create dynamic AI-generated sports videos with slow-motion effects using OpenAI Sora 2.0. Perfect for sports content, highlights, and athletic brand marketing.',
  'Generate Video: Slow-motion shot of a basketball player leaping for a dunk',
  'This page is dedicated to generating AI videos for sports and athletic content. The prompt describes a slow-motion shot of a basketball player leaping for a dunk during a street game, capturing the intensity and athleticism of the moment. Sweat particles are visible in the air, adding realism and physicality to the scene. Motion trails follow the player''s movement, creating a sense of speed and power. The dynamic crowd in the background adds atmosphere and context, showing the energy of a live street basketball game. The golden hour lighting creates warm, cinematic tones that enhance the dramatic nature of the athletic performance. The handheld documentary style adds authenticity and immediacy to the footage, making viewers feel like they are right there in the action. Our platform uses OpenAI Sora 2.0 technology to create high-quality sports videos that capture the excitement and intensity of athletic competition. Whether you are creating content for sports brands, athletic programs, social media highlights, or marketing campaigns, this video generation option provides dynamic and engaging visual content that resonates with sports enthusiasts and athletes alike.',
  ARRAY['AI video generation', 'basketball', 'sports', 'slow-motion', 'athletic', 'street game', 'Sora 2.0'],
  TRUE,
  10
) ON CONFLICT (page_url) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  h1_text = EXCLUDED.h1_text,
  seo_content = EXCLUDED.seo_content,
  meta_keywords = EXCLUDED.meta_keywords,
  updated_at = NOW();

-- ============================================
-- 配置5: 基础 /video 页面（无prompt时）
-- ============================================
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
  '/video',
  NULL,
  'Video Generator - Create AI Videos from Text',
  'Transform text prompts into professional AI videos instantly. Sora2Ai video generator uses OpenAI Sora 2.0 to create high-quality content from your descriptions.',
  'Sora-2 Video Generation',
  'Welcome to the Sora2Ai video generation platform, powered by OpenAI Sora 2.0 technology. This page allows you to create stunning, professional-quality videos from simple text descriptions. Our AI video generator makes it easy to bring your creative ideas to life, whether you are creating marketing content, social media videos, educational materials, or artistic projects. The video generation process is straightforward: simply enter a detailed text prompt describing the video you want to create, select your preferred aspect ratio (portrait 9:16 or landscape 16:9), choose the video duration (10 or 15 seconds), and let our advanced AI technology do the rest. Each video is generated with high quality and attention to detail, ensuring professional results suitable for any use case. Our platform supports various video styles including cinematic shots, documentary footage, fashion content, nature scenes, sports highlights, and abstract visuals. New users receive 30 free credits to get started, with no credit card required. Each video generation costs 10 credits, making it affordable for creators of all levels. Start creating your AI-generated videos today and experience the power of OpenAI Sora 2.0 technology.',
  ARRAY['AI video generation', 'Sora 2.0', 'text to video', 'video generator', 'OpenAI'],
  TRUE,
  5
) ON CONFLICT (page_url) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  h1_text = EXCLUDED.h1_text,
  seo_content = EXCLUDED.seo_content,
  meta_keywords = EXCLUDED.meta_keywords,
  updated_at = NOW();

-- ============================================
-- 验证：查看所有创建的配置
-- ============================================
SELECT 
  page_url,
  title,
  LENGTH(seo_content) as content_length,
  is_active,
  priority,
  created_at
FROM dynamic_page_seo
WHERE is_active = TRUE
ORDER BY priority DESC, created_at DESC;

-- ============================================
-- 统计信息
-- ============================================
SELECT 
  COUNT(*) as total_configs,
  COUNT(*) FILTER (WHERE is_active = TRUE) as active_configs,
  AVG(LENGTH(seo_content)) as avg_content_length,
  MIN(LENGTH(seo_content)) as min_content_length,
  MAX(LENGTH(seo_content)) as max_content_length
FROM dynamic_page_seo;
