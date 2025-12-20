import { NextRequest, NextResponse } from 'next/server'
import { validateAdminSession } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * POST /api/admin/batch-generation/start
 * 启动批量生成任务（后台任务）
 */
export async function POST(request: NextRequest) {
  try {
    const adminUser = await validateAdminSession()
    if (!adminUser) {
      return NextResponse.json({ error: '未授权，请先登录' }, { status: 401 })
    }

    const body = await request.json()
    const {
      industries,
      scenesPerIndustry = 100,
      useCaseType = 'social-media',
    } = body

    if (!Array.isArray(industries) || industries.length === 0) {
      return NextResponse.json({ error: '请至少选择一个行业' }, { status: 400 })
    }

    const supabase = await createServiceClient()

    // 创建任务记录
    // 使用类型断言修复 Supabase 类型推断问题
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: task, error: createError } = await (supabase.from('batch_generation_tasks') as any)
      .insert({
        admin_user_id: adminUser.id,
        task_type: 'industry_scenes',
        industries,
        scenes_per_industry: scenesPerIndustry,
        use_case_type: useCaseType,
        status: 'pending',
        total_industries: industries.length,
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (createError || !task) {
      console.error('[batch-generation/start] 创建任务失败:', createError)
      return NextResponse.json(
        { error: '创建任务失败', details: createError?.message },
        { status: 500 }
      )
    }

    // 立即开始处理任务（使用链式调用，避免超时）
    // 通过 API 调用处理第一个行业，然后递归调用处理后续行业
    setTimeout(async () => {
      try {
        const processUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/admin/batch-generation/process`
        await fetch(processUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskId: task.id }),
        })
      } catch (error) {
        console.error('[batch-generation/start] 启动处理失败:', error)
        // 如果启动失败，更新任务状态
        const supabase = await createServiceClient()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('batch_generation_tasks') as any)
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : '启动处理失败',
            updated_at: new Date().toISOString(),
          })
          .eq('id', task.id)
      }
    }, 0)

    return NextResponse.json({
      success: true,
      task: {
        id: task.id,
        status: task.status,
        total_industries: task.total_industries,
        created_at: task.created_at,
      },
      message: '任务已启动，将在后台持续运行',
    })
  } catch (error) {
    console.error('[batch-generation/start] 异常:', error)
    return NextResponse.json(
      {
        error: '启动任务失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    )
  }
}

/**
 * 处理批量生成任务（后台执行）
 */
async function processBatchGenerationTask(taskId: string) {
  const supabase = await createServiceClient()
  
  // 辅助函数：修复 Supabase 类型推断问题
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tasksTable = () => supabase.from('batch_generation_tasks') as any

  try {
    // 获取任务
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: task, error: fetchError } = await (supabase.from('batch_generation_tasks') as any)
      .select('*')
      .eq('id', taskId)
      .single()

    if (fetchError || !task) {
      console.error(`[processBatchGenerationTask] 获取任务失败:`, fetchError)
      return
    }

    // 更新状态为处理中
    await tasksTable()
      .update({
        status: 'processing',
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId)

    const industries = task.industries || []
    const scenesPerIndustry = task.scenes_per_industry || 100
    const useCaseType = task.use_case_type || 'social-media'

    let totalSaved = 0

    // 处理每个行业
    for (let i = task.current_industry_index || 0; i < industries.length; i++) {
      const industry = industries[i]

      // 检查是否应该停止
      const { data: currentTask } = await tasksTable()
        .select('should_stop, is_paused, status')
        .eq('id', taskId)
        .single()

      if (currentTask?.should_stop || currentTask?.status === 'cancelled') {
        await tasksTable()
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString(),
          })
          .eq('id', taskId)
        break
      }

      // 检查是否暂停
      if (currentTask?.is_paused) {
        await tasksTable()
          .update({
            status: 'paused',
            updated_at: new Date().toISOString(),
          })
          .eq('id', taskId)
        
        // 等待恢复
        while (currentTask?.is_paused && !currentTask?.should_stop) {
          await new Promise((resolve) => setTimeout(resolve, 1000))
          const { data: checkTask } = await tasksTable()
            .select('is_paused, should_stop')
            .eq('id', taskId)
            .single()
          
          if (checkTask && !checkTask.is_paused) {
            await tasksTable()
              .update({
                status: 'processing',
                updated_at: new Date().toISOString(),
              })
              .eq('id', taskId)
            break
          }
        }
      }

      try {
        // 生成场景词（调用现有的生成逻辑）
        const scenes = await generateIndustryScenes(industry, scenesPerIndustry, useCaseType)
        
        // 保存场景词（带重试机制）
        for (let j = 0; j < scenes.length; j++) {
          const scene = scenes[j]
          
          // 检查是否应该停止
          const { data: checkTask } = await tasksTable()
            .select('should_stop, status')
            .eq('id', taskId)
            .single()
          
          if (checkTask?.should_stop || checkTask?.status === 'cancelled') {
            break
          }

          let retryCount = 0
          const maxRetries = 3
          
          while (retryCount <= maxRetries) {
            try {
              await saveSceneToDatabase(industry, scene, useCaseType, supabase)
              totalSaved++
              break // 成功，退出重试循环
            } catch (error) {
              retryCount++
              if (retryCount > maxRetries) {
                console.error(`[${industry}] 保存场景词 ${j + 1} 最终失败:`, error)
                break
              }
              
              // 延迟后重试
              const retryDelay = 1000 * retryCount
              console.warn(`[${industry}] 保存场景词 ${j + 1} 失败，${retryDelay}ms 后重试 (${retryCount}/${maxRetries})...`)
              await new Promise((resolve) => setTimeout(resolve, retryDelay))
            }
          }
          
          // 避免请求过快（动态延迟）
          if (j < scenes.length - 1) {
            const delay = j < 10 ? 200 : j < 50 ? 150 : 100
            await new Promise((resolve) => setTimeout(resolve, delay))
          }
          
          // 每保存 10 条更新一次进度
          if ((j + 1) % 10 === 0 || j === scenes.length - 1) {
            await tasksTable()
              .update({
                total_scenes_saved: totalSaved,
                updated_at: new Date().toISOString(),
              })
              .eq('id', taskId)
          }
        }

        // 更新进度
        const progress = Math.round(((i + 1) / industries.length) * 100)
        await tasksTable()
          .update({
            current_industry_index: i + 1,
            total_scenes_generated: (task.total_scenes_generated || 0) + scenes.length,
            total_scenes_saved: totalSaved,
            progress,
            updated_at: new Date().toISOString(),
            last_error: null,
          })
          .eq('id', taskId)

      } catch (error) {
        console.error(`[${industry}] 处理失败:`, error)
        await tasksTable()
          .update({
            last_error: error instanceof Error ? error.message : '未知错误',
            updated_at: new Date().toISOString(),
          })
          .eq('id', taskId)
      }
    }

    // 完成任务
    await tasksTable()
      .update({
        status: 'completed',
        progress: 100,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId)

  } catch (error) {
    console.error(`[processBatchGenerationTask] 任务处理异常:`, error)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tasksTable = () => supabase.from('batch_generation_tasks') as any
    await tasksTable()
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : '未知错误',
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId)
  }
}

/**
 * 生成行业场景词（复用现有逻辑）
 */
async function generateIndustryScenes(
  industry: string,
  scenesPerIndustry: number,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _useCaseType: string // 保留参数以保持接口一致性
): Promise<Array<{ id: number; use_case: string }>> {
  const { createChatCompletion } = await import('@/lib/grsai/client')
  
  const systemPrompt = `You are an SEO expert specializing in AI video generation use cases. Generate highly specific, practical, real-world use cases for AI video generation. All output must be in English.

CRITICAL: The AI video platform ONLY supports 10-second or 15-second videos. NEVER mention any duration longer than 15 seconds (such as 20 seconds, 30 seconds, 45 seconds, 60 seconds, 1 minute, 2 minutes, etc.). When describing video examples, ALWAYS use "10 seconds" or "15 seconds" only.`

  // 如果数量超过 50，分批生成
  const batchSize = Math.min(scenesPerIndustry, 50)
  const batches = Math.ceil(scenesPerIndustry / batchSize)
  const allScenes: Array<{ id: number; use_case: string }> = []

  for (let batch = 0; batch < batches; batch++) {
    const currentBatchSize = batch === batches - 1 
      ? scenesPerIndustry - (batch * batchSize) 
      : batchSize

    const userPrompt = `Generate ${currentBatchSize} highly specific, practical, real-world use cases for AI video generation for the following industry:

Industry: ${industry}

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
- IMPORTANT: When mentioning video duration, ALWAYS use "10 seconds" or "15 seconds" ONLY. NEVER mention "20 seconds", "30 seconds", "45 seconds", "60 seconds", "1 minute", "2 minutes", or any duration longer than 15 seconds.
- Format as a clean JSON array: 
[
  {"id": 1, "use_case": "Detailed 300-500 character description including scenario, pain point, why AI video, and example prompt (video duration: 10 seconds or 15 seconds ONLY)"},
  {"id": 2, "use_case": "..."},
  ...
  {"id": ${currentBatchSize}, "use_case": "..."}
]
Do not include explanations. Output only the JSON.`

    try {
      const response = await createChatCompletion({
        model: 'gemini-2.5-flash',
        stream: false,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      })

      const content = response.choices?.[0]?.message?.content || ''
      if (!content) {
        throw new Error('生成的内容为空')
      }

      // 解析 JSON
      const jsonContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      let scenes: Array<{ id: number; use_case: string }> = []
      
      try {
        scenes = JSON.parse(jsonContent)
      } catch {
        // 尝试修复 JSON
        const jsonMatch = jsonContent.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          scenes = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('无法解析 JSON')
        }
      }

      // 调整 ID 以保持连续性
      scenes.forEach((scene, idx) => {
        scene.id = batch * batchSize + idx + 1
      })
      
      allScenes.push(...scenes.filter(s => s && s.use_case && s.use_case.trim().length > 50))

      // 批次之间稍作延迟
      if (batch < batches - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    } catch (error) {
      console.error(`[${industry}] 批次 ${batch + 1} 生成失败:`, error)
      throw error
    }
  }

  return allScenes.slice(0, scenesPerIndustry)
}

/**
 * 保存场景词到数据库（复用现有逻辑）
 */
async function saveSceneToDatabase(
  industry: string,
  scene: { id: number; use_case: string },
  useCaseType: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
) {
  const { generateSlugFromText } = await import('@/lib/utils/slug')
  const { checkContentQuality } = await import('@/lib/utils/content-quality')

  // 从场景词中提取关键词作为标题
  const title = scene.use_case.length > 100 
    ? scene.use_case.substring(0, 100) + '...'
    : scene.use_case
  
  // 生成 slug，确保不会太长
  const sceneText = scene.use_case.length > 80 
    ? scene.use_case.substring(0, 80) 
    : scene.use_case
  const slug = generateSlugFromText(`${industry}-${sceneText}`)
  
  // 生成 H1 和描述
  const h1 = `AI Video Generation for ${scene.use_case} in ${industry}`
  const description = `Learn how to use AI video generation for ${scene.use_case} in the ${industry} industry. Create professional videos with Sora2.`

  // 生成完整内容
  const content = `# ${h1}

## Introduction

${scene.use_case}

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
  const qualityCheck = checkContentQuality({
    title,
    h1,
    description,
    content,
    seo_keywords: [scene.use_case, industry, `${industry} AI video`],
  })

  // 根据质量检查结果设置状态
  const qualityStatus = qualityCheck.passed && qualityCheck.score >= 70 ? 'approved' : 'pending'
  const isPublished = qualityStatus === 'approved'

  // 直接使用 Supabase 保存（避免 HTTP 调用）
  const { error: insertError } = await supabase
    .from('use_cases')
    .insert({
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
    })

  if (insertError) {
    // 如果是重复 slug，尝试添加后缀
    if (insertError.code === '23505') {
      const newSlug = `${slug}-${Date.now()}`
      const { error: retryError } = await supabase
        .from('use_cases')
        .insert({
          slug: newSlug,
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
        })
      
      if (retryError) {
        throw new Error(`保存失败: ${retryError.message}`)
      }
    } else {
      throw new Error(`保存失败: ${insertError.message}`)
    }
  }
}

