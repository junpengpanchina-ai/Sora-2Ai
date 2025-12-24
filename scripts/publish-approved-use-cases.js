/**
 * Bulk publish approved use_cases (set is_published=true) so they become visible publicly.
 *
 * Public RLS policy requires: is_published = TRUE AND quality_status = 'approved'
 *
 * Usage:
 *   node scripts/publish-approved-use-cases.js                 # dry-run (no DB writes)
 *   node scripts/publish-approved-use-cases.js --update        # perform updates
 *   node scripts/publish-approved-use-cases.js --batch 500
 *   node scripts/publish-approved-use-cases.js --max 20000     # cap total updates
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
  const batchSize = Math.min(1000, Math.max(50, Number(getArg('--batch', '500')) || 500))
  const maxTotal = Math.max(1, Number(getArg('--max', '100000000')) || 100000000)

  console.log('🚀 Bulk publish approved use_cases')
  console.log(`   - mode: ${shouldUpdate ? 'UPDATE' : 'DRY-RUN'}`)
  console.log(`   - batchSize: ${batchSize}`)
  console.log(`   - maxTotal: ${maxTotal}\n`)

  let updatedTotal = 0
  let offset = 0

  while (updatedTotal < maxTotal) {
    const remaining = maxTotal - updatedTotal
    const limit = Math.min(batchSize, remaining)

    const { data, error } = await supabase
      .from('use_cases')
      .select('id', { count: 'exact' })
      .eq('quality_status', 'approved')
      .eq('is_published', false)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)

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
    console.log(`📦 batch: ${ids.length} ids`)

    if (!shouldUpdate) {
      updatedTotal += ids.length
      // keep scanning next page
      offset += ids.length
      continue
    }

    const { error: updateError } = await supabase
      .from('use_cases')
      .update({ is_published: true })
      .in('id', ids)

    if (updateError) {
      console.error('❌ Update failed:', updateError.message)
      process.exit(1)
    }

    updatedTotal += ids.length
    console.log(`✅ published: +${ids.length} (total=${updatedTotal})`)

    // After update, do not increase offset (dataset shrinks as is_published flips),
    // always continue from 0 to avoid skipping.
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


