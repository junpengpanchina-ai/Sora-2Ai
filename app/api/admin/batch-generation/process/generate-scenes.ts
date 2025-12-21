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
        
        // 🔥 详细记录过滤过程（降低过滤阈值，从 50 字符改为 30 字符，避免误过滤）
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
        
        allScenes.push(...scenes)
        console.log(`[${industry}] 批次 ${batch + 1}: ✅ gemini-3-pro 生成成功，添加 ${scenes.length} 条场景词，累计 ${allScenes.length} 条`)
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
        
        // 🔥 详细记录过滤过程
        const beforeFilter = scenes.length
        const validScenes = scenes.filter(s => {
          if (!s) {
            console.warn(`[${industry}] 批次 ${batch + 1}: gemini-3-flash 发现 null/undefined 场景词`)
            return false
          }
          if (!s.use_case) {
            console.warn(`[${industry}] 批次 ${batch + 1}: gemini-3-flash 发现缺少 use_case 的场景词:`, s)
            return false
          }
          if (s.use_case.trim().length <= 50) {
            console.warn(`[${industry}] 批次 ${batch + 1}: gemini-3-flash 发现内容过短的场景词（${s.use_case.trim().length} 字符）:`, s.use_case.substring(0, 100))
            return false
          }
          return true
        })
        const filteredCount = beforeFilter - validScenes.length
        
        if (filteredCount > 0) {
          console.warn(`[${industry}] 批次 ${batch + 1}: ⚠️ gemini-3-flash 过滤掉 ${filteredCount} 条无效场景词（原始: ${beforeFilter} 条，有效: ${validScenes.length} 条）`)
        }
        
        scenes = validScenes
        
        // 🔥 再次强制检查：如果 3-flash 也返回空数组，需要切换到 3-pro
        if (scenes.length === 0) {
          console.error(`[${industry}] 批次 ${batch + 1}: ⚠️⚠️⚠️ 严重问题：gemini-3-flash 也返回空数组！`)
          console.error(`[${industry}] 批次 ${batch + 1}: 原始内容长度: ${rawContent.length} 字符`)
          console.error(`[${industry}] 批次 ${batch + 1}: JSON 解析前数量: ${beforeFilter} 条`)
          console.error(`[${industry}] 批次 ${batch + 1}: 过滤后数量: ${validScenes.length} 条`)
          console.error(`[${industry}] 批次 ${batch + 1}: 将切换到 gemini-3-pro（最高质量）以避免浪费积分`)
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


