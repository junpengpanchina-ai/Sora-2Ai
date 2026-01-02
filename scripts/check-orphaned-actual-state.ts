/**
 * 检查孤立记录的实际状态
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

async function checkActualState() {
  console.log('🔍 检查孤立记录的实际状态...\n')
  console.log('='.repeat(60))

  // 获取孤立记录
  const { data: orphaned, error } = await supabase
    .from('page_meta')
    .select('page_id, purchase_intent, layer, page_slug, created_at')
    .eq('page_type', 'use_case')
    .eq('status', 'published')
    .eq('purchase_intent', 0)
    .limit(100)

  if (error || !orphaned || orphaned.length === 0) {
    console.log('✅ 没有孤立记录')
    return
  }

  console.log(`\n检查前 100 条孤立记录:\n`)

  let alreadyCorrect = 0
  let needsUpdate = 0

  for (const record of orphaned) {
    // 检查是否有对应的 use_cases
    const { data: useCase } = await supabase
      .from('use_cases')
      .select('id')
      .eq('id', record.page_id)
      .single()

    if (!useCase) {
      // 这是孤立记录
      if (record.purchase_intent === 0 && record.layer === 'asset') {
        alreadyCorrect++
        // console.log(`✅ ${record.page_id}: 已经是正确值 (intent=0, layer=asset)`)
      } else {
        needsUpdate++
        console.log(`⚠️  ${record.page_id}: 需要更新`)
        console.log(`    当前: intent=${record.purchase_intent}, layer=${record.layer}`)
        console.log(`    应该: intent=0, layer=asset`)
      }
    }
  }

  console.log(`\n📊 统计:`)
  console.log(`  已经是正确值: ${alreadyCorrect} 条`)
  console.log(`  需要更新: ${needsUpdate} 条`)

  if (needsUpdate === 0) {
    console.log(`\n✅ 所有孤立记录都已经是正确值！`)
    console.log(`这就是为什么 UPDATE 显示 "No rows returned" - 没有需要更新的值。`)
  }

  // 检查总数
  const { count: totalOrphaned } = await supabase
    .from('page_meta')
    .select('*', { count: 'exact', head: true })
    .eq('page_type', 'use_case')
    .eq('status', 'published')
    .eq('purchase_intent', 0)

  console.log(`\n总 intent=0 记录数: ${totalOrphaned}`)
}

checkActualState()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ 检查失败:', error)
    process.exit(1)
  })

