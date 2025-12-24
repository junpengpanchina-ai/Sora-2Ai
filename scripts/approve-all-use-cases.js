/**
 * 批量将所有 use_cases 标记为 approved 并发布
 * 
 * 这会将所有记录设置为：
 * - quality_status = 'approved'
 * - is_published = true
 *
 * Usage:
 *   node scripts/approve-all-use-cases.js                 # dry-run
 *   node scripts/approve-all-use-cases.js --update        # 执行更新
 *   node scripts/approve-all-use-cases.js --batch 1000    # 自定义批次大小
 *
 * Requires:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing env vars: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

function hasFlag(flag) {
  return process.argv.includes(flag)
}

function getArg(flag, fallback) {
  const idx = process.argv.indexOf(flag)
  if (idx === -1) return fallback
  const v = process.argv[idx + 1]
  if (!v || v.startsWith('--')) return fallback
  return v
}

async function main() {
  const shouldUpdate = hasFlag('--update')
  const batchSize = Math.min(2000, Math.max(100, Number(getArg('--batch', '1000')) || 1000))

  console.log('🚀 Approve and publish ALL use_cases')
  console.log(`   - mode: ${shouldUpdate ? 'UPDATE' : 'DRY-RUN'}`)
  console.log(`   - batchSize: ${batchSize}\n`)

  // 先统计需要更新的记录
  console.log('📊 Checking current status...')
  
  const { count: totalCount } = await supabase
    .from('use_cases')
    .select('*', { count: 'exact', head: true })

  const { count: needApprovalCount } = await supabase
    .from('use_cases')
    .select('*', { count: 'exact', head: true })
    .or('quality_status.neq.approved,is_published.eq.false')

  console.log(`   Total use_cases: ${totalCount?.toLocaleString() || 0}`)
  console.log(`   Need approval/publish: ${needApprovalCount?.toLocaleString() || 0}\n`)

  if (!shouldUpdate) {
    console.log('💡 This is a dry-run. Use --update flag to perform actual updates.')
    return
  }

  let updatedTotal = 0
  let offset = 0
  const maxIterations = 1000 // 防止无限循环
  let iterations = 0

  console.log('🔄 Starting batch updates...\n')

  while (iterations < maxIterations) {
    iterations++

    // 获取一批需要更新的记录（不是approved或者未发布的）
    const { data, error } = await supabase
      .from('use_cases')
      .select('id')
      .or('quality_status.neq.approved,is_published.eq.false')
      .order('created_at', { ascending: false })
      .range(offset, offset + batchSize - 1)

    if (error) {
      console.error('❌ Query failed:', error.message)
      break
    }

    const rows = Array.isArray(data) ? data : []
    if (rows.length === 0) {
      console.log('✅ No more rows to update.')
      break
    }

    const ids = rows.map((r) => r.id).filter(Boolean)
    console.log(`📦 Batch ${iterations}: ${ids.length} records`)

    // 批量更新：设置为 approved 并发布
    const { error: updateError } = await supabase
      .from('use_cases')
      .update({
        quality_status: 'approved',
        is_published: true,
        updated_at: new Date().toISOString(),
      })
      .in('id', ids)

    if (updateError) {
      console.error('❌ Update failed:', updateError.message)
      break
    }

    updatedTotal += ids.length
    console.log(`✅ Updated: +${ids.length} (total=${updatedTotal.toLocaleString()})`)

    // 由于更新会改变查询结果，重置 offset
    offset = 0

    // 短暂延迟，避免对数据库造成过大压力
    if (rows.length === batchSize) {
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  }

  // 最终验证
  console.log('\n📊 Final verification...')
  const { count: finalNeedApproval } = await supabase
    .from('use_cases')
    .select('*', { count: 'exact', head: true })
    .or('quality_status.neq.approved,is_published.eq.false')

  const { count: finalApprovedPublished } = await supabase
    .from('use_cases')
    .select('*', { count: 'exact', head: true })
    .eq('quality_status', 'approved')
    .eq('is_published', true)

  console.log(`   ✅ Approved + Published: ${finalApprovedPublished?.toLocaleString() || 0}`)
  console.log(`   ⚠️  Still need approval: ${finalNeedApproval?.toLocaleString() || 0}`)

  console.log(`\n🎉 Done. Total updated: ${updatedTotal.toLocaleString()}`)
}

main().catch((e) => {
  console.error('❌ Script failed:', e)
  process.exit(1)
})
