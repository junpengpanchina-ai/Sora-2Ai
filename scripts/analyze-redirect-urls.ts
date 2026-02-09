#!/usr/bin/env tsx
/**
 * 分析 1375 个重定向 URL：提取 pattern，统计去重，生成处理报告
 * 
 * 用法：
 *   tsx scripts/analyze-redirect-urls.ts < urls.txt
 * 
 * 或直接传入 URL 列表：
 *   tsx scripts/analyze-redirect-urls.ts
 */

import { readFileSync } from 'fs'
import { stdin } from 'process'

interface UrlAnalysis {
  url: string
  pathname: string
  searchParams: Record<string, string>
  pattern: string
  canonical?: string
}

function analyzeUrl(url: string): UrlAnalysis | null {
  try {
    const urlObj = new URL(url.trim())
    const searchParams: Record<string, string> = {}
    urlObj.searchParams.forEach((value, key) => {
      searchParams[key] = value
    })

    // 识别 pattern
    let pattern = 'unknown'
    let canonical: string | undefined

    if (urlObj.pathname === '/video' && searchParams.prompt) {
      pattern = 'video_prompt_param'
      // canonical: 去掉 prompt 参数
      const canonicalUrl = new URL(urlObj)
      canonicalUrl.searchParams.delete('prompt')
      canonical = canonicalUrl.toString()
    } else if (urlObj.pathname.startsWith('/keywords/')) {
      const slug = urlObj.pathname.split('/').pop() || ''
      if (slug.match(/^(keywords-){2,}/i)) {
        pattern = 'keywords_repeated_prefix'
        // canonical: normalize slug
        const normalized = slug.replace(/^(keywords-)+/i, 'keywords-')
        canonical = `${urlObj.origin}/keywords/${normalized}`
      }
    } else if (searchParams.format === 'xml') {
      pattern = 'format_xml_param'
      const canonicalUrl = new URL(urlObj)
      canonicalUrl.searchParams.delete('format')
      canonical = canonicalUrl.toString()
    }

    return {
      url,
      pathname: urlObj.pathname,
      searchParams,
      pattern,
      canonical,
    }
  } catch (error) {
    console.error(`Failed to parse URL: ${url}`, error)
    return null
  }
}

function main() {
  // 从 stdin 读取 URL 列表（每行一个）
  const input = readFileSync(0, 'utf-8')
  const urls = input
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))

  console.log(`📊 分析 ${urls.length} 个 URL...\n`)

  const analyses = urls.map(analyzeUrl).filter((a): a is UrlAnalysis => a !== null)

  // 按 pattern 分组统计
  const patternStats = new Map<string, { count: number; samples: string[] }>()
  const canonicalMap = new Map<string, string[]>()

  for (const analysis of analyses) {
    // 统计 pattern
    if (!patternStats.has(analysis.pattern)) {
      patternStats.set(analysis.pattern, { count: 0, samples: [] })
    }
    const stat = patternStats.get(analysis.pattern)!
    stat.count++
    if (stat.samples.length < 5) {
      stat.samples.push(analysis.url)
    }

    // 按 canonical 分组（去重）
    if (analysis.canonical) {
      if (!canonicalMap.has(analysis.canonical)) {
        canonicalMap.set(analysis.canonical, [])
      }
      canonicalMap.get(analysis.canonical)!.push(analysis.url)
    }
  }

  // 输出报告
  console.log('='.repeat(80))
  console.log('📈 Pattern 统计（Top 10）')
  console.log('='.repeat(80))
  
  const sortedPatterns = Array.from(patternStats.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)

  for (const [pattern, stat] of sortedPatterns) {
    console.log(`\n${pattern}: ${stat.count} 条`)
    console.log('  示例:')
    stat.samples.forEach((sample) => {
      console.log(`    - ${sample.substring(0, 100)}${sample.length > 100 ? '...' : ''}`)
    })
  }

  console.log('\n' + '='.repeat(80))
  console.log('🎯 Canonical 去重结果')
  console.log('='.repeat(80))
  console.log(`\n原始 URL 数: ${urls.length}`)
  console.log(`Canonical URL 数: ${canonicalMap.size}`)
  console.log(`去重率: ${((1 - canonicalMap.size / urls.length) * 100).toFixed(2)}%`)

  // 找出重定向到同一 canonical 的 URL 组
  const redirectGroups = Array.from(canonicalMap.entries())
    .filter(([, sources]) => sources.length > 1)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 10)

  if (redirectGroups.length > 0) {
    console.log(`\n\n🔗 重定向组（同一 canonical 的多个源 URL，Top 10）:`)
    for (const [canonical, sources] of redirectGroups) {
      console.log(`\n  Canonical: ${canonical}`)
      console.log(`  源 URL 数: ${sources.length}`)
      console.log(`  示例源 URL:`)
      sources.slice(0, 3).forEach((source) => {
        console.log(`    - ${source.substring(0, 100)}${source.length > 100 ? '...' : ''}`)
      })
    }
  }

  console.log('\n' + '='.repeat(80))
  console.log('✅ 处理建议')
  console.log('='.repeat(80))
  console.log(`
1. ✅ Sitemap 门禁：确保所有 sitemap 生成函数使用 filterUrlsWithPromptParam()
2. ✅ Middleware 重定向：已添加 /video?prompt=... → /video (308)
3. ✅ 计数表：redirect_hit_daily_counts 记录每日命中量
4. ✅ 监控：观察 3 天，pattern hit 必须下降

验收标准：
- sitemap 中不包含任何带 prompt 参数的 URL
- 重定向是单跳（最多 1 次 Location）
- redirect_hit_daily_counts 中 pattern hit 趋势下降
`)

  // 输出 JSON 格式（用于后续处理）
  if (process.env.OUTPUT_JSON === '1') {
    console.log('\n' + '='.repeat(80))
    console.log('📄 JSON 输出（OUTPUT_JSON=1）')
    console.log('='.repeat(80))
    console.log(JSON.stringify({
      total: urls.length,
      canonical_count: canonicalMap.size,
      patterns: Object.fromEntries(patternStats),
      redirect_groups: redirectGroups.map(([canonical, sources]) => ({
        canonical,
        source_count: sources.length,
        sources: sources.slice(0, 5), // 只输出前 5 个
      })),
    }, null, 2))
  }
}

main()
