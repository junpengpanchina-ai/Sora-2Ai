#!/usr/bin/env tsx

/**
 * Tier1 内链生成脚本
 * 
 * 生成"随机但可控"的内链，每周轮换一次
 * 
 * 使用方法：
 * npm run generate:tier1-links
 * 或
 * tsx scripts/generate-tier1-internal-links.ts
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 错误: 缺少 Supabase 环境变量')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const OUTBOUND = {
  same_industry: 2,
  same_scene: 2,
  same_platform: 1,
  explore: 1,
} as const

/**
 * 生成周标识符（ISO week format: YYYY-WNN）
 */
function weekKey(d: Date = new Date()): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7))
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

/**
 * 确定性随机数生成器（Mulberry32）
 */
function mulberry32(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * 字符串哈希为整数种子
 */
function hashToSeed(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/**
 * 确定性采样（Fisher–Yates with deterministic RNG）
 */
function pickDeterministic<T>(arr: T[], n: number, rng: () => number): T[] {
  if (n <= 0 || arr.length === 0) return []
  const copy = arr.slice()
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy.slice(0, Math.min(n, copy.length))
}

async function main() {
  const wk = weekKey()
  console.log(`🚀 开始生成 Tier1 内链（周: ${wk}）...\n`)

  // 1) 加载 Tier1 页面（通过 page_scores 表关联）
  console.log('📊 Step 1: 加载 Tier1 页面...')
  
  // 先获取 Tier1 的 URL 列表（如果没有 Tier1，使用 Tier2 作为备选）
  let { data: tier1Scores, error: scoresError } = await supabase
    .from('page_scores')
    .select('url, ai_citation_score, tier')
    .eq('tier', 1)
    .order('ai_citation_score', { ascending: false })
    .limit(50000)

  // 如果没有 Tier1，使用 Tier2（用于测试）
  if (!tier1Scores || tier1Scores.length === 0) {
    console.log('⚠️  没有找到 Tier1 页面，使用 Tier2 作为备选...')
    const { data: tier2Scores, error: tier2Error } = await supabase
      .from('page_scores')
      .select('url, ai_citation_score, tier')
      .eq('tier', 2)
      .order('ai_citation_score', { ascending: false })
      .limit(50000)
    
    if (tier2Error) {
      console.error('❌ 查询 Tier2 错误:', tier2Error)
      throw tier2Error
    }
    
    tier1Scores = tier2Scores || []
    if (tier1Scores.length > 0) {
      console.log(`✅ 找到 ${tier1Scores.length} 个 Tier2 页面（将作为 Tier1 处理）`)
    }
  }

  if (scoresError) {
    console.error('❌ 查询 page_scores 错误:', scoresError)
    throw scoresError
  }

  if (!tier1Scores || tier1Scores.length === 0) {
    console.error('❌ 没有找到 Tier1 页面')
    console.log('💡 提示: 先运行 npm run calculate:ai-scores:batch 计算 AI Citation Score')
    process.exit(1)
  }

  // 从 URL 中提取 slug 列表
  const slugs: string[] = []
  for (const score of tier1Scores) {
    const match = score.url.match(/^\/use-cases\/(.+)$/)
    if (match) {
      slugs.push(match[1])
    }
  }

  if (slugs.length === 0) {
    console.error('❌ 无法从 URL 中提取 slug')
    process.exit(1)
  }

  console.log(`   需要查询 ${slugs.length} 个 slug`)

  // 分批查询 use_cases（每批 100 个 slug，避免数组过大）
  const allTier1: Array<{ id: string; slug: string; industry: string | null; use_case_type: string | null }> = []
  const batchSize = 100
  
  for (let i = 0; i < slugs.length; i += batchSize) {
    const batch = slugs.slice(i, i + batchSize)
    
    const { data: batchData, error: batchError } = await supabase
      .from('use_cases')
      .select('id, slug, industry, use_case_type')
      .eq('is_published', true)
      .not('industry', 'is', null)
      .in('slug', batch)
    
    if (batchError) {
      console.warn(`⚠️  批次 ${Math.floor(i / batchSize) + 1} 查询错误:`, batchError.message || batchError)
      // 继续处理下一批
      continue
    }
    
    if (batchData && batchData.length > 0) {
      allTier1.push(...batchData)
      console.log(`   已匹配 ${allTier1.length}/${slugs.length} 页...`)
    }
  }
  
  const tier1 = allTier1

  if (!tier1 || tier1.length === 0) {
    console.error('❌ 没有找到 Tier1 页面')
    console.log('💡 提示: 先运行 npm run calculate:ai-scores:batch 计算 AI Citation Score')
    process.exit(1)
  }

  // 创建 slug 到 score 的映射，用于排序
  const slugToScore = new Map<string, number>()
  for (const score of tier1Scores) {
    const match = score.url.match(/^\/use-cases\/(.+)$/)
    if (match) {
      slugToScore.set(match[1], score.ai_citation_score)
    }
  }

  // 按分数排序
  tier1.sort((a, b) => {
    const scoreA = slugToScore.get(a.slug) || 0
    const scoreB = slugToScore.get(b.slug) || 0
    return scoreB - scoreA
  })

  console.log(`✅ 找到 ${tier1.length} 个 Tier1 页面\n`)

  // 2) 构建快速查找组（按 industry, use_case_type, platform）
  console.log('📊 Step 2: 构建候选池...')
  
  const byIndustry = new Map<string, typeof tier1>()
  const byScene = new Map<string, typeof tier1>() // use_case_type 作为 scene
  const byPlatform = new Map<string, typeof tier1>() // 暂时用 use_case_type，后续可扩展

  for (const p of tier1) {
    // 按 industry 分组
    if (p.industry) {
      const arr = byIndustry.get(p.industry) || []
      arr.push(p)
      byIndustry.set(p.industry, arr)
    }

    // 按 use_case_type (scene) 分组
    if (p.use_case_type) {
      const arr = byScene.get(p.use_case_type) || []
      arr.push(p)
      byScene.set(p.use_case_type, arr)
    }

    // 按 platform 分组（暂时用 use_case_type，后续可扩展）
    if (p.use_case_type) {
      const arr = byPlatform.get(p.use_case_type) || []
      arr.push(p)
      byPlatform.set(p.use_case_type, arr)
    }
  }

  console.log(`   按 industry: ${byIndustry.size} 组`)
  console.log(`   按 scene: ${byScene.size} 组`)
  console.log(`   按 platform: ${byPlatform.size} 组\n`)

  // 3) 为每个页面生成链接
  console.log('📊 Step 3: 生成内链...')
  
  const rows: Array<{
    page_id: string
    target_page_id: string
    anchor_text: string | null
    bucket: string
    weight: number
    week_key: string
    created_at: string
  }> = []

  for (let i = 0; i < tier1.length; i++) {
    const p = tier1[i]
    
    // 生成确定性种子（page_id + week_key）
    const seed = hashToSeed(`${p.id}-${wk}`)
    const rng = mulberry32(seed)

    const used = new Set<string>([p.id])

    // 获取候选池
    const candidatesIndustry = (p.industry ? byIndustry.get(p.industry) : []) || []
    const candidatesScene = (p.use_case_type ? byScene.get(p.use_case_type) : []) || []
    const candidatesPlatform = (p.use_case_type ? byPlatform.get(p.use_case_type) : []) || []

    // 定义 bucket 配置
    const buckets: Array<['same_industry' | 'same_scene' | 'same_platform' | 'explore', typeof tier1]> = [
      ['same_industry', candidatesIndustry],
      ['same_scene', candidatesScene],
      ['same_platform', candidatesPlatform],
      // explore: 全局高质量，但排除同组，避免模板
      ['explore', tier1],
    ]

    for (const [bucket, arr] of buckets) {
      const need = OUTBOUND[bucket]
      if (need <= 0) continue

      // 过滤候选（排除已使用、explore 排除同 industry/scene）
      const filtered = arr.filter((x) => {
        if (used.has(x.id)) return false
        // explore: 尽量避开同 industry & 同 scene（增加多样性）
        if (bucket === 'explore') {
          if (p.industry && x.industry === p.industry) return false
          if (p.use_case_type && x.use_case_type === p.use_case_type) return false
        }
        return true
      })

      const picked = pickDeterministic(filtered, need, rng)
      for (const t of picked) {
        used.add(t.id)
        rows.push({
          page_id: p.id,
          target_page_id: t.id,
          anchor_text: null,
          bucket,
          weight: bucket === 'same_industry' ? 3 : bucket === 'same_scene' ? 2 : 1,
          week_key: wk,
          created_at: new Date().toISOString(),
        })
      }
    }

    if ((i + 1) % 1000 === 0) {
      console.log(`   已处理 ${i + 1}/${tier1.length} 页...`)
    }
  }

  console.log(`✅ 生成 ${rows.length} 条内链\n`)

  // 4) 写入数据库（先删除旧周数据，再插入新数据）
  console.log('📊 Step 4: 写入数据库...')
  
  // 删除当前周的数据（幂等）
  const { error: delError } = await supabase
    .from('page_internal_links')
    .delete()
    .eq('week_key', wk)

  if (delError) {
    console.warn('⚠️  删除旧数据失败:', delError)
  }

  // 分批插入（每批 2000 条）
  const chunkSize = 2000
  let successCount = 0
  let errorCount = 0

  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize)
    const { error: insError } = await supabase
      .from('page_internal_links')
      .upsert(chunk, {
        onConflict: 'page_id,target_page_id,week_key',
      })

    if (insError) {
      console.error(`❌ 批次 ${Math.floor(i / chunkSize) + 1} 插入失败:`, insError)
      errorCount += chunk.length
    } else {
      successCount += chunk.length
      console.log(`   ✅ 批次 ${Math.floor(i / chunkSize) + 1}: ${chunk.length} 条`)
    }
  }

  console.log(`\n✅ 完成！`)
  console.log(`   成功写入: ${successCount} 条`)
  if (errorCount > 0) {
    console.log(`   ⚠️  失败: ${errorCount} 条`)
  }
  console.log(`   周标识: ${wk}`)
}

main().catch((error) => {
  console.error('❌ 脚本执行失败:', error)
  process.exit(1)
})
