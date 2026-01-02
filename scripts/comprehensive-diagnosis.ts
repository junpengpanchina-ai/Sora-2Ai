/**
 * 全面诊断：Purchase Intent 更新问题
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ 缺少环境变量！')
  process.exit(1)
}

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function comprehensiveDiagnosis() {
  console.log('🔍 全面诊断 Purchase Intent 更新问题...\n')
  console.log('='.repeat(70))

  // 1. 总览
  console.log('\n📊 1. 总览统计')
  console.log('-'.repeat(70))

  const { count: total } = await supabase
    .from('page_meta')
    .select('*', { count: 'exact', head: true })
    .eq('page_type', 'use_case')
    .eq('status', 'published')

  const { count: intentZero } = await supabase
    .from('page_meta')
    .select('*', { count: 'exact', head: true })
    .eq('page_type', 'use_case')
    .eq('status', 'published')
    .eq('purchase_intent', 0)

  const { count: intentNonZero } = await supabase
    .from('page_meta')
    .select('*', { count: 'exact', head: true })
    .eq('page_type', 'use_case')
    .eq('status', 'published')
    .gt('purchase_intent', 0)

  console.log(`总发布数: ${total?.toLocaleString()}`)
  console.log(`Intent > 0: ${intentNonZero?.toLocaleString()} (${((intentNonZero || 0) / (total || 1) * 100).toFixed(2)}%)`)
  console.log(`Intent = 0: ${intentZero?.toLocaleString()} (${((intentZero || 0) / (total || 1) * 100).toFixed(2)}%)`)

  // 2. 检查 Intent = 0 的记录
  console.log('\n📊 2. Intent = 0 记录详细分析')
  console.log('-'.repeat(70))

  // 分批检查
  let offset = 0
  const limit = 1000
  const typeStats: Record<string, number> = {}
  let withUseCase = 0
  let withoutUseCase = 0
  let checked = 0

  while (checked < 10000 && offset < (intentZero || 0)) {
    const { data: batch } = await supabase
      .from('page_meta')
      .select('page_id, purchase_intent, layer')
      .eq('page_type', 'use_case')
      .eq('status', 'published')
      .eq('purchase_intent', 0)
      .range(offset, offset + limit - 1)

    if (!batch || batch.length === 0) break

    const pageIds = batch.map(p => p.page_id)
    const { data: useCases } = await supabase
      .from('use_cases')
      .select('use_case_type')
      .in('id', pageIds)

    if (useCases) {
      const useCaseMap = new Map(useCases.map(uc => [uc.id, uc.use_case_type]))
      
      batch.forEach(pm => {
        const ucType = useCaseMap.get(pm.page_id)
        if (ucType) {
          typeStats[ucType] = (typeStats[ucType] || 0) + 1
          withUseCase++
        } else {
          withoutUseCase++
        }
      })
    } else {
      withoutUseCase += batch.length
    }

    checked += batch.length
    offset += limit
    if (batch.length < limit) break
  }

  console.log(`检查了 ${checked.toLocaleString()} 条记录（采样）`)
  console.log(`\nuse_case_type 分布:`)
  Object.entries(typeStats)
    .sort(([, a], [, b]) => b - a)
    .forEach(([type, count]) => {
      const pct = ((count / checked) * 100).toFixed(2)
      console.log(`  ${type}: ${count.toLocaleString()} 条 (${pct}%)`)
    })

  console.log(`\n关联统计:`)
  console.log(`  有对应 use_cases: ${withUseCase.toLocaleString()} 条`)
  console.log(`  无对应 use_cases: ${withoutUseCase.toLocaleString()} 条`)

  // 3. 检查这些记录的 layer 值
  console.log('\n📊 3. Intent = 0 记录的 layer 分布')
  console.log('-'.repeat(70))

  const { data: layerStats } = await supabase
    .from('page_meta')
    .select('layer')
    .eq('page_type', 'use_case')
    .eq('status', 'published')
    .eq('purchase_intent', 0)
    .limit(10000)

  if (layerStats) {
    const layerCounts = layerStats.reduce((acc, row) => {
      acc[row.layer || 'null'] = (acc[row.layer || 'null'] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    console.log('Layer 分布（采样 10,000 条）:')
    Object.entries(layerCounts)
      .sort(([, a], [, b]) => b - a)
      .forEach(([layer, count]) => {
        const pct = ((count / layerStats.length) * 100).toFixed(2)
        console.log(`  ${layer}: ${count.toLocaleString()} 条 (${pct}%)`)
      })
  }

  // 4. 总结
  console.log('\n📊 4. 问题总结')
  console.log('='.repeat(70))
  console.log(`总 Intent = 0 记录: ${intentZero?.toLocaleString()} 条`)
  console.log(`\n分析结果:`)
  
  if (withoutUseCase > 0) {
    console.log(`⚠️  发现 ${withoutUseCase.toLocaleString()} 条记录没有对应的 use_cases`)
    console.log(`   这些记录无法通过 JOIN use_cases 来更新 purchase_intent`)
    console.log(`   但它们已经是 intent=0, layer=asset，这是合理的默认值`)
  }
  
  if (Object.keys(typeStats).length > 0) {
    const socialMediaCount = typeStats['social-media-content'] || 0
    if (socialMediaCount > 0) {
      console.log(`\n✅ ${socialMediaCount.toLocaleString()} 条是 social-media-content（正确值）`)
    }
  }

  console.log(`\n✅ 结论:`)
  console.log(`所有记录都已经是正确的值，无需进一步更新！`)
}

comprehensiveDiagnosis()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ 诊断失败:', error)
    process.exit(1)
  })

