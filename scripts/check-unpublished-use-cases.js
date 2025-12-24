/**
 * 检查未发布的10条 use_cases 是什么情况
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkUnpublished() {
  console.log('🔍 Checking unpublished use_cases...\n')

  const { data, error } = await supabase
    .from('use_cases')
    .select('id, slug, title, description, quality_status, is_published, created_at, updated_at')
    .eq('is_published', false)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ Query failed:', error.message)
    return
  }

  console.log(`📦 Found ${data?.length || 0} unpublished use_cases:\n`)

  data?.forEach((uc, i) => {
    console.log(`${i + 1}. ID: ${uc.id}`)
    console.log(`   Title: ${uc.title?.substring(0, 80)}${uc.title?.length > 80 ? '...' : ''}`)
    console.log(`   Slug: ${uc.slug}`)
    console.log(`   Quality Status: ${uc.quality_status || 'null'}`)
    console.log(`   Created: ${uc.created_at}`)
    console.log(`   Updated: ${uc.updated_at}`)
    console.log()
  })

  // 统计未发布的原因
  if (data && data.length > 0) {
    const byStatus = {}
    data.forEach((uc) => {
      const status = uc.quality_status || 'null'
      byStatus[status] = (byStatus[status] || 0) + 1
    })
    
    console.log('📊 Unpublished by quality_status:')
    Object.entries(byStatus).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`)
    })
  }
}

checkUnpublished().catch(console.error)
