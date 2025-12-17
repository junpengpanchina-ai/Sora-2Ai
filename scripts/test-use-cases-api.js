#!/usr/bin/env node
/**
 * 测试 use_cases API 路由
 * 模拟管理员请求来检查具体错误
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
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testUseCasesQuery() {
  console.log('🔍 测试 use_cases 表查询...\n')

  try {
    // 测试 1: 基本查询
    console.log('📊 测试 1: 基本查询...')
    const { data, error } = await supabase
      .from('use_cases')
      .select('*')
      .limit(5)

    if (error) {
      console.error('❌ 查询失败:', error)
      console.error('   错误代码:', error.code)
      console.error('   错误消息:', error.message)
      console.error('   错误详情:', error.details)
      console.error('   错误提示:', error.hint)
      return false
    }

    console.log('✅ 查询成功')
    console.log(`   返回 ${data?.length || 0} 条记录\n`)
    return true
  } catch (err) {
    console.error('❌ 异常:', err)
    return false
  }
}

async function testUseCasesWithFilters() {
  console.log('📊 测试 2: 带过滤条件的查询...')
  
  try {
    let query = supabase
      .from('use_cases')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(200)

    const { data, error } = await query

    if (error) {
      console.error('❌ 查询失败:', error)
      return false
    }

    console.log('✅ 查询成功')
    console.log(`   返回 ${data?.length || 0} 条记录\n`)
    return true
  } catch (err) {
    console.error('❌ 异常:', err)
    return false
  }
}

async function testRLSPolicies() {
  console.log('📊 测试 3: 检查 RLS 策略...')
  
  try {
    // 使用 service_role 应该可以访问所有数据
    const { data, error } = await supabase
      .from('use_cases')
      .select('*')

    if (error) {
      if (error.code === '42501' || error.message.includes('permission denied')) {
        console.error('❌ RLS 策略问题: service_role 无法访问')
        console.error('   需要检查 RLS 策略配置')
        return false
      }
      console.error('❌ 其他错误:', error)
      return false
    }

    console.log('✅ RLS 策略正常')
    console.log(`   可以访问 ${data?.length || 0} 条记录\n`)
    return true
  } catch (err) {
    console.error('❌ 异常:', err)
    return false
  }
}

async function main() {
  console.log('🧪 测试 use_cases API 功能...\n')
  console.log('使用 Service Role Key 进行测试\n')

  const test1 = await testUseCasesQuery()
  const test2 = await testUseCasesWithFilters()
  const test3 = await testRLSPolicies()

  console.log('📋 测试结果总结:')
  console.log(`   基本查询: ${test1 ? '✅' : '❌'}`)
  console.log(`   过滤查询: ${test2 ? '✅' : '❌'}`)
  console.log(`   RLS 策略: ${test3 ? '✅' : '❌'}`)

  if (test1 && test2 && test3) {
    console.log('\n✅ 所有测试通过！API 应该可以正常工作。')
    console.log('   如果后台仍然报错，可能是前端代码或认证问题。')
  } else {
    console.log('\n⚠️  部分测试失败，需要检查:')
    if (!test1) {
      console.log('   - 检查表结构和数据')
    }
    if (!test2) {
      console.log('   - 检查查询语法')
    }
    if (!test3) {
      console.log('   - 检查 RLS 策略配置')
      console.log('   - 确保 use_cases_service_role_all 策略存在')
    }
  }
}

main().catch((error) => {
  console.error('❌ 测试失败:', error)
  process.exit(1)
})

