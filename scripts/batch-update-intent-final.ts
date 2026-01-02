/**
 * 批量更新 Purchase Intent（最终版本）
 * 
 * 使用存储过程，一次运行自动完成
 * 
 * 使用方式：
 * 1. 先在 Dashboard 执行：database/migrations/create_batch_update_function.sql
 * 2. 然后运行：npm run batch-update-intent-final
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
  console.error('请确保 .env.local 中有：')
  console.error('  - NEXT_PUBLIC_SUPABASE_URL')
  console.error('  - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function batchUpdatePurchaseIntent() {
  console.log('🚀 开始批量更新 Purchase Intent...\n')
  console.log('⚠️  请确保已执行：database/migrations/create_batch_update_function.sql\n')

  const batchSize = 2000
  let totalUpdated = 0
  let iteration = 0
  const maxIterations = 110

  while (iteration < maxIterations) {
    iteration++

    // 调用存储过程
    const { data, error } = await (supabase.rpc as any)('batch_update_purchase_intent_single', {
      p_batch_size: batchSize,
    })

    if (error) {
      if (error.message.includes('does not exist') || error.message.includes('function')) {
        console.error('❌ 存储过程不存在！')
        console.error('请先在 Dashboard 执行：database/migrations/create_batch_update_function.sql')
      } else {
        console.error('❌ 更新失败:', error)
      }
      break
    }

    const updated = data || 0
    totalUpdated += updated

    if (updated === 0) {
      console.log('✅ 所有记录已更新完成！')
      break
    }

    console.log(`第 ${iteration} 批: 更新 ${updated} 条，累计 ${totalUpdated} 条 (${((totalUpdated / 203062) * 100).toFixed(1)}%)`)

    // 短暂延迟
    await new Promise(resolve => setTimeout(resolve, 200))
  }

  console.log(`\n🎉 批量更新完成！`)
  console.log(`   总共更新: ${totalUpdated} 条`)
  console.log(`   执行批次: ${iteration} 次`)

  // 验证结果
  const { data: distribution } = await supabase
    .from('page_meta')
    .select('purchase_intent, layer')
    .eq('page_type', 'use_case')
    .eq('status', 'published')
    .gt('purchase_intent', 0)

  if (distribution) {
    const stats = (distribution as Array<{ purchase_intent: number; layer: string }>).reduce((acc, row) => {
      const key = `${row.purchase_intent}-${row.layer}`
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    console.log('\n📊 最终分布:')
    Object.entries(stats)
      .sort(([a], [b]) => b.localeCompare(a))
      .forEach(([key, count]) => {
        const [intent, layer] = key.split('-')
        console.log(`   Intent ${intent} (${layer}): ${count} 条`)
      })
  }
}

batchUpdatePurchaseIntent()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ 执行失败:', error)
    process.exit(1)
  })

