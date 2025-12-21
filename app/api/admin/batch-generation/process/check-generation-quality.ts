/**
 * 检查生成结果的质量
 * 判断是否需要 fallback 到 gemini-3-flash
 */

export interface GenerationQualityCheck {
  needsFallback: boolean
  needsProModel: boolean // 是否需要使用 gemini-3-pro
  reason?: string
  issues: string[]
}

/**
 * 检查生成结果的质量
 * @param scenes 生成的场景词数组
 * @param expectedCount 期望的数量
 * @param rawContent 原始 API 响应内容（用于检测错误）
 * @returns 质量检查结果
 */
export function checkGenerationQuality(
  scenes: Array<{ id: number; use_case: string }>,
  expectedCount: number,
  rawContent?: string
): GenerationQualityCheck {
  const issues: string[] = []
  let needsFallback = false
  let reason = ''

  // 触发方式 A：数量不足
  if (scenes.length < expectedCount * 0.5) {
    needsFallback = true
    reason = `生成数量不足：期望 ${expectedCount} 条，实际 ${scenes.length} 条`
    issues.push(`数量不足：${scenes.length}/${expectedCount}`)
  }

  // 触发方式 B：空数组或空内容
  if (scenes.length === 0) {
    needsFallback = true
    reason = '生成结果为空数组'
    issues.push('空数组')
  }

  // 检查是否有空内容
  const emptyScenes = scenes.filter(s => !s.use_case || s.use_case.trim().length === 0)
  if (emptyScenes.length > 0) {
    needsFallback = true
    reason = `包含 ${emptyScenes.length} 条空内容`
    issues.push(`空内容：${emptyScenes.length} 条`)
  }

  // 触发方式 A：检测无意义内容
  if (rawContent) {
    const contentLower = rawContent.toLowerCase()
    
    // 检测常见错误响应
    const errorPatterns = [
      'no data',
      'not found',
      "i don't know",
      'i cannot',
      'i am unable',
      'sorry, i',
      '无法生成',
      '没有找到',
      '不知道',
    ]
    
    const hasErrorPattern = errorPatterns.some(pattern => 
      contentLower.includes(pattern)
    )
    
    if (hasErrorPattern) {
      needsFallback = true
      reason = '检测到错误响应或无意义内容'
      issues.push('错误响应模式')
    }

    // 检测重复内容（可能是模型卡住了）
    if (scenes.length > 0) {
      const firstUseCase = scenes[0].use_case
      const duplicateCount = scenes.filter(s => 
        s.use_case === firstUseCase || 
        s.use_case.substring(0, 50) === firstUseCase.substring(0, 50)
      ).length
      
      if (duplicateCount > scenes.length * 0.3) {
        needsFallback = true
        reason = `检测到大量重复内容：${duplicateCount}/${scenes.length} 条重复`
        issues.push(`重复内容：${duplicateCount} 条`)
      }
    }
  }

  // 检查内容质量（长度过短可能是无效内容）
  const shortScenes = scenes.filter(s => 
    s.use_case && s.use_case.trim().length < 30
  )
  if (shortScenes.length > scenes.length * 0.2) {
    needsFallback = true
    reason = `内容质量差：${shortScenes.length} 条内容过短`
    issues.push(`内容过短：${shortScenes.length} 条`)
  }

  // 判断是否需要 Level 3 (gemini-3-pro)
  let needsProModel = false

  // 触发条件 1：全部都是重复内容
  if (scenes.length > 0) {
    const firstUseCase = scenes[0].use_case
    const duplicateCount = scenes.filter(s => 
      s.use_case === firstUseCase || 
      s.use_case.substring(0, 50) === firstUseCase.substring(0, 50)
    ).length
    
    if (duplicateCount > scenes.length * 0.8) {
      needsProModel = true
      reason = `严重重复：${duplicateCount}/${scenes.length} 条内容完全重复，需要最高质量模型`
      issues.push(`严重重复：${duplicateCount} 条`)
    }
  }

  // 触发条件 2：某些行业仍然无法生成（数量为 0 或极少）
  if (scenes.length === 0 || (scenes.length < expectedCount * 0.1 && expectedCount >= 10)) {
    needsProModel = true
    reason = `完全无法生成：仅生成 ${scenes.length}/${expectedCount} 条，需要最高质量模型`
    issues.push(`完全无法生成：${scenes.length}/${expectedCount}`)
  }

  // 触发条件 3：需要非常专业领域解释（在 detect-cold-industry 中已处理，这里作为额外检查）
  // 这个会在调用时通过 isColdIndustry 判断

  return {
    needsFallback,
    needsProModel,
    reason: needsFallback ? reason : undefined,
    issues,
  }
}

