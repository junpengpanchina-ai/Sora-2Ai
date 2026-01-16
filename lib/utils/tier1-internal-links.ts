/**
 * Tier1 内链"随机但可控"算法
 * 
 * 目标：每页 4-6 个相关链接，但不要每页都一样，又要可复现（方便缓存、方便排查）
 */

/**
 * 简单的 PRNG（可复现的随机数生成器）
 * Mulberry32 算法
 */
function mulberry32(seed: number): () => number {
  return function() {
    let t = seed += 0x6D2B79F5
    t = Math.imul(t ^ t >>> 15, t | 1)
    t ^= t + Math.imul(t ^ t >>> 7, t | 61)
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

/**
 * 将字符串转换为整数种子
 */
function hashToInt(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}

/**
 * 从数组中随机采样（使用给定的 RNG）
 */
function sample<T>(rng: () => number, array: T[], count: number): T[] {
  if (array.length === 0 || count === 0) return []
  
  const shuffled = [...array]
  const result: T[] = []
  
  for (let i = 0; i < count && i < shuffled.length; i++) {
    const randomIndex = Math.floor(rng() * shuffled.length)
    result.push(shuffled[randomIndex])
    shuffled.splice(randomIndex, 1)
  }
  
  return result
}

/**
 * 获取当前周数（用于每周自动换一批链接）
 */
function getWeekNumber(date: Date = new Date()): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

export interface LinkPool {
  sameIndustry: string[] // 同行业页面
  adjacentIndustry: string[] // 相近行业页面
  platform: string[] // 平台关键页（Sora/Veo/pricing/workflow）
}

export interface PickLinksOptions {
  pageId: string
  pools: LinkPool
  weekNumber?: number // 可选：指定周数（用于测试或固定某周）
  minLinks?: number // 最少链接数（默认 4）
  maxLinks?: number // 最多链接数（默认 6）
  ratios?: { same: number; adjacent: number; platform: number } // 比例（默认 60% / 30% / 10%）
}

/**
 * 从候选池中"随机但可控"地选择链接
 * 
 * @param options 配置选项
 * @returns 选中的链接 slug 数组
 */
export function pickLinks(options: PickLinksOptions): string[] {
  const {
    pageId,
    pools,
    weekNumber = getWeekNumber(),
    minLinks = 4,
    maxLinks = 6,
    ratios = { same: 0.6, adjacent: 0.3, platform: 0.1 },
  } = options

  // 生成可复现的种子
  const seed = hashToInt(`${pageId}-${weekNumber}`)
  const rng = mulberry32(seed)

  const picks: string[] = []

  // 计算每个池应该选多少个
  const totalTarget = Math.floor(rng() * (maxLinks - minLinks + 1)) + minLinks
  const sameCount = Math.floor(totalTarget * ratios.same)
  const adjacentCount = Math.floor(totalTarget * ratios.adjacent)
  const platformCount = Math.max(1, totalTarget - sameCount - adjacentCount) // 至少 1 个平台页

  // 从各池中采样
  picks.push(...sample(rng, pools.sameIndustry, sameCount))
  picks.push(...sample(rng, pools.adjacentIndustry, adjacentCount))
  picks.push(...sample(rng, pools.platform, platformCount))

  // 去重并限制数量
  const unique = Array.from(new Set(picks))
  return unique.slice(0, maxLinks)
}

/**
 * 为页面生成链接候选池
 */
export async function generateLinkPools(page: {
  id: string
  industry: string | null
  use_case_type: string
  related_use_case_ids?: string[] | null
}, allPages: Array<{
  id: string
  slug: string
  industry: string | null
  use_case_type: string
}>): Promise<LinkPool> {
  const sameIndustry: string[] = []
  const adjacentIndustry: string[] = []
  const platform: string[] = [
    '/video', // Sora2 视频生成器
    '/pricing', // 定价页
    '/veo-pro', // Veo Pro
    '/veo-fast', // Veo Fast
  ]

  // 同行业池（优先）
  for (const p of allPages) {
    if (p.id === page.id) continue
    if (p.industry === page.industry && p.industry) {
      sameIndustry.push(p.slug)
    }
  }

  // 相近行业池（次优：相近 intent 或相关行业）
  // 这里简化处理，实际可以根据行业关系图判断
  const relatedIndustries = getRelatedIndustries(page.industry)
  for (const p of allPages) {
    if (p.id === page.id) continue
    if (p.industry && relatedIndustries.includes(p.industry)) {
      adjacentIndustry.push(p.slug)
    }
    // 或者相同 use_case_type 但不同 industry
    if (p.use_case_type === page.use_case_type && p.industry !== page.industry) {
      adjacentIndustry.push(p.slug)
    }
  }

  return {
    sameIndustry,
    adjacentIndustry,
    platform,
  }
}

/**
 * 获取相关行业列表（简化版，实际可以从配置或数据库获取）
 */
function getRelatedIndustries(industry: string | null): string[] {
  if (!industry) return []
  
  // 行业关系映射（简化版）
  const industryMap: Record<string, string[]> = {
    'Healthcare': ['Medical', 'Pharmaceutical', 'Wellness'],
    'Retail': ['E-commerce', 'Fashion', 'Consumer Goods'],
    'Education': ['Training', 'E-learning', 'Corporate Training'],
    'Real Estate': ['Property', 'Construction', 'Architecture'],
    // 可以扩展更多映射
  }
  
  return industryMap[industry] || []
}
