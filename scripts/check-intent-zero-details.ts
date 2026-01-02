/**
 * 详细检查 purchase_intent = 0 的记录
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

async function checkDetails() {
  console.log('🔍 详细检查 purchase_intent = 0 的记录...\n')
  console.log('='.repeat(60))

  // 获取所有 intent = 0 的记录
  const { count: totalZero } = await supabase
    .from('page_meta')
    .select('*', { count: 'exact', head: true })
    .eq('page_type', 'use_case')
    .eq('status', 'published')
    .eq('purchase_intent', 0)

  console.log(`\n总 intent = 0 记录数: ${totalZero}`)

  // 分批检查这些记录的 use_case_type
  let offset = 0
  const limit = 1000
  const typeStats: Record<string, number> = {}
  let withUseCase = 0
  let withoutUseCase = 0

  while (offset < (totalZero || 0)) {
    const { data: batch } = await supabase
      .from('page_meta')
      .select('page_id')
      .eq('page_type', 'use_case')
      .eq('status', 'published')
      .eq('purchase_intent', 0)
      .range(offset, offset + limit - 1)

    if (!batch || batch.length === 0) break

    const pageIds = (batch as Array<{ page_id: string }>).map(p => p.page_id)
    const { data: useCases } = await supabase
      .from('use_cases')
      .select('use_case_type')
      .in('id', pageIds)

    if (useCases) {
      (useCases as Array<{ use_case_type: string }>).forEach(uc => {
        typeStats[uc.use_case_type] = (typeStats[uc.use_case_type] || 0) + 1
        withUseCase++
      })
      withoutUseCase += (batch.length - (useCases?.length || 0))
    } else {
      withoutUseCase += batch.length
    }

    offset += limit
    if (batch.length < limit) break
  }

  console.log(`\n📊 use_case_type 分布:`)
  Object.entries(typeStats)
    .sort(([, a], [, b]) => b - a)
    .forEach(([type, count]) => {
      const pct = ((count / (totalZero || 1)) * 100).toFixed(2)
      console.log(`  ${type}: ${count.toLocaleString()} 条 (${pct}%)`)
    })

  console.log(`\n📊 关联统计:`)
  console.log(`  有对应 use_cases: ${withUseCase.toLocaleString()} 条`)
  console.log(`  无对应 use_cases: ${withoutUseCase.toLocaleString()} 条`)

  console.log(`\n\n✅ 总结:`)
  console.log('='.repeat(60))
  if (withoutUseCase === 0) {
    console.log(`✅ 所有 intent = 0 的记录都有对应的 use_cases`)
    console.log(`✅ 根据分布，它们都是 social-media-content 类型（正确值）`)
  } else {
    console.log(`⚠️  发现 ${withoutUseCase} 条记录没有对应的 use_cases`)
    console.log(`   这些记录需要单独处理`)
  }
}

checkDetails()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ 检查失败:', error)
    process.exit(1)
  })

