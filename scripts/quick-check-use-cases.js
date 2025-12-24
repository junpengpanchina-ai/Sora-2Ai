/**
 * 快速检查 use_cases 的实际分布
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function quickCheck() {
  console.log('🔍 Quick check use_cases distribution...\n')

  // 总数
  const { count: total } = await supabase.from('use_cases').select('*', { count: 'exact', head: true })
  console.log(`Total: ${total?.toLocaleString() || 0}\n`)

  // 已发布
  const { count: published } = await supabase.from('use_cases').select('*', { count: 'exact', head: true }).eq('is_published', true)
  console.log(`Published: ${published?.toLocaleString() || 0}`)

  // 未发布
  const { count: unpublished } = await supabase.from('use_cases').select('*', { count: 'exact', head: true }).eq('is_published', false)
  console.log(`Unpublished: ${unpublished?.toLocaleString() || 0}\n`)

  // approved 且已发布
  const { count: approvedPublished } = await supabase
    .from('use_cases')
    .select('*', { count: 'exact', head: true })
    .eq('quality_status', 'approved')
    .eq('is_published', true)
  console.log(`Approved + Published: ${approvedPublished?.toLocaleString() || 0}`)

  // approved 但未发布
  const { count: approvedUnpublished } = await supabase
    .from('use_cases')
    .select('*', { count: 'exact', head: true })
    .eq('quality_status', 'approved')
    .eq('is_published', false)
  console.log(`Approved + Unpublished: ${approvedUnpublished?.toLocaleString() || 0}\n`)

  // null status 且已发布
  const { count: nullPublished } = await supabase
    .from('use_cases')
    .select('*', { count: 'exact', head: true })
    .is('quality_status', null)
    .eq('is_published', true)
  console.log(`Null status + Published: ${nullPublished?.toLocaleString() || 0}`)

  // null status 且未发布
  const { count: nullUnpublished } = await supabase
    .from('use_cases')
    .select('*', { count: 'exact', head: true })
    .is('quality_status', null)
    .eq('is_published', false)
  console.log(`Null status + Unpublished: ${nullUnpublished?.toLocaleString() || 0}\n`)

  // 抽样查看实际数据
  console.log('📋 Sample records (first 5):')
  const { data: samples } = await supabase
    .from('use_cases')
    .select('id, title, quality_status, is_published')
    .limit(5)
  
  samples?.forEach((s, i) => {
    console.log(`  ${i+1}. ${s.title?.substring(0, 50)}... | status: ${s.quality_status || 'null'} | published: ${s.is_published}`)
  })
}

quickCheck().catch(console.error)
