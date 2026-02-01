#!/usr/bin/env tsx
/**
 * 单测：normalizeKeywordSlug + isBadKeywordSlug
 * 运行：npm run test:keyword-slug 或 tsx scripts/assert-keyword-slug-normalization.ts
 */
import { isBadKeywordSlug, normalizeKeywordSlug } from '../lib/keywords/bad-slugs'

const tests: Array<{ name: string; fn: () => void }> = []

function expect<T>(actual: T, expected: T, msg: string) {
  if (actual !== expected) {
    throw new Error(`${msg}: expected "${expected}", got "${actual}"`)
  }
}

// normalizeKeywordSlug: keywords-keywords-xxx → keywords-xxx (single prefix)
tests.push({
  name: 'removes repeated keywords- prefixes (keeps single)',
  fn: () => {
    expect(normalizeKeywordSlug('keywords-abc'), 'keywords-abc', 'single prefix unchanged')
    expect(normalizeKeywordSlug('keywords-keywords-abc'), 'keywords-abc', 'double prefix')
    expect(normalizeKeywordSlug('keywords-keywords-keywords-abc'), 'keywords-abc', 'triple prefix')
  },
})

tests.push({
  name: 'is idempotent',
  fn: () => {
    const once = normalizeKeywordSlug('keywords-keywords-abc')
    const twice = normalizeKeywordSlug(once)
    expect(once, 'keywords-abc', 'once')
    expect(twice, 'keywords-abc', 'twice')
  },
})

tests.push({
  name: 'does not change normal slugs',
  fn: () => {
    expect(normalizeKeywordSlug('singapore-sora2'), 'singapore-sora2', 'no prefix')
    expect(normalizeKeywordSlug('keywords-pakistan-sora2'), 'keywords-pakistan-sora2', 'single prefix')
  },
})

// isBadKeywordSlug
tests.push({
  name: 'isBadKeywordSlug detects double+ prefix',
  fn: () => {
    if (!isBadKeywordSlug('keywords-keywords-abc')) throw new Error('should be bad')
    if (!isBadKeywordSlug('keywords-keywords-keywords-abc')) throw new Error('should be bad')
    if (isBadKeywordSlug('keywords-abc')) throw new Error('single prefix should be ok')
  },
})

let passed = 0
for (const t of tests) {
  try {
    t.fn()
    console.log(`✅ ${t.name}`)
    passed++
  } catch (e) {
    console.error(`❌ ${t.name}:`, e instanceof Error ? e.message : e)
    process.exit(1)
  }
}
console.log(`\n✅ All ${passed} tests passed`)
process.exit(0)
