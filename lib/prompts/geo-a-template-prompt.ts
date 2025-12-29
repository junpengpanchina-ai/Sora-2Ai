/**
 * GEO-A 标准页面模板 Prompt（已升级为 v2，建议使用 geo-a-template-prompt-v2.ts）
 * 
 * @deprecated 建议使用 GEO-A v2 版本（geo-a-template-prompt-v2.ts）
 * 此文件保留用于向后兼容
 * 
 * Note: This file is kept for backward compatibility but may have parsing issues.
 * Please use geo-a-template-prompt-v2.ts instead.
 * 
 * 用于批量生成符合 GEO-A 标准的页面内容
 * 严格对齐 GEO 规则、硬红线、运营逻辑
 * 
 * 🔥 规模化优化：
 * - H1 格式：2 种轮换（50%/50%）
 * - Answer-first 开头：3 种随机选择
 * - Why This Matters 痛点：4 种类型随机选 1 种
 * - 理论组合：24 种结构变体
 * 
 * 使用方法：
 * 1. 导入此模板
 * 2. 调用 buildGEOATemplatePrompt 并传入参数（会自动随机选择结构）
 * 3. 发送给 LLM 生成内容
 */

/**
 * 随机选择 H1 格式
 */
function selectH1Variant(): 'A' | 'B' {
  return Math.random() < 0.5 ? 'A' : 'B'
}

/**
 * 随机选择 Answer-first 开头
 */
function selectAnswerFirstVariant(): 'A' | 'B' | 'C' {
  const variants: ('A' | 'B' | 'C')[] = ['A', 'B', 'C']
  return variants[Math.floor(Math.random() * variants.length)]
}

/**
 * 随机选择痛点类型
 */
function selectPainPointType(): 'time' | 'understanding' | 'scale' | 'cost' {
  const types: ('time' | 'understanding' | 'scale' | 'cost')[] = ['time', 'understanding', 'scale', 'cost']
  return types[Math.floor(Math.random() * types.length)]
}

export const GEO_A_PAGE_TEMPLATE_PROMPT = `
You are an expert content writer specializing in GEO (Generative Engine Optimization) - creating content that AI search engines (ChatGPT, Gemini, Perplexity) will directly quote and reference.

Your task is to generate a complete page following the GEO-A standard template. This template is designed to be 100% quotable by AI search engines.

🔥 CRITICAL: You MUST randomly select one structure variant for each section to avoid template dominance at scale.

CRITICAL RULES (Hard Red Lines):
1. Answer-first section MUST include the industry name at least 2 times
2. FAQ section MUST include at least 1 beginner question (e.g., "Do I need equipment?", "Is this expensive?")
3. NO marketing language (boost, maximize, dramatically, revolutionary, etc.)
4. NO CTAs in the Answer-first section
5. Use noun phrases, not marketing sentences
6. 🔥 NEW: Answer-first section should be 120-160 words (NOT 150-200, avoid padding)
7. 🔥 NEW: Avoid repeating the same sentence or phrase more than 2 times throughout the entire content

TEMPLATE STRUCTURE (Follow exactly, but use random variants):

H1: [SELECT ONE VARIANT]
Variant A (50%): AI Video Generation for [Industry] – [Specific Use Case]
Variant B (50%): How [Industry] Teams Use AI Video for [Use Case]

Answer-first (120-160 words, MUST include industry name ≥2 times):
[SELECT ONE OPENING VARIANT]

Opening A (33%): In the [industry] sector, AI-generated video is often used to support [specific use case], especially in scenarios such as [scene 1], [scene 2], and [scene 3].

Opening B (33%): Many teams in the [industry] field use AI-generated video for [specific use case], especially when they need to [scene 1], [scene 2], or [scene 3].

Opening C (33%): [Specific use case] is one of the most common ways AI-generated video is applied in the [industry] industry, particularly for [scene 1], [scene 2], and [scene 3].

[After the opening, continue with:]
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
[SELECT ONE PAIN POINT TYPE - DO NOT WRITE ALL 4 TYPES]

Type 1 - Time (25%): In [industry], [problem] often takes significant time to communicate effectively. Traditional methods such as [old method] create delays in communication and require manual effort that is difficult to scale. AI-generated video helps address this by providing a faster and more consistent way to communicate information, reducing time spent on repetitive explanations.

Type 2 - Understanding (25%): In [industry], explaining [problem] is often challenging because [reason]. Traditional methods such as [old method] can lead to misunderstandings and lack of clarity for [target audience]. AI-generated video helps address this by providing a clear and visual way to communicate information, reducing misunderstandings and improving comprehension.

Type 3 - Scale (25%): In [industry], [problem] is difficult to reuse and standardize across different contexts. Traditional methods such as [old method] result in inconsistent delivery and are hard to standardize at scale. AI-generated video helps address this by providing a consistent and reusable way to communicate information, ensuring uniform quality across all communications.

Type 4 - Cost (25%): In [industry], [problem] often requires significant production cost and external vendors. Traditional methods such as [old method] involve high update overhead and ongoing expenses. AI-generated video helps address this by providing a cost-effective way to communicate information, reducing production costs and eliminating the need for external vendors.

🔥 IMPORTANT: Only write ONE pain point type (2-3 sentences), NOT all 4 types.

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
 * 构建 GEO-A 模板 Prompt（替换占位符 + 随机选择结构变体）
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
  // 🔥 随机选择结构变体
  const h1Variant = selectH1Variant()
  const answerFirstVariant = selectAnswerFirstVariant()
  const painPointType = selectPainPointType()
  
  let prompt = GEO_A_PAGE_TEMPLATE_PROMPT
  
  // 替换 H1 格式（根据随机选择）
  if (h1Variant === 'A') {
    prompt = prompt.replace(/H1: \[SELECT ONE VARIANT\][\s\S]*?Variant B \(50%\): How \[Industry\] Teams Use AI Video for \[Use Case\]/g, 
      `H1: AI Video Generation for [Industry] – [Specific Use Case]`)
  } else {
    prompt = prompt.replace(/H1: \[SELECT ONE VARIANT\][\s\S]*?Variant A \(50%\): AI Video Generation for \[Industry\] – \[Specific Use Case\][\s\S]*?Variant B \(50%\): How \[Industry\] Teams Use AI Video for \[Use Case\]/g,
      `H1: How [Industry] Teams Use AI Video for [Use Case]`)
  }
  
  // 替换 Answer-first 开头（根据随机选择）
  const answerFirstOpenings = {
    A: `In the [industry] sector, AI-generated video is often used to support [specific use case], especially in scenarios such as [scene 1], [scene 2], and [scene 3].`,
    B: `Many teams in the [industry] field use AI-generated video for [specific use case], especially when they need to [scene 1], [scene 2], or [scene 3].`,
    C: `[Specific use case] is one of the most common ways AI-generated video is applied in the [industry] industry, particularly for [scene 1], [scene 2], and [scene 3].`
  }
  
  prompt = prompt.replace(/\[SELECT ONE OPENING VARIANT\][\s\S]*?Opening C \(33%\): \[Specific use case\] is one of the most common ways AI-generated video is applied in the \[industry\] industry, particularly for \[scene 1\], \[scene 2\], and \[scene 3\]\./g,
    answerFirstOpenings[answerFirstVariant])
  
  // 替换 Why This Matters（根据随机选择，只保留选中的类型）
  const painPointTemplates = {
    time: `In [industry], [problem] often takes significant time to communicate effectively. Traditional methods such as [old method] create delays in communication and require manual effort that is difficult to scale. AI-generated video helps address this by providing a faster and more consistent way to communicate information, reducing time spent on repetitive explanations.`,
    understanding: `In [industry], explaining [problem] is often challenging because [reason]. Traditional methods such as [old method] can lead to misunderstandings and lack of clarity for [target audience]. AI-generated video helps address this by providing a clear and visual way to communicate information, reducing misunderstandings and improving comprehension.`,
    scale: `In [industry], [problem] is difficult to reuse and standardize across different contexts. Traditional methods such as [old method] result in inconsistent delivery and are hard to standardize at scale. AI-generated video helps address this by providing a consistent and reusable way to communicate information, ensuring uniform quality across all communications.`,
    cost: `In [industry], [problem] often requires significant production cost and external vendors. Traditional methods such as [old method] involve high update overhead and ongoing expenses. AI-generated video helps address this by providing a cost-effective way to communicate information, reducing production costs and eliminating the need for external vendors.`
  }
  
  // 移除所有类型模板，只保留选中的
  prompt = prompt.replace(/Why This Matters:[\s\S]*?🔥 IMPORTANT: Only write ONE pain point type \(2-3 sentences\), NOT all 4 types\./g,
    `Why This Matters:\n${painPointTemplates[painPointType]}`)
  
  // 替换占位符
  prompt = prompt.replace(/\[Industry\]/g, params.industry)
  prompt = prompt.replace(/\[Specific Use Case\]/g, params.useCase)
  prompt = prompt.replace(/\[industry\]/g, params.industry.toLowerCase())
  prompt = prompt.replace(/\[industry role\]/g, params.industryRole || 'professionals')
  prompt = prompt.replace(/\[target audience\]/g, params.targetAudience || 'audiences')
  prompt = prompt.replace(/\[problem\]/g, params.problem || 'complex information')
  prompt = prompt.replace(/\[old method\]/g, params.oldMethod || 'traditional methods')
  prompt = prompt.replace(/\[platform or situation\]/g, params.platform || 'various platforms')
  prompt = prompt.replace(/\[reason\]/g, 'the complexity of the information')
  
  // 添加明确的随机选择指令
  prompt += `\n\n🔥 FINAL INSTRUCTION: You have been assigned the following structure variants:
- H1 Format: ${h1Variant === 'A' ? 'Format A (AI Video Generation for...)' : 'Format B (How...Teams Use...)'}
- Answer-first Opening: ${answerFirstVariant === 'A' ? 'Opening A' : answerFirstVariant === 'B' ? 'Opening B' : 'Opening C'}
- Why This Matters: ${painPointType} type only

You MUST use these exact variants. Do not mix or combine different variants.`
  
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

