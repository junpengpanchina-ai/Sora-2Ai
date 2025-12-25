/**
 * 行业 × 平台 × 场景映射
 * 用于内容生成推荐和SEO优化
 * 
 * 基于前20个核心行业的最佳实践
 */

export interface IndustryPlatformScenario {
  industry: string
  platforms: Array<{
    platform: string
    scenarios: string[]
    priority: number // 1 = 最高优先级
  }>
}

/**
 * S 级行业 × 平台 × 场景配置
 */
export const S_TIER_INDUSTRY_SCENARIOS: IndustryPlatformScenario[] = [
  {
    industry: 'Social Media Marketing',
    platforms: [
      {
        platform: 'TikTok',
        scenarios: ['Ad creatives', 'Short-form video ideas', 'Brand storytelling', 'Conversion-focused videos'],
        priority: 1,
      },
      {
        platform: 'Instagram',
        scenarios: ['Ad creatives', 'Short-form video ideas', 'Brand storytelling', 'Conversion-focused videos'],
        priority: 1,
      },
      {
        platform: 'YouTube',
        scenarios: ['Brand storytelling', 'Conversion-focused videos'],
        priority: 2,
      },
    ],
  },
  {
    industry: 'TikTok Creators',
    platforms: [
      {
        platform: 'TikTok',
        scenarios: ['Viral hooks', 'Product review videos', 'Faceless videos', 'Trend-based content'],
        priority: 1,
      },
    ],
  },
  {
    industry: 'Instagram Creators',
    platforms: [
      {
        platform: 'Instagram',
        scenarios: ['Reels marketing', 'Personal branding', 'Aesthetic videos', 'Influencer campaigns'],
        priority: 1,
      },
    ],
  },
  {
    industry: 'YouTube Creators',
    platforms: [
      {
        platform: 'YouTube',
        scenarios: ['Shorts automation', 'Explainer videos', 'Channel trailers', 'Educational content'],
        priority: 1,
      },
    ],
  },
  {
    industry: 'Digital Marketing Agencies',
    platforms: [
      {
        platform: 'All',
        scenarios: ['Client ads', 'White-label videos', 'Multi-brand campaigns', 'Performance creatives'],
        priority: 1,
      },
    ],
  },
]

/**
 * A+ 级行业 × 平台 × 场景配置
 */
export const A_PLUS_TIER_INDUSTRY_SCENARIOS: IndustryPlatformScenario[] = [
  {
    industry: 'E-commerce Stores',
    platforms: [
      {
        platform: 'TikTok',
        scenarios: ['Product demo', 'UGC-style ads', 'Dropshipping videos', 'Seasonal promotions'],
        priority: 1,
      },
      {
        platform: 'Instagram',
        scenarios: ['Product demo', 'UGC-style ads', 'Seasonal promotions'],
        priority: 1,
      },
      {
        platform: 'Ads',
        scenarios: ['Performance creatives', 'Conversion ads'],
        priority: 2,
      },
    ],
  },
  {
    industry: 'SaaS Companies',
    platforms: [
      {
        platform: 'YouTube',
        scenarios: ['Product demo', 'Feature explainer', 'Onboarding videos'],
        priority: 1,
      },
      {
        platform: 'Website',
        scenarios: ['Landing page videos', 'Product demo'],
        priority: 1,
      },
      {
        platform: 'Ads',
        scenarios: ['Performance creatives'],
        priority: 2,
      },
    ],
  },
  {
    industry: 'Personal Branding',
    platforms: [
      {
        platform: 'Instagram',
        scenarios: ['Authority building', 'Thought leadership', 'Aesthetic videos'],
        priority: 1,
      },
      {
        platform: 'TikTok',
        scenarios: ['Faceless content', 'Daily short videos'],
        priority: 1,
      },
      {
        platform: 'YouTube',
        scenarios: ['Authority building', 'Thought leadership'],
        priority: 2,
      },
    ],
  },
  {
    industry: 'Online Courses',
    platforms: [
      {
        platform: 'YouTube',
        scenarios: ['Course promotion', 'Educational shorts', 'Webinar trailers'],
        priority: 1,
      },
      {
        platform: 'Instagram',
        scenarios: ['Course promotion', 'Educational shorts', 'Student testimonials'],
        priority: 1,
      },
    ],
  },
  {
    industry: 'Fitness Trainers',
    platforms: [
      {
        platform: 'Instagram',
        scenarios: ['Workout previews', 'Motivation clips', 'Program promotion'],
        priority: 1,
      },
      {
        platform: 'TikTok',
        scenarios: ['Workout previews', 'Motivation clips', 'Short-form education'],
        priority: 1,
      },
      {
        platform: 'YouTube',
        scenarios: ['Workout previews', 'Short-form education'],
        priority: 2,
      },
    ],
  },
]

/**
 * A 级行业 × 平台 × 场景配置
 */
export const A_TIER_INDUSTRY_SCENARIOS: IndustryPlatformScenario[] = [
  {
    industry: 'Beauty & Skincare Brands',
    platforms: [
      {
        platform: 'Instagram',
        scenarios: ['Product visuals', 'Before/after storytelling', 'Brand aesthetic videos'],
        priority: 1,
      },
      {
        platform: 'TikTok',
        scenarios: ['Product visuals', 'Before/after storytelling'],
        priority: 1,
      },
    ],
  },
  {
    industry: 'Fashion Brands',
    platforms: [
      {
        platform: 'Instagram',
        scenarios: ['Lookbook videos', 'Seasonal campaigns', 'Outfit inspiration'],
        priority: 1,
      },
      {
        platform: 'TikTok',
        scenarios: ['Lookbook videos', 'Seasonal campaigns'],
        priority: 1,
      },
    ],
  },
  {
    industry: 'Real Estate Marketing',
    platforms: [
      {
        platform: 'YouTube',
        scenarios: ['Property showcase', 'Listing videos', 'Realtor branding'],
        priority: 1,
      },
      {
        platform: 'Instagram',
        scenarios: ['Property showcase', 'Realtor branding'],
        priority: 1,
      },
    ],
  },
  {
    industry: 'Restaurants & Cafes',
    platforms: [
      {
        platform: 'Instagram',
        scenarios: ['Menu promotion', 'Atmosphere videos', 'Local ads'],
        priority: 1,
      },
      {
        platform: 'TikTok',
        scenarios: ['Menu promotion', 'Atmosphere videos'],
        priority: 1,
      },
    ],
  },
  {
    industry: 'Travel Agencies',
    platforms: [
      {
        platform: 'Instagram',
        scenarios: ['Destination videos', 'Hotel promotion', 'Experience storytelling'],
        priority: 1,
      },
      {
        platform: 'YouTube',
        scenarios: ['Destination videos', 'Experience storytelling'],
        priority: 1,
      },
    ],
  },
]

/**
 * 获取行业的推荐平台和场景
 */
export function getIndustryPlatformScenarios(industry: string): IndustryPlatformScenario | undefined {
  const allScenarios = [
    ...S_TIER_INDUSTRY_SCENARIOS,
    ...A_PLUS_TIER_INDUSTRY_SCENARIOS,
    ...A_TIER_INDUSTRY_SCENARIOS,
  ]
  return allScenarios.find(config => config.industry === industry)
}

/**
 * 获取行业推荐的平台列表（按优先级）
 */
export function getRecommendedPlatforms(industry: string): string[] {
  const config = getIndustryPlatformScenarios(industry)
  if (!config) return []
  
  return config.platforms
    .sort((a, b) => a.priority - b.priority)
    .map(p => p.platform)
}

/**
 * 获取行业在特定平台上的推荐场景
 */
export function getRecommendedScenarios(industry: string, platform: string): string[] {
  const config = getIndustryPlatformScenarios(industry)
  if (!config) return []
  
  const platformConfig = config.platforms.find(p => 
    p.platform === platform || p.platform === 'All'
  )
  
  return platformConfig?.scenarios || []
}

