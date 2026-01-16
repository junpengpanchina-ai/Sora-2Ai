/**
 * GEO-A v2 稳定索引版 Prompt
 * 
 * 设计原则：
 * - 结构稳定，但句式随机
 * - 意图一致，但页面"目的感"不同
 * - 让 Google 觉得是"很多作者写的"，不是一个程序吐的
 * 
 * 核心改进：
 * - 随机池机制（H1 × 2, Answer-first × 3, Why This Matters × 4）
 * - 优化字数要求（120-160 词，避免"注水"）
 * - 明确 AI 引用优先级（Answer-first > How to Use > FAQ）
 * 
 * 🔒 隐性规则（必须严格执行）：
 * 1. 绝不为"热词"破坏结构 - Answer-first 结构不可改，不允许加营销句
 * 2. 不做"单页奇观" - 关注整库信任度，不是单页流量
 * 3. 允许"慢爬"，不允许"结构回滚" - 收录慢可以等，但不允许删 FAQ-B、缩短 Answer-first
 */

/**
 * 随机选择 H1 格式（3 种变体，避免 "for X in Y" 全站统一模式）
 */
function selectH1Variant(): 'A' | 'B' | 'C' {
  const variants: ('A' | 'B' | 'C')[] = ['A', 'B', 'C']
  return variants[Math.floor(Math.random() * variants.length)]
}

/**
 * 随机选择 Answer-first 开头
 */
function selectAnswerFirstVariant(): 'A' | 'B' | 'C' {
  const variants: ('A' | 'B' | 'C')[] = ['A', 'B', 'C']
  return variants[Math.floor(Math.random() * variants.length)]
}

/**
 * 随机选择痛点类型（加权概率：Understanding 40%, Scale 30%, Time 20%, Cost 10%）
 * AI 更爱「解释难、理解难」，Google 不关心"省钱"
 */
function selectPainPointType(): 'time' | 'understanding' | 'scale' | 'cost' {
  const rand = Math.random()
  if (rand < 0.4) return 'understanding'  // 40%
  if (rand < 0.7) return 'scale'          // 30%
  if (rand < 0.9) return 'time'            // 20%
  return 'cost'                             // 10%
}

export const GEO_A_V2_PROMPT = `
Assume this page is written by a different industry specialist each time, with a slightly different explanatory focus and writing intent.

You are an expert content writer specializing in GEO (Generative Engine Optimization).

Your task is to generate a use case page for an AI video generation platform called Sora2.

────────────────────────
STRUCTURE RULES (STRICT)
────────────────────────
- Follow the structure exactly
- Do not skip any section
- Do not add marketing language
- Avoid repetition of any sentence or phrase more than 2 times

────────────────────────
H1 (Randomized - 3 variants to avoid "for X in Y" pattern)
────────────────────────
Randomly choose ONE of the following formats:
1. AI Video Generation for [Industry] – [Use Case]
2. AI Video Use Cases in [Industry]: [Use Case]
3. How [Industry] Teams Apply AI Video to [Use Case]

────────────────────────
H2: Introduction (Answer-first, 120–160 words)
────────────────────────
Randomly choose ONE opening sentence pattern:

OPENING_A:
In the [industry] sector, AI-generated video is often used for [use case], especially in scenarios such as [scene1], [scene2], and [scene3].

OPENING_B:
Many teams in the [industry] field rely on AI-generated video for [use case], commonly applying it to [scene1], [scene2], and [scene3].

OPENING_C:
[Use case] is one of the most common applications of AI-generated video in the [industry] industry, particularly for [scene1], [scene2], and [scene3].

Then continue by explaining:
- Who uses this in the [industry] industry
- What is typically explained or demonstrated
- Why video is preferred over static formats
- Where these videos are commonly used

Randomly choose ONE of the following phrases to introduce applications (avoid fixed "Typical applications include..." pattern):
- "Common ways teams apply this include..."
- "This approach is often used for..."
- "In practice, these videos support tasks such as..."

Rules:
- Mention the [industry] industry at least 2 times using varied wording
- No CTA
- No marketing adjectives

────────────────────────
🛡️ AUTHORITATIVENESS ANCHOR (After Answer-first, before "Why This Matters")
────────────────────────
Add this sentence immediately after the Answer-first paragraph (1-2 sentences, factual, non-promotional):

"This page is part of a structured knowledge base on AI video use cases, covering multiple industries and scenarios."

OR (variation):
"This content is part of a comprehensive knowledge base documenting AI video applications across various industries and use cases."

Purpose: Tell AI this is a systematic knowledge base, not an isolated page. This is the GEO version of E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness).

────────────────────────
H2: Common Use Cases in [Industry]
────────────────────────
List 5–8 noun phrases only (2–5 words each)

────────────────────────
H2: Why This Matters
────────────────────────
Randomly select ONE pain type:

PAIN_TIME:
In [industry], explaining [problem] often takes time, especially when teams rely on manual processes or repeated explanations.

PAIN_UNDERSTANDING:
For many [industry] professionals, communicating [problem] clearly can be difficult, leading to confusion or inconsistent understanding.

PAIN_SCALE:
As [industry] teams grow, it becomes harder to deliver consistent explanations of [problem] across different audiences or platforms.

PAIN_COST:
Traditional approaches to explaining [problem] in [industry] often involve external resources or repeated production effort.

Explain how AI-generated video helps address this specific issue.

────────────────────────
🛡️ INDUSTRY CONSTRAINTS (After "Why This Matters", before "How to Create")
────────────────────────
H2: Industry Constraints and Considerations

Add a 2-3 sentence paragraph about real limitations specific to [industry]:

Template:
"In the [industry] sector, AI-generated video may have limitations when [specific constraint 1], [specific constraint 2], or [specific constraint 3]. Teams should consider [consideration] before applying this approach to [specific scenario]."

Examples by industry:
- Healthcare: "In the healthcare sector, AI-generated video may have limitations when dealing with patient-specific medical information, regulatory compliance requirements, or situations requiring real-time clinical interaction. Teams should consider privacy regulations and accuracy requirements before applying this approach to patient-facing content."
- Manufacturing: "In manufacturing, AI-generated video may have limitations when demonstrating complex machinery operations, safety-critical procedures, or processes requiring precise technical specifications. Teams should consider the need for hands-on training and regulatory compliance before applying this approach to operational training content."
- Legal: "In legal services, AI-generated video may have limitations when explaining jurisdiction-specific regulations, case-sensitive information, or content requiring formal legal review. Teams should consider compliance requirements and accuracy standards before applying this approach to client-facing materials."

Purpose: Provide industry-specific constraints to reduce thin content and template spam risks. Each industry should have different constraint points.

────────────────────────
H2: How to Create AI Videos for [Use Case] with Sora2
────────────────────────
Use a numbered list:
1. Write a clear text prompt describing scenario, audience, and goal.
2. Select a video style and format suitable for the platform.
3. Generate and download the video.

────────────────────────
H2: Real-world Examples
────────────────────────
Provide 2 short examples using different sentence structures.

────────────────────────
H2: Benefits
────────────────────────
List 4–6 functional benefits using noun phrases only.

────────────────────────
H2: Frequently Asked Questions
────────────────────────
Include at least 3 FAQs. You MUST include at least 1 FAQ-A (beginner cognitive) AND at least 1 FAQ-B (decision boundary).

🛡️ FAQ-A (Beginner Cognitive - Newcomer Questions):
These answer questions non-experts would ask:
- "Is AI video suitable for [industry]?"
- "Do I need filming equipment?"
- "Is this expensive?"
- "Can small teams use this?"
- "Do I need technical skills?"

🛡️ FAQ-B (Decision Boundary - When NOT to Use):
These help users understand limitations and boundaries:
- "When should AI video not be used in [industry]?"
- "What are common limitations of AI-generated video for [use case]?"
- "What scenarios are not suitable for AI-generated video in [industry]?"
- "Are there industry-specific constraints I should be aware of?"

Priority questions (AI search prefers these):
- FAQ-A questions (beginner-friendly, lowers barrier to entry)
- FAQ-B questions (AI loves citing these to reduce misuse risk)

Avoid or use sparingly:
- "Which platform works best..." (comparison/evaluation questions are less preferred by AI search)

Answers:
- 2–3 sentences
- No marketing language
- FAQ-B answers should be honest about limitations

────────────────────────
H2: Using Sora2 for [Use Case] in [Industry]
────────────────────────
(Neutral informational heading, not "Get started with Sora2")

Final CTA (One sentence only):
Get started with Sora2 to create AI-generated videos for [industry] use cases.

IMPORTANT:
- All content must be in English
- Avoid repetition
- Keep tone neutral and informative
`

/**
 * 构建 GEO-A v2 模板 Prompt（替换占位符 + 随机选择结构变体）
 */
export function buildGEOAV2Prompt(params: {
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
  
  let prompt = GEO_A_V2_PROMPT
  
  // 定义 H1 格式（3 种变体，避免 "for X in Y" 全站统一模式）
  const h1Formats = {
    A: `AI Video Generation for ${params.industry} – ${params.useCase}`,
    B: `AI Video Use Cases in ${params.industry}: ${params.useCase}`,
    C: `How ${params.industry} Teams Apply AI Video to ${params.useCase}`
  }
  
  // 定义 Answer-first 开头
  const answerFirstOpenings = {
    A: `In the ${params.industry} sector, AI-generated video is often used for ${params.useCase}, especially in scenarios such as [scene1], [scene2], and [scene3].`,
    B: `Many teams in the ${params.industry} field rely on AI-generated video for ${params.useCase}, commonly applying it to [scene1], [scene2], and [scene3].`,
    C: `${params.useCase} is one of the most common applications of AI-generated video in the ${params.industry} industry, particularly for [scene1], [scene2], and [scene3].`
  }
  
  // 定义痛点模板
  const painPointTemplates = {
    time: `In ${params.industry}, explaining ${params.problem || 'complex information'} often takes time, especially when teams rely on manual processes or repeated explanations.`,
    understanding: `For many ${params.industry} professionals, communicating ${params.problem || 'complex information'} clearly can be difficult, leading to confusion or inconsistent understanding.`,
    scale: `As ${params.industry} teams grow, it becomes harder to deliver consistent explanations of ${params.problem || 'complex information'} across different audiences or platforms.`,
    cost: `Traditional approaches to explaining ${params.problem || 'complex information'} in ${params.industry} often involve external resources or repeated production effort.`
  }
  
  // 替换 H1 部分（3 种变体）
  const h1Pattern = /Randomly choose ONE of the following formats:[\s\S]*?3\. How \[Industry\] Teams Apply AI Video to \[Use Case\]/
  prompt = prompt.replace(
    h1Pattern,
    `Use this exact H1 format:\n${h1Formats[h1Variant]}`
  )
  
  // 替换 Answer-first 开头部分
  prompt = prompt.replace(
    /OPENING_A:[\s\S]*?OPENING_C:[\s\S]*?\[scene3\]\./,
    `Use this exact opening:\n${answerFirstOpenings[answerFirstVariant]}`
  )
  
  // 替换 Why This Matters 部分
  prompt = prompt.replace(
    /PAIN_TIME:[\s\S]*?PAIN_COST:[\s\S]*?production effort\./,
    `Use this pain point type:\n${painPointTemplates[painPointType]}`
  )
  
  // 替换所有占位符
  prompt = prompt.replace(/\[Industry\]/g, params.industry)
  prompt = prompt.replace(/\[industry\]/g, params.industry.toLowerCase())
  prompt = prompt.replace(/\[Use Case\]/g, params.useCase)
  prompt = prompt.replace(/\[use case\]/g, params.useCase.toLowerCase())
  prompt = prompt.replace(/\[industry role\]/g, params.industryRole || 'professionals')
  prompt = prompt.replace(/\[target audience\]/g, params.targetAudience || 'audiences')
  prompt = prompt.replace(/\[problem\]/g, params.problem || 'complex information')
  prompt = prompt.replace(/\[old method\]/g, params.oldMethod || 'traditional methods')
  prompt = prompt.replace(/\[platform or situation\]/g, params.platform || 'various platforms')
  
  // 添加应用介绍句式池（随机选择）
  const applicationPhrases = [
    'Common ways teams apply this include...',
    'This approach is often used for...',
    'In practice, these videos support tasks such as...'
  ]
  const selectedPhrase = applicationPhrases[Math.floor(Math.random() * applicationPhrases.length)]
  
  // 替换应用介绍句式
  prompt = prompt.replace(
    /Randomly choose ONE of the following phrases to introduce applications[\s\S]*?"In practice, these videos support tasks such as\.\.\."/,
    `Use this phrase to introduce applications:\n"${selectedPhrase}"`
  )
  
  // 添加明确的随机选择指令
  prompt += `\n\n🔥 FINAL INSTRUCTION: You have been assigned the following structure variants:
- H1 Format: ${h1Variant === 'A' ? 'Format A (AI Video Generation for...)' : h1Variant === 'B' ? 'Format B (AI Video Use Cases in...)' : 'Format C (How...Teams Apply...)'}
- Answer-first Opening: ${answerFirstVariant === 'A' ? 'Opening A' : answerFirstVariant === 'B' ? 'Opening B' : 'Opening C'}
- Application Introduction: "${selectedPhrase}"
- Why This Matters: ${painPointType} type only (weighted: Understanding 40%, Scale 30%, Time 20%, Cost 10%)

You MUST use these exact variants. Do not mix or combine different variants.`
  
  return prompt
}

/**
 * AI 引用优先级说明（用于内容优化参考）
 */
export const AI_CITATION_PRIORITY = {
  HIGH: [
    {
      module: 'Answer-first (第一段)',
      citationRate: '80%',
      reason: 'Gemini, Perplexity, GPT Browse 最常引用',
      optimization: '必须优化，确保信息密度和准确性'
    },
    {
      module: 'How to Use (三步列表)',
      citationRate: 'High',
      reason: 'Instruction 型引用，"How do I..." 类问题',
      optimization: '保持简洁、可执行，容易被原封不动摘走'
    },
    {
      module: 'FAQ (入门问题)',
      citationRate: 'High',
      reason: '零基础问答，AI 非常爱用',
      optimization: '至少包含 1 个入门型问题'
    }
  ],
  MEDIUM: [
    {
      module: 'Use Case 名词列表',
      citationRate: 'Medium',
      reason: '增强页面结构可信度',
      optimization: '保持简洁，使用名词短语'
    },
    {
      module: 'Benefits 列表',
      citationRate: 'Medium',
      reason: '辅助信息，不常直接引用',
      optimization: '功能性描述，避免营销语言'
    }
  ],
  LOW: [
    {
      module: 'Real-world Examples',
      citationRate: 'Low',
      reason: 'AI 几乎不引用，但降低"薄内容"风险',
      optimization: '保持存在，但不需要过度优化'
    },
    {
      module: 'Why This Matters (非开头)',
      citationRate: 'Low',
      reason: '为 Google 服务，降低薄内容风险',
      optimization: '保持存在即可'
    }
  ]
}

