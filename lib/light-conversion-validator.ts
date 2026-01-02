/**
 * 轻转化模块校验工具
 * 
 * 用于验证和插入"轻转化模块"（Safe Conversion Blocks）
 * 不破坏 GEO 结构，不触发商业信号
 */

export type LightConversionType = 'cognitive-extension' | 'learning-path' | 'context-comparison'

export interface LightConversionModule {
  type: LightConversionType
  title: string
  content: string
}

// 轻转化模块模板库
export const LIGHT_CONVERSION_MODULES: Record<LightConversionType, LightConversionModule> = {
  'cognitive-extension': {
    type: 'cognitive-extension',
    title: 'What You Can Explore Next',
    content: `In many learning environments, understanding a concept is often just the first step. 
People usually benefit from seeing how the same idea is applied across slightly different situations or levels of complexity.

For example, visual explanations can help learners compare correct and incorrect techniques, observe gradual improvement, or understand how small adjustments affect outcomes. This type of exploration helps build confidence before applying knowledge independently.

In similar contexts, structured visual examples are often used to support gradual skill development and reinforce understanding without overwhelming the learner.`
  },
  'learning-path': {
    type: 'learning-path',
    title: 'Learning Path Considerations',
    content: `When approaching this topic, learners often benefit from progressing through a clear sequence. 
Starting with foundational concepts helps build confidence before moving on to more detailed or technical elements.

In many cases, structured learning paths allow individuals to absorb information at their own pace, revisit difficult sections, and apply knowledge more effectively across different contexts.`
  },
  'context-comparison': {
    type: 'context-comparison',
    title: 'Applying This in Different Contexts',
    content: `In practice, the way information is presented can vary depending on the setting. 
Some situations require concise visual explanations, while others benefit from more detailed walkthroughs or demonstrations.

Adapting the format to match the audience and context helps ensure clarity and consistency across different use cases.`
  }
}

/**
 * 校验轻转化模块是否符合规范
 */
export function validateLightConversion(content: string): {
  isValid: boolean
  hasSectionTitle: boolean
  hasForbiddenWords: boolean
  reasons: string[]
} {
  const reasons: string[] = []
  
  // 检查是否有合法的章节标题
  const validTitles = [
    'What You Can Explore Next',
    'Learning Path Considerations',
    'Applying This in Different Contexts'
  ]
  
  const hasSectionTitle = validTitles.some(title => 
    content.includes(title)
  )
  
  if (!hasSectionTitle) {
    reasons.push('缺少合法的章节标题')
  }
  
  // 检查是否有禁止的词汇
  const forbiddenWords = [
    'sign up', 'get started', 'try now', 'pricing',
    'buy', 'purchase', 'upgrade', 'contact',
    'subscribe', 'register', 'download now',
    'click here', 'learn more', 'shop now'
  ]
  
  const contentLower = content.toLowerCase()
  const foundForbidden = forbiddenWords.filter(word => 
    contentLower.includes(word)
  )
  
  const hasForbiddenWords = foundForbidden.length > 0
  
  if (hasForbiddenWords) {
    reasons.push(`包含禁止词汇: ${foundForbidden.join(', ')}`)
  }
  
  // 检查是否包含第一人称（you/we）
  const hasFirstPerson = /\b(you|we|your|our)\b/i.test(content)
  if (hasFirstPerson) {
    reasons.push('包含第一人称（you/we），应保持中立')
  }
  
  // 检查是否包含产品名或品牌名
  const hasProductName = /\b(sora2|sora 2|sora-2)\b/i.test(content)
  if (hasProductName) {
    reasons.push('包含产品名称，应避免商业信号')
  }
  
  const isValid = hasSectionTitle && !hasForbiddenWords && !hasFirstPerson && !hasProductName
  
  return {
    isValid,
    hasSectionTitle,
    hasForbiddenWords,
    reasons
  }
}

/**
 * 检查内容是否有过度重复
 */
export function hasExcessiveRepetition(text: string, threshold: number = 2): boolean {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10)
  const counts: Record<string, number> = {}
  
  for (const s of sentences) {
    const key = s.trim().toLowerCase().replace(/\s+/g, ' ')
    if (!key || key.length < 20) continue
    counts[key] = (counts[key] || 0) + 1
  }
  
  return Object.values(counts).some(c => c > threshold)
}

/**
 * 计算轻转化软分数
 */
export function calculateConversionSoftScore(content: string): number {
  let score = 0
  
  // 检查是否有轻转化模块
  const hasModule = validateLightConversion(content).hasSectionTitle
  if (hasModule) score += 1
  
  // 检查语义是否自然（无 CTA）
  const validation = validateLightConversion(content)
  if (validation.isValid) score += 1
  
  // 检查是否有重复句
  if (!hasExcessiveRepetition(content)) score += 1
  
  return score
}

/**
 * 插入轻转化模块到内容中
 */
export function insertLightModule(
  content: string,
  moduleType: LightConversionType = 'cognitive-extension',
  insertAfter: string = 'Introduction'
): string {
  const conversionModule = LIGHT_CONVERSION_MODULES[moduleType]
  
  // 构建模块内容
  const moduleContent = `\n\n### ${conversionModule.title}\n\n${conversionModule.content}\n\n`
  
  // 查找插入点（在 Introduction 之后，How to Use 之前）
  const introPattern = new RegExp(`(## ${insertAfter}[\\s\\S]*?)(\\n## How to Use)`, 'i')
  
  if (introPattern.test(content)) {
    return content.replace(introPattern, `$1${moduleContent}$2`)
  }
  
  // 如果没有找到标准位置，尝试在第一个 H2 之后插入
  const firstH2Pattern = /(## [^\n]+\n\n[^\n]+)/i
  if (firstH2Pattern.test(content)) {
    return content.replace(firstH2Pattern, `$1${moduleContent}`)
  }
  
  // 如果都找不到，在内容中间插入
  const midPoint = Math.floor(content.length / 2)
  const before = content.slice(0, midPoint)
  const after = content.slice(midPoint)
  
  return before + moduleContent + after
}

/**
 * 根据页面类型选择最合适的轻转化模块
 */
export function selectBestModule(
  pageType: 'use_case' | 'keyword' | 'industry',
  industry?: string,
  useCaseType?: string
): LightConversionType {
  // 教育、培训类优先使用 learning-path
  if (industry?.toLowerCase().includes('education') || 
      industry?.toLowerCase().includes('training') ||
      useCaseType?.toLowerCase().includes('education')) {
    return 'learning-path'
  }
  
  // B2B、专业领域使用 context-comparison
  if (industry?.toLowerCase().includes('enterprise') ||
      industry?.toLowerCase().includes('b2b') ||
      useCaseType?.toLowerCase().includes('onboarding')) {
    return 'context-comparison'
  }
  
  // 默认使用 cognitive-extension（最安全）
  return 'cognitive-extension'
}

/**
 * 轻转化模块轮换器（防止模板痕迹）
 * 
 * 使用页面 ID 的哈希值来轮换模块，确保：
 * - 同一页面总是使用同一个模块（一致性）
 * - 不同页面使用不同模块（避免模板痕迹）
 */
export function rotateLightModule(
  pageId: string,
  pageType: 'use_case' | 'keyword' | 'industry',
  industry?: string,
  useCaseType?: string
): LightConversionType {
  // 先尝试根据内容类型选择
  const contentBased = selectBestModule(pageType, industry, useCaseType)
  
  // 如果内容类型明确，直接返回
  if (contentBased !== 'cognitive-extension') {
    return contentBased
  }
  
  // 否则使用轮换机制
  const modules: LightConversionType[] = [
    'cognitive-extension',
    'learning-path',
    'context-comparison'
  ]
  
  // 使用页面 ID 的简单哈希来选择模块
  let hash = 0
  for (let i = 0; i < pageId.length; i++) {
    hash = ((hash << 5) - hash) + pageId.charCodeAt(i)
    hash = hash & hash // Convert to 32bit integer
  }
  
  const index = Math.abs(hash) % modules.length
  return modules[index]
}

/**
 * 批量验证多个内容
 */
export function batchValidateLightConversion(
  contents: Array<{ id: string; content: string }>
): Array<{ id: string; isValid: boolean; score: number; reasons: string[] }> {
  return contents.map(({ id, content }) => {
    const validation = validateLightConversion(content)
    const score = calculateConversionSoftScore(content)
    
    return {
      id,
      isValid: validation.isValid,
      score,
      reasons: validation.reasons
    }
  })
}

