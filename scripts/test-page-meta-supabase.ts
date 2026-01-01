/**
 * 测试 Page Meta 功能（使用 Supabase）
 * 
 * 功能：
 * 1. 测试创建 page_meta 记录
 * 2. 测试更新 page_meta 字段
 * 3. 测试查询 page_meta
 */

// 加载环境变量
import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'

// 检查环境变量
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ 错误: Supabase 环境变量未配置！')
  console.error('\n请确保 .env.local 文件中包含：')
  console.error('  - NEXT_PUBLIC_SUPABASE_URL')
  console.error('  - SUPABASE_SERVICE_ROLE_KEY\n')
  process.exit(1)
}

// 创建 Supabase 客户端
const supabase = createClient(supabaseUrl, serviceRoleKey)

/**
 * 创建数据库客户端包装（适配 page-meta-helper.ts）
 */
function createDbClient() {
  return {
    query: async (sql: string, params: any[]) => {
      // 简单的 SQL 解析（仅用于测试）
      // 实际使用时，应该使用 Supabase Client 的方法
      console.log('SQL:', sql)
      console.log('Params:', params)
      
      // 这里可以添加实际的 Supabase 查询逻辑
      // 例如：使用 supabase.rpc() 或 supabase.from().select()
      
      return { rows: [] }
    },
  }
}

async function testPageMetaWithSupabase() {
  console.log('🧪 开始测试 Page Meta 功能（使用 Supabase）...\n')

  try {
    // 测试 1：直接使用 Supabase Client 创建 page_meta
    console.log('📝 测试 1：创建 page_meta 记录（使用 Supabase Client）')
    const testPageId = '00000000-0000-0000-0000-000000000001'
    
    const { data, error } = await supabase
      .from('page_meta')
      .insert({
        page_type: 'use_case',
        page_id: testPageId,
        page_slug: 'test-use-case',
        geo_score: 0,
        geo_level: 'G-None',
        purchase_intent: 0,
        trend_pressure: 0,
        layer: 'asset',
        status: 'draft',
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        // 记录已存在，尝试获取
        console.log('⚠️  记录已存在，获取现有记录...')
        const { data: existing } = await supabase
          .from('page_meta')
          .select('*')
          .eq('page_type', 'use_case')
          .eq('page_id', testPageId)
          .single()
        console.log('✅ 获取成功:', existing)
      } else {
        throw error
      }
    } else {
      console.log('✅ 创建成功:', data)
    }
    console.log('')

    // 测试 2：更新 page_meta 字段
    console.log('📝 测试 2：更新 page_meta 字段')
    const { data: updated, error: updateError } = await supabase
      .from('page_meta')
      .update({
        geo_score: 85,
        geo_level: 'G-A',
        purchase_intent: 3,
        trend_pressure: 0,
        layer: 'conversion',
        status: 'published',
      })
      .eq('page_type', 'use_case')
      .eq('page_id', testPageId)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }
    console.log('✅ 更新成功:', updated)
    console.log('')

    // 测试 3：查询 page_meta
    console.log('📝 测试 3：查询 page_meta')
    const { data: queried, error: queryError } = await supabase
      .from('page_meta')
      .select('*')
      .eq('page_type', 'use_case')
      .eq('page_id', testPageId)
      .single()

    if (queryError) {
      throw queryError
    }
    console.log('✅ 查询成功:', queried)
    console.log('')

    // 测试 4：测试 Index Health 函数
    console.log('📝 测试 4：测试 Index Health 函数')
    const { data: indexHealth, error: healthError } = await supabase
      .rpc('get_current_index_health')

    if (healthError) {
      console.log('⚠️  Index Health 函数未返回数据（可能还没有数据）:', healthError.message)
    } else {
      console.log('✅ Index Health:', indexHealth)
    }
    console.log('')

    console.log('✅ 所有测试完成！')
  } catch (error: any) {
    console.error('❌ 测试失败:', error.message || error)
    throw error
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  testPageMetaWithSupabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

export { testPageMetaWithSupabase }

