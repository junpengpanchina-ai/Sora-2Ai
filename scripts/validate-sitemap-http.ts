/**
 * 通过 HTTP 请求验证实际 sitemap 中的 URL
 * 
 * 功能：
 * 1. 获取主 sitemap.xml
 * 2. 解析所有子 sitemap
 * 3. 提取所有 URL
 * 4. 检查每个 URL 是否可访问
 * 5. 验证 URL 是否在数据库中存在
 * 6. 生成验证报告
 * 
 * 使用方法:
 *   npx tsx scripts/validate-sitemap-http.ts [--base-url=https://sora2aivideos.com]
 * 
 * 可选参数:
 *   --base-url: 网站基础 URL（默认: https://sora2aivideos.com）
 *   --export-csv: 导出结果到 CSV 文件
 *   --check-http: 检查 URL 的 HTTP 状态码（较慢）
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { writeFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
let baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sora2aivideos.com'

// Parse command line arguments
const args = process.argv.slice(2)
const exportCsv = args.includes('--export-csv')
const checkHttp = args.includes('--check-http')

const baseUrlArg = args.find((arg) => arg.startsWith('--base-url='))
if (baseUrlArg) {
  baseUrl = baseUrlArg.split('=')[1]
}

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少必需的环境变量')
  process.exit(1)
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

interface SitemapURL {
  url: string
  sitemap: string
  existsInDatabase: boolean
  published: boolean
  httpStatus?: number
  httpError?: string
  databaseId?: number | string
  type: 'use-case' | 'keyword' | 'blog' | 'prompt' | 'compare' | 'industry' | 'static' | 'unknown'
  slug: string | null
}

/**
 * 解析 URL 并识别类型
 */
function parseURL(url: string): { type: SitemapURL['type']; slug: string | null } {
  try {
    const urlObj = new URL(url)
    const path = urlObj.pathname

    if (path.startsWith('/use-cases/')) {
      const slug = path.replace('/use-cases/', '').split('?')[0]
      return { type: 'use-case', slug: slug || null }
    }
    if (path.startsWith('/keywords/')) {
      const slug = path.replace('/keywords/', '').split('?')[0]
      return { type: 'keyword', slug: slug || null }
    }
    if (path.startsWith('/blog/') && path !== '/blog') {
      const slug = path.replace('/blog/', '').split('?')[0]
      return { type: 'blog', slug: slug || null }
    }
    if (path.startsWith('/prompts/')) {
      const slug = path.replace('/prompts/', '').split('?')[0]
      return { type: 'prompt', slug: slug || null }
    }
    if (path.startsWith('/compare/') && path !== '/compare') {
      const slug = path.replace('/compare/', '').split('?')[0]
      return { type: 'compare', slug: slug || null }
    }
    if (path.startsWith('/industries/')) {
      const slug = path.replace('/industries/', '').split('?')[0]
      return { type: 'industry', slug: slug || null }
    }

    const staticPaths = ['/', '/video', '/blog', '/prompts', '/compare', '/support', '/privacy', '/terms']
    if (staticPaths.includes(path)) {
      return { type: 'static', slug: null }
    }

    return { type: 'unknown', slug: null }
  } catch {
    return { type: 'unknown', slug: null }
  }
}

/**
 * 获取 sitemap XML
 */
async function fetchSitemap(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SitemapValidator/1.0)',
      },
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    return await response.text()
  } catch (error) {
    throw new Error(`获取 sitemap 失败: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * 解析 sitemap XML 并提取 URL
 */
function extractURLsFromSitemap(xml: string): string[] {
  const urls: string[] = []
  
  // 提取 <loc> 标签中的 URL
  const locRegex = /<loc>(.*?)<\/loc>/g
  let match
  while ((match = locRegex.exec(xml)) !== null) {
    const url = match[1].trim()
    if (url) {
      urls.push(url)
    }
  }
  
  return urls
}

/**
 * 解析 sitemap index 并提取子 sitemap URL
 */
function extractSitemapIndex(xml: string): string[] {
  const sitemaps: string[] = []
  
  // 提取 <sitemap><loc> 中的 URL
  const sitemapRegex = /<sitemap>\s*<loc>(.*?)<\/loc>/g
  let match
  while ((match = sitemapRegex.exec(xml)) !== null) {
    const url = match[1].trim()
    if (url) {
      sitemaps.push(url)
    }
  }
  
  return sitemaps
}

/**
 * 检查 URL 是否在数据库中存在
 */
async function checkURLInDatabase(url: SitemapURL): Promise<SitemapURL> {
  if (!url.slug || url.type === 'unknown' || url.type === 'static') {
    url.existsInDatabase = true // 静态页面总是存在
    url.published = true
    return url
  }

  try {
    switch (url.type) {
      case 'use-case': {
        const { data } = await supabase
          .from('use_cases')
          .select('id, is_published')
          .eq('slug', decodeURIComponent(url.slug))
          .maybeSingle()
        
        if (data) {
          const useCase = data as { id: number; is_published: boolean }
          url.existsInDatabase = true
          url.published = useCase.is_published
          url.databaseId = useCase.id
        } else {
          url.existsInDatabase = false
        }
        break
      }

      case 'keyword': {
        const { data } = await supabase
          .from('long_tail_keywords')
          .select('id, status')
          .eq('page_slug', decodeURIComponent(url.slug))
          .maybeSingle()
        
        if (data) {
          const keyword = data as { id: number; status: string }
          url.existsInDatabase = true
          url.published = keyword.status === 'published'
          url.databaseId = keyword.id
        } else {
          url.existsInDatabase = false
        }
        break
      }

      case 'blog': {
        const { data } = await supabase
          .from('blog_posts')
          .select('id, is_published')
          .eq('slug', decodeURIComponent(url.slug))
          .maybeSingle()
        
        if (data) {
          const blogPost = data as { id: number; is_published: boolean }
          url.existsInDatabase = true
          url.published = blogPost.is_published
          url.databaseId = blogPost.id
        } else {
          url.existsInDatabase = false
        }
        break
      }

      case 'prompt': {
        const { data } = await supabase
          .from('prompt_library')
          .select('id, is_published')
          .eq('slug', decodeURIComponent(url.slug))
          .maybeSingle()
        
        if (data) {
          const prompt = data as { id: number; is_published: boolean }
          url.existsInDatabase = true
          url.published = prompt.is_published
          url.databaseId = prompt.id
        } else {
          url.existsInDatabase = false
        }
        break
      }

      case 'compare': {
        const { data } = await supabase
          .from('compare_pages')
          .select('id, is_published')
          .eq('slug', decodeURIComponent(url.slug))
          .maybeSingle()
        
        if (data) {
          const comparePage = data as { id: number; is_published: boolean }
          url.existsInDatabase = true
          url.published = comparePage.is_published
          url.databaseId = comparePage.id
        } else {
          url.existsInDatabase = false
        }
        break
      }

      case 'industry': {
        url.existsInDatabase = true
        url.published = true
        break
      }
    }
  } catch (error) {
    url.httpError = `数据库查询错误: ${error instanceof Error ? error.message : String(error)}`
  }

  return url
}

/**
 * 检查 URL 的 HTTP 状态码
 */
async function checkHTTPStatus(url: SitemapURL): Promise<SitemapURL> {
  try {
    const response = await fetch(url.url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SitemapValidator/1.0)',
      },
      redirect: 'follow',
    })
    
    url.httpStatus = response.status
  } catch (error) {
    url.httpError = error instanceof Error ? error.message : String(error)
  }

  return url
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 开始验证 sitemap 中的 URL...\n')
  console.log(`Base URL: ${baseUrl}\n`)
  console.log('='.repeat(60) + '\n')

  // 1. 获取主 sitemap
  console.log('📋 获取主 sitemap...')
  const mainSitemapUrl = `${baseUrl}/sitemap.xml`
  let mainSitemapXML: string
  
  try {
    mainSitemapXML = await fetchSitemap(mainSitemapUrl)
    console.log('✅ 成功获取主 sitemap\n')
  } catch (error) {
    console.error('❌ 获取主 sitemap 失败:', error)
    console.error('提示: 确保网站正在运行或使用 --base-url 参数指定正确的 URL')
    process.exit(1)
  }

  // 2. 解析 sitemap index
  const sitemapUrls = extractSitemapIndex(mainSitemapXML)
  console.log(`📋 找到 ${sitemapUrls.length} 个子 sitemap\n`)

  // 3. 获取所有子 sitemap 的 URL
  const allURLs: SitemapURL[] = []
  
  for (let i = 0; i < sitemapUrls.length; i++) {
    const sitemapUrl = sitemapUrls[i]
    console.log(`[${i + 1}/${sitemapUrls.length}] 处理: ${sitemapUrl}`)
    
    try {
      const sitemapXML = await fetchSitemap(sitemapUrl)
      const urls = extractURLsFromSitemap(sitemapXML)
      console.log(`  ✅ 找到 ${urls.length} 个 URL`)
      
      urls.forEach((url) => {
        const parsed = parseURL(url)
        allURLs.push({
          url,
          sitemap: sitemapUrl,
          existsInDatabase: false,
          published: false,
          type: parsed.type,
          slug: parsed.slug,
        })
      })
    } catch (error) {
      console.error(`  ❌ 处理失败: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  console.log(`\n📊 总共找到 ${allURLs.length} 个 URL\n`)
  console.log('='.repeat(60) + '\n')

  // 4. 验证每个 URL
  console.log('🔍 验证 URL...\n')
  
  for (let i = 0; i < allURLs.length; i++) {
    const url = allURLs[i]
    if ((i + 1) % 100 === 0) {
      console.log(`[${i + 1}/${allURLs.length}] 验证中...`)
    }
    
    await checkURLInDatabase(url)
    
    if (checkHttp) {
      await checkHTTPStatus(url)
    }
  }

  // 5. 生成报告
  console.log('\n' + '='.repeat(60))
  console.log('📊 验证摘要')
  console.log('='.repeat(60))

  const existsCount = allURLs.filter((u) => u.existsInDatabase).length
  const notExistsCount = allURLs.filter((u) => !u.existsInDatabase).length
  const unpublishedCount = allURLs.filter((u) => u.existsInDatabase && !u.published).length
  const httpErrorCount = checkHttp ? allURLs.filter((u) => u.httpStatus && u.httpStatus >= 400).length : 0

  console.log(`总 URL 数: ${allURLs.length}`)
  console.log(`✅ 存在于数据库: ${existsCount}`)
  console.log(`❌ 不存在于数据库: ${notExistsCount}`)
  if (checkHttp) {
    console.log(`⚠️  HTTP 错误 (>=400): ${httpErrorCount}`)
  }
  console.log(`⚠️  存在但未发布: ${unpublishedCount}`)

  // 按类型统计
  console.log('\n按类型统计:')
  const typeStats = allURLs.reduce((acc, u) => {
    acc[u.type] = (acc[u.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  Object.entries(typeStats).forEach(([type, count]) => {
    const exists = allURLs.filter((u) => u.type === type && u.existsInDatabase).length
    console.log(`  ${type}: ${count} (存在: ${exists}, 不存在: ${count - exists})`)
  })

  // 显示问题 URL
  const problemURLs = allURLs.filter((u) => !u.existsInDatabase || (checkHttp && u.httpStatus && u.httpStatus >= 400))
  if (problemURLs.length > 0) {
    console.log(`\n⚠️  发现 ${problemURLs.length} 个问题 URL:`)
    problemURLs.slice(0, 10).forEach((u) => {
      console.log(`  - ${u.url}`)
      if (!u.existsInDatabase) {
        console.log(`    不存在于数据库`)
      }
      if (u.httpStatus && u.httpStatus >= 400) {
        console.log(`    HTTP ${u.httpStatus}`)
      }
    })
    if (problemURLs.length > 10) {
      console.log(`  ... 还有 ${problemURLs.length - 10} 个问题 URL`)
    }
  }

  // 导出 CSV
  if (exportCsv) {
    const reportPath = 'sitemap-http-validation-report.csv'
    const csvHeaders = ['URL', 'Sitemap', '类型', 'Slug', '存在于数据库', '已发布', 'HTTP状态', 'HTTP错误', '数据库ID']
    const csvRows = allURLs.map((u) => [
      u.url,
      u.sitemap,
      u.type,
      u.slug || '',
      u.existsInDatabase ? '是' : '否',
      u.published ? '是' : '否',
      u.httpStatus?.toString() || '',
      u.httpError || '',
      u.databaseId?.toString() || '',
    ])

    const csv = [
      csvHeaders.join(','),
      ...csvRows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n')

    writeFileSync(reportPath, csv, 'utf-8')
    console.log(`\n📄 详细报告已导出到: ${reportPath}`)
  }

  console.log('\n✅ 验证完成!')
}

main().catch((error) => {
  console.error('❌ 致命错误:', error)
  process.exit(1)
})
