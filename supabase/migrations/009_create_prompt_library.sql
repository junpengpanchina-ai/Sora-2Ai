-- 009_create_prompt_library.sql
-- 创建用于存储视频提示词的表，并预置初始数据

CREATE TABLE IF NOT EXISTS prompt_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  prompt TEXT NOT NULL,
  category TEXT NOT NULL CHECK (
    category IN ('nature', 'character', 'action', 'scenery', 'abstract', 'cinematic')
  ),
  tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  example TEXT,
  locale TEXT NOT NULL DEFAULT 'zh' CHECK (locale IN ('zh', 'en')),
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_by_admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE prompt_library
  ADD CONSTRAINT prompt_library_unique_locale_title UNIQUE (locale, title);

CREATE INDEX IF NOT EXISTS idx_prompt_library_locale ON prompt_library(locale);
CREATE INDEX IF NOT EXISTS idx_prompt_library_category ON prompt_library(category);
CREATE INDEX IF NOT EXISTS idx_prompt_library_published ON prompt_library(is_published);
CREATE INDEX IF NOT EXISTS idx_prompt_library_updated_at ON prompt_library(updated_at DESC);

DROP TRIGGER IF EXISTS trg_prompt_library_updated_at ON prompt_library;
CREATE TRIGGER trg_prompt_library_updated_at
  BEFORE UPDATE ON prompt_library
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE prompt_library ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS prompt_library_public_select ON prompt_library;
CREATE POLICY prompt_library_public_select
  ON prompt_library
  FOR SELECT
  TO anon, authenticated
  USING (is_published = TRUE);

-- 预置简体中文提示词
INSERT INTO prompt_library (title, description, prompt, category, tags, difficulty, locale)
VALUES
  (
    'Serene Forest Dawn',
    'A peaceful forest scene with morning light filtering through trees',
    'A serene forest scene at dawn, with soft golden sunlight filtering through the dense canopy of ancient trees. Gentle morning mist floats between the tree trunks, and dewdrops glisten on leaves. Birds can be heard chirping in the distance. Cinematic, 4K, natural lighting, peaceful atmosphere.',
    'nature',
    ARRAY['forest', 'morning', 'peaceful', 'nature'],
    'beginner',
    'zh'
  ),
  (
    'Futuristic City Flight',
    'Flying through a futuristic cityscape at night',
    'A futuristic cityscape at night, flying through neon-lit skyscrapers. Holographic advertisements flicker on building facades. Flying vehicles zoom past in the background. Cyberpunk aesthetic, cinematic camera movement, 4K, vibrant colors.',
    'scenery',
    ARRAY['futuristic', 'city', 'flying', 'cyberpunk'],
    'intermediate',
    'zh'
  ),
  (
    'Kitten Playing',
    'A cute kitten playing on the grass',
    'A cute orange tabby kitten playing on a lush green lawn. The kitten chases a butterfly, pouncing and rolling around. Soft natural lighting, shallow depth of field, 4K, adorable and heartwarming atmosphere.',
    'character',
    ARRAY['cat', 'cute', 'playing', 'animals'],
    'beginner',
    'zh'
  ),
  (
    'Ocean Waves Crashing',
    'Powerful ocean waves crashing against coastal rocks',
    'Powerful ocean waves crashing against rugged coastal rocks. White foam sprays into the air. Dramatic storm clouds gather overhead. Slow motion, cinematic, 4K, dramatic lighting, epic and powerful atmosphere.',
    'nature',
    ARRAY['ocean', 'waves', 'dramatic', 'nature'],
    'intermediate',
    'zh'
  ),
  (
    'Abstract Particle Flow',
    'Abstract flowing particles with futuristic feel',
    'Abstract flowing particles in vibrant colors, creating mesmerizing patterns. Smooth, fluid motion with glowing trails. Dark background with neon accents. Futuristic, hypnotic, 4K, smooth animation.',
    'abstract',
    ARRAY['abstract', 'particles', 'futuristic', 'visual'],
    'advanced',
    'zh'
  ),
  (
    'Martial Arts Duel',
    'Ancient Chinese swordsmen dueling in a bamboo forest',
    'Two ancient Chinese swordsmen in a dramatic duel among bamboo forest. Their movements are graceful yet powerful. Bamboo leaves fall slowly around them. Cinematic, slow motion, traditional Chinese aesthetic, 4K, epic atmosphere.',
    'action',
    ARRAY['martial arts', 'ancient', 'dramatic', 'action'],
    'advanced',
    'zh'
  ),
  (
    'Desert Under Stars',
    'A desert landscape at night under a starry sky',
    'A vast desert landscape at night under a starry sky. The Milky Way stretches across the horizon. Sand dunes create soft curves in the moonlight. Time-lapse, cinematic, 4K, peaceful and majestic.',
    'scenery',
    ARRAY['desert', 'stars', 'night', 'landscape'],
    'intermediate',
    'zh'
  ),
  (
    'Robot Exploration',
    'A robot exploring an abandoned city',
    'A humanoid robot exploring an abandoned, overgrown city. Vines cover crumbling buildings. The robot moves cautiously, scanning the environment. Post-apocalyptic, cinematic, 4K, melancholic atmosphere.',
    'character',
    ARRAY['robot', 'post-apocalyptic', 'exploration', 'sci-fi'],
    'advanced',
    'zh'
  )
ON CONFLICT (locale, title) DO NOTHING;

-- 预置英文提示词
INSERT INTO prompt_library (title, description, prompt, category, tags, difficulty, locale)
VALUES
  (
    'Serene Forest Dawn',
    'A peaceful forest scene with morning light filtering through trees',
    'A serene forest scene at dawn, with soft golden sunlight filtering through the dense canopy of ancient trees. Gentle morning mist floats between the tree trunks, and dewdrops glisten on leaves. Birds can be heard chirping in the distance. Cinematic, 4K, natural lighting, peaceful atmosphere.',
    'nature',
    ARRAY['forest', 'morning', 'peaceful', 'nature'],
    'beginner',
    'en'
  ),
  (
    'Futuristic City Flight',
    'Flying through a futuristic cityscape at night',
    'A futuristic cityscape at night, flying through neon-lit skyscrapers. Holographic advertisements flicker on building facades. Flying vehicles zoom past in the background. Cyberpunk aesthetic, cinematic camera movement, 4K, vibrant colors.',
    'scenery',
    ARRAY['futuristic', 'city', 'flying', 'cyberpunk'],
    'intermediate',
    'en'
  ),
  (
    'Kitten Playing',
    'A cute kitten playing on the grass',
    'A cute orange tabby kitten playing on a lush green lawn. The kitten chases a butterfly, pouncing and rolling around. Soft natural lighting, shallow depth of field, 4K, adorable and heartwarming atmosphere.',
    'character',
    ARRAY['cat', 'cute', 'playing', 'animals'],
    'beginner',
    'en'
  ),
  (
    'Ocean Waves Crashing',
    'Powerful ocean waves crashing against coastal rocks',
    'Powerful ocean waves crashing against rugged coastal rocks. White foam sprays into the air. Dramatic storm clouds gather overhead. Slow motion, cinematic, 4K, dramatic lighting, epic and powerful atmosphere.',
    'nature',
    ARRAY['ocean', 'waves', 'dramatic', 'nature'],
    'intermediate',
    'en'
  ),
  (
    'Abstract Particle Flow',
    'Abstract flowing particles with futuristic feel',
    'Abstract flowing particles in vibrant colors, creating mesmerizing patterns. Smooth, fluid motion with glowing trails. Dark background with neon accents. Futuristic, hypnotic, 4K, smooth animation.',
    'abstract',
    ARRAY['abstract', 'particles', 'futuristic', 'visual'],
    'advanced',
    'en'
  ),
  (
    'Martial Arts Duel',
    'Ancient Chinese swordsmen dueling in a bamboo forest',
    'Two ancient Chinese swordsmen in a dramatic duel among bamboo forest. Their movements are graceful yet powerful. Bamboo leaves fall slowly around them. Cinematic, slow motion, traditional Chinese aesthetic, 4K, epic atmosphere.',
    'action',
    ARRAY['martial arts', 'ancient', 'dramatic', 'action'],
    'advanced',
    'en'
  ),
  (
    'Desert Under Stars',
    'A desert landscape at night under a starry sky',
    'A vast desert landscape at night under a starry sky. The Milky Way stretches across the horizon. Sand dunes create soft curves in the moonlight. Time-lapse, cinematic, 4K, peaceful and majestic.',
    'scenery',
    ARRAY['desert', 'stars', 'night', 'landscape'],
    'intermediate',
    'en'
  ),
  (
    'Robot Exploration',
    'A robot exploring an abandoned city',
    'A humanoid robot exploring an abandoned, overgrown city. Vines cover crumbling buildings. The robot moves cautiously, scanning the environment. Post-apocalyptic, cinematic, 4K, melancholic atmosphere.',
    'character',
    ARRAY['robot', 'post-apocalyptic', 'exploration', 'sci-fi'],
    'advanced',
    'en'
  ),
  (
    'Space Station Interior',
    'A detailed view inside a space station',
    'A detailed interior view of a modern space station. Astronauts float weightlessly through corridors. Earth visible through large windows. High-tech equipment and holographic displays. Cinematic, 4K, realistic lighting, futuristic atmosphere.',
    'scenery',
    ARRAY['space', 'station', 'futuristic', 'sci-fi'],
    'intermediate',
    'en'
  ),
  (
    'Dragon Flying',
    'A majestic dragon soaring through clouds',
    'A majestic dragon with iridescent scales soaring through dramatic clouds. Lightning flashes in the background. The dragon''s wings create powerful gusts. Epic fantasy, cinematic, 4K, dramatic lighting, mythical atmosphere.',
    'character',
    ARRAY['dragon', 'fantasy', 'flying', 'epic'],
    'advanced',
    'en'
  ),
  (
    'Time-Lapse City',
    'A time-lapse of a bustling city from day to night',
    'Time-lapse of a bustling modern city transitioning from day to night. Traffic flows like rivers of light. Skyscrapers light up one by one. Stars appear in the sky. Cinematic, 4K, smooth transition, urban atmosphere.',
    'scenery',
    ARRAY['city', 'time-lapse', 'urban', 'night'],
    'intermediate',
    'en'
  ),
  (
    'Underwater Coral Reef',
    'Vibrant coral reef teeming with marine life',
    'A vibrant coral reef teeming with colorful marine life. Tropical fish swim in schools. Sunlight filters through crystal-clear water. Soft coral swaying gently. Cinematic, 4K, underwater lighting, peaceful and colorful atmosphere.',
    'nature',
    ARRAY['ocean', 'coral', 'marine life', 'underwater'],
    'beginner',
    'en'
  )
ON CONFLICT (locale, title) DO NOTHING;


