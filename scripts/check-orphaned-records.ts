/**
 * 检查孤立的 page_meta 记录
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

async function checkOrphaned() {
  console.log('🔍 检查孤立的 page_meta 记录...\n')

  // 获取所有未更新的记录
  const { data: allUnupdated, error } = await supabase
    .from('page_meta')
    .select('page_id, page_slug, created_at')
    .eq('page_type', 'use_case')
    .eq('status', 'published')
    .eq('purchase_intent', 0)
    .limit(100)

  if (error) {
    console.error('❌ 查询失败:', error)
    return
  }

  if (!allUnupdated || allUnupdated.length === 0) {
    console.log('✅ 没有未更新的记录')
    return
  }

  console.log(`检查前 ${allUnupdated.length} 条记录...\n`)

  // 检查每条记录是否有对应的 use_cases
  let orphanedCount = 0
  let matchedCount = 0
  const orphanedIds: string[] = []

  for (const record of allUnupdated) {
    const { data: useCase } = await supabase
      .from('use_cases')
      .select('id, use_case_type, is_published')
      .eq('id', record.page_id)
      .single()

    if (!useCase) {
      orphanedCount++
      orphanedIds.push(record.page_id)
      console.log(`❌ 孤立记录: ${record.page_id} (slug: ${record.page_slug || 'N/A'})`)
    } else {
      matchedCount++
    }
  }

  console.log(`\n📊 统计:`)
  console.log(`  有对应 use_cases: ${matchedCount} 条`)
  console.log(`  孤立记录（无 use_cases）: ${orphanedCount} 条`)
  console.log(`  孤立率: ${(orphanedCount / allUnupdated.length * 100).toFixed(2)}%`)

  if (orphanedCount > 0) {
    console.log(`\n⚠️  发现 ${orphanedCount} 条孤立记录！`)
    console.log(`这些记录的 page_id 在 use_cases 表中不存在。`)
    console.log(`\n解决方案:`)
    console.log(`1. 如果这些记录应该被删除，可以删除它们`)
    console.log(`2. 如果这些记录应该保留，需要为它们设置默认的 purchase_intent`)
    console.log(`3. 或者检查数据导入过程，确保 page_meta 和 use_cases 同步创建`)
  }
}

checkOrphaned()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ 检查失败:', error)
    process.exit(1)
  })

