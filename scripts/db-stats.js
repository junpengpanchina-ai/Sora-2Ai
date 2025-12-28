#!/usr/bin/env node

/**
 * DB stats (Supabase) - fast counts for SEO/indexing diagnosis
 *
 * Usage:
 *   node scripts/db-stats.js
 *
 * Requires:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *
 * Optional (for local dev):
 *   - .env.local (loaded automatically if present)
 */

require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing env vars: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  console.error('   Please configure them in .env.local (or your shell env) and re-run.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const MAX_URLS_PER_SITEMAP = 50000

async function count(table, filters = []) {
  let q = supabase.from(table).select('id', { count: 'exact', head: true })
  for (const f of filters) {
    if (f.type === 'eq') q = q.eq(f.col, f.val)
    else if (f.type === 'in') q = q.in(f.col, f.val)
    else if (f.type === 'is') q = q.is(f.col, f.val)
    else if (f.type === 'ilike') q = q.ilike(f.col, f.val)
  }
  const { count, error } = await q
  return { count: typeof count === 'number' ? count : 0, error }
}

async function main() {
  console.log('\n📊 Supabase DB Stats (fast counts)\n')
  console.log(`Supabase URL: ${String(supabaseUrl).replace(/^https?:\/\//, '').slice(0, 40)}...`)
  console.log('='.repeat(72))

  try {
    const [
      useCasesTotal,
      useCasesPublished,
      useCasesApproved,
      useCasesApprovedPublished,
      keywordsTotal,
      keywordsPublished,
      keywordsDraft,
      keywordsArchived,
      keywordsXmlSlug,
      promptsTotal,
      promptsPublished,
      blogTotal,
      blogPublished,
      compareTotal,
      comparePublished,
    ] = await Promise.all([
      count('use_cases'),
      count('use_cases', [{ type: 'eq', col: 'is_published', val: true }]),
      count('use_cases', [{ type: 'eq', col: 'quality_status', val: 'approved' }]),
      count('use_cases', [
        { type: 'eq', col: 'is_published', val: true },
        { type: 'eq', col: 'quality_status', val: 'approved' },
      ]),
      count('long_tail_keywords'),
      count('long_tail_keywords', [{ type: 'eq', col: 'status', val: 'published' }]),
      count('long_tail_keywords', [{ type: 'eq', col: 'status', val: 'draft' }]),
      count('long_tail_keywords', [{ type: 'eq', col: 'status', val: 'archived' }]),
      count('long_tail_keywords', [{ type: 'ilike', col: 'page_slug', val: '%.xml' }]),
      count('prompt_library'),
      count('prompt_library', [{ type: 'eq', col: 'is_published', val: true }]),
      count('blog_posts'),
      count('blog_posts', [{ type: 'eq', col: 'is_published', val: true }]),
      count('compare_pages'),
      count('compare_pages', [{ type: 'eq', col: 'is_published', val: true }]),
    ])

    const err = (x) => (x?.error ? ` ⚠️ ${x.error.message}` : '')

    console.log('\n## use_cases')
    console.log(`- total: ${useCasesTotal.count.toLocaleString()}${err(useCasesTotal)}`)
    console.log(`- published: ${useCasesPublished.count.toLocaleString()}${err(useCasesPublished)}`)
    console.log(`- approved: ${useCasesApproved.count.toLocaleString()}${err(useCasesApproved)}`)
    console.log(`- approved + published (public-indexable target): ${useCasesApprovedPublished.count.toLocaleString()}${err(useCasesApprovedPublished)}`)
    console.log(`- sitemap pages needed (@50k): ${Math.ceil(useCasesApprovedPublished.count / MAX_URLS_PER_SITEMAP) || 1}`)

    console.log('\n## long_tail_keywords')
    console.log(`- total: ${keywordsTotal.count.toLocaleString()}${err(keywordsTotal)}`)
    console.log(`- published: ${keywordsPublished.count.toLocaleString()}${err(keywordsPublished)}`)
    console.log(`- draft: ${keywordsDraft.count.toLocaleString()}${err(keywordsDraft)}`)
    console.log(`- archived: ${keywordsArchived.count.toLocaleString()}${err(keywordsArchived)}`)
    console.log(`- page_slug endswith .xml: ${keywordsXmlSlug.count.toLocaleString()}${err(keywordsXmlSlug)}`)
    console.log(`- sitemap pages needed (@50k, published): ${Math.ceil(keywordsPublished.count / MAX_URLS_PER_SITEMAP) || 1}`)

    console.log('\n## prompt_library')
    console.log(`- total: ${promptsTotal.count.toLocaleString()}${err(promptsTotal)}`)
    console.log(`- published: ${promptsPublished.count.toLocaleString()}${err(promptsPublished)}`)

    console.log('\n## blog_posts')
    console.log(`- total: ${blogTotal.count.toLocaleString()}${err(blogTotal)}`)
    console.log(`- published: ${blogPublished.count.toLocaleString()}${err(blogPublished)}`)

    console.log('\n## compare_pages')
    console.log(`- total: ${compareTotal.count.toLocaleString()}${err(compareTotal)}`)
    console.log(`- published: ${comparePublished.count.toLocaleString()}${err(comparePublished)}`)

    console.log('\n' + '='.repeat(72))
    console.log('\n✅ Done.\n')
    console.log('Next: paste this output back into chat and I will tell you exactly which sitemap layers to prioritize + what GSC should show next.')
  } catch (e) {
    console.error('\n❌ Failed to query Supabase.\n')
    console.error(e?.message || e)
    process.exit(1)
  }
}

main()


