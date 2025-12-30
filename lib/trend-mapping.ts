/**
 * 趋势映射词库（Anti-Hotspot 安全版）
 * 
 * 定位：替代"热点词"的，是"趋势行为词 + 场景状态词"
 * - Google 能感知趋势
 * - 不触发 Hot Query / News / Freshness 惩罚
 * 
 * 映射公式：
 * 【热点事件 / 热搜词】→ 【行为变化】→ 【长期场景】→ 【可长期索引的趋势映射词】
 */

export type TrendCategory = 
  | 'content_consumption'
  | 'ai_hotspots'
  | 'industry_behavior'
  | 'user_decision'
  | 'seasonal'

export interface TrendMapping {
  content_consumption: Record<string, string>
  ai_hotspots: Record<string, string>
  industry_behavior: Record<string, Record<string, string>>
  user_decision: Record<string, string>
  seasonal: Record<string, string>
}

/**
 * 核心趋势映射词库
 */
export const TREND_MAPPING_LEXICON: TrendMapping = {
  // ① 内容消费趋势（替代：短视频 / 平台热搜）
  content_consumption: {
    'short video trend': 'visual-first content',
    'TikTok / Reels': 'platform-native video',
    'viral video': 'high-engagement video',
    'creator economy': 'independent content creators',
    'algorithm boost': 'content discoverability',
    'short-form content': 'concise visual formats',
    'social media video': 'platform-integrated content',
  },

  // ② AI 热点（替代：模型名 / 新发布）
  ai_hotspots: {
    'Gemini-3 / GPT-5': 'latest multimodal models',
    'new AI release': 'recent AI advancements',
    'AI breakthrough': 'rapidly evolving AI capabilities',
    'AI trend 2025': 'current AI adoption patterns',
    'GPT-4': 'advanced language models',
    'Claude': 'conversational AI systems',
    'Sora': 'video generation models',
  },

  // ③ 行业行为变化（最值钱）
  industry_behavior: {
    healthcare: {
      'telemedicine trend': 'remote patient communication',
      'health app boom': 'digital health resources',
      'patient pre-visit education': 'patient pre-visit education',
    },
    education: {
      'online learning surge': 'self-paced learning materials',
      'microlearning trend': 'concise educational formats',
      'edtech adoption': 'digital learning resources',
    },
    ecommerce: {
      'live shopping trend': 'interactive product presentation',
      'AR try-on': 'product visualization',
      'social commerce': 'platform-integrated shopping',
      'product visualization before purchase': 'product visualization before purchase',
    },
    realestate: {
      'remote property walkthroughs': 'remote property walkthroughs',
      'virtual tours': 'immersive property viewing',
    },
    saas: {
      'onboarding without live demos': 'onboarding without live demos',
      'product-led growth': 'self-service onboarding',
      'no-code movement': 'accessible automation tools',
    },
  },

  // ④ 用户决策变化（GEO 特别吃）
  user_decision: {
    'people prefer video': 'decision support content',
    'attention span shorter': 'concise explanatory formats',
    'social proof trend': 'example-driven explanations',
    'visual learning': 'visual-first communication',
    'mobile-first': 'mobile-optimized formats',
  },

  // ⑤ 季节性趋势（不写年份）
  seasonal: {
    '2025 marketing trend': 'seasonal planning cycles',
    'end of year trend': 'annual review periods',
    'holiday campaign': 'peak engagement periods',
    'Q4 planning': 'quarterly planning cycles',
    'new year strategy': 'annual planning periods',
  },
}

/**
 * 将热点词映射为安全词
 * 
 * @param hotTerm - 热点词
 * @param category - 可选的类别（用于加速查找）
 * @param industry - 可选的行业（用于行业特定映射）
 * @returns 映射后的安全词，如果找不到则返回 null
 */
export function mapTrendToSafeTerm(
  hotTerm: string,
  category?: TrendCategory,
  industry?: string
): string | null {
  const normalizedTerm = hotTerm.trim().toLowerCase()

  // 如果指定了类别，先在该类别中查找
  if (category && TREND_MAPPING_LEXICON[category]) {
    const categoryMap = TREND_MAPPING_LEXICON[category]
    
    if (category === 'industry_behavior' && industry) {
      // 行业特定映射
      const industryMap = categoryMap[industry.toLowerCase()]
      if (industryMap && typeof industryMap === 'object' && normalizedTerm in industryMap) {
        return industryMap[normalizedTerm]
      }
    } else if (typeof categoryMap === 'object' && !Array.isArray(categoryMap) && normalizedTerm in categoryMap) {
      // 普通类别映射
      return (categoryMap as Record<string, string>)[normalizedTerm]
    }
  }

  // 全局搜索（如果没有指定类别或未找到）
  // 1. 先检查行业特定映射
  if (industry) {
    const industryMap = TREND_MAPPING_LEXICON.industry_behavior[industry.toLowerCase()]
    if (industryMap && normalizedTerm in industryMap) {
      return industryMap[normalizedTerm]
    }
  }

  // 2. 检查其他类别
  for (const [cat, map] of Object.entries(TREND_MAPPING_LEXICON)) {
    if (cat === 'industry_behavior') continue // 已处理

    if (typeof map === 'object' && normalizedTerm in map) {
      return (map as Record<string, string>)[normalizedTerm]
    }
  }

  return null
}

/**
 * 批量映射热点词
 * 
 * @param hotTerms - 热点词数组
 * @param category - 可选的类别
 * @param industry - 可选的行业
 * @returns 映射结果对象
 */
export function mapTrendsToSafeTerms(
  hotTerms: string[],
  category?: TrendCategory,
  industry?: string
): Record<string, string | null> {
  const result: Record<string, string | null> = {}
  
  for (const term of hotTerms) {
    result[term] = mapTrendToSafeTerm(term, category, industry)
  }
  
  return result
}

/**
 * 检查词是否包含热点词（需要映射）
 * 
 * @param text - 要检查的文本
 * @returns 是否包含需要映射的热点词
 */
export function containsHotspotTerms(text: string): boolean {
  const normalizedText = text.toLowerCase()
  
  // 检查所有映射表中的热点词
  for (const [category, map] of Object.entries(TREND_MAPPING_LEXICON)) {
    if (category === 'industry_behavior') {
      // 检查行业特定映射
      const industryBehaviorMap = map as Record<string, Record<string, string>>
      for (const industryMap of Object.values(industryBehaviorMap)) {
        if (typeof industryMap === 'object' && industryMap !== null) {
          for (const hotTerm of Object.keys(industryMap)) {
            if (normalizedText.includes(hotTerm.toLowerCase())) {
              return true
            }
          }
        }
      }
    } else {
      // 检查普通映射
      const regularMap = map as Record<string, string>
      for (const hotTerm of Object.keys(regularMap)) {
        if (normalizedText.includes(hotTerm.toLowerCase())) {
          return true
        }
      }
    }
  }
  
  return false
}

/**
 * 获取所有可用的安全映射词（用于提示或选择）
 * 
 * @param category - 可选的类别
 * @param industry - 可选的行业
 * @returns 安全映射词数组
 */
export function getAvailableSafeTerms(
  category?: TrendCategory,
  industry?: string
): string[] {
  const terms: string[] = []
  
  if (category && TREND_MAPPING_LEXICON[category]) {
    const categoryMap = TREND_MAPPING_LEXICON[category]
    
    if (category === 'industry_behavior' && industry) {
      const industryMap = categoryMap[industry.toLowerCase()]
      if (industryMap) {
        terms.push(...Object.values(industryMap))
      }
    } else if (typeof categoryMap === 'object') {
      terms.push(...Object.values(categoryMap as Record<string, string>))
    }
  } else {
    // 返回所有安全词
    for (const [cat, map] of Object.entries(TREND_MAPPING_LEXICON)) {
      if (cat === 'industry_behavior') {
        // 行业特定映射
        const industryBehaviorMap = map as Record<string, Record<string, string>>
        for (const industryMap of Object.values(industryBehaviorMap)) {
          if (typeof industryMap === 'object' && industryMap !== null) {
            terms.push(...Object.values(industryMap))
          }
        }
      } else {
        // 普通映射
        const regularMap = map as Record<string, string>
        terms.push(...Object.values(regularMap))
      }
    }
  }
  
  return [...new Set(terms)] // 去重
}

