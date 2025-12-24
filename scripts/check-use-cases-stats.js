/**
 * 检查 use_cases 表的统计信息
 * 查看总数、发布状态、质量状态分布
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少环境变量: NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

async function checkStats() {
  console.log('📊 Checking use_cases statistics...\n')

  try {
    // 总数
    const { count: totalCount, error: totalError } = await supabase
      .from('use_cases')
      .select('*', { count: 'exact', head: true })

    if (totalError) {
      console.error('❌ 查询总数失败:', totalError)
      return
    }

    console.log(`📦 Total use_cases: ${totalCount?.toLocaleString() || 0}\n`)

    // 按 is_published 统计
    const { data: publishedStats, error: publishedError } = await supabase
      .from('use_cases')
      .select('is_published', { count: 'exact' })

    if (!publishedError && publishedStats) {
      const published = publishedStats.filter((uc) => uc.is_published === true).length
      const unpublished = publishedStats.filter((uc) => uc.is_published === false || uc.is_published === null).length
      console.log(`📤 Published (is_published=true): ${published.toLocaleString()}`)
      console.log(`📥 Unpublished (is_published=false/null): ${unpublished.toLocaleString()}\n`)
    }

    // 按 quality_status 统计
    const { data: qualityStats, error: qualityError } = await supabase
      .from('use_cases')
      .select('quality_status')

    if (!qualityError && qualityStats) {
      const qualityMap = {}
      qualityStats.forEach((uc) => {
        const status = uc.quality_status || 'null'
        qualityMap[status] = (qualityMap[status] || 0) + 1
      })

      console.log('🏷️  Quality status distribution:')
      Object.entries(qualityMap)
        .sort((a, b) => b[1] - a[1])
        .forEach(([status, count]) => {
          console.log(`   ${status}: ${count.toLocaleString()}`)
        })
      console.log()
    }

    // 组合状态：quality_status + is_published
    console.log('🔍 Combined status (quality_status × is_published):')
    
    const combinations = [
      { quality_status: 'approved', is_published: true },
      { quality_status: 'approved', is_published: false },
      { quality_status: 'pending', is_published: true },
      { quality_status: 'pending', is_published: false },
      { quality_status: 'needs_review', is_published: true },
      { quality_status: 'needs_review', is_published: false },
      { quality_status: 'rejected', is_published: true },
      { quality_status: 'rejected', is_published: false },
      { quality_status: null, is_published: true },
      { quality_status: null, is_published: false },
    ]

    for (const combo of combinations) {
      try {
        let query = supabase.from('use_cases').select('id', { count: 'exact', head: true })
        
        if (combo.quality_status === null) {
          query = query.is('quality_status', null)
        } else {
          query = query.eq('quality_status', combo.quality_status)
        }
        
        query = query.eq('is_published', combo.is_published)
        
        const { count, error } = await query
        
        if (error) {
          console.log(`   ⚠️  Error querying ${combo.quality_status || 'null'} + ${combo.is_published}: ${error.message}`)
        } else if (count > 0) {
          const statusLabel = combo.quality_status || 'null'
          const pubLabel = combo.is_published ? 'published' : 'unpublished'
          console.log(`   ${statusLabel} + ${pubLabel}: ${count.toLocaleString()}`)
        }
      } catch (err) {
        console.log(`   ⚠️  Exception: ${err.message}`)
      }
    }
    
    // 特别检查 null + unpublished
    console.log('\n🔎 Detailed check: null quality_status + unpublished:')
    try {
      const { count, error } = await supabase
        .from('use_cases')
        .select('id', { count: 'exact', head: true })
        .is('quality_status', null)
        .eq('is_published', false)
      
      if (error) {
        console.log(`   Error: ${error.message}`)
      } else {
        console.log(`   Count: ${count?.toLocaleString() || 0}`)
      }
    } catch (err) {
      console.log(`   Exception: ${err.message}`)
    }

    console.log('\n💡 Tips:')
    console.log('   - To publish all approved: node scripts/publish-approved-use-cases.js --update')
    console.log('   - To publish pending/needs_review (if desired): modify script to include those statuses')
    console.log('   - To publish all (regardless of quality_status): use --publish-all flag (if script supports it)')
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkStats()
