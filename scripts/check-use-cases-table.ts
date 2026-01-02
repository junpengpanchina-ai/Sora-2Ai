/**
 * 检查 use_cases 表的情况
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

async function checkUseCases() {
  console.log('🔍 检查 use_cases 表...\n')
  console.log('='.repeat(70))

  // 1. 检查 use_cases 总数
  const { count: totalUseCases } = await supabase
    .from('use_cases')
    .select('*', { count: 'exact', head: true })

  console.log(`\n📊 use_cases 表总数: ${totalUseCases?.toLocaleString()}`)

  // 2. 检查已发布的 use_cases
  const { count: publishedUseCases } = await supabase
    .from('use_cases')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', true)

  console.log(`已发布的 use_cases: ${publishedUseCases?.toLocaleString()}`)

  // 3. 检查 page_meta 总数
  const { count: totalPageMeta } = await supabase
    .from('page_meta')
    .select('*', { count: 'exact', head: true })
    .eq('page_type', 'use_case')
    .eq('status', 'published')

  console.log(`\n📊 page_meta (use_case, published) 总数: ${totalPageMeta?.toLocaleString()}`)

  // 4. 检查匹配情况（采样）
  console.log(`\n📊 检查匹配情况（采样 1000 条）...`)

  const { data: samplePageMeta } = await supabase
    .from('page_meta')
    .select('page_id')
    .eq('page_type', 'use_case')
    .eq('status', 'published')
    .limit(1000)

  if (samplePageMeta && samplePageMeta.length > 0) {
    const pageIds = samplePageMeta.map(p => p.page_id)
    const { data: matchedUseCases } = await supabase
      .from('use_cases')
      .select('id')
      .in('id', pageIds)

    const matchedCount = matchedUseCases?.length || 0
    const unmatchedCount = samplePageMeta.length - matchedCount

    console.log(`  有匹配的 use_cases: ${matchedCount} 条`)
    console.log(`  无匹配的 use_cases: ${unmatchedCount} 条`)
    console.log(`  匹配率: ${(matchedCount / samplePageMeta.length * 100).toFixed(2)}%`)

    // 检查这些 page_id 是否真的在 use_cases 中
    if (unmatchedCount > 0) {
      console.log(`\n  检查前 5 个未匹配的 page_id...`)
      const unmatchedIds = samplePageMeta.slice(0, 5).map(p => p.page_id)
      
      for (const id of unmatchedIds) {
        const { data: uc } = await supabase
          .from('use_cases')
          .select('id, use_case_type, is_published')
          .eq('id', id)
          .single()

        if (uc) {
          console.log(`    ✅ ${id}: 存在 (type: ${uc.use_case_type}, published: ${uc.is_published})`)
        } else {
          console.log(`    ❌ ${id}: 不存在`)
        }
      }
    }
  }

  // 5. 检查 use_case_type 分布
  console.log(`\n📊 use_cases 的 use_case_type 分布...`)

  const { data: allUseCases } = await supabase
    .from('use_cases')
    .select('use_case_type')
    .eq('is_published', true)
    .limit(10000)

  if (allUseCases) {
    const typeStats = allUseCases.reduce((acc, uc) => {
      acc[uc.use_case_type] = (acc[uc.use_case_type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    console.log(`use_case_type 分布（采样 10,000 条）:`)
    Object.entries(typeStats)
      .sort(([, a], [, b]) => b - a)
      .forEach(([type, count]) => {
        console.log(`  ${type}: ${count.toLocaleString()} 条`)
      })
  }

  // 6. 总结
  console.log(`\n\n📊 总结:`)
  console.log('='.repeat(70))
  console.log(`use_cases 总数: ${totalUseCases?.toLocaleString()}`)
  console.log(`page_meta (use_case) 总数: ${totalPageMeta?.toLocaleString()}`)
  console.log(`\n如果匹配率很低，可能的原因:`)
  console.log(`1. page_meta 和 use_cases 的数据不同步`)
  console.log(`2. page_id 和 use_cases.id 的关联有问题`)
  console.log(`3. 很多 page_meta 记录是孤立创建的`)
}

checkUseCases()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ 检查失败:', error)
    process.exit(1)
  })

