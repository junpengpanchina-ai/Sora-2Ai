/**
 * Fallback 链诊断脚本
 * 分析批量生成过程中的 Fallback 使用情况，检查是否存在"干烧"问题
 * 
 * 使用方法：
 * node scripts/analyze-fallback-chain.js [startDate] [endDate]
 * 
 * 例如：
 * node scripts/analyze-fallback-chain.js 2025-12-29 2025-12-29
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少环境变量: NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// 模型积分消耗估算（基于实际使用经验）
const MODEL_CREDIT_COST = {
  'gemini-2.5-flash': 60,  // 约 60-70 积分
  'gemini-3-flash': 110,   // 约 100-120 积分
  'gemini-3-pro': 150,     // 约 140-160 积分
}

async function analyzeFallbackChain(startDate, endDate) {
  console.log('🔍 ===========================================')
  console.log('🔍 Fallback 链诊断分析')
  console.log('🔍 ===========================================\n')
  console.log(`📅 查询时间范围: ${startDate} 至 ${endDate}\n`)

  try {
    // 1. 查询批量生成任务
    const { data: tasks, error: tasksError } = await supabase
      .from('batch_generation_tasks')
      .select('*')
      .gte('created_at', `${startDate}T00:00:00.000Z`)
      .lte('created_at', `${endDate}T23:59:59.999Z`)
      .order('created_at', { ascending: false })

    if (tasksError) {
      console.error('❌ 查询任务失败:', tasksError)
      return
    }

    if (!tasks || tasks.length === 0) {
      console.log('⚠️  该时间段内没有批量生成任务')
      return
    }

    console.log(`📊 找到 ${tasks.length} 个批量生成任务\n`)

    // 2. 分析每个任务的日志（从 Vercel 日志或数据库）
    // 注意：这里我们需要从实际日志中提取信息
    // 由于日志可能存储在 Vercel 或其他地方，这里提供一个分析框架

    let totalEstimatedCredits = 0
    let totalBatches = 0
    let fallbackCount = 0
    let doubleFallbackCount = 0
    let tripleFallbackCount = 0

    const taskAnalysis = []

    for (const task of tasks) {
      const taskId = task.id
      const industry = task.industries?.[task.current_industry_index || 0] || 'Unknown'
      const scenesPerIndustry = task.scenes_per_industry || 100
      const batches = Math.ceil(scenesPerIndustry / 50) // 假设每批 50 条

      // 估算积分消耗
      // 假设：
      // - 90% 批次使用 2.5-flash（60 积分）
      // - 8% 批次触发 fallback 到 3-flash（60 + 110 = 170 积分）
      // - 2% 批次触发到 3-pro（60 + 110 + 150 = 320 积分）
      
      // 但实际可能更高，因为质量检查可能更严格
      const estimatedBatches = batches
      const estimatedCredits = estimatedBatches * MODEL_CREDIT_COST['gemini-2.5-flash']

      totalBatches += estimatedBatches
      totalEstimatedCredits += estimatedCredits

      taskAnalysis.push({
        taskId,
        industry,
        status: task.status,
        scenesPerIndustry,
        batches: estimatedBatches,
        estimatedCredits,
        createdAt: task.created_at,
      })
    }

    console.log('📋 任务分析结果:')
    console.log('─'.repeat(80))
    taskAnalysis.forEach((analysis, idx) => {
      console.log(`\n[${idx + 1}] ${analysis.industry}`)
      console.log(`    任务 ID: ${analysis.taskId}`)
      console.log(`    状态: ${analysis.status}`)
      console.log(`    目标场景数: ${analysis.scenesPerIndustry}`)
      console.log(`    估算批次数: ${analysis.batches}`)
      console.log(`    估算积分消耗: ${analysis.estimatedCredits.toLocaleString()} 积分`)
      console.log(`    创建时间: ${analysis.createdAt}`)
    })

    console.log('\n\n📊 ===========================================')
    console.log('📊 总体统计')
    console.log('📊 ===========================================\n')
    console.log(`总任务数: ${tasks.length}`)
    console.log(`总批次数（估算）: ${totalBatches}`)
    console.log(`总积分消耗（估算）: ${totalEstimatedCredits.toLocaleString()} 积分`)
    console.log(`平均每批次消耗: ${Math.round(totalEstimatedCredits / totalBatches)} 积分`)

    // 3. 分析 Fallback 触发情况
    console.log('\n\n🔄 ===========================================')
    console.log('🔄 Fallback 链分析')
    console.log('🔄 ===========================================\n')

    console.log('⚠️  关键发现：')
    console.log('1. 如果 Level 1 (2.5-flash) 返回空数组或质量不达标，会触发 Level 2 (3-flash)')
    console.log('   → 这会消耗两次积分：60 + 110 = 170 积分')
    console.log('2. 如果 Level 2 也失败，会触发 Level 3 (3-pro)')
    console.log('   → 这会消耗三次积分：60 + 110 + 150 = 320 积分')
    console.log('3. 平均 201 积分/次，说明有大量 Fallback 触发\n')

    // 4. 计算可能的 Fallback 比例
    const avgCreditsPerRequest = 201
    const baseCost = MODEL_CREDIT_COST['gemini-2.5-flash']
    const fallbackCost = MODEL_CREDIT_COST['gemini-3-flash']
    const proCost = MODEL_CREDIT_COST['gemini-3-pro']

    // 如果平均是 201，可能的组合：
    // - 纯 2.5-flash: 60 积分
    // - 2.5-flash + 3-flash: 170 积分
    // - 2.5-flash + 3-flash + 3-pro: 320 积分

    // 假设 x% 是纯 2.5-flash，y% 是 fallback，z% 是 triple fallback
    // 60x + 170y + 320z = 201
    // x + y + z = 1

    // 简化计算：如果平均是 201，说明大部分请求都触发了 fallback
    const fallbackRatio = (avgCreditsPerRequest - baseCost) / (fallbackCost - baseCost)
    console.log(`📈 估算 Fallback 触发比例: ${(fallbackRatio * 100).toFixed(1)}%`)
    console.log(`   这意味着大部分请求都从 2.5-flash fallback 到了 3-flash\n`)

    // 5. 检查可能的"干烧"场景
    console.log('🔥 ===========================================')
    console.log('🔥 "干烧"问题检查')
    console.log('🔥 ===========================================\n')

    console.log('可能存在的"干烧"场景：')
    console.log('1. ✅ 已实现：保存失败率 > 50% 时停止生成（避免继续调用 API）')
    console.log('2. ✅ 已实现：任务停止/取消时立即停止（避免继续调用 API）')
    console.log('3. ⚠️  潜在问题：Fallback 链导致重复消耗积分')
    console.log('   - Level 1 调用成功但质量不达标 → 触发 Level 2（重复消耗）')
    console.log('   - Level 2 调用成功但质量不达标 → 触发 Level 3（再次重复消耗）')
    console.log('4. ⚠️  潜在问题：重试机制可能导致重复消耗')
    console.log('   - 网络错误时重试（最多 3 次）')
    console.log('   - 但重试应该只在网络错误时，不会重复消耗（因为请求失败）\n')

    // 6. 建议
    console.log('💡 ===========================================')
    console.log('💡 优化建议')
    console.log('💡 ===========================================\n')

    console.log('1. 优化质量检查阈值')
    console.log('   - 降低对 2.5-flash 的质量要求，减少不必要的 Fallback')
    console.log('   - 只在真正需要时才触发 Fallback（空数组、完全失败）\n')

    console.log('2. 优化模型选择策略')
    console.log('   - 对于已知的冷门行业，直接使用 3-flash，跳过 2.5-flash')
    console.log('   - 避免先调用 2.5-flash 再 fallback 到 3-flash\n')

    console.log('3. 添加积分消耗监控')
    console.log('   - 记录每次 API 调用的模型和积分消耗')
    console.log('   - 在数据库中记录 Fallback 触发情况')
    console.log('   - 实时监控平均积分消耗，如果超过阈值则告警\n')

    console.log('4. 优化 Fallback 逻辑')
    console.log('   - 如果 2.5-flash 返回的内容虽然质量不高但可用，不要立即 Fallback')
    console.log('   - 只有在完全失败（空数组、无法解析）时才 Fallback\n')

  } catch (error) {
    console.error('❌ 分析失败:', error)
  }
}

// 主函数
async function main() {
  const args = process.argv.slice(2)
  const startDate = args[0] || '2025-12-29'
  const endDate = args[1] || '2025-12-29'

  await analyzeFallbackChain(startDate, endDate)
}

main().catch(console.error)

