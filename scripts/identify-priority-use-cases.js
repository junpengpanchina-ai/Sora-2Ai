/**
 * 识别优先更新的 Use Case（高价值行业 × 高流量关键词）
 * 
 * 使用方法：
 * node scripts/identify-priority-use-cases.js [--limit=10000] [--output=priority-list.json]
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// 高价值行业列表（S级和A+级）
// 注意：这些行业名称需要与数据库中的实际值匹配
const HIGH_VALUE_INDUSTRIES = [
  // S级（必须优先，40分）
  'Social Media Marketing',
  'TikTok Creators',
  'Instagram Creators',
  'YouTube Creators',
  'Digital Marketing Agencies',
  'E-commerce Stores',
  'E-commerce Brands', // 别名
  'Dropshipping Businesses',
  'SaaS Companies',
  'Product Marketing',
  'Personal Branding',
  'Personal IP Building', // 别名
  
  // A+级（第二梯队，30分）
  'Online Courses',
  'Coaches & Consultants',
  'Real Estate Marketing',
  'Fitness Trainers',
  'Beauty & Skincare Brands',
  'Fashion Brands',
  'Restaurants & Cafes',
  'Travel Agencies',
  'Hotels & Resorts',
  'Event Promotion',
]

// 高流量场景类型（优先）
const HIGH_TRAFFIC_USE_CASE_TYPES = [
  'advertising-promotion',      // 广告转化
  'social-media-content',       // 短视频内容
  'product-demo-showcase',      // 产品演示
]

// 评分标准
function calculatePriorityScore(useCase) {
  let score = 0
  
  // 行业价值（40分）
  if (HIGH_VALUE_INDUSTRIES.includes(useCase.industry)) {
    const industryIndex = HIGH_VALUE_INDUSTRIES.indexOf(useCase.industry)
    if (industryIndex < 10) {
      score += 40 // S级行业
    } else {
      score += 30 // A+级行业
    }
  } else if (useCase.industry) {
    score += 10 // 其他行业
  }
  
  // 场景类型（30分）
  if (HIGH_TRAFFIC_USE_CASE_TYPES.includes(useCase.use_case_type)) {
    score += 30
  } else {
    score += 15
  }
  
  // 已发布状态（20分）
  if (useCase.is_published) {
    score += 20
  }
  
  // 质量状态（10分）
  if (useCase.quality_status === 'approved') {
    score += 10
  } else if (useCase.quality_status === 'pending') {
    score += 5
  }
  
  // SEO关键词数量（加分项）
  if (Array.isArray(useCase.seo_keywords) && useCase.seo_keywords.length > 0) {
    score += Math.min(useCase.seo_keywords.length, 10) // 最多加10分
  }
  
  return score
}

async function identifyPriorityUseCases(limit = 10000) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ 缺少 Supabase 环境变量')
    console.error('需要：NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  console.log('🔍 开始识别优先更新的 Use Case...\n')
  
  // 获取所有已发布的 Use Case
  const { data: useCases, error } = await supabase
    .from('use_cases')
    .select('id, slug, title, industry, use_case_type, is_published, quality_status, seo_keywords, created_at')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('❌ 查询失败:', error.message)
    process.exit(1)
  }
  
  if (!useCases || useCases.length === 0) {
    console.log('⚠️  没有找到已发布的 Use Case')
    return []
  }
  
  console.log(`📊 找到 ${useCases.length} 条已发布的 Use Case`)
  
  // 计算优先级分数
  const scoredUseCases = useCases.map(uc => ({
    ...uc,
    priority_score: calculatePriorityScore(uc),
  }))
  
  // 按分数排序
  scoredUseCases.sort((a, b) => b.priority_score - a.priority_score)
  
  // 取前 N 条
  const priorityUseCases = scoredUseCases.slice(0, limit)
  
  // 统计信息
  const industryStats = {}
  const typeStats = {}
  
  priorityUseCases.forEach(uc => {
    industryStats[uc.industry || 'Unknown'] = (industryStats[uc.industry || 'Unknown'] || 0) + 1
    typeStats[uc.use_case_type] = (typeStats[uc.use_case_type] || 0) + 1
  })
  
  console.log(`\n✅ 识别出 ${priorityUseCases.length} 条优先更新的 Use Case\n`)
  console.log('📊 行业分布：')
  Object.entries(industryStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([industry, count]) => {
      console.log(`   ${industry}: ${count} 条`)
    })
  
  console.log('\n📊 场景类型分布：')
  Object.entries(typeStats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      console.log(`   ${type}: ${count} 条`)
    })
  
  console.log(`\n📈 优先级分数范围：`)
  console.log(`   最高：${priorityUseCases[0]?.priority_score || 0}`)
  console.log(`   最低：${priorityUseCases[priorityUseCases.length - 1]?.priority_score || 0}`)
  console.log(`   平均：${Math.round(priorityUseCases.reduce((sum, uc) => sum + uc.priority_score, 0) / priorityUseCases.length)}`)
  
  return priorityUseCases
}

// 主函数
async function main() {
  const args = process.argv.slice(2)
  const limitArg = args.find(arg => arg.startsWith('--limit='))
  const outputArg = args.find(arg => arg.startsWith('--output='))
  
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 10000
  const outputFile = outputArg ? outputArg.split('=')[1] : 'priority-use-cases.json'
  
  console.log('🚀 识别优先更新的 Use Case')
  console.log(`   限制：${limit} 条`)
  console.log(`   输出：${outputFile}\n`)
  
  const priorityUseCases = await identifyPriorityUseCases(limit)
  
  if (priorityUseCases.length === 0) {
    console.log('⚠️  没有找到符合条件的 Use Case')
    return
  }
  
  // 保存到文件
  const fs = require('fs')
  fs.writeFileSync(
    outputFile,
    JSON.stringify(priorityUseCases, null, 2)
  )
  
  console.log(`\n✅ 已保存到 ${outputFile}`)
  console.log(`\n📋 前10条优先更新的 Use Case：`)
  priorityUseCases.slice(0, 10).forEach((uc, index) => {
    console.log(`   ${index + 1}. [${uc.priority_score}分] ${uc.title} (${uc.industry || 'Unknown'}) - ${uc.use_case_type}`)
  })
  
  console.log(`\n💡 下一步：使用这些 ID 批量更新内容`)
  console.log(`   示例：node scripts/batch-update-geo-content.js --ids=${priorityUseCases.slice(0, 100).map(uc => uc.id).join(',')}`)
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = { identifyPriorityUseCases, calculatePriorityScore }

