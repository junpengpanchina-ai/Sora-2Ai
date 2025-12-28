/**
 * 分析现有内容的 GEO 命中率
 * 
 * 使用方法：
 * node scripts/analyze-geo-hit-rate.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少 Supabase 环境变量')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// 简化的结构检查（与 TypeScript 版本逻辑一致）
function checkGEOStructure(useCase) {
  const desc = (useCase.description || '').toLowerCase()
  const content = (useCase.content || '').toLowerCase()
  const combined = `${desc} ${content}`
  
  const hasAnswerFirst = 
    combined.includes('commonly used') ||
    combined.includes('typically used') ||
    (desc.length >= 150 && desc.length <= 300)
  
  const hasNounPhraseList = 
    combined.includes('include:') ||
    combined.includes('applications include') ||
    /^[-•]\s+\w+/m.test(content)
  
  const hasSteps = 
    combined.includes('step 1') ||
    combined.includes('how to') ||
    /^\d+\.\s+\w+/m.test(content)
  
  const faqCount = (content.match(/faq|frequently asked|question:/gi) || []).length
  const hasFAQ = faqCount >= 3 || combined.includes('frequently asked questions')
  
  const hasIndustry = !!useCase.industry
  const hasScene = !!useCase.use_case_type
  const hasPlatform = 
    combined.includes('instagram') ||
    combined.includes('tiktok') ||
    combined.includes('youtube')
  
  const hasIndustryScenePlatform = [hasIndustry, hasScene, hasPlatform].filter(Boolean).length >= 2
  
  let score = 0
  if (hasAnswerFirst) score += 20
  if (hasNounPhraseList) score += 20
  if (hasSteps) score += 20
  if (hasFAQ) score += 20
  if (hasIndustryScenePlatform) score += 20
  
  return { score, hasAnswerFirst, hasNounPhraseList, hasSteps, hasFAQ, hasIndustryScenePlatform }
}

// GEO 行业分类（简化版）
const GEO_A = [
  'Healthcare Clinics', 'Dental Clinics', 'Medical Services', 'Hospitals',
  'Industrial Manufacturing', 'Engineering Services', 'Construction',
  'Architecture Firms', 'Legal Services', 'Financial Compliance',
  'Corporate Training', 'HR & Recruitment', 'Enterprise SaaS',
]
const GEO_B = [
  'Real Estate Marketing', 'Real Estate', 'E-commerce Stores',
  'SaaS Companies', 'SaaS Product Marketing', 'Online Courses',
  'Travel Agencies', 'Restaurant Brands', 'Fitness Trainers',
]
const GEO_C = [
  'Personal Branding', 'Social Media Marketing', 'Digital Marketing Agencies',
  'TikTok Creators', 'YouTube Creators', 'Instagram Creators',
]

function getGEOClass(industry) {
  if (!industry) return 'none'
  if (GEO_A.includes(industry)) return 'A'
  if (GEO_B.includes(industry)) return 'B'
  if (GEO_C.includes(industry)) return 'C'
  return 'none'
}

function getGEOLevel(structureScore, geoClass) {
  if (structureScore >= 80 && geoClass === 'A') return 'G-A'
  if (structureScore >= 80 && geoClass === 'B') return 'G-B'
  if (structureScore >= 60 && (geoClass === 'A' || geoClass === 'B')) return 'G-B'
  if (structureScore >= 60 && geoClass === 'C') return 'G-C'
  return 'G-None'
}

async function analyzeGEOHitRate() {
  console.log('📊 开始分析 GEO 命中率...\n')
  
  // 获取前 1000 条已发布的内容
  const { data: useCases, error } = await supabase
    .from('use_cases')
    .select('id, title, industry, use_case_type, description, content')
    .eq('is_published', true)
    .eq('quality_status', 'approved')
    .limit(1000)
  
  if (error) {
    console.error('❌ 获取数据失败:', error)
    return
  }
  
  console.log(`✅ 获取到 ${useCases.length} 条内容\n`)
  
  // 分析统计
  const stats = {
    total: useCases.length,
    gA: 0,
    gB: 0,
    gC: 0,
    gNone: 0,
    structureScores: { '100': 0, '80-99': 0, '60-79': 0, '0-59': 0 },
    geoClasses: { A: 0, B: 0, C: 0, none: 0 },
  }
  
  const results = useCases.map(useCase => {
    const structure = checkGEOStructure(useCase)
    const geoClass = getGEOClass(useCase.industry)
    const geoLevel = getGEOLevel(structure.score, geoClass)
    
    // 统计
    if (geoLevel === 'G-A') stats.gA++
    else if (geoLevel === 'G-B') stats.gB++
    else if (geoLevel === 'G-C') stats.gC++
    else stats.gNone++
    
    if (structure.score === 100) stats.structureScores['100']++
    else if (structure.score >= 80) stats.structureScores['80-99']++
    else if (structure.score >= 60) stats.structureScores['60-79']++
    else stats.structureScores['0-59']++
    
    stats.geoClasses[geoClass]++
    
    return {
      id: useCase.id,
      title: useCase.title,
      industry: useCase.industry,
      structureScore: structure.score,
      geoClass,
      geoLevel,
    }
  })
  
  // 输出统计
  console.log('📊 GEO 等级分布:')
  console.log(`  G-A (高概率被引用): ${stats.gA} (${(stats.gA/stats.total*100).toFixed(1)}%)`)
  console.log(`  G-B (有机会): ${stats.gB} (${(stats.gB/stats.total*100).toFixed(1)}%)`)
  console.log(`  G-C (只做 SEO): ${stats.gC} (${(stats.gC/stats.total*100).toFixed(1)}%)`)
  console.log(`  G-None (不符合): ${stats.gNone} (${(stats.gNone/stats.total*100).toFixed(1)}%)`)
  console.log()
  
  console.log('📊 结构得分分布:')
  console.log(`  100分: ${stats.structureScores['100']} (${(stats.structureScores['100']/stats.total*100).toFixed(1)}%)`)
  console.log(`  80-99分: ${stats.structureScores['80-99']} (${(stats.structureScores['80-99']/stats.total*100).toFixed(1)}%)`)
  console.log(`  60-79分: ${stats.structureScores['60-79']} (${(stats.structureScores['60-79']/stats.total*100).toFixed(1)}%)`)
  console.log(`  0-59分: ${stats.structureScores['0-59']} (${(stats.structureScores['0-59']/stats.total*100).toFixed(1)}%)`)
  console.log()
  
  console.log('📊 行业分类分布:')
  console.log(`  A类 (AI最缺): ${stats.geoClasses.A} (${(stats.geoClasses.A/stats.total*100).toFixed(1)}%)`)
  console.log(`  B类 (有竞争): ${stats.geoClasses.B} (${(stats.geoClasses.B/stats.total*100).toFixed(1)}%)`)
  console.log(`  C类 (SEO为主): ${stats.geoClasses.C} (${(stats.geoClasses.C/stats.total*100).toFixed(1)}%)`)
  console.log(`  未分类: ${stats.geoClasses.none} (${(stats.geoClasses.none/stats.total*100).toFixed(1)}%)`)
  console.log()
  
  // 输出 Top 10 G-A 内容
  const topGA = results
    .filter(r => r.geoLevel === 'G-A')
    .sort((a, b) => b.structureScore - a.structureScore)
    .slice(0, 10)
  
  console.log('🏆 Top 10 G-A 内容（最可能被 AI 引用）:')
  topGA.forEach((r, i) => {
    console.log(`  ${i+1}. [${r.geoClass}] ${r.title}`)
    console.log(`     行业: ${r.industry || 'N/A'}, 结构得分: ${r.structureScore}`)
  })
  console.log()
  
  // 输出需要改进的内容（G-None 但结构得分高）
  const needImprovement = results
    .filter(r => r.geoLevel === 'G-None' && r.structureScore >= 60)
    .slice(0, 10)
  
  if (needImprovement.length > 0) {
    console.log('⚠️  需要改进的内容（结构好但行业分类低）:')
    needImprovement.forEach((r, i) => {
      console.log(`  ${i+1}. [${r.geoClass}] ${r.title}`)
      console.log(`     行业: ${r.industry || 'N/A'}, 结构得分: ${r.structureScore}`)
    })
  }
  
  console.log('\n✅ 分析完成！')
}

analyzeGEOHitRate().catch(console.error)

