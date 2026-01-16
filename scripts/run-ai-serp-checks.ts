#!/usr/bin/env tsx

/**
 * AI SERP 监控脚本
 * 
 * 抽样检查 Tier1 页面在 Google 搜索结果中的表现
 * 包括：AI Overview、Citation、Position
 * 
 * 使用方法：
 * npm run monitor:ai-serp
 * 或
 * tsx scripts/run-ai-serp-checks.ts
 * 
 * 需要环境变量：
 * - SERPAPI_KEY: SerpAPI 的 API Key（可选，如果没有则跳过）
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const serpApiKey = process.env.SERPAPI_KEY
const baseDomain = process.env.NEXT_PUBLIC_BASE_URL?.replace(/^https?:\/\//, '') || 'sora2aivideos.com'

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 错误: 缺少 Supabase 环境变量')
  process.exit(1)
}

if (!serpApiKey) {
  console.warn('⚠️  警告: 未设置 SERPAPI_KEY，将跳过 SERP 检查')
  console.log('💡 提示: 设置 SERPAPI_KEY 环境变量以启用监控')
  process.exit(0)
}

const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * 构建查询词
 */
function buildQuery(p: {
  industry: string | null
  use_case_type: string | null
  title?: string | null
}): string {
  const parts: string[] = []
  
  if (p.industry) parts.push(p.industry)
  if (p.use_case_type) {
    // 简化 use_case_type 名称
    const typeMap: Record<string, string> = {
      'social-media-content': 'social media',
      'product-demo-showcase': 'product demo',
      'brand-storytelling': 'brand storytelling',
      'education-explainer': 'education',
      'advertising-promotion': 'advertising',
      'ugc-creator-content': 'UGC content',
    }
    parts.push(typeMap[p.use_case_type] || p.use_case_type)
  }
  parts.push('AI video')
  
  return parts.filter(Boolean).join(' ')
}

/**
 * 调用 SerpAPI
 */
async function serpapi(q: string): Promise<any> {
  const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(q)}&hl=en&gl=us&api_key=${serpApiKey}`
  const r = await fetch(url)
  if (!r.ok) {
    throw new Error(`SerpAPI error: ${r.status} ${r.statusText}`)
  }
  return r.json()
}

/**
 * 检测是否被引用（域名出现在结果中）
 */
function detectCited(json: any): boolean {
  const raw = JSON.stringify(json).toLowerCase()
  return raw.includes(baseDomain.toLowerCase())
}

/**
 * 检测是否有 AI Overview
 */
function detectAiOverview(json: any): boolean {
  return Boolean((json as any).ai_overview || (json as any).overview || (json as any).answer_box)
}

/**
 * 查找页面在搜索结果中的位置
 */
function findPosition(json: any): number | null {
  const organic = (json as any).organic_results || []
  for (let i = 0; i < organic.length; i++) {
    const link = (organic[i]?.link ?? '') as string
    if (link.includes(baseDomain)) {
      return i + 1
    }
  }
  return null
}

async function main() {
  console.log('🚀 开始 AI SERP 监控...\n')

  // 1) 获取 Tier1 Top 2000 页面
  console.log('📊 Step 1: 加载 Tier1 页面...')
  
  const { data: pages, error } = await supabase
    .from('use_cases')
    .select(`
      id,
      slug,
      title,
      industry,
      use_case_type,
      page_scores!inner(tier, ai_citation_score)
    `)
    .eq('is_published', true)
    .eq('page_scores.tier', 1)
    .not('industry', 'is', null)
    .order('ai_citation_score', { ascending: false, foreignTable: 'page_scores' })
    .limit(2000)

  if (error) {
    console.error('❌ 查询错误:', error)
    throw error
  }

  if (!pages || pages.length === 0) {
    console.error('❌ 没有找到 Tier1 页面')
    process.exit(1)
  }

  console.log(`✅ 找到 ${pages.length} 个 Tier1 页面\n`)

  // 2) 抽样 200 页（按 industry 分层）
  console.log('📊 Step 2: 抽样 200 页...')
  
  const sampleSize = 200
  const sample = pages.slice(0, sampleSize) // 简单抽样（Top 200）

  console.log(`✅ 抽样 ${sample.length} 页\n`)

  // 3) 对每页进行 SERP 检查
  console.log('📊 Step 3: 执行 SERP 检查...')
  
  let successCount = 0
  let errorCount = 0

  for (let i = 0; i < sample.length; i++) {
    const p = sample[i]
    const q = buildQuery(p)

    try {
      // 调用 SerpAPI（有速率限制，可能需要延迟）
      const json = await serpapi(q)

      const cited = detectCited(json)
      const hasAiOverview = detectAiOverview(json)
      const position = findPosition(json)

      const row = {
        page_id: p.id,
        url: `https://${baseDomain}/use-cases/${p.slug}`,
        query: q,
        engine: 'google',
        has_ai_overview: hasAiOverview,
        cited,
        position,
        raw: json,
        checked_at: new Date().toISOString(),
      }

      const { error: insError } = await supabase.from('ai_serp_checks').insert(row)

      if (insError) {
        console.warn(`⚠️  页面 ${p.slug} 插入失败:`, insError.message)
        errorCount++
      } else {
        successCount++
        console.log(
          `   [${i + 1}/${sample.length}] ${q.substring(0, 50)}... | 引用: ${cited ? '✅' : '❌'} | 位置: ${position || 'N/A'}`
        )
      }

      // 延迟避免速率限制（SerpAPI 免费版：100 次/月）
      if (i < sample.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000)) // 1 秒延迟
      }
    } catch (error: any) {
      console.error(`❌ 页面 ${p.slug} 检查失败:`, error.message)
      errorCount++
      
      // 如果是速率限制，停止检查
      if (error.message?.includes('429') || error.message?.includes('rate limit')) {
        console.error('⚠️  达到速率限制，停止检查')
        break
      }
    }
  }

  console.log(`\n✅ 完成！`)
  console.log(`   成功: ${successCount} 页`)
  if (errorCount > 0) {
    console.log(`   失败: ${errorCount} 页`)
  }
  console.log(`\n💡 提示: SerpAPI 免费版每月 100 次查询，建议每周运行一次`)
}

main().catch((error) => {
  console.error('❌ 脚本执行失败:', error)
  process.exit(1)
})
