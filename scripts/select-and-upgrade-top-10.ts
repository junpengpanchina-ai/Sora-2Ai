/**
 * 选择 Top 10 页面并准备升级
 * 
 * 功能：
 * 1. 从数据库中选择最该升级的 10 个页面
 * 2. 输出页面列表和升级建议
 * 3. 生成 Bridge + Conversion 模块插入指南
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { config } from 'dotenv'
import { resolve } from 'path'
import { calculateUpgradePriority } from '@/lib/upgrade-priority-calculator'

config({ path: resolve(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ 缺少环境变量！')
  console.error('请确保 .env.local 中有：')
  console.error('  - NEXT_PUBLIC_SUPABASE_URL')
  console.error('  - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY)

interface PageCandidate {
  page_id: string
  page_slug: string
  title?: string
  use_case_type?: string
  industry?: string
  ai_prime_score: number
  ai_signal_score: number
  purchase_intent: number
  geo_score: number
  geo_level: string
  index_state: string
  layer: string
  priority: number
}

async function selectTop10Pages() {
  console.log('🔍 正在选择 Top 10 升级页面...\n')

  // 查询符合条件的页面
  const { data: pageMetaList, error: metaError } = await supabase
    .from('page_meta')
    .select(`
      page_id,
      page_slug,
      ai_prime_score,
      ai_signal_score,
      purchase_intent,
      geo_score,
      geo_level,
      index_state,
      layer
    `)
    .eq('status', 'published')
    .eq('page_type', 'use_case')
    .eq('geo_level', 'G-A')
    .gte('ai_prime_score', 4) // AI-Prime Pool
    .order('geo_score', { ascending: false })
    .limit(100) // 先取 100 个，然后计算优先级排序

  if (metaError) {
    console.error('❌ 查询 page_meta 失败:', metaError)
    return
  }

  if (!pageMetaList || pageMetaList.length === 0) {
    console.log('⚠️  没有找到符合条件的页面')
    console.log('提示：')
    console.log('1. 先执行 database/migrations/add_ai_prime_fields.sql 添加字段')
    console.log('2. 然后执行 database/migrations/identify_ai_prime_pool.sql 填充 ai_prime_score')
    console.log('3. 或者使用简化版本（不依赖 ai_prime_score）')
    return
  }

  // 获取 use_cases 信息
  const pageIds = (pageMetaList as any[]).map((p: any) => p.page_id)
  const { data: useCases, error: useCasesError } = await (supabase
    .from('use_cases') as any)
    .select('id, title, use_case_type, industry')
    .in('id', pageIds)

  if (useCasesError) {
    console.error('❌ 查询 use_cases 失败:', useCasesError)
    return
  }

  // 创建映射
  const useCaseMap = new Map(
    ((useCases || []) as any[]).map((uc: any) => [uc.id, uc])
  )

  // 计算优先级并排序
  const candidates: PageCandidate[] = (pageMetaList as any[])
    .map((pm: any) => {
      const uc = useCaseMap.get(pm.page_id)
      const indexHealth = pm.index_state === 'indexed' ? 60 : pm.index_state === 'crawled' ? 40 : 0
      
      const priorityResult = calculateUpgradePriority({
        aiPrimeScore: pm.ai_prime_score || 0,
        aiSignalScore: pm.ai_signal_score || 0,
        purchaseIntent: pm.purchase_intent || 0,
        indexHealth,
        indexState: pm.index_state as any
      })

      return {
        page_id: pm.page_id,
        page_slug: pm.page_slug || '',
        title: uc?.title,
        use_case_type: uc?.use_case_type,
        industry: uc?.industry || null,
        ai_prime_score: pm.ai_prime_score || 0,
        ai_signal_score: pm.ai_signal_score || 0,
        purchase_intent: pm.purchase_intent || 0,
        geo_score: pm.geo_score || 0,
        geo_level: pm.geo_level || 'G-None',
        index_state: pm.index_state || 'unknown',
        layer: pm.layer || 'asset',
        priority: priorityResult.priority
      }
    })
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 10)

  // 输出结果
  console.log('✅ 找到 Top 10 升级页面：\n')
  console.log('='.repeat(80))
  
  candidates.forEach((page, index) => {
    console.log(`\n${index + 1}. ${page.title || page.page_slug}`)
    console.log(`   URL: /use-cases/${page.page_slug}`)
    console.log(`   优先级: ${page.priority.toFixed(2)}`)
    console.log(`   AI-Prime Score: ${page.ai_prime_score}/6`)
    console.log(`   AI Signal Score: ${page.ai_signal_score}`)
    console.log(`   Purchase Intent: ${page.purchase_intent}/3`)
    console.log(`   GEO Score: ${page.geo_score}`)
    console.log(`   Index State: ${page.index_state}`)
    console.log(`   Layer: ${page.layer}`)
    if (page.industry) {
      console.log(`   Industry: ${page.industry}`)
    }
    if (page.use_case_type) {
      console.log(`   Use Case Type: ${page.use_case_type}`)
    }
  })

  console.log('\n' + '='.repeat(80))
  console.log('\n📋 下一步行动：')
  console.log('1. 为这 10 个页面添加 Bridge 模块')
  console.log('2. 为其中 5 个页面添加 Conversion Block')
  console.log('3. 观察 7 天，不要改模板')
  console.log('\n📖 模板参考：docs/BRIDGE_TO_CONVERSION_TEMPLATES.md')

  // 生成 JSON 文件供后续使用
  const fs = require('fs')
  const outputPath = 'scripts/top-10-upgrade-pages.json'
  fs.writeFileSync(
    outputPath,
    JSON.stringify(candidates, null, 2)
  )
  console.log(`\n💾 页面列表已保存到: ${outputPath}`)

  return candidates
}

selectTop10Pages()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ 执行失败:', error)
    process.exit(1)
  })

