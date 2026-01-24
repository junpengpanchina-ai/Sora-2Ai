/**
 * Sitemap 健康检查脚本
 * 
 * 用途：
 * - 每日 Cron 自动检测
 * - 部署后验证
 * - CI/CD 阻断条件
 * 
 * 运行方式：
 * - npx ts-node scripts/sitemap_health_check.ts
 * - Vercel Cron: 0 8 * * * (每天早8点)
 */

import { createClient } from '@supabase/supabase-js'

const DOMAIN = 'https://sora2aivideos.com'

// Sitemap 配置
const SITEMAP_CONFIG = {
  index: '/sitemap.xml',
  chunks: [
    { name: 'tier1-0', path: '/sitemaps/tier1-0.xml', tier: 1, minUrls: 100 },
    { name: 'core', path: '/sitemap-core.xml', tier: 0, minUrls: 50 },
  ],
}

interface CheckResult {
  name: string
  path: string
  tier: number
  status: 'OK' | 'WARNING' | 'CRITICAL' | 'ERROR'
  urlCount: number
  message: string
}

async function fetchUrlCount(path: string): Promise<number> {
  try {
    const response = await fetch(`${DOMAIN}${path}`)
    if (!response.ok) {
      console.error(`HTTP ${response.status} for ${path}`)
      return -1
    }
    const xml = await response.text()
    const matches = xml.match(/<url>/g)
    return matches ? matches.length : 0
  } catch (error) {
    console.error(`Error fetching ${path}:`, error)
    return -1
  }
}

async function checkSitemapIndex(): Promise<{ valid: boolean; referencedChunks: string[] }> {
  try {
    const response = await fetch(`${DOMAIN}${SITEMAP_CONFIG.index}`)
    const xml = await response.text()
    
    // 提取所有引用的 sitemap
    const locMatches = xml.match(/<loc>([^<]+)<\/loc>/g) || []
    const referencedChunks = locMatches.map(m => {
      const match = m.match(/<loc>([^<]+)<\/loc>/)
      return match ? match[1] : ''
    }).filter(Boolean)
    
    // 检查是否引用了 tier1-0
    const hasTier1_0 = referencedChunks.some(url => url.includes('tier1-0'))
    
    return {
      valid: hasTier1_0,
      referencedChunks,
    }
  } catch (error) {
    console.error('Error checking sitemap index:', error)
    return { valid: false, referencedChunks: [] }
  }
}

async function runHealthCheck(): Promise<CheckResult[]> {
  const results: CheckResult[] = []
  
  console.log('🔍 Sitemap Health Check')
  console.log(`   Domain: ${DOMAIN}`)
  console.log(`   Time: ${new Date().toISOString()}`)
  console.log('')
  
  // 1. 检查 sitemap index
  console.log('━━━ Checking sitemap index ━━━')
  const indexCheck = await checkSitemapIndex()
  
  if (!indexCheck.valid) {
    results.push({
      name: 'sitemap-index',
      path: SITEMAP_CONFIG.index,
      tier: -1,
      status: 'CRITICAL',
      urlCount: 0,
      message: '🚨 sitemap.xml 未引用 tier1-0.xml！这是 2026-01-24 事故的重演！',
    })
  } else {
    console.log('✅ sitemap.xml 正确引用了 tier1-0.xml')
    console.log(`   引用的 chunks: ${indexCheck.referencedChunks.join(', ')}`)
  }
  console.log('')
  
  // 2. 检查每个 chunk
  console.log('━━━ Checking sitemap chunks ━━━')
  
  for (const chunk of SITEMAP_CONFIG.chunks) {
    const urlCount = await fetchUrlCount(chunk.path)
    
    let status: CheckResult['status'] = 'OK'
    let message = '✅ 正常'
    
    if (urlCount === -1) {
      status = 'ERROR'
      message = '❌ 无法访问'
    } else if (urlCount === 0) {
      if (chunk.tier === 1) {
        status = 'CRITICAL'
        message = '🚨 FATAL: Tier1 chunk 为空，Google 无法发现 URL'
      } else if (chunk.tier === 0) {
        status = 'ERROR'
        message = '❌ Core sitemap 为空，架构异常'
      } else {
        status = 'WARNING'
        message = '⚠️ Chunk 为空（Tier2 可接受但需关注）'
      }
    } else if (urlCount < chunk.minUrls) {
      status = 'WARNING'
      message = `⚠️ URL 数量过少（${urlCount} < ${chunk.minUrls}）`
    }
    
    results.push({
      name: chunk.name,
      path: chunk.path,
      tier: chunk.tier,
      status,
      urlCount,
      message,
    })
    
    const statusIcon = status === 'OK' ? '✅' : status === 'WARNING' ? '⚠️' : '❌'
    console.log(`${statusIcon} ${chunk.name}: ${urlCount} URLs - ${message}`)
  }
  
  return results
}

async function updateDatabase(results: CheckResult[]): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('\n⚠️ Supabase credentials not found, skipping database update')
    return
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  console.log('\n━━━ Updating database ━━━')
  
  for (const result of results) {
    if (result.urlCount >= 0) {
      const { error } = await supabase.rpc('upsert_sitemap_chunk', {
        p_name: result.name,
        p_tier: result.tier,
        p_url_count: result.urlCount,
        p_data_source: 'live_check',
      })
      
      if (error) {
        console.error(`Error updating ${result.name}:`, error.message)
      } else {
        console.log(`✅ Updated ${result.name}: ${result.urlCount} URLs`)
      }
    }
  }
}

async function main(): Promise<void> {
  const results = await runHealthCheck()
  
  // 更新数据库
  await updateDatabase(results)
  
  // 检查是否有 CRITICAL 问题
  const criticalIssues = results.filter(r => r.status === 'CRITICAL')
  
  console.log('\n━━━ Summary ━━━')
  
  if (criticalIssues.length > 0) {
    console.error('\n🚨 CRITICAL ISSUES DETECTED:')
    criticalIssues.forEach(issue => {
      console.error(`   - ${issue.name}: ${issue.message}`)
    })
    console.error('\n❌ Health check FAILED')
    process.exit(1) // 阻断部署
  }
  
  const warnings = results.filter(r => r.status === 'WARNING')
  if (warnings.length > 0) {
    console.log('\n⚠️ Warnings:')
    warnings.forEach(w => {
      console.log(`   - ${w.name}: ${w.message}`)
    })
  }
  
  console.log('\n✅ Health check PASSED')
}

// 导出供 Vercel Cron 使用
export { runHealthCheck, main }

// 直接运行
main().catch(console.error)
