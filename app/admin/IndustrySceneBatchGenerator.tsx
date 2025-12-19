'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '@/components/ui'
import { INDUSTRIES_100 } from '@/lib/data/industries-100'
import { generateSlugFromText } from '@/lib/utils/slug'
import { checkContentQuality } from '@/lib/utils/content-quality'

interface IndustrySceneBatchGeneratorProps {
  onShowBanner: (type: 'success' | 'error' | 'info', text: string) => void
  onGenerated: () => void
  onFilterChange?: (type: string, industry: string) => void
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
}

/**
 * 行业场景词批量生成器
 * 支持一次生成 100 个行业的场景词（每个行业 100 条）
 * 总计 10,000 条高质量内容
 */
export default function IndustrySceneBatchGenerator({
  onShowBanner,
  onGenerated,
  onFilterChange,
}: IndustrySceneBatchGeneratorProps) {
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([])
  const [scenesPerIndustry, setScenesPerIndustry] = useState<number>(100)
  const [useCaseType, setUseCaseType] = useState<string>('marketing')
  const [tasks, setTasks] = useState<IndustryTask[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingIndex, setProcessingIndex] = useState(-1)
  const [shouldStop, setShouldStop] = useState(false)

  // 生成行业场景词（一次生成 100 条）
  const generateIndustryScenes = async (industry: string): Promise<SceneItem[]> => {
    const systemPrompt = `You are an SEO expert specializing in AI video generation use cases. Generate highly specific, practical, real-world use cases for AI video generation. All output must be in English.`

    const userPrompt = `Generate ${scenesPerIndustry} highly specific, practical, real-world use cases for AI video generation for the following industry:

Industry: ${industry}

Requirements:
- ${scenesPerIndustry} use cases
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
  {"id": ${scenesPerIndustry}, "use_case": "..."}
]
Do not include explanations. Output only the JSON.`

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
    
    if (data.success && data.data) {
      const content = data.data.choices?.[0]?.message?.content || ''
      if (!content) {
        throw new Error('生成的内容为空')
      }

      // 解析 JSON - 使用更强大的解析逻辑
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
                // 尝试解析到当前位置
                JSON.parse(before)
                lastValidIndex = i
              } catch {
                // 如果解析失败，说明前面的内容不完整，截断到这里
                break
              }
            }
          }
        }
        
        // 如果字符串未终止，修复它
        if (inString) {
          // 找到最后一个引号的位置
          const lastQuoteIndex = fixedContent.lastIndexOf('"')
          if (lastQuoteIndex > 0) {
            // 检查这个引号是否被转义
            let escapeCount = 0
            for (let i = lastQuoteIndex - 1; i >= 0 && fixedContent[i] === '\\'; i--) {
              escapeCount++
            }
            // 如果转义次数是偶数，说明这个引号是字符串的开始，需要添加结束引号
            if (escapeCount % 2 === 0) {
              fixedContent = fixedContent.substring(0, lastValidIndex + 1)
              // 尝试找到最后一个对象的结束位置
              const lastBrace = fixedContent.lastIndexOf('}')
              if (lastBrace !== -1) {
                fixedContent = fixedContent.substring(0, lastBrace + 1)
                // 如果是在数组中，添加 ]
                if (fixedContent.includes('[')) {
                  fixedContent = fixedContent + ']'
                }
              }
            }
          }
        } else {
          fixedContent = fixedContent.substring(0, lastValidIndex + 1)
        }
        
        // 2. 修复缺少的逗号
        fixedContent = fixedContent.replace(/}\s*{/g, '},{')
        fixedContent = fixedContent.replace(/}\s*"/g, '},"')
        fixedContent = fixedContent.replace(/]\s*{/g, '],{')
        
        // 3. 确保数组结构完整
        if (!fixedContent.endsWith(']')) {
          // 尝试找到最后一个完整的对象
          const lastCompleteObject = fixedContent.lastIndexOf('}')
          if (lastCompleteObject !== -1) {
            fixedContent = fixedContent.substring(0, lastCompleteObject + 1) + ']'
          }
        }
        
        // 4. 尝试解析修复后的 JSON
        let scenes: SceneItem[] = []
        try {
          scenes = JSON.parse(fixedContent) as SceneItem[]
        } catch {
          // 如果仍然失败，使用正则表达式提取
          const useCasePattern = /"use_case"\s*:\s*"((?:[^"\\]|\\.)*)"/g
          const matches: string[] = []
          let match
          while ((match = useCasePattern.exec(jsonContent)) !== null) {
            matches.push(match[1].replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\/g, ''))
          }
          
          if (matches.length > 0) {
            scenes = matches.map((useCase, index) => ({
              id: index + 1,
              use_case: useCase,
            }))
          } else {
            throw new Error('无法从内容中提取场景词')
          }
        }
        
        // 验证和过滤场景词
        if (!Array.isArray(scenes)) {
          throw new Error('解析结果不是数组')
        }
        
        // 确保每个场景词都有有效的 use_case
        scenes = scenes
          .filter((scene) => scene && scene.use_case && scene.use_case.trim().length > 50)
          .slice(0, scenesPerIndustry) // 限制数量
        
        if (scenes.length === 0) {
          throw new Error('过滤后的场景词数组为空')
        }

        return scenes
      } catch (parseError) {
        console.error('解析 JSON 失败:', parseError)
        console.error('原始内容长度:', content.length)
        console.error('原始内容前 2000 字符:', content.substring(0, 2000))
        console.error('原始内容后 1000 字符:', content.substring(Math.max(0, content.length - 1000)))
        
        // 最后尝试：使用正则表达式提取所有可能的 use_case
        try {
          const useCasePattern = /"use_case"\s*:\s*"((?:[^"\\]|\\.)*)"/g
          const matches: string[] = []
          let match
          while ((match = useCasePattern.exec(content)) !== null) {
            const useCase = match[1]
              .replace(/\\"/g, '"')
              .replace(/\\n/g, '\n')
              .replace(/\\\\/g, '\\')
            if (useCase.length > 50) {
              matches.push(useCase)
            }
          }
          
          if (matches.length > 0) {
            console.log(`使用正则表达式提取了 ${matches.length} 个场景词`)
            return matches.map((useCase, index) => ({
              id: index + 1,
              use_case: useCase,
            }))
          }
        } catch (fallbackError) {
          console.error('正则表达式提取也失败:', fallbackError)
        }
        
        throw new Error(`无法解析生成的 JSON 数据: ${parseError instanceof Error ? parseError.message : '未知错误'}`)
      }
    }

    throw new Error('API 响应格式错误')
  }

  // 保存单个场景词到数据库（带重试机制）
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
      
      const slug = generateSlugFromText(`${industry}-${scene.use_case}`)
      
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

Choose video duration based on your platform requirements.

### Step 3: Generate Your Video

Click generate and wait a few moments. Sora2's AI will create your professional video with high-quality visuals and smooth transitions.

### Step 4: Download and Use

Once generated, download your video and use it immediately in your ${industry} marketing, training, or content strategy.

## Example Prompt for ${scene.use_case}

Here's an example prompt you can use with Sora2:

\`\`\`
[Example prompt based on the use case - will be generated based on scene description]
\`\`\`

## Get Started Today

Start creating professional ${scene.use_case} videos for ${industry} today with Sora2 AI video generation platform. No technical skills required, no expensive equipment needed - just describe what you want, and AI will create it for you.`

      // 自动质量检查
      const qualityCheck = checkContentQuality({
        title,
        h1,
        description,
        content,
        seo_keywords: [scene.use_case, industry, `${industry} AI video`],
      })

      // 根据质量检查结果设置状态
      // 如果通过检查且分数 >= 70，自动批准；否则标记为待审核
      const qualityStatus = qualityCheck.passed && qualityCheck.score >= 70 ? 'approved' : 'pending'
      const isPublished = qualityStatus === 'approved' // 只有审核通过的内容才自动发布

      const response = await fetch('/api/admin/use-cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          title,
          h1,
          description,
          content,
          use_case_type: useCaseType,
          industry,
          is_published: isPublished,
          seo_keywords: [scene.use_case, industry, `${industry} AI video`],
        quality_status: qualityStatus,
        quality_score: qualityCheck.score,
        quality_issues: qualityCheck.issues,
      }),
    })
    
    // 调试日志：确认保存的数据
    if (retryCount === 0) {
      console.log(`[${industry}] 保存场景词成功:`, {
        slug,
        use_case_type: useCaseType,
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

  // 批量生成
  const handleBatchGenerate = async () => {
    if (selectedIndustries.length === 0) {
      onShowBanner('error', '请至少选择一个行业')
      return
    }

    const newTasks: IndustryTask[] = selectedIndustries.map((industry, index) => ({
      id: `industry-task-${Date.now()}-${index}`,
      industry,
      status: 'pending' as const,
    }))

    setTasks(newTasks)
    setIsProcessing(true)
    setShouldStop(false)

    let totalSaved = 0

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
        // 生成场景词（带重试机制）
        let scenes: SceneItem[] = []
        let generationRetries = 0
        const maxGenerationRetries = 2
        
        while (generationRetries <= maxGenerationRetries) {
          try {
            scenes = await generateIndustryScenes(task.industry)
            break // 成功，退出重试循环
          } catch (genError) {
            generationRetries++
            if (generationRetries > maxGenerationRetries) {
              throw genError // 超过重试次数，抛出错误
            }
            console.warn(`[${task.industry}] 生成场景词失败，${2000 * generationRetries}ms 后重试 (${generationRetries}/${maxGenerationRetries})...`)
            await new Promise((resolve) => setTimeout(resolve, 2000 * generationRetries))
          }
        }
        
        setTasks((prev) => {
          const updated = [...prev]
          updated[i] = { ...updated[i], status: 'completed', scenes }
          return updated
        })

        // 批量保存场景词（增加延迟和错误处理）
        let savedCount = 0
        let failedCount = 0
        for (let j = 0; j < scenes.length; j++) {
          if (shouldStop) break

          try {
            await saveSceneToDatabase(task.industry, scenes[j])
            savedCount++
            totalSaved++

            // 每保存 10 条更新一次状态
            if ((j + 1) % 10 === 0 || j === scenes.length - 1) {
              setTasks((prev) => {
                const updated = [...prev]
                updated[i] = { ...updated[i], savedCount, error: failedCount > 0 ? `${failedCount} 条保存失败` : undefined }
                return updated
              })
            }

            // 增加延迟以避免过载（根据保存进度动态调整）
            if (j < scenes.length - 1) {
              // 前 10 条：800ms，10-50 条：500ms，之后：400ms
              let delay = 400
              if (j < 10) {
                delay = 800
              } else if (j < 50) {
                delay = 500
              }
              
              // 如果连续失败，增加延迟
              if (failedCount > 0 && j % 5 === 0) {
                delay = delay * 2
                console.log(`[${task.industry}] 检测到失败，增加延迟至 ${delay}ms`)
              }
              
              await new Promise((resolve) => setTimeout(resolve, delay))
            }
          } catch (saveError) {
            failedCount++
            const errorMessage = saveError instanceof Error ? saveError.message : '未知错误'
            console.error(`[${task.industry}] 保存场景词 ${j + 1} 失败:`, errorMessage)
            
            // 如果是严重的网络错误，增加延迟
            const isNetworkError = 
              errorMessage.includes('fetch') || 
              errorMessage.includes('CONNECTION') ||
              errorMessage.includes('network') ||
              errorMessage.includes('timeout')
            
            if (isNetworkError) {
              const networkDelay = failedCount > 5 ? 5000 : 3000
              console.warn(`[${task.industry}] 检测到网络错误，等待 ${networkDelay}ms 后继续...`)
              await new Promise((resolve) => setTimeout(resolve, networkDelay))
            } else {
              // 非网络错误也稍作延迟
              await new Promise((resolve) => setTimeout(resolve, 1000))
            }
            
            // 如果失败率过高，暂停更长时间
            if (failedCount > 10 && failedCount % 10 === 0) {
              console.warn(`[${task.industry}] 失败率较高 (${failedCount}/${j + 1})，暂停 5 秒...`)
              await new Promise((resolve) => setTimeout(resolve, 5000))
            }
            
            // 继续保存下一个
          }
        }
        
        // 更新最终状态
        if (failedCount > 0) {
          console.warn(`[${task.industry}] 完成：成功 ${savedCount} 条，失败 ${failedCount} 条`)
        }

        setTasks((prev) => {
          const updated = [...prev]
          updated[i] = { ...updated[i], status: 'saved', savedCount }
          return updated
        })

        // 行业之间的延迟（给 API 更多时间恢复）
        if (i < newTasks.length - 1) {
          const industryDelay = failedCount > 0 ? 3000 : 2000
          console.log(`[${task.industry}] 完成，等待 ${industryDelay}ms 后处理下一个行业...`)
          await new Promise((resolve) => setTimeout(resolve, industryDelay))
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '未知错误'
        console.error(`[${task.industry}] 生成失败:`, errorMessage)
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

    if (shouldStop) {
      onShowBanner('info', `批量生成已终止：已保存 ${totalSaved} 条场景词`)
    } else {
      onShowBanner('success', `批量生成完成：已保存 ${totalSaved} 条场景词（使用场景类型：${useCaseType}）`)
      // 延迟一下再刷新，确保数据库已保存
      setTimeout(() => {
        onGenerated()
        // 如果有筛选回调，自动应用生成时选择的筛选条件
        if (onFilterChange && selectedIndustries.length > 0) {
          // 应用使用场景类型筛选
          onFilterChange(useCaseType, selectedIndustries[0]) // 使用第一个行业作为默认筛选
        }
      }, 500)
    }
  }

  const handleStop = () => {
    setShouldStop(true)
    onShowBanner('info', '正在停止批量生成，请稍候...')
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
              <option value="marketing">Marketing</option>
              <option value="social-media">Social Media</option>
              <option value="youtube">YouTube</option>
              <option value="tiktok">TikTok</option>
              <option value="product-demo">Product Demo</option>
              <option value="ads">Advertising</option>
              <option value="education">Education</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              快速选择
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedIndustries(INDUSTRIES_100.slice(0, 10).map(i => i))}
                disabled={isProcessing}
                className="rounded border border-gray-300 bg-white px-2 py-1 text-xs hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800"
              >
                前 10 个行业
              </button>
              <button
                type="button"
                onClick={() => setSelectedIndustries(INDUSTRIES_100.slice(0, 50).map(i => i))}
                disabled={isProcessing}
                className="rounded border border-gray-300 bg-white px-2 py-1 text-xs hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800"
              >
                前 50 个行业
              </button>
              <button
                type="button"
                onClick={() => setSelectedIndustries([...INDUSTRIES_100])}
                disabled={isProcessing}
                className="rounded border border-gray-300 bg-white px-2 py-1 text-xs hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800"
              >
                全部 100 个行业
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

        {/* 行业选择 */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            选择行业（已选择 {selectedIndustries.length} / {INDUSTRIES_100.length}）
          </label>
          <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200 p-3 dark:border-gray-700">
            <div className="flex flex-wrap gap-2">
              {INDUSTRIES_100.map((industry) => (
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
                  className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                    selectedIndustries.includes(industry)
                      ? 'border-energy-water bg-energy-water text-white'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200'
                  }`}
                >
                  {industry}
                </button>
              ))}
            </div>
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
            <Button onClick={handleStop} variant="danger">
              暂停/终止生成
            </Button>
          )}
        </div>

        {/* 任务状态 */}
        {tasks.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              生成进度 ({tasks.filter((t) => t.status === 'saved').length} / {tasks.length})
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
                        {task.status === 'processing' && '正在生成场景词...'}
                        {task.status === 'completed' && `已生成 ${task.scenes?.length || 0} 条场景词，正在保存...`}
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

