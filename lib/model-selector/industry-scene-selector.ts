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
 * 从数据库获取场景应用模型配置（简化版，按场景应用配置）
 */
export async function getSceneModelConfig(
  useCaseType: UseCaseType
): Promise<{
  default_model: ModelType
  fallback_model: ModelType | null
  ultimate_model: ModelType | null
  hot_industry_model: ModelType | null
  cold_industry_model: ModelType | null
  professional_industry_model: ModelType | null
  is_enabled: boolean
} | null> {
  try {
    const supabase = await createServiceClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('scene_model_configs')
      .select('default_model, fallback_model, ultimate_model, hot_industry_model, cold_industry_model, professional_industry_model, is_enabled')
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
      hot_industry_model: (data.hot_industry_model as ModelType) || null,
      cold_industry_model: (data.cold_industry_model as ModelType) || null,
      professional_industry_model: (data.professional_industry_model as ModelType) || null,
      is_enabled: data.is_enabled,
    }
  } catch (error) {
    console.error(`[model-selector] 获取场景配置失败 (${useCaseType}):`, error)
    return null
  }
}

/**
 * 从数据库获取行业×场景的模型配置（保留用于向后兼容）
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
 * 优先级：场景应用配置 > 行业×场景配置 > 默认策略
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
  // 🔥 优先使用场景应用配置（简化版）
  const sceneConfig = await getSceneModelConfig(useCaseType)
  
  if (sceneConfig && sceneConfig.is_enabled) {
    // 判断行业类型
    const isHotIndustry = isHotIndustryDefault(industry)
    const isColdIndustry = !isHotIndustry && !isProfessionalIndustryDefault(industry)
    const isProfessionalIndustry = isProfessionalIndustryDefault(industry)
    
    // 根据行业类型选择模型
    let selectedModel = sceneConfig.default_model
    let reason = `场景应用配置（${useCaseType}）`
    
    if (isHotIndustry && sceneConfig.hot_industry_model) {
      selectedModel = sceneConfig.hot_industry_model
      reason = `场景应用配置 - 热门行业模型`
    } else if (isColdIndustry && sceneConfig.cold_industry_model) {
      selectedModel = sceneConfig.cold_industry_model
      reason = `场景应用配置 - 冷门行业模型`
    } else if (isProfessionalIndustry && sceneConfig.professional_industry_model) {
      selectedModel = sceneConfig.professional_industry_model
      reason = `场景应用配置 - 专业行业模型`
    }
    
    // 根据尝试次数选择模型
    if (currentAttempt === 1) {
      return {
        model: selectedModel,
        reason: `${reason}: ${selectedModel}`,
        shouldFallback: !!sceneConfig.fallback_model,
        nextFallback: sceneConfig.fallback_model || undefined,
      }
    } else if (currentAttempt === 2 && sceneConfig.fallback_model) {
      return {
        model: sceneConfig.fallback_model,
        reason: `场景应用配置 - Fallback模型: ${sceneConfig.fallback_model}`,
        shouldFallback: !!sceneConfig.ultimate_model,
        nextFallback: sceneConfig.ultimate_model || undefined,
      }
    } else if (currentAttempt === 3 && sceneConfig.ultimate_model) {
      return {
        model: sceneConfig.ultimate_model,
        reason: `场景应用配置 - 终极模型: ${sceneConfig.ultimate_model}`,
        shouldFallback: false,
      }
    }
    
    // 如果所有模型都尝试过了
    return {
      model: sceneConfig.ultimate_model || sceneConfig.fallback_model || selectedModel,
      reason: '场景应用配置 - 所有模型都已尝试',
      shouldFallback: false,
    }
  }
  
  // 如果没有场景应用配置，尝试行业×场景配置（向后兼容）
  const industryConfig = await getIndustrySceneModelConfig(industry, useCaseType)
  
  if (industryConfig && industryConfig.is_enabled) {
    // 根据尝试次数选择模型
    if (currentAttempt === 1) {
      return {
        model: industryConfig.default_model,
        reason: `行业×场景配置: ${industryConfig.default_model}`,
        shouldFallback: !!industryConfig.fallback_model,
        nextFallback: industryConfig.fallback_model || undefined,
      }
    } else if (currentAttempt === 2 && industryConfig.fallback_model) {
      return {
        model: industryConfig.fallback_model,
        reason: `行业×场景配置 - Fallback: ${industryConfig.fallback_model}`,
        shouldFallback: !!industryConfig.ultimate_model,
        nextFallback: industryConfig.ultimate_model || undefined,
      }
    } else if (currentAttempt === 3 && industryConfig.ultimate_model) {
      return {
        model: industryConfig.ultimate_model,
        reason: `行业×场景配置 - 终极: ${industryConfig.ultimate_model}`,
        shouldFallback: false,
      }
    }
  }

  // 如果没有配置，使用默认策略
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

