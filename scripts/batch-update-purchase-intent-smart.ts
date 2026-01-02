/**
 * 批量更新 Purchase Intent（智能版本）
 * 
 * 使用 Supabase Client 自动批量更新
 * 无需密码，只需要 API Key
 * 一次运行，自动完成所有更新
 * 
 * 使用方式：
 * npm run batch-update-intent-smart
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { config } from 'dotenv'
import { resolve } from 'path'

// 加载环境变量
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

// 创建 Supabase 客户端（使用 service role key）
const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY)

/**
 * 计算 Purchase Intent
 */
function calculatePurchaseIntent(useCaseType: string): { intent: number; layer: string } {
  if (['product-demo-showcase', 'advertising-promotion'].includes(useCaseType)) {
    return { intent: 3, layer: 'conversion' }
  }
  if (['education-explainer', 'ugc-creator-content'].includes(useCaseType)) {
    return { intent: 2, layer: 'conversion' }
  }
  if (useCaseType === 'brand-storytelling') {
    return { intent: 1, layer: 'asset' }
  }
  if (useCaseType === 'social-media-content') {
    return { intent: 0, layer: 'asset' }
  }
  return { intent: 0, layer: 'asset' }
}

/**
 * 批量更新 Purchase Intent
 */
async function batchUpdatePurchaseIntent() {
  console.log('🚀 开始批量更新 Purchase Intent...\n')

  const batchSize = 1000
  let totalUpdated = 0
  let iteration = 0
  const maxIterations = 210

  while (iteration < maxIterations) {
    iteration++

    // 1. 查询一批需要更新的记录
    const { data: pageMetaList, error: queryError } = await supabase
      .from('page_meta')
      .select('page_id')
      .eq('page_type', 'use_case')
      .eq('status', 'published')
      .eq('purchase_intent', 0)
      .limit(batchSize)

    if (queryError) {
      console.error('❌ 查询失败:', queryError)
      break
    }

    if (!pageMetaList || pageMetaList.length === 0) {
      console.log('✅ 所有记录已更新完成！')
      break
    }

    console.log(`📊 第 ${iteration} 批: 找到 ${pageMetaList.length} 条记录`)

    // 2. 查询对应的 use_cases 数据
    const pageIds = pageMetaList.map(p => p.page_id)
    const { data: useCases, error: useCasesError } = await supabase
      .from('use_cases')
      .select('id, use_case_type')
      .in('id', pageIds)

    if (useCasesError) {
      console.error('❌ 查询 use_cases 失败:', useCasesError)
      break
    }

    // 3. 构建更新数据
    const updates = useCases.map(uc => {
      const { intent, layer } = calculatePurchaseIntent(uc.use_case_type)
      return {
        page_id: uc.id,
        purchase_intent: intent,
        layer: layer,
      }
    })

    // 4. 批量更新（使用 RPC 存储过程，更高效）
    // 先创建存储过程（如果还没有）
    const { data: rpcResult, error: rpcError } = await supabase.rpc('batch_update_purchase_intent_single', {
      p_batch_size: batchSize,
    })

    let batchUpdated = 0
    if (rpcError) {
      // 如果 RPC 不存在，使用逐条更新（降级方案）
      console.log('⚠️  RPC 函数不存在，使用逐条更新...')
      for (const update of updates) {
        const { error: updateError } = await supabase
          .from('page_meta')
          .update({
            purchase_intent: update.purchase_intent,
            layer: update.layer,
          })
          .eq('page_type', 'use_case')
          .eq('page_id', update.page_id)

        if (!updateError) {
          batchUpdated++
        }
      }
    } else {
      batchUpdated = rpcResult || 0
    }

    totalUpdated += batchUpdated
    console.log(`  ✅ 更新 ${batchUpdated} 条，累计 ${totalUpdated} 条 (${((totalUpdated / 203062) * 100).toFixed(1)}%)\n`)

    // 短暂延迟，避免过载
    await new Promise(resolve => setTimeout(resolve, 100))
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
  .then(() => {
    console.log('\n✅ 完成！')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ 执行失败:', error)
    process.exit(1)
  })

