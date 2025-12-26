/**
 * SEO 内容生成 Prompt 模板
 * 用于批量生成使用场景、长尾词、博客文章等 SEO 内容
 */

export interface PromptTemplate {
  id: string
  name: string
  description: string
  template: string
  parameters: Array<{
    key: string
    label: string
    required: boolean
    placeholder?: string
  }>
}

export const SEO_CONTENT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'use-case',
    name: '使用场景页面生成',
    description: '批量生成使用场景介绍页面（适合 90% 内容）',
    parameters: [
      { key: 'scene', label: '使用场景', required: true, placeholder: '例如：健身课程视频' },
      { key: 'industry', label: '目标行业', required: false, placeholder: '例如：体育培训' },
      { key: 'keyword', label: '目标关键词', required: false, placeholder: '例如：ai fitness video generator' },
      { key: 'style', label: '视频风格', required: false, placeholder: '例如：真实写实、动漫、商业' },
    ],
    template: `You are an experienced SEO content writer specializing in both SEO (Google ranking) and GEO (Generative Engine Optimization - AI search citation). Generate a high-quality, indexable use case page for an AI video generation platform (Sora2) that can be directly quoted by ChatGPT, Gemini, and Perplexity. All content must be in English.

CRITICAL: The AI video platform ONLY supports 10-second or 15-second videos. NEVER mention any duration longer than 15 seconds (such as 20 seconds, 30 seconds, 45 seconds, 60 seconds, 1 minute, 2 minutes, etc.). When describing video examples, ALWAYS use "10 seconds" or "15 seconds" only.

【Platform Features】
- Text-to-video generation
- Image-to-video generation
- Multiple styles (realistic, anime, commercial, educational)
- Video duration: 10 seconds or 15 seconds (NOT 2 minutes or longer)
- Can generate product videos, marketing videos, educational content, TikTok videos, etc.

【Content Requirements】
- Do not stuff keywords
- Natural, human-like tone
- Each paragraph should be 60-120 words
- Fixed structure with H2/H3 headings
- All content must be in English
- IMPORTANT: When mentioning video duration, ALWAYS use "10 seconds" or "15 seconds". NEVER mention "2 minutes", "1 minute", or any duration longer than 15 seconds.

【GEO Optimization Requirements】
1. Answer-First Structure (GEO-1): Start with "In [industry], AI-generated videos are commonly used for [use case]." Follow with typical applications list (noun phrases).
2. List Format (GEO-2): Use noun phrases, NOT marketing sentences (e.g., "Product demo videos", not "Boost your brand visibility").
3. FAQ Style (GEO-4): Answer questions non-experts would ask (e.g., "Is AI video suitable for [industry]?", "Do I need [equipment]?"). Keep answers 2-4 sentences, no marketing jargon.
4. Industry + Scene + Platform (GEO-5): Must clearly identify at least 2 of: industry, use case scenario, platform.

【Parameters】
Use Case: {{scene}}
Target Industry: {{industry}}
Target Keyword: {{keyword}}
Video Style: {{style}}

【Content Structure - SEO + GEO Optimized】
H1: [Main title based on the use case, e.g., "AI Video Generation for {{scene}}"]

H2: Introduction (GEO-1: Answer-First Structure - 150-200 words)
Start with: "In {{industry}}, AI-generated videos are commonly used for {{scene}}."
Follow with:
- Typical applications include: [list of noun phrases]
- This page explains how teams use AI video tools for this purpose, which platforms are most suitable, and practical steps to get started.

H2: Why AI video is suitable for this scenario (3-5 points)
Use noun phrases in lists:
✅ Good: "Product demo videos", "Onboarding clips", "Social media ads"
❌ Bad: "Boost your brand visibility", "Increase engagement dramatically"

H2: What Sora2 can do in this scenario (3-6 sub-scenarios with H3 headings)
List format with noun phrases

H2: Video generation examples (text-to-video examples)
Use noun phrases for examples

H2: Frequently Asked Questions (GEO-4: "傻问题化" - Answer questions non-experts would ask)
Must include at least 3 questions like:
- "Is AI video suitable for {{industry}}?"
- "Do I need filming equipment for {{scene}}?"
- "Which platform works best for {{scene}} in {{industry}}?"
Keep answers 2-4 sentences, no marketing jargon.

H2: Target Audience / Applicable Industries

IMPORTANT: You MUST start with an H1 heading (single #). The H1 should be the main title of the page.

Please output high-quality SEO + GEO optimized content in English.`,
  },
  {
    id: 'long-tail-keyword',
    name: '长尾关键词页面生成',
    description: '批量生成长尾关键词解释页面（提高收录）',
    parameters: [
      { key: 'keyword', label: '关键词', required: true, placeholder: '例如：ai fitness video generator' },
      { key: 'scene', label: '相关使用场景', required: false, placeholder: '例如：健身课程视频' },
      { key: 'industry', label: '行业', required: false, placeholder: '例如：体育培训' },
    ],
    template: `You are an SEO content expert. Please generate a dedicated long-tail keyword page based on the following parameters.

【Parameters】
Keyword: {{keyword}}
Related Use Case: {{scene}}
Industry: {{industry}}

【Writing Requirements】
- Use natural language, do not stuff keywords
- Each paragraph: 60-100 words
- Total length: 400-700 words (suitable for long-tail keyword pages)
- Friendly, readable, informative
- All content must be in English
- IMPORTANT: When mentioning video duration, ALWAYS use "10 seconds" or "15 seconds". NEVER mention "2 minutes", "1 minute", or any duration longer than 15 seconds.

【Page Structure】
H1: What is {{keyword}}?
H2: Its practical business applications
H2: A simple example (explain with a story or scenario)
H2: How to solve this problem with AI video (Sora2)
H2: Frequently Asked Questions (2-3 questions)

Please output high-quality content in English.`,
  },
  {
    id: 'blog-post',
    name: '博客文章生成',
    description: '生成高质量博客文章（Pillar + Cluster，抢竞争词流量）',
    parameters: [
      { key: 'title', label: '文章标题', required: true, placeholder: '例如：Best Sora Alternatives for Creators' },
      { key: 'keyword', label: '目标关键词', required: true, placeholder: '例如：sora alternative' },
      { key: 'audience', label: '读者群体', required: false, placeholder: '例如：内容创作者、营销人员' },
      { key: 'scene', label: '相关场景', required: false, placeholder: '例如：YouTube 视频制作' },
    ],
    template: `You are a professional SEO blog writer. Please generate a high-quality blog article based on the article title and target keyword.

【Parameters】
Article Title: {{title}}
Target Keyword: {{keyword}}
Target Audience: {{audience}}
Related Scenario: {{scene}}

【Overall Requirements】
- Clear structure with logical paragraphs
- Do not stuff keywords or repeat content
- Use real examples
- Write like a human, avoid AI-like tone
- Content must satisfy search intent
- Word count: 1500-2500 words
- Fixed H2/H3 structure as below
- All content must be in English
- IMPORTANT: When mentioning video duration, ALWAYS use "10 seconds" or "15 seconds". NEVER mention "2 minutes", "1 minute", or any duration longer than 15 seconds.

【Article Structure Template】
H1: {{title}}
H2: What problem does this article solve? (Introduction)
H2: Core concept explanation (related to keyword)
H2: Common misconceptions (3-5 points)
H2: How to truly solve this problem (step-by-step explanation)
H2: Applications of AI video (Sora2) in this scenario
    H3: Sub-scenario 1
    H3: Sub-scenario 2
    H3: Sub-scenario 3
H2: Real-world examples (can be fictional but must be specific)
H2: Conclusion (give readers a clear takeaway)

Please output high-quality SEO blog content in English.`,
  },
  {
    id: 'industry-page',
    name: '行业页面生成',
    description: '生成特定行业的介绍页面（可扩展后台功能）',
    parameters: [
      { key: 'industry', label: '行业', required: true, placeholder: '例如：教育行业、电商行业' },
      { key: 'keyword', label: '关键词', required: false, placeholder: '例如：ai video for education' },
    ],
    template: `You are an SEO content expert. Please generate an industry-specific introduction page.

【Parameters】
Industry: {{industry}}
Keyword: {{keyword}}

【Writing Requirements】
- Emphasize industry pain points
- Combine with the practical value of AI video
- List real application scenarios (avoid generic statements)
- All content must be in English
- IMPORTANT: When mentioning video duration, ALWAYS use "10 seconds" or "15 seconds". NEVER mention "2 minutes", "1 minute", or any duration longer than 15 seconds.

【Structure】
H1: Applications of AI Video in the {{industry}} Industry
H2: Problems facing the industry (4-6 points)
H2: Why AI video is suitable for this industry
H2: Typical application scenarios of Sora2 in this industry
    H3: Scenario 1
    H3: Scenario 2
    H3: Scenario 3
H2: Video generation examples
H2: Conclusion (provide industry future trends)

Please output high-quality SEO content in English.`,
  },
  {
    id: 'compare-page',
    name: '对比页面生成',
    description: '生成工具对比页面（Sora vs 其他工具）',
    parameters: [
      { key: 'tool_a', label: '工具 A（默认 Sora）', required: false, placeholder: '例如：OpenAI Sora' },
      { key: 'tool_b', label: '工具 B', required: true, placeholder: '例如：Runway、Pika、Luma' },
      { key: 'keyword', label: '目标关键词', required: false, placeholder: '例如：sora vs runway' },
    ],
    template: `You are a professional tool comparison article writer. Please generate an AI video tool comparison page.

【Parameters】
Tool A: {{tool_a}} (default: OpenAI Sora)
Tool B: {{tool_b}}
Target Keyword: {{keyword}}

【Writing Requirements】
- Objective, fair, data-supported
- Do not favor any side
- Use real comparison points
- Clear structure, easy to read
- All content must be in English
- IMPORTANT: When mentioning video duration, ALWAYS use "10 seconds" or "15 seconds". NEVER mention "2 minutes", "1 minute", or any duration longer than 15 seconds.

【Structure】
H1: {{tool_a}} vs {{tool_b}}: Which AI Video Generator is Better?
H2: Quick Comparison Table (price, features, quality, speed, etc.)
H2: Advantages of {{tool_a}} (3-5 points)
H2: Advantages of {{tool_b}} (3-5 points)
H2: Detailed Feature Comparison
    H3: Video Quality
    H3: Generation Speed
    H3: Price Comparison
    H3: Ease of Use
H2: Recommended Use Cases
    H3: Scenarios for choosing {{tool_a}}
    H3: Scenarios for choosing {{tool_b}}
H2: Conclusion and Recommendations

Please output high-quality comparison content in English.`,
  },
]

/**
 * 替换模板中的参数占位符
 */
export function renderTemplate(template: string, params: Record<string, string>): string {
  let result = template
  for (const [key, value] of Object.entries(params)) {
    const placeholder = `{{${key}}}`
    // 如果参数为空，移除占位符所在行或替换为空字符串
    if (!value || value.trim() === '') {
      // 移除包含该占位符的行（如果整行只有占位符和标签）
      result = result.replace(new RegExp(`^.*${placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*$`, 'gm'), '')
      // 或者替换为空字符串
      result = result.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '')
    } else {
      result = result.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value.trim())
    }
  }
  // 清理多余的空行
  result = result.replace(/\n{3,}/g, '\n\n')
  return result.trim()
}

/**
 * 获取模板的参数列表
 */
export function getTemplateParams(templateId: string): PromptTemplate['parameters'] {
  const template = SEO_CONTENT_TEMPLATES.find((t) => t.id === templateId)
  return template?.parameters || []
}

