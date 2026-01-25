/**
 * scripts/prompt-asset-ci-guards.ts
 *
 * CI-executable guards for:
 * - Prompt assets never becoming SEO assets (noindex + not in sitemap)
 * - Prompt Library hard flags remain disabled in DB
 * - Prompt Templates "Scene Gate" safety preconditions (site_gate_status exists)
 *
 * Usage:
 *   tsx scripts/prompt-asset-ci-guards.ts
 *
 * Required env (service role):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import fs from 'node:fs'
import path from 'node:path'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: '.env.local' })

function mustEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env: ${name}`)
  return v
}

function assertContains(filePath: string, needles: string[]) {
  const content = fs.readFileSync(filePath, 'utf8')
  for (const n of needles) {
    if (!content.includes(n)) {
      throw new Error(`Guard failed: ${path.basename(filePath)} missing required marker: ${n}`)
    }
  }
}

async function main() {
  const supabaseUrl = mustEnv('NEXT_PUBLIC_SUPABASE_URL')
  const serviceKey = mustEnv('SUPABASE_SERVICE_ROLE_KEY')

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // --------------------------------------------
  // 1) Code-level guards (Prompt pages must be noindex)
  // --------------------------------------------
  const repoRoot = process.cwd()
  assertContains(path.join(repoRoot, 'app/prompts/page.tsx'), ['robots:', 'index: false'])
  assertContains(path.join(repoRoot, 'app/prompts-en/page.tsx'), ['robots:', 'index: false'])
  assertContains(path.join(repoRoot, 'app/prompts/[slug]/page.tsx'), ['robots:', 'index: false'])

  // robots.txt should point to sitemap-index.xml (single entry)
  assertContains(path.join(repoRoot, 'app/robots.txt/route.ts'), ['Sitemap:', 'sitemap-index.xml'])

  // --------------------------------------------
  // 2) DB-level guards (Prompt Library never SEO)
  // --------------------------------------------
  const { data: badPromptLibrary, error: plErr } = await supabase
    .from('prompt_library')
    .select('id,is_indexable,is_in_sitemap')
    .or('is_indexable.eq.true,is_in_sitemap.eq.true')
    .limit(5)

  if (plErr) {
    throw new Error(`DB check failed (prompt_library): ${plErr.message}`)
  }
  if (Array.isArray(badPromptLibrary) && badPromptLibrary.length > 0) {
    throw new Error(
      `Guard failed: prompt_library has SEO-enabled rows (is_indexable/is_in_sitemap). Example id: ${badPromptLibrary[0]?.id}`
    )
  }

  // --------------------------------------------
  // 3) "Scene Gate" safety precondition exists
  // --------------------------------------------
  const { data: gateRow, error: gateErr } = await supabase
    .from('site_gate_status')
    .select('status,updated_at')
    .eq('id', 1)
    .maybeSingle()

  if (gateErr) {
    throw new Error(`DB check failed (site_gate_status): ${gateErr.message}`)
  }
  if (!gateRow?.status) {
    throw new Error('Guard failed: site_gate_status row (id=1) missing')
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        checks: {
          promptPagesNoindex: true,
          robotsTxtSitemapIndex: true,
          promptLibrarySeoFlags: 'clean',
          siteGateStatus: gateRow.status,
        },
      },
      null,
      2
    )
  )
}

main().catch((err) => {
  const msg = err instanceof Error ? err.message : String(err)
  console.error(msg)
  if (msg.includes("site_gate_status") || msg.includes("schema cache")) {
    console.error(
      "Hint: apply Supabase migrations first (e.g. `supabase/migrations/118_prompt_templates_analytics_and_generation.sql`)."
    )
  }
  process.exit(1)
})

