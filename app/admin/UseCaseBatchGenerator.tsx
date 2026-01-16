'use client'

/**
 * UseCase Batch Generator
 * 
 * 🔒 隐性规则（必须严格执行）：
 * 1. 绝不为"热词"破坏结构 - Answer-first 结构不可改，不允许加营销句
 * 2. 不做"单页奇观" - 关注整库信任度，不是单页流量
 * 3. 允许"慢爬"，不允许"结构回滚" - 收录慢可以等，但不允许删 FAQ-B、缩短 Answer-first
 * 
 * 详见：GEO_AND_SEO_UNIFIED.md 中的"隐性规则"章节
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '@/components/ui'
import { generateSlugFromText } from '@/lib/utils/slug'

interface UseCaseBatchGeneratorProps {
  onShowBanner: (type: 'success' | 'error', text: string) => void
  onGenerated: () => void // 生成完成后刷新列表
}

interface TrendingKeyword {
  title: string
  formattedTraffic: string
}

interface BatchTask {
  id: string
  keyword: string
  useCaseType: string
  industry: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'saved'
  result?: string
  error?: string
  savedId?: string
  savedSlug?: string
  savedTitle?: string
}

// 行业列表（与 AI 视频生成高度匹配）
const INDUSTRIES = [
  { value: '', label: '所有行业', note: '不限制行业' },
  { value: 'Fitness & Sports', label: 'Fitness & Sports', note: '健身运动 - 适合健身教程、运动视频' },
  { value: 'E-commerce & Retail', label: 'E-commerce & Retail', note: '电商零售 - 适合产品展示、购物视频' },
  { value: 'Education & Training', label: 'Education & Training', note: '教育培训 - 适合课程讲解、知识科普' },
  { value: 'Marketing & Advertising', label: 'Marketing & Advertising', note: '营销广告 - 适合品牌宣传、广告创意' },
  { value: 'Social Media', label: 'Social Media', note: '社交媒体 - 适合短视频、内容创作' },
  { value: 'Entertainment', label: 'Entertainment', note: '娱乐内容 - 适合娱乐视频、创意内容' },
  { value: 'Real Estate', label: 'Real Estate', note: '房地产 - 适合房产展示、虚拟看房' },
  { value: 'Food & Beverage', label: 'Food & Beverage', note: '餐饮美食 - 适合美食展示、烹饪教程' },
  { value: 'Travel & Tourism', label: 'Travel & Tourism', note: '旅游出行 - 适合旅游宣传、景点介绍' },
  { value: 'Fashion & Beauty', label: 'Fashion & Beauty', note: '时尚美妆 - 适合穿搭展示、美妆教程' },
  { value: 'Technology', label: 'Technology', note: '科技产品 - 适合产品演示、技术讲解' },
  { value: 'Healthcare', label: 'Healthcare', note: '医疗健康 - 适合健康科普、医疗宣传' },
  { value: 'Finance', label: 'Finance', note: '金融理财 - 适合金融科普、理财教育' },
  { value: 'Automotive', label: 'Automotive', note: '汽车交通 - 适合汽车展示、驾驶场景' },
  { value: 'Gaming', label: 'Gaming', note: '游戏娱乐 - 适合游戏宣传、游戏内容' },
]

// 使用场景类型（类目）- AI 视频生成核心场景
const USE_CASE_TYPES = [
  { value: 'advertising-promotion', label: 'Advertising & Promotion', note: '广告转化 - 商业广告、转化视频、绩效营销、活动推广' },
  { value: 'social-media-content', label: 'Social Media Content', note: '短视频内容 - Reels/Shorts、趋势视频、无脸内容、短格式视频（TikTok/Instagram/YouTube/X）' },
  { value: 'product-demo-showcase', label: 'Product Demo & Showcase', note: '产品演示 - 产品展示、App演示、功能亮点、落地页视频' },
  { value: 'brand-storytelling', label: 'Brand Storytelling', note: '品牌叙事 - 品牌介绍、创始人故事、公司愿景、美学品牌视频' },
  { value: 'education-explainer', label: 'Education & Explainer', note: '讲解说明 - 解释视频、教程、微学习、课程推广' },
  { value: 'ugc-creator-content', label: 'UGC & Creator Content', note: 'UGC/测评 - UGC风格广告、影响者内容、推荐视频、测评视频' },
]

export default function UseCaseBatchGenerator({ onShowBanner, onGenerated }: UseCaseBatchGeneratorProps) {
  const [trendingKeywords, setTrendingKeywords] = useState<TrendingKeyword[]>([])
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([])
  const [selectedUseCaseType, setSelectedUseCaseType] = useState<string>('advertising-promotion')
  const [selectedIndustry, setSelectedIndustry] = useState<string>('')
  const [count, setCount] = useState<number>(10)
  const [tasks, setTasks] = useState<BatchTask[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingIndex, setProcessingIndex] = useState(-1)
  const [shouldStop, setShouldStop] = useState(false)

  // 获取热搜词
  useEffect(() => {
    const fetchTrends = async () => {
      try {
        console.log('开始获取热搜词...')
        const response = await fetch('/api/trends?geo=US')
        const data = await response.json()
        console.log('热搜词 API 响应:', data)
        
        if (data.success && Array.isArray(data.trends)) {
          // 过滤出与 AI 视频相关的热搜词
          const aiVideoKeywords = data.trends.filter((trend: TrendingKeyword) => {
            const title = trend.title.toLowerCase()
            return (
              title.includes('ai') ||
              title.includes('video') ||
              title.includes('generator') ||
              title.includes('sora') ||
              title.includes('text to video') ||
              title.includes('video ai')
            )
          })
          const finalKeywords = aiVideoKeywords.length > 0 ? aiVideoKeywords : data.trends.slice(0, 20)
          console.log('过滤后的热搜词数量:', finalKeywords.length)
          setTrendingKeywords(finalKeywords)
        } else {
          console.warn('热搜词 API 返回异常:', data)
          // 使用备用关键词
          const fallbackKeywords: TrendingKeyword[] = [
            { title: 'AI Video Generator', formattedTraffic: '100K+' },
            { title: 'Text to Video AI', formattedTraffic: '50K+' },
            { title: 'Sora Alternative', formattedTraffic: '30K+' },
            { title: 'AI Video Creator', formattedTraffic: '25K+' },
            { title: 'Video AI Tool', formattedTraffic: '20K+' },
            { title: 'AI Video Maker', formattedTraffic: '18K+' },
            { title: 'Generate Video from Text', formattedTraffic: '15K+' },
            { title: 'AI Video Production', formattedTraffic: '12K+' },
            { title: 'Video Generation AI', formattedTraffic: '10K+' },
            { title: 'AI Video Editing', formattedTraffic: '8K+' },
          ]
          console.log('使用备用热搜词:', fallbackKeywords.length)
          setTrendingKeywords(fallbackKeywords)
        }
      } catch (error) {
        console.error('获取热搜词失败:', error)
        // 使用备用关键词
        const fallbackKeywords: TrendingKeyword[] = [
          { title: 'AI Video Generator', formattedTraffic: '100K+' },
          { title: 'Text to Video AI', formattedTraffic: '50K+' },
          { title: 'Sora Alternative', formattedTraffic: '30K+' },
          { title: 'AI Video Creator', formattedTraffic: '25K+' },
          { title: 'Video AI Tool', formattedTraffic: '20K+' },
          { title: 'AI Video Maker', formattedTraffic: '18K+' },
          { title: 'Generate Video from Text', formattedTraffic: '15K+' },
          { title: 'AI Video Production', formattedTraffic: '12K+' },
          { title: 'Video Generation AI', formattedTraffic: '10K+' },
          { title: 'AI Video Editing', formattedTraffic: '8K+' },
        ]
        setTrendingKeywords(fallbackKeywords)
        onShowBanner('error', '无法加载热搜词，已使用备用关键词列表')
      }
    }
    fetchTrends()
  }, [onShowBanner])

  // 处理单个任务
  const processTask = async (task: BatchTask): Promise<string> => {
    // 构建与产品高度匹配的 Prompt（优化SEO + GEO）
    const systemPrompt = `You are a professional SEO content writer for Sora2, an AI video generation platform. Generate high-quality, product-focused use case content optimized for both SEO (Google ranking) and GEO (Generative Engine Optimization - AI search citation). Your content must be structured so that ChatGPT, Gemini, and Perplexity can directly quote it as answers. All output must be in English.

CRITICAL: The AI video platform ONLY supports 10-second or 15-second videos. NEVER mention any duration longer than 15 seconds (such as 20 seconds, 30 seconds, 45 seconds, 60 seconds, 1 minute, 2 minutes, etc.). When describing video examples, ALWAYS use "10 seconds" or "15 seconds" only.

GEO Optimization Requirements (for AI search citation):
1. Answer-First Structure (GEO-1): Start with a clear, citable definition using the format: "In [industry], AI-generated videos are commonly used for [use case]."
2. List Format (GEO-2): Use noun phrases, NOT marketing sentences (e.g., "Product demo videos", not "Boost your brand visibility")
3. FAQ Style (GEO-4): Answer questions a non-expert would ask (e.g., "Is AI video suitable for [industry]?", "Do I need [equipment]?")
4. Industry + Scene + Platform (GEO-5): Must clearly identify at least 2 of: industry, use case scenario, platform`

    // 根据行业和使用场景类型生成更具体的指导
    const industryContext = task.industry 
      ? `This use case is specifically for the ${task.industry} industry. Focus on how AI video generation addresses unique challenges and opportunities in this industry.`
      : 'This is a general use case applicable across multiple industries.'
    
    const useCaseTypeContext = {
      'marketing': 'Focus on marketing and promotional content. Emphasize brand storytelling, product showcases, and advertising campaigns.',
      'social-media': 'Focus on social media content creation. Emphasize short-form videos, viral content, and social engagement.',
      'youtube': 'Focus on YouTube video production. Emphasize long-form content, tutorials, and educational videos.',
      'tiktok': 'Focus on TikTok video creation. Emphasize short vertical videos, trending content, and viral potential.',
      'product-demo': 'Focus on product demonstration videos. Emphasize showcasing product features, benefits, and use cases.',
      'ads': 'Focus on advertising videos. Emphasize commercial campaigns, promotional content, and conversion optimization.',
      'education': 'Focus on educational content. Emphasize tutorials, courses, and knowledge sharing.',
      'other': 'Focus on general video creation needs.',
    }[task.useCaseType] || 'Focus on general video creation needs.'

    // 🔥 随机选择结构变体（降低同构风险）
    // H1: 3 种变体（避免 "for X in Y" 全站统一模式）
    const h1Variant = ['A', 'B', 'C'][Math.floor(Math.random() * 3)] as 'A' | 'B' | 'C'
    const answerFirstVariant = ['A', 'B', 'C'][Math.floor(Math.random() * 3)] as 'A' | 'B' | 'C'
    // 痛点类型加权概率：Understanding 40%, Scale 30%, Time 20%, Cost 10%
    const rand = Math.random()
    const painPointType = rand < 0.4 ? 'understanding' : rand < 0.7 ? 'scale' : rand < 0.9 ? 'time' : 'cost'
    // 应用介绍句式池（避免固定的 "Typical applications include..."）
    const applicationPhrases = [
      'Common ways teams apply this include',
      'This approach is often used for',
      'In practice, these videos support tasks such as'
    ]
    const selectedApplicationPhrase = applicationPhrases[Math.floor(Math.random() * applicationPhrases.length)]
    
    const answerFirstOpenings = {
      A: `In the ${task.industry || 'General'} sector, AI-generated video is often used to support ${task.keyword}, especially in scenarios such as [scene 1], [scene 2], and [scene 3].`,
      B: `Many teams in the ${task.industry || 'General'} field use AI-generated video for ${task.keyword}, especially when they need to [scene 1], [scene 2], or [scene 3].`,
      C: `${task.keyword} is one of the most common ways AI-generated video is applied in the ${task.industry || 'General'} industry, particularly for [scene 1], [scene 2], and [scene 3].`
    }
    
    const painPointTemplates = {
      time: `Focus on TIME-related challenges: takes time, delays communication, manual effort. Write 2-3 sentences about how ${task.keyword} in ${task.industry || 'this industry'} often takes significant time to communicate effectively, and how AI-generated video helps address this.`,
      understanding: `Focus on UNDERSTANDING challenges: hard to explain, misunderstandings, lack of clarity. Write 2-3 sentences about how explaining ${task.keyword} in ${task.industry || 'this industry'} is often challenging, and how AI-generated video helps address this.`,
      scale: `Focus on SCALE challenges: difficult to reuse, inconsistent delivery, hard to standardize. Write 2-3 sentences about how ${task.keyword} in ${task.industry || 'this industry'} is difficult to reuse and standardize, and how AI-generated video helps address this.`,
      cost: `Focus on COST challenges: production cost, external vendors, update overhead. Write 2-3 sentences about how ${task.keyword} in ${task.industry || 'this industry'} often requires significant production cost, and how AI-generated video helps address this.`
    }

    const userPrompt = `Generate a use case page for Sora2 AI video generation platform.

【Platform Core: AI Video Generation】
Sora2 is a professional AI video generation platform that specializes in creating high-quality videos from text and images.

【Product Features (Must Highlight)】
- Text-to-video generation: Convert text prompts into high-quality AI-generated videos
- Image-to-video generation: Transform static images into dynamic AI videos
- Multiple AI video styles: Realistic, cinematic, animated, commercial, educational
- Supports various video formats: 9:16 (vertical for TikTok/Shorts), 16:9 (horizontal for YouTube)
- Fast AI video generation: Create videos in minutes using AI technology
- No watermark: Professional quality AI video output
- Cost-effective AI video creation: Affordable pricing for creators and businesses
- AI-powered video editing: Intelligent scene transitions and effects

【Target Context】
Use Case Keyword: ${task.keyword}
Industry: ${task.industry || 'General'}
Use Case Type: ${task.useCaseType}

${industryContext}

${useCaseTypeContext}

【Content Requirements】
- Content must be highly relevant to Sora2's actual features AND the ${task.industry || 'general'} industry context
- Emphasize how Sora2 solves real problems specific to ${task.industry || 'this'} industry
- Include specific use cases that Sora2 can handle for ${task.keyword} in ${task.industry || 'general'} contexts
- Use natural, engaging language that resonates with ${task.industry || 'general'} industry professionals
- Answer-first section: 120-160 words (NOT 150-200, avoid padding)
- Other paragraphs: Focus on information points, not word count
- All content in English
- Make sure the content is specifically tailored to: ${task.keyword} + ${task.industry || 'General'} + ${task.useCaseType}

【Content Structure - SEO + GEO Optimized with Random Variants】

🔥 YOU MUST USE THESE EXACT VARIANTS (assigned randomly):
- H1 Format: ${h1Variant === 'A' ? 'Format A' : 'Format B'}
- Answer-first Opening: ${answerFirstVariant === 'A' ? 'Opening A' : answerFirstVariant === 'B' ? 'Opening B' : 'Opening C'}
- Why This Matters: ${painPointType} type only

H1: ${h1Variant === 'A' 
  ? `AI Video Generation for ${task.industry || 'General'} – ${task.keyword}`
  : h1Variant === 'B'
  ? `AI Video Use Cases in ${task.industry || 'General'}: ${task.keyword}`
  : `How ${task.industry || 'General'} Teams Apply AI Video to ${task.keyword}`
}

H2: Introduction (GEO-1: Answer-First Structure - 120-160 words)
Start with this exact opening:
"${answerFirstOpenings[answerFirstVariant]}"
Follow with:
- ${selectedApplicationPhrase}: [list of noun phrases, e.g., "Product demo videos", "Onboarding explainer clips", "Social media short-form ads"]
- This page explains how teams use AI video tools for this purpose, which platforms are most suitable, and practical steps to get started.

🛡️ AUTHORITATIVENESS ANCHOR (After Answer-first paragraph):
Add this sentence immediately after the Answer-first paragraph (1-2 sentences, factual, non-promotional):
"This page is part of a structured knowledge base on AI video use cases, covering multiple industries and scenarios."
Purpose: Tell AI this is a systematic knowledge base, not an isolated page.

H2: Why Sora2 is perfect for ${task.keyword} in ${task.industry || 'General'} (3-5 specific reasons)
Use noun phrases in lists, NOT marketing sentences:
✅ Good: "Product demo videos", "Onboarding clips", "Social media ads"
❌ Bad: "Boost your brand visibility", "Increase engagement dramatically"

H2: Why This Matters
${painPointTemplates[painPointType]}
Write 2-3 sentences only, do NOT write all 4 types.

🛡️ INDUSTRY CONSTRAINTS (After "Why This Matters", before "How to Create"):
H2: Industry Constraints and Considerations

Add a 2-3 sentence paragraph about real limitations specific to ${task.industry || 'this industry'}:

Template:
"In the ${task.industry || 'this'} sector, AI-generated video may have limitations when [specific constraint 1], [specific constraint 2], or [specific constraint 3]. Teams should consider [consideration] before applying this approach to [specific scenario]."

Examples:
- Healthcare: "In the healthcare sector, AI-generated video may have limitations when dealing with patient-specific medical information, regulatory compliance requirements, or situations requiring real-time clinical interaction."
- Manufacturing: "In manufacturing, AI-generated video may have limitations when demonstrating complex machinery operations, safety-critical procedures, or processes requiring precise technical specifications."
- Legal: "In legal services, AI-generated video may have limitations when explaining jurisdiction-specific regulations, case-sensitive information, or content requiring formal legal review."

Purpose: Provide industry-specific constraints to reduce thin content and template spam risks.

H2: How to use Sora2 for ${task.keyword} in ${task.industry || 'General'} (GEO-3: Step-by-step guide)
    H3: Step 1: Create your text prompt (with ${task.industry || 'general'} industry-specific examples)
    H3: Step 2: Choose video style and format (recommended for ${task.useCaseType})
    H3: Step 3: Generate and download

H2: Real-world examples with Sora2 for ${task.keyword} in ${task.industry || 'General'}
Use noun phrases for examples:
- [Example 1 as noun phrase]
- [Example 2 as noun phrase]
- [Example 3 as noun phrase]

H2: Benefits of using Sora2 for ${task.keyword} in ${task.industry || 'General'}
List format with noun phrases

H2: Frequently Asked Questions (GEO-4: "傻问题化" - Answer questions non-experts would ask)
Must include at least 3 questions. You MUST include at least 1 FAQ-A (beginner cognitive) AND at least 1 FAQ-B (decision boundary).

🛡️ FAQ-A (Beginner Cognitive - Newcomer Questions):
These answer questions non-experts would ask:
- "Is AI video suitable for ${task.industry || 'this industry'}?"
- "Do I need filming equipment for ${task.keyword}?"
- "Is this expensive?"
- "Can small teams use this?"
- "Do I need technical skills?"

🛡️ FAQ-B (Decision Boundary - When NOT to Use):
These help users understand limitations and boundaries:
- "When should AI video not be used in ${task.industry || 'this industry'}?"
- "What are common limitations of AI-generated video for ${task.keyword}?"
- "What scenarios are not suitable for AI-generated video in ${task.industry || 'this industry'}?"
- "Are there industry-specific constraints I should be aware of?"

Priority questions (AI search prefers these):
- FAQ-A questions (beginner-friendly, lowers barrier to entry)
- FAQ-B questions (AI loves citing these to reduce misuse risk)

Avoid or use sparingly:
- "Which platform works best..." (comparison/evaluation questions are less preferred by AI search)

Keep answers 2-4 sentences, no marketing jargon. FAQ-B answers should be honest about limitations.

H2: Using Sora2 for ${task.keyword} in ${task.industry || 'General'}
(Neutral informational heading, not "Get started with Sora2")

Final CTA (One sentence only):
Get started with Sora2 to create AI-generated videos for ${task.industry || 'General'} use cases.

IMPORTANT: 
- You MUST start with an H1 heading (single #)
- Focus on Sora2's actual capabilities
- Make it clear this is about Sora2 platform
- Include actionable steps users can take
- The content MUST be specifically relevant to: ${task.keyword} + ${task.industry || 'General'} industry + ${task.useCaseType} type
- Do NOT generate generic content - make it highly specific to these parameters

Please output high-quality SEO content in English that is specifically tailored to ${task.keyword} in the ${task.industry || 'General'} industry for ${task.useCaseType} purposes.`

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gemini-2.5-flash',
        stream: false,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }

    const data = await response.json()
    console.log('Chat API 响应:', { 
      success: data.success, 
      hasData: !!data.data,
      hasChoices: !!data.data?.choices,
      choicesLength: data.data?.choices?.length,
      error: data.error 
    })
    
    if (data.success && data.data) {
      const content = data.data.choices?.[0]?.message?.content || ''
      if (!content) {
        console.error('生成的内容为空，完整响应:', JSON.stringify(data, null, 2))
        throw new Error('生成的内容为空，请重试')
      }
      console.log('成功生成内容，长度:', content.length)
      return content
    }

    console.error('Chat API 返回错误:', data)
    throw new Error(data.error || data.details || '生成失败，请检查 API 配置')
  }

  // 提取 H1
  const extractH1 = (content: string, fallback: string): string => {
    const h1Match = content.match(/^#\s+(.+)$/m) || content.match(/<h1[^>]*>(.+?)<\/h1>/i)
    if (h1Match) {
      return h1Match[1].trim().replace(/<[^>]+>/g, '')
    }
    const h2Match = content.match(/^##\s+(.+)$/m)
    if (h2Match) {
      return h2Match[1].trim().replace(/<[^>]+>/g, '')
    }
    return fallback
  }

  // 提取描述
  const extractDescription = (content: string, maxLength: number = 200): string => {
    const text = content
      .replace(/^#+\s+.+$/gm, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\n+/g, ' ')
      .trim()
    const firstParagraph = text.split(/\n\n/)[0] || text
    if (firstParagraph.length <= maxLength) {
      return firstParagraph
    }
    return firstParagraph.substring(0, maxLength) + '...'
  }

  // 保存到数据库
  const saveToDatabase = async (task: BatchTask, content: string): Promise<{ id: string; slug: string; title: string }> => {
    const h1 = extractH1(content, task.keyword)
    const title = task.keyword
    const description = extractDescription(content)
    const slug = generateSlugFromText(task.keyword)

    if (!h1 || h1.trim() === '') {
      throw new Error('无法提取 H1 标题')
    }

    const response = await fetch('/api/admin/use-cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug,
        title,
        h1,
        description,
        content,
        use_case_type: task.useCaseType,
        industry: task.industry || null, // 同步行业信息
        is_published: true,
        seo_keywords: [task.keyword],
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('保存失败，响应状态:', response.status, '错误数据:', errorData)
      const errorMsg = errorData.error || errorData.details || `保存失败: HTTP ${response.status}`
      throw new Error(errorMsg)
    }

    const data = await response.json()
    console.log('保存响应:', { hasUseCase: !!data.useCase, hasId: !!data.useCase?.id })
    
    if (!data.useCase?.id) {
      console.error('保存成功但未返回 ID，完整响应:', JSON.stringify(data, null, 2))
      throw new Error('保存成功但未返回 ID，请检查 API 响应')
    }

    // 使用 API 返回的最终 slug（可能已经添加了后缀以确保唯一性）
    const finalSlug = data.useCase.slug || slug
    return { id: data.useCase.id, slug: finalSlug, title: data.useCase.title || title }
  }

  // 批量生成
  const handleBatchGenerate = async () => {
    console.log('开始批量生成，已选择关键词:', selectedKeywords.length)
    
    if (selectedKeywords.length === 0) {
      onShowBanner('error', '请至少选择一个热搜关键词。如果看不到关键词，请刷新页面或检查网络连接。')
      return
    }
    
    if (trendingKeywords.length === 0) {
      onShowBanner('error', '热搜词列表为空，请刷新页面重试')
      return
    }

    const newTasks: BatchTask[] = selectedKeywords.slice(0, count).map((keyword, index) => ({
      id: `task-${Date.now()}-${index}`,
      keyword,
      useCaseType: selectedUseCaseType,
      industry: selectedIndustry,
      status: 'pending' as const,
    }))

    setTasks(newTasks)
    setIsProcessing(true)
    setShouldStop(false)

    for (let i = 0; i < newTasks.length; i++) {
      if (shouldStop) {
        setTasks((prev) => {
          const updated = [...prev]
          for (let j = i; j < updated.length; j++) {
            if (updated[j].status === 'pending') {
              updated[j] = { ...updated[j], status: 'failed', error: '已取消' }
            }
          }
          return updated
        })
        break
      }

      const task = newTasks[i]
      setProcessingIndex(i)

      setTasks((prev) => {
        const updated = [...prev]
        updated[i] = { ...updated[i], status: 'processing' }
        return updated
      })

      try {
        const result = await processTask(task)
        setTasks((prev) => {
          const updated = [...prev]
          updated[i] = { ...updated[i], status: 'completed', result }
          return updated
        })

        // 自动保存
        try {
          const saveResult = await saveToDatabase(task, result)
          setTasks((prev) => {
            const updated = [...prev]
            updated[i] = {
              ...updated[i],
              status: 'saved',
              savedId: saveResult.id,
              savedSlug: saveResult.slug,
              savedTitle: saveResult.title,
            }
            return updated
          })
        } catch (saveError) {
          const errorMessage = saveError instanceof Error ? saveError.message : '未知错误'
          console.error(`[任务 ${i + 1}] 保存失败:`, {
            task: task.keyword,
            error: errorMessage,
            errorStack: saveError instanceof Error ? saveError.stack : undefined,
          })
          setTasks((prev) => {
            const updated = [...prev]
            updated[i] = { ...updated[i], error: `保存失败: ${errorMessage}`, status: 'failed' }
            return updated
          })
        }

        // 对于大规模生成（>50条），减少延迟以提高效率
        // 小规模生成保持 1 秒延迟，大规模生成减少到 500ms
        if (i < newTasks.length - 1) {
          const delay = newTasks.length > 50 ? 500 : 1000
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '未知错误'
        console.error(`[任务 ${i + 1}] 生成失败:`, {
          task: task.keyword,
          error: errorMessage,
          errorStack: error instanceof Error ? error.stack : undefined,
        })
        setTasks((prev) => {
          const updated = [...prev]
          updated[i] = { ...updated[i], status: 'failed', error: errorMessage }
          return updated
        })
      }
    }

    setIsProcessing(false)
    setProcessingIndex(-1)
    setShouldStop(false)

    const savedCount = newTasks.filter((t) => t.status === 'saved').length
    if (shouldStop) {
      onShowBanner('success', `批量生成已终止：已完成 ${savedCount}/${newTasks.length} 个任务`)
    } else {
      onShowBanner('success', `批量生成完成：${savedCount}/${newTasks.length} 已保存`)
    }
    
    // 无论是否终止，只要有保存成功的任务，就刷新列表
    if (savedCount > 0) {
      console.log(`批量生成完成，刷新列表（已保存 ${savedCount} 个）`)
      onGenerated() // 刷新列表
    }
  }

  const handleStop = () => {
    setShouldStop(true)
    onShowBanner('success', '正在停止批量生成，请稍候...')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>批量生成使用场景（基于热搜词）</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 配置选项 */}
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              使用场景类型（类目）<span className="text-xs text-gray-500 ml-1">- AI 视频生成核心场景</span>
            </label>
            <select
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
              value={selectedUseCaseType}
              onChange={(e) => setSelectedUseCaseType(e.target.value)}
              disabled={isProcessing}
              title={USE_CASE_TYPES.find((t) => t.value === selectedUseCaseType)?.note}
            >
              {USE_CASE_TYPES.map((type) => (
                <option key={type.value} value={type.value} title={type.note}>
                  {type.label} - {type.note}
                </option>
              ))}
            </select>
            {USE_CASE_TYPES.find((t) => t.value === selectedUseCaseType)?.note && (
              <p className="mt-1 text-xs text-gray-500">
                {USE_CASE_TYPES.find((t) => t.value === selectedUseCaseType)?.note}
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              行业（可选）<span className="text-xs text-gray-500 ml-1">- 适用于 AI 视频生成</span>
            </label>
            <select
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              disabled={isProcessing}
              title={INDUSTRIES.find((i) => i.value === selectedIndustry)?.note}
            >
              {INDUSTRIES.map((industry) => (
                <option key={industry.value} value={industry.value} title={industry.note}>
                  {industry.label} {industry.note ? `- ${industry.note}` : ''}
                </option>
              ))}
            </select>
            {INDUSTRIES.find((i) => i.value === selectedIndustry)?.note && (
              <p className="mt-1 text-xs text-gray-500">
                {INDUSTRIES.find((i) => i.value === selectedIndustry)?.note}
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              生成数量
            </label>
            <div className="space-y-2">
              <Input
                type="number"
                min="1"
                max="1000"
                value={count}
                onChange={(e) => setCount(Math.min(1000, Math.max(1, parseInt(e.target.value) || 10)))}
                disabled={isProcessing}
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setCount(10)}
                  disabled={isProcessing}
                  className="rounded border border-gray-300 bg-white px-2 py-1 text-xs hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
                >
                  10条
                </button>
                <button
                  type="button"
                  onClick={() => setCount(50)}
                  disabled={isProcessing}
                  className="rounded border border-gray-300 bg-white px-2 py-1 text-xs hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
                >
                  50条
                </button>
                <button
                  type="button"
                  onClick={() => setCount(100)}
                  disabled={isProcessing}
                  className="rounded border border-gray-300 bg-white px-2 py-1 text-xs hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
                >
                  100条
                </button>
                <button
                  type="button"
                  onClick={() => setCount(500)}
                  disabled={isProcessing}
                  className="rounded border border-gray-300 bg-white px-2 py-1 text-xs hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
                >
                  500条
                </button>
              </div>
              {/* 成本估算 */}
              <div className="rounded-lg bg-green-50 p-2 text-xs dark:bg-green-900/20">
                <div className="font-medium text-green-800 dark:text-green-200">
                  💰 成本估算
                </div>
                <div className="mt-1 text-green-700 dark:text-green-300">
                  <div>生成 {count} 条 ≈ {Math.ceil(count / 10) * 26} 积分</div>
                  <div>≈ ¥{((Math.ceil(count / 10) * 26 * 0.00008).toFixed(4))} 元</div>
                  <div className="mt-1 text-green-600 dark:text-green-400">
                    (每 10 条成本约 ¥0.002，可放心大规模生成)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 热搜词选择 */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            选择热搜关键词（已过滤 AI 视频相关）
          </label>
          <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 p-3 dark:border-gray-700">
            {trendingKeywords.length === 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-500">正在加载热搜词...</p>
                <button
                  type="button"
                  onClick={async () => {
                    console.log('手动刷新热搜词')
                    try {
                      const response = await fetch('/api/trends?geo=US')
                      const data = await response.json()
                      if (data.success && Array.isArray(data.trends)) {
                        const aiVideoKeywords = data.trends.filter((trend: TrendingKeyword) => {
                          const title = trend.title.toLowerCase()
                          return (
                            title.includes('ai') ||
                            title.includes('video') ||
                            title.includes('generator') ||
                            title.includes('sora') ||
                            title.includes('text to video') ||
                            title.includes('video ai')
                          )
                        })
                        setTrendingKeywords(aiVideoKeywords.length > 0 ? aiVideoKeywords : data.trends.slice(0, 20))
                        onShowBanner('success', `成功加载 ${aiVideoKeywords.length > 0 ? aiVideoKeywords.length : data.trends.length} 个热搜词`)
                      }
                    } catch (error) {
                      console.error('刷新热搜词失败:', error)
                      onShowBanner('error', '刷新热搜词失败，请检查网络连接')
                    }
                  }}
                  className="text-xs text-energy-water hover:underline"
                >
                  🔄 点击刷新热搜词
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {trendingKeywords.map((trend) => (
                  <button
                    key={trend.title}
                    type="button"
                    onClick={() => {
                      setSelectedKeywords((prev) =>
                        prev.includes(trend.title)
                          ? prev.filter((k) => k !== trend.title)
                          : [...prev, trend.title]
                      )
                    }}
                    disabled={isProcessing}
                    className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                      selectedKeywords.includes(trend.title)
                        ? 'border-energy-water bg-energy-water text-white'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200'
                    }`}
                  >
                    {trend.title}
                    {trend.formattedTraffic && (
                      <span className="ml-1 text-xs opacity-75">({trend.formattedTraffic})</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              已选择 {selectedKeywords.length} 个关键词（将生成前 {Math.min(count, selectedKeywords.length)} 个）
            </p>
            {trendingKeywords.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  // 全选前 N 个关键词
                  const keywordsToSelect = trendingKeywords.slice(0, count).map((k) => k.title)
                  setSelectedKeywords(keywordsToSelect)
                  onShowBanner('success', `已自动选择前 ${keywordsToSelect.length} 个关键词`)
                }}
                className="text-xs text-energy-water hover:underline"
              >
                ✨ 快速选择前 {count} 个
              </button>
            )}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2">
          {!isProcessing ? (
            <Button
              onClick={handleBatchGenerate}
              disabled={selectedKeywords.length === 0}
              className="flex-1"
              title="开始批量生成 AI 视频使用场景内容"
            >
              🚀 开始批量生成
            </Button>
          ) : (
            <Button 
              onClick={handleStop} 
              variant="danger" 
              className="flex-1"
              title="点击可随时终止批量生成，已完成的任务会继续保存"
            >
              ⏹️ 暂停/终止生成
            </Button>
          )}
        </div>
        {isProcessing && (
          <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200">
            <p className="font-medium">⚠️ 批量生成进行中</p>
            <p className="mt-1 text-xs">
              正在生成 AI 视频使用场景内容，您可以随时点击&ldquo;暂停/终止生成&rdquo;按钮停止。已完成的任务会自动保存到数据库。
            </p>
          </div>
        )}

        {/* 任务列表 */}
        {tasks.length > 0 && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              生成进度 ({tasks.filter((t) => t.status === 'saved' || t.status === 'completed').length}/{tasks.length})
              {isProcessing && processingIndex >= 0 && (
                <span className="ml-2 text-blue-600 dark:text-blue-400">
                  (正在处理: {processingIndex + 1}/{tasks.length})
                </span>
              )}
            </div>
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`rounded-lg border p-2 text-xs ${
                  task.status === 'saved'
                    ? 'border-green-300 bg-green-100 dark:border-green-700 dark:bg-green-900/30'
                    : task.status === 'completed'
                    ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                    : task.status === 'failed'
                    ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                    : task.status === 'processing'
                    ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
                    : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{task.keyword}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      task.status === 'saved'
                        ? 'bg-green-200 text-green-900 dark:bg-green-800 dark:text-green-100'
                        : task.status === 'completed'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : task.status === 'failed'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : task.status === 'processing'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    }`}
                  >
                    {task.status === 'saved'
                      ? '✓ 已保存'
                      : task.status === 'completed'
                      ? '✓ 完成'
                      : task.status === 'failed'
                      ? '✗ 失败'
                      : task.status === 'processing'
                      ? '⏳ 处理中'
                      : '⏸ 等待'}
                  </span>
                </div>
                {task.error && (
                  <div className="mt-1 text-xs text-red-600 dark:text-red-400">{task.error}</div>
                )}
                {task.status === 'saved' && task.savedId && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <a
                      href={`/use-cases/${task.savedSlug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded bg-energy-water px-2 py-1 text-xs text-white hover:bg-energy-water/90"
                    >
                      👁️ 查看页面
                    </a>
                    <button
                      onClick={() => {
                        // 跳转到管理页面并自动定位到该记录
                        window.location.href = `/admin?tab=use-cases&edit=${task.savedId}`
                      }}
                      className="rounded bg-blue-500 px-2 py-1 text-xs text-white hover:bg-blue-600"
                    >
                      ✏️ 编辑
                    </button>
                    <a
                      href={`/admin?tab=use-cases`}
                      className="rounded bg-gray-500 px-2 py-1 text-xs text-white hover:bg-gray-600"
                    >
                      📋 管理列表
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

