-- 修复低字数SEO配置
-- 查找并更新 content_length < 300 的配置

-- ============================================
-- 1. 查找所有低字数配置
-- ============================================
SELECT 
  id,
  page_url,
  title,
  LENGTH(seo_content) as content_length,
  is_active
FROM dynamic_page_seo
WHERE is_active = TRUE
  AND (seo_content IS NULL OR LENGTH(seo_content) < 300)
ORDER BY LENGTH(seo_content) ASC NULLS FIRST;

-- ============================================
-- 2. 为低字数配置更新SEO内容
-- ============================================
-- 注意：需要根据实际的 page_url 来更新
-- 以下是通用模板，请根据实际情况修改

-- 示例：更新 content_length = 63 的配置
-- 请先执行上面的查询，找到具体的 page_url，然后使用下面的模板更新

UPDATE dynamic_page_seo
SET 
  seo_content = 'This page is dedicated to generating AI videos using OpenAI Sora 2.0 technology. Our platform enables users to transform text descriptions into stunning, professional-quality videos in seconds. Whether you are creating marketing content, social media videos, educational materials, or creative projects, our AI video generation platform makes it easy to bring your ideas to life. The video generation process is simple: enter your detailed text description, select your preferred aspect ratio and duration, and let our AI do the rest. All videos are generated in high quality and can be downloaded immediately after completion. Our platform supports various video styles including cinematic shots, documentary footage, fashion content, nature scenes, sports highlights, and abstract visuals. Each video is generated with attention to detail, ensuring cinematic quality and visual appeal that matches your creative vision. New users receive 30 free credits to get started, with no credit card required. Each video generation costs 10 credits, making it affordable for creators of all levels. Start creating your AI-generated videos today and experience the power of OpenAI Sora 2.0 technology.',
  updated_at = NOW()
WHERE 
  is_active = TRUE
  AND (seo_content IS NULL OR LENGTH(seo_content) < 300);

-- ============================================
-- 3. 验证更新结果
-- ============================================
SELECT 
  page_url,
  title,
  LENGTH(seo_content) as content_length,
  CASE 
    WHEN LENGTH(seo_content) < 300 THEN '⚠️ 字数不足'
    WHEN LENGTH(seo_content) >= 300 AND LENGTH(seo_content) < 500 THEN '✅ 字数充足'
    ELSE '✅ 字数丰富'
  END as status
FROM dynamic_page_seo
WHERE is_active = TRUE
ORDER BY LENGTH(seo_content) ASC;

-- ============================================
-- 4. 为特定页面创建详细SEO内容（如果需要）
-- ============================================
-- 如果上面的通用更新不够，可以为特定页面创建更详细的内容
-- 请根据 page_url 和 title 来定制内容

-- 示例：为特定 prompt 页面更新
-- UPDATE dynamic_page_seo
-- SET 
--   seo_content = '详细描述该页面的SEO内容，至少300字...',
--   updated_at = NOW()
-- WHERE page_url = '/video?prompt=YOUR_SPECIFIC_PROMPT';
