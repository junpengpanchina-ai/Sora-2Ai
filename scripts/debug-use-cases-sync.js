/**
 * 调试脚本：检查 use_cases 数据同步问题
 * 检查为什么前端显示 0 条数据，但数据库有 21 万条
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('❌ 缺少环境变量！')
  process.exit(1)
}

// 创建两个客户端：anon（模拟前端）和 service（管理员权限）
const anonClient = createClient(supabaseUrl, supabaseAnonKey)
const serviceClient = createClient(supabaseUrl, supabaseServiceKey)

async function debugSync() {
  console.log('🔍 调试 use_cases 数据同步问题\n')
  console.log('='.repeat(80))

  // 1. 使用 service role 检查实际数据（绕过 RLS）
  console.log('\n📊 [Service Role] 数据库实际数据统计:')
  console.log('-'.repeat(80))
  
  const [
    totalCount,
    publishedCount,
    approvedPublishedCount,
    nullPublishedCount,
    nullUnpublishedCount,
    approvedUnpublishedCount,
  ] = await Promise.all([
    serviceClient.from('use_cases').select('*', { count: 'exact', head: true }),
    serviceClient.from('use_cases').select('*', { count: 'exact', head: true }).eq('is_published', true),
    serviceClient.from('use_cases').select('*', { count: 'exact', head: true }).eq('is_published', true).eq('quality_status', 'approved'),
    serviceClient.from('use_cases').select('*', { count: 'exact', head: true }).eq('is_published', true).is('quality_status', null),
    serviceClient.from('use_cases').select('*', { count: 'exact', head: true }).eq('is_published', false).is('quality_status', null),
    serviceClient.from('use_cases').select('*', { count: 'exact', head: true }).eq('is_published', false).eq('quality_status', 'approved'),
  ])

  console.log(`总数据量: ${totalCount.count?.toLocaleString() || 0}`)
  console.log(`已发布 (is_published=true): ${publishedCount.count?.toLocaleString() || 0}`)
  console.log(`已发布 + 已审核 (is_published=true, quality_status='approved'): ${approvedPublishedCount.count?.toLocaleString() || 0}`)
  console.log(`已发布 + 未审核 (is_published=true, quality_status=null): ${nullPublishedCount.count?.toLocaleString() || 0}`)
  console.log(`未发布 + 未审核 (is_published=false, quality_status=null): ${nullUnpublishedCount.count?.toLocaleString() || 0}`)
  console.log(`未发布 + 已审核 (is_published=false, quality_status='approved'): ${approvedUnpublishedCount.count?.toLocaleString() || 0}`)

  // 检查 quality_status 的实际值分布
  console.log('\n📊 [Service Role] quality_status 值分布:')
  console.log('-'.repeat(80))
  
  const statusCounts = await Promise.all([
    { name: 'pending', query: serviceClient.from('use_cases').select('*', { count: 'exact', head: true }).eq('is_published', true).eq('quality_status', 'pending') },
    { name: 'approved', query: serviceClient.from('use_cases').select('*', { count: 'exact', head: true }).eq('is_published', true).eq('quality_status', 'approved') },
    { name: 'rejected', query: serviceClient.from('use_cases').select('*', { count: 'exact', head: true }).eq('is_published', true).eq('quality_status', 'rejected') },
    { name: 'needs_review', query: serviceClient.from('use_cases').select('*', { count: 'exact', head: true }).eq('is_published', true).eq('quality_status', 'needs_review') },
    { name: 'null', query: serviceClient.from('use_cases').select('*', { count: 'exact', head: true }).eq('is_published', true).is('quality_status', null) },
  ])

  for (const status of statusCounts) {
    try {
      const { count, error } = await status.query
      if (error) {
        console.log(`   ${status.name}: 错误 - ${error.message}`)
      } else {
        console.log(`   ${status.name}: ${count?.toLocaleString() || 0} 条`)
      }
    } catch (err) {
      console.log(`   ${status.name}: 异常 - ${err.message}`)
    }
  }

  // 2. 使用 anon key 模拟前端查询（受 RLS 限制）
  console.log('\n📊 [Anon Client] 前端查询结果（受 RLS 限制）:')
  console.log('-'.repeat(80))

  // 模拟前端的查询条件
  const frontendQuery = anonClient
    .from('use_cases')
    .select('id, slug, title, description, use_case_type, industry', { count: 'exact' })
    .eq('is_published', true)
    .or('quality_status.eq.approved,quality_status.is.null')
    .order('created_at', { ascending: false })
    .range(0, 23) // 第一页，24条

  const { data: frontendData, error: frontendError, count: frontendCount } = await frontendQuery

  console.log(`前端查询结果: ${frontendData?.length || 0} 条`)
  console.log(`前端查询总数: ${frontendCount?.toLocaleString() || 0}`)
  if (frontendError) {
    console.error('前端查询错误:', {
      message: frontendError.message,
      code: frontendError.code,
      details: frontendError.details,
      hint: frontendError.hint,
    })
  }

  // 3. 检查 RLS 策略
  console.log('\n📊 [RLS Policy] 检查 RLS 策略:')
  console.log('-'.repeat(80))

  // 检查当前 RLS 策略（需要 service role）
  console.log('⚠️  无法自动查询 RLS 策略，请手动在 Supabase Dashboard > SQL Editor 执行:')
  console.log('   SELECT policyname, qual FROM pg_policies WHERE tablename = \'use_cases\';')
  console.log('   预期策略: use_cases_public_select')
  console.log('   预期条件: is_published = TRUE AND (quality_status = \'approved\' OR quality_status IS NULL)')

  // 4. 测试不同的查询条件
  console.log('\n📊 [测试查询] 不同查询条件的结果:')
  console.log('-'.repeat(80))

  const testQueries = [
    {
      name: '仅 is_published=true',
      query: anonClient.from('use_cases').select('*', { count: 'exact', head: true }).eq('is_published', true),
    },
    {
      name: 'is_published=true AND quality_status=approved',
      query: anonClient.from('use_cases').select('*', { count: 'exact', head: true }).eq('is_published', true).eq('quality_status', 'approved'),
    },
    {
      name: 'is_published=true AND quality_status IS NULL',
      query: anonClient.from('use_cases').select('*', { count: 'exact', head: true }).eq('is_published', true).is('quality_status', null),
    },
    {
      name: 'is_published=true AND (quality_status=approved OR quality_status IS NULL)',
      query: anonClient.from('use_cases').select('*', { count: 'exact', head: true }).eq('is_published', true).or('quality_status.eq.approved,quality_status.is.null'),
    },
  ]

  for (const test of testQueries) {
    try {
      const { count, error } = await test.query
      if (error) {
        console.log(`❌ ${test.name}: 错误 - ${error.message}`)
      } else {
        console.log(`✅ ${test.name}: ${count?.toLocaleString() || 0} 条`)
      }
    } catch (err) {
      console.log(`❌ ${test.name}: 异常 - ${err.message}`)
    }
  }

  // 5. 诊断建议
  console.log('\n💡 [诊断建议]:')
  console.log('-'.repeat(80))

  const shouldShow = nullPublishedCount.count + approvedPublishedCount.count
  const actuallyShows = frontendCount || 0

  if (shouldShow > 0 && actuallyShows === 0) {
    console.log('⚠️  问题诊断: 数据库有数据，但前端查询返回 0 条')
    console.log('   可能原因:')
    console.log('   1. RLS 策略太严格，不允许 null quality_status')
    console.log('   2. 迁移文件 057_relax_use_cases_rls_policy.sql 未执行')
    console.log('   3. RLS 策略条件与查询条件不匹配')
    console.log('\n   解决方案:')
    console.log('   1. 在 Supabase Dashboard > SQL Editor 执行迁移文件')
    console.log('   2. 检查 RLS 策略是否正确: is_published = TRUE AND (quality_status = \'approved\' OR quality_status IS NULL)')
  } else if (shouldShow === 0) {
    console.log('⚠️  问题诊断: 数据库中没有符合条件的数据')
    console.log('   建议:')
    if (nullUnpublishedCount.count > 0) {
      console.log(`   - 有 ${nullUnpublishedCount.count.toLocaleString()} 条未发布的数据，需要设置 is_published=true`)
      console.log('   - 运行: node scripts/publish-all-use-cases.js --update')
    }
    if (approvedUnpublishedCount.count > 0) {
      console.log(`   - 有 ${approvedUnpublishedCount.count.toLocaleString()} 条已审核但未发布的数据，需要设置 is_published=true`)
      console.log('   - 运行: node scripts/publish-approved-use-cases.js --update')
    }
  } else {
    console.log(`✅ 数据同步正常: 应该显示 ${shouldShow.toLocaleString()} 条，实际显示 ${actuallyShows.toLocaleString()} 条`)
  }

  console.log('\n' + '='.repeat(80))
}

debugSync()
  .then(() => {
    console.log('\n✅ 调试完成')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ 调试失败:', error)
    process.exit(1)
  })

