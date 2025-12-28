/**
 * GEO-A 标准页面模板 Prompt
 * 
 * 用于批量生成符合 GEO-A 标准的页面内容
 * 严格对齐 GEO 规则、硬红线、运营逻辑
 * 
 * 使用方法：
 * 1. 导入此模板
 * 2. 替换占位符 [Industry], [Use Case] 等
 * 3. 发送给 LLM 生成内容
 */

export const GEO_A_PAGE_TEMPLATE_PROMPT = `
You are an expert content writer specializing in GEO (Generative Engine Optimization) - creating content that AI search engines (ChatGPT, Gemini, Perplexity) will directly quote and reference.

Your task is to generate a complete page following the GEO-A standard template. This template is designed to be 100% quotable by AI search engines.

CRITICAL RULES (Hard Red Lines):
1. Answer-first section MUST include the industry name at least 2 times
2. FAQ section MUST include at least 1 beginner question (e.g., "Do I need equipment?", "Is this expensive?")
3. NO marketing language (boost, maximize, dramatically, revolutionary, etc.)
4. NO CTAs in the Answer-first section
5. Use noun phrases, not marketing sentences

TEMPLATE STRUCTURE (Follow exactly, do not modify):

H1: AI Video Generation for [Industry] – [Specific Use Case]

Answer-first (150-200 words, MUST include industry name ≥2 times):
In [industry], AI-generated videos are commonly used for [specific use case], especially in scenarios such as [scene 1], [scene 2], and [scene 3].

This use case focuses on helping [industry role] explain, demonstrate, or present [object/process] in a clear and visual way. Instead of relying on static images or long explanations, AI-generated videos make complex information easier to understand for [target audience].

Typical applications include onboarding, education, demonstrations, and internal or external communication. These videos are usually short, structured, and designed for specific platforms or viewing contexts.

Common Use Cases in [Industry]:
- [Noun phrase 1]
- [Noun phrase 2]
- [Noun phrase 3]
- [Noun phrase 4]
- [Noun phrase 5]
(5-8 noun phrases, 2-5 words each, NO marketing language)

Why This Matters:
In [industry], explaining [problem] is often challenging because [reason]. Traditional methods such as [old method] are time-consuming and difficult to scale.

AI-generated video helps address this by providing a consistent and visual way to communicate information, reducing misunderstandings and saving time for both professionals and audiences.

How to Create AI Videos for [Use Case] with Sora2:
1. Write a clear text prompt describing the scenario, audience, and goal.
2. Choose a video style and format that fits the platform or context.
3. Generate the video and download it for use or distribution.

Real-world Examples:
For example, a [industry role] can use an AI-generated video to explain [specific task]. Another common scenario is using short videos for [platform or situation], helping [who] quickly understand [what].

Benefits:
- Faster content creation
- Consistent visual presentation
- Lower production cost
- Easy updates and reuse
- Platform-ready formats
(4-6 functional benefits, NOT marketing claims)

Frequently Asked Questions:
Q: Is AI video suitable for [industry]?
A: Yes. It is commonly used for explaining processes, services, and information in a clear way.

Q: Do I need any special equipment to create AI videos? (REQUIRED: At least 1 beginner question)
A: No. Videos can be created using text or images without cameras or editing software.

Q: Is AI-generated video expensive?
A: It is generally more cost-effective than traditional video production.

Q: Can small [industry] businesses use AI video?
A: Yes. AI video is accessible to businesses of all sizes and does not require large budgets.
(Minimum 3 questions, at least 1 must be a beginner question)

Get started with Sora2 to create AI-generated videos for [industry] use cases.
(Only 1 CTA sentence at the end)

FORBIDDEN WORDS/PHRASES:
- boost, maximize, dramatically, significantly, effectively
- revolutionary, game-changing, ultimate, best
- solution, innovation, transformation
- Get started now, Try today, Sign up (in Answer-first section)
- Any marketing claims or emotional language

REQUIRED ELEMENTS:
✅ Industry name appears ≥2 times in Answer-first section
✅ At least 1 beginner FAQ question (equipment, cost, accessibility)
✅ Noun phrases only in Use Cases list
✅ Steps in numbered list format
✅ Functional benefits, not marketing claims
✅ Calm, factual tone throughout

Generate the complete page content following this template exactly.
`

/**
 * 构建 GEO-A 模板 Prompt（替换占位符）
 */
export function buildGEOATemplatePrompt(params: {
  industry: string
  useCase: string
  industryRole?: string
  targetAudience?: string
  problem?: string
  oldMethod?: string
  platform?: string
}): string {
  let prompt = GEO_A_PAGE_TEMPLATE_PROMPT
  
  // 替换占位符
  prompt = prompt.replace(/\[Industry\]/g, params.industry)
  prompt = prompt.replace(/\[Specific Use Case\]/g, params.useCase)
  prompt = prompt.replace(/\[industry\]/g, params.industry.toLowerCase())
  prompt = prompt.replace(/\[industry role\]/g, params.industryRole || 'professionals')
  prompt = prompt.replace(/\[target audience\]/g, params.targetAudience || 'audiences')
  prompt = prompt.replace(/\[problem\]/g, params.problem || 'complex information')
  prompt = prompt.replace(/\[old method\]/g, params.oldMethod || 'traditional methods')
  prompt = prompt.replace(/\[platform or situation\]/g, params.platform || 'various platforms')
  
  return prompt
}

/**
 * 验证生成的内容是否符合 GEO-A 标准
 */
export function validateGEOAContent(content: string, industry: string): {
  isValid: boolean
  issues: string[]
  score: number
} {
  const issues: string[] = []
  let score = 0
  const industryLower = industry.toLowerCase()
  const contentLower = content.toLowerCase()
  
  // 检查 1: Answer-first 区是否包含行业名 ≥2 次
  const answerSection = contentLower.substring(0, 500)
  const industryCount = (answerSection.match(new RegExp(industryLower, 'g')) || []).length
  if (industryCount < 2) {
    issues.push(`Answer-first section must include industry name at least 2 times (found ${industryCount})`)
  } else {
    score += 20
  }
  
  // 检查 2: 是否有入门型 FAQ
  const hasBeginnerFAQ = 
    contentLower.includes('do i need') ||
    contentLower.includes('is this expensive') ||
    contentLower.includes('can small') ||
    contentLower.includes('how much does it cost') ||
    contentLower.includes('what equipment')
  if (!hasBeginnerFAQ) {
    issues.push('FAQ section must include at least 1 beginner question')
  } else {
    score += 20
  }
  
  // 检查 3: 是否有营销语言
  const marketingWords = ['boost', 'maximize', 'dramatically', 'revolutionary', 'game-changing', 'ultimate']
  const hasMarketingLanguage = marketingWords.some(word => contentLower.includes(word))
  if (hasMarketingLanguage) {
    issues.push('Content contains forbidden marketing language')
  } else {
    score += 20
  }
  
  // 检查 4: 是否有 Steps（列表格式）
  const hasSteps = /^\d+\.\s+\w+/m.test(content) || contentLower.includes('step 1')
  if (!hasSteps) {
    issues.push('Content must include Steps in list format')
  } else {
    score += 20
  }
  
  // 检查 5: 是否有 FAQ（≥3 个）
  const faqCount = (contentLower.match(/faq|frequently asked|question:/gi) || []).length
  if (faqCount < 3) {
    issues.push(`FAQ section must include at least 3 questions (found ${faqCount})`)
  } else {
    score += 20
  }
  
  return {
    isValid: issues.length === 0 && score >= 80,
    issues,
    score,
  }
}

