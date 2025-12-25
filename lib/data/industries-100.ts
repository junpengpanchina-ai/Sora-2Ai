/**
 * 100 个高转化营销行业列表
 * 基于真实商业目标：持续、高频、可转化的「营销内容供给」
 * 每个行业都能持续扩展到 1 万条场景/创意
 * 
 * 筛选原则（全部满足）：
 * ✅ 长期有营销需求（不是一次性）
 * ✅ 视频是核心获客手段
 * ✅ 内容可无限拆分场景（≥1万条）
 * ✅ 用户愿意反复付费生成
 * 
 * 不包含：医疗诊所 / 政府 / 赌博 / 强合规 / 低转化行业
 * 
 * 已按「变现能力」排序
 */

export const INDUSTRIES_100 = [
  // 🟢 A 类：内容创作者 & 社媒变现（1-20）- 最赚钱、最高频
  'TikTok Creators',
  'YouTube Creators',
  'Instagram Reels Creators',
  'Short Video Matrix Accounts',
  'AI Content Creators',
  'Personal IP Building',
  'Knowledge Bloggers',
  'Tutorial Creators',
  'Emotional Resonance Accounts',
  'Storytelling Accounts',
  'Motivation Accounts',
  'Meditation & Relaxation Content',
  'Music Visualization Creators',
  'ASMR Creators',
  'Animated Short Video Accounts',
  'Drama Short Creators',
  'Meme Content Accounts',
  'AI Tool Review Bloggers',
  'Tech Review Bloggers',
  'Lifestyle Bloggers',
  
  // 🟢 B 类：品牌 & 电商（21-45）- 最稳定付费
  'E-commerce Brands',
  'DTC Brands',
  'Beauty Brands',
  'Skincare Brands',
  'Perfume Brands',
  'Jewelry Brands',
  'Watch Brands',
  'Fashion Brands',
  'Shoe Brands',
  'Bag Brands',
  'Home Goods Brands',
  'Furniture Brands',
  'Smart Home Brands',
  'Kitchenware Brands',
  'Consumer Electronics',
  'Phone Accessories Brands',
  'AI Hardware Brands',
  'Toy Brands',
  'Collectible Toy Brands',
  'Pet Products Brands',
  'Pet Food Brands',
  'Baby Products Brands',
  'Healthy Lifestyle Brands',
  'Outdoor Gear Brands',
  'Sports Equipment Brands',
  
  // 🟢 C 类：服务型高营销行业（46-65）- 视频=成交工具
  'Marketing Agencies',
  'Advertising Agencies',
  'Social Media Management',
  'Brand Consulting',
  'Content Marketing Companies',
  'Startup Promotion',
  'SaaS Product Marketing',
  'AI Tool Promotion',
  'App Promotion',
  'Game Promotion',
  'Mobile App Showcase',
  'Online Platform Promotion',
  'Membership Product Promotion',
  'Subscription Products',
  'Online Course Promotion',
  'Education Product Marketing',
  'Language Learning Products',
  'Coding Learning Platforms',
  'Professional Skills Training',
  'Personal Growth Courses',
  
  // 🟡 D 类：体验 / 场景驱动行业（66-80）- 非常适合"场景词爆炸"
  'Restaurant Brands',
  'Cafes',
  'Bars',
  'Bubble Tea Brands',
  'Hotel Brands',
  'Boutique Hotels',
  'Travel Destinations',
  'Travel Agencies',
  'Outdoor Experience Brands',
  'Adventure Experience Brands',
  'Wedding Planning',
  'Event Planning',
  'Exhibition Events',
  'Brand Pop-ups',
  'Urban Lifestyle Promotion',
  
  // 🟡 E 类：文化 / 情绪 / 审美（81-100）- 视频价值 > 产品价值
  'Music Labels',
  'Independent Musicians',
  'Visual Art Projects',
  'Digital Artists',
  'NFT & Digital Collectibles',
  'Animation IP',
  'Comic IP',
  'Game World Content',
  'Virtual Character IP',
  'Virtual Idols',
  'Script Writing Accounts',
  'Novel IP Promotion',
  'Film Concept Promotion',
  'Trailer Production',
  'Sci-Fi Content Creation',
  'Emotional Healing Content',
  'Meditation Space Content',
  'Aesthetic Video Accounts',
  'Premium Visual Content',
  'Abstract Art Content',
] as const

export type Industry100 = (typeof INDUSTRIES_100)[number]

/**
 * 验证行业是否在列表中
 */
export function isValidIndustry(industry: string): industry is Industry100 {
  return INDUSTRIES_100.includes(industry as Industry100)
}

// 重新导出优先级行业列表（用于向后兼容）
export { 
  INDUSTRIES_PRIORITY,
  INDUSTRIES_S_TIER,
  INDUSTRIES_A_PLUS_TIER,
  INDUSTRIES_A_TIER,
  INDUSTRIES_B_TIER,
  INDUSTRIES_C_TIER,
  INDUSTRIES_BLACKLIST,
  getIndustryTier,
  isBlacklistedIndustry,
  isMarketingOnlyIndustry,
  isPriorityIndustry,
} from './industries-priority'
