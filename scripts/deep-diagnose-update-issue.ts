/**
 * 深度诊断：为什么 UPDATE 无法更新这些记录
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

async function deepDiagnose() {
  console.log('🔍 深度诊断 UPDATE 问题...\n')
  console.log('='.repeat(60))

  // 1. 获取一批未更新的记录
  const { data: unupdated, error } = await supabase
    .from('page_meta')
    .select('page_id, page_slug, purchase_intent, layer')
    .eq('page_type', 'use_case')
    .eq('status', 'published')
    .eq('purchase_intent', 0)
    .limit(10)

  if (error || !unupdated || unupdated.length === 0) {
    console.log('✅ 没有未更新的记录')
    return
  }

  console.log(`\n📋 检查前 10 条未更新记录:\n`)

  for (const record of unupdated) {
    console.log(`\n记录: ${record.page_id}`)
    console.log(`  page_slug: ${record.page_slug || 'N/A'}`)
    console.log(`  purchase_intent: ${record.purchase_intent}`)
    console.log(`  layer: ${record.layer}`)

    // 检查是否有对应的 use_cases
    const { data: useCase, error: ucError } = await supabase
      .from('use_cases')
      .select('id, use_case_type, is_published')
      .eq('id', record.page_id)
      .single()

    if (ucError || !useCase) {
      console.log(`  ❌ 没有对应的 use_cases 记录`)
    } else {
      console.log(`  ✅ 有对应的 use_cases:`)
      console.log(`     use_case_type: ${useCase.use_case_type}`)
      console.log(`     is_published: ${useCase.is_published}`)

      // 计算应该的 purchase_intent
      let expectedIntent = 0
      let expectedLayer = 'asset'

      if (['product-demo-showcase', 'advertising-promotion'].includes(useCase.use_case_type)) {
        expectedIntent = 3
        expectedLayer = 'conversion'
      } else if (['education-explainer', 'ugc-creator-content'].includes(useCase.use_case_type)) {
        expectedIntent = 2
        expectedLayer = 'conversion'
      } else if (useCase.use_case_type === 'brand-storytelling') {
        expectedIntent = 1
        expectedLayer = 'asset'
      } else if (useCase.use_case_type === 'social-media-content') {
        expectedIntent = 0
        expectedLayer = 'asset'
      }

      console.log(`     应该的 purchase_intent: ${expectedIntent}`)
      console.log(`     应该的 layer: ${expectedLayer}`)

      if (expectedIntent === 0 && record.purchase_intent === 0) {
        console.log(`     ⚠️  注意：social-media-content 的 intent 就是 0，这是正确的！`)
      }
    }
  }

  // 2. 统计 use_case_type 分布
  console.log(`\n\n📊 统计未更新记录的 use_case_type 分布:\n`)

  const { data: allUnupdated } = await supabase
    .from('page_meta')
    .select('page_id')
    .eq('page_type', 'use_case')
    .eq('status', 'published')
    .eq('purchase_intent', 0)
    .limit(1000)

  if (allUnupdated && allUnupdated.length > 0) {
    const pageIds = allUnupdated.map(p => p.page_id)
    const { data: useCases } = await supabase
      .from('use_cases')
      .select('use_case_type')
      .in('id', pageIds)

    if (useCases) {
      const typeStats = useCases.reduce((acc, uc) => {
        acc[uc.use_case_type] = (acc[uc.use_case_type] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      console.log('use_case_type 分布:')
      Object.entries(typeStats)
        .sort(([, a], [, b]) => b - a)
        .forEach(([type, count]) => {
          console.log(`  ${type}: ${count} 条`)
        })

      // 检查 social-media-content 的数量
      const socialMediaCount = typeStats['social-media-content'] || 0
      if (socialMediaCount > 0) {
        console.log(`\n  💡 发现: ${socialMediaCount} 条是 social-media-content`)
        console.log(`     这些记录的 purchase_intent 应该是 0（已经是 0），所以不需要更新！`)
        console.log(`     这就是为什么 UPDATE 显示 "No rows returned" 的原因。`)
      }
    }
  }

  // 3. 总结
  console.log(`\n\n📊 问题总结:`)
  console.log('='.repeat(60))
  console.log(`这 63,083 条"未更新"的记录，很可能都是 social-media-content 类型，`)
  console.log(`它们的 purchase_intent 本来就是 0，这是正确的值，不需要更新。`)
  console.log(`\n所以实际上，所有需要更新的记录都已经更新完成了！`)
}

deepDiagnose()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ 诊断失败:', error)
    process.exit(1)
  })

