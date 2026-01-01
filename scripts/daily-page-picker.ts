/**
 * 每日页面挑选脚本
 * 
 * 功能：
 * 1. 从数据库读取 Index Health
 * 2. 查询候选页面
 * 3. 运行挑选算法
 * 4. 写入队列
 * 
 * 使用方式：
 * - 每天定时运行（cron job）
 * - 或手动执行：npm run pick-pages
 */

import { pickHighConversionPages, queryCandidatePages, enrichPagesWithIntent, type PageCandidate } from '../lib/page-priority-picker'
import { writeToQueue } from '../lib/page-priority-queue'
import { getCurrentIndexHealth } from '../lib/index-health'

/**
 * 主函数：每日页面挑选流程
 */
export async function dailyPagePicker() {
  console.log('🚀 开始每日页面挑选...')
  
  try {
    // 1. 获取当前 Index Health
    // TODO: 传入实际的数据库客户端
    // const indexHealth = await getCurrentIndexHealth(db)
    const indexHealth = 0.5 // 临时占位符
    if (!indexHealth) {
      console.error('❌ 无法获取 Index Health，请先更新 index_health_daily 表')
      return
    }
    
    console.log(`📊 当前 Index Health: ${(indexHealth * 100).toFixed(2)}%`)
    
    // 2. 查询候选页面
    console.log('🔍 查询候选页面...')
    // TODO: 传入实际的数据库客户端
    // const db = await createDatabaseClient()
    // const candidates = await queryCandidatePages(db)
    const candidates: PageCandidate[] = [] // 临时占位符
    console.log(`📄 找到 ${candidates.length} 个候选页面`)
    
    // 3. 丰富页面数据（计算 Purchase Intent 如果缺失）
    const enriched = enrichPagesWithIntent(candidates)
    console.log(`✨ 丰富页面数据完成`)
    
    // 4. 运行挑选算法
    console.log('🎯 运行挑选算法...')
    const result = pickHighConversionPages(enriched, indexHealth)
    console.log(`✅ 挑选完成：${result.pickedCount} 个页面（上限：${result.dailyCap}）`)
    
    // 5. 写入队列
    console.log('💾 写入队列...')
    // TODO: 传入实际的数据库客户端
    // await writeToQueue(db, result)
    console.log(`⚠️  队列写入已跳过（需要数据库客户端）`)
    console.log(`   Run ID: ${result.runId}`)
    
    // 6. 输出统计
    console.log('\n📊 挑选统计：')
    console.log(`  - 候选页面：${candidates.length}`)
    console.log(`  - 挑选页面：${result.pickedCount}`)
    console.log(`  - 每日上限：${result.dailyCap}`)
    console.log(`  - Index Health：${(indexHealth * 100).toFixed(2)}%`)
    console.log(`  - Run ID：${result.runId}`)
    
    // 7. 输出前 10 个页面
    console.log('\n🏆 Top 10 页面：')
    result.pages.slice(0, 10).forEach((page, index) => {
      console.log(
        `  ${index + 1}. ${page.pageType}/${page.pageId} - ` +
        `总分: ${page.scoreTotal.toFixed(2)} ` +
        `(GEO: ${page.scoreGeo}, Intent: ${page.scoreIntent}, Index: ${page.scoreIndex}, Risk: ${page.scoreRisk})`
      )
    })
    
    console.log('\n✅ 每日页面挑选完成！')
    
  } catch (error) {
    console.error('❌ 挑选过程出错：', error)
    throw error
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  dailyPagePicker()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

