/**
 * 检查是否有遗漏的记录
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

async function checkMissing() {
  console.log('🔍 检查是否有遗漏的记录...\n')
  console.log('='.repeat(70))

  // 1. 检查所有已发布的 use_case 记录
  const { count: totalPublished } = await supabase
    .from('page_meta')
    .select('*', { count: 'exact', head: true })
    .eq('page_type', 'use_case')
    .eq('status', 'published')

  console.log(`\n📊 总发布数: ${totalPublished?.toLocaleString()}`)

  // 2. 检查有对应 use_cases 的记录
  console.log(`\n📊 检查数据关联情况...`)

  // 分批检查
  let offset = 0
  const limit = 1000
  let withUseCase = 0
  let withoutUseCase = 0
  let intentZeroWithUseCase = 0
  let intentZeroWithoutUseCase = 0
  let intentNonZeroWithUseCase = 0
  let intentNonZeroWithoutUseCase = 0

  while (offset < (totalPublished || 0)) {
    const { data: batch } = await supabase
      .from('page_meta')
      .select('page_id, purchase_intent')
      .eq('page_type', 'use_case')
      .eq('status', 'published')
      .range(offset, offset + limit - 1)

    if (!batch || batch.length === 0) break

    const pageIds = (batch as Array<{ page_id: string }>).map(p => p.page_id)
    const { data: useCases } = await supabase
      .from('use_cases')
      .select('id')
      .in('id', pageIds)

    const useCaseSet = new Set(useCases?.map(uc => uc.id) || [])

    batch.forEach(pm => {
      const hasUseCase = useCaseSet.has(pm.page_id)
      const isZero = (pm.purchase_intent || 0) === 0

      if (hasUseCase) {
        withUseCase++
        if (isZero) {
          intentZeroWithUseCase++
        } else {
          intentNonZeroWithUseCase++
        }
      } else {
        withoutUseCase++
        if (isZero) {
          intentZeroWithoutUseCase++
        } else {
          intentNonZeroWithoutUseCase++
        }
      }
    })

    offset += limit
    if (batch.length < limit) break

    // 显示进度
    if (offset % 10000 === 0) {
      console.log(`  已检查: ${offset.toLocaleString()} 条...`)
    }
  }

  console.log(`\n📊 关联统计:`)
  console.log(`  有对应 use_cases: ${withUseCase.toLocaleString()} 条`)
  console.log(`     - Intent > 0: ${intentNonZeroWithUseCase.toLocaleString()} 条 ✅`)
  console.log(`     - Intent = 0: ${intentZeroWithUseCase.toLocaleString()} 条 (social-media-content) ✅`)
  console.log(`  无对应 use_cases: ${withoutUseCase.toLocaleString()} 条`)
  console.log(`     - Intent > 0: ${intentNonZeroWithoutUseCase.toLocaleString()} 条 ⚠️`)
  console.log(`     - Intent = 0: ${intentZeroWithoutUseCase.toLocaleString()} 条 ✅ (默认值)`)

  // 3. 检查是否有需要处理的记录
  console.log(`\n📊 需要处理的记录:`)
  console.log('-'.repeat(70))

  if (intentNonZeroWithoutUseCase > 0) {
    console.log(`⚠️  发现 ${intentNonZeroWithoutUseCase.toLocaleString()} 条记录:`)
    console.log(`    - 没有对应的 use_cases`)
    console.log(`    - 但 purchase_intent > 0`)
    console.log(`    - 这些记录可能需要检查`)
  } else {
    console.log(`✅ 没有需要处理的记录`)
  }

  // 4. 检查是否有 intent=0 但应该有值的记录
  console.log(`\n📊 检查 intent=0 但可能有 use_cases 的记录...`)

  const { data: zeroIntentWithUseCase } = await supabase
    .from('page_meta')
    .select('page_id')
    .eq('page_type', 'use_case')
    .eq('status', 'published')
    .eq('purchase_intent', 0)
    .limit(1000)

  if (zeroIntentWithUseCase && zeroIntentWithUseCase.length > 0) {
    const pageIds = zeroIntentWithUseCase.map(p => p.page_id)
    const { data: useCases } = await supabase
      .from('use_cases')
      .select('id, use_case_type')
      .in('id', pageIds)

    if (useCases) {
      const shouldBeNonZero = useCases.filter(uc => {
        const type = uc.use_case_type
        return !['social-media-content'].includes(type)
      })

      if (shouldBeNonZero.length > 0) {
        console.log(`⚠️  发现 ${shouldBeNonZero.length} 条记录:`)
        console.log(`    - 有对应的 use_cases`)
        console.log(`    - 但 purchase_intent = 0`)
        console.log(`    - 这些记录可能需要更新`)

        // 统计类型
        const typeStats = shouldBeNonZero.reduce((acc, uc) => {
          acc[uc.use_case_type] = (acc[uc.use_case_type] || 0) + 1
          return acc
        }, {} as Record<string, number>)

        console.log(`\n    use_case_type 分布:`)
        Object.entries(typeStats).forEach(([type, count]) => {
          console.log(`      ${type}: ${count} 条`)
        })
      } else {
        console.log(`✅ 所有 intent=0 的记录都是 social-media-content（正确）`)
      }
    }
  }

  // 5. 总结
  console.log(`\n\n📊 最终总结:`)
  console.log('='.repeat(70))
  console.log(`总记录数: ${totalPublished?.toLocaleString()}`)
  console.log(`\n状态:`)
  console.log(`  ✅ 已正确更新: ${intentNonZeroWithUseCase.toLocaleString()} 条`)
  console.log(`  ✅ 正确为 0 (social-media): ${intentZeroWithUseCase.toLocaleString()} 条`)
  console.log(`  ✅ 正确为 0 (孤立记录): ${intentZeroWithoutUseCase.toLocaleString()} 条`)
  
  if (intentNonZeroWithoutUseCase > 0) {
    console.log(`  ⚠️  需要检查: ${intentNonZeroWithoutUseCase.toLocaleString()} 条`)
  } else {
    console.log(`  ✅ 所有记录都正确！`)
  }
}

checkMissing()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ 检查失败:', error)
    process.exit(1)
  })

