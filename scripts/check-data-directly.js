/**
 * 直接检查数据，不使用复杂查询
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const serviceClient = createClient(supabaseUrl, supabaseServiceKey)

async function checkDirectly() {
  console.log('🔍 直接检查数据...\n')

  // 1. 获取总数
  const { count: total, error: totalError } = await serviceClient
    .from('use_cases')
    .select('*', { count: 'exact', head: true })

  console.log(`总数据量: ${total?.toLocaleString() || 0}`)
  if (totalError) {
    console.error('错误:', totalError)
  }

  // 2. 获取一些样本数据，检查 quality_status
  const { data: samples, error: samplesError } = await serviceClient
    .from('use_cases')
    .select('id, is_published, quality_status')
    .limit(5)

  if (samplesError) {
    console.error('获取样本错误:', samplesError)
  } else {
    console.log('\n样本数据 (前5条):')
    samples?.forEach((item, i) => {
      console.log(`${i + 1}. is_published: ${item.is_published}, quality_status: ${item.quality_status === null ? 'null' : item.quality_status}`)
    })
  }

  // 3. 检查已发布的数据
  const { count: published, error: publishedError } = await serviceClient
    .from('use_cases')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', true)

  console.log(`\n已发布数据: ${published?.toLocaleString() || 0}`)
  if (publishedError) {
    console.error('错误:', publishedError)
  }

  // 4. 检查已发布且 quality_status 为特定值的数据
  console.log('\n检查已发布数据的 quality_status 分布:')
  
  // 先获取一些已发布的数据样本
  const { data: publishedSamples, error: publishedSamplesError } = await serviceClient
    .from('use_cases')
    .select('quality_status')
    .eq('is_published', true)
    .limit(100)

  if (publishedSamplesError) {
    console.error('获取已发布样本错误:', publishedSamplesError)
  } else if (publishedSamples) {
    const statusCounts = {}
    publishedSamples.forEach(item => {
      const status = item.quality_status === null ? 'null' : item.quality_status
      statusCounts[status] = (statusCounts[status] || 0) + 1
    })
    
    console.log('前100条已发布数据的 quality_status 分布:')
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} 条`)
    })
  }

  // 5. 尝试查询 approved
  console.log('\n尝试查询 approved:')
  const { count: approved, error: approvedError } = await serviceClient
    .from('use_cases')
    .select('*', { count: 'exact', head: true })
    .eq('quality_status', 'approved')

  console.log(`quality_status='approved' 的数据: ${approved?.toLocaleString() || 0}`)
  if (approvedError) {
    console.error('错误:', approvedError)
  }

  // 6. 尝试查询已发布且 approved
  console.log('\n尝试查询已发布且 approved:')
  const { count: publishedApproved, error: publishedApprovedError } = await serviceClient
    .from('use_cases')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', true)
    .eq('quality_status', 'approved')

  console.log(`is_published=true AND quality_status='approved': ${publishedApproved?.toLocaleString() || 0}`)
  if (publishedApprovedError) {
    console.error('错误:', publishedApprovedError)
    console.error('错误详情:', JSON.stringify(publishedApprovedError, null, 2))
  }
}

checkDirectly()
  .then(() => {
    console.log('\n✅ 检查完成')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ 检查失败:', error)
    process.exit(1)
  })

