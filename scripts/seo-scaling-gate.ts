/**
 * SEO Scaling Gate - CI/Deploy 阻断器
 * 
 * 用途：
 * - 批量生成任务前
 * - sitemap 更新前
 * - Tier2 扩容脚本前
 * - Production deploy（SEO 相关）
 * 
 * 规则：
 * If SEO scaling gate fails, deployment is blocked.
 * No manual override.
 * 
 * 运行方式：
 * npx ts-node scripts/seo-scaling-gate.ts
 * 
 * CI 集成：
 * - GitHub Actions: 在 deploy job 前添加此 step
 * - Vercel: 在 build command 前运行
 */

import { createClient } from '@supabase/supabase-js'

const DOMAIN = 'https://sora2aivideos.com'

interface ScalingDecision {
  decision: 'SAFE_TO_SCALE' | 'CAUTIOUS' | 'HOLD' | 'BLOCKED'
  reason: string
  avg_index_rate_7d: number | null
  min_index_rate_7d: number | null
  zero_delta_days_7d: number | null
  max_duplicate_rate_pct: number | null
}

interface SitemapCheck {
  tier1_url_count: number
  index_points_to_tier1_0: boolean
}

async function checkSitemapHealth(): Promise<SitemapCheck> {
  console.log('🔍 Checking sitemap health...')
  
  // Check sitemap index
  const indexResponse = await fetch(`${DOMAIN}/sitemap.xml`)
  const indexXml = await indexResponse.text()
  const indexPointsToTier1_0 = indexXml.includes('tier1-0.xml')
  
  // Check tier1-0 URL count
  const tier1Response = await fetch(`${DOMAIN}/sitemaps/tier1-0.xml`)
  const tier1Xml = await tier1Response.text()
  const urlMatches = tier1Xml.match(/<url>/g)
  const tier1UrlCount = urlMatches ? urlMatches.length : 0
  
  return {
    tier1_url_count: tier1UrlCount,
    index_points_to_tier1_0: indexPointsToTier1_0,
  }
}

async function getScalingDecision(): Promise<ScalingDecision | null> {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('⚠️ Supabase credentials not found, using sitemap-only check')
    return null
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  const { data, error } = await supabase
    .from('v_seo_scaling_decision')
    .select('*')
    .single()
  
  if (error) {
    console.error('Error fetching scaling decision:', error.message)
    return null
  }
  
  return data as ScalingDecision
}

async function runGate(): Promise<void> {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🚦 SEO Scaling Gate')
  console.log(`   Time: ${new Date().toISOString()}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('')
  
  // Step 1: Check sitemap health (always runs)
  const sitemapCheck = await checkSitemapHealth()
  
  console.log('📋 Sitemap Health:')
  console.log(`   tier1-0.xml URL count: ${sitemapCheck.tier1_url_count}`)
  console.log(`   Index points to tier1-0: ${sitemapCheck.index_points_to_tier1_0 ? '✅' : '❌'}`)
  console.log('')
  
  // FATAL: Sitemap issues
  if (!sitemapCheck.index_points_to_tier1_0) {
    console.error('🚨 FATAL: sitemap.xml does not point to tier1-0.xml')
    console.error('   This is the 2026-01-24 bug pattern!')
    console.error('')
    console.error('❌ SEO SCALING BLOCKED')
    process.exit(1)
  }
  
  if (sitemapCheck.tier1_url_count === 0) {
    console.error('🚨 FATAL: tier1-0.xml is empty (0 URLs)')
    console.error('')
    console.error('❌ SEO SCALING BLOCKED')
    process.exit(1)
  }
  
  // Step 2: Check database metrics (if available)
  const decision = await getScalingDecision()
  
  if (decision) {
    console.log('📊 Database Metrics:')
    console.log(`   Decision: ${decision.decision}`)
    console.log(`   Reason: ${decision.reason}`)
    console.log(`   Avg Index Rate (7d): ${decision.avg_index_rate_7d ?? 'N/A'}%`)
    console.log(`   Min Index Rate (7d): ${decision.min_index_rate_7d ?? 'N/A'}%`)
    console.log(`   Zero Delta Days (7d): ${decision.zero_delta_days_7d ?? 'N/A'}`)
    console.log(`   Max Duplicate Rate: ${decision.max_duplicate_rate_pct ?? 'N/A'}%`)
    console.log('')
    
    if (decision.decision === 'BLOCKED') {
      console.error('🚨 FATAL: Scaling blocked by Index Health metrics')
      console.error(`   Reason: ${decision.reason}`)
      console.error('')
      console.error('❌ SEO SCALING BLOCKED')
      process.exit(1)
    }
    
    if (decision.decision === 'HOLD') {
      console.warn('⚠️ WARNING: Scaling on hold')
      console.warn(`   Reason: ${decision.reason}`)
      console.warn('')
      console.warn('⚠️ SEO SCALING ON HOLD - Proceed with caution')
      // Don't exit, but warn
    }
  }
  
  // All checks passed
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('✅ SEO SCALING GATE PASSED')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

// Export for programmatic use
export { runGate, checkSitemapHealth, getScalingDecision }

// Run if called directly
runGate().catch((error) => {
  console.error('Gate check failed:', error)
  process.exit(1)
})
