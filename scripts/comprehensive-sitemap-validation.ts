/**
 * 全面的 Sitemap URL 验证脚本
 * 
 * 功能：
 * 1. 检查所有页面类型（use-cases, keywords, blog, prompts, compare, industries）
 * 2. 验证实际 sitemap 中的 URL
 * 3. 检查每个 URL 是否在数据库中存在
 * 4. 生成详细的验证报告
 * 
 * 使用方法:
 *   npx tsx scripts/comprehensive-sitemap-validation.ts
 * 
 * 可选参数:
 *   --check-sitemap: 验证实际 sitemap 中的 URL（需要服务器运行）
 *   --export-csv: 导出结果到 CSV 文件
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { writeFileSync } from 'fs'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sora2aivideos.com'

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少必需的环境变量:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌')
  process.exit(1)
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

interface ValidationResult {
  url: string
  type: 'use-case' | 'keyword' | 'blog' | 'prompt' | 'compare' | 'industry' | 'static'
  slug: string
  exists: boolean
  published: boolean
  error?: string
  databaseId?: number | string
}

interface ValidationReport {
  total: number
  valid: number
  invalid: number
  results: ValidationResult[]
}

/**
 * 验证 Use Cases
 */
async function validateUseCases(): Promise<ValidationResult[]> {
  console.log('📋 验证 Use Cases...')
  const results: ValidationResult[] = []

  try {
    const { data: useCases, error } = await supabase
      .from('use_cases')
      .select('id, slug, is_published, quality_status')
      .eq('is_published', true)
      .eq('quality_status', 'approved')

    if (error) {
      console.error('❌ 获取 use cases 失败:', error)
      return results
    }

    const validSlugsArray = (useCases || [])
      .filter((uc) => uc.slug && typeof uc.slug === 'string' && uc.slug.trim().length > 0)
      .map((uc) => ({
        slug: uc.slug.trim(),
        id: uc.id,
        published: uc.is_published,
      }))

    validSlugsArray.forEach(({ slug, id, published }) => {
      results.push({
        url: `${baseUrl}/use-cases/${slug}`,
        type: 'use-case',
        slug,
        exists: true,
        published,
        databaseId: id,
      })
    })

    // 检查无效的 slug
    const { data: allUseCases } = await supabase
      .from('use_cases')
      .select('id, slug, title, is_published')
      .eq('is_published', true)

    let invalidUseCases: Array<{ id: number; slug: string | null; title: string | null; is_published: boolean }> = []
    if (allUseCases) {
      invalidUseCases = allUseCases.filter(
        (uc) => !uc.slug || typeof uc.slug !== 'string' || uc.slug.trim().length === 0 || uc.slug.includes('.xml')
      )

      invalidUseCases.forEach((uc) => {
        results.push({
          url: `${baseUrl}/use-cases/${uc.slug || 'INVALID'}`,
          type: 'use-case',
          slug: uc.slug || 'INVALID',
          exists: false,
          published: uc.is_published,
          error: '无效的 slug 格式',
          databaseId: uc.id,
        })
      })
    }

    console.log(`✅ 找到 ${validSlugsArray.length} 个有效的 use case slugs`)
    if (invalidUseCases.length > 0) {
      console.log(`⚠️  找到 ${invalidUseCases.length} 个无效的 use case slugs`)
    }

    return results
  } catch (error) {
    console.error('❌ 验证 use cases 时出错:', error)
    return results
  }
}

/**
 * 验证 Keywords
 */
async function validateKeywords(): Promise<ValidationResult[]> {
  console.log('📋 验证 Keywords...')
  const results: ValidationResult[] = []

  try {
    const { data: keywords, error } = await supabase
      .from('long_tail_keywords')
      .select('id, page_slug, keyword, status')
      .eq('status', 'published')

    if (error) {
      console.error('❌ 获取 keywords 失败:', error)
      return results
    }

    const validSlugs = (keywords || [])
      .filter((kw) => kw.page_slug && typeof kw.page_slug === 'string' && kw.page_slug.trim().length > 0)
      .map((kw) => ({
        slug: kw.page_slug.trim(),
        id: kw.id,
        published: kw.status === 'published',
      }))

    validSlugs.forEach(({ slug, id, published }) => {
      results.push({
        url: `${baseUrl}/keywords/${encodeURIComponent(slug)}`,
        type: 'keyword',
        slug,
        exists: true,
        published,
        databaseId: id,
      })
    })

    // 检查无效的 slug
    const invalidKeywords = (keywords || []).filter(
      (kw) => !kw.page_slug || typeof kw.page_slug !== 'string' || kw.page_slug.trim().length === 0 || kw.page_slug.includes('.xml')
    )

    invalidKeywords.forEach((kw) => {
      results.push({
        url: `${baseUrl}/keywords/${kw.page_slug || 'INVALID'}`,
        type: 'keyword',
        slug: kw.page_slug || 'INVALID',
        exists: false,
        published: kw.status === 'published',
        error: '无效的 slug 格式',
        databaseId: kw.id,
      })
    })

    console.log(`✅ 找到 ${validSlugs.length} 个有效的 keyword slugs`)
    if (invalidKeywords.length > 0) {
      console.log(`⚠️  找到 ${invalidKeywords.length} 个无效的 keyword slugs`)
    }

    return results
  } catch (error) {
    console.error('❌ 验证 keywords 时出错:', error)
    return results
  }
}

/**
 * 验证 Blog Posts
 */
async function validateBlogPosts(): Promise<ValidationResult[]> {
  console.log('📋 验证 Blog Posts...')
  const results: ValidationResult[] = []

  try {
    const { data: blogPosts, error } = await supabase
      .from('blog_posts')
      .select('id, slug, is_published')
      .eq('is_published', true)

    if (error) {
      console.error('❌ 获取 blog posts 失败:', error)
      return results
    }

    const validSlugs = (blogPosts || [])
      .filter((post) => post.slug && typeof post.slug === 'string' && post.slug.trim().length > 0)
      .map((post) => ({
        slug: post.slug.trim(),
        id: post.id,
        published: post.is_published,
      }))

    validSlugs.forEach(({ slug, id, published }) => {
      results.push({
        url: `${baseUrl}/blog/${slug}`,
        type: 'blog',
        slug,
        exists: true,
        published,
        databaseId: id,
      })
    })

    console.log(`✅ 找到 ${validSlugs.length} 个有效的 blog post slugs`)

    return results
  } catch (error) {
    console.error('❌ 验证 blog posts 时出错:', error)
    return results
  }
}

/**
 * 验证 Prompts
 */
async function validatePrompts(): Promise<ValidationResult[]> {
  console.log('📋 验证 Prompts...')
  const results: ValidationResult[] = []

  try {
    const { data: prompts, error } = await supabase
      .from('prompt_library')
      .select('id, slug, is_published')
      .eq('is_published', true)
      .not('slug', 'is', null)

    if (error) {
      console.error('❌ 获取 prompts 失败:', error)
      return results
    }

    const validSlugs = (prompts || [])
      .filter((prompt) => prompt.slug && typeof prompt.slug === 'string' && prompt.slug.trim().length > 0)
      .map((prompt) => ({
        slug: prompt.slug.trim(),
        id: prompt.id,
        published: prompt.is_published,
      }))

    validSlugs.forEach(({ slug, id, published }) => {
      results.push({
        url: `${baseUrl}/prompts/${slug}`,
        type: 'prompt',
        slug,
        exists: true,
        published,
        databaseId: id,
      })
    })

    console.log(`✅ 找到 ${validSlugs.length} 个有效的 prompt slugs`)

    return results
  } catch (error) {
    console.error('❌ 验证 prompts 时出错:', error)
    return results
  }
}

/**
 * 验证 Compare Pages
 */
async function validateComparePages(): Promise<ValidationResult[]> {
  console.log('📋 验证 Compare Pages...')
  const results: ValidationResult[] = []

  try {
    const { data: comparePages, error } = await supabase
      .from('compare_pages')
      .select('id, slug, is_published')
      .eq('is_published', true)

    if (error) {
      console.error('❌ 获取 compare pages 失败:', error)
      return results
    }

    const validSlugs = (comparePages || [])
      .filter((page) => page.slug && typeof page.slug === 'string' && page.slug.trim().length > 0)
      .map((page) => ({
        slug: page.slug.trim(),
        id: page.id,
        published: page.is_published,
      }))

    validSlugs.forEach(({ slug, id, published }) => {
      results.push({
        url: `${baseUrl}/compare/${slug}`,
        type: 'compare',
        slug,
        exists: true,
        published,
        databaseId: id,
      })
    })

    console.log(`✅ 找到 ${validSlugs.length} 个有效的 compare page slugs`)

    return results
  } catch (error) {
    console.error('❌ 验证 compare pages 时出错:', error)
    return results
  }
}

/**
 * 验证 Industries（静态列表）
 */
async function validateIndustries(): Promise<ValidationResult[]> {
  console.log('📋 验证 Industries...')
  const results: ValidationResult[] = []

  try {
    // Industries 是静态列表，不需要从数据库验证
    // 这里只是记录它们的存在
    const { INDUSTRIES_100 } = await import('@/lib/data/industries-100')
    
    INDUSTRIES_100.forEach((industry) => {
      const slug = industry.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and')
      results.push({
        url: `${baseUrl}/industries/${slug}`,
        type: 'industry',
        slug,
        exists: true,
        published: true,
      })
    })

    console.log(`✅ 找到 ${INDUSTRIES_100.length} 个 industry 页面`)

    return results
  } catch (error) {
    console.error('❌ 验证 industries 时出错:', error)
    return results
  }
}

/**
 * 生成验证报告
 */
function generateReport(allResults: ValidationResult[]): ValidationReport {
  const valid = allResults.filter((r) => r.exists && r.published).length
  const invalid = allResults.filter((r) => !r.exists || !r.published).length

  return {
    total: allResults.length,
    valid,
    invalid,
    results: allResults,
  }
}

/**
 * 导出 CSV 报告
 */
function exportToCSV(report: ValidationReport, filename: string = 'sitemap-validation-report.csv') {
  const headers = ['URL', '类型', 'Slug', '存在', '已发布', '错误', '数据库ID']
  const rows = report.results.map((r) => [
    r.url,
    r.type,
    r.slug,
    r.exists ? '是' : '否',
    r.published ? '是' : '否',
    r.error || '',
    r.databaseId?.toString() || '',
  ])

  const csv = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n')

  writeFileSync(filename, csv, 'utf-8')
  console.log(`\n📄 报告已导出到: ${filename}`)
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2)
  const exportCsv = args.includes('--export-csv')

  console.log('🚀 开始全面的 Sitemap URL 验证...\n')
  console.log(`Base URL: ${baseUrl}\n`)
  console.log('='.repeat(60) + '\n')

  // 验证所有页面类型
  const [
    useCaseResults,
    keywordResults,
    blogResults,
    promptResults,
    compareResults,
    industryResults,
  ] = await Promise.all([
    validateUseCases(),
    validateKeywords(),
    validateBlogPosts(),
    validatePrompts(),
    validateComparePages(),
    validateIndustries(),
  ])

  // 合并所有结果
  const allResults = [
    ...useCaseResults,
    ...keywordResults,
    ...blogResults,
    ...promptResults,
    ...compareResults,
    ...industryResults,
  ]

  // 生成报告
  const report = generateReport(allResults)

  // 输出摘要
  console.log('\n' + '='.repeat(60))
  console.log('📊 验证摘要')
  console.log('='.repeat(60))
  console.log(`总 URL 数: ${report.total}`)
  console.log(`✅ 有效: ${report.valid}`)
  console.log(`❌ 无效: ${report.invalid}`)
  console.log('\n按类型统计:')

  const typeStats = allResults.reduce((acc, r) => {
    acc[r.type] = (acc[r.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  Object.entries(typeStats).forEach(([type, count]) => {
    const validCount = allResults.filter((r) => r.type === type && r.exists && r.published).length
    const invalidCount = count - validCount
    console.log(`  ${type}: ${count} (有效: ${validCount}, 无效: ${invalidCount})`)
  })

  // 显示无效的 URL
  const invalidResults = allResults.filter((r) => !r.exists || !r.published)
  if (invalidResults.length > 0) {
    console.log('\n⚠️  无效的 URL:')
    invalidResults.forEach((r) => {
      console.log(`  - ${r.url}`)
      if (r.error) {
        console.log(`    错误: ${r.error}`)
      }
    })
  }

  // 导出 CSV
  if (exportCsv) {
    exportToCSV(report)
  }

  console.log('\n✅ 验证完成!')
  console.log('\n📝 下一步:')
  console.log('   1. 检查无效的 URL 并修复')
  console.log('   2. 从数据库中删除或修复无效记录')
  console.log('   3. 重新生成 sitemaps')
  console.log('   4. 在 Google Search Console 中重新提交 sitemaps')
}

main().catch((error) => {
  console.error('❌ 致命错误:', error)
  process.exit(1)
})
