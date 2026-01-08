/**
 * 测试 RLS 策略是否正确
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const anonClient = createClient(supabaseUrl, supabaseAnonKey)
const serviceClient = createClient(supabaseUrl, supabaseServiceKey)

async function testRLS() {
  console.log('🔍 测试 RLS 策略...\n')
  console.log('='.repeat(80))

  // 1. 使用 service role 检查实际有多少 approved + published 的数据
  console.log('\n📊 [Service Role] 检查数据:')
  console.log('-'.repeat(80))
  
  const { count: serviceCount, error: serviceError } = await serviceClient
    .from('use_cases')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', true)
    .eq('quality_status', 'approved')

  console.log(`Service Role 查询结果: ${serviceCount?.toLocaleString() || 0} 条`)
  if (serviceError) {
    console.error('Service Role 错误:', serviceError)
  }

  // 2. 使用 anon key 测试（受 RLS 限制）
  console.log('\n📊 [Anon Client] 测试 RLS 策略:')
  console.log('-'.repeat(80))

  // 测试 1: 简单的 is_published=true 查询
  console.log('测试 1: is_published=true (应该被 RLS 阻止，除非策略允许)')
  try {
    const { count: test1Count, error: test1Error } = await anonClient
      .from('use_cases')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true)
      .limit(1) // 只查询1条，避免超时
    
    if (test1Error) {
      console.log(`   ❌ 错误: ${test1Error.message} (code: ${test1Error.code})`)
      if (test1Error.code === '42501') {
        console.log('   💡 这是权限错误，说明 RLS 策略可能太严格')
      }
    } else {
      console.log(`   ✅ 成功: ${test1Count?.toLocaleString() || 0} 条`)
    }
  } catch (err) {
    console.log(`   ❌ 异常: ${err.message}`)
  }

  // 测试 2: is_published=true AND quality_status=approved
  console.log('\n测试 2: is_published=true AND quality_status=approved')
  try {
    const { count: test2Count, error: test2Error } = await anonClient
      .from('use_cases')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true)
      .eq('quality_status', 'approved')
      .limit(1)
    
    if (test2Error) {
      console.log(`   ❌ 错误: ${test2Error.message} (code: ${test2Error.code})`)
    } else {
      console.log(`   ✅ 成功: ${test2Count?.toLocaleString() || 0} 条`)
    }
  } catch (err) {
    console.log(`   ❌ 异常: ${err.message}`)
  }

  // 测试 3: 使用 or 条件
  console.log('\n测试 3: is_published=true AND (quality_status=approved OR quality_status IS NULL)')
  try {
    const { count: test3Count, error: test3Error } = await anonClient
      .from('use_cases')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true)
      .or('quality_status.eq.approved,quality_status.is.null')
      .limit(1)
    
    if (test3Error) {
      console.log(`   ❌ 错误: ${test3Error.message} (code: ${test3Error.code})`)
      if (test3Error.message.includes('timeout')) {
        console.log('   💡 查询超时，可能是数据量太大或索引问题')
      }
    } else {
      console.log(`   ✅ 成功: ${test3Count?.toLocaleString() || 0} 条`)
    }
  } catch (err) {
    console.log(`   ❌ 异常: ${err.message}`)
  }

  // 3. 诊断
  console.log('\n💡 [诊断]:')
  console.log('-'.repeat(80))
  console.log('如果所有测试都返回 0 条或错误，可能的原因:')
  console.log('1. RLS 策略太严格，不允许查询')
  console.log('2. 迁移文件 057_relax_use_cases_rls_policy.sql 未执行')
  console.log('3. RLS 策略条件与查询条件不匹配')
  console.log('\n解决方案:')
  console.log('1. 在 Supabase Dashboard > SQL Editor 执行迁移文件')
  console.log('2. 验证 RLS 策略: SELECT policyname, qual FROM pg_policies WHERE tablename = \'use_cases\';')
  console.log('3. 确保策略条件包含: is_published = TRUE AND (quality_status = \'approved\' OR quality_status IS NULL)')

  console.log('\n' + '='.repeat(80))
}

testRLS()
  .then(() => {
    console.log('\n✅ 测试完成')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ 测试失败:', error)
    process.exit(1)
  })

