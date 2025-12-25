/**
 * SEO 场景专用的智能模型选择器
 * 针对 SEO 内容生成任务优化
 */

/**
 * 检测 SEO 任务类型
 */
export function detectSEOTaskType(content: string): {
  taskType: 'use-case' | 'keyword' | 'blog' | 'compare' | 'industry' | 'general'
  needsAdvancedModel: boolean
  needsProModel: boolean
  keywords: string[]
} {
  const contentLower = content.toLowerCase()
  
  const foundKeywords: string[] = []
  let taskType: 'use-case' | 'keyword' | 'blog' | 'compare' | 'industry' | 'general' = 'general'
  let needsAdvancedModel = false
  let needsProModel = false
  
  // 检测使用场景相关
  const useCaseKeywords = [
    '使用场景', 'use case', '场景', '应用场景', '用途', 'use case page',
    '场景页面', 'use case generation', '生成使用场景'
  ]
  if (useCaseKeywords.some(kw => contentLower.includes(kw))) {
    taskType = 'use-case'
    foundKeywords.push(...useCaseKeywords.filter(kw => contentLower.includes(kw)))
  }
  
  // 检测关键词相关
  const keywordKeywords = [
    '关键词', 'keyword', '长尾词', 'long tail', 'seo keyword', '关键词页面',
    'keyword page', '长尾关键词', '关键词生成'
  ]
  if (keywordKeywords.some(kw => contentLower.includes(kw))) {
    taskType = 'keyword'
    foundKeywords.push(...keywordKeywords.filter(kw => contentLower.includes(kw)))
  }
  
  // 检测博客文章相关
  const blogKeywords = [
    '博客', 'blog', '文章', 'article', '博客文章', 'blog post', 'pillar page',
    'cluster', '博客生成', 'article generation'
  ]
  if (blogKeywords.some(kw => contentLower.includes(kw))) {
    taskType = 'blog'
    foundKeywords.push(...blogKeywords.filter(kw => contentLower.includes(kw)))
  }
  
  // 检测对比页面相关
  const compareKeywords = [
    '对比', 'compare', 'vs', 'versus', '比较', 'comparison', '对比页面',
    'compare page', '工具对比', 'tool comparison'
  ]
  if (compareKeywords.some(kw => contentLower.includes(kw))) {
    taskType = 'compare'
    foundKeywords.push(...compareKeywords.filter(kw => contentLower.includes(kw)))
  }
  
  // 检测行业页面相关
  const industryKeywords = [
    '行业', 'industry', '行业页面', 'industry page', '行业分析', 'industry analysis'
  ]
  if (industryKeywords.some(kw => contentLower.includes(kw))) {
    taskType = 'industry'
    foundKeywords.push(...industryKeywords.filter(kw => contentLower.includes(kw)))
  }
  
  // 检测是否需要高级模型（复杂 SEO 任务）
  const complexSEOKeywords = [
    'pillar page', 'cluster content', '内容策略', 'content strategy',
    'seo 策略', 'seo strategy', '内容规划', 'content planning',
    '关键词研究', 'keyword research', '竞争分析', 'competitor analysis'
  ]
  
  const hasComplexSEO = complexSEOKeywords.some(kw => contentLower.includes(kw))
  if (hasComplexSEO) {
    needsAdvancedModel = true
    foundKeywords.push(...complexSEOKeywords.filter(kw => contentLower.includes(kw)))
    
    // 如果内容很长或包含多个复杂关键词，可能需要 Pro 模型
    if (content.length > 1500 || foundKeywords.length >= 3) {
      needsProModel = true
    }
  }
  
  return {
    taskType,
    needsAdvancedModel,
    needsProModel,
    keywords: foundKeywords,
  }
}

/**
 * 为 SEO 场景选择最适合的模型
 * @param content 消息文本内容
 * @param images 图片数组（如果有）
 * @returns 推荐的模型名称
 */
export function selectSEOModel(
  content: string,
  images: string[] = []
): 'gemini-2-flash' | 'gemini-3-flash' | 'gemini-3-pro' {
  // 如果有图片，优先使用支持多模态的模型
  if (images.length > 0) {
    const analysis = detectSEOTaskType(content)
    if (analysis.needsProModel) {
      return 'gemini-3-pro'
    }
    if (analysis.needsAdvancedModel) {
      return 'gemini-3-flash'
    }
    // 默认使用 gemini-3-flash 处理图片
    return 'gemini-3-flash'
  }
  
  // 纯文本消息，检测 SEO 任务类型
  const analysis = detectSEOTaskType(content)
  
  // 复杂 SEO 任务使用高级模型
  if (analysis.needsProModel) {
    return 'gemini-3-pro'
  }
  
  if (analysis.needsAdvancedModel) {
    return 'gemini-3-flash'
  }
  
  // 一般 SEO 内容生成使用 gemini-2-flash（成本最低，适合批量生成）
  return 'gemini-2-flash'
}

/**
 * 获取 SEO 模型说明
 */
export function getSEOModelDescription(model: string, taskType?: string): string {
  const taskTypeDesc = taskType ? ` (${taskType})` : ''
  
  switch (model) {
    case 'gemini-2-flash':
      return `快速响应，成本最低，适合批量 SEO 内容生成${taskTypeDesc}`
    case 'gemini-3-flash':
      return `支持联网搜索，适合复杂 SEO 策略和内容规划${taskTypeDesc}`
    case 'gemini-3-pro':
      return `最高质量，适合 Pillar Page、内容策略等复杂 SEO 任务${taskTypeDesc}`
    default:
      return '未知模型'
  }
}

/**
 * 生成 SEO 专用的系统提示词
 */
export function getSEOSystemPrompt(taskType?: string): string {
  const basePrompt = `You are a professional SEO content writer and strategist specializing in AI video generation platforms (Sora2). Your expertise includes:

- SEO content generation (use cases, keywords, blog posts, comparison pages)
- Content strategy and planning
- Keyword research and optimization
- On-page SEO optimization
- Content structure and formatting for search engines

All content must be:
- High-quality and indexable
- Natural, human-like tone (no keyword stuffing)
- Properly structured with H1/H2/H3 headings
- Written in English
- Focused on Sora2 platform capabilities

When generating content, always:
- Start with an H1 heading
- Use clear, logical structure
- Include specific examples and use cases
- Emphasize Sora2's actual features and benefits
- Follow SEO best practices (proper heading hierarchy, natural keyword usage, etc.)

IMPORTANT: When mentioning video duration, ALWAYS use "10 seconds" or "15 seconds". NEVER mention "2 minutes", "1 minute", or any duration longer than 15 seconds.`

  if (taskType) {
    const taskTypePrompts: Record<string, string> = {
      'use-case': `\n\nCurrent Task: Generate a use case page for Sora2.
Focus on:
- Specific use cases and scenarios
- How Sora2 solves real problems
- Step-by-step guides
- Real-world examples
- Target audience and industries`,
      
      'keyword': `\n\nCurrent Task: Generate a long-tail keyword page for Sora2.
Focus on:
- Keyword-focused content
- Search intent satisfaction
- Step-by-step instructions
- FAQ sections
- Clear, actionable content`,
      
      'blog': `\n\nCurrent Task: Generate a blog article for Sora2.
Focus on:
- In-depth, comprehensive content (1500-2500 words)
- Pillar page or cluster content structure
- Problem-solving approach
- Real examples and case studies
- Clear takeaways for readers`,
      
      'compare': `\n\nCurrent Task: Generate a comparison page (Sora2 vs other tools).
Focus on:
- Objective, fair comparison
- Feature-by-feature analysis
- Use case recommendations
- Clear advantages and disadvantages
- Data-supported conclusions`,
      
      'industry': `\n\nCurrent Task: Generate an industry-specific page for Sora2.
Focus on:
- Industry-specific problems and solutions
- How Sora2 applies to this industry
- Industry use cases and examples
- Target audience within the industry
- Industry trends and future applications`,
    }
    
    return basePrompt + (taskTypePrompts[taskType] || '')
  }
  
  return basePrompt
}

