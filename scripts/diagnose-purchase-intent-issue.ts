/**
 * 诊断 Purchase Intent 更新问题
 * 找出为什么有 6 万多条未更新
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

async function diagnose() {
  console.log('🔍 诊断 Purchase Intent 更新问题...\n')
  console.log('=' .repeat(60))

  // 1. 总览
  console.log('\n📊 1. 总览统计')
  console.log('-'.repeat(60))
  
  const { count: totalPublished } = await supabase
    .from('page_meta')
    .select('*', { count: 'exact', head: true })
    .eq('page_type', 'use_case')
    .eq('status', 'published')

  const { count: remaining } = await supabase
    .from('page_meta')
    .select('*', { count: 'exact', head: true })
    .eq('page_type', 'use_case')
    .eq('status', 'published')
    .eq('purchase_intent', 0)

  const { count: updated } = await supabase
    .from('page_meta')
    .select('*', { count: 'exact', head: true })
    .eq('page_type', 'use_case')
    .eq('status', 'published')
    .gt('purchase_intent', 0)

  console.log(`总发布数: ${totalPublished}`)
  console.log(`已更新: ${updated}`)
  console.log(`未更新: ${remaining}`)
  console.log(`更新率: ${((updated || 0) / (totalPublished || 1) * 100).toFixed(2)}%`)

  // 2. 检查 page_meta 和 use_cases 的关联
  console.log('\n📊 2. 检查数据关联')
  console.log('-'.repeat(60))

  // 检查未更新的记录中，有多少有对应的 use_cases
  const { data: sampleUnupdated } = await supabase
    .from('page_meta')
    .select('page_id')
    .eq('page_type', 'use_case')
    .eq('status', 'published')
    .eq('purchase_intent', 0)
    .limit(1000)

  if (sampleUnupdated && sampleUnupdated.length > 0) {
    const pageIds = sampleUnupdated.map(p => p.page_id)
    
    const { data: useCases } = await supabase
      .from('use_cases')
      .select('id, use_case_type, is_published')
      .in('id', pageIds)

    const matchedCount = useCases?.length || 0
    const unmatchedCount = sampleUnupdated.length - matchedCount

    console.log(`采样检查（前 1000 条未更新记录）:`)
    console.log(`  有对应 use_cases: ${matchedCount} 条`)
    console.log(`  无对应 use_cases: ${unmatchedCount} 条`)
    console.log(`  匹配率: ${(matchedCount / sampleUnupdated.length * 100).toFixed(2)}%`)

    // 检查 use_case_type 分布
    if (useCases && useCases.length > 0) {
      const typeStats = useCases.reduce((acc, uc) => {
        acc[uc.use_case_type] = (acc[uc.use_case_type] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      console.log(`\n  use_case_type 分布:`)
      Object.entries(typeStats)
        .sort(([, a], [, b]) => b - a)
        .forEach(([type, count]) => {
          console.log(`    ${type}: ${count} 条`)
        })
    }
  }

  // 3. 检查已更新的记录分布
  console.log('\n📊 3. 已更新记录分布')
  console.log('-'.repeat(60))

  const { data: updatedRecords } = await supabase
    .from('page_meta')
    .select('purchase_intent, layer')
    .eq('page_type', 'use_case')
    .eq('status', 'published')
    .gt('purchase_intent', 0)
    .limit(10000)

  if (updatedRecords) {
    const stats = updatedRecords.reduce((acc, row) => {
      const key = `${row.purchase_intent || 0}-${row.layer || 'unknown'}`
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    console.log('Purchase Intent 分布（采样 10,000 条）:')
    Object.entries(stats)
      .sort(([a], [b]) => b.localeCompare(a))
      .forEach(([key, count]) => {
        const [intent, layer] = key.split('-')
        console.log(`  Intent ${intent} (${layer}): ${count} 条`)
      })
  }

  // 4. 检查是否有数据不一致
  console.log('\n📊 4. 数据一致性检查')
  console.log('-'.repeat(60))

  // 检查 page_meta 中的记录是否在 use_cases 中存在
  const { data: allUnupdated } = await supabase
    .from('page_meta')
    .select('page_id')
    .eq('page_type', 'use_case')
    .eq('status', 'published')
    .eq('purchase_intent', 0)
    .limit(10000)

  if (allUnupdated && allUnupdated.length > 0) {
    const allPageIds = allUnupdated.map(p => p.page_id)
    
    const { data: allUseCases } = await supabase
      .from('use_cases')
      .select('id')
      .in('id', allPageIds)

    const allMatchedCount = allUseCases?.length || 0
    const allUnmatchedCount = allUnupdated.length - allMatchedCount

    console.log(`检查（前 10,000 条未更新记录）:`)
    console.log(`  有对应 use_cases: ${allMatchedCount} 条`)
    console.log(`  无对应 use_cases: ${allUnmatchedCount} 条`)
    
    if (allUnmatchedCount > 0) {
      console.log(`\n  ⚠️  发现 ${allUnmatchedCount} 条 page_meta 记录没有对应的 use_cases！`)
      console.log(`  这可能是导致无法更新的原因。`)
    }
  }

  // 5. 检查 use_cases 的 is_published 状态
  console.log('\n📊 5. 检查 use_cases 发布状态')
  console.log('-'.repeat(60))

  if (allUnupdated && allUnupdated.length > 0) {
    const sampleIds = allUnupdated.slice(0, 1000).map(p => p.page_id)
    
    const { data: useCasesStatus } = await supabase
      .from('use_cases')
      .select('id, is_published')
      .in('id', sampleIds)

    if (useCasesStatus) {
      const publishedCount = useCasesStatus.filter(uc => uc.is_published).length
      const unpublishedCount = useCasesStatus.length - publishedCount

      console.log(`采样检查（1000 条）:`)
      console.log(`  is_published = true: ${publishedCount} 条`)
      console.log(`  is_published = false: ${unpublishedCount} 条`)
    }
  }

  // 6. 总结
  console.log('\n📊 6. 问题总结')
  console.log('='.repeat(60))
  console.log(`总未更新: ${remaining} 条`)
  console.log(`\n可能的原因:`)
  console.log(`1. 数据关联问题（page_meta.page_id 与 use_cases.id 不匹配）`)
  console.log(`2. UPDATE 语句的 WHERE 条件可能有问题`)
  console.log(`3. 某些记录可能已经被其他进程更新了`)
  console.log(`\n建议:`)
  console.log(`1. 检查上面的关联统计，确认是否有数据不匹配`)
  console.log(`2. 如果有关联问题，需要先修复数据`)
  console.log(`3. 如果关联正常，尝试使用更简单的 UPDATE 语句`)
}

diagnose()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ 诊断失败:', error)
    process.exit(1)
  })

