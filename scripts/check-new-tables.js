#!/usr/bin/env node
/**
 * 检查新创建的表是否存在
 * 检查 use_cases, compare_pages 表以及 prompt_library 的 slug 字段
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  console.error('❌ 缺少 NEXT_PUBLIC_SUPABASE_URL')
  process.exit(1)
}

if (!supabaseServiceKey) {
  console.error('❌ 缺少 SUPABASE_SERVICE_ROLE_KEY')
  console.error('请从 Supabase Dashboard > Settings > API 获取 service_role key')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkTableExists(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1)

    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        return { exists: false, error: null }
      }
      return { exists: false, error: error.message }
    }
    return { exists: true, error: null }
  } catch (err) {
    return { exists: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

async function checkColumnExists(tableName, columnName) {
  try {
    // 尝试查询该列
    const { data, error } = await supabase
      .from(tableName)
      .select(columnName)
      .limit(1)

    if (error) {
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        return { exists: false, error: null }
      }
      return { exists: false, error: error.message }
    }
    return { exists: true, error: null }
  } catch (err) {
    return { exists: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

async function main() {
  console.log('🔍 检查数据库表状态...\n')

  // 检查 use_cases 表
  console.log('📊 检查 use_cases 表...')
  const useCasesCheck = await checkTableExists('use_cases')
  if (useCasesCheck.exists) {
    console.log('✅ use_cases 表存在\n')
  } else {
    console.log('❌ use_cases 表不存在')
    if (useCasesCheck.error) {
      console.log(`   错误: ${useCasesCheck.error}\n`)
    }
    console.log('   需要执行: supabase/migrations/034_create_use_cases_table.sql\n')
  }

  // 检查 compare_pages 表
  console.log('📊 检查 compare_pages 表...')
  const comparePagesCheck = await checkTableExists('compare_pages')
  if (comparePagesCheck.exists) {
    console.log('✅ compare_pages 表存在\n')
  } else {
    console.log('❌ compare_pages 表不存在')
    if (comparePagesCheck.error) {
      console.log(`   错误: ${comparePagesCheck.error}\n`)
    }
    console.log('   需要执行: supabase/migrations/035_create_compare_pages_table.sql\n')
  }

  // 检查 prompt_library 表的 slug 字段
  console.log('📊 检查 prompt_library.slug 字段...')
  const slugCheck = await checkColumnExists('prompt_library', 'slug')
  if (slugCheck.exists) {
    console.log('✅ prompt_library.slug 字段存在\n')
  } else {
    console.log('❌ prompt_library.slug 字段不存在')
    if (slugCheck.error) {
      console.log(`   错误: ${slugCheck.error}\n`)
    }
    console.log('   需要执行: supabase/migrations/033_add_slug_to_prompt_library.sql\n')
  }

  // 总结
  console.log('📋 迁移状态总结:')
  const allGood = useCasesCheck.exists && comparePagesCheck.exists && slugCheck.exists
  if (allGood) {
    console.log('✅ 所有表和字段都已创建！')
  } else {
    console.log('⚠️  需要执行以下迁移:')
    if (!useCasesCheck.exists) {
      console.log('   1. supabase/migrations/034_create_use_cases_table.sql')
    }
    if (!comparePagesCheck.exists) {
      console.log('   2. supabase/migrations/035_create_compare_pages_table.sql')
    }
    if (!slugCheck.exists) {
      console.log('   3. supabase/migrations/033_add_slug_to_prompt_library.sql')
    }
    console.log('\n💡 执行方法:')
    console.log('   方法1: 在 Supabase Dashboard > SQL Editor 中执行上述 SQL 文件')
    console.log('   方法2: 运行 supabase db push（如果使用本地 Supabase）')
  }
}

main().catch((error) => {
  console.error('❌ 检查失败:', error)
  process.exit(1)
})

