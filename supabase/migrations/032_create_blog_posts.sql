-- 032_create_blog_posts.sql
-- 创建博客文章表，用于存储和管理SEO博客内容

CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  h1 TEXT NOT NULL,
  content TEXT NOT NULL,
  published_at TIMESTAMP WITH TIME ZONE,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  related_posts TEXT[] DEFAULT ARRAY[]::TEXT[],
  seo_keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_by_admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(is_published);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_updated_at ON blog_posts(updated_at DESC);

-- 更新时间触发器
DROP TRIGGER IF EXISTS trg_blog_posts_updated_at ON blog_posts;
CREATE TRIGGER trg_blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 启用RLS
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- RLS策略：公开可读已发布的文章
DROP POLICY IF EXISTS blog_posts_public_select ON blog_posts;
CREATE POLICY blog_posts_public_select
  ON blog_posts
  FOR SELECT
  TO anon, authenticated
  USING (is_published = TRUE);

-- RLS策略：管理员可以管理所有文章
DROP POLICY IF EXISTS blog_posts_admin_all ON blog_posts;
CREATE POLICY blog_posts_admin_all
  ON blog_posts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_sessions
      WHERE admin_sessions.token_hash = current_setting('request.jwt.claims', true)::json->>'token_hash'
      AND admin_sessions.expires_at > NOW()
    )
  );

-- 插入初始博客文章数据（从代码中迁移）
INSERT INTO blog_posts (slug, title, description, h1, content, published_at, is_published, related_posts, seo_keywords) VALUES
('best-sora-alternatives', 'Best Sora Alternatives for Creators in 2025', 'Discover the best Sora alternatives for content creators. Compare free and paid options, features, and find the perfect AI video generator for your needs.', 'Best Sora Alternatives for Creators in 2025', '<p>As OpenAI Sora continues to be limited in access, content creators are looking for reliable alternatives that can produce high-quality AI-generated videos. In this comprehensive guide, we''ll explore the best Sora alternatives available in 2025, comparing their features, pricing, and suitability for different types of creators.</p><h2>Why Look for Sora Alternatives?</h2><p>While Sora produces impressive results, it has several limitations that make alternatives attractive:</p><ul><li><strong>Limited Access:</strong> Sora is not widely available to the public</li><li><strong>Wait Times:</strong> Even when available, generation can be slow</li><li><strong>Pricing:</strong> May not be affordable for all creators</li><li><strong>Features:</strong> Some alternatives offer unique features Sora doesn''t have</li></ul><h2>Top Sora Alternatives for Creators</h2><h3>1. Runway Gen-3</h3><p>Runway is arguably the most popular Sora alternative, offering professional-grade video generation with excellent motion control and style options. It''s particularly well-suited for:</p><ul><li>Marketing and advertising content</li><li>Professional video production</li><li>Commercial projects</li></ul><h3>2. Pika Labs</h3><p>Pika Labs focuses on creative and artistic video generation, making it ideal for:</p><ul><li>Artistic and experimental content</li><li>Social media creators</li><li>Creative professionals</li></ul><h3>3. Luma Dream Machine</h3><p>Luma is known for its speed and ease of use, perfect for:</p><ul><li>Quick content creation</li><li>Rapid prototyping</li><li>Content creators who need fast turnaround</li></ul><h2>Free Sora Alternatives</h2><p>Many creators are looking for free options to get started. Here are some free Sora alternatives:</p><ul><li><strong>Our Platform:</strong> Offers 30 free credits for new users</li><li><strong>Runway:</strong> Has a free tier with limited credits</li><li><strong>Pika Labs:</strong> Offers free generation with watermarks</li><li><strong>Luma:</strong> Provides free access with usage limits</li></ul><h2>Choosing the Right Alternative</h2><p>When selecting a Sora alternative, consider:</p><ul><li>Your budget and pricing requirements</li><li>Video quality needs</li><li>Generation speed requirements</li><li>Specific features you need</li><li>Commercial use licensing</li></ul><h2>Conclusion</h2><p>The best Sora alternative depends on your specific needs as a creator. Whether you prioritize quality, speed, creativity, or cost, there''s an option that fits. Start with free trials to find the tool that works best for your workflow.</p>', '2025-01-15', true, ARRAY['free-sora-alternative', 'sora-vs-runway', 'sora-vs-pika'], ARRAY['best sora alternatives', 'sora alternative', 'ai video generator']),
('what-is-openai-sora', 'What Is OpenAI Sora? Features, Limitations & Use Cases', 'Learn everything about OpenAI Sora: what it is, key features, limitations, and use cases. Understand how Sora compares to other AI video generators.', 'What Is OpenAI Sora? Features, Limitations & Use Cases', '<p>OpenAI Sora is one of the most advanced text-to-video AI models available, capable of generating highly realistic videos from text prompts. In this comprehensive guide, we''ll explore what Sora is, its key features, limitations, and practical use cases.</p><h2>What Is OpenAI Sora?</h2><p>OpenAI Sora is a text-to-video AI model that can create videos up to 60 seconds long from simple text descriptions. Named after the Japanese word for "sky," Sora represents a significant leap forward in AI video generation technology, producing videos with impressive realism, detail, and consistency.</p><h2>Key Features of OpenAI Sora</h2><h3>1. High-Quality Video Generation</h3><p>Sora produces videos with exceptional quality, often indistinguishable from real footage. The model understands complex scenes, physics, and visual details, creating videos that maintain consistency throughout.</p><h3>2. Long Video Duration</h3><p>Unlike many AI video generators limited to 3-5 seconds, Sora can generate videos up to 60 seconds long, making it suitable for more complex storytelling and content creation.</p><h3>3. Complex Scene Understanding</h3><p>Sora understands complex prompts involving multiple subjects, actions, and environments. It can handle detailed descriptions of scenes, characters, and movements.</p><h2>Limitations of OpenAI Sora</h2><h3>1. Limited Public Access</h3><p>One of the biggest limitations is that Sora is not widely available to the public. Access is typically restricted to select users, researchers, or through waitlists, making it difficult for most creators to use.</p><h3>2. Generation Speed</h3><p>Video generation can be slow, especially during peak times. Users may need to wait several minutes or longer for their videos to be generated.</p><h2>Conclusion</h2><p>OpenAI Sora represents a significant advancement in AI video generation, producing high-quality, realistic videos from text prompts. However, limited access and unclear pricing make it challenging for most users. For practical content creation, <a href="/sora-alternative">Sora alternatives</a> often provide better accessibility, faster generation, and clearer commercial licensing options. If you''re looking for a <a href="/text-to-video-ai">text-to-video AI tool</a> that you can actually use today, consider exploring alternatives that offer similar quality with better accessibility.</p>', '2025-01-16', true, ARRAY['best-sora-alternatives', 'sora-vs-runway', 'sora-alternative'], ARRAY['openai sora', 'what is sora', 'sora ai'])
ON CONFLICT (slug) DO NOTHING;

