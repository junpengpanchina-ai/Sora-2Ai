#!/usr/bin/env tsx

/**
 * AI Citation Score 批处理脚本
 * 
 * 计算所有 use_cases 的 AI Citation Score 并写入 page_scores 表
 * 
 * 使用方法：
 * npm run calculate:ai-scores:batch
 * 或
 * ts-node scripts/recalculate-ai-citation-scores.ts
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'
import { computeAiCitationScore, extractCitationSignals, type CitationSignals } from '../lib/utils/ai-citation-scorer-v2'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 错误: 缺少 Supabase 环境变量')
  console.error('需要: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * 根据分数确定 Tier
 */
function toTier(score: number): 1 | 2 | 3 {
  if (score >= 80) return 1 // Tier1
  if (score >= 55) return 2 // Tier2
  return 3 // Tier3
}

/**
 * 批量处理数组
 */
function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size))
  }
  return chunks
}

async function main() {
  console.log('🚀 开始批量计算 AI Citation Score...\n')

  // Step 1: 获取所有已发布的 use_cases
  console.log('📊 Step 1: 获取 use_cases 数据...')
  
  let allPages: any[] = []
  let offset = 0
  const batchSize = 5000
  let hasMore = true

  while (hasMore) {
    const { data, error, count } = await supabase
      .from('use_cases')
      .select('id, slug, title, h1, content, industry, use_case_type, related_use_case_ids, is_published, updated_at', { count: 'exact' })
      .eq('is_published', true)
      .not('content', 'is', null)
      .range(offset, offset + batchSize - 1)

    if (error) {
      console.error('❌ 查询错误:', error)
      throw error
    }

    if (data && data.length > 0) {
      allPages.push(...data)
      offset += batchSize
      console.log(`  已获取 ${allPages.length} 页...`)
      
      if (data.length < batchSize) {
        hasMore = false
      }
    } else {
      hasMore = false
    }

    // 限制最多处理 20000 页（避免超时）
    if (allPages.length >= 20000) {
      console.log(`  ⚠️  达到限制（20000 页），停止获取更多数据`)
      hasMore = false
    }
  }

  console.log(`✅ 共获取 ${allPages.length} 个页面\n`)

  // Step 2: 计算每个页面的 AI Citation Score
  console.log('📊 Step 2: 计算 AI Citation Score...')
  
  const scores: Array<{
    url: string
    tier: number
    ai_citation_score: number
    signals: CitationSignals
    recalc_at: string
  }> = []

  for (let i = 0; i < allPages.length; i++) {
    const page = allPages[i]
    
    try {
      // 提取信号
      const signals = extractCitationSignals({
        content: page.content || '',
        title: page.title || '',
        h1: page.h1 || page.title || '',
        related_use_case_ids: page.related_use_case_ids || [],
        industry: page.industry || null,
      })

      // 计算分数
      const score = computeAiCitationScore(signals)
      const tier = toTier(score)

      // 构建 URL（相对路径）
      const url = `/use-cases/${page.slug}`

      scores.push({
        url,
        tier,
        ai_citation_score: score,
        signals,
        recalc_at: new Date().toISOString(),
      })

      if ((i + 1) % 1000 === 0) {
        console.log(`  已计算 ${i + 1}/${allPages.length} 页...`)
      }
    } catch (error) {
      console.warn(`  ⚠️  页面 ${page.slug} 计算失败:`, error)
    }
  }

  console.log(`✅ 共计算 ${scores.length} 个分数\n`)

  // Step 3: 写入数据库（批量 upsert）
  console.log('📊 Step 3: 写入 page_scores 表...')
  
  const chunks = chunkArray(scores, 500) // 每批 500 条
  let successCount = 0
  let errorCount = 0

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    
    const rows = chunk.map(s => ({
      url: s.url,
      tier: s.tier,
      ai_citation_score: s.ai_citation_score,
      signals: s.signals,
      recalc_at: s.recalc_at,
    }))

    const { error } = await supabase
      .from('page_scores')
      .upsert(rows, {
        onConflict: 'url',
        ignoreDuplicates: false,
      })

    if (error) {
      console.error(`  ❌ 批次 ${i + 1}/${chunks.length} 写入失败:`, error)
      errorCount += chunk.length
    } else {
      successCount += chunk.length
      console.log(`  ✅ 批次 ${i + 1}/${chunks.length} 写入成功 (${successCount} 条)`)
    }
  }

  // Step 4: 统计结果
  console.log('\n📊 Step 4: 统计结果...')
  
  const tier1Count = scores.filter(s => s.tier === 1).length
  const tier2Count = scores.filter(s => s.tier === 2).length
  const tier3Count = scores.filter(s => s.tier === 3).length

  const avgScore = scores.reduce((sum, s) => sum + s.ai_citation_score, 0) / scores.length

  console.log('\n✅ 完成！统计结果:')
  console.log(`   总页面: ${scores.length}`)
  console.log(`   Tier1 (≥80分): ${tier1Count} 页`)
  console.log(`   Tier2 (55-79分): ${tier2Count} 页`)
  console.log(`   Tier3 (<55分): ${tier3Count} 页`)
  console.log(`   平均分数: ${avgScore.toFixed(1)}`)
  console.log(`   成功写入: ${successCount} 条`)
  if (errorCount > 0) {
    console.log(`   ⚠️  失败: ${errorCount} 条`)
  }
}

main().catch((error) => {
  console.error('❌ 脚本执行失败:', error)
  process.exit(1)
})
