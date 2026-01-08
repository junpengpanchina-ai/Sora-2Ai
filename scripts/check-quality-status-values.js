/**
 * 检查 use_cases 表中 quality_status 的实际值
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const serviceClient = createClient(supabaseUrl, supabaseServiceKey)

async function checkValues() {
  console.log('🔍 检查 quality_status 的实际值...\n')

  // 1. 获取一些样本数据
  const { data: samples, error } = await serviceClient
    .from('use_cases')
    .select('id, title, is_published, quality_status')
    .eq('is_published', true)
    .limit(10)

  if (error) {
    console.error('❌ 查询错误:', error)
    return
  }

  console.log('📊 样本数据 (前10条已发布的):')
  console.log('-'.repeat(80))
  samples?.forEach((item, index) => {
    console.log(`${index + 1}. ID: ${item.id.slice(0, 8)}...`)
    console.log(`   Title: ${item.title?.slice(0, 50)}...`)
    console.log(`   is_published: ${item.is_published}`)
    console.log(`   quality_status: ${item.quality_status === null ? 'null' : JSON.stringify(item.quality_status)}`)
    console.log('')
  })

  // 2. 使用 SQL 直接查询 quality_status 的分布
  console.log('📊 quality_status 值分布统计:')
  console.log('-'.repeat(80))
  
  // 由于 Supabase JS 客户端限制，我们需要用不同的方法
  // 先检查各种可能的值
  const statuses = ['pending', 'approved', 'rejected', 'needs_review']
  
  for (const status of statuses) {
    try {
      const { count, error } = await serviceClient
        .from('use_cases')
        .select('*', { count: 'exact', head: true })
        .eq('is_published', true)
        .eq('quality_status', status)
      
      if (!error && count) {
        console.log(`   ${status}: ${count.toLocaleString()} 条`)
      }
    } catch (err) {
      // 忽略错误
    }
  }

  // 检查 null
  try {
    const { count } = await serviceClient
      .from('use_cases')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true)
      .is('quality_status', null)
    
    if (count) {
      console.log(`   null: ${count.toLocaleString()} 条`)
    }
  } catch (err) {
    // 忽略错误
  }

  // 3. 检查是否有其他值（非标准值）
  console.log('\n📊 检查是否有非标准 quality_status 值:')
  console.log('-'.repeat(80))
  
  // 获取所有不同的 quality_status 值（通过采样）
  const { data: allSamples } = await serviceClient
    .from('use_cases')
    .select('quality_status')
    .eq('is_published', true)
    .limit(1000)

  if (allSamples) {
    const uniqueStatuses = new Set()
    allSamples.forEach(item => {
      uniqueStatuses.add(item.quality_status === null ? 'null' : item.quality_status)
    })
    
    console.log('   发现的值:', Array.from(uniqueStatuses).join(', '))
  }

  console.log('\n💡 建议:')
  console.log('-'.repeat(80))
  console.log('如果 quality_status 不是 null 或 approved，需要：')
  console.log('1. 批量更新 quality_status 为 null 或 approved')
  console.log('2. 或者修改 RLS 策略和查询条件以包含其他状态')
}

checkValues()
  .then(() => {
    console.log('\n✅ 检查完成')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ 检查失败:', error)
    process.exit(1)
  })

