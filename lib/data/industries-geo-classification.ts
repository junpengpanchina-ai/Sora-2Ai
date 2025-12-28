/**
 * GEO 行业分类（基于 AI 引用率，不是 SEO 流量）
 * 
 * 分类标准：AI 搜索"缺答案程度"
 * - A类：AI 不敢乱说，必须引用（医疗/工程/法律/制造）
 * - B类：引用率高，但有竞争（房地产/SaaS/教育）
 * - C类：更多是 SEO，不是 GEO（营销/个人品牌）
 */

// 🥇 A类行业（AI 最缺内容，最容易引用）
export const GEO_A_INDUSTRIES = [
  'Healthcare Clinics',
  'Dental Clinics',
  'Medical Services',
  'Hospitals',
  'Veterinary Clinics',
  'Industrial Manufacturing',
  'Engineering Services',
  'Construction',
  'Architecture Firms',
  'Legal Services',
  'Financial Compliance',
  'Risk Management',
  'Corporate Training',
  'HR & Recruitment',
  'Enterprise SaaS',
  'B2B Software Tools',
  'Professional Services',
  'Technical Consulting',
  'Safety Training',
  'Compliance Training',
] as const

// 🥈 B类行业（引用率高，但有竞争）
export const GEO_B_INDUSTRIES = [
  'Real Estate Marketing',
  'Real Estate',
  'E-commerce Stores',
  'E-commerce Brands',
  'Travel Agencies',
  'Travel Destinations',
  'Restaurant Brands',
  'Restaurants & Cafes',
  'Fitness Trainers',
  'Beauty & Skincare Brands',
  'Medical Aesthetics',
  'Coaches & Consultants',
  'Content Creators',
  'Creator Tools',
  'Game Promotion',
  'Game Studios',
  'SaaS Companies',
  'SaaS Product Marketing',
  'Online Courses',
  'Education Product Marketing',
  'Language Learning Products',
  'Professional Skills Training',
] as const

// 🥉 C类行业（更多是 SEO，不是 GEO）
export const GEO_C_INDUSTRIES = [
  'Personal Branding',
  'Personal IP Building',
  'Social Media Marketing',
  'Digital Marketing Agencies',
  'Marketing Agencies',
  'Advertising Agencies',
  'Content Marketing Companies',
  'TikTok Creators',
  'YouTube Creators',
  'Instagram Creators',
  'Lifestyle Bloggers',
  'Influencer Marketing',
] as const

/**
 * 获取行业的 GEO 分类
 */
export function getGEOIndustryClass(industry: string | null): 'A' | 'B' | 'C' | 'none' {
  if (!industry) return 'none'
  
  if ((GEO_A_INDUSTRIES as readonly string[]).includes(industry)) return 'A'
  if ((GEO_B_INDUSTRIES as readonly string[]).includes(industry)) return 'B'
  if ((GEO_C_INDUSTRIES as readonly string[]).includes(industry)) return 'C'
  
  return 'none'
}

/**
 * 检查行业是否属于 GEO 高价值行业（A 或 B）
 */
export function isGEOHighValueIndustry(industry: string | null): boolean {
  const geoClass = getGEOIndustryClass(industry)
  return geoClass === 'A' || geoClass === 'B'
}

/**
 * 获取 GEO 行业排序（用于 AI 引用率排序）
 * A类 = 3分，B类 = 2分，C类 = 1分，其他 = 0分
 */
export function getGEOIndustryScore(industry: string | null): number {
  const geoClass = getGEOIndustryClass(industry)
  if (geoClass === 'A') return 3
  if (geoClass === 'B') return 2
  if (geoClass === 'C') return 1
  return 0
}

