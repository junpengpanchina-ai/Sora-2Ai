/**
 * 行业×场景×模型选择器
 * 根据行业和场景类型，从配置表中选择合适的模型
 */

import { createServiceClient } from '@/lib/supabase/service'

export type ModelType = 'gemini-2.5-flash' | 'gemini-3-flash' | 'gemini-3-pro'

export type UseCaseType =
  | 'advertising-promotion'
  | 'social-media-content'
  | 'product-demo-showcase'
  | 'brand-storytelling'
  | 'education-explainer'
  | 'ugc-creator-content'

interface ModelConfig {
  default_model: ModelType
  fallback_model: ModelType | null
  ultimate_model: ModelType | null
  is_enabled: boolean
  industry_category: string | null
  industry_tier: string | null
}

/**
 * 从数据库获取行业×场景的模型配置
 */
export async function getIndustrySceneModelConfig(
  industry: string,
  useCaseType: UseCaseType
): Promise<ModelConfig | null> {
  try {
    const supabase = await createServiceClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('industry_scene_model_configs')
      .select('default_model, fallback_model, ultimate_model, is_enabled, industry_category, industry_tier')
      .eq('industry', industry)
      .eq('use_case_type', useCaseType)
      .eq('is_enabled', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // 没有找到配置，返回null
        return null
      }
      throw error
    }

    if (!data) {
      return null
    }

    return {
      default_model: (data.default_model as ModelType) || 'gemini-2.5-flash',
      fallback_model: (data.fallback_model as ModelType) || null,
      ultimate_model: (data.ultimate_model as ModelType) || null,
      is_enabled: data.is_enabled,
      industry_category: data.industry_category,
      industry_tier: data.industry_tier,
    }
  } catch (error) {
    console.error(`[model-selector] 获取配置失败 (${industry}, ${useCaseType}):`, error)
    return null
  }
}

/**
 * 根据行业和场景选择模型（带Fallback机制）
 * @param industry 行业名称
 * @param useCaseType 场景类型
 * @param currentAttempt 当前尝试次数（用于Fallback）
 * @returns 推荐的模型
 */
export async function selectModelForIndustryScene(
  industry: string,
  useCaseType: UseCaseType,
  currentAttempt: number = 1
): Promise<{
  model: ModelType
  reason: string
  shouldFallback: boolean
  nextFallback?: ModelType
}> {
  // 从数据库获取配置
  const config = await getIndustrySceneModelConfig(industry, useCaseType)

  // 如果没有配置，使用默认策略
  if (!config) {
    // 默认策略：热门行业用2.5-flash，冷门/专业用3-flash
    const isHotIndustry = isHotIndustryDefault(industry)
    const isProfessionalIndustry = isProfessionalIndustryDefault(industry)

    if (isProfessionalIndustry) {
      return {
        model: 'gemini-3-flash',
        reason: '专业行业默认使用gemini-3-flash',
        shouldFallback: true,
        nextFallback: 'gemini-3-pro',
      }
    }

    if (!isHotIndustry) {
      return {
        model: 'gemini-3-flash',
        reason: '冷门行业默认使用gemini-3-flash',
        shouldFallback: true,
        nextFallback: 'gemini-3-pro',
      }
    }

    return {
      model: 'gemini-2.5-flash',
      reason: '热门行业默认使用gemini-2.5-flash',
      shouldFallback: true,
      nextFallback: 'gemini-3-flash',
    }
  }

  // 如果配置被禁用，使用默认策略
  if (!config.is_enabled) {
    return {
      model: 'gemini-2.5-flash',
      reason: '配置已禁用，使用默认模型',
      shouldFallback: true,
      nextFallback: 'gemini-3-flash',
    }
  }

  // 根据尝试次数选择模型
  if (currentAttempt === 1) {
    // 第一次尝试：使用默认模型
    return {
      model: config.default_model,
      reason: `使用配置的默认模型: ${config.default_model}`,
      shouldFallback: !!config.fallback_model,
      nextFallback: config.fallback_model || undefined,
    }
  } else if (currentAttempt === 2 && config.fallback_model) {
    // 第二次尝试：使用Fallback模型
    return {
      model: config.fallback_model,
      reason: `使用配置的Fallback模型: ${config.fallback_model}`,
      shouldFallback: !!config.ultimate_model,
      nextFallback: config.ultimate_model || undefined,
    }
  } else if (currentAttempt === 3 && config.ultimate_model) {
    // 第三次尝试：使用终极模型
    return {
      model: config.ultimate_model,
      reason: `使用配置的终极模型: ${config.ultimate_model}`,
      shouldFallback: false,
    }
  }

  // 如果所有模型都尝试过了，返回最后一个模型
  return {
    model: config.ultimate_model || config.fallback_model || config.default_model,
    reason: '所有配置的模型都已尝试',
    shouldFallback: false,
  }
}

/**
 * 默认判断：是否为热门行业
 * 这是一个简单的启发式判断，如果没有配置则使用
 */
function isHotIndustryDefault(industry: string): boolean {
  const hotKeywords = [
    'E-commerce',
    'SaaS',
    'Mobile Apps',
    'Online Courses',
    'Creators',
    'Influencers',
    'Social Media',
    'Marketing',
    'Brand',
    'Fashion',
    'Beauty',
    'Fitness',
    'Restaurant',
    'Travel',
  ]

  return hotKeywords.some((keyword) => industry.toLowerCase().includes(keyword.toLowerCase()))
}

/**
 * 默认判断：是否为专业行业
 * 这是一个简单的启发式判断，如果没有配置则使用
 */
function isProfessionalIndustryDefault(industry: string): boolean {
  const professionalKeywords = [
    'Medical',
    'Healthcare',
    'Dental',
    'Legal',
    'Law',
    'Finance',
    'Fintech',
    'Engineering',
    'Manufacturing',
    'Cybersecurity',
    'Cloud Services',
    'Enterprise',
    'B2B',
  ]

  return professionalKeywords.some((keyword) => industry.toLowerCase().includes(keyword.toLowerCase()))
}

/**
 * 获取GEO默认模型
 */
export async function getGeoDefaultModel(geoCode: string): Promise<ModelType> {
  try {
    const supabase = await createServiceClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('geo_configs')
      .select('default_model')
      .eq('geo_code', geoCode.toUpperCase())
      .eq('is_active', true)
      .single()

    if (error || !data) {
      // 如果没有配置，返回默认值
      return 'gemini-2.5-flash'
    }

    return (data.default_model as ModelType) || 'gemini-2.5-flash'
  } catch (error) {
    console.error(`[model-selector] 获取GEO配置失败 (${geoCode}):`, error)
    return 'gemini-2.5-flash'
  }
}

