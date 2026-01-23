/**
 * 检查未编入索引的 URL
 * 
 * 这个脚本会：
 * 1. 查找可能未编入索引的 use_cases 页面
 * 2. 检查这些页面的特征（noindex, canonical, 内容质量等）
 * 3. 生成报告，帮助识别问题
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ 缺少环境变量！')
  console.error('需要: NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

interface UseCaseRow {
  id: string
  slug: string
  title: string
  h1: string | null
  description: string | null
  content: string | null
  noindex: boolean | null
  canonical_url: string | null
  is_published: boolean
  quality_status: string | null
  use_case_type: string | null
  industry: string | null
  in_sitemap: boolean | null
  created_at: string
  updated_at: string
}

// 计算内容长度（英文单词数）
function countWords(text: string | null): number {
  if (!text) return 0
  return text.trim().split(/\s+/).filter(word => word.length > 0).length
}

// 检查是否有 FAQ
function hasFAQ(content: string | null): boolean {
  if (!content) return false
  const faqPatterns = [
    /##\s*FAQ/i,
    /##\s*Frequently Asked Questions/i,
    /###\s*Q:/i,
    /###\s*Question:/i,
    /<h2[^>]*>.*FAQ/i,
  ]
  return faqPatterns.some(pattern => pattern.test(content))
}

// 检查是否有步骤结构
function hasSteps(content: string | null): boolean {
  if (!content) return false
  const stepPatterns = [
    /##\s*Steps/i,
    /##\s*How to/i,
    /###\s*Step \d+/i,
    /1\.\s+[A-Z]/i, // 编号列表
    /<ol/i, // HTML 有序列表
  ]
  return stepPatterns.some(pattern => pattern.test(content))
}

async function checkUnindexedUrls() {
  console.log('🔍 检查未编入索引的 URL...\n')
  console.log('='.repeat(80))

  try {
    // 1. 统计总数
    const { count: totalCount } = await supabase
      .from('use_cases')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true)

    console.log(`\n📊 总已发布页面: ${totalCount?.toLocaleString() || 0}`)

    // 2. 检查设置了 noindex 的页面
    const { data: noindexPages, error: noindexError } = await supabase
      .from('use_cases')
      .select('id, slug, title, noindex, canonical_url, in_sitemap')
      .eq('is_published', true)
      .eq('noindex', true)
      .limit(100)

    if (noindexError) {
      console.error('❌ 查询 noindex 页面失败:', noindexError)
    } else {
      console.log(`\n📊 设置了 noindex=true 的页面: ${noindexPages?.length || 0}`)
      if (noindexPages && noindexPages.length > 0) {
        console.log('\n前 10 个 noindex 页面:')
        noindexPages.slice(0, 10).forEach((page, i) => {
          console.log(`  ${i + 1}. /use-cases/${page.slug}`)
          console.log(`     标题: ${page.title}`)
          console.log(`     canonical: ${page.canonical_url || '无'}`)
          console.log(`     in_sitemap: ${page.in_sitemap ? '是' : '否'}`)
        })
      }
    }

    // 3. 检查设置了 canonical_url 的页面（可能被合并）
    const { data: canonicalPages, error: canonicalError } = await supabase
      .from('use_cases')
      .select('id, slug, title, canonical_url, noindex')
      .eq('is_published', true)
      .not('canonical_url', 'is', null)
      .limit(100)

    if (canonicalError) {
      console.error('❌ 查询 canonical 页面失败:', canonicalError)
    } else {
      console.log(`\n📊 设置了 canonical_url 的页面: ${canonicalPages?.length || 0}`)
      if (canonicalPages && canonicalPages.length > 0) {
        console.log('\n前 10 个 canonical 页面:')
        canonicalPages.slice(0, 10).forEach((page, i) => {
          const currentUrl = `/use-cases/${page.slug}`
          const canonical = page.canonical_url?.startsWith('http')
            ? page.canonical_url
            : page.canonical_url?.startsWith('/')
              ? page.canonical_url
              : `/use-cases/${page.canonical_url}`
          console.log(`  ${i + 1}. ${currentUrl}`)
          console.log(`     → canonical: ${canonical}`)
          console.log(`     noindex: ${page.noindex ? '是' : '否'}`)
        })
      }
    }

    // 4. 随机抽查 10 个已发布但可能未编入索引的页面
    console.log('\n📊 随机抽查 10 个已发布页面（检查内容质量）...\n')

    const { data: samplePages, error: sampleError } = await supabase
      .from('use_cases')
      .select('id, slug, title, h1, description, content, noindex, canonical_url, use_case_type, industry, in_sitemap')
      .eq('is_published', true)
      .order('updated_at', { ascending: false })
      .limit(100) // 先取 100 个，然后随机选 10 个

    if (sampleError) {
      console.error('❌ 查询样本页面失败:', sampleError)
      return
    }

    if (!samplePages || samplePages.length === 0) {
      console.log('⚠️  没有找到已发布的页面')
      return
    }

    // 随机选择 10 个
    const shuffled = [...samplePages].sort(() => 0.5 - Math.random())
    const selected = shuffled.slice(0, 10)

    console.log('='.repeat(80))
    console.log('📋 抽查结果（10 个页面）\n')

    selected.forEach((page, index) => {
      const url = `https://sora2aivideos.com/use-cases/${page.slug}`
      const wordCount = countWords(page.content)
      const hasFAQContent = hasFAQ(page.content)
      const hasStepsContent = hasSteps(page.content)
      const hasH1 = !!page.h1 && page.h1.trim().length > 0
      const hasDescription = !!page.description && page.description.trim().length > 0

      console.log(`${index + 1}. ${url}`)
      console.log(`   标题: ${page.title}`)
      console.log(`   H1: ${hasH1 ? `✅ ${page.h1}` : '❌ 缺失'}`)
      console.log(`   描述: ${hasDescription ? `✅ ${page.description?.substring(0, 60)}...` : '❌ 缺失'}`)
      console.log(`   内容长度: ${wordCount} 词 ${wordCount < 300 ? '⚠️  可能太短' : wordCount < 800 ? '⚠️  偏短' : '✅'}`)
      console.log(`   FAQ: ${hasFAQContent ? '✅' : '❌'}`)
      console.log(`   Steps: ${hasStepsContent ? '✅' : '❌'}`)
      console.log(`   noindex: ${page.noindex ? '⚠️  是（阻止索引）' : '✅ 否'}`)
      console.log(`   canonical: ${page.canonical_url ? `⚠️  ${page.canonical_url}` : '✅ 无（指向自己）'}`)
      console.log(`   in_sitemap: ${page.in_sitemap ? '✅' : '❌ 不在 sitemap'}`)
      console.log(`   类型: ${page.use_case_type || '未知'}`)
      console.log(`   行业: ${page.industry || '未知'}`)
      console.log('')
    })

    // 5. 统计可能的问题
    console.log('='.repeat(80))
    console.log('📊 问题统计\n')

    const allPublished = await supabase
      .from('use_cases')
      .select('id, slug, content, h1, description, noindex, canonical_url, in_sitemap')
      .eq('is_published', true)
      .limit(1000) // 采样 1000 个

    if (allPublished.data) {
      const pages = allPublished.data as UseCaseRow[]
      
      const thinContent = pages.filter(p => countWords(p.content) < 300).length
      const noH1 = pages.filter(p => !p.h1 || p.h1.trim().length === 0).length
      const noDescription = pages.filter(p => !p.description || p.description.trim().length === 0).length
      const hasNoindex = pages.filter(p => p.noindex === true).length
      const hasCanonical = pages.filter(p => p.canonical_url && p.canonical_url.trim().length > 0).length
      const notInSitemap = pages.filter(p => p.in_sitemap === false).length

      console.log(`采样 ${pages.length} 个页面:`)
      console.log(`  ⚠️  内容太短（<300词）: ${thinContent} (${((thinContent / pages.length) * 100).toFixed(1)}%)`)
      console.log(`  ⚠️  缺少 H1: ${noH1} (${((noH1 / pages.length) * 100).toFixed(1)}%)`)
      console.log(`  ⚠️  缺少描述: ${noDescription} (${((noDescription / pages.length) * 100).toFixed(1)}%)`)
      console.log(`  ⚠️  设置了 noindex: ${hasNoindex} (${((hasNoindex / pages.length) * 100).toFixed(1)}%)`)
      console.log(`  ⚠️  设置了 canonical: ${hasCanonical} (${((hasCanonical / pages.length) * 100).toFixed(1)}%)`)
      console.log(`  ⚠️  不在 sitemap: ${notInSitemap} (${((notInSitemap / pages.length) * 100).toFixed(1)}%)`)
    }

    // 6. 检查 robots.txt
    console.log('\n' + '='.repeat(80))
    console.log('🤖 Robots.txt 检查\n')
    console.log('请手动检查: https://sora2aivideos.com/robots.txt')
    console.log('预期应该允许 /use-cases/ 路径')

    console.log('\n✅ 检查完成！')
    console.log('\n💡 建议:')
    console.log('  1. 如果发现大量内容太短的页面，考虑合并或删除')
    console.log('  2. 如果发现大量 noindex 页面，检查是否需要索引')
    console.log('  3. 如果发现大量 canonical 页面，确认合并策略是否正确')
    console.log('  4. 在 GSC 中查看具体的未编入索引原因')

  } catch (error) {
    console.error('❌ 检查失败:', error)
    process.exit(1)
  }
}

checkUnindexedUrls()
  .then(() => {
    console.log('\n')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ 执行失败:', error)
    process.exit(1)
  })
