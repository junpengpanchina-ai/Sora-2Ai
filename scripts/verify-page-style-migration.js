#!/usr/bin/env node

/**
 * 验证页面风格迁移是否成功
 * 检查 page_style 字段是否支持 'official' 选项
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 错误: 缺少 Supabase 环境变量')
  console.error('请确保 .env.local 文件中包含:')
  console.error('  - NEXT_PUBLIC_SUPABASE_URL')
  console.error('  - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verifyMigration() {
  console.log('🔍 开始验证页面风格迁移...\n')

  try {
    // 1. 尝试插入 official 值（测试约束）
    console.log('\n2️⃣ 测试插入 official 页面风格...')
    
    // 先创建一个测试记录（如果不存在）
    const testKeyword = 'test-official-style-verification'
    
    // 检查是否已存在测试记录
    const { data: existing } = await supabase
      .from('long_tail_keywords')
      .select('id')
      .eq('keyword', testKeyword)
      .single()

    let testId = existing?.id

    if (!testId) {
      // 创建测试记录
      const { data: newRecord, error: createError } = await supabase
        .from('long_tail_keywords')
        .insert({
          keyword: testKeyword,
          intent: 'information',
          page_slug: 'test-official-verification',
          page_style: 'official', // 测试新值
          status: 'draft',
        })
        .select('id')
        .single()

      if (createError) {
        console.error('   ❌ 无法插入 official 页面风格:', createError.message)
        if (createError.message.includes('check constraint')) {
          console.error('   ⚠️  约束验证失败 - 迁移可能未执行')
          console.error('   💡 请执行迁移文件: supabase/migrations/025_add_official_page_style.sql')
        }
        return false
      }
      testId = newRecord.id
      console.log('   ✅ 成功插入 official 页面风格')
    } else {
      // 更新现有记录
      const { error: updateError } = await supabase
        .from('long_tail_keywords')
        .update({ page_style: 'official' })
        .eq('id', testId)

      if (updateError) {
        console.error('   ❌ 无法更新为 official 页面风格:', updateError.message)
        if (updateError.message.includes('check constraint')) {
          console.error('   ⚠️  约束验证失败 - 迁移可能未执行')
          console.error('   💡 请执行迁移文件: supabase/migrations/025_add_official_page_style.sql')
        }
        return false
      }
      console.log('   ✅ 成功更新为 official 页面风格')
    }

    // 3. 验证所有支持的页面风格
    console.log('\n3️⃣ 验证所有支持的页面风格值...')
    const validStyles = ['default', 'christmas', 'official']
    
    for (const style of validStyles) {
      const { error: testError } = await supabase
        .from('long_tail_keywords')
        .update({ page_style: style })
        .eq('id', testId)

      if (testError) {
        console.error(`   ❌ ${style} 风格验证失败:`, testError.message)
        return false
      }
      console.log(`   ✅ ${style} 风格验证通过`)
    }

    // 4. 清理测试记录
    console.log('\n4️⃣ 清理测试记录...')
    const { error: deleteError } = await supabase
      .from('long_tail_keywords')
      .delete()
      .eq('id', testId)

    if (deleteError) {
      console.warn('   ⚠️  无法删除测试记录:', deleteError.message)
    } else {
      console.log('   ✅ 测试记录已清理')
    }

    // 5. 检查现有数据
    console.log('\n5️⃣ 检查现有数据的页面风格分布...')
    const { data: stats, error: statsError } = await supabase
      .from('long_tail_keywords')
      .select('page_style')

    if (!statsError && stats) {
      const styleCounts = stats.reduce((acc, item) => {
        const style = item.page_style || 'default'
        acc[style] = (acc[style] || 0) + 1
        return acc
      }, {})

      console.log('   页面风格分布:')
      Object.entries(styleCounts).forEach(([style, count]) => {
        console.log(`     - ${style}: ${count} 条记录`)
      })
    }

    console.log('\n✅ 迁移验证成功！')
    console.log('   ✓ official 页面风格已支持')
    console.log('   ✓ 所有页面风格选项都正常工作')
    console.log('   ✓ 数据库约束已正确更新')
    
    return true
  } catch (error) {
    console.error('\n❌ 验证过程中出现错误:', error.message)
    console.error(error)
    return false
  }
}

// 运行验证
verifyMigration()
  .then((success) => {
    process.exit(success ? 0 : 1)
  })
  .catch((error) => {
    console.error('未捕获的错误:', error)
    process.exit(1)
  })
