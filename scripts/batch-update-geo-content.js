/**
 * 批量更新 Use Case 内容为 GEO 优化版本
 * 
 * 使用方法：
 * node scripts/batch-update-geo-content.js --ids=id1,id2,id3 [--dry-run] [--batch=100]
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// 使用 Node.js 内置 fetch（Node 18+）或 node-fetch
let fetch
try {
  fetch = globalThis.fetch || require('node-fetch')
} catch (e) {
  console.error('❌ 需要 Node.js 18+ 或安装 node-fetch')
  process.exit(1)
}

// GEO 优化的 System Prompt
const GEO_SYSTEM_PROMPT = `You are a professional SEO content writer for Sora2, an AI video generation platform. Generate high-quality, product-focused use case content optimized for both SEO (Google ranking) and GEO (Generative Engine Optimization - AI search citation). Your content must be structured so that ChatGPT, Gemini, and Perplexity can directly quote it as answers. All output must be in English.

CRITICAL: The AI video platform ONLY supports 10-second or 15-second videos. NEVER mention any duration longer than 15 seconds (such as 20 seconds, 30 seconds, 45 seconds, 60 seconds, 1 minute, 2 minutes, etc.). When describing video examples, ALWAYS use "10 seconds" or "15 seconds" only.

GEO Optimization Requirements (for AI search citation):
1. Answer-First Structure (GEO-1): Start with a clear, citable definition using the format: "In [industry], AI-generated videos are commonly used for [use case]."
2. List Format (GEO-2): Use noun phrases, NOT marketing sentences (e.g., "Product demo videos", not "Boost your brand visibility")
3. FAQ Style (GEO-4): Answer questions a non-expert would ask (e.g., "Is AI video suitable for [industry]?", "Do I need [equipment]?")
4. Industry + Scene + Platform (GEO-5): Must clearly identify at least 2 of: industry, use case scenario, platform`

// 构建 GEO 优化的 User Prompt（含随机结构池）
function buildGEOPrompt(useCase) {
  // 🔥 随机选择结构变体（降低同构风险）
  // H1: 3 种变体（避免 "for X in Y" 全站统一模式）
  const h1Variant = ['A', 'B', 'C'][Math.floor(Math.random() * 3)]
  const answerFirstVariant = ['A', 'B', 'C'][Math.floor(Math.random() * 3)]
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
    A: `In the ${useCase.industry || 'General'} sector, AI-generated video is often used to support ${useCase.title}, especially in scenarios such as [scene 1], [scene 2], and [scene 3].`,
    B: `Many teams in the ${useCase.industry || 'General'} field use AI-generated video for ${useCase.title}, especially when they need to [scene 1], [scene 2], or [scene 3].`,
    C: `${useCase.title} is one of the most common ways AI-generated video is applied in the ${useCase.industry || 'General'} industry, particularly for [scene 1], [scene 2], and [scene 3].`
  }
  
  const painPointTemplates = {
    time: `Focus on TIME-related challenges: takes time, delays communication, manual effort. Write 2-3 sentences about how ${useCase.title} in ${useCase.industry || 'this industry'} often takes significant time to communicate effectively, and how AI-generated video helps address this.`,
    understanding: `Focus on UNDERSTANDING challenges: hard to explain, misunderstandings, lack of clarity. Write 2-3 sentences about how explaining ${useCase.title} in ${useCase.industry || 'this industry'} is often challenging, and how AI-generated video helps address this.`,
    scale: `Focus on SCALE challenges: difficult to reuse, inconsistent delivery, hard to standardize. Write 2-3 sentences about how ${useCase.title} in ${useCase.industry || 'this industry'} is difficult to reuse and standardize, and how AI-generated video helps address this.`,
    cost: `Focus on COST challenges: production cost, external vendors, update overhead. Write 2-3 sentences about how ${useCase.title} in ${useCase.industry || 'this industry'} often requires significant production cost, and how AI-generated video helps address this.`
  }
  
  const industryContext = useCase.industry 
    ? `This use case is specifically for the ${useCase.industry} industry. Focus on how AI video generation addresses unique challenges and opportunities in this industry.`
    : 'This is a general use case applicable across multiple industries.'
  
  const useCaseTypeContext = {
    'advertising-promotion': 'Focus on marketing and promotional content. Emphasize brand storytelling, product showcases, and advertising campaigns.',
    'social-media-content': 'Focus on social media content creation. Emphasize short-form videos, viral content, and social engagement.',
    'product-demo-showcase': 'Focus on product demonstration videos. Emphasize showcasing product features, benefits, and use cases.',
    'brand-storytelling': 'Focus on brand storytelling. Emphasize brand narrative, company vision, and emotional connections.',
    'education-explainer': 'Focus on educational content. Emphasize tutorials, courses, and knowledge sharing.',
    'ugc-creator-content': 'Focus on UGC and creator content. Emphasize user-generated content, influencer marketing, and authentic content.',
  }[useCase.use_case_type] || 'Focus on general video creation needs.'
  
  return `Assume this page is written by a different industry specialist each time, with a slightly different explanatory focus and writing intent.

Generate a use case page for Sora2 AI video generation platform with GEO optimization.

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
Use Case Keyword: ${useCase.title}
Industry: ${useCase.industry || 'General'}
Use Case Type: ${useCase.use_case_type}

${industryContext}

${useCaseTypeContext}

【Content Requirements】
- Content must be highly relevant to Sora2's actual features AND the ${useCase.industry || 'general'} industry context
- Emphasize how Sora2 solves real problems specific to ${useCase.industry || 'this'} industry
- Include specific use cases that Sora2 can handle for ${useCase.title} in ${useCase.industry || 'general'} contexts
- Use natural, engaging language that resonates with ${useCase.industry || 'general'} industry professionals
- Answer-first section: 120-160 words (NOT 150-200, avoid padding)
- Other paragraphs: Focus on information points, not word count
- All content in English
- Make sure the content is specifically tailored to: ${useCase.title} + ${useCase.industry || 'General'} + ${useCase.use_case_type}

🔥 CRITICAL: Avoid repeating the same sentence or phrase more than 2 times throughout the entire content
🔥 CRITICAL: Use varied expressions and synonyms instead of mechanical repetition
🔥 CRITICAL: Each section should use different wording while maintaining the same meaning

【Content Structure - SEO + GEO Optimized with Random Variants】

🔥 YOU MUST USE THESE EXACT VARIANTS (assigned randomly):
- H1 Format: ${h1Variant === 'A' ? 'Format A' : h1Variant === 'B' ? 'Format B' : 'Format C'}
- Answer-first Opening: ${answerFirstVariant === 'A' ? 'Opening A' : answerFirstVariant === 'B' ? 'Opening B' : 'Opening C'}
- Application Introduction: "${selectedApplicationPhrase}"
- Why This Matters: ${painPointType} type only (weighted: Understanding 40%, Scale 30%, Time 20%, Cost 10%)

H1: ${h1Variant === 'A' 
  ? `AI Video Generation for ${useCase.industry || 'General'} – ${useCase.title}`
  : h1Variant === 'B'
  ? `AI Video Use Cases in ${useCase.industry || 'General'}: ${useCase.title}`
  : `How ${useCase.industry || 'General'} Teams Apply AI Video to ${useCase.title}`
}

H2: Introduction (GEO-1: Answer-First Structure - 120-160 words)
Start with this exact opening:
"${answerFirstOpenings[answerFirstVariant]}"
Follow with:
- ${selectedApplicationPhrase}: [list of noun phrases, e.g., "Product demo videos", "Onboarding explainer clips", "Social media short-form ads"]
- This page explains how teams use AI video tools for this purpose, which platforms are most suitable, and practical steps to get started.

H2: Why Sora2 is perfect for ${useCase.title} in ${useCase.industry || 'General'} (3-5 specific reasons)
Use noun phrases in lists, NOT marketing sentences:
✅ Good: "Product demo videos", "Onboarding clips", "Social media ads"
❌ Bad: "Boost your brand visibility", "Increase engagement dramatically"

H2: Why This Matters
${painPointTemplates[painPointType]}
Write 2-3 sentences only, do NOT write all 4 types.

H2: How to use Sora2 for ${useCase.title} in ${useCase.industry || 'General'} (GEO-3: Step-by-step guide)
    H3: Step 1: Create your text prompt (with ${useCase.industry || 'general'} industry-specific examples)
    H3: Step 2: Choose video style and format (recommended for ${useCase.use_case_type})
    H3: Step 3: Generate and download

H2: Real-world examples with Sora2 for ${useCase.title} in ${useCase.industry || 'General'}
Use noun phrases for examples:
- [Example 1 as noun phrase]
- [Example 2 as noun phrase]
- [Example 3 as noun phrase]

H2: Benefits of using Sora2 for ${useCase.title} in ${useCase.industry || 'General'}
List format with noun phrases

H2: Frequently Asked Questions (GEO-4: "傻问题化" - Answer questions non-experts would ask)
Must include at least 3 questions. Priority questions (AI search prefers these):
- "How is AI video typically used in ${useCase.industry || 'this industry'}?"
- "Is AI-generated video suitable for non-technical teams?"
- "Can these videos be reused across different contexts?"
- "Do I need filming equipment for ${useCase.title}?"
- "Is this expensive?"
- "Can small teams use this?"

Avoid or use sparingly:
- "Which platform works best..." (comparison/evaluation questions are less preferred by AI search)

Keep answers 2-4 sentences, no marketing jargon.

H2: Using Sora2 for ${useCase.title} in ${useCase.industry || 'General'}
(Neutral informational heading, not "Get started with Sora2")

Final CTA (One sentence only):
Get started with Sora2 to create AI-generated videos for ${useCase.industry || 'General'} use cases.

IMPORTANT: 
- You MUST start with an H1 heading (single #)
- Focus on Sora2's actual capabilities
- Make it clear this is about Sora2 platform
- Include actionable steps users can take
- The content MUST be specifically relevant to: ${useCase.title} + ${useCase.industry || 'General'} industry + ${useCase.use_case_type} type
- Do NOT generate generic content - make it highly specific to these parameters

Please output high-quality SEO + GEO optimized content in English that is specifically tailored to ${useCase.title} in the ${useCase.industry || 'General'} industry for ${useCase.use_case_type} purposes.`
}

// 调用 AI API 生成 GEO 优化内容
async function generateGEOContent(useCase) {
  const grsaiApiKey = process.env.GRSAI_API_KEY
  const grsaiChatHost = process.env.GRSAI_CHAT_HOST || 'https://api.grsai.com'
  
  if (!grsaiApiKey) {
    throw new Error('缺少 GRSAI_API_KEY 环境变量')
  }
  
  try {
    // 构建消息列表（包含 system prompt）
    const messages = [
      { role: 'system', content: GEO_SYSTEM_PROMPT },
      { role: 'user', content: buildGEOPrompt(useCase) },
    ]
    
    const response = await fetch(`${grsaiChatHost}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${grsaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gemini-2.5-flash', // 使用低成本模型
        stream: false,
        messages: messages,
      }),
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      let errorData = {}
      try {
        errorData = JSON.parse(errorText)
      } catch (e) {
        // 忽略解析错误
      }
      throw new Error(`API 返回错误: ${response.status} ${response.statusText} - ${errorData.error?.message || errorText}`)
    }
    
    const data = await response.json()
    
    if (!data.choices || !data.choices[0]?.message?.content) {
      throw new Error('生成的内容为空')
    }
    
    return data.choices[0].message.content
  } catch (error) {
    console.error(`[${useCase.id}] 生成内容失败:`, error.message)
    throw error
  }
}

// 提取 H1 和描述
function extractMetadata(content) {
  const h1Match = content.match(/^#\s+(.+)$/m) || content.match(/<h1[^>]*>(.+?)<\/h1>/i)
  const h1 = h1Match ? h1Match[1].trim().replace(/<[^>]+>/g, '') : ''
  
  const text = content
    .replace(/^#+\s+.+$/gm, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\n+/g, ' ')
    .trim()
  
  const firstParagraph = text.split(/\n\n/)[0] || text
  const description = firstParagraph.length > 200 
    ? firstParagraph.substring(0, 200) + '...'
    : firstParagraph
  
  return { h1, description }
}

// 更新单个 Use Case
async function updateUseCase(supabase, useCase, newContent, dryRun = false) {
  const { h1, description } = extractMetadata(newContent)
  
  if (!h1) {
    throw new Error('无法提取 H1 标题')
  }
  
  if (dryRun) {
    console.log(`[DRY-RUN] 将更新: ${useCase.title}`)
    console.log(`  H1: ${h1.substring(0, 50)}...`)
    console.log(`  描述: ${description.substring(0, 50)}...`)
    return { success: true, dryRun: true }
  }
  
  const { error } = await supabase
    .from('use_cases')
    .update({
      content: newContent,
      h1: h1,
      description: description,
      updated_at: new Date().toISOString(),
    })
    .eq('id', useCase.id)
  
  if (error) {
    throw error
  }
  
  return { success: true, h1, description }
}

// 主函数
async function main() {
  const args = process.argv.slice(2)
  const idsArg = args.find(arg => arg.startsWith('--ids='))
  const dryRun = args.includes('--dry-run')
  const batchSizeArg = args.find(arg => arg.startsWith('--batch='))
  
  if (!idsArg) {
    console.error('❌ 请提供 Use Case IDs')
    console.error('使用方法: node scripts/batch-update-geo-content.js --ids=id1,id2,id3 [--dry-run]')
    process.exit(1)
  }
  
  const idsString = idsArg.split('=')[1]
  const idArray = idsString.split(',').map(id => id.trim()).filter(Boolean)
  const batchSize = batchSizeArg ? parseInt(batchSizeArg.split('=')[1]) : 10
  
  console.log('🚀 批量更新 Use Case 为 GEO 优化版本')
  console.log(`   数量：${idArray.length} 条`)
  console.log(`   批次大小：${batchSize}`)
  console.log(`   模式：${dryRun ? 'DRY-RUN（不实际更新）' : '实际更新'}\n`)
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ 缺少 Supabase 环境变量')
    process.exit(1)
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  // 获取 Use Cases（分批查询，避免 ID 列表过长）
  const allUseCases = []
  const chunkSize = 100 // Supabase 的 .in() 查询限制
  
  console.log(`📦 分批获取 Use Cases（${idArray.length} 个 ID，每批 ${chunkSize} 个）...`)
  
  for (let i = 0; i < idArray.length; i += chunkSize) {
    const chunk = idArray.slice(i, i + chunkSize)
    const { data: chunkUseCases, error: fetchError } = await supabase
      .from('use_cases')
      .select('id, slug, title, industry, use_case_type, content')
      .in('id', chunk)
    
    if (fetchError) {
      console.error(`❌ 获取 Use Cases 失败（批次 ${Math.floor(i / chunkSize) + 1}）:`, fetchError.message)
      process.exit(1)
    }
    
    if (chunkUseCases && chunkUseCases.length > 0) {
      allUseCases.push(...chunkUseCases)
      console.log(`  ✅ 批次 ${Math.floor(i / chunkSize) + 1}: 获取 ${chunkUseCases.length} 条`)
    }
  }
  
  const useCases = allUseCases
  
  if (!useCases || useCases.length === 0) {
    console.error('❌ 没有找到指定的 Use Cases')
    process.exit(1)
  }
  
  console.log(`\n✅ 总共找到 ${useCases.length} 条 Use Case\n`)
  
  let successCount = 0
  let failCount = 0
  const errors = []
  
  // 分批处理（并发处理以提高速度）
  const concurrency = 10 // 增加并发数到10条（提高速度）
  for (let i = 0; i < useCases.length; i += batchSize) {
    const batch = useCases.slice(i, i + batchSize)
    console.log(`\n📦 处理批次 ${Math.floor(i / batchSize) + 1}/${Math.ceil(useCases.length / batchSize)} (${batch.length} 条)`)
    
    // 并发处理批次内的内容
    for (let j = 0; j < batch.length; j += concurrency) {
      const concurrentBatch = batch.slice(j, j + concurrency)
      const promises = concurrentBatch.map(async (useCase, idx) => {
        const globalIndex = i + j + idx + 1
        try {
          console.log(`\n[${globalIndex}/${useCases.length}] 处理: ${useCase.title.substring(0, 50)}...`)
          
          // 生成 GEO 优化内容
          const newContent = await generateGEOContent(useCase)
          console.log(`[${globalIndex}] ✅ 生成成功 (${newContent.length} 字符)`)
          
          // 更新数据库
          const result = await updateUseCase(supabase, useCase, newContent, dryRun)
          console.log(`[${globalIndex}] ✅ 更新成功`)
          
          return { success: true, useCase }
        } catch (error) {
          console.error(`[${globalIndex}] ❌ 失败: ${error.message}`)
          return { success: false, useCase, error: error.message }
        }
      })
      
      const results = await Promise.all(promises)
      
      results.forEach(result => {
        if (result.success) {
          successCount++
        } else {
          failCount++
          errors.push({ id: result.useCase.id, title: result.useCase.title, error: result.error })
        }
      })
      
      // 并发批次间短暂延迟（减少延迟以提高速度）
      if (j + concurrency < batch.length) {
        await new Promise(resolve => setTimeout(resolve, 50))
      }
    }
    
    // 批次间延迟（减少延迟以加快速度）
    if (i + batchSize < useCases.length) {
      console.log(`\n⏸️  批次间休息 0.2 秒...`)
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  }
  
  console.log(`\n\n📊 更新完成`)
  console.log(`   ✅ 成功：${successCount} 条`)
  console.log(`   ❌ 失败：${failCount} 条`)
  
  if (errors.length > 0) {
    console.log(`\n❌ 失败列表：`)
    errors.forEach(({ id, title, error }) => {
      console.log(`   - ${title} (${id}): ${error}`)
    })
  }
  
  if (dryRun) {
    console.log(`\n💡 这是 DRY-RUN 模式，没有实际更新数据库`)
    console.log(`   要实际更新，请移除 --dry-run 参数`)
  }
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = { generateGEOContent, updateUseCase, buildGEOPrompt }

