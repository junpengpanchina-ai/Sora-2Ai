/**
 * 生成行业场景词（智能 Fallback 机制）
 * 默认使用 gemini-2.5-flash，失败时自动切换到 gemini-3-flash（联网搜索）
 */
export async function generateIndustryScenes(
  industry: string,
  scenesPerIndustry: number,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _useCaseType: string // 保留参数以保持接口一致性
): Promise<Array<{ id: number; use_case: string }>> {
  const { createChatCompletion } = await import('@/lib/grsai/client')
  const { isColdIndustry, needsProModel } = await import('./detect-cold-industry')
  const { checkGenerationQuality } = await import('./check-generation-quality')
  
  const systemPrompt = `You are an SEO expert specializing in AI video generation use cases. Generate highly specific, practical, real-world use cases for AI video generation. All output must be in English.

CRITICAL: The AI video platform ONLY supports 10-second or 15-second videos. NEVER mention any duration longer than 15 seconds (such as 20 seconds, 30 seconds, 45 seconds, 60 seconds, 1 minute, 2 minutes, etc.). When describing video examples, ALWAYS use "10 seconds" or "15 seconds" only.`

  // 三级 Fallback 机制：
  // Level 1: gemini-2.5-flash（默认，低成本）
  // Level 2: gemini-3-flash（联网搜索，中等成本）
  // Level 3: gemini-3-pro（最高质量，高成本，极端情况）
  
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

    let rawContent = ''
    let scenes: Array<{ id: number; use_case: string }> = []
    let needsFallback = false
    let needsPro = false

    // Level 1: 尝试使用 gemini-2.5-flash（除非是冷门行业或极端专业领域）
    if (!isCold && !needsPro) {
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

        rawContent = response.choices?.[0]?.message?.content || ''
        if (!rawContent) {
          throw new Error('生成的内容为空')
        }

        console.log(`[${industry}] 批次 ${batch + 1}: 收到内容长度 ${rawContent.length} 字符`)

        // 解析 JSON
        const jsonContent = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        
        try {
          scenes = JSON.parse(jsonContent)
          console.log(`[${industry}] 批次 ${batch + 1}: 成功解析 JSON，获得 ${scenes.length} 条场景词`)
        } catch (parseError) {
          console.warn(`[${industry}] 批次 ${batch + 1}: JSON 解析失败，尝试修复...`, parseError)
          const jsonMatch = jsonContent.match(/\[[\s\S]*\]/)
          if (jsonMatch) {
            try {
              scenes = JSON.parse(jsonMatch[0])
              console.log(`[${industry}] 批次 ${batch + 1}: JSON 修复成功，获得 ${scenes.length} 条场景词`)
            } catch (retryError) {
              console.error(`[${industry}] 批次 ${batch + 1}: JSON 修复失败`, retryError)
              throw new Error('无法解析 JSON')
            }
          } else {
            throw new Error('无法解析 JSON')
          }
        }

        // 调整 ID 并过滤
        scenes.forEach((scene, idx) => {
          scene.id = batch * batchSize + idx + 1
        })
        
        const validScenes = scenes.filter(s => s && s.use_case && s.use_case.trim().length > 50)
        const filteredCount = scenes.length - validScenes.length
        if (filteredCount > 0) {
          console.warn(`[${industry}] 批次 ${batch + 1}: 过滤掉 ${filteredCount} 条无效场景词`)
        }
        
        scenes = validScenes

        // 🔥 强制检查：如果返回空数组，立即触发 fallback（最高优先级）
        if (scenes.length === 0) {
          needsFallback = true
          console.warn(`[${industry}] 批次 ${batch + 1}: ⚠️ gemini-2.5-flash 返回空数组，强制切换到 gemini-3-flash（联网搜索）`)
          console.warn(`[${industry}] 批次 ${batch + 1}: 原始内容长度: ${rawContent.length} 字符`)
          console.warn(`[${industry}] 批次 ${batch + 1}: JSON 内容预览: ${rawContent.substring(0, 200)}...`)
        } else {
          // 检查生成质量（触发方式 A 和 B）
          const qualityCheck = checkGenerationQuality(scenes, currentBatchSize, rawContent)
          if (qualityCheck.needsProModel) {
            // 需要 Level 3 (gemini-3-pro)
            needsPro = true
            needsFallback = true
            console.warn(`[${industry}] 批次 ${batch + 1}: 质量检查显示需要 gemini-3-pro（最高质量模型）`)
            console.warn(`[${industry}] 失败原因: ${qualityCheck.reason}`)
            console.warn(`[${industry}] 问题列表:`, qualityCheck.issues)
          } else if (qualityCheck.needsFallback) {
            // 需要 Level 2 (gemini-3-flash)
            needsFallback = true
            console.warn(`[${industry}] 批次 ${batch + 1}: 质量检查失败，需要 fallback 到 gemini-3-flash（联网搜索）`)
            console.warn(`[${industry}] 失败原因: ${qualityCheck.reason}`)
            console.warn(`[${industry}] 问题列表:`, qualityCheck.issues)
          } else {
            // 2.5-flash 生成成功，直接使用
            allScenes.push(...scenes)
            console.log(`[${industry}] 批次 ${batch + 1}: ✅ gemini-2.5-flash 生成成功，添加 ${scenes.length} 条场景词，累计 ${allScenes.length} 条`)
          }
        }
      } catch (error) {
        console.error(`[${industry}] 批次 ${batch + 1}: ❌ gemini-2.5-flash 生成失败:`, error)
        console.error(`[${industry}] 错误详情:`, error instanceof Error ? error.message : String(error))
        needsFallback = true
        // 如果生成失败，清空 scenes 数组，确保会触发 fallback
        scenes = []
        console.warn(`[${industry}] 批次 ${batch + 1}: 🔄 将强制切换到 gemini-3-flash（联网搜索）`)
      }
    } else if (needsPro) {
      // 极端专业领域直接使用 gemini-3-pro
      needsFallback = true
      console.log(`[${industry}] 批次 ${batch + 1}: 极端专业领域，直接使用 gemini-3-pro（最高质量）`)
    } else {
      // 冷门行业直接使用 gemini-3-flash
      needsFallback = true
      console.log(`[${industry}] 批次 ${batch + 1}: 冷门行业，直接使用 gemini-3-flash（联网搜索）`)
    }

    // Level 3: 如果需要最高质量模型，使用 gemini-3-pro（联网搜索）
    if (needsPro) {
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

        rawContent = response.choices?.[0]?.message?.content || ''
        if (!rawContent) {
          throw new Error('gemini-3-pro 生成的内容为空')
        }

        console.log(`[${industry}] 批次 ${batch + 1}: gemini-3-pro 收到内容长度 ${rawContent.length} 字符`)

        // 解析 JSON
        const jsonContent = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        
        try {
          scenes = JSON.parse(jsonContent)
          console.log(`[${industry}] 批次 ${batch + 1}: gemini-3-pro 成功解析 JSON，获得 ${scenes.length} 条场景词`)
        } catch (parseError) {
          console.warn(`[${industry}] 批次 ${batch + 1}: gemini-3-pro JSON 解析失败，尝试修复...`, parseError)
          const jsonMatch = jsonContent.match(/\[[\s\S]*\]/)
          if (jsonMatch) {
            try {
              scenes = JSON.parse(jsonMatch[0])
              console.log(`[${industry}] 批次 ${batch + 1}: gemini-3-pro JSON 修复成功，获得 ${scenes.length} 条场景词`)
            } catch (retryError) {
              console.error(`[${industry}] 批次 ${batch + 1}: gemini-3-pro JSON 修复失败`, retryError)
              throw new Error('无法解析 JSON')
            }
          } else {
            throw new Error('无法解析 JSON')
          }
        }

        // 调整 ID 并过滤
        scenes.forEach((scene, idx) => {
          scene.id = batch * batchSize + idx + 1
        })
        
        const validScenes = scenes.filter(s => s && s.use_case && s.use_case.trim().length > 50)
        const filteredCount = scenes.length - validScenes.length
        if (filteredCount > 0) {
          console.warn(`[${industry}] 批次 ${batch + 1}: gemini-3-pro 过滤掉 ${filteredCount} 条无效场景词`)
        }
        
        scenes = validScenes
        allScenes.push(...scenes)
        console.log(`[${industry}] 批次 ${batch + 1}: gemini-3-pro 生成成功，添加 ${scenes.length} 条场景词，累计 ${allScenes.length} 条`)
      } catch (error) {
        console.error(`[${industry}] 批次 ${batch + 1}: gemini-3-pro 也失败:`, error)
        // 如果 3-pro 也失败，抛出错误
        throw new Error(`生成失败：所有模型都失败 - ${error instanceof Error ? error.message : String(error)}`)
      }
    }
    // Level 2: 如果需要 fallback（但不是极端专业），使用 gemini-3-flash（联网搜索）
    // 🔥 强制检查：如果 scenes 为空或需要 fallback，必须切换到 3-flash
    if ((needsFallback && !needsPro) || (scenes.length === 0 && !needsPro)) {
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

        rawContent = response.choices?.[0]?.message?.content || ''
        if (!rawContent) {
          throw new Error('gemini-3-flash 生成的内容为空')
        }

        console.log(`[${industry}] 批次 ${batch + 1}: gemini-3-flash 收到内容长度 ${rawContent.length} 字符`)

        // 解析 JSON
        const jsonContent = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        
        try {
          scenes = JSON.parse(jsonContent)
          console.log(`[${industry}] 批次 ${batch + 1}: gemini-3-flash 成功解析 JSON，获得 ${scenes.length} 条场景词`)
        } catch (parseError) {
          console.warn(`[${industry}] 批次 ${batch + 1}: gemini-3-flash JSON 解析失败，尝试修复...`, parseError)
          const jsonMatch = jsonContent.match(/\[[\s\S]*\]/)
          if (jsonMatch) {
            try {
              scenes = JSON.parse(jsonMatch[0])
              console.log(`[${industry}] 批次 ${batch + 1}: gemini-3-flash JSON 修复成功，获得 ${scenes.length} 条场景词`)
            } catch (retryError) {
              console.error(`[${industry}] 批次 ${batch + 1}: gemini-3-flash JSON 修复失败`, retryError)
              throw new Error('无法解析 JSON')
            }
          } else {
            throw new Error('无法解析 JSON')
          }
        }

        // 调整 ID 并过滤
        scenes.forEach((scene, idx) => {
          scene.id = batch * batchSize + idx + 1
        })
        
        const validScenes = scenes.filter(s => s && s.use_case && s.use_case.trim().length > 50)
        const filteredCount = scenes.length - validScenes.length
        if (filteredCount > 0) {
          console.warn(`[${industry}] 批次 ${batch + 1}: gemini-3-flash 过滤掉 ${filteredCount} 条无效场景词`)
        }
        
        scenes = validScenes
        
        // 🔥 再次强制检查：如果 3-flash 也返回空数组，需要切换到 3-pro
        if (scenes.length === 0) {
          console.error(`[${industry}] 批次 ${batch + 1}: ⚠️ gemini-3-flash 也返回空数组，将切换到 gemini-3-pro（最高质量）`)
          needsPro = true
          needsFallback = true
        } else {
          allScenes.push(...scenes)
          console.log(`[${industry}] 批次 ${batch + 1}: ✅ gemini-3-flash 生成成功，添加 ${scenes.length} 条场景词，累计 ${allScenes.length} 条`)
        }
      } catch (error) {
        console.error(`[${industry}] 批次 ${batch + 1}: ❌ gemini-3-flash 失败，强制切换到 gemini-3-pro...`, error)
        console.error(`[${industry}] 批次 ${batch + 1}: 错误详情:`, error instanceof Error ? error.message : String(error))
        // Level 3 Fallback: 如果 3-flash 也失败，强制切换到 3-pro
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

          rawContent = response.choices?.[0]?.message?.content || ''
          if (!rawContent) {
            throw new Error('gemini-3-pro 生成的内容为空')
          }

          console.log(`[${industry}] 批次 ${batch + 1}: gemini-3-pro 收到内容长度 ${rawContent.length} 字符`)

          // 解析 JSON
          const jsonContent = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
          
          try {
            scenes = JSON.parse(jsonContent)
            console.log(`[${industry}] 批次 ${batch + 1}: gemini-3-pro 成功解析 JSON，获得 ${scenes.length} 条场景词`)
          } catch (parseError) {
            console.warn(`[${industry}] 批次 ${batch + 1}: gemini-3-pro JSON 解析失败，尝试修复...`, parseError)
            const jsonMatch = jsonContent.match(/\[[\s\S]*\]/)
            if (jsonMatch) {
              try {
                scenes = JSON.parse(jsonMatch[0])
                console.log(`[${industry}] 批次 ${batch + 1}: gemini-3-pro JSON 修复成功，获得 ${scenes.length} 条场景词`)
              } catch (retryError) {
                console.error(`[${industry}] 批次 ${batch + 1}: gemini-3-pro JSON 修复失败`, retryError)
                throw new Error('无法解析 JSON')
              }
            } else {
              throw new Error('无法解析 JSON')
            }
          }

          // 调整 ID 并过滤
          scenes.forEach((scene, idx) => {
            scene.id = batch * batchSize + idx + 1
          })
          
          const validScenes = scenes.filter(s => s && s.use_case && s.use_case.trim().length > 50)
          const filteredCount = scenes.length - validScenes.length
          if (filteredCount > 0) {
            console.warn(`[${industry}] 批次 ${batch + 1}: gemini-3-pro 过滤掉 ${filteredCount} 条无效场景词`)
          }
          
          scenes = validScenes
          allScenes.push(...scenes)
          console.log(`[${industry}] 批次 ${batch + 1}: gemini-3-pro 生成成功，添加 ${scenes.length} 条场景词，累计 ${allScenes.length} 条`)
        } catch (proError) {
          console.error(`[${industry}] 批次 ${batch + 1}: 所有模型都失败:`, proError)
          throw new Error(`生成失败：gemini-2.5-flash、gemini-3-flash 和 gemini-3-pro 都失败 - ${proError instanceof Error ? proError.message : String(proError)}`)
        }
      }
    }

    // 批次之间稍作延迟
    if (batch < batches - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }

  return allScenes.slice(0, scenesPerIndustry)
}

