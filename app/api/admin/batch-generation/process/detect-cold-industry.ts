/**
 * 检测是否为冷门行业（需要联网搜索）
 * 冷门行业通常需要真实数据和专业术语
 */

// 冷门行业关键词列表（如果包含这些词，直接使用 gemini-3-flash）
const COLD_INDUSTRY_KEYWORDS = [
  // 医学/医疗
  'medical', 'healthcare', 'pharmaceutical', 'surgery', 'diagnostic',
  // 工程/制造
  'manufacturing', 'engineering', 'industrial', 'machinery', 'automation',
  // 专业服务
  'legal', 'accounting', 'consulting', 'audit', 'compliance',
  // 技术/研发
  'research', 'development', 'laboratory', 'testing', 'quality control',
  // 特殊行业
  'mining', 'petroleum', 'chemical', 'aerospace', 'defense',
  // 中文冷门词
  '医疗', '制药', '工程', '制造', '法律', '审计', '研发', '实验室',
  '矿业', '石油', '化工', '航空航天', '国防',
]

// 极端专业领域关键词（需要直接使用 gemini-3-pro）
const EXTREME_PROFESSIONAL_KEYWORDS = [
  // 医学/医疗（极端专业）
  'surgery', 'diagnostic', 'pharmaceutical', 'clinical', 'therapeutic',
  // 工程（极端专业）
  'aerospace', 'defense', 'nuclear', 'biomedical', 'nanotechnology',
  // 金融（极端专业）
  'investment banking', 'quantitative', 'actuarial', 'risk management',
  // 中文极端专业词
  '手术', '诊断', '制药', '临床', '治疗', '航空航天', '国防', '核能',
  '生物医学', '纳米技术', '投资银行', '量化', '精算', '风险管理',
]

/**
 * 检测行业是否为冷门行业
 * @param industry 行业名称
 * @returns true 如果是冷门行业，需要直接使用 gemini-3-flash
 */
export function isColdIndustry(industry: string): boolean {
  const industryLower = industry.toLowerCase()
  return COLD_INDUSTRY_KEYWORDS.some(keyword => 
    industryLower.includes(keyword.toLowerCase())
  )
}

/**
 * 检测行业是否需要极端专业模型（gemini-3-pro）
 * @param industry 行业名称
 * @returns true 如果需要极端专业模型，直接使用 gemini-3-pro
 */
export function needsProModel(industry: string): boolean {
  const industryLower = industry.toLowerCase()
  return EXTREME_PROFESSIONAL_KEYWORDS.some(keyword => 
    industryLower.includes(keyword.toLowerCase())
  )
}

