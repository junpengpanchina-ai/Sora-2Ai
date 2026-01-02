/**
 * 调试 Purchase Intent 更新问题
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

async function debug() {
  console.log('🔍 调试 Purchase Intent 更新问题...\n')

  // 检查有多少 page_meta 记录没有对应的 use_cases
  const { data: pageMetaWithoutUseCase } = await supabase
    .from('page_meta')
    .select('page_id')
    .eq('page_type', 'use_case')
    .eq('status', 'published')
    .eq('purchase_intent', 0)
    .limit(10)

  if (pageMetaWithoutUseCase && pageMetaWithoutUseCase.length > 0) {
    console.log('📋 检查前 10 条未更新的记录：')
    for (const pm of pageMetaWithoutUseCase) {
      const { data: useCase } = await supabase
        .from('use_cases')
        .select('id, use_case_type, is_published')
        .eq('id', pm.page_id)
        .single()

      if (!useCase) {
        console.log(`  ❌ page_id ${pm.page_id}: 没有对应的 use_case 记录`)
      } else {
        console.log(`  ✅ page_id ${pm.page_id}: use_case_type=${useCase.use_case_type}, is_published=${useCase.is_published}`)
      }
    }
  }

  // 检查存储过程是否正常工作
  console.log('\n🧪 测试存储过程（更新 10 条）...')
  const { data: testResult, error: testError } = await supabase.rpc('batch_update_purchase_intent_single', {
    p_batch_size: 10,
  })

  if (testError) {
    console.error('❌ 存储过程调用失败:', testError)
  } else {
    console.log(`✅ 存储过程返回: ${testResult} 条`)
  }

  // 检查实际更新情况
  console.log('\n📊 检查更新后的状态...')
  const { count: afterUpdate } = await supabase
    .from('page_meta')
    .select('*', { count: 'exact', head: true })
    .eq('page_type', 'use_case')
    .eq('status', 'published')
    .eq('purchase_intent', 0)

  console.log(`剩余未更新: ${afterUpdate} 条`)
}

debug()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ 调试失败:', error)
    process.exit(1)
  })

