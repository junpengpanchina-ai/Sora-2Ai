/**
 * 行业优先级列表（按 SEO 回报排序）
 * 
 * 排序逻辑：
 * SEO 回报 = 搜索需求 × 视频刚需 × 商业付费能力 × 可规模化
 */

// 🟢 S 级（必须优先，先吃 60% 资源）
// 注意：行业名称需要与数据库中的实际值匹配
export const INDUSTRIES_S_TIER = [
  'Social Media Marketing',
  'TikTok Creators',
  'Instagram Creators',
  'YouTube Creators',
  'Digital Marketing Agencies',
  'E-commerce Stores',
  'E-commerce Brands', // 别名
  'Dropshipping Businesses',
  'SaaS Companies',
  'Product Marketing',
  'Personal Branding',
  'Personal IP Building', // 别名
] as const

// 🟢 A+ 级（第二梯队，稳定流量池）
export const INDUSTRIES_A_PLUS_TIER = [
  'Online Courses',
  'Coaches & Consultants',
  'Coaching & Consulting', // 别名
  'Real Estate Marketing',
  'Fitness Trainers',
  'Beauty & Skincare Brands',
  'Beauty Brands', // 别名
  'Skincare Brands', // 别名
  'Fashion Brands',
  'Restaurants & Cafes',
  'Restaurants', // 别名
  'Cafes', // 别名
  'Travel Agencies',
  'Travel & Tourism', // 别名
  'Hotels & Resorts',
  'Hotels', // 别名
  'Event Promotion',
  'Event Planning', // 别名
] as const

// 🟢 A 级（规模放大器）
export const INDUSTRIES_A_TIER = [
  'Mobile Apps',
  'Startups',
  'Gaming Content Creators',
  'Education Content Creators',
  'Photography & Videography',
  'Wedding Planning',
  'Interior Design',
  'Architecture Firms',
  'Automotive Marketing',
  'Local Businesses',
] as const

// 🟡 B 级（可做，但不是优先）
export const INDUSTRIES_B_TIER = [
  'NGOs',
  'Non-profit Campaigns',
  'Museums & Exhibitions',
  'Art Projects',
  'Music Promotion',
  'Podcasts',
  'Book Publishing',
  'Language Learning',
  'Career Coaching',
  'HR & Recruitment',
] as const

// 🔴 C 级（只做少量验证）
export const INDUSTRIES_C_TIER = [
  'Healthcare Clinics',
  'Dental Clinics',
  'Medical Services',
  'Legal Services',
  'Insurance',
  'Finance Consulting',
  'Crypto Education',
  'Investment Courses',
  'Government Programs',
  'Universities',
] as const

// ❌ 永久黑名单（直接从系统剔除）
export const INDUSTRIES_BLACKLIST = [
  // 高风险行业
  'Gambling',
  'Casinos',
  'Lottery',
  'Adult Content',
  'Pornography',
  // 非法/灰产
  'Crack Software',
  'Illegal Finance',
  'Money Laundering',
  'Private Servers',
] as const

// 🟡 仅限营销场景的行业（不做深度内容）
export const INDUSTRIES_MARKETING_ONLY = [
  'Dental Clinics', // 只允许：广告/品牌/介绍
  'Hospitals', // 只允许：宣传片
  'Finance', // 只允许：品牌视频
  'Insurance', // 只允许：解释类动画
  'Education Institutions', // 只允许：招生/课程介绍
] as const

// 所有优先行业（S + A+ + A 级）
export const INDUSTRIES_PRIORITY = [
  ...INDUSTRIES_S_TIER,
  ...INDUSTRIES_A_PLUS_TIER,
  ...INDUSTRIES_A_TIER,
] as const

// 所有允许的行业（S + A+ + A + B 级）
export const INDUSTRIES_ALLOWED = [
  ...INDUSTRIES_S_TIER,
  ...INDUSTRIES_A_PLUS_TIER,
  ...INDUSTRIES_A_TIER,
  ...INDUSTRIES_B_TIER,
] as const

// 行业优先级映射（用于排序）
export const INDUSTRY_TIER_MAP = new Map<string, number>([
  // S 级 = 5
  ...INDUSTRIES_S_TIER.map((industry) => [industry, 5] as const),
  // A+ 级 = 4
  ...INDUSTRIES_A_PLUS_TIER.map((industry) => [industry, 4] as const),
  // A 级 = 3
  ...INDUSTRIES_A_TIER.map((industry) => [industry, 3] as const),
  // B 级 = 2
  ...INDUSTRIES_B_TIER.map((industry) => [industry, 2] as const),
  // C 级 = 1
  ...INDUSTRIES_C_TIER.map((industry) => [industry, 1] as const),
])

/**
 * 获取行业优先级（数字越大优先级越高）
 */
export function getIndustryTier(industry: string | null): number {
  if (!industry) return 0
  return INDUSTRY_TIER_MAP.get(industry) || 0
}

/**
 * 判断行业是否在黑名单
 */
export function isBlacklistedIndustry(industry: string | null): boolean {
  if (!industry) return false
  return (INDUSTRIES_BLACKLIST as readonly string[]).includes(industry)
}

/**
 * 判断行业是否仅限营销场景
 */
export function isMarketingOnlyIndustry(industry: string | null): boolean {
  if (!industry) return false
  return (INDUSTRIES_MARKETING_ONLY as readonly string[]).includes(industry)
}

/**
 * 判断行业是否为优先行业（S + A+ + A 级）
 */
export function isPriorityIndustry(industry: string | null): boolean {
  if (!industry) return false
  return (INDUSTRIES_PRIORITY as readonly string[]).includes(industry)
}

