/**
 * 批量更新 Purchase Intent（自动化脚本）
 * 
 * 使用方式：
 * 1. 配置数据库连接
 * 2. 运行: npm run batch-update-intent
 * 
 * 或者直接在 Supabase Dashboard 执行 SQL 文件：
 * database/migrations/batch_update_purchase_intent_auto.sql
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error('Missing Supabase environment variables')
}

// 创建 Supabase 客户端（使用 service role key 以获得完整权限）
const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY)

/**
 * 批量更新 Purchase Intent
 */
async function batchUpdatePurchaseIntent() {
  console.log('🚀 开始批量更新 Purchase Intent...\n')

  const batchSize = 5000
  let totalUpdated = 0
  let iteration = 0
  const maxIterations = 50

  while (iteration < maxIterations) {
    iteration++

    // 检查剩余数量
    const { count: remaining } = await supabase
      .from('page_meta')
      .select('*', { count: 'exact', head: true })
      .eq('page_type', 'use_case')
      .eq('status', 'published')
      .eq('purchase_intent', 0)

    if (remaining === 0) {
      console.log('✅ 所有记录已更新完成！')
      break
    }

    console.log(`📊 第 ${iteration} 批: 剩余 ${remaining} 条记录`)

    // 执行批量更新（使用 RPC 或直接 SQL）
    const { data, error } = await supabase.rpc('batch_update_purchase_intent_single', {
      p_batch_size: batchSize,
    })

    if (error) {
      console.error('❌ 更新失败:', error)
      break
    }

    const updated = data || 0
    totalUpdated += updated

    console.log(`  ✅ 更新 ${updated} 条，累计 ${totalUpdated} 条\n`)

    if (updated === 0) {
      console.log('✅ 所有记录已更新完成！')
      break
    }

    // 短暂延迟
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  console.log(`\n🎉 批量更新完成！`)
  console.log(`   总共更新: ${totalUpdated} 条`)
  console.log(`   执行批次: ${iteration} 次`)

  // 查看最终分布
  const { data: distribution } = await supabase
    .from('page_meta')
    .select('purchase_intent, layer')
    .eq('page_type', 'use_case')
    .eq('status', 'published')
    .gt('purchase_intent', 0)

  if (distribution) {
    const stats = distribution.reduce((acc, row) => {
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

// 执行
batchUpdatePurchaseIntent()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ 执行失败:', error)
    process.exit(1)
  })

