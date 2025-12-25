/**
 * 行业商业价值分类
 * 用于定价策略、内容推荐、功能分级
 * 
 * 分类标准：
 * - 高价行业：ROI明确，视频直接影响收入，愿意长期付费
 * - 中价行业：稳定复购，视频是重要工具
 * - 拉流量行业：主要用于SEO和品牌曝光
 */

export type BusinessTier = 'premium' | 'standard' | 'traffic'

export interface IndustryPlatform {
  platform: string
  scenarios: string[]
}

export interface IndustryConfig {
  industry: string
  businessTier: BusinessTier
  recommendedPlatforms: IndustryPlatform[]
  pricingStrategy: {
    suggestedPlans: string[]
    featureLevel: 'enterprise' | 'professional' | 'starter'
    notes: string
  }
  contentStrategy: {
    focus: string[]
    avoid: string[]
    notes: string
  }
}

// 💰 高价行业（愿意长期付费）
export const PREMIUM_INDUSTRIES: IndustryConfig[] = [
  {
    industry: 'Digital Marketing Agencies',
    businessTier: 'premium',
    recommendedPlatforms: [
      { platform: 'All', scenarios: ['Client ads', 'White-label videos', 'Multi-brand campaigns', 'Performance creatives'] },
    ],
    pricingStrategy: {
      suggestedPlans: ['Enterprise', 'Team', 'Annual'],
      featureLevel: 'enterprise',
      notes: '强调"转化"，推高阶套餐，年付+团队账号',
    },
    contentStrategy: {
      focus: ['转化率', 'ROI', '客户案例', '批量生成'],
      avoid: ['基础教程'],
      notes: '重点强调转化效果和批量生产能力',
    },
  },
  {
    industry: 'E-commerce Stores',
    businessTier: 'premium',
    recommendedPlatforms: [
      { platform: 'TikTok', scenarios: ['Product demo', 'UGC-style ads', 'Dropshipping videos'] },
      { platform: 'Instagram', scenarios: ['Product demo', 'UGC-style ads', 'Seasonal promotions'] },
      { platform: 'Ads', scenarios: ['Performance creatives', 'Conversion ads'] },
    ],
    pricingStrategy: {
      suggestedPlans: ['Professional', 'Annual'],
      featureLevel: 'professional',
      notes: '强调"转化"，推高阶套餐',
    },
    contentStrategy: {
      focus: ['产品展示', '转化率', '季节性营销'],
      avoid: ['艺术性内容'],
      notes: '重点强调销售转化',
    },
  },
  {
    industry: 'SaaS Companies',
    businessTier: 'premium',
    recommendedPlatforms: [
      { platform: 'YouTube', scenarios: ['Product demo', 'Feature explainer', 'Onboarding videos'] },
      { platform: 'Website', scenarios: ['Landing page videos', 'Product demo'] },
      { platform: 'Ads', scenarios: ['Performance creatives'] },
    ],
    pricingStrategy: {
      suggestedPlans: ['Enterprise', 'Team', 'Annual'],
      featureLevel: 'enterprise',
      notes: '更高积分消耗，高阶模型，团队&API',
    },
    contentStrategy: {
      focus: ['产品演示', '功能说明', '用户引导'],
      avoid: ['娱乐内容'],
      notes: '专业、清晰、转化导向',
    },
  },
  {
    industry: 'Personal Branding',
    businessTier: 'premium',
    recommendedPlatforms: [
      { platform: 'Instagram', scenarios: ['Authority building', 'Thought leadership', 'Aesthetic videos'] },
      { platform: 'TikTok', scenarios: ['Faceless content', 'Daily short videos'] },
      { platform: 'YouTube', scenarios: ['Authority building', 'Thought leadership'] },
    ],
    pricingStrategy: {
      suggestedPlans: ['Professional', 'Annual'],
      featureLevel: 'professional',
      notes: '年付+团队账号',
    },
    contentStrategy: {
      focus: ['个人品牌', '权威性', '持续输出'],
      avoid: ['一次性内容'],
      notes: '强调品牌一致性和长期价值',
    },
  },
  {
    industry: 'Coaches & Consultants',
    businessTier: 'premium',
    recommendedPlatforms: [
      { platform: 'YouTube', scenarios: ['Educational content', 'Authority building'] },
      { platform: 'Instagram', scenarios: ['Educational shorts', 'Authority building'] },
    ],
    pricingStrategy: {
      suggestedPlans: ['Professional', 'Annual'],
      featureLevel: 'professional',
      notes: '年付+团队账号',
    },
    contentStrategy: {
      focus: ['教育内容', '权威性', '客户案例'],
      avoid: ['娱乐内容'],
      notes: '专业、有价值、转化导向',
    },
  },
  {
    industry: 'Beauty & Skincare Brands',
    businessTier: 'premium',
    recommendedPlatforms: [
      { platform: 'Instagram', scenarios: ['Product visuals', 'Before/after storytelling', 'Brand aesthetic videos'] },
      { platform: 'TikTok', scenarios: ['Product visuals', 'Before/after storytelling'] },
    ],
    pricingStrategy: {
      suggestedPlans: ['Professional', 'Annual'],
      featureLevel: 'professional',
      notes: '强调"转化"，推高阶套餐',
    },
    contentStrategy: {
      focus: ['产品视觉效果', '前后对比', '品牌美学'],
      avoid: ['低质量内容'],
      notes: '高质量视觉，品牌一致性',
    },
  },
  {
    industry: 'Real Estate Marketing',
    businessTier: 'premium',
    recommendedPlatforms: [
      { platform: 'YouTube', scenarios: ['Property showcase', 'Listing videos', 'Realtor branding'] },
      { platform: 'Instagram', scenarios: ['Property showcase', 'Realtor branding'] },
    ],
    pricingStrategy: {
      suggestedPlans: ['Professional', 'Annual'],
      featureLevel: 'professional',
      notes: '强调"转化"，推高阶套餐',
    },
    contentStrategy: {
      focus: ['房产展示', '房源视频', '经纪人品牌'],
      avoid: ['不相关内容'],
      notes: '专业、清晰、转化导向',
    },
  },
]

// ⚖️ 中价行业（稳定复购）
export const STANDARD_INDUSTRIES: IndustryConfig[] = [
  {
    industry: 'Fitness Trainers',
    businessTier: 'standard',
    recommendedPlatforms: [
      { platform: 'Instagram', scenarios: ['Workout previews', 'Motivation clips', 'Program promotion'] },
      { platform: 'TikTok', scenarios: ['Workout previews', 'Motivation clips', 'Short-form education'] },
      { platform: 'YouTube', scenarios: ['Workout previews', 'Short-form education'] },
    ],
    pricingStrategy: {
      suggestedPlans: ['Monthly', 'Starter'],
      featureLevel: 'starter',
      notes: '月订阅，场景模板，平台型套餐',
    },
    contentStrategy: {
      focus: ['训练预览', '激励内容', '项目推广'],
      avoid: ['完整课程'],
      notes: '短格式，高频更新',
    },
  },
  {
    industry: 'Fashion Brands',
    businessTier: 'standard',
    recommendedPlatforms: [
      { platform: 'Instagram', scenarios: ['Lookbook videos', 'Seasonal campaigns', 'Outfit inspiration'] },
      { platform: 'TikTok', scenarios: ['Lookbook videos', 'Seasonal campaigns'] },
    ],
    pricingStrategy: {
      suggestedPlans: ['Monthly', 'Starter'],
      featureLevel: 'starter',
      notes: '月订阅，场景模板',
    },
    contentStrategy: {
      focus: ['造型展示', '季节性营销', '穿搭灵感'],
      avoid: ['非季节性内容'],
      notes: '时尚感，季节性',
    },
  },
  {
    industry: 'Online Courses',
    businessTier: 'standard',
    recommendedPlatforms: [
      { platform: 'YouTube', scenarios: ['Course promotion', 'Educational shorts', 'Webinar trailers'] },
      { platform: 'Instagram', scenarios: ['Course promotion', 'Educational shorts', 'Student testimonials'] },
    ],
    pricingStrategy: {
      suggestedPlans: ['Monthly', 'Starter'],
      featureLevel: 'starter',
      notes: '月订阅，场景模板',
    },
    contentStrategy: {
      focus: ['课程推广', '教育短片', '学员见证'],
      avoid: ['完整课程内容'],
      notes: '推广导向，教育价值',
    },
  },
  {
    industry: 'Restaurants & Cafes',
    businessTier: 'standard',
    recommendedPlatforms: [
      { platform: 'Instagram', scenarios: ['Menu promotion', 'Atmosphere videos', 'Local ads'] },
      { platform: 'TikTok', scenarios: ['Menu promotion', 'Atmosphere videos'] },
    ],
    pricingStrategy: {
      suggestedPlans: ['Monthly', 'Starter'],
      featureLevel: 'starter',
      notes: '月订阅，场景模板',
    },
    contentStrategy: {
      focus: ['菜单推广', '氛围视频', '本地广告'],
      avoid: ['不相关内容'],
      notes: '本地化，氛围感',
    },
  },
  {
    industry: 'Travel Agencies',
    businessTier: 'standard',
    recommendedPlatforms: [
      { platform: 'Instagram', scenarios: ['Destination videos', 'Hotel promotion', 'Experience storytelling'] },
      { platform: 'YouTube', scenarios: ['Destination videos', 'Experience storytelling'] },
    ],
    pricingStrategy: {
      suggestedPlans: ['Monthly', 'Starter'],
      featureLevel: 'starter',
      notes: '月订阅，场景模板',
    },
    contentStrategy: {
      focus: ['目的地视频', '酒店推广', '体验故事'],
      avoid: ['不相关内容'],
      notes: '视觉冲击，体验感',
    },
  },
]

// 📈 拉流量行业（主要用于SEO和品牌曝光）
export const TRAFFIC_INDUSTRIES: IndustryConfig[] = [
  {
    industry: 'Students',
    businessTier: 'traffic',
    recommendedPlatforms: [
      { platform: 'TikTok', scenarios: ['Educational content', 'Study tips'] },
      { platform: 'Instagram', scenarios: ['Educational content'] },
    ],
    pricingStrategy: {
      suggestedPlans: ['Free', 'Starter'],
      featureLevel: 'starter',
      notes: '免费额度，模板限制，引导升级',
    },
    contentStrategy: {
      focus: ['教育内容', '学习技巧'],
      avoid: ['商业内容'],
      notes: '免费内容为主，引导升级',
    },
  },
  {
    industry: 'Hobby Creators',
    businessTier: 'traffic',
    recommendedPlatforms: [
      { platform: 'TikTok', scenarios: ['Creative content'] },
      { platform: 'Instagram', scenarios: ['Creative content'] },
    ],
    pricingStrategy: {
      suggestedPlans: ['Free', 'Starter'],
      featureLevel: 'starter',
      notes: '免费额度，模板限制',
    },
    contentStrategy: {
      focus: ['创意内容'],
      avoid: ['商业内容'],
      notes: '免费内容为主',
    },
  },
  {
    industry: 'NGOs',
    businessTier: 'traffic',
    recommendedPlatforms: [
      { platform: 'All', scenarios: ['Awareness campaigns', 'Storytelling'] },
    ],
    pricingStrategy: {
      suggestedPlans: ['Free', 'Starter'],
      featureLevel: 'starter',
      notes: '免费额度，公益折扣',
    },
    contentStrategy: {
      focus: ['意识提升', '故事讲述'],
      avoid: ['商业内容'],
      notes: '公益导向',
    },
  },
  {
    industry: 'Artists',
    businessTier: 'traffic',
    recommendedPlatforms: [
      { platform: 'Instagram', scenarios: ['Portfolio showcase'] },
      { platform: 'TikTok', scenarios: ['Creative process'] },
    ],
    pricingStrategy: {
      suggestedPlans: ['Free', 'Starter'],
      featureLevel: 'starter',
      notes: '免费额度，模板限制',
    },
    contentStrategy: {
      focus: ['作品展示', '创作过程'],
      avoid: ['商业内容'],
      notes: '艺术导向',
    },
  },
  {
    industry: 'Small Local Shops',
    businessTier: 'traffic',
    recommendedPlatforms: [
      { platform: 'Instagram', scenarios: ['Local ads', 'Product showcase'] },
      { platform: 'TikTok', scenarios: ['Local ads'] },
    ],
    pricingStrategy: {
      suggestedPlans: ['Free', 'Starter'],
      featureLevel: 'starter',
      notes: '免费额度，引导升级',
    },
    contentStrategy: {
      focus: ['本地广告', '产品展示'],
      avoid: ['大范围营销'],
      notes: '本地化，小规模',
    },
  },
]

// 所有行业配置
export const ALL_INDUSTRY_CONFIGS: IndustryConfig[] = [
  ...PREMIUM_INDUSTRIES,
  ...STANDARD_INDUSTRIES,
  ...TRAFFIC_INDUSTRIES,
]

// 根据行业名称获取配置
export function getIndustryConfig(industry: string): IndustryConfig | undefined {
  return ALL_INDUSTRY_CONFIGS.find(config => config.industry === industry)
}

// 根据商业价值层级获取行业列表
export function getIndustriesByTier(tier: BusinessTier): string[] {
  const configs = tier === 'premium' 
    ? PREMIUM_INDUSTRIES 
    : tier === 'standard' 
    ? STANDARD_INDUSTRIES 
    : TRAFFIC_INDUSTRIES
  return configs.map(config => config.industry)
}

// 判断行业是否为高价行业
export function isPremiumIndustry(industry: string): boolean {
  return PREMIUM_INDUSTRIES.some(config => config.industry === industry)
}

// 判断行业是否为拉流量行业
export function isTrafficIndustry(industry: string): boolean {
  return TRAFFIC_INDUSTRIES.some(config => config.industry === industry)
}

