'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '@/components/ui'
import { INDUSTRIES_100 } from '@/lib/data/industries-100'
import { INDUSTRIES_TRADITIONAL } from '@/lib/data/industries-traditional'
import { generateSlugFromText } from '@/lib/utils/slug'
import { checkContentQuality } from '@/lib/utils/content-quality'
import { getPrioritizedIndustries, getIndustryBadge, getBusinessTierBadge, shouldRecommendIndustry } from '@/lib/utils/industry-helper'

interface IndustrySceneBatchGeneratorProps {
  onShowBanner: (type: 'success' | 'error' | 'info', text: string) => void
  onGenerated: () => void
  onFilterChange?: (type: string, industry: string) => void // 保留用于未来功能
}

interface SceneItem {
  id: number
  use_case: string
}

interface IndustryTask {
  id: string
  industry: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'saved'
  scenes?: SceneItem[]
  error?: string
  savedCount?: number
  generatedCount?: number
  isSaving?: boolean
  isGenerating?: boolean
}

/**
 * 行业场景词批量生成器
 * 支持一次生成 100 个行业的场景词（每个行业 100 条）
 * 总计 10,000 条高质量内容
 */
export default function IndustrySceneBatchGenerator({
  onShowBanner,
  onGenerated,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onFilterChange, // 保留用于未来功能
}: IndustrySceneBatchGeneratorProps) {
  // 模式切换：营销场景模式 vs 传统行业模式
  const [industryMode, setIndustryMode] = useState<'marketing' | 'traditional'>('marketing')
  // 视图切换：列表视图 vs 网格视图
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  // 根据模式选择行业列表
  const currentIndustries = useMemo(() => {
    return (industryMode === 'marketing' ? INDUSTRIES_100 : INDUSTRIES_TRADITIONAL) as readonly string[]
  }, [industryMode])

  // 获取优先行业列表（用于快速选择）
  const prioritizedIndustries = useMemo(() => {
    const industriesArray = Array.from(currentIndustries)
    return getPrioritizedIndustries()
      .map(item => item.industry)
      .filter((industry): industry is string => 
        industriesArray.includes(industry)
      )
  }, [currentIndustries])
  
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([])
  const [scenesPerIndustry, setScenesPerIndustry] = useState<number>(100)
  const [useCaseType, setUseCaseType] = useState<string>('advertising-promotion')
  const [tasks, setTasks] = useState<IndustryTask[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingIndex, setProcessingIndex] = useState(-1)
  const [isPaused, setIsPaused] = useState(false)
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null)
  const [autoRecoverStuck, setAutoRecoverStuck] = useState(true)
  // 使用 useRef 来在闭包中正确访问状态
  const shouldStopRef = useRef(false)
  const isPausedRef = useRef(false)
  const useCaseTypeRef = useRef(useCaseType)
  const autoRecoverInFlightRef = useRef(false)
  
  // 同步 useCaseType 到 ref
  useCaseTypeRef.current = useCaseType
  
  // 当模式切换时，清空已选择的行业
  useEffect(() => {
    setSelectedIndustries([])
  }, [industryMode])

  // 解析场景词内容（提取 JSON 数组）
  const parseScenesFromContent = (content: string): SceneItem[] => {
    try {
      // 移除可能的 markdown 代码块标记
      let jsonContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      
      // 尝试提取 JSON 数组部分（从第一个 [ 到最后一个 ]）
      const firstBracket = jsonContent.indexOf('[')
      const lastBracket = jsonContent.lastIndexOf(']')
      
      if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
        jsonContent = jsonContent.substring(firstBracket, lastBracket + 1)
      }
      
      // 更强大的 JSON 修复逻辑
      // 1. 修复未终止的字符串 - 找到最后一个未配对的引号并修复
      let fixedContent = jsonContent
      let inString = false
      let escapeNext = false
      let lastValidIndex = fixedContent.length - 1
      
      for (let i = 0; i < fixedContent.length; i++) {
        if (escapeNext) {
          escapeNext = false
          continue
        }
        
        if (fixedContent[i] === '\\') {
          escapeNext = true
          continue
        }
        
        if (fixedContent[i] === '"') {
          inString = !inString
        }
        
        // 如果遇到 } 或 ] 且不在字符串中，检查是否完整
        if (!inString) {
          if (fixedContent[i] === '}' || fixedContent[i] === ']') {
            // 检查前面的内容是否完整
            const before = fixedContent.substring(0, i + 1)
            try {
              JSON.parse(before)
              lastValidIndex = i
            } catch {
              // 如果解析失败，尝试修复
            }
          }
        }
      }
      
      // 如果字符串未终止，修复它
      if (inString) {
        fixedContent = fixedContent.substring(0, lastValidIndex + 1) + ']'
      } else {
        fixedContent = fixedContent.substring(0, lastValidIndex + 1)
      }
      
      // 尝试修复常见的 JSON 错误
      // 修复缺失的逗号
      fixedContent = fixedContent.replace(/}\s*{/g, '},{')
      fixedContent = fixedContent.replace(/]\s*\[/g, '],[')
      
      // 尝试解析
      const parsed = JSON.parse(fixedContent) as SceneItem[]
      
      if (!Array.isArray(parsed)) {
        throw new Error('解析结果不是数组')
      }
      
      return parsed.filter((item) => item && typeof item.use_case === 'string' && item.use_case.trim().length > 0)
    } catch (parseError) {
      console.error('JSON 解析失败，尝试正则表达式提取:', parseError)
      
      // 如果 JSON 解析失败，尝试使用正则表达式提取
      try {
        const matches = content.match(/"use_case"\s*:\s*"([^"]+)"/g) || []
        if (matches.length > 0) {
          console.log(`使用正则表达式提取了 ${matches.length} 个场景词`)
          return matches.map((match, index) => {
            const useCase = match.match(/"use_case"\s*:\s*"([^"]+)"/)?.[1] || ''
            return {
              id: index + 1,
              use_case: useCase.replace(/\\"/g, '"').replace(/\\n/g, '\n'),
            }
          })
        }
      } catch (fallbackError) {
        console.error('正则表达式提取也失败:', fallbackError)
      }
      
      throw new Error(`无法解析生成的 JSON 数据: ${parseError instanceof Error ? parseError.message : '未知错误'}`)
    }
  }

  // 生成行业场景词（一次生成 100 条）
  // 已迁移到后台任务 API，保留用于参考
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const generateIndustryScenes = async (industry: string): Promise<SceneItem[]> => {
    const systemPrompt = `You are an SEO expert specializing in AI video generation use cases. Generate highly specific, practical, real-world use cases for AI video generation. All output must be in English.

CRITICAL: The AI video platform ONLY supports 10-second or 15-second videos. NEVER mention any duration longer than 15 seconds (such as 20 seconds, 30 seconds, 45 seconds, 60 seconds, 1 minute, 2 minutes, etc.). When describing video examples, ALWAYS use "10 seconds" or "15 seconds" only.`

    // 如果生成数量太多，分批生成（每次最多 50 条）
    const batchSize = Math.min(scenesPerIndustry, 50)
    const batches = Math.ceil(scenesPerIndustry / batchSize)
    
    console.log(`[${industry}] 将分 ${batches} 批生成，每批 ${batchSize} 条`)

    const userPrompt = `Generate ${batchSize} highly specific, practical, real-world use cases for AI video generation for the following industry:

Industry: ${industry}

Requirements:
- ${batchSize} use cases
- Each use case = 300–500 characters (detailed scenario description)
- Must be specific, not generic
- Must be real-world scenarios where AI video creation is actually needed
- Each use case should describe:
  1. The specific scenario/situation
  2. The pain point or challenge
  3. Why AI video is suitable for this scenario
  4. A brief example prompt idea
- IMPORTANT: When mentioning video duration, ALWAYS use "10 seconds" or "15 seconds" ONLY. NEVER mention "20 seconds", "30 seconds", "45 seconds", "60 seconds", "1 minute", "2 minutes", or any duration longer than 15 seconds.
- Format as a clean JSON array: 
[
  {"id": 1, "use_case": "Detailed 300-500 character description including scenario, pain point, why AI video, and example prompt (video duration: 10 seconds or 15 seconds ONLY)"},
  {"id": 2, "use_case": "..."},
  ...
  {"id": ${batchSize}, "use_case": "..."}
]
Do not include explanations. Output only the JSON.`

    const promptSize = (systemPrompt + userPrompt).length
    console.log(`[${industry}] Prompt 大小: ${promptSize} 字符`)
    
    if (promptSize > 50000) {
      console.warn(`[${industry}] Prompt 过大 (${promptSize} 字符)，可能导致 API 错误`)
    }

    // 如果数量超过 50，分批生成
    if (scenesPerIndustry > 50) {
      const allScenes: SceneItem[] = []
      for (let batch = 0; batch < batches; batch++) {
        const currentBatchSize = batch === batches - 1 
          ? scenesPerIndustry - (batch * batchSize) 
          : batchSize
        
        const batchUserPrompt = `Generate ${currentBatchSize} highly specific, practical, real-world use cases for AI video generation for the following industry:

Industry: ${industry}

IMPORTANT: When mentioning video duration, ALWAYS use "10 seconds" or "15 seconds" ONLY. NEVER mention "20 seconds", "30 seconds", "45 seconds", "60 seconds", "1 minute", "2 minutes", or any duration longer than 15 seconds.

Requirements:
- ${currentBatchSize} use cases
- Each use case = 300–500 characters (detailed scenario description)
- Must be specific, not generic
- Must be real-world scenarios where AI video creation is actually needed
- Each use case should describe:
  1. The specific scenario/situation
  2. The pain point or challenge
  3. Why AI video is suitable for this scenario
  4. A brief example prompt idea
- Format as a clean JSON array: 
[
  {"id": 1, "use_case": "Detailed 300-500 character description including scenario, pain point, why AI video, and example prompt"},
  {"id": 2, "use_case": "..."},
  ...
  {"id": ${currentBatchSize}, "use_case": "..."}
]
Do not include explanations. Output only the JSON.`

        console.log(`[${industry}] 生成第 ${batch + 1}/${batches} 批 (${currentBatchSize} 条)...`)
        
        const requestBody = {
          model: 'gemini-2.5-flash',
          stream: false,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: batchUserPrompt },
          ],
        }

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        })

        if (!response.ok) {
          let errorData: { error?: string; message?: string; details?: string } = {}
          try {
            const text = await response.text()
            errorData = text ? JSON.parse(text) : {}
          } catch (e) {
            console.error(`[${industry}] 解析错误响应失败:`, e)
          }
          
          console.error(`[${industry}] API 请求失败 (批次 ${batch + 1}):`, {
            status: response.status,
            statusText: response.statusText,
            error: errorData.error || errorData.message || '未知错误',
            details: errorData.details,
          })
          
          throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        
        if (data.success && data.data) {
          const content = data.data.choices?.[0]?.message?.content || ''
          if (!content) {
            throw new Error('生成的内容为空')
          }

          // 解析 JSON
          const batchScenes = parseScenesFromContent(content)
          // 调整 ID 以保持连续性
          batchScenes.forEach((scene, idx) => {
            scene.id = batch * batchSize + idx + 1
          })
          allScenes.push(...batchScenes)
          
          // 批次之间稍作延迟
          if (batch < batches - 1) {
            await new Promise((resolve) => setTimeout(resolve, 1000))
          }
        } else {
          throw new Error('API 响应格式错误')
        }
      }
      
      return allScenes
    }

    // 单批生成（50 条或更少）
    const requestBody = {
      model: 'gemini-2.5-flash',
      stream: false,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }

    console.log(`[${industry}] 发送 API 请求:`, {
      model: requestBody.model,
      messagesCount: requestBody.messages.length,
      systemPromptLength: systemPrompt.length,
      userPromptLength: userPrompt.length,
    })

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      let errorData: { error?: string; message?: string; details?: string } = {}
      try {
        const text = await response.text()
        errorData = text ? JSON.parse(text) : {}
      } catch (e) {
        console.error(`[${industry}] 解析错误响应失败:`, e)
      }
      
      console.error(`[${industry}] API 请求失败:`, {
        status: response.status,
        statusText: response.statusText,
        error: errorData.error || errorData.message || '未知错误',
        details: errorData.details,
      })
      
      throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    
    if (data.success && data.data) {
      const content = data.data.choices?.[0]?.message?.content || ''
      if (!content) {
        throw new Error('生成的内容为空')
      }

      // 使用统一的解析函数
      try {
        const scenes = parseScenesFromContent(content)
        
        // 验证和过滤场景词
        if (!Array.isArray(scenes) || scenes.length === 0) {
          throw new Error('解析后的场景词数组为空')
        }
        
        // 确保每个场景词都有有效的 use_case
        const validScenes = scenes
          .filter((scene) => scene && scene.use_case && scene.use_case.trim().length > 50)
          .slice(0, scenesPerIndustry) // 限制数量
        
        if (validScenes.length === 0) {
          throw new Error('过滤后的场景词数组为空')
        }

        return validScenes
      } catch (parseError) {
        console.error(`[${industry}] 解析场景词失败:`, {
          error: parseError instanceof Error ? parseError.message : String(parseError),
          contentLength: content.length,
          contentPreview: content.substring(0, 500),
        })
        // parseScenesFromContent 已经包含了所有解析逻辑，如果失败就直接抛出
        throw parseError
      }
    }

    throw new Error('API 响应格式错误')
  }

  // 保存单个场景词到数据库（带重试机制）
  // 已迁移到后台任务 API，保留用于参考
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const saveSceneToDatabase = async (
    industry: string,
    scene: SceneItem,
    retryCount = 0
  ): Promise<{ id: string; slug: string }> => {
    const maxRetries = 3
    const retryDelay = 1000 * (retryCount + 1) // 递增延迟：1s, 2s, 3s

    try {
      // 从场景词中提取关键词作为标题
      const title = scene.use_case.length > 100 
        ? scene.use_case.substring(0, 100) + '...'
        : scene.use_case
      
      // 生成 slug，确保不会太长
      // 使用场景描述的前 80 个字符，加上行业名称
      const sceneText = scene.use_case.length > 80 
        ? scene.use_case.substring(0, 80) 
        : scene.use_case
      const slug = generateSlugFromText(`${industry}-${sceneText}`)
      
      // 生成 H1 和描述
      const h1 = `AI Video Generation for ${scene.use_case} in ${industry}`
      const description = `Learn how to use AI video generation for ${scene.use_case} in the ${industry} industry. Create professional videos with Sora2.`

      // 生成完整内容（符合业务规格：300-500字，包含场景痛点、为什么用AI视频、示例prompt）
      // 从场景描述中提取关键信息
      const sceneDescription = scene.use_case
      
      // 生成符合规格的完整内容
      const content = `# ${h1}

## Introduction

${sceneDescription}

## Why AI Video is Perfect for This Scenario

AI video generation offers several key advantages for ${scene.use_case} in the ${industry} industry:

- **Fast Production**: Create professional videos in minutes instead of days or weeks
- **Cost-Effective**: No need for expensive video production teams, equipment, or locations
- **Consistent Quality**: AI ensures professional output every time, maintaining brand consistency
- **Scalable**: Generate multiple variations easily for A/B testing or different markets
- **Flexible**: Quickly adapt videos for different platforms (YouTube, TikTok, Instagram, etc.)

## How to Use Sora2 for ${scene.use_case}

### Step 1: Create Your Video Prompt

Describe your ${scene.use_case} video needs in detail. Be specific about:
- The scene or setting
- The mood or tone
- Key elements or actions
- Style preferences (realistic, cinematic, animated, etc.)

### Step 2: Choose Video Settings

Select your preferred aspect ratio:
- **16:9** for YouTube, websites, presentations
- **9:16** for TikTok, Instagram Stories, Shorts
- **1:1** for Instagram posts, Facebook

Choose video duration: **10 seconds** or **15 seconds** based on your needs.

### Step 3: Generate Your Video

Click generate and wait a few moments. Sora2's AI will create your professional video with high-quality visuals and smooth transitions.

### Step 4: Download and Use

Once generated, download your video and use it immediately in your ${industry} marketing, training, or content strategy.

## Example Prompt for ${scene.use_case}

Here's an example prompt you can use with Sora2 to generate a **10-second or 15-second** video:

\`\`\`
[Example prompt based on the use case - will be generated based on scene description]
\`\`\`

**Note**: All videos generated by Sora2 are available in 10-second or 15-second durations. Choose the duration that best fits your content needs.

## Get Started Today

Start creating professional ${scene.use_case} videos for ${industry} today with Sora2 AI video generation platform. No technical skills required, no expensive equipment needed - just describe what you want, and AI will create it for you.`

      // 自动质量检查
      let qualityCheck
      try {
        console.log(`[${industry}] 开始质量检查...`, {
          titleLength: title?.length || 0,
          h1Length: h1?.length || 0,
          descriptionLength: description?.length || 0,
          contentLength: content?.length || 0,
        })
        qualityCheck = checkContentQuality({
          title,
          h1,
          description,
          content,
          seo_keywords: [scene.use_case, industry, `${industry} AI video`],
        })
        console.log(`[${industry}] 质量检查完成:`, {
          score: qualityCheck.score,
          issues: qualityCheck.issues,
          passed: qualityCheck.passed,
        })
      } catch (qualityError) {
        console.error(`[${industry}] 质量检查失败:`, qualityError)
        // 如果质量检查失败，使用默认值
        qualityCheck = {
          passed: false,
          score: 50,
          issues: ['quality_check_error'],
          warnings: [],
        }
      }

      // 根据质量检查结果设置状态
      // 如果通过检查且分数 >= 70，自动批准；否则标记为待审核
      const qualityStatus = qualityCheck.passed && qualityCheck.score >= 70 ? 'approved' : 'pending'
      const isPublished = qualityStatus === 'approved' // 只有审核通过的内容才自动发布

      // 准备请求数据
      const requestData = {
        slug,
        title,
        h1,
        description,
        content,
        use_case_type: useCaseTypeRef.current,
        industry,
        is_published: isPublished,
        seo_keywords: [scene.use_case, industry, `${industry} AI video`],
        quality_status: qualityStatus,
        quality_score: qualityCheck.score,
        quality_issues: qualityCheck.issues,
      }
      
      console.log(`[${industry}] 发送保存请求:`, {
        slug: slug.substring(0, 50),
        titleLength: title?.length || 0,
        contentLength: content?.length || 0,
        useCaseType: useCaseTypeRef.current,
        qualityStatus,
        qualityScore: qualityCheck.score,
      })
      
      const response = await fetch('/api/admin/use-cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      })
    
    // 调试日志：确认保存的数据
    if (retryCount === 0) {
      console.log(`[${industry}] 保存场景词成功:`, {
        slug,
        use_case_type: useCaseTypeRef.current,
        industry,
        title: title.substring(0, 50),
      })
    }

      if (!response.ok) {
        // 如果是网络错误或连接关闭，尝试重试
        if ((response.status === 0 || response.status >= 500) && retryCount < maxRetries) {
          console.warn(`[${industry}] 保存场景词失败 (HTTP ${response.status})，${retryDelay}ms 后重试 (${retryCount + 1}/${maxRetries})...`)
          await new Promise((resolve) => setTimeout(resolve, retryDelay))
          return saveSceneToDatabase(industry, scene, retryCount + 1)
        }
        
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.details || `保存失败: HTTP ${response.status}`)
      }

      const result = await response.json()
      if (!result.useCase?.id) {
        throw new Error('保存成功但未返回 ID')
      }

      return { id: result.useCase.id, slug: result.useCase.slug || slug }
    } catch (error) {
      // 检测各种网络错误类型
      const isNetworkError = 
        (error instanceof TypeError && (
          error.message.includes('fetch') ||
          error.message.includes('Failed to fetch') ||
          error.message.includes('network') ||
          error.message.includes('CONNECTION') ||
          error.message.includes('ERR_CONNECTION')
        )) ||
        (error instanceof Error && (
          error.message.includes('ERR_CONNECTION_CLOSED') ||
          error.message.includes('ERR_CONNECTION_REFUSED') ||
          error.message.includes('ERR_CONNECTION_RESET') ||
          error.message.includes('network') ||
          error.message.includes('timeout')
        ))
      
      // 如果是网络错误且未超过重试次数，进行重试
      if (isNetworkError && retryCount < maxRetries) {
        console.warn(`[${industry}] 网络错误 (${error instanceof Error ? error.message : '未知'})，${retryDelay}ms 后重试 (${retryCount + 1}/${maxRetries})...`)
        await new Promise((resolve) => setTimeout(resolve, retryDelay))
        return saveSceneToDatabase(industry, scene, retryCount + 1)
      }
      
      // 如果不是网络错误或已超过重试次数，抛出错误
      console.error(`[${industry}] 保存场景词最终失败:`, error)
      throw error
    }
  }

  // 批量生成（使用后台任务）
  const handleBatchGenerate = async () => {
    if (selectedIndustries.length === 0) {
      onShowBanner('error', '请至少选择一个行业')
      return
    }

    try {
      // 调用后台任务 API
      const response = await fetch('/api/admin/batch-generation/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          industries: selectedIndustries,
          scenesPerIndustry,
          useCaseType: useCaseTypeRef.current,
        }),
      })

      const result = await response.json().catch(() => ({
        error: '无法解析服务器响应，可能是服务器错误',
        details: '请检查 Vercel 日志或联系技术支持',
      }))

      if (!response.ok) {
        // 构建详细的错误信息
        let errorMsg = result.error || '启动任务失败'
        
        // 如果是数据库表不存在的错误
        if (result.code === 'PGRST205' || result.message?.includes('batch_generation_tasks')) {
          errorMsg = '数据库表不存在！请在 Supabase Dashboard 中执行迁移 SQL。详情请查看 DATABASE_MIGRATION_BATCH_GENERATION_TASKS.md'
        } else if (result.details) {
          errorMsg = `${errorMsg}: ${result.details}`
        } else if (result.hint) {
          errorMsg = `${errorMsg} (提示: ${result.hint})`
        }
        
        throw new Error(errorMsg)
      }

      // 保存任务 ID 到 localStorage，以便页面刷新后能继续查看
      if (result.task?.id) {
        localStorage.setItem('lastBatchTaskId', result.task.id)
        setActiveTaskId(result.task.id)
      }

      // 转换为前端任务格式用于显示
      const newTasks: IndustryTask[] = selectedIndustries.map((industry, index) => ({
        id: `industry-task-${result.task.id}-${index}`,
        industry,
        status: 'pending' as const,
      }))

      setTasks(newTasks)
      setIsProcessing(true)
      shouldStopRef.current = false
      isPausedRef.current = false
      setIsPaused(false)

      // 开始轮询任务状态
      startPollingTaskStatus(result.task.id)

      onShowBanner('success', `任务已启动！任务ID: ${result.task.id.substring(0, 8)}... 即使关闭页面，任务也会在后台继续运行。`)
    } catch (error) {
      console.error('启动任务失败:', error)
      
      // 尝试从错误中提取更详细的信息
      let errorMessage = '启动任务失败'
      if (error instanceof Error) {
        errorMessage = error.message
        
        // 如果是网络错误，尝试获取响应详情
        if (error.message.includes('Failed to fetch') || error.message.includes('500')) {
          errorMessage = '服务器错误：可能是数据库表未创建。请检查 Vercel 日志或执行数据库迁移。'
        }
      }
      
      onShowBanner('error', errorMessage)
    }
  }

  // 轮询任务状态
  const startPollingTaskStatus = (taskId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/admin/batch-generation/status/${taskId}`)
        const result = await response.json()

        if (!response.ok) {
          console.error('获取任务状态失败:', result.error)
          clearInterval(pollInterval)
          return
        }

        const task = result.task
        setLastUpdatedAt(task.updated_at || null)

        // 更新进度
        if (task.current_industry_index !== undefined && task.total_industries) {
          setProcessingIndex(task.current_industry_index)
          
          // 🔥 修复：始终使用数据库中的 industries 顺序，确保显示顺序正确
          // 更新任务状态
          setTasks((prev) => {
            // 🔥 如果任务列表为空或顺序不一致，从数据库重建（使用数据库中的顺序）
            if ((prev.length === 0 || prev.length !== task.industries?.length) && task.industries && Array.isArray(task.industries)) {
              return task.industries.map((industry: string, index: number) => {
                const isCompleted = index < task.current_industry_index
                const isProcessing = index === task.current_industry_index
                const scenesPerIndustry = task.scenes_per_industry || 100
                
                // 计算当前行业已保存的数量
                let savedCount: number | undefined = undefined
                if (isCompleted) {
                  // 已完成的行业：固定保存 scenesPerIndustry 条
                  savedCount = scenesPerIndustry
                } else if (isProcessing && task.total_scenes_saved !== undefined) {
                  // 当前正在处理的行业：计算当前行业已保存的数量
                  const completedIndustriesCount = task.current_industry_index
                  // 防御性处理：如果数据库统计异常，避免显示超过每行业上限的数字
                  savedCount = Math.min(
                    scenesPerIndustry,
                    Math.max(0, task.total_scenes_saved - (completedIndustriesCount * scenesPerIndustry))
                  )
                }
                
                return {
                  id: `${index}`,
                  industry,
                  status: isCompleted ? 'completed' : isProcessing ? 'processing' : 'pending',
                  savedCount,
                }
              })
            }
            
            // 🔥 更新现有任务列表（确保顺序与数据库一致）
            // 如果数据库中的 industries 顺序与前端不一致，重新排序
            const dbIndustries = task.industries || []
            const scenesPerIndustry = task.scenes_per_industry || 100
            
            // 如果顺序不一致，重建列表
            if (prev.length !== dbIndustries.length || 
                prev.some((t, i) => t.industry !== dbIndustries[i])) {
              return dbIndustries.map((industry: string, index: number) => {
                const isCompleted = index < task.current_industry_index
                const isProcessing = index === task.current_industry_index
                
                // 计算当前行业已保存的数量
                let savedCount: number | undefined = undefined
                if (isCompleted) {
                  savedCount = scenesPerIndustry
                } else if (isProcessing && task.total_scenes_saved !== undefined) {
                  const completedIndustriesCount = task.current_industry_index
                  // 防御性处理：如果数据库统计异常，避免显示超过每行业上限的数字
                  savedCount = Math.min(
                    scenesPerIndustry,
                    Math.max(0, task.total_scenes_saved - (completedIndustriesCount * scenesPerIndustry))
                  )
                }
                
                return {
                  id: `${index}`,
                  industry,
                  status: isCompleted ? 'completed' : isProcessing ? 'processing' : 'pending',
                  savedCount,
                }
              })
            }
            
            // 顺序一致，更新现有任务列表
            const updated = [...prev]
            
            // 🔥 修复：正确计算每个行业的保存数量
            // total_scenes_saved 是全局累计的，需要计算每个行业的实际数量
            // 🔥 生成逻辑是按顺序从上往下处理的（current_industry_index 递增）
            // 🔥 边生成边保存模式：generateAndSaveScenes 函数在生成一批后立即保存，所以当函数返回时，所有场景词都已保存完成
            for (let i = 0; i < updated.length; i++) {
              if (i < task.current_industry_index) {
                // 已完成的行业：每个行业应该保存 scenesPerIndustry 条
                // 🔥 边生成边保存模式下，当 current_industry_index 递增时，前一个行业的生成和保存都已完成
                updated[i] = { 
                  ...updated[i], 
                  status: 'completed', // 已完成（生成和保存都已完成）
                  savedCount: scenesPerIndustry // 每个行业固定保存 scenesPerIndustry 条
                }
              } else if (i === task.current_industry_index) {
                // 当前正在处理的行业：计算当前行业已生成和已保存的数量
                // 当前行业已保存 = total_scenes_saved - (已完成行业数 * scenesPerIndustry)
                // 当前行业已生成 = total_scenes_generated - (已完成行业数 * scenesPerIndustry)
                const completedIndustriesCount = task.current_industry_index
                const currentIndustrySaved = task.total_scenes_saved !== undefined
                  ? Math.min(
                      scenesPerIndustry,
                      Math.max(0, task.total_scenes_saved - (completedIndustriesCount * scenesPerIndustry))
                    )
                  : undefined
                const currentIndustryGenerated = task.total_scenes_generated !== undefined
                  ? Math.min(
                      scenesPerIndustry,
                      Math.max(0, task.total_scenes_generated - (completedIndustriesCount * scenesPerIndustry))
                    )
                  : undefined
                
                // 🔥 判断当前行业的状态
                // 如果已生成数量 > 已保存数量，说明正在保存中
                // 如果已生成数量 = 已保存数量，说明保存完成（但 current_industry_index 还未更新）
                // 如果已生成数量 < scenesPerIndustry，说明还在生成中
                const isSaving = currentIndustryGenerated !== undefined && 
                                 currentIndustrySaved !== undefined &&
                                 currentIndustryGenerated > currentIndustrySaved
                const isCompleted = currentIndustrySaved !== undefined && 
                                   currentIndustrySaved >= scenesPerIndustry
                
                updated[i] = {
                  ...updated[i],
                  status: isCompleted ? 'completed' : 'processing',
                  savedCount: currentIndustrySaved,
                  generatedCount: currentIndustryGenerated, // 添加已生成数量，用于显示
                  isSaving, // 标记是否正在保存
                }
              } else {
                // 还未开始的行业：保持 pending 状态
                updated[i] = {
                  ...updated[i],
                  status: 'pending',
                  savedCount: undefined,
                }
              }
            }
            
            return updated
          })
        }

        // 如果任务完成或失败，停止轮询
        if (['completed', 'failed', 'cancelled'].includes(task.status)) {
          clearInterval(pollInterval)
          setIsProcessing(false)
          
          // 更新所有任务状态为完成
          if (task.status === 'completed') {
            setTasks((prev) => prev.map((t) => ({ ...t, status: 'completed' as const })))
            onShowBanner('success', `任务完成！共生成 ${task.total_scenes_saved || 0} 条场景词`)
            onGenerated()
          } else if (task.status === 'failed') {
            onShowBanner('error', `任务失败: ${task.error_message || '未知错误'}`)
          } else if (task.status === 'cancelled') {
            onShowBanner('info', '任务已取消')
          }
          
          // 清除 localStorage（任务已完成或失败）
          localStorage.removeItem('lastBatchTaskId')
        }

        // 更新暂停状态
        if (task.status === 'paused') {
          setIsPaused(true)
          isPausedRef.current = true
        } else if (task.status === 'processing') {
          setIsPaused(false)
          isPausedRef.current = false
        }

        // 自动恢复：超过 10 分钟未更新且仍在 processing/pending/paused
        if (autoRecoverStuck && !autoRecoverInFlightRef.current) {
          const updatedAtMs = task.updated_at ? new Date(task.updated_at).getTime() : 0
          const minutes = updatedAtMs ? (Date.now() - updatedAtMs) / 60000 : Infinity
          const shouldRecover =
            ['processing', 'pending', 'paused'].includes(task.status) && minutes >= 10

          if (shouldRecover) {
            autoRecoverInFlightRef.current = true
            fetch('/api/admin/batch-generation/recover', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ taskId, force: true }),
            })
              .then(async (r) => ({ ok: r.ok, data: await r.json().catch(() => ({})) }))
              .then(({ ok, data }) => {
                if (ok) onShowBanner('info', '检测到任务长时间未更新，已自动触发恢复')
                else onShowBanner('error', data?.error || '自动恢复失败')
              })
              .catch((e) => {
                console.error('[auto-recover] failed:', e)
              })
              .finally(() => {
                setTimeout(() => {
                  autoRecoverInFlightRef.current = false
                }, 15_000)
              })
          }
        }
      } catch (error) {
        console.error('轮询任务状态失败:', error)
      }
    }, 2000) // 每2秒轮询一次

    // 页面卸载时清理
    return () => clearInterval(pollInterval)
  }

  // 恢复之前的任务（页面刷新后或新窗口打开）
  useEffect(() => {
    const restoreTask = async () => {
      // 首先尝试从 localStorage 恢复
      const lastTaskId = localStorage.getItem('lastBatchTaskId')
      console.log('[恢复任务] 检查 localStorage:', lastTaskId)
      
      let taskToRestore = null
      
      if (lastTaskId) {
        // 如果有 localStorage 中的任务 ID，先尝试恢复它
        try {
          console.log('[恢复任务] 从 localStorage 获取任务状态:', lastTaskId)
          const response = await fetch(`/api/admin/batch-generation/status/${lastTaskId}`)
          const result = await response.json()
          
          if (response.ok && result.task && ['pending', 'processing', 'paused'].includes(result.task.status)) {
            taskToRestore = { ...result.task, id: lastTaskId }
            console.log('[恢复任务] 从 localStorage 找到任务:', taskToRestore.id)
          } else if (response.status === 404) {
            // 任务不存在，清除 localStorage
            console.log('[恢复任务] localStorage 中的任务不存在，清除')
            localStorage.removeItem('lastBatchTaskId')
            // 重置状态
            setIsProcessing(false)
            setIsPaused(false)
            setTasks([])
          } else if (!response.ok) {
            // 如果请求失败（如 500 错误），也重置状态
            console.log('[恢复任务] 获取任务状态失败，重置状态')
            localStorage.removeItem('lastBatchTaskId')
            setIsProcessing(false)
            setIsPaused(false)
            setTasks([])
          }
        } catch (error) {
          console.error('[恢复任务] 从 localStorage 恢复失败:', error)
          // 发生错误时也重置状态
          localStorage.removeItem('lastBatchTaskId')
          setIsProcessing(false)
          setIsPaused(false)
          setTasks([])
        }
      }
      
      // 如果 localStorage 没有任务，尝试从数据库查询最近的任务
      if (!taskToRestore) {
        try {
          console.log('[恢复任务] 从数据库查询最近的任务')
          const response = await fetch('/api/admin/batch-generation/latest')
          const result = await response.json()
          
          if (response.ok && result.task && ['pending', 'processing', 'paused'].includes(result.task.status)) {
            taskToRestore = result.task
            console.log('[恢复任务] 从数据库找到任务:', taskToRestore.id)
            // 保存到 localStorage 以便下次使用
            localStorage.setItem('lastBatchTaskId', taskToRestore.id)
          } else {
            console.log('[恢复任务] 数据库中没有正在运行的任务')
            // 确保重置状态
            setIsProcessing(false)
            setIsPaused(false)
            setTasks([])
          }
        } catch (error) {
          console.error('[恢复任务] 从数据库查询失败:', error)
          // 发生错误时也重置状态
          setIsProcessing(false)
          setIsPaused(false)
          setTasks([])
        }
      }
      
      // 如果找到了任务，恢复它
      if (taskToRestore) {
        const task = taskToRestore
        console.log('[恢复任务] 开始恢复任务:', task.id, '状态:', task.status)
        setActiveTaskId(task.id)
        setLastUpdatedAt(task.updated_at || null)
        
        // 恢复任务状态
        setIsProcessing(true)
        setProcessingIndex(task.current_industry_index || 0)
        
        // 恢复行业列表和任务列表
        if (task.industries && Array.isArray(task.industries)) {
          setSelectedIndustries(task.industries)
          setScenesPerIndustry(task.scenes_per_industry || 100)
          setUseCaseType(task.use_case_type || 'advertising-promotion')
          
          // 重建任务列表
          const restoredTasks: IndustryTask[] = task.industries.map((industry: string, index: number) => {
            const isCompleted = index < (task.current_industry_index || 0)
            const isProcessing = index === (task.current_industry_index || 0)
            
            return {
              id: `${index}`,
              industry,
              status: isCompleted ? 'completed' : isProcessing ? 'processing' : 'pending',
              savedCount: isCompleted ? (task.scenes_per_industry || 100) : undefined,
            }
          })
          
          setTasks(restoredTasks)
          console.log('[恢复任务] 已恢复任务列表，共', restoredTasks.length, '个行业')
        }
        
        // 恢复暂停状态
        if (task.status === 'paused') {
          setIsPaused(true)
          isPausedRef.current = true
        } else {
          setIsPaused(false)
          isPausedRef.current = false
        }
        
        // 开始轮询
        startPollingTaskStatus(task.id)
        onShowBanner('info', `检测到正在运行的任务，已恢复监控 (${task.current_industry_index || 0}/${task.total_industries || 0})`)
      } else {
        console.log('[恢复任务] 没有找到需要恢复的任务')
        // 确保重置状态，允许用户开始新任务
        setIsProcessing(false)
        setIsPaused(false)
        setTasks([])
        shouldStopRef.current = false
        isPausedRef.current = false
      }
    }
    
    // 延迟一点执行，确保组件完全加载
    const timer = setTimeout(() => {
      restoreTask()
    }, 500)
    
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 暂停/恢复/终止任务（调用后台 API）
  const handlePause = async () => {
    const lastTaskId = localStorage.getItem('lastBatchTaskId')
    if (!lastTaskId) {
      onShowBanner('error', '未找到任务 ID')
      return
    }

    try {
      const action = isPaused ? 'resume' : 'pause'
      const response = await fetch('/api/admin/batch-generation/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: lastTaskId,
          action,
        }),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || '操作失败')
      }

      setIsPaused(!isPaused)
      isPausedRef.current = !isPausedRef.current
      onShowBanner('success', result.message || (action === 'pause' ? '任务已暂停' : '任务已恢复'))
    } catch (error) {
      console.error('操作任务失败:', error)
      onShowBanner('error', error instanceof Error ? error.message : '操作失败')
    }
  }

  const handleStop = async () => {
    const lastTaskId = localStorage.getItem('lastBatchTaskId')
    if (!lastTaskId) {
      onShowBanner('error', '未找到任务 ID')
      return
    }

    try {
      const response = await fetch('/api/admin/batch-generation/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: lastTaskId,
          action: 'cancel',
        }),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || '操作失败')
      }

      setIsProcessing(false)
      shouldStopRef.current = true
      
      // 清除 localStorage
      localStorage.removeItem('lastBatchTaskId')
      
      // 重置任务状态
      setTasks([])
      setProcessingIndex(-1)
      
      onShowBanner('success', result.message || '任务已终止')
    } catch (error) {
      console.error('终止任务失败:', error)
      onShowBanner('error', error instanceof Error ? error.message : '终止失败')
    }
  }

  const handleRecover = async () => {
    const taskId = activeTaskId || localStorage.getItem('lastBatchTaskId')
    if (!taskId) {
      onShowBanner('error', '未找到任务 ID')
      return
    }

    try {
      const response = await fetch('/api/admin/batch-generation/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, force: true }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(result?.error || '恢复失败')
      }
      onShowBanner('info', '已触发恢复：后台将继续处理队列/下一个行业')
    } catch (error) {
      console.error('恢复任务失败:', error)
      onShowBanner('error', error instanceof Error ? error.message : '恢复失败')
    }
  }

  // 计算成本
  const calculateCost = () => {
    const totalScenes = selectedIndustries.length * scenesPerIndustry
    const apiCalls = selectedIndustries.length // 每个行业一次 API 调用
    const totalCredits = apiCalls * 26 // 每次调用约 26 积分
    const cost = totalCredits * 0.00008
    return { totalScenes, apiCalls, totalCredits, cost }
  }

  const costInfo = calculateCost()

  return (
    <Card>
      <CardHeader>
        <CardTitle>行业场景词批量生成（10,000 条内容计划）</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 配置选项 */}
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              每个行业生成数量
            </label>
            <Input
              type="number"
              min="10"
              max="200"
              value={scenesPerIndustry}
              onChange={(e) => setScenesPerIndustry(Math.min(200, Math.max(10, parseInt(e.target.value) || 100)))}
              disabled={isProcessing}
            />
            <p className="mt-1 text-xs text-gray-500">建议：100 条/行业</p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              使用场景类型
            </label>
            <select
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
              value={useCaseType}
              onChange={(e) => setUseCaseType(e.target.value)}
              disabled={isProcessing}
            >
              <option value="advertising-promotion">Advertising & Promotion</option>
              <option value="social-media-content">Social Media Content</option>
              <option value="product-demo-showcase">Product Demo & Showcase</option>
              <option value="brand-storytelling">Brand Storytelling</option>
              <option value="education-explainer">Education & Explainer</option>
              <option value="ugc-creator-content">UGC & Creator Content</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              快速选择
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  // 全选
                  setSelectedIndustries([...currentIndustries])
                }}
                disabled={isProcessing}
                className="rounded border border-blue-500 bg-blue-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
              >
                ✓ 全选
              </button>
              <button
                type="button"
                onClick={() => {
                  // 全不选
                  setSelectedIndustries([])
                }}
                disabled={isProcessing}
                className="rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
              >
                ✗ 全不选
              </button>
              <button
                type="button"
                onClick={() => setSelectedIndustries(currentIndustries.slice(0, 10).map(i => i))}
                disabled={isProcessing}
                className="rounded border border-gray-300 bg-white px-2 py-1 text-xs hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800"
              >
                前 10 个
              </button>
              <button
                type="button"
                onClick={() => setSelectedIndustries(currentIndustries.slice(0, 50).map(i => i))}
                disabled={isProcessing}
                className="rounded border border-gray-300 bg-white px-2 py-1 text-xs hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800"
              >
                前 50 个
              </button>
              <button
                type="button"
                onClick={() => setSelectedIndustries(prioritizedIndustries)}
                disabled={isProcessing}
                className="rounded border border-purple-500 bg-purple-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-600 dark:bg-purple-600 dark:hover:bg-purple-700"
                title="选择S/A+/A级优先行业（推荐）"
              >
                ⭐ 优先行业 ({prioritizedIndustries.length})
              </button>
            </div>
          </div>
        </div>

        {/* 成本估算 */}
        <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
          <div className="font-medium text-green-800 dark:text-green-200">
            💰 成本估算
          </div>
          <div className="mt-2 space-y-1 text-sm text-green-700 dark:text-green-300">
            <div>选择行业：{selectedIndustries.length} 个</div>
            <div>总场景词数：{costInfo.totalScenes} 条</div>
            <div>API 调用次数：{costInfo.apiCalls} 次</div>
            <div>预计消耗：{costInfo.totalCredits} 积分</div>
            <div className="font-semibold">预计成本：¥{costInfo.cost.toFixed(4)} 元</div>
            <div className="mt-2 text-xs text-green-600 dark:text-green-400">
              💡 提示：每个行业一次 API 调用生成 {scenesPerIndustry} 条场景词，成本极低
            </div>
          </div>
        </div>

        {/* 模式切换和视图切换 */}
        <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">模式切换：</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIndustryMode('marketing')}
                disabled={isProcessing}
                className={`rounded-lg border px-4 py-1.5 text-sm font-medium transition ${
                  industryMode === 'marketing'
                    ? 'border-energy-water bg-energy-water text-white'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200'
                }`}
              >
                🎯 营销场景 ({INDUSTRIES_100.length})
              </button>
              <button
                type="button"
                onClick={() => setIndustryMode('traditional')}
                disabled={isProcessing}
                className={`rounded-lg border px-4 py-1.5 text-sm font-medium transition ${
                  industryMode === 'traditional'
                    ? 'border-energy-water bg-energy-water text-white'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200'
                }`}
              >
                📊 传统行业 ({INDUSTRIES_TRADITIONAL.length})
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">视图切换：</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                disabled={isProcessing}
                className={`rounded-lg border px-4 py-1.5 text-sm font-medium transition ${
                  viewMode === 'grid'
                    ? 'border-energy-water bg-energy-water text-white'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200'
                }`}
              >
                ⊞ 网格
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                disabled={isProcessing}
                className={`rounded-lg border px-4 py-1.5 text-sm font-medium transition ${
                  viewMode === 'list'
                    ? 'border-energy-water bg-energy-water text-white'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200'
                }`}
              >
                ☰ 列表
              </button>
            </div>
          </div>
        </div>

        {/* 行业选择 */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              选择行业（已选择 {selectedIndustries.length} / {currentIndustries.length}）
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedIndustries([...currentIndustries])}
                disabled={isProcessing}
                className="rounded border border-blue-500 bg-blue-500 px-3 py-1 text-xs font-medium text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
              >
                ✓ 全选
              </button>
              <button
                type="button"
                onClick={() => setSelectedIndustries([])}
                disabled={isProcessing}
                className="rounded border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
              >
                ✗ 全不选
              </button>
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto rounded-lg border border-gray-200 p-3 dark:border-gray-700">
            {viewMode === 'grid' ? (
              <div className="flex flex-wrap gap-2">
                {currentIndustries.map((industry) => {
                  const seoBadge = getIndustryBadge(industry)
                  const businessBadge = getBusinessTierBadge(industry)
                  const isRecommended = shouldRecommendIndustry(industry)
                  
                  return (
                    <button
                      key={industry}
                      type="button"
                      onClick={() => {
                        setSelectedIndustries((prev) =>
                          prev.includes(industry)
                            ? prev.filter((i) => i !== industry)
                            : [...prev, industry]
                        )
                      }}
                      disabled={isProcessing}
                      className={`group relative rounded-lg border px-3 py-1.5 text-sm transition ${
                        selectedIndustries.includes(industry)
                          ? 'border-energy-water bg-energy-water text-white'
                          : isRecommended
                          ? 'border-purple-300 bg-purple-50 text-gray-800 hover:bg-purple-100 dark:border-purple-700 dark:bg-purple-900/20 dark:text-gray-200 dark:hover:bg-purple-900/30'
                          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200'
                      }`}
                      title={isRecommended ? '推荐行业（S/A+/A级）' : undefined}
                    >
                      <div className="flex items-center gap-2">
                        <span>{industry}</span>
                        {seoBadge && (
                          <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${seoBadge.color} ${seoBadge.bgColor}`}>
                            {seoBadge.label}
                          </span>
                        )}
                        {businessBadge && (
                          <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${businessBadge.color} ${businessBadge.bgColor}`} title={businessBadge.label}>
                            {businessBadge.icon}
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="space-y-1">
                {currentIndustries.map((industry) => {
                  const seoBadge = getIndustryBadge(industry)
                  const businessBadge = getBusinessTierBadge(industry)
                  const isRecommended = shouldRecommendIndustry(industry)
                  
                  return (
                    <button
                      key={industry}
                      type="button"
                      onClick={() => {
                        setSelectedIndustries((prev) =>
                          prev.includes(industry)
                            ? prev.filter((i) => i !== industry)
                            : [...prev, industry]
                        )
                      }}
                      disabled={isProcessing}
                      className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition ${
                        selectedIndustries.includes(industry)
                          ? 'border-energy-water bg-energy-water text-white'
                          : isRecommended
                          ? 'border-purple-300 bg-purple-50 text-gray-800 hover:bg-purple-100 dark:border-purple-700 dark:bg-purple-900/20 dark:text-gray-200 dark:hover:bg-purple-900/30'
                          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200'
                      }`}
                      title={isRecommended ? '推荐行业（S/A+/A级）' : undefined}
                    >
                      <div className="flex items-center gap-2">
                        <span>{industry}</span>
                        {seoBadge && (
                          <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${seoBadge.color} ${seoBadge.bgColor}`}>
                            {seoBadge.label}
                          </span>
                        )}
                        {businessBadge && (
                          <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${businessBadge.color} ${businessBadge.bgColor}`} title={businessBadge.label}>
                            {businessBadge.icon}
                          </span>
                        )}
                      </div>
                      {selectedIndustries.includes(industry) && (
                        <span className="ml-2 text-xs">✓</span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-4">
          {!isProcessing ? (
            <Button
              onClick={handleBatchGenerate}
              disabled={selectedIndustries.length === 0}
              className="bg-energy-water hover:bg-energy-water/90"
            >
              开始批量生成 ({selectedIndustries.length} 个行业 × {scenesPerIndustry} 条 = {costInfo.totalScenes} 条)
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button 
                onClick={handlePause} 
                variant={isPaused ? "secondary" : "outline"}
                className={isPaused ? "bg-yellow-500 hover:bg-yellow-600 text-white" : ""}
              >
                {isPaused ? '▶️ 恢复生成' : '⏸️ 暂停生成'}
              </Button>
              <Button onClick={handleRecover} variant="outline">
                🔧 恢复卡住
              </Button>
              <Button 
                onClick={handleStop} 
                variant="danger"
              >
                ⏹️ 终止生成
              </Button>
            </div>
          )}
        </div>

        {/* 自动恢复开关 + 最后更新时间 */}
        {isProcessing && (
          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={autoRecoverStuck}
                onChange={(e) => setAutoRecoverStuck(e.target.checked)}
              />
              自动恢复卡住（10分钟无更新）
            </label>
            <div>
              最后更新：
              {lastUpdatedAt
                ? `${Math.max(0, Math.round((Date.now() - new Date(lastUpdatedAt).getTime()) / 60000))} 分钟前`
                : '未知'}
            </div>
          </div>
        )}

        {/* 任务状态 */}
        {tasks.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              生成进度 (已完成行业数 / 总行业数)：{tasks.filter((t) => t.status === 'completed').length} / {tasks.length}
            </div>
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {tasks.map((task, index) => (
                <div
                  key={task.id}
                  className={`rounded-lg border p-3 ${
                    task.status === 'saved'
                      ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                      : task.status === 'processing'
                        ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
                        : task.status === 'failed'
                          ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                          : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {index + 1}. {task.industry}
                      </div>
                      <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                        {task.status === 'processing' && (
                          task.isSaving && task.generatedCount !== undefined
                            ? `已生成 ${task.generatedCount} 条场景词，正在保存... (已保存 ${task.savedCount || 0} 条)`
                            : task.savedCount !== undefined && task.savedCount > 0
                            ? `正在生成场景词... (已保存 ${task.savedCount} 条)`
                            : '正在生成场景词...'
                        )}
                        {task.status === 'completed' && task.savedCount !== undefined && task.savedCount > 0 && `✅ 已完成，已保存 ${task.savedCount} 条场景词`}
                        {task.status === 'completed' && (task.savedCount === undefined || task.savedCount === 0) && '⚠️ 生成返回 0 条场景词，已自动切换到联网搜索模型...'}
                        {task.status === 'saved' && `✅ 已保存 ${task.savedCount || 0} 条场景词`}
                        {task.status === 'failed' && `❌ 失败: ${task.error}`}
                        {task.status === 'pending' && '等待处理...'}
                      </div>
                    </div>
                    {task.status === 'processing' && index === processingIndex && (
                      <div className="ml-4 h-4 w-4 animate-spin rounded-full border-2 border-energy-water border-t-transparent" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

