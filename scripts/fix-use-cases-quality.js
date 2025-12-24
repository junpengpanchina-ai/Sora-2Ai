/**
 * Batch auto-fix (safe, deterministic) quality issues for use_cases.
 *
 * Focus: issues we can fix without an LLM:
 * - incorrect_video_duration (minutes/20s+ -> 15 seconds) [reuses existing heuristics]
 * - missing_h1 (set from title)
 * - missing_description (derive from content/title)
 * - missing_keywords (derive from industry/type/title words)
 * - missing_example_prompt (append Example Prompt block)
 * - poor_formatting (ensure at least 1 H2 heading by prepending a small structure block)
 *
 * Usage:
 *   node scripts/fix-use-cases-quality.js                      # dry-run (no DB writes)
 *   node scripts/fix-use-cases-quality.js --update             # write updates
 *   node scripts/fix-use-cases-quality.js --status needs_review
 *   node scripts/fix-use-cases-quality.js --limit 500 --offset 0
 *   node scripts/fix-use-cases-quality.js --only incorrect_video_duration,missing_h1
 *
 * Notes:
 * - Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 * - Does NOT change is_published by default (to avoid accidentally publishing 937 items).
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

function hasFlag(flag) {
  return process.argv.includes(flag)
}

function normalizeIssues(value) {
  return Array.isArray(value) ? value.map(String) : []
}

function uniq(arr) {
  return [...new Set(arr)]
}

// ---------- Fixers ----------

function detectPreferredDurationSeconds(text) {
  const lower = (text || '').toLowerCase()
  if (lower.includes('15 second') || lower.includes('15秒')) return 15
  if (lower.includes('10 second') || lower.includes('10秒')) return 10
  return 15 // safe default (max supported)
}

function fixIncorrectVideoDuration(text) {
  if (!text) return text

  const preferred = detectPreferredDurationSeconds(text)
  let fixed = text

  // Replace minute mentions in video-ish contexts with "<preferred> seconds"
  fixed = fixed.replace(/\b(\d+)\s*[-\s]*分钟?\b/gi, (match, num) => {
    const minutes = parseInt(num, 10)
    const lower = text.toLowerCase()
    const hasVideoContext = ['video', '视频', 'generate', '生成', 'create', '创建', 'prompt', '提示', 'duration', '时长'].some(
      (k) => lower.includes(k)
    )
    const hasServiceContext = ['service', '服务', 'express', 'appointment', '预约', 'wait'].some((k) => lower.includes(k))
    if (hasVideoContext && !hasServiceContext && minutes >= 1 && minutes <= 60) {
      return `${preferred} seconds`
    }
    return match
  })

  fixed = fixed.replace(/\b(\d+)\s*[-\s]*minute\b/gi, (match, num) => {
    const minutes = parseInt(num, 10)
    const lower = text.toLowerCase()
    const hasVideoContext = ['video', 'generate', 'create', 'prompt', 'duration', 'second'].some((k) => lower.includes(k))
    const hasServiceContext = ['service', 'express', 'appointment', 'wait', 'time'].some((k) => lower.includes(k))
    if (hasVideoContext && !hasServiceContext && minutes >= 1 && minutes <= 60) {
      return `${preferred} seconds`
    }
    return match
  })

  // Replace explicit 20s+ durations (keep 10/15)
  fixed = fixed.replace(/\b([2-9][0-9]|[1-9]\d{2,})\s*[-\s]*(seconds?|秒)\b/gi, (match, num) => {
    const n = parseInt(num, 10)
    if (n === 10 || n === 15) return match
    return `${preferred} seconds`
  })

  return fixed
}

function hasIncorrectVideoDurationWithContext(text) {
  if (!text) return false
  const lower = text.toLowerCase()

  // If there is no video-generation context at all, don't flag durations.
  const globalVideoCtx = ['video', 'generate', 'creating', 'create', 'prompt', 'duration', 'seconds', 'second', 'clip', '时长', '视频', '生成'].some(
    (k) => lower.includes(k)
  )
  if (!globalVideoCtx) return false

  const videoDurationCtx = [
    'video duration',
    'duration',
    'seconds long',
    'second video',
    'video length',
    'clip',
    '时长',
    '视频时长',
    'generated video',
  ]

  // Wrong seconds: any 20+ seconds mention (hyphen or space), excluding correct 10/15.
  const wrongSecondsRe = /\b([2-9][0-9]|[1-9]\d{2,})\s*[-\s]*(seconds?|sec|s|秒)\b/gi
  let m
  while ((m = wrongSecondsRe.exec(lower)) !== null) {
    const n = parseInt(m[1], 10)
    if (n === 10 || n === 15) continue
    const idx = m.index
    const window = lower.slice(Math.max(0, idx - 80), Math.min(lower.length, idx + 80))
    const hasCtx = videoDurationCtx.some((k) => window.includes(k))
    if (hasCtx) return true
    // If seconds are mentioned and the text is generally about video generation, treat as incorrect by default.
    return true
  }

  // Minutes: only flag if minutes occur near video-duration context, and not in service/travel contexts.
  const minuteRe = /\b(\d+)\s*[-\s]*(minutes?|mins?|分钟)\b/gi
  while ((m = minuteRe.exec(lower)) !== null) {
    const idx = m.index
    const window = lower.slice(Math.max(0, idx - 80), Math.min(lower.length, idx + 80))
    const hasCtx = videoDurationCtx.some((k) => window.includes(k))

    // Exclusions: service/travel contexts like "express service", "5 minute walk", etc.
    const hasServiceNearby = ['service', 'express', 'appointment', '预约', '服务', 'wait'].some((k) => window.includes(k))
    const hasTravelNearby = ['walk', 'drive', 'away', 'from', 'nearby', 'distance'].some((k) => window.includes(k))
    if (hasCtx && !hasServiceNearby && !hasTravelNearby) {
      return true
    }
  }

  return false
}

function ensureH1(useCase) {
  const title = (useCase.title || '').trim()
  const h1 = (useCase.h1 || '').trim()
  if (h1) return { changed: false, value: useCase.h1 }
  if (!title) return { changed: false, value: useCase.h1 }
  return { changed: true, value: title }
}

function ensureDescription(useCase) {
  const desc = (useCase.description || '').trim()
  if (desc && desc.length >= 50) return { changed: false, value: useCase.description }

  const title = (useCase.title || '').trim()
  const industry = (useCase.industry || '').trim()
  const type = (useCase.use_case_type || '').trim()

  // Try to take first non-empty paragraph from content as summary
  const content = (useCase.content || '').trim()
  const firstPara = content.split('\n').map((s) => s.trim()).filter(Boolean)[0] || ''
  let candidate = ''
  if (firstPara.length >= 60 && firstPara.length <= 220) {
    candidate = firstPara
  } else {
    const parts = []
    if (title) parts.push(`Learn how to use AI video generation for ${title}.`)
    if (industry) parts.push(`Industry: ${industry}.`)
    if (type) parts.push(`Use case type: ${type}.`)
    parts.push('Create high-quality 10–15 second videos with clear visual details, style, and camera direction.')
    candidate = parts.join(' ')
  }

  // Clamp to reasonable SEO length
  if (candidate.length > 280) candidate = candidate.slice(0, 277) + '...'
  return { changed: candidate !== useCase.description, value: candidate }
}

function ensureSeoKeywords(useCase) {
  const existing = Array.isArray(useCase.seo_keywords) ? useCase.seo_keywords.map(String).filter(Boolean) : []
  if (existing.length >= 2) return { changed: false, value: existing }

  const keywords = []
  if (useCase.industry) keywords.push(String(useCase.industry))
  if (useCase.use_case_type) keywords.push(String(useCase.use_case_type))
  const title = (useCase.title || '').toLowerCase()
  // Extract a few meaningful words from title
  const titleWords = title
    .split(/[^a-z0-9]+/i)
    .map((w) => w.trim())
    .filter((w) => w.length >= 4 && w.length <= 24)
    .slice(0, 4)
  keywords.push(...titleWords)
  const merged = uniq([...existing, ...keywords]).slice(0, 8)
  return { changed: merged.join('|') !== existing.join('|'), value: merged }
}

function hasExamplePromptBlock(content) {
  const c = (content || '').toLowerCase()
  return c.includes('example prompt') || c.includes('prompt example') || (content || '').includes('```')
}

function buildExamplePrompt(useCase) {
  const duration = detectPreferredDurationSeconds(`${useCase.content || ''} ${useCase.description || ''}`)
  const industry = useCase.industry ? String(useCase.industry) : 'your industry'
  const title = (useCase.title || '').trim() || 'your scenario'
  return `Create a cinematic ${duration}-second video for "${title}" in the ${industry} industry. Describe the setting, subject, lighting, camera movement, and mood. Keep it safe, original, and brand-neutral.`
}

function ensureExamplePrompt(useCase) {
  const content = (useCase.content || '').trim()
  if (!content) return { changed: false, value: useCase.content }
  if (hasExamplePromptBlock(content)) return { changed: false, value: useCase.content }

  const example = buildExamplePrompt(useCase)
  const appended =
    content +
    '\n\n## Example Prompt\n\n```text\n' +
    example +
    '\n```\n'
  return { changed: true, value: appended }
}

function ensureH2Formatting(useCase) {
  const content = (useCase.content || '').trim()
  if (!content) return { changed: false, value: useCase.content }
  const h2Count = (content.match(/^##\s+/gm) || []).length
  if (h2Count > 0) return { changed: false, value: useCase.content }

  const overview = (useCase.description || '').trim() || `Overview for ${useCase.title || useCase.slug || 'this use case'}.`
  const prefixed = `## Overview\n\n${overview}\n\n## Details\n\n${content}\n`
  return { changed: true, value: prefixed }
}

// ---------- Quality check (lite) ----------
function checkContentQualityLite(useCase) {
  const issues = []
  const warnings = []
  let score = 100

  if (!useCase.h1 || String(useCase.h1).trim().length === 0) {
    issues.push('missing_h1')
    score -= 20
  } else if (String(useCase.h1).length < 10) {
    warnings.push('H1 too short')
    score -= 5
  }

  if (!useCase.title || String(useCase.title).trim().length === 0) {
    issues.push('missing_title')
    score -= 15
  }

  if (!useCase.description || String(useCase.description).trim().length === 0) {
    issues.push('missing_description')
    score -= 15
  } else if (String(useCase.description).length < 50) {
    warnings.push('Description too short')
    score -= 5
  }

  const content = String(useCase.content || '')
  const contentLength = content.length
  if (contentLength === 0 || contentLength < 300) {
    issues.push('content_too_short')
    score -= contentLength === 0 ? 30 : 20
  } else if (contentLength < 500) {
    warnings.push('Content a bit short')
    score -= 10
  } else if (contentLength > 5000) {
    warnings.push('Content too long')
    score -= 5
  }

  const seoKeywords = Array.isArray(useCase.seo_keywords) ? useCase.seo_keywords : []
  if (seoKeywords.length === 0) {
    issues.push('missing_keywords')
    score -= 10
  } else if (seoKeywords.length < 2) {
    warnings.push('Few SEO keywords')
    score -= 5
  }

  if (content) {
    const h2Count = (content.match(/^##\s+/gm) || []).length
    if (h2Count === 0) {
      issues.push('poor_formatting')
      score -= 15
    }
    if (!hasExamplePromptBlock(content)) {
      issues.push('missing_example_prompt')
      score -= 10
    }
    const combined = `${useCase.title || ''}\n${useCase.description || ''}\n${content}`
    if (hasIncorrectVideoDurationWithContext(combined)) {
      issues.push('incorrect_video_duration')
      score -= 20
    }
  }

  score = Math.max(0, Math.min(100, score))
  return { score, issues: uniq(issues), warnings, passed: uniq(issues).length === 0 && score >= 60 }
}

async function main() {
  const shouldUpdate = hasFlag('--update')
  const status = getArg('--status', 'needs_review') // default: needs_review
  const only = (getArg('--only', '') || '').split(',').map((s) => s.trim()).filter(Boolean)
  const containsIssue = getArg('--contains', '') // optional: filter by a specific quality_issues entry
  const forceRecompute = hasFlag('--recompute') // recompute quality even if no fixes are applied
  const limit = Number(getArg('--limit', '500'))
  const offset = Number(getArg('--offset', '0'))

  console.log('🔧 Fixing use_cases quality (safe fixes)...')
  console.log(`   - mode: ${shouldUpdate ? 'UPDATE' : 'DRY-RUN'}`)
  console.log(`   - status filter: ${status}`)
  console.log(`   - limit/offset: ${limit}/${offset}`)
  console.log(`   - only issues: ${only.length ? only.join(', ') : '(all safe fixers)'}\n`)
  if (containsIssue) {
    console.log(`   - contains issue: ${containsIssue}\n`)
  }
  if (forceRecompute) {
    console.log('   - recompute: true (will update quality fields even when no text changes)\n')
  }

  let query = supabase
    .from('use_cases')
    .select('id, slug, title, h1, description, content, seo_keywords, industry, use_case_type, quality_status, quality_issues, quality_score')
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status !== 'all') {
    query = query.eq('quality_status', status)
  }

  if (containsIssue) {
    query = query.contains('quality_issues', [containsIssue])
  }

  const { data, error } = await query
  if (error) {
    console.error('❌ Query failed:', error)
    process.exit(1)
  }

  const rows = Array.isArray(data) ? data : []
  if (rows.length === 0) {
    console.log('ℹ️  No rows found for this filter.')
    return
  }

  let changed = 0
  let updated = 0
  let skipped = 0
  let failed = 0

  for (const row of rows) {
    const originalIssues = normalizeIssues(row.quality_issues)
    const currentIssuesSet = new Set(originalIssues)
    const hasQualityCheckError = currentIssuesSet.has('quality_check_error')

    const want = (issue) => (only.length === 0 ? true : only.includes(issue))

    const patch = {}
    const notes = []

    // Fix text fields first
    // If the row previously failed quality checking, also try to fix duration issues proactively.
    if (
      want('incorrect_video_duration') &&
      (currentIssuesSet.has('incorrect_video_duration') || hasQualityCheckError)
    ) {
      const t1 = fixIncorrectVideoDuration(row.title)
      const d1 = fixIncorrectVideoDuration(row.description)
      const c1 = fixIncorrectVideoDuration(row.content)
      if (t1 !== row.title) patch.title = t1
      if (d1 !== row.description) patch.description = d1
      if (c1 !== row.content) patch.content = c1
      if (Object.keys(patch).length > 0) notes.push('fixed incorrect_video_duration')
    }

    if (want('missing_h1') && (currentIssuesSet.has('missing_h1') || !row.h1 || String(row.h1).trim() === '')) {
      const r = ensureH1({ title: patch.title ?? row.title, h1: row.h1 })
      if (r.changed) {
        patch.h1 = r.value
        notes.push('filled h1 from title')
      }
    }

    if (want('missing_description') && (currentIssuesSet.has('missing_description') || !row.description || String(row.description).trim() === '')) {
      const r = ensureDescription({
        ...row,
        title: patch.title ?? row.title,
        description: patch.description ?? row.description,
        content: patch.content ?? row.content,
      })
      if (r.changed) {
        patch.description = r.value
        notes.push('filled description')
      }
    }

    if (want('missing_keywords') && (currentIssuesSet.has('missing_keywords') || !Array.isArray(row.seo_keywords) || row.seo_keywords.length < 2)) {
      const r = ensureSeoKeywords({
        ...row,
        title: patch.title ?? row.title,
      })
      if (r.changed) {
        patch.seo_keywords = r.value
        notes.push('filled seo_keywords')
      }
    }

    if (want('poor_formatting') && (currentIssuesSet.has('poor_formatting') || !/^##\s+/m.test(String(patch.content ?? row.content ?? '')))) {
      const r = ensureH2Formatting({
        ...row,
        title: patch.title ?? row.title,
        description: patch.description ?? row.description,
        content: patch.content ?? row.content,
      })
      if (r.changed) {
        patch.content = r.value
        notes.push('added minimal H2 headings')
      }
    }

    if (want('missing_example_prompt') && (currentIssuesSet.has('missing_example_prompt') || !hasExamplePromptBlock(String(patch.content ?? row.content ?? '')))) {
      const r = ensureExamplePrompt({
        ...row,
        title: patch.title ?? row.title,
        description: patch.description ?? row.description,
        content: patch.content ?? row.content,
      })
      if (r.changed) {
        patch.content = r.value
        notes.push('added example prompt')
      }
    }

    // If nothing changed and we don't need to recompute, skip quickly
    const shouldRecomputeOnly =
      only.length === 0 &&
      (forceRecompute || hasQualityCheckError || currentIssuesSet.has('incorrect_video_duration'))
    if (Object.keys(patch).length === 0 && !shouldRecomputeOnly) {
      skipped++
      continue
    }

    // Re-check after patch to update quality fields consistently
    const after = {
      ...row,
      ...patch,
      seo_keywords: patch.seo_keywords ?? row.seo_keywords,
    }
    const qc = checkContentQualityLite(after)

    patch.quality_score = qc.score
    patch.quality_issues = qc.issues
    patch.quality_status = qc.passed ? 'approved' : 'needs_review'
    patch.quality_notes = `auto-fix: ${notes.length ? notes.join('; ') : 'recomputed quality'}`

    changed++

    if (!shouldUpdate) {
      console.log(`🧪 [dry-run] ${row.slug} -> score ${row.quality_score ?? 'null'}→${qc.score}, issues: ${originalIssues.join(',') || '(none)'} -> ${qc.issues.join(',') || '(none)'}`)
      continue
    }

    try {
      const { error: updateError } = await supabase.from('use_cases').update(patch).eq('id', row.id)
      if (updateError) {
        console.error(`❌ Update failed [${row.slug}]:`, updateError.message)
        failed++
      } else {
        updated++
        console.log(`✅ Updated [${row.slug}] score=${qc.score} status=${patch.quality_status}`)
      }
    } catch (e) {
      console.error(`❌ Update exception [${row.slug}]:`, e instanceof Error ? e.message : String(e))
      failed++
    }
  }

  console.log('\n📊 Summary:')
  console.log(`   - scanned: ${rows.length}`)
  console.log(`   - changed: ${changed}`)
  console.log(`   - updated: ${updated}`)
  console.log(`   - skipped: ${skipped}`)
  console.log(`   - failed: ${failed}`)

  if (!shouldUpdate) {
    console.log('\n💡 Tip: re-run with --update to write changes.')
  }
}

main().catch((e) => {
  console.error('❌ Script failed:', e)
  process.exit(1)
})


