/**
 * 通用文本识别工具
 * 用于从结构化文本中提取字段信息并自动填充表单
 */

/**
 * 检测文本是否为备注/解释行
 * 支持多种语言的备注格式
 */
export function isRemarkLine(line: string): boolean {
  const trimmed = line.trim()
  
  // 匹配各种语言的备注格式
  const remarkPatterns = [
    /^\/\/\s*(中文解释|解释|备注|说明|comment|explanation|note|remark|หมายเหตุ|คำอธิบาย|شرح|تعليق|комментарий|объяснение|примечание)/i,
    /^#\s*(中文解释|解释|备注|说明|comment|explanation|note|remark|หมายเหตุ|คำอธิบาย|شرح|تعليق|комментарий|объяснение|примечание)/i,
    /^\/\*\s*(中文解释|解释|备注|说明)/i,
    /^\*\s*(中文解释|解释|备注|说明)/i,
  ]
  
  return remarkPatterns.some((pattern) => pattern.test(trimmed))
}

/**
 * 移除行尾的备注
 * 支持多种语言的备注格式，特别针对中文解释
 */
export function removeInlineRemark(line: string): string {
  // 优先匹配中文解释格式：// 中文解释：...
  const chineseRemarkPattern = /\s*\/\/\s*中文解释[:：]\s*.*$/i
  if (chineseRemarkPattern.test(line)) {
    return line.replace(chineseRemarkPattern, '').trim()
  }
  
  // 匹配行尾的备注：内容 // 备注内容 或 内容 # 备注内容
  const inlineRemarkPatterns = [
    /\s*\/\/\s*(中文解释|解释|备注|说明|comment|explanation|note|remark|หมายเหตุ|คำอธิบาย|شرح|تعليق|комментарий|объяснение|примечание)[:：]?.*$/i,
    /\s*#\s*(中文解释|解释|备注|说明|comment|explanation|note|remark|หมายเหตุ|คำอธิบาย|شرح|تعليق|комментарий|объяснение|примечание)[:：]?.*$/i,
  ]
  
  let cleaned = line
  for (const pattern of inlineRemarkPatterns) {
    cleaned = cleaned.replace(pattern, '')
  }
  return cleaned.trim()
}

/**
 * 清理值中的备注（支持多语言）
 */
export function cleanValue(value: string): string {
  // 移除各种语言的备注格式
  // 对于多行内容，逐行处理，移除备注行和行尾备注
  return value
    .split('\n')
    .map((line) => {
      // 先移除行尾备注
      const cleaned = removeInlineRemark(line)
      // 如果整行是备注行，返回空字符串
      if (isRemarkLine(line)) {
        return ''
      }
      // 如果包含中文解释，移除整行
      if (cleaned.includes('// 中文解释：') || cleaned.includes('// 中文解释:')) {
        return ''
      }
      return cleaned
    })
    .filter((line) => {
      const trimmed = line.trim()
      // 过滤空行和纯备注行
      if (!trimmed) return false
      if (isRemarkLine(trimmed)) return false
      if (trimmed.includes('// 中文解释：') || trimmed.includes('// 中文解释:')) return false
      return true
    })
    .join('\n')
    .trim()
}

/**
 * 识别字段标签并提取对应的值
 * 支持多语言标签识别
 */
export function extractFieldValue(text: string, fieldLabels: string[]): string | null {
  for (const label of fieldLabels) {
    // 转义特殊字符用于正则表达式
    const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    
    // 匹配格式：标签: 值 或 标签 (任何语言): 值
    // 支持多种分隔符：: :：| \t
    const patterns = [
      // 标准格式：标签: 值
      new RegExp(`^${escapedLabel}\\s*[:：]\\s*(.+)$`, 'im'),
      // 带括号说明：标签 (说明): 值
      new RegExp(`^${escapedLabel}\\s*\\([^)]+\\)\\s*[:：]\\s*(.+)$`, 'im'),
      // 表格格式：标签 | 值
      new RegExp(`^${escapedLabel}\\s*[|\\t]\\s*(.+)$`, 'im'),
    ]
    
    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match && match[1]) {
        const value = match[1].trim()
        const cleaned = cleanValue(value)
        if (cleaned && cleaned.length > 0) {
          return cleaned
        }
      }
    }
    
    // 匹配多行格式：标签在行首，值在下一行或同一行
    const multilinePattern = new RegExp(
      `^${escapedLabel}\\s*[:：]?\\s*\\n?\\s*(.+?)(?=\\n\\s*[\\u4e00-\\u9fa5a-zA-Z]+\\s*[:：]|$)`,
      'ims'
    )
    const multilineMatch = text.match(multilinePattern)
    if (multilineMatch && multilineMatch[1]) {
      const value = multilineMatch[1].trim()
      const cleaned = cleanValue(value)
      if (cleaned && cleaned.length > 0) {
        return cleaned
      }
    }
  }
  return null
}

/**
 * 提取数组字段（如标签、关键词等，支持逗号、换行分隔）
 */
export function extractArrayField(text: string, fieldLabels: string[]): string[] {
  const value = extractFieldValue(text, fieldLabels)
  if (!value) return []
  
  // 支持逗号、换行、分号分隔
  return value
    .split(/[,，\n;；]/)
    .map((item) => cleanValue(item))
    .filter((item) => item.length > 0)
}

