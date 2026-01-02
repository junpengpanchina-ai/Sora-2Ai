/**
 * 检查 Purchase Intent 更新状态
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

async function checkStatus() {
  console.log('📊 检查 Purchase Intent 更新状态...\n')

  // 检查总数
  const { count: total } = await supabase
    .from('page_meta')
    .select('*', { count: 'exact', head: true })
    .eq('page_type', 'use_case')
    .eq('status', 'published')

  console.log(`总记录数: ${total}`)

  // 检查未更新的
  const { count: remaining } = await supabase
    .from('page_meta')
    .select('*', { count: 'exact', head: true })
    .eq('page_type', 'use_case')
    .eq('status', 'published')
    .eq('purchase_intent', 0)

  console.log(`未更新 (intent=0): ${remaining}`)

  // 检查分布
  const { data: distribution } = await supabase
    .from('page_meta')
    .select('purchase_intent, layer')
    .eq('page_type', 'use_case')
    .eq('status', 'published')

  if (distribution) {
    const stats = distribution.reduce((acc, row) => {
      const key = `${row.purchase_intent || 0}-${row.layer || 'unknown'}`
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    console.log('\n📊 Purchase Intent 分布:')
    Object.entries(stats)
      .sort(([a], [b]) => b.localeCompare(a))
      .forEach(([key, count]) => {
        const [intent, layer] = key.split('-')
        console.log(`   Intent ${intent} (${layer}): ${count} 条`)
      })
  }

  // 检查 use_case_type 分布
  const { data: useCases } = await supabase
    .from('use_cases')
    .select('use_case_type')
    .eq('is_published', true)

  if (useCases) {
    const typeStats = useCases.reduce((acc, uc) => {
      acc[uc.use_case_type] = (acc[uc.use_case_type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    console.log('\n📊 Use Case Type 分布:')
    Object.entries(typeStats)
      .sort(([, a], [, b]) => b - a)
      .forEach(([type, count]) => {
        console.log(`   ${type}: ${count} 条`)
      })
  }
}

checkStatus()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ 检查失败:', error)
    process.exit(1)
  })

