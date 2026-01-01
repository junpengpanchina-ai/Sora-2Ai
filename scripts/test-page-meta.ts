/**
 * 测试 Page Meta 功能
 * 
 * 功能：
 * 1. 测试创建 page_meta 记录
 * 2. 测试更新 page_meta 字段
 * 3. 测试查询 page_meta
 */

import { getOrCreatePageMeta, updatePageMeta } from '../lib/page-meta-helper'

// 注意：需要根据你的实际数据库客户端调整
// 这里使用 Supabase 作为示例

async function testPageMeta() {
  console.log('🧪 开始测试 Page Meta 功能...\n')

  try {
    // 这里需要替换为你的实际数据库客户端
    // 示例：使用 Supabase
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 创建一个简单的数据库客户端包装
    const db = {
      query: async (sql: string, params: any[]) => {
        // 将 SQL 转换为 Supabase 查询
        // 这里需要根据实际情况调整
        console.log('SQL:', sql)
        console.log('Params:', params)
        return { rows: [] }
      },
    }

    // 测试 1：创建 page_meta 记录
    console.log('📝 测试 1：创建 page_meta 记录')
    const testPageId = '00000000-0000-0000-0000-000000000001'
    const meta1 = await getOrCreatePageMeta(
      db as any,
      'use_case',
      testPageId,
      'test-use-case'
    )
    console.log('✅ 创建成功:', meta1)
    console.log('')

    // 测试 2：更新 page_meta 字段
    console.log('📝 测试 2：更新 page_meta 字段')
    const meta2 = await updatePageMeta(db as any, 'use_case', testPageId, {
      geoScore: 85,
      geoLevel: 'G-A',
      purchaseIntent: 3,
      layer: 'conversion',
      status: 'published',
    })
    console.log('✅ 更新成功:', meta2)
    console.log('')

    // 测试 3：查询 page_meta
    console.log('📝 测试 3：查询 page_meta')
    const meta3 = await getOrCreatePageMeta(db as any, 'use_case', testPageId)
    console.log('✅ 查询成功:', meta3)
    console.log('')

    console.log('✅ 所有测试完成！')
  } catch (error) {
    console.error('❌ 测试失败:', error)
    throw error
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  testPageMeta()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

export { testPageMeta }

