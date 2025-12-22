/**
 * 边生成边保存场景词（避免数据丢失和乱码）
 * 每生成一批场景词，立即保存，而不是等所有生成完成后再保存
 */
import type { Database } from '@/types/database'

/**
 * 🔥 错误分类和处理
 * 根据错误类型决定是否应该重试、是否应该停止生成
 */
function classifyGenerationError(error: Error): {
  shouldRetry: boolean
  shouldStop: boolean
  retryDelay: number
  errorMessage: string
  errorCategory: 'timeout' | 'network' | 'content_filter' | 'rate_limit' | 'server_error' | 'other'
} {
  const message = error.message.toLowerCase()
  
  // 超时错误 - 可以重试，但需要更长的延迟
  if (message.includes('超时') || message.includes('timeout')) {
    return {
      shouldRetry: true,
      shouldStop: false,
      retryDelay: 3000, // 3秒延迟
      errorMessage: 'API 调用超时，将重试',
      errorCategory: 'timeout',
    }
  }
  
  // 网络错误 - 可以重试
  if (message.includes('econnreset') || 
      message.includes('网络') || 
      message.includes('connection') ||
      message.includes('连接')) {
    return {
      shouldRetry: true,
      shouldStop: false,
      retryDelay: 2000, // 2秒延迟
      errorMessage: '网络连接错误，将重试',
      errorCategory: 'network',
    }
  }
  
  // 内容被过滤 - 不应该重试（会浪费积分）
  if (message.includes('被过滤') || 
      message.includes('content_filter') ||
      message.includes('被拒绝') ||
      message.includes('refused')) {
    return {
      shouldRetry: false,
      shouldStop: false, // 不停止，继续下一个批次
      retryDelay: 0,
      errorMessage: '内容被过滤，跳过此批次',
      errorCategory: 'content_filter',
    }
  }
  
  // 速率限制 - 应该等待后重试
  if (message.includes('429') || 
      message.includes('rate limit') ||
      message.includes('频率过高')) {
    return {
      shouldRetry: true,
      shouldStop: false,
      retryDelay: 5000, // 5秒延迟
      errorMessage: 'API 速率限制，等待后重试',
      errorCategory: 'rate_limit',
    }
  }
  
  // 服务器错误 - 可以重试
  if (message.includes('500') || 
      message.includes('502') || 
      message.includes('503') ||
      message.includes('服务器错误')) {
    return {
      shouldRetry: true,
      shouldStop: false,
      retryDelay: 4000, // 4秒延迟
      errorMessage: '服务器错误，将重试',
      errorCategory: 'server_error',
    }
  }
  
  // 其他错误 - 根据情况决定
  return {
    shouldRetry: false,
    shouldStop: false, // 不停止，继续下一个批次
    retryDelay: 0,
    errorMessage: error.message,
    errorCategory: 'other',
  }
}

export async function generateAndSaveScenes(
  industry: string,
  scenesPerIndustry: number,
  useCaseType: string,
  taskId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
): Promise<{
  scenes: Array<{ id: number; use_case: string }>
  savedCount: number
  failedCount: number
  errors: string[]
}> {
  const { createChatCompletion } = await import('@/lib/grsai/client')
  const { isColdIndustry, needsProModel } = await import('./detect-cold-industry')
  const { checkGenerationQuality } = await import('./check-generation-quality')
  
  const systemPrompt = `You are an SEO expert specializing in AI video generation use cases. Generate highly specific, practical, real-world use cases for AI video generation. All output must be in English.

CRITICAL: The AI video platform ONLY supports 10-second or 15-second videos. NEVER mention any duration longer than 15 seconds (such as 20 seconds, 30 seconds, 45 seconds, 60 seconds, 1 minute, 2 minutes, etc.). When describing video examples, ALWAYS use "10 seconds" or "15 seconds" only.`

  // 检测是否需要极端专业模型（Level 3）
  const needsPro = needsProModel(industry)
  if (needsPro) {
    console.log(`[${industry}] 检测到极端专业领域，直接使用 gemini-3-pro（最高质量）`)
  }
  
  // 检测是否为冷门行业（Level 2）
  const isCold = isColdIndustry(industry)
  if (isCold && !needsPro) {
    console.log(`[${industry}] 检测到冷门行业，直接使用 gemini-3-flash（联网搜索）`)
  }

  // 🔥 减少批次大小，避免内存和超时问题（从50改为30）
  // 如果数量超过 30，分批生成（每批立即保存）
  const batchSize = Math.min(scenesPerIndustry, 30)
  const batches = Math.ceil(scenesPerIndustry / batchSize)
  
  console.log(`[${industry}] 分批生成策略: 总共 ${scenesPerIndustry} 条，分 ${batches} 批，每批 ${batchSize} 条`)
  const allScenes: Array<{ id: number; use_case: string }> = []
  let totalSavedCount = 0
  let totalFailedCount = 0
  const allErrors: string[] = []

  // 获取任务表引用（在循环外定义，避免重复创建）
  const tasksTable = () => supabase.from('batch_generation_tasks')

  // 🔥 辅助函数：检查任务是否应该停止或暂停
  const checkShouldStop = async (): Promise<{ shouldStop: boolean; isPaused: boolean }> => {
    const { data: checkTask } = await tasksTable()
      .select('should_stop, status, is_paused')
      .eq('id', taskId)
      .single()
    
    return {
      shouldStop: checkTask?.should_stop === true || checkTask?.status === 'cancelled',
      isPaused: checkTask?.is_paused === true,
    }
  }

  // 🔥 按顺序处理每一批：生成一批 → 保存完成 → 再生成下一批
  // 这样更简单、更清晰、更高效，避免并发问题
  for (let batch = 0; batch < batches; batch++) {
    // 🔥 检查是否应该停止（在每个批次前检查，避免浪费API调用）
    const { shouldStop, isPaused } = await checkShouldStop()
    
    if (shouldStop) {
      console.log(`[${industry}] 批次 ${batch + 1}: ⛔ 任务已终止，立即停止生成`)
      break
    }
    
    if (isPaused) {
      console.log(`[${industry}] 批次 ${batch + 1}: ⏸️ 任务已暂停，等待恢复...`)
      // 等待恢复（最多等待 10 秒）
      let waitCount = 0
      while (waitCount < 10) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        const check = await checkShouldStop()
        if (!check.isPaused) {
          console.log(`[${industry}] 批次 ${batch + 1}: ▶️ 任务已恢复，继续生成`)
          break
        }
        if (check.shouldStop) {
          console.log(`[${industry}] 批次 ${batch + 1}: ⛔ 任务已终止，停止生成`)
          return {
            scenes: allScenes.slice(0, scenesPerIndustry),
            savedCount: totalSavedCount,
            failedCount: totalFailedCount,
            errors: [...allErrors, '任务已终止'],
          }
        }
        waitCount++
      }
      
      // 如果仍然暂停，跳过这个批次
      const finalCheck = await checkShouldStop()
      if (finalCheck.isPaused) {
        console.log(`[${industry}] 批次 ${batch + 1}: ⏸️ 任务仍然暂停，跳过此批次`)
        continue
      }
      if (finalCheck.shouldStop) {
        console.log(`[${industry}] 批次 ${batch + 1}: ⛔ 任务已终止，停止生成`)
        break
      }
    }
    
    const currentBatchSize = batch === batches - 1 
      ? scenesPerIndustry - (batch * batchSize) 
      : batchSize
    
    console.log(`\n[${industry}] ========== 批次 ${batch + 1}/${batches} ==========`)
    console.log(`[${industry}] 批次 ${batch + 1}: 📝 步骤 1 - 开始生成 ${currentBatchSize} 条场景词...`)

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

    let rawContent = ''
    let scenes: Array<{ id: number; use_case: string }> = []
    let needsFallback = false
    let needsProModel = false

    // Level 1: 尝试使用 gemini-2.5-flash（除非是冷门行业或极端专业领域）
    if (!isCold && !needsPro) {
      // 🔥 在调用 API 前再次检查是否应该停止
      const preApiCheck = await checkShouldStop()
      if (preApiCheck.shouldStop) {
        console.log(`[${industry}] 批次 ${batch + 1}: ⛔ 调用 API 前检测到任务已终止，立即停止`)
        break
      }
      if (preApiCheck.isPaused) {
        console.log(`[${industry}] 批次 ${batch + 1}: ⏸️ 调用 API 前检测到任务已暂停，跳过此批次`)
        continue
      }
      
      try {
        console.log(`[${industry}] 批次 ${batch + 1}: 使用 gemini-2.5-flash 生成...`)
        
        const response = await createChatCompletion({
          model: 'gemini-2.5-flash',
          stream: false,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        })

        // 🔥 详细记录 API 响应，避免浪费积分
        console.log(`[${industry}] 批次 ${batch + 1}: API 响应结构:`, {
          hasChoices: !!response.choices,
          choicesLength: response.choices?.length || 0,
          firstChoice: response.choices?.[0] ? {
            hasMessage: !!response.choices[0].message,
            hasContent: !!response.choices[0].message?.content,
            contentLength: response.choices[0].message?.content?.length || 0,
            finishReason: response.choices[0].finish_reason,
          } : null,
        })
        
        rawContent = response.choices?.[0]?.message?.content || ''
        
        if (!rawContent) {
          console.error(`[${industry}] 批次 ${batch + 1}: ❌ API 返回空内容！完整响应:`, JSON.stringify(response, null, 2))
          throw new Error('生成的内容为空 - API 返回了空内容，可能被过滤或拒绝')
        }

        console.log(`[${industry}] 批次 ${batch + 1}: 收到内容长度 ${rawContent.length} 字符`)
        
        // 🔥 记录原始内容的前 500 字符，用于调试
        if (rawContent.length > 0) {
          console.log(`[${industry}] 批次 ${batch + 1}: 原始内容预览（前500字符）:`, rawContent.substring(0, 500))
        }

        // 解析 JSON - 增强的解析逻辑
        const jsonContent = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        
        // 🔥 记录原始 JSON 内容（用于调试）
        console.log(`[${industry}] 批次 ${batch + 1}: 开始解析 JSON，原始内容长度: ${jsonContent.length} 字符`)
        console.log(`[${industry}] 批次 ${batch + 1}: JSON 内容前1000字符:`, jsonContent.substring(0, 1000))
        
        try {
          scenes = JSON.parse(jsonContent)
          console.log(`[${industry}] 批次 ${batch + 1}: ✅ 直接解析 JSON 成功，获得 ${scenes.length} 条场景词`)
        } catch (parseError) {
          console.warn(`[${industry}] 批次 ${batch + 1}: ⚠️ JSON 直接解析失败，尝试修复...`, parseError)
          console.warn(`[${industry}] 批次 ${batch + 1}: 解析错误详情:`, parseError instanceof Error ? parseError.message : String(parseError))
          
          // 尝试提取 JSON 数组部分
          const jsonMatch = jsonContent.match(/\[[\s\S]*\]/)
          if (jsonMatch) {
            try {
              scenes = JSON.parse(jsonMatch[0])
              console.log(`[${industry}] 批次 ${batch + 1}: ✅ JSON 修复成功（提取数组），获得 ${scenes.length} 条场景词`)
            } catch (retryError) {
              console.error(`[${industry}] 批次 ${batch + 1}: ❌ JSON 修复失败`, retryError)
              console.error(`[${industry}] 批次 ${batch + 1}: 修复错误详情:`, retryError instanceof Error ? retryError.message : String(retryError))
              console.error(`[${industry}] 批次 ${batch + 1}: 尝试解析的内容:`, jsonMatch[0].substring(0, 500))
              throw new Error(`无法解析 JSON: ${retryError instanceof Error ? retryError.message : String(retryError)}`)
            }
          } else {
            console.error(`[${industry}] 批次 ${batch + 1}: ❌ 无法找到 JSON 数组，原始内容:`, jsonContent.substring(0, 1000))
            throw new Error('无法找到 JSON 数组，可能 API 返回的不是 JSON 格式')
          }
        }

        // 🔥 检查解析后的场景词结构
        if (!Array.isArray(scenes)) {
          console.error(`[${industry}] 批次 ${batch + 1}: ❌ JSON 解析结果不是数组！类型: ${typeof scenes}, 值:`, scenes)
          throw new Error('JSON 解析结果不是数组')
        }
        
        console.log(`[${industry}] 批次 ${batch + 1}: JSON 解析成功，原始场景词数量: ${scenes.length}`)
        
        // 调整 ID 并过滤
        scenes.forEach((scene, idx) => {
          scene.id = batch * batchSize + idx + 1
        })
        
        // 🔥 详细记录过滤过程（降低过滤阈值，从 50 字符改为 30 字符）
        const beforeFilter = scenes.length
        const MIN_LENGTH = 30 // 降低过滤阈值，避免误过滤有效内容
        
        // 先记录所有场景词的结构，用于调试
        if (scenes.length > 0) {
          console.log(`[${industry}] 批次 ${batch + 1}: 解析后的场景词示例（前3条）:`, scenes.slice(0, 3).map(s => ({
            hasId: !!s.id,
            hasUseCase: !!s.use_case,
            useCaseLength: s.use_case?.length || 0,
            useCasePreview: s.use_case?.substring(0, 100) || 'N/A',
          })))
        }
        
        const validScenes = scenes.filter(s => {
          if (!s) {
            console.warn(`[${industry}] 批次 ${batch + 1}: 发现 null/undefined 场景词`)
            return false
          }
          if (!s.use_case) {
            console.warn(`[${industry}] 批次 ${batch + 1}: 发现缺少 use_case 的场景词:`, JSON.stringify(s))
            return false
          }
          const trimmedLength = s.use_case.trim().length
          if (trimmedLength <= MIN_LENGTH) {
            console.warn(`[${industry}] 批次 ${batch + 1}: 发现内容过短的场景词（${trimmedLength} 字符，阈值: ${MIN_LENGTH}）:`, s.use_case.substring(0, 150))
            return false
          }
          return true
        })
        const filteredCount = beforeFilter - validScenes.length
        
        if (filteredCount > 0) {
          console.warn(`[${industry}] 批次 ${batch + 1}: ⚠️ 过滤掉 ${filteredCount} 条无效场景词（原始: ${beforeFilter} 条，有效: ${validScenes.length} 条，过滤阈值: ${MIN_LENGTH} 字符）`)
        } else {
          console.log(`[${industry}] 批次 ${batch + 1}: ✅ 所有 ${beforeFilter} 条场景词都通过过滤（阈值: ${MIN_LENGTH} 字符）`)
        }
        
        scenes = validScenes

        // 🔥 强制检查：如果返回空数组，立即触发 fallback（最高优先级）
        if (scenes.length === 0) {
          needsFallback = true
          console.error(`[${industry}] 批次 ${batch + 1}: ⚠️⚠️⚠️ 严重问题：gemini-2.5-flash 返回空数组！`)
          console.error(`[${industry}] 批次 ${batch + 1}: 原始内容长度: ${rawContent.length} 字符`)
          console.error(`[${industry}] 批次 ${batch + 1}: JSON 解析前数量: ${beforeFilter} 条`)
          console.error(`[${industry}] 批次 ${batch + 1}: 过滤后数量: ${validScenes.length} 条`)
          console.error(`[${industry}] 批次 ${batch + 1}: JSON 内容预览（前500字符）:`, rawContent.substring(0, 500))
          console.error(`[${industry}] 批次 ${batch + 1}: 将强制切换到 gemini-3-flash（联网搜索）以避免浪费积分`)
        } else {
          // 检查生成质量（触发方式 A 和 B）
          const qualityCheck = checkGenerationQuality(scenes, currentBatchSize, rawContent)
          if (qualityCheck.needsProModel) {
            // 需要 Level 3 (gemini-3-pro)
            needsProModel = true
            needsFallback = true
            console.warn(`[${industry}] 批次 ${batch + 1}: 质量检查显示需要 gemini-3-pro（最高质量模型）`)
            console.warn(`[${industry}] 批次 ${batch + 1}: 失败原因: ${qualityCheck.reason}`)
            console.warn(`[${industry}] 批次 ${batch + 1}: 问题列表:`, qualityCheck.issues)
          } else if (qualityCheck.needsFallback) {
            // 需要 Level 2 (gemini-3-flash)
            needsFallback = true
            console.warn(`[${industry}] 批次 ${batch + 1}: 质量检查失败，需要 fallback 到 gemini-3-flash（联网搜索）`)
            console.warn(`[${industry}] 批次 ${batch + 1}: 失败原因: ${qualityCheck.reason}`)
            console.warn(`[${industry}] 批次 ${batch + 1}: 问题列表:`, qualityCheck.issues)
          } else {
            // 2.5-flash 生成成功，立即更新生成数量，然后保存这批场景词
            console.log(`[${industry}] 批次 ${batch + 1}: ✅ gemini-2.5-flash 生成成功，获得 ${scenes.length} 条场景词`)
            
            // 🔥 在更新生成数量和保存前，再次检查是否应该停止
            const preSaveCheck = await checkShouldStop()
            if (preSaveCheck.shouldStop) {
              console.log(`[${industry}] 批次 ${batch + 1}: ⛔ 保存前检测到任务已终止，立即停止`)
              break
            }
            if (preSaveCheck.isPaused) {
              console.log(`[${industry}] 批次 ${batch + 1}: ⏸️ 保存前检测到任务已暂停，跳过此批次`)
              continue
            }
            
            // 🔥 立即更新 total_scenes_generated，让前端显示"已生成 X 条，正在保存..."
            try {
              const { data: currentTask } = await tasksTable()
                .select('total_scenes_generated')
                .eq('id', taskId)
                .single()
              
              const currentGenerated = (currentTask as Database['public']['Tables']['batch_generation_tasks']['Row'])?.total_scenes_generated || 0
              
              await tasksTable()
                .update({
                  total_scenes_generated: currentGenerated + scenes.length,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', taskId)
              
              console.log(`[${industry}] 批次 ${batch + 1}: 📊 已更新生成数量: ${currentGenerated + scenes.length} 条，开始保存...`)
            } catch (updateError) {
              console.warn(`[${industry}] 批次 ${batch + 1}: 更新生成数量失败（继续保存）:`, updateError)
              // 即使更新失败，也继续保存
            }
            
            // 🔥 步骤 2：保存这批场景词（等待全部保存完成后再继续下一批）
            // 这样更简单、更清晰：生成一批 → 保存完成 → 再生成下一批
            console.log(`[${industry}] 批次 ${batch + 1}: 💾 开始保存 ${scenes.length} 条场景词...`)
            const saveResult = await saveBatchScenes(scenes, industry, useCaseType, taskId, supabase, batch + 1)
            totalSavedCount += saveResult.savedCount
            totalFailedCount += saveResult.failedCount
            allErrors.push(...saveResult.errors)
            
            // 🔥 记录保存结果（包括跳过的数量）
            const skippedInfo = saveResult.skippedCount > 0 ? `，跳过 ${saveResult.skippedCount} 条（质量过低）` : ''
            console.log(`[${industry}] 批次 ${batch + 1}: ✅ 保存完成！成功 ${saveResult.savedCount} 条，失败 ${saveResult.failedCount} 条${skippedInfo}`)
            
            // 🔥 检查保存失败率，如果超过 50%，停止避免浪费积分
            // 注意：跳过的数量不计入失败率计算（因为这是主动跳过，不是真正的失败）
            const totalAttempted = saveResult.savedCount + saveResult.failedCount
            const saveFailureRate = totalAttempted > 0 ? saveResult.failedCount / totalAttempted : 0
            
            if (saveFailureRate > 0.5) {
              console.error(`[${industry}] 批次 ${batch + 1}: ⚠️⚠️⚠️ 保存失败率过高 (${(saveFailureRate * 100).toFixed(1)}%)，停止生成避免浪费积分`)
              allErrors.push(`批次 ${batch + 1} 保存失败率过高 (${(saveFailureRate * 100).toFixed(1)}%)，已停止生成`)
              break // 停止整个循环，避免继续调用 API 浪费积分
            }
            
            // 如果保存成功率 >= 50%，添加所有场景词（因为已经调用 API 了）
            // 注意：虽然有些保存失败，但内容已经生成，所以仍然添加到 allScenes
            allScenes.push(...scenes)
            console.log(`[${industry}] 批次 ${batch + 1}: 📊 累计统计 - 已生成 ${allScenes.length} 条，已保存 ${totalSavedCount} 条，失败 ${totalFailedCount} 条`)
            
            // 🔥 步骤 3：这批已完成，继续下一批（如果还有）
            if (batch + 1 < batches) {
              console.log(`[${industry}] 批次 ${batch + 1} 完成，准备生成批次 ${batch + 2}/${batches}...`)
            }
          }
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        console.error(`[${industry}] 批次 ${batch + 1}: ❌ gemini-2.5-flash 生成失败:`, error)
        console.error(`[${industry}] 批次 ${batch + 1}: 错误详情:`, errorMsg)
        
        // 🔥 使用错误分类决定是否重试
        const errorClassification = classifyGenerationError(
          error instanceof Error ? error : new Error(errorMsg)
        )
        
        console.log(`[${industry}] 批次 ${batch + 1}: 错误分类:`, {
          category: errorClassification.errorCategory,
          shouldRetry: errorClassification.shouldRetry,
          shouldStop: errorClassification.shouldStop,
          message: errorClassification.errorMessage,
        })
        
        // 如果应该重试且是超时/网络错误，可以尝试重试（但这里我们直接 fallback 到更强大的模型）
        if (errorClassification.shouldRetry && 
            (errorClassification.errorCategory === 'timeout' || 
             errorClassification.errorCategory === 'network')) {
          console.warn(`[${industry}] 批次 ${batch + 1}: ${errorClassification.errorMessage}，将切换到更强大的模型`)
        }
        
        // 如果内容被过滤，不应该重试（会浪费积分）
        if (errorClassification.errorCategory === 'content_filter') {
          console.warn(`[${industry}] 批次 ${batch + 1}: ${errorClassification.errorMessage}，跳过此批次`)
          allErrors.push(`批次 ${batch + 1}: ${errorClassification.errorMessage}`)
          continue // 跳过此批次，继续下一个
        }
        
        needsFallback = true
        // 如果生成失败，清空 scenes 数组，确保会触发 fallback
        scenes = []
        console.warn(`[${industry}] 批次 ${batch + 1}: 🔄 将强制切换到 gemini-3-flash（联网搜索）`)
      }
    } else if (needsPro) {
      // 极端专业领域直接使用 gemini-3-pro
      needsFallback = true
      needsProModel = true
      console.log(`[${industry}] 批次 ${batch + 1}: 极端专业领域，直接使用 gemini-3-pro（最高质量）`)
    } else {
      // 冷门行业直接使用 gemini-3-flash
      needsFallback = true
      console.log(`[${industry}] 批次 ${batch + 1}: 冷门行业，直接使用 gemini-3-flash（联网搜索）`)
    }

    // Level 3: 如果需要最高质量模型，使用 gemini-3-pro（联网搜索）
    if (needsProModel) {
      // 🔥 在调用 API 前再次检查是否应该停止
      const preApiCheck = await checkShouldStop()
      if (preApiCheck.shouldStop) {
        console.log(`[${industry}] 批次 ${batch + 1}: ⛔ 调用 API 前检测到任务已终止，立即停止`)
        break
      }
      if (preApiCheck.isPaused) {
        console.log(`[${industry}] 批次 ${batch + 1}: ⏸️ 调用 API 前检测到任务已暂停，跳过此批次`)
        continue
      }
      
      try {
        console.log(`[${industry}] 批次 ${batch + 1}: 使用 gemini-3-pro（最高质量，联网搜索）...`)
        
        const response = await createChatCompletion({
          model: 'gemini-3-pro',
          stream: false,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          tools: [{ type: 'google_search_retrieval' }],
        })

        // 🔥 详细记录 API 响应，避免浪费积分
        console.log(`[${industry}] 批次 ${batch + 1}: gemini-3-pro API 响应结构:`, {
          hasChoices: !!response.choices,
          choicesLength: response.choices?.length || 0,
          firstChoice: response.choices?.[0] ? {
            hasMessage: !!response.choices[0].message,
            hasContent: !!response.choices[0].message?.content,
            contentLength: response.choices[0].message?.content?.length || 0,
            finishReason: response.choices[0].finish_reason,
          } : null,
        })
        
        rawContent = response.choices?.[0]?.message?.content || ''
        
        if (!rawContent) {
          console.error(`[${industry}] 批次 ${batch + 1}: ❌ gemini-3-pro API 返回空内容！完整响应:`, JSON.stringify(response, null, 2))
          throw new Error('gemini-3-pro 生成的内容为空 - API 返回了空内容，可能被过滤或拒绝')
        }

        console.log(`[${industry}] 批次 ${batch + 1}: gemini-3-pro 收到内容长度 ${rawContent.length} 字符`)
        
        // 🔥 记录原始内容的前 500 字符，用于调试
        if (rawContent.length > 0) {
          console.log(`[${industry}] 批次 ${batch + 1}: gemini-3-pro 原始内容预览（前500字符）:`, rawContent.substring(0, 500))
        }

        // 解析 JSON - 增强的解析逻辑
        const jsonContent = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        
        // 🔥 记录原始 JSON 内容（用于调试）
        console.log(`[${industry}] 批次 ${batch + 1}: gemini-3-pro 开始解析 JSON，原始内容长度: ${jsonContent.length} 字符`)
        console.log(`[${industry}] 批次 ${batch + 1}: gemini-3-pro JSON 内容前1000字符:`, jsonContent.substring(0, 1000))
        
        try {
          scenes = JSON.parse(jsonContent)
          console.log(`[${industry}] 批次 ${batch + 1}: ✅ gemini-3-pro 直接解析 JSON 成功，获得 ${scenes.length} 条场景词`)
        } catch (parseError) {
          console.warn(`[${industry}] 批次 ${batch + 1}: ⚠️ gemini-3-pro JSON 直接解析失败，尝试修复...`, parseError)
          console.warn(`[${industry}] 批次 ${batch + 1}: gemini-3-pro 解析错误详情:`, parseError instanceof Error ? parseError.message : String(parseError))
          
          // 尝试提取 JSON 数组部分
          const jsonMatch = jsonContent.match(/\[[\s\S]*\]/)
          if (jsonMatch) {
            try {
              scenes = JSON.parse(jsonMatch[0])
              console.log(`[${industry}] 批次 ${batch + 1}: ✅ gemini-3-pro JSON 修复成功（提取数组），获得 ${scenes.length} 条场景词`)
            } catch (retryError) {
              console.error(`[${industry}] 批次 ${batch + 1}: ❌ gemini-3-pro JSON 修复失败`, retryError)
              console.error(`[${industry}] 批次 ${batch + 1}: gemini-3-pro 修复错误详情:`, retryError instanceof Error ? retryError.message : String(retryError))
              console.error(`[${industry}] 批次 ${batch + 1}: gemini-3-pro 尝试解析的内容:`, jsonMatch[0].substring(0, 500))
              throw new Error(`无法解析 JSON: ${retryError instanceof Error ? retryError.message : String(retryError)}`)
            }
          } else {
            console.error(`[${industry}] 批次 ${batch + 1}: ❌ gemini-3-pro 无法找到 JSON 数组，原始内容:`, jsonContent.substring(0, 1000))
            throw new Error('无法找到 JSON 数组，可能 API 返回的不是 JSON 格式')
          }
        }

        // 🔥 检查解析后的场景词结构
        if (!Array.isArray(scenes)) {
          console.error(`[${industry}] 批次 ${batch + 1}: ❌ gemini-3-pro JSON 解析结果不是数组！类型: ${typeof scenes}, 值:`, scenes)
          throw new Error('gemini-3-pro JSON 解析结果不是数组')
        }
        
        console.log(`[${industry}] 批次 ${batch + 1}: gemini-3-pro JSON 解析成功，原始场景词数量: ${scenes.length}`)
        
        // 调整 ID 并过滤
        scenes.forEach((scene, idx) => {
          scene.id = batch * batchSize + idx + 1
        })
        
        // 🔥 详细记录过滤过程（降低过滤阈值，从 50 字符改为 30 字符）
        const beforeFilter = scenes.length
        const MIN_LENGTH = 30 // 降低过滤阈值，避免误过滤有效内容
        
        // 先记录所有场景词的结构，用于调试
        if (scenes.length > 0) {
          console.log(`[${industry}] 批次 ${batch + 1}: gemini-3-pro 解析后的场景词示例（前3条）:`, scenes.slice(0, 3).map(s => ({
            hasId: !!s.id,
            hasUseCase: !!s.use_case,
            useCaseLength: s.use_case?.length || 0,
            useCasePreview: s.use_case?.substring(0, 100) || 'N/A',
          })))
        }
        
        const validScenes = scenes.filter(s => {
          if (!s) {
            console.warn(`[${industry}] 批次 ${batch + 1}: gemini-3-pro 发现 null/undefined 场景词`)
            return false
          }
          if (!s.use_case) {
            console.warn(`[${industry}] 批次 ${batch + 1}: gemini-3-pro 发现缺少 use_case 的场景词:`, JSON.stringify(s))
            return false
          }
          const trimmedLength = s.use_case.trim().length
          if (trimmedLength <= MIN_LENGTH) {
            console.warn(`[${industry}] 批次 ${batch + 1}: gemini-3-pro 发现内容过短的场景词（${trimmedLength} 字符，阈值: ${MIN_LENGTH}）:`, s.use_case.substring(0, 150))
            return false
          }
          return true
        })
        const filteredCount = beforeFilter - validScenes.length
        
        if (filteredCount > 0) {
          console.warn(`[${industry}] 批次 ${batch + 1}: ⚠️ gemini-3-pro 过滤掉 ${filteredCount} 条无效场景词（原始: ${beforeFilter} 条，有效: ${validScenes.length} 条，过滤阈值: ${MIN_LENGTH} 字符）`)
        } else {
          console.log(`[${industry}] 批次 ${batch + 1}: ✅ gemini-3-pro 所有 ${beforeFilter} 条场景词都通过过滤（阈值: ${MIN_LENGTH} 字符）`)
        }
        
        scenes = validScenes
        
        // 🔥 最终检查：如果 3-pro 也返回空数组，这是极端情况
        if (scenes.length === 0) {
          console.error(`[${industry}] 批次 ${batch + 1}: ⚠️⚠️⚠️ 极端情况：gemini-3-pro 也返回空数组！`)
          console.error(`[${industry}] 批次 ${batch + 1}: 原始内容长度: ${rawContent.length} 字符`)
          console.error(`[${industry}] 批次 ${batch + 1}: JSON 解析前数量: ${beforeFilter} 条`)
          console.error(`[${industry}] 批次 ${batch + 1}: 过滤后数量: ${validScenes.length} 条`)
          console.error(`[${industry}] 批次 ${batch + 1}: 所有模型都失败，无法生成场景词`)
          throw new Error('所有模型（2.5-flash、3-flash、3-pro）都返回空数组，无法生成场景词')
        }
        
        // 🔥 步骤 2：保存这批场景词（等待全部保存完成后再继续下一批）
        // 🔥 在更新生成数量和保存前，再次检查是否应该停止
        const preSaveCheck = await checkShouldStop()
        if (preSaveCheck.shouldStop) {
          console.log(`[${industry}] 批次 ${batch + 1}: ⛔ 保存前检测到任务已终止，立即停止`)
          break
        }
        if (preSaveCheck.isPaused) {
          console.log(`[${industry}] 批次 ${batch + 1}: ⏸️ 保存前检测到任务已暂停，跳过此批次`)
          continue
        }
        
        // 🔥 立即更新 total_scenes_generated，让前端显示"已生成 X 条，正在保存..."
        try {
          const { data: currentTask } = await tasksTable()
            .select('total_scenes_generated')
            .eq('id', taskId)
            .single()
          
          const currentGenerated = (currentTask as Database['public']['Tables']['batch_generation_tasks']['Row'])?.total_scenes_generated || 0
          
          await tasksTable()
            .update({
              total_scenes_generated: currentGenerated + scenes.length,
              updated_at: new Date().toISOString(),
            })
            .eq('id', taskId)
          
          console.log(`[${industry}] 批次 ${batch + 1}: 📊 已更新生成数量: ${currentGenerated + scenes.length} 条，开始保存...`)
        } catch (updateError) {
          console.warn(`[${industry}] 批次 ${batch + 1}: 更新生成数量失败（继续保存）:`, updateError)
        }
        
        console.log(`[${industry}] 批次 ${batch + 1}: 💾 开始保存 ${scenes.length} 条场景词...`)
        const saveResult = await saveBatchScenes(scenes, industry, useCaseType, taskId, supabase, batch + 1)
        totalSavedCount += saveResult.savedCount
        totalFailedCount += saveResult.failedCount
        allErrors.push(...saveResult.errors)
        
        console.log(`[${industry}] 批次 ${batch + 1}: ✅ 保存完成！成功 ${saveResult.savedCount} 条，失败 ${saveResult.failedCount} 条`)
        
        // 🔥 检查保存失败率，如果超过 50%，停止避免浪费积分
        const totalAttempted = saveResult.savedCount + saveResult.failedCount
        const saveFailureRate = totalAttempted > 0 ? saveResult.failedCount / totalAttempted : 0
        
        if (saveFailureRate > 0.5) {
          console.error(`[${industry}] 批次 ${batch + 1}: ⚠️⚠️⚠️ gemini-3-pro 保存失败率过高 (${(saveFailureRate * 100).toFixed(1)}%)，停止生成避免浪费积分`)
          allErrors.push(`批次 ${batch + 1} (gemini-3-pro) 保存失败率过高 (${(saveFailureRate * 100).toFixed(1)}%)，已停止生成`)
          break // 停止整个循环，避免继续调用 API 浪费积分
        }
        
        // 如果保存成功率 >= 50%，添加所有场景词（因为已经调用 API 了）
        allScenes.push(...scenes)
        console.log(`[${industry}] 批次 ${batch + 1}: 📊 累计统计 - 已生成 ${allScenes.length} 条，已保存 ${totalSavedCount} 条，失败 ${totalFailedCount} 条`)
        
        // 🔥 步骤 3：这批已完成，继续下一批（如果还有）
        if (batch + 1 < batches) {
          console.log(`[${industry}] 批次 ${batch + 1} 完成，准备生成批次 ${batch + 2}/${batches}...`)
        }
      } catch (error) {
        console.error(`[${industry}] 批次 ${batch + 1}: gemini-3-pro 也失败:`, error)
        // 🔥 即使所有模型都失败，也继续下一个批次，避免整个任务失败
        const errorMsg = error instanceof Error ? error.message : String(error)
        allErrors.push(`批次 ${batch + 1} (gemini-3-pro) 生成失败: ${errorMsg}`)
        console.warn(`[${industry}] 批次 ${batch + 1}: ⚠️ 所有模型都失败，跳过此批次，继续下一个批次`)
        // 不抛出错误，继续下一个批次
      }
    }
    // Level 2: 如果需要 fallback（但不是极端专业），使用 gemini-3-flash（联网搜索）
    // 🔥 强制检查：如果 scenes 为空或需要 fallback，必须切换到 3-flash
    if ((needsFallback && !needsProModel) || (scenes.length === 0 && !needsProModel)) {
      // 🔥 在调用 API 前再次检查是否应该停止
      const preApiCheck = await checkShouldStop()
      if (preApiCheck.shouldStop) {
        console.log(`[${industry}] 批次 ${batch + 1}: ⛔ 调用 API 前检测到任务已终止，立即停止`)
        break
      }
      if (preApiCheck.isPaused) {
        console.log(`[${industry}] 批次 ${batch + 1}: ⏸️ 调用 API 前检测到任务已暂停，跳过此批次`)
        continue
      }
      
      try {
        console.log(`[${industry}] 批次 ${batch + 1}: 🔄 强制切换到 gemini-3-flash（联网搜索）...`)
        console.log(`[${industry}] 批次 ${batch + 1}: 切换原因: ${scenes.length === 0 ? '空数组' : '质量检查失败或生成失败'}`)
        
        const response = await createChatCompletion({
          model: 'gemini-3-flash',
          stream: false,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          tools: [{ type: 'google_search_retrieval' }],
        })

        // 🔥 详细记录 API 响应，避免浪费积分
        console.log(`[${industry}] 批次 ${batch + 1}: gemini-3-flash API 响应结构:`, {
          hasChoices: !!response.choices,
          choicesLength: response.choices?.length || 0,
          firstChoice: response.choices?.[0] ? {
            hasMessage: !!response.choices[0].message,
            hasContent: !!response.choices[0].message?.content,
            contentLength: response.choices[0].message?.content?.length || 0,
            finishReason: response.choices[0].finish_reason,
          } : null,
        })
        
        rawContent = response.choices?.[0]?.message?.content || ''
        
        if (!rawContent) {
          console.error(`[${industry}] 批次 ${batch + 1}: ❌ gemini-3-flash API 返回空内容！完整响应:`, JSON.stringify(response, null, 2))
          throw new Error('gemini-3-flash 生成的内容为空 - API 返回了空内容，可能被过滤或拒绝')
        }

        console.log(`[${industry}] 批次 ${batch + 1}: gemini-3-flash 收到内容长度 ${rawContent.length} 字符`)
        
        // 🔥 记录原始内容的前 500 字符，用于调试
        if (rawContent.length > 0) {
          console.log(`[${industry}] 批次 ${batch + 1}: gemini-3-flash 原始内容预览（前500字符）:`, rawContent.substring(0, 500))
        }

        // 解析 JSON - 增强的解析逻辑
        const jsonContent = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        
        // 🔥 记录原始 JSON 内容（用于调试）
        console.log(`[${industry}] 批次 ${batch + 1}: gemini-3-flash 开始解析 JSON，原始内容长度: ${jsonContent.length} 字符`)
        console.log(`[${industry}] 批次 ${batch + 1}: gemini-3-flash JSON 内容前1000字符:`, jsonContent.substring(0, 1000))
        
        try {
          scenes = JSON.parse(jsonContent)
          console.log(`[${industry}] 批次 ${batch + 1}: ✅ gemini-3-flash 直接解析 JSON 成功，获得 ${scenes.length} 条场景词`)
        } catch (parseError) {
          console.warn(`[${industry}] 批次 ${batch + 1}: ⚠️ gemini-3-flash JSON 直接解析失败，尝试修复...`, parseError)
          console.warn(`[${industry}] 批次 ${batch + 1}: gemini-3-flash 解析错误详情:`, parseError instanceof Error ? parseError.message : String(parseError))
          
          // 尝试提取 JSON 数组部分
          const jsonMatch = jsonContent.match(/\[[\s\S]*\]/)
          if (jsonMatch) {
            try {
              scenes = JSON.parse(jsonMatch[0])
              console.log(`[${industry}] 批次 ${batch + 1}: ✅ gemini-3-flash JSON 修复成功（提取数组），获得 ${scenes.length} 条场景词`)
            } catch (retryError) {
              console.error(`[${industry}] 批次 ${batch + 1}: ❌ gemini-3-flash JSON 修复失败`, retryError)
              console.error(`[${industry}] 批次 ${batch + 1}: gemini-3-flash 修复错误详情:`, retryError instanceof Error ? retryError.message : String(retryError))
              console.error(`[${industry}] 批次 ${batch + 1}: gemini-3-flash 尝试解析的内容:`, jsonMatch[0].substring(0, 500))
              throw new Error(`无法解析 JSON: ${retryError instanceof Error ? retryError.message : String(retryError)}`)
            }
          } else {
            console.error(`[${industry}] 批次 ${batch + 1}: ❌ gemini-3-flash 无法找到 JSON 数组，原始内容:`, jsonContent.substring(0, 1000))
            throw new Error('无法找到 JSON 数组，可能 API 返回的不是 JSON 格式')
          }
        }

        // 🔥 检查解析后的场景词结构
        if (!Array.isArray(scenes)) {
          console.error(`[${industry}] 批次 ${batch + 1}: ❌ gemini-3-flash JSON 解析结果不是数组！类型: ${typeof scenes}, 值:`, scenes)
          throw new Error('gemini-3-flash JSON 解析结果不是数组')
        }
        
        console.log(`[${industry}] 批次 ${batch + 1}: gemini-3-flash JSON 解析成功，原始场景词数量: ${scenes.length}`)
        
        // 调整 ID 并过滤
        scenes.forEach((scene, idx) => {
          scene.id = batch * batchSize + idx + 1
        })
        
        // 🔥 详细记录过滤过程（降低过滤阈值，从 50 字符改为 30 字符）
        const beforeFilter = scenes.length
        const MIN_LENGTH = 30 // 降低过滤阈值，避免误过滤有效内容
        
        // 先记录所有场景词的结构，用于调试
        if (scenes.length > 0) {
          console.log(`[${industry}] 批次 ${batch + 1}: gemini-3-flash 解析后的场景词示例（前3条）:`, scenes.slice(0, 3).map(s => ({
            hasId: !!s.id,
            hasUseCase: !!s.use_case,
            useCaseLength: s.use_case?.length || 0,
            useCasePreview: s.use_case?.substring(0, 100) || 'N/A',
          })))
        }
        
        const validScenes = scenes.filter(s => {
          if (!s) {
            console.warn(`[${industry}] 批次 ${batch + 1}: gemini-3-flash 发现 null/undefined 场景词`)
            return false
          }
          if (!s.use_case) {
            console.warn(`[${industry}] 批次 ${batch + 1}: gemini-3-flash 发现缺少 use_case 的场景词:`, JSON.stringify(s))
            return false
          }
          const trimmedLength = s.use_case.trim().length
          if (trimmedLength <= MIN_LENGTH) {
            console.warn(`[${industry}] 批次 ${batch + 1}: gemini-3-flash 发现内容过短的场景词（${trimmedLength} 字符，阈值: ${MIN_LENGTH}）:`, s.use_case.substring(0, 150))
            return false
          }
          return true
        })
        const filteredCount = beforeFilter - validScenes.length
        
        if (filteredCount > 0) {
          console.warn(`[${industry}] 批次 ${batch + 1}: ⚠️ gemini-3-flash 过滤掉 ${filteredCount} 条无效场景词（原始: ${beforeFilter} 条，有效: ${validScenes.length} 条，过滤阈值: ${MIN_LENGTH} 字符）`)
        } else {
          console.log(`[${industry}] 批次 ${batch + 1}: ✅ gemini-3-flash 所有 ${beforeFilter} 条场景词都通过过滤（阈值: ${MIN_LENGTH} 字符）`)
        }
        
        scenes = validScenes
        
        // 🔥 再次强制检查：如果 3-flash 也返回空数组，需要切换到 3-pro
        if (scenes.length === 0) {
          console.error(`[${industry}] 批次 ${batch + 1}: ⚠️⚠️⚠️ 严重问题：gemini-3-flash 也返回空数组！`)
          console.error(`[${industry}] 批次 ${batch + 1}: 原始内容长度: ${rawContent.length} 字符`)
          console.error(`[${industry}] 批次 ${batch + 1}: JSON 解析前数量: ${beforeFilter} 条`)
          console.error(`[${industry}] 批次 ${batch + 1}: 过滤后数量: ${validScenes.length} 条`)
          console.error(`[${industry}] 批次 ${batch + 1}: 将切换到 gemini-3-pro（最高质量）以避免浪费积分`)
          needsProModel = true
          needsFallback = true
        } else {
          // 🔥 步骤 2：保存这批场景词（等待全部保存完成后再继续下一批）
          // 🔥 在更新生成数量和保存前，再次检查是否应该停止
          const preSaveCheck = await checkShouldStop()
          if (preSaveCheck.shouldStop) {
            console.log(`[${industry}] 批次 ${batch + 1}: ⛔ 保存前检测到任务已终止，立即停止`)
            break
          }
          if (preSaveCheck.isPaused) {
            console.log(`[${industry}] 批次 ${batch + 1}: ⏸️ 保存前检测到任务已暂停，跳过此批次`)
            continue
          }
          
          // 🔥 立即更新 total_scenes_generated，让前端显示"已生成 X 条，正在保存..."
          try {
            const { data: currentTask } = await tasksTable()
              .select('total_scenes_generated')
              .eq('id', taskId)
              .single()
            
            const currentGenerated = (currentTask as Database['public']['Tables']['batch_generation_tasks']['Row'])?.total_scenes_generated || 0
            
            await tasksTable()
              .update({
                total_scenes_generated: currentGenerated + scenes.length,
                updated_at: new Date().toISOString(),
              })
              .eq('id', taskId)
            
            console.log(`[${industry}] 批次 ${batch + 1}: 📊 已更新生成数量: ${currentGenerated + scenes.length} 条，开始保存...`)
          } catch (updateError) {
            console.warn(`[${industry}] 批次 ${batch + 1}: 更新生成数量失败（继续保存）:`, updateError)
          }
          
          console.log(`[${industry}] 批次 ${batch + 1}: 💾 开始保存 ${scenes.length} 条场景词...`)
          const saveResult = await saveBatchScenes(scenes, industry, useCaseType, taskId, supabase, batch + 1)
          totalSavedCount += saveResult.savedCount
          totalFailedCount += saveResult.failedCount
          allErrors.push(...saveResult.errors)
          
          console.log(`[${industry}] 批次 ${batch + 1}: ✅ 保存完成！成功 ${saveResult.savedCount} 条，失败 ${saveResult.failedCount} 条`)
          
          // 🔥 检查保存失败率，如果超过 50%，停止避免浪费积分
          const totalAttempted = saveResult.savedCount + saveResult.failedCount
          const saveFailureRate = totalAttempted > 0 ? saveResult.failedCount / totalAttempted : 0
          
          if (saveFailureRate > 0.5) {
            console.error(`[${industry}] 批次 ${batch + 1}: ⚠️⚠️⚠️ gemini-3-flash 保存失败率过高 (${(saveFailureRate * 100).toFixed(1)}%)，停止生成避免浪费积分`)
            allErrors.push(`批次 ${batch + 1} (gemini-3-flash) 保存失败率过高 (${(saveFailureRate * 100).toFixed(1)}%)，已停止生成`)
            break // 停止整个循环，避免继续调用 API 浪费积分
          }
          
          // 如果保存成功率 >= 50%，添加所有场景词（因为已经调用 API 了）
          allScenes.push(...scenes)
          console.log(`[${industry}] 批次 ${batch + 1}: 📊 累计统计 - 已生成 ${allScenes.length} 条，已保存 ${totalSavedCount} 条，失败 ${totalFailedCount} 条`)
          
          // 🔥 步骤 3：这批已完成，继续下一批（如果还有）
          if (batch + 1 < batches) {
            console.log(`[${industry}] 批次 ${batch + 1} 完成，准备生成批次 ${batch + 2}/${batches}...`)
          }
        }
      } catch (error) {
        console.error(`[${industry}] 批次 ${batch + 1}: ❌ gemini-3-flash 失败，强制切换到 gemini-3-pro...`, error)
        console.error(`[${industry}] 批次 ${batch + 1}: 错误详情:`, error instanceof Error ? error.message : String(error))
        // Level 3 Fallback: 如果 3-flash 也失败，强制切换到 3-pro
        // 🔥 在调用 API 前再次检查是否应该停止
        const preApiCheck = await checkShouldStop()
        if (preApiCheck.shouldStop) {
          console.log(`[${industry}] 批次 ${batch + 1}: ⛔ 调用 API 前检测到任务已终止，立即停止`)
          break
        }
        if (preApiCheck.isPaused) {
          console.log(`[${industry}] 批次 ${batch + 1}: ⏸️ 调用 API 前检测到任务已暂停，跳过此批次`)
          continue
        }
        
        try {
          console.log(`[${industry}] 批次 ${batch + 1}: 切换到 gemini-3-pro（最高质量，联网搜索）...`)
          
          const response = await createChatCompletion({
            model: 'gemini-3-pro',
            stream: false,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            tools: [{ type: 'google_search_retrieval' }],
          })

          // 🔥 详细记录 API 响应，避免浪费积分
          console.log(`[${industry}] 批次 ${batch + 1}: gemini-3-pro API 响应结构:`, {
            hasChoices: !!response.choices,
            choicesLength: response.choices?.length || 0,
            firstChoice: response.choices?.[0] ? {
              hasMessage: !!response.choices[0].message,
              hasContent: !!response.choices[0].message?.content,
              contentLength: response.choices[0].message?.content?.length || 0,
              finishReason: response.choices[0].finish_reason,
            } : null,
          })
          
          rawContent = response.choices?.[0]?.message?.content || ''
          
          if (!rawContent) {
            console.error(`[${industry}] 批次 ${batch + 1}: ❌ gemini-3-pro API 返回空内容！完整响应:`, JSON.stringify(response, null, 2))
            throw new Error('gemini-3-pro 生成的内容为空 - API 返回了空内容，可能被过滤或拒绝')
          }

          console.log(`[${industry}] 批次 ${batch + 1}: gemini-3-pro 收到内容长度 ${rawContent.length} 字符`)
          
          // 🔥 记录原始内容的前 500 字符，用于调试
          if (rawContent.length > 0) {
            console.log(`[${industry}] 批次 ${batch + 1}: gemini-3-pro 原始内容预览（前500字符）:`, rawContent.substring(0, 500))
          }

          // 解析 JSON - 增强的解析逻辑
          const jsonContent = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
          
          // 🔥 记录原始 JSON 内容（用于调试）
          console.log(`[${industry}] 批次 ${batch + 1}: gemini-3-pro 开始解析 JSON，原始内容长度: ${jsonContent.length} 字符`)
          console.log(`[${industry}] 批次 ${batch + 1}: gemini-3-pro JSON 内容前1000字符:`, jsonContent.substring(0, 1000))
          
          try {
            scenes = JSON.parse(jsonContent)
            console.log(`[${industry}] 批次 ${batch + 1}: ✅ gemini-3-pro 直接解析 JSON 成功，获得 ${scenes.length} 条场景词`)
          } catch (parseError) {
            console.warn(`[${industry}] 批次 ${batch + 1}: ⚠️ gemini-3-pro JSON 直接解析失败，尝试修复...`, parseError)
            console.warn(`[${industry}] 批次 ${batch + 1}: gemini-3-pro 解析错误详情:`, parseError instanceof Error ? parseError.message : String(parseError))
            
            // 尝试提取 JSON 数组部分
            const jsonMatch = jsonContent.match(/\[[\s\S]*\]/)
            if (jsonMatch) {
              try {
                scenes = JSON.parse(jsonMatch[0])
                console.log(`[${industry}] 批次 ${batch + 1}: ✅ gemini-3-pro JSON 修复成功（提取数组），获得 ${scenes.length} 条场景词`)
              } catch (retryError) {
                console.error(`[${industry}] 批次 ${batch + 1}: ❌ gemini-3-pro JSON 修复失败`, retryError)
                console.error(`[${industry}] 批次 ${batch + 1}: gemini-3-pro 修复错误详情:`, retryError instanceof Error ? retryError.message : String(retryError))
                console.error(`[${industry}] 批次 ${batch + 1}: gemini-3-pro 尝试解析的内容:`, jsonMatch[0].substring(0, 500))
                throw new Error(`无法解析 JSON: ${retryError instanceof Error ? retryError.message : String(retryError)}`)
              }
            } else {
              console.error(`[${industry}] 批次 ${batch + 1}: ❌ gemini-3-pro 无法找到 JSON 数组，原始内容:`, jsonContent.substring(0, 1000))
              throw new Error('无法找到 JSON 数组，可能 API 返回的不是 JSON 格式')
            }
          }

          // 调整 ID 并过滤
          scenes.forEach((scene, idx) => {
            scene.id = batch * batchSize + idx + 1
          })
          
          const validScenes = scenes.filter(s => s && s.use_case && s.use_case.trim().length > 30)
          const filteredCount = scenes.length - validScenes.length
          if (filteredCount > 0) {
            console.warn(`[${industry}] 批次 ${batch + 1}: gemini-3-pro 过滤掉 ${filteredCount} 条无效场景词`)
          }
          
          scenes = validScenes
          
          // 🔥 步骤 2：保存这批场景词（等待全部保存完成后再继续下一批）
          if (scenes.length > 0) {
            // 🔥 在更新生成数量和保存前，再次检查是否应该停止
            const preSaveCheck = await checkShouldStop()
            if (preSaveCheck.shouldStop) {
              console.log(`[${industry}] 批次 ${batch + 1}: ⛔ 保存前检测到任务已终止，立即停止`)
              break
            }
            if (preSaveCheck.isPaused) {
              console.log(`[${industry}] 批次 ${batch + 1}: ⏸️ 保存前检测到任务已暂停，跳过此批次`)
              continue
            }
            
            // 🔥 立即更新 total_scenes_generated，让前端显示"已生成 X 条，正在保存..."
            try {
              const { data: currentTask } = await tasksTable()
                .select('total_scenes_generated')
                .eq('id', taskId)
                .single()
              
              const currentGenerated = (currentTask as Database['public']['Tables']['batch_generation_tasks']['Row'])?.total_scenes_generated || 0
              
              await tasksTable()
                .update({
                  total_scenes_generated: currentGenerated + scenes.length,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', taskId)
              
              console.log(`[${industry}] 批次 ${batch + 1}: 📊 已更新生成数量: ${currentGenerated + scenes.length} 条，开始保存...`)
            } catch (updateError) {
              console.warn(`[${industry}] 批次 ${batch + 1}: 更新生成数量失败（继续保存）:`, updateError)
            }
            
            console.log(`[${industry}] 批次 ${batch + 1}: 💾 开始保存 ${scenes.length} 条场景词...`)
            const saveResult = await saveBatchScenes(scenes, industry, useCaseType, taskId, supabase, batch + 1)
            totalSavedCount += saveResult.savedCount
            totalFailedCount += saveResult.failedCount
            allErrors.push(...saveResult.errors)
            
            // 🔥 记录保存结果（包括跳过的数量）
            const skippedInfo = saveResult.skippedCount > 0 ? `，跳过 ${saveResult.skippedCount} 条（质量过低）` : ''
            console.log(`[${industry}] 批次 ${batch + 1}: ✅ 保存完成！成功 ${saveResult.savedCount} 条，失败 ${saveResult.failedCount} 条${skippedInfo}`)
            
            // 🔥 检查保存失败率，如果超过 50%，停止避免浪费积分
            // 注意：跳过的数量不计入失败率计算（因为这是主动跳过，不是真正的失败）
            const totalAttempted = saveResult.savedCount + saveResult.failedCount
            const saveFailureRate = totalAttempted > 0 ? saveResult.failedCount / totalAttempted : 0
            
            if (saveFailureRate > 0.5) {
              console.error(`[${industry}] 批次 ${batch + 1}: ⚠️⚠️⚠️ gemini-3-pro 保存失败率过高 (${(saveFailureRate * 100).toFixed(1)}%)，停止生成避免浪费积分`)
              allErrors.push(`批次 ${batch + 1} (gemini-3-pro fallback) 保存失败率过高 (${(saveFailureRate * 100).toFixed(1)}%)，已停止生成`)
              break // 停止整个循环，避免继续调用 API 浪费积分
            }
            
            // 如果保存成功率 >= 50%，添加所有场景词（因为已经调用 API 了）
            allScenes.push(...scenes)
            console.log(`[${industry}] 批次 ${batch + 1}: 📊 累计统计 - 已生成 ${allScenes.length} 条，已保存 ${totalSavedCount} 条，失败 ${totalFailedCount} 条`)
            
            // 🔥 步骤 3：这批已完成，继续下一批（如果还有）
            if (batch + 1 < batches) {
              console.log(`[${industry}] 批次 ${batch + 1} 完成，准备生成批次 ${batch + 2}/${batches}...`)
            }
          }
        } catch (proError) {
          console.error(`[${industry}] 批次 ${batch + 1}: 所有模型都失败:`, proError)
          // 🔥 即使所有模型都失败，也继续下一个批次，避免整个任务失败
          const errorMsg = proError instanceof Error ? proError.message : String(proError)
          allErrors.push(`批次 ${batch + 1} (所有模型) 生成失败: ${errorMsg}`)
          console.warn(`[${industry}] 批次 ${batch + 1}: ⚠️ 所有模型都失败，跳过此批次，继续下一个批次`)
          // 不抛出错误，继续下一个批次
        }
      }
    }
  }

  return {
    scenes: allScenes.slice(0, scenesPerIndustry),
    savedCount: totalSavedCount,
    failedCount: totalFailedCount,
    errors: allErrors,
  }
}

/**
 * 保存一批场景词（带重试机制）
 */
async function saveBatchScenes(
  scenes: Array<{ id: number; use_case: string }>,
  industry: string,
  useCaseType: string,
  taskId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  batchNumber: number
): Promise<{
  savedCount: number
  failedCount: number
  skippedCount: number // 🔥 新增：因质量过低而跳过的数量
  errors: string[]
}> {
  const { saveSceneToDatabase } = await import('./save-scene')
  const tasksTable = () => supabase.from('batch_generation_tasks')
  
  let savedCount = 0
  let failedCount = 0
  let skippedCount = 0 // 🔥 新增：因质量过低而跳过的数量
  const errors: string[] = []

  // 🔥 辅助函数：检查任务是否应该停止或暂停（在保存循环中使用）
  const checkShouldStopInSave = async (): Promise<{ shouldStop: boolean; isPaused: boolean }> => {
    const { data: checkTask } = await tasksTable()
      .select('should_stop, status, is_paused')
      .eq('id', taskId)
      .single()
    
    return {
      shouldStop: checkTask?.should_stop === true || checkTask?.status === 'cancelled',
      isPaused: checkTask?.is_paused === true,
    }
  }

  for (let j = 0; j < scenes.length; j++) {
    const scene = scenes[j]
    
    // 🔥 检查是否应该停止或暂停（在每条保存前检查）
    const { shouldStop, isPaused } = await checkShouldStopInSave()
    
    if (shouldStop) {
      console.log(`[${industry}] 批次 ${batchNumber}: ⛔ 任务已终止，立即停止保存场景词`)
      break
    }
    
    if (isPaused) {
      console.log(`[${industry}] 批次 ${batchNumber}: ⏸️ 任务已暂停，等待恢复...`)
      // 等待恢复（最多等待 10 秒）
      let waitCount = 0
      while (waitCount < 10) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        const check = await checkShouldStopInSave()
        if (!check.isPaused) {
          console.log(`[${industry}] 批次 ${batchNumber}: ▶️ 任务已恢复，继续保存`)
          break
        }
        if (check.shouldStop) {
          console.log(`[${industry}] 批次 ${batchNumber}: ⛔ 任务已终止，停止保存`)
          break
        }
        waitCount++
      }
      
      // 如果仍然暂停或已终止，停止保存
      const finalCheck = await checkShouldStopInSave()
      if (finalCheck.isPaused) {
        console.log(`[${industry}] 批次 ${batchNumber}: ⏸️ 任务仍然暂停，停止保存`)
        break
      }
      if (finalCheck.shouldStop) {
        console.log(`[${industry}] 批次 ${batchNumber}: ⛔ 任务已终止，停止保存`)
        break
      }
    }

    // 🔥 增强的重试机制，避免第5个行业时出错
    let retryCount = 0
    const maxRetries = 5 // 增加重试次数到5次
    let saved = false
    
    while (retryCount <= maxRetries && !saved) {
      try {
        await saveSceneToDatabase(industry, scene, useCaseType, supabase)
        savedCount++
        saved = true
        
        // 🔥 每保存一条立即更新进度，让前端实时看到保存进度
        // 注意：虽然逐条更新会增加数据库操作，但可以提供实时反馈
        // 如果希望更简单，可以改为批量更新（每10条更新一次）
        try {
          const { data: currentTask } = await tasksTable()
            .select('total_scenes_saved')
            .eq('id', taskId)
            .single()
          
          const currentSaved = (currentTask as Database['public']['Tables']['batch_generation_tasks']['Row'])?.total_scenes_saved || 0
          
          // 立即更新已保存的数量（每保存一条就更新一次）
          // 注意：这里使用 service client，不依赖管理员会话，即使会话过期也能继续保存
          await tasksTable()
            .update({
              total_scenes_saved: currentSaved + 1, // 每次只增加1，因为是一条一条保存的
              updated_at: new Date().toISOString(),
            })
            .eq('id', taskId)
        } catch (updateError) {
          console.warn(`[${industry}] 批次 ${batchNumber}: 更新进度失败（继续保存）:`, updateError)
          // 即使更新失败，也继续保存，避免中断
        }
        
        if (retryCount > 0) {
          console.log(`[${industry}] 批次 ${batchNumber}: 场景词 ${j + 1} 重试成功 (${retryCount}/${maxRetries})`)
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        
        // 🔥 检查是否是质量过低错误（主动跳过，不计入失败）
        const isQualityTooLow = (error as Error & { isQualityTooLow?: boolean })?.isQualityTooLow === true
        
        if (isQualityTooLow) {
          // 质量过低，跳过保存（不计入失败，不计入重试）
          skippedCount++
          errors.push(`场景词 ${j + 1}: ${errorMessage}`)
          console.warn(`[${industry}] 批次 ${batchNumber}: 场景词 ${j + 1} 质量过低，已跳过保存`)
          saved = true // 标记为已处理，退出重试循环
          break
        }
        
        // 真正的保存失败，需要重试
        retryCount++
        
        // 🔥 检查是否是数据库连接错误
        const isConnectionError = errorMessage.includes('ECONNRESET') || 
                                  errorMessage.includes('connection') ||
                                  errorMessage.includes('timeout') ||
                                  errorMessage.includes('ETIMEDOUT')
        
        if (retryCount > maxRetries) {
          failedCount++
          const fullError = `场景词 ${j + 1}: ${errorMessage}`
          errors.push(fullError)
          console.error(`[${industry}] 批次 ${batchNumber}: 保存场景词 ${j + 1} 最终失败 (${retryCount}/${maxRetries}):`, errorMessage)
          
          // 🔥 如果是连接错误，等待更长时间再继续下一个
          if (isConnectionError) {
            console.warn(`[${industry}] 批次 ${batchNumber}: 检测到连接错误，等待 2 秒后继续...`)
            await new Promise((resolve) => setTimeout(resolve, 2000))
          }
        } else {
          // 🔥 根据错误类型调整重试延迟
          let retryDelay = 1000 * retryCount
          if (isConnectionError) {
            retryDelay = 2000 * retryCount // 连接错误时延迟更长
          }
          
          console.warn(`[${industry}] 批次 ${batchNumber}: 保存场景词 ${j + 1} 失败，${retryDelay}ms 后重试 (${retryCount}/${maxRetries}):`, errorMessage)
          await new Promise((resolve) => setTimeout(resolve, retryDelay))
        }
      }
    }
    
    // 🔥 增加延迟，避免数据库压力过大和连接超时（特别是第5个行业时）
    if (j < scenes.length - 1) {
      // 根据已保存数量动态调整延迟，避免累积压力
      const baseDelay = 150 // 基础延迟增加到150ms
      const batchMultiplier = Math.floor(savedCount / 100) // 每100条增加延迟
      const delay = baseDelay + (batchMultiplier * 50) // 最多增加到300ms
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
    
    // 🔥 每保存 10 条记录一次日志（进度更新已在保存时完成）
    if ((j + 1) % 10 === 0) {
      try {
        const { data: currentTask } = await tasksTable()
          .select('total_scenes_saved')
          .eq('id', taskId)
          .single()
        
        const currentSaved = (currentTask as Database['public']['Tables']['batch_generation_tasks']['Row'])?.total_scenes_saved || 0
        const skippedInfo = skippedCount > 0 ? `，跳过 ${skippedCount} 条（质量过低）` : ''
        const failedInfo = failedCount > 0 ? `，失败 ${failedCount} 条` : ''
        console.log(`[${industry}] 批次 ${batchNumber}: 已保存 ${j + 1}/${scenes.length} 条场景词，累计保存 ${currentSaved} 条${skippedInfo}${failedInfo}`)
      } catch (logError) {
        // 日志记录失败不影响保存流程
        console.warn(`[${industry}] 批次 ${batchNumber}: 记录日志失败:`, logError)
      }
    }
  }

  return { savedCount, failedCount, skippedCount, errors }
}

