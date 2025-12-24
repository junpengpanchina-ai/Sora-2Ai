/**
 * Report distribution of quality issues for use_cases.
 *
 * Usage:
 *   node scripts/report-use-cases-quality.js
 *   node scripts/report-use-cases-quality.js --status needs_review
 *   node scripts/report-use-cases-quality.js --status all
 *   node scripts/report-use-cases-quality.js --limit 2000
 *
 * Notes:
 * - Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
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

function getArg(flag, fallback) {
  const idx = process.argv.indexOf(flag)
  if (idx === -1) return fallback
  const v = process.argv[idx + 1]
  if (!v || v.startsWith('--')) return fallback
  return v
}

async function main() {
  const status = getArg('--status', 'needs_review') // needs_review | pending | approved | rejected | all
  const limit = Number(getArg('--limit', '5000'))

  console.log('📊 Reporting use_cases quality issues...')
  console.log(`   - status filter: ${status}`)
  console.log(`   - limit: ${limit}`)

  let query = supabase
    .from('use_cases')
    .select('id, slug, title, quality_status, quality_issues, quality_score, is_published', { count: 'exact' })
    .order('updated_at', { ascending: false })
    .limit(limit)

  if (status !== 'all') {
    query = query.eq('quality_status', status)
  }

  const { data, error, count } = await query

  if (error) {
    console.error('❌ Query failed:', error)
    process.exit(1)
  }

  const rows = Array.isArray(data) ? data : []
  console.log(`   - fetched: ${rows.length}${typeof count === 'number' ? ` (totalCount=${count})` : ''}`)

  const issueCounts = new Map()
  const statusCounts = new Map()
  let nullIssues = 0

  for (const row of rows) {
    statusCounts.set(row.quality_status ?? 'null', (statusCounts.get(row.quality_status ?? 'null') || 0) + 1)
    const issues = Array.isArray(row.quality_issues) ? row.quality_issues : null
    if (!issues || issues.length === 0) {
      nullIssues++
      continue
    }
    for (const issue of issues) {
      issueCounts.set(issue, (issueCounts.get(issue) || 0) + 1)
    }
  }

  const sortedIssues = [...issueCounts.entries()].sort((a, b) => b[1] - a[1])
  const sortedStatuses = [...statusCounts.entries()].sort((a, b) => b[1] - a[1])

  console.log('\n🧾 Status distribution:')
  for (const [s, c] of sortedStatuses) {
    console.log(`   - ${s}: ${c}`)
  }

  console.log(`\n🧾 Rows with empty/NULL quality_issues: ${nullIssues}`)

  console.log('\n🚨 Top quality_issues:')
  if (sortedIssues.length === 0) {
    console.log('   (none)')
  } else {
    for (const [issue, c] of sortedIssues.slice(0, 30)) {
      console.log(`   - ${issue}: ${c}`)
    }
    if (sortedIssues.length > 30) {
      console.log(`   ... +${sortedIssues.length - 30} more`)
    }
  }

  // Show a few example slugs for the top issues to spot patterns quickly
  const topIssues = sortedIssues.slice(0, 5).map(([issue]) => issue)
  if (topIssues.length > 0) {
    console.log('\n🔎 Examples (up to 5 per issue):')
    for (const issue of topIssues) {
      const examples = rows
        .filter((r) => Array.isArray(r.quality_issues) && r.quality_issues.includes(issue))
        .slice(0, 5)
        .map((r) => ({
          slug: r.slug,
          score: r.quality_score,
          published: r.is_published,
          title: (r.title || '').slice(0, 60),
        }))
      console.log(`\n   - ${issue}`)
      for (const ex of examples) {
        console.log(`     • [${ex.score ?? 'null'}] ${ex.slug} | ${ex.title}${ex.title.length === 60 ? '…' : ''}`)
      }
    }
  }

  console.log('\n✅ Done.')
}

main().catch((e) => {
  console.error('❌ Script failed:', e)
  process.exit(1)
})


