/**
 * Bulk publish ALL use_cases (including null quality_status).
 * 
 * This will:
 * 1. Set quality_status='approved' for null status records
 * 2. Set is_published=true for all selected records
 * 
 * Public RLS policy requires: is_published = TRUE AND quality_status = 'approved'
 *
 * Usage:
 *   node scripts/publish-all-use-cases.js                 # dry-run (no DB writes)
 *   node scripts/publish-all-use-cases.js --update        # perform updates
 *   node scripts/publish-all-use-cases.js --batch 500
 *   node scripts/publish-all-use-cases.js --max 50000     # cap total updates
 *   node scripts/publish-all-use-cases.js --only-null     # only handle null quality_status
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

const supabase = createClient(supabaseUrl, supabaseServiceKey)

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
  const onlyNull = hasFlag('--only-null')
  const batchSize = Math.min(1000, Math.max(50, Number(getArg('--batch', '500')) || 500))
  const maxTotal = Math.max(1, Number(getArg('--max', '100000000')) || 100000000)

  console.log('🚀 Bulk publish ALL use_cases')
  console.log(`   - mode: ${shouldUpdate ? 'UPDATE' : 'DRY-RUN'}`)
  console.log(`   - onlyNull: ${onlyNull}`)
  console.log(`   - batchSize: ${batchSize}`)
  console.log(`   - maxTotal: ${maxTotal}\n`)

  let updatedTotal = 0
  let offset = 0

  while (updatedTotal < maxTotal) {
    const remaining = maxTotal - updatedTotal
    const limit = Math.min(batchSize, remaining)

    // Build query: get unpublished records
    let query = supabase
      .from('use_cases')
      .select('id, quality_status', { count: 'exact' })
      .eq('is_published', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (onlyNull) {
      // Only handle null quality_status
      query = query.is('quality_status', null)
    } else {
      // Handle both null and non-approved statuses
      query = query.or('quality_status.is.null,quality_status.neq.approved')
    }

    const { data, error } = await query

    if (error) {
      console.error('❌ Query failed:', error.message)
      process.exit(1)
    }

    const rows = Array.isArray(data) ? data : []
    if (rows.length === 0) {
      console.log('✅ No more rows to publish.')
      break
    }

    const ids = rows.map((r) => r.id).filter(Boolean)
    const nullCount = rows.filter((r) => r.quality_status === null || r.quality_status === undefined).length
    const nonNullCount = rows.length - nullCount
    
    console.log(`📦 batch: ${ids.length} ids (${nullCount} null status, ${nonNullCount} non-approved)`)

    if (!shouldUpdate) {
      updatedTotal += ids.length
      offset += ids.length
      continue
    }

    // Update: set quality_status='approved' AND is_published=true
    const { error: updateError } = await supabase
      .from('use_cases')
      .update({ 
        quality_status: 'approved',
        is_published: true 
      })
      .in('id', ids)

    if (updateError) {
      console.error('❌ Update failed:', updateError.message)
      process.exit(1)
    }

    updatedTotal += ids.length
    console.log(`✅ published: +${ids.length} (total=${updatedTotal})`)

    // After update, reset offset (dataset changes as records are updated)
    offset = 0
  }

  console.log('\n🎉 Done.')
  if (!shouldUpdate) {
    console.log('💡 Tip: re-run with --update to write changes.')
  }
}

main().catch((e) => {
  console.error('❌ Script failed:', e)
  process.exit(1)
})
