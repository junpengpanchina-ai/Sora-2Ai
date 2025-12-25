/**
 * 智能模型选择器
 * 根据消息内容自动选择最适合的 Gemini 模型
 */

/**
 * 检测消息内容是否涉及成本对比、价格售价、同行分析等复杂分析任务
 */
export function detectComplexAnalysisTask(content: string): {
  needsAdvancedModel: boolean
  needsProModel: boolean
  keywords: string[]
} {
  const contentLower = content.toLowerCase()
  
  // 关键词列表：成本对比、价格售价、同行分析相关
  const costPriceKeywords = [
    '成本', '价格', '售价', '定价', '费用', '收费', '价格对比', '成本对比',
    'cost', 'price', 'pricing', 'fee', 'charge', 'cost comparison', 'price comparison',
    '价格分析', '成本分析', '定价策略', '价格策略',
    'pricing analysis', 'cost analysis', 'pricing strategy'
  ]
  
  const competitorKeywords = [
    '同行', '竞争对手', '竞品', '对比', '比较', 'vs', 'versus',
    'competitor', 'competition', 'rival', 'compare', 'comparison',
    '同行分析', '竞品分析', '竞争对手分析',
    'competitor analysis', 'competitive analysis'
  ]
  
  const complexAnalysisKeywords = [
    '市场分析', '行业分析', '趋势分析', '深度分析', '综合分析',
    'market analysis', 'industry analysis', 'trend analysis', 'deep analysis',
    'comprehensive analysis', 'strategic analysis'
  ]
  
  // 检测是否包含相关关键词
  const foundKeywords: string[] = []
  let needsAdvancedModel = false
  let needsProModel = false
  
  // 检查成本/价格相关关键词
  const hasCostPrice = costPriceKeywords.some(keyword => {
    if (contentLower.includes(keyword)) {
      foundKeywords.push(keyword)
      return true
    }
    return false
  })
  
  // 检查竞争对手相关关键词
  const hasCompetitor = competitorKeywords.some(keyword => {
    if (contentLower.includes(keyword)) {
      foundKeywords.push(keyword)
      return true
    }
    return false
  })
  
  // 检查复杂分析关键词
  const hasComplexAnalysis = complexAnalysisKeywords.some(keyword => {
    if (contentLower.includes(keyword)) {
      foundKeywords.push(keyword)
      return true
    }
    return false
  })
  
  // 如果同时包含成本/价格和竞争对手关键词，需要高级模型
  if ((hasCostPrice || hasCompetitor) && (hasCostPrice && hasCompetitor || hasComplexAnalysis)) {
    needsAdvancedModel = true
    // 如果内容很长或包含多个复杂关键词，可能需要 Pro 模型
    if (content.length > 1000 || foundKeywords.length >= 3) {
      needsProModel = true
    }
  } else if (hasCostPrice || hasCompetitor) {
    needsAdvancedModel = true
  }
  
  // 检查是否有图片（如果有图片，可能需要更高级的模型）
  // 这个会在调用时通过 images 参数判断
  
  return {
    needsAdvancedModel,
    needsProModel,
    keywords: foundKeywords,
  }
}

/**
 * 根据消息内容智能选择模型
 * @param content 消息文本内容
 * @param images 图片数组（如果有）
 * @returns 推荐的模型名称
 */
export function selectModel(
  content: string,
  images: string[] = []
): 'gemini-2-flash' | 'gemini-3-flash' | 'gemini-3-pro' {
  // 如果有图片，优先使用支持多模态的模型
  if (images.length > 0) {
    // 检测是否需要复杂分析
    const analysis = detectComplexAnalysisTask(content)
    if (analysis.needsProModel) {
      return 'gemini-3-pro'
    }
    if (analysis.needsAdvancedModel) {
      return 'gemini-3-flash'
    }
    // 默认使用 gemini-3-flash 处理图片（因为 2-flash 可能不支持多模态）
    return 'gemini-3-flash'
  }
  
  // 纯文本消息，检测是否需要复杂分析
  const analysis = detectComplexAnalysisTask(content)
  
  if (analysis.needsProModel) {
    return 'gemini-3-pro'
  }
  
  if (analysis.needsAdvancedModel) {
    return 'gemini-3-flash'
  }
  
  // 默认使用 gemini-2-flash（成本最低）
  return 'gemini-2-flash'
}

/**
 * 获取模型说明
 */
export function getModelDescription(model: string): string {
  switch (model) {
    case 'gemini-2-flash':
      return '快速响应，成本最低，适合一般对话'
    case 'gemini-3-flash':
      return '支持联网搜索，适合成本对比、价格分析、同行分析'
    case 'gemini-3-pro':
      return '最高质量，适合复杂分析任务'
    default:
      return '未知模型'
  }
}

