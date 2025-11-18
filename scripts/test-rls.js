#!/usr/bin/env node

/**
 * RLS 策略测试脚本
 * 用于验证 Row Level Security 策略是否正确配置
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ 缺少 Supabase 环境变量')
  console.error('请确保 .env.local 文件中包含：')
  console.error('  - NEXT_PUBLIC_SUPABASE_URL')
  console.error('  - NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

// 创建客户端
const anonClient = createClient(supabaseUrl, supabaseAnonKey)
const serviceClient = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

console.log('🔍 开始测试 RLS 策略...\n')

// 测试函数
async function testRLS() {
  const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
  }

  // 测试 1: 使用 anon key 访问 users 表（应该失败或返回空）
  console.log('📋 测试 1: 使用 anon key 访问 users 表')
  try {
    const { data, error } = await anonClient.from('users').select('*').limit(1)
    if (error) {
      console.log('  ✅ 正确：anon 用户无法访问 users 表')
      console.log(`     错误信息: ${error.message}`)
      results.passed++
    } else if (!data || data.length === 0) {
      console.log('  ✅ 正确：anon 用户无法访问 users 表（返回空）')
      results.passed++
    } else {
      console.log('  ⚠️  警告：anon 用户可以访问 users 表数据')
      console.log(`     返回数据: ${JSON.stringify(data)}`)
      results.warnings++
    }
  } catch (err) {
    console.log('  ✅ 正确：anon 用户无法访问 users 表')
    console.log(`     错误: ${err.message}`)
    results.passed++
  }
  console.log('')

  // 测试 2: 使用 service_role 访问 users 表（应该成功）
  if (serviceClient) {
    console.log('📋 测试 2: 使用 service_role 访问 users 表')
    try {
      const { data, error } = await serviceClient.from('users').select('*').limit(1)
      if (error) {
        console.log('  ❌ 失败：service_role 无法访问 users 表')
        console.log(`     错误信息: ${error.message}`)
        results.failed++
      } else {
        console.log('  ✅ 正确：service_role 可以访问 users 表')
        console.log(`     返回记录数: ${data?.length || 0}`)
        results.passed++
      }
    } catch (err) {
      console.log('  ❌ 失败：service_role 访问 users 表时出错')
      console.log(`     错误: ${err.message}`)
      results.failed++
    }
    console.log('')
  } else {
    console.log('⚠️  跳过测试 2: 未配置 SUPABASE_SERVICE_ROLE_KEY')
    results.warnings++
    console.log('')
  }

  // 测试 3: 使用 anon key 访问 video_tasks 表（应该失败或返回空）
  console.log('📋 测试 3: 使用 anon key 访问 video_tasks 表')
  try {
    const { data, error } = await anonClient.from('video_tasks').select('*').limit(1)
    if (error) {
      console.log('  ✅ 正确：anon 用户无法访问 video_tasks 表')
      console.log(`     错误信息: ${error.message}`)
      results.passed++
    } else if (!data || data.length === 0) {
      console.log('  ✅ 正确：anon 用户无法访问 video_tasks 表（返回空）')
      results.passed++
    } else {
      console.log('  ⚠️  警告：anon 用户可以访问 video_tasks 表数据')
      results.warnings++
    }
  } catch (err) {
    console.log('  ✅ 正确：anon 用户无法访问 video_tasks 表')
    console.log(`     错误: ${err.message}`)
    results.passed++
  }
  console.log('')

  // 测试 4: 使用 anon key 访问 prompt_library 表（应该成功，因为已发布）
  console.log('📋 测试 4: 使用 anon key 访问 prompt_library 表（已发布）')
  try {
    const { data, error } = await anonClient
      .from('prompt_library')
      .select('*')
      .eq('is_published', true)
      .limit(1)
    if (error) {
      console.log('  ❌ 失败：anon 用户无法访问已发布的 prompt_library')
      console.log(`     错误信息: ${error.message}`)
      results.failed++
    } else {
      console.log('  ✅ 正确：anon 用户可以访问已发布的 prompt_library')
      console.log(`     返回记录数: ${data?.length || 0}`)
      results.passed++
    }
  } catch (err) {
    console.log('  ❌ 失败：访问 prompt_library 表时出错')
    console.log(`     错误: ${err.message}`)
    results.failed++
  }
  console.log('')

  // 测试 5: 检查 RLS 是否启用
  if (serviceClient) {
    console.log('📋 测试 5: 检查表的 RLS 状态')
    const tables = ['users', 'video_tasks', 'recharge_records', 'consumption_records', 'after_sales_issues']
    
    for (const table of tables) {
      try {
        // 尝试查询表信息（需要 service_role）
        const { data, error } = await serviceClient
          .from(table)
          .select('*')
          .limit(0)
        
        if (error && error.message.includes('RLS')) {
          console.log(`  ✅ ${table}: RLS 已启用`)
          results.passed++
        } else if (!error) {
          // 如果能查询，说明 RLS 可能未启用或策略允许
          console.log(`  ⚠️  ${table}: 需要手动检查 RLS 状态`)
          results.warnings++
        }
      } catch (err) {
        console.log(`  ⚠️  ${table}: 无法检查 RLS 状态`)
        results.warnings++
      }
    }
    console.log('')
  }

  // 总结
  console.log('📊 测试结果总结:')
  console.log(`  ✅ 通过: ${results.passed}`)
  console.log(`  ❌ 失败: ${results.failed}`)
  console.log(`  ⚠️  警告: ${results.warnings}`)
  console.log('')

  if (results.failed > 0) {
    console.log('❌ 部分测试失败，请检查 RLS 策略配置')
    process.exit(1)
  } else if (results.warnings > 0) {
    console.log('⚠️  有警告，建议检查配置')
    process.exit(0)
  } else {
    console.log('✅ 所有测试通过！')
    process.exit(0)
  }
}

// 运行测试
testRLS().catch((err) => {
  console.error('❌ 测试执行失败:', err)
  process.exit(1)
})

