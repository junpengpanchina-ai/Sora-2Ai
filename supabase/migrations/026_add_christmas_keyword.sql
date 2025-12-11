-- 026_add_christmas_keyword.sql
-- Add Christmas keyword with Christmas page style

INSERT INTO long_tail_keywords (
  keyword,
  intent,
  page_style,
  page_slug,
  title,
  meta_description,
  h1,
  intro_paragraph,
  product,
  service,
  region,
  priority,
  status,
  steps,
  faq
) VALUES (
  'Christmas video generator free online',
  'information',
  'christmas',
  'keywords-christmas-video-generator-free-online',
  'Christmas Video Generator Free Online | Create Festive Videos with AI',
  'Create beautiful Christmas videos for free online using AI. Generate festive holiday content with Sora2Ai video generator. No signup required, instant results.',
  'Create Christmas Videos Free Online with AI',
  'Looking to create stunning Christmas videos for your holiday celebrations? Our free online Christmas video generator powered by AI makes it easy to produce festive content in minutes. Whether you need videos for social media, family greetings, or marketing campaigns, our tool helps you generate high-quality Christmas-themed videos without any technical skills. Simply enter your prompt describing your Christmas scene, and our AI will create beautiful, festive videos featuring snow, decorations, holiday themes, and more. Perfect for spreading holiday cheer and creating memorable content.',
  'Sora2Ai Video',
  'Online Video Generator',
  'Global',
  10,
  'published',
  '[
    {
      "title": "Enter Your Christmas Video Prompt",
      "description": "Describe your Christmas scene in detail. For example: \"A cozy living room with a decorated Christmas tree, fireplace, and snow falling outside the window.\""
    },
    {
      "title": "Choose Video Settings",
      "description": "Select your preferred aspect ratio (16:9, 9:16, or 1:1) and video duration. Our AI will optimize your Christmas video accordingly."
    },
    {
      "title": "Generate Your Christmas Video",
      "description": "Click generate and wait a few moments. Our AI will create your festive Christmas video with beautiful holiday themes and effects."
    },
    {
      "title": "Download and Share",
      "description": "Once your video is ready, download it and share it on social media, send it to family and friends, or use it in your holiday marketing campaigns."
    }
  ]'::JSONB,
  '[
    {
      "question": "Is the Christmas video generator really free?",
      "answer": "Yes, our Christmas video generator is completely free to use. You can create multiple Christmas videos without any cost or signup required."
    },
    {
      "question": "What kind of Christmas videos can I create?",
      "answer": "You can create various Christmas-themed videos including snowy scenes, decorated homes, holiday celebrations, winter landscapes, and festive animations. The AI can generate any Christmas scene you describe."
    },
    {
      "question": "How long does it take to generate a Christmas video?",
      "answer": "Typically, it takes 1-3 minutes to generate a Christmas video depending on the complexity of your prompt and current server load."
    },
    {
      "question": "Can I use the Christmas videos for commercial purposes?",
      "answer": "Yes, you can use the generated Christmas videos for personal and commercial purposes, including social media posts, marketing campaigns, and holiday greetings."
    },
    {
      "question": "Do I need to create an account to use the Christmas video generator?",
      "answer": "No account is required. You can start creating Christmas videos immediately without any registration or signup process."
    }
  ]'::JSONB
)
ON CONFLICT (page_slug) DO UPDATE SET
  keyword = EXCLUDED.keyword,
  intent = EXCLUDED.intent,
  page_style = EXCLUDED.page_style,
  title = EXCLUDED.title,
  meta_description = EXCLUDED.meta_description,
  h1 = EXCLUDED.h1,
  intro_paragraph = EXCLUDED.intro_paragraph,
  product = EXCLUDED.product,
  service = EXCLUDED.service,
  region = EXCLUDED.region,
  priority = EXCLUDED.priority,
  status = EXCLUDED.status,
  steps = EXCLUDED.steps,
  faq = EXCLUDED.faq,
  updated_at = NOW();
