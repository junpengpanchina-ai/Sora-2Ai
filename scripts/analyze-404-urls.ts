/**
 * 分析 Google Search Console 导出的 404 URL
 * 
 * 功能：
 * 1. 解析 CSV 文件中的 404 URL
 * 2. 分析 URL 模式（类型、slug 等）
 * 3. 检查 URL 是否在数据库中存在
 * 4. 生成分析报告
 * 
 * 使用方法:
 *   npx tsx scripts/analyze-404-urls.ts <csv-file-path>
 * 
 * 示例:
 *   npx tsx scripts/analyze-404-urls.ts ~/Downloads/404-urls.csv
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { readFileSync, writeFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sora2aivideos.com'

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少必需的环境变量')
  process.exit(1)
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

interface URLAnalysis {
  url: string
  path: string
  type: 'use-case' | 'keyword' | 'blog' | 'prompt' | 'compare' | 'industry' | 'static' | 'unknown'
  slug: string | null
  existsInDatabase: boolean
  published: boolean
  databaseId?: number | string
  error?: string
  suggestions: string[]
}

/**
 * 解析 URL 并识别类型和 slug
 */
function parseURL(url: string): { type: URLAnalysis['type']; slug: string | null; path: string } {
  try {
    const urlObj = new URL(url)
    const path = urlObj.pathname

    // Use cases: /use-cases/[slug]
    if (path.startsWith('/use-cases/')) {
      const slug = path.replace('/use-cases/', '').split('?')[0].split('#')[0]
      return { type: 'use-case', slug: slug || null, path }
    }

    // Keywords: /keywords/[slug]
    if (path.startsWith('/keywords/')) {
      const slug = path.replace('/keywords/', '').split('?')[0].split('#')[0]
      return { type: 'keyword', slug: slug || null, path }
    }

    // Blog: /blog/[slug]
    if (path.startsWith('/blog/') && path !== '/blog') {
      const slug = path.replace('/blog/', '').split('?')[0].split('#')[0]
      return { type: 'blog', slug: slug || null, path }
    }

    // Prompts: /prompts/[slug]
    if (path.startsWith('/prompts/')) {
      const slug = path.replace('/prompts/', '').split('?')[0].split('#')[0]
      return { type: 'prompt', slug: slug || null, path }
    }

    // Compare: /compare/[slug]
    if (path.startsWith('/compare/') && path !== '/compare') {
      const slug = path.replace('/compare/', '').split('?')[0].split('#')[0]
      return { type: 'compare', slug: slug || null, path }
    }

    // Industries: /industries/[slug]
    if (path.startsWith('/industries/')) {
      const slug = path.replace('/industries/', '').split('?')[0].split('#')[0]
      return { type: 'industry', slug: slug || null, path }
    }

    // Static pages
    const staticPaths = ['/', '/video', '/blog', '/prompts', '/compare', '/support', '/privacy', '/terms']
    if (staticPaths.includes(path)) {
      return { type: 'static', slug: null, path }
    }

    return { type: 'unknown', slug: null, path }
  } catch (error) {
    return { type: 'unknown', slug: null, path: url }
  }
}

/**
 * 检查 URL 是否在数据库中存在
 */
async function checkURLExists(analysis: URLAnalysis): Promise<URLAnalysis> {
  if (!analysis.slug || analysis.type === 'unknown' || analysis.type === 'static') {
    analysis.existsInDatabase = false
    analysis.suggestions.push('无法检查：URL 类型未知或为静态页面')
    return analysis
  }

  try {
    switch (analysis.type) {
      case 'use-case': {
        const { data, error } = await supabase
          .from('use_cases')
          .select('id, slug, is_published')
          .eq('slug', decodeURIComponent(analysis.slug))
          .maybeSingle()

        if (error) {
          analysis.error = `数据库查询错误: ${error.message}`
          analysis.existsInDatabase = false
        } else if (data) {
          const useCase = data as { id: number; slug: string; is_published: boolean }
          analysis.existsInDatabase = true
          analysis.published = useCase.is_published
          analysis.databaseId = useCase.id
          if (!useCase.is_published) {
            analysis.suggestions.push('记录存在但未发布，需要发布或从 sitemap 中移除')
          }
        } else {
          analysis.existsInDatabase = false
          analysis.suggestions.push('记录不存在，可能已被删除')
          analysis.suggestions.push('建议：从 sitemap 中移除或创建 301 重定向到相关页面')
        }
        break
      }

      case 'keyword': {
        const { data, error } = await supabase
          .from('long_tail_keywords')
          .select('id, page_slug, status')
          .eq('page_slug', decodeURIComponent(analysis.slug))
          .maybeSingle()

        if (error) {
          analysis.error = `数据库查询错误: ${error.message}`
          analysis.existsInDatabase = false
        } else if (data) {
          const keyword = data as { id: number; page_slug: string; status: string }
          analysis.existsInDatabase = true
          analysis.published = keyword.status === 'published'
          analysis.databaseId = keyword.id
          if (keyword.status !== 'published') {
            analysis.suggestions.push('记录存在但未发布，需要发布或从 sitemap 中移除')
          }
        } else {
          analysis.existsInDatabase = false
          analysis.suggestions.push('记录不存在，可能已被删除')
          analysis.suggestions.push('建议：从 sitemap 中移除或创建 301 重定向到相关页面')
        }
        break
      }

      case 'blog': {
        const { data, error } = await supabase
          .from('blog_posts')
          .select('id, slug, is_published')
          .eq('slug', decodeURIComponent(analysis.slug))
          .maybeSingle()

        if (error) {
          analysis.error = `数据库查询错误: ${error.message}`
          analysis.existsInDatabase = false
        } else if (data) {
          const blogPost = data as { id: number; slug: string; is_published: boolean }
          analysis.existsInDatabase = true
          analysis.published = blogPost.is_published
          analysis.databaseId = blogPost.id
          if (!blogPost.is_published) {
            analysis.suggestions.push('记录存在但未发布，需要发布或从 sitemap 中移除')
          }
        } else {
          analysis.existsInDatabase = false
          analysis.suggestions.push('记录不存在，可能已被删除')
        }
        break
      }

      case 'prompt': {
        const { data, error } = await supabase
          .from('prompt_library')
          .select('id, slug, is_published')
          .eq('slug', decodeURIComponent(analysis.slug))
          .maybeSingle()

        if (error) {
          analysis.error = `数据库查询错误: ${error.message}`
          analysis.existsInDatabase = false
        } else if (data) {
          const prompt = data as { id: number; slug: string; is_published: boolean }
          analysis.existsInDatabase = true
          analysis.published = prompt.is_published
          analysis.databaseId = prompt.id
          if (!prompt.is_published) {
            analysis.suggestions.push('记录存在但未发布，需要发布或从 sitemap 中移除')
          }
        } else {
          analysis.existsInDatabase = false
          analysis.suggestions.push('记录不存在，可能已被删除')
        }
        break
      }

      case 'compare': {
        const { data, error } = await supabase
          .from('compare_pages')
          .select('id, slug, is_published')
          .eq('slug', decodeURIComponent(analysis.slug))
          .maybeSingle()

        if (error) {
          analysis.error = `数据库查询错误: ${error.message}`
          analysis.existsInDatabase = false
        } else if (data) {
          const comparePage = data as { id: number; slug: string; is_published: boolean }
          analysis.existsInDatabase = true
          analysis.published = comparePage.is_published
          analysis.databaseId = comparePage.id
          if (!comparePage.is_published) {
            analysis.suggestions.push('记录存在但未发布，需要发布或从 sitemap 中移除')
          }
        } else {
          analysis.existsInDatabase = false
          analysis.suggestions.push('记录不存在，可能已被删除')
        }
        break
      }

      case 'industry': {
        // Industries 是静态列表，不需要从数据库检查
        analysis.existsInDatabase = true
        analysis.published = true
        analysis.suggestions.push('Industry 页面是静态的，应该总是存在')
        break
      }
    }
  } catch (error) {
    analysis.error = `检查时出错: ${error instanceof Error ? error.message : String(error)}`
    analysis.existsInDatabase = false
  }

  return analysis
}

/**
 * 解析 CSV 文件
 */
function parseCSV(filePath: string): string[] {
  try {
    const content = readFileSync(filePath, 'utf-8')
    const lines = content.split('\n').filter((line) => line.trim().length > 0)
    
    // 跳过标题行
    const urls: string[] = []
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      // CSV 格式可能是：URL,其他列...
      // 提取第一列（URL）
      const match = line.match(/^"?(https?:\/\/[^",\s]+)"?/)
      if (match) {
        urls.push(match[1])
      } else {
        // 如果不是完整 URL，尝试提取路径
        const pathMatch = line.match(/^"?(https?:\/\/[^"]+)"?/)
        if (pathMatch) {
          urls.push(pathMatch[1])
        } else {
          // 如果只是路径，添加 base URL
          const path = line.split(',')[0].trim().replace(/^["']|["']$/g, '')
          if (path.startsWith('/')) {
            urls.push(`${baseUrl}${path}`)
          }
        }
      }
    }
    
    return urls
  } catch (error) {
    console.error('❌ 读取 CSV 文件失败:', error)
    return []
  }
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2)
  
  if (args.length === 0) {
    console.error('❌ 请提供 CSV 文件路径')
    console.error('使用方法: npx tsx scripts/analyze-404-urls.ts <csv-file-path>')
    console.error('示例: npx tsx scripts/analyze-404-urls.ts ~/Downloads/404-urls.csv')
    process.exit(1)
  }

  const csvFilePath = args[0]
  console.log('🚀 开始分析 404 URL...\n')
  console.log(`CSV 文件: ${csvFilePath}\n`)
  console.log('='.repeat(60) + '\n')

  // 解析 CSV
  const urls = parseCSV(csvFilePath)
  console.log(`📋 找到 ${urls.length} 个 URL\n`)

  if (urls.length === 0) {
    console.error('❌ 未找到任何 URL，请检查 CSV 文件格式')
    process.exit(1)
  }

  // 分析每个 URL
  const analyses: URLAnalysis[] = []
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i]
    console.log(`[${i + 1}/${urls.length}] 分析: ${url}`)
    
    const parsed = parseURL(url)
    const analysis: URLAnalysis = {
      url,
      path: parsed.path,
      type: parsed.type,
      slug: parsed.slug,
      existsInDatabase: false,
      published: false,
      suggestions: [],
    }

    await checkURLExists(analysis)
    analyses.push(analysis)

    // 显示简要结果
    if (analysis.existsInDatabase) {
      console.log(`  ✅ 存在于数据库${analysis.published ? '（已发布）' : '（未发布）'}`)
    } else {
      console.log(`  ❌ 不存在于数据库`)
    }
  }

  // 生成报告
  console.log('\n' + '='.repeat(60))
  console.log('📊 分析摘要')
  console.log('='.repeat(60))

  const existsCount = analyses.filter((a) => a.existsInDatabase).length
  const notExistsCount = analyses.filter((a) => !a.existsInDatabase).length
  const unpublishedCount = analyses.filter((a) => a.existsInDatabase && !a.published).length

  console.log(`总 URL 数: ${analyses.length}`)
  console.log(`✅ 存在于数据库: ${existsCount}`)
  console.log(`❌ 不存在于数据库: ${notExistsCount}`)
  console.log(`⚠️  存在但未发布: ${unpublishedCount}`)

  // 按类型统计
  console.log('\n按类型统计:')
  const typeStats = analyses.reduce((acc, a) => {
    acc[a.type] = (acc[a.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  Object.entries(typeStats).forEach(([type, count]) => {
    const exists = analyses.filter((a) => a.type === type && a.existsInDatabase).length
    console.log(`  ${type}: ${count} (存在: ${exists}, 不存在: ${count - exists})`)
  })

  // 导出详细报告
  const reportPath = '404-urls-analysis-report.csv'
  const csvHeaders = ['URL', '类型', 'Slug', '存在于数据库', '已发布', '数据库ID', '错误', '建议']
  const csvRows = analyses.map((a) => [
    a.url,
    a.type,
    a.slug || '',
    a.existsInDatabase ? '是' : '否',
    a.published ? '是' : '否',
    a.databaseId?.toString() || '',
    a.error || '',
    a.suggestions.join('; ') || '',
  ])

  const csv = [
    csvHeaders.join(','),
    ...csvRows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n')

  writeFileSync(reportPath, csv, 'utf-8')
  console.log(`\n📄 详细报告已导出到: ${reportPath}`)

  // 显示建议
  if (notExistsCount > 0) {
    console.log('\n💡 建议:')
    console.log('   1. 检查这些 URL 是否在 sitemap 中')
    console.log('   2. 如果存在，从 sitemap 中移除')
    console.log('   3. 或者创建 301 重定向到相关页面')
  }

  console.log('\n✅ 分析完成!')
}

main().catch((error) => {
  console.error('❌ 致命错误:', error)
  process.exit(1)
})
