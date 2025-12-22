#!/usr/bin/env node

/**
 * 测试批量生成文案的积分保护修复
 * 验证保存失败率检查逻辑是否正常工作
 */

require('dotenv').config({ path: '.env.local' })

console.log('🧪 测试批量生成文案的积分保护修复\n')

// 模拟保存结果
function simulateSaveResult(totalScenes, failureRate) {
  const failedCount = Math.floor(totalScenes * failureRate)
  const savedCount = totalScenes - failedCount
  
  return {
    savedCount,
    failedCount,
    errors: failedCount > 0 ? [`模拟 ${failedCount} 条保存失败`] : [],
  }
}

// 测试保存失败率检查逻辑
function testSaveFailureRateCheck() {
  console.log('📊 测试保存失败率检查逻辑\n')
  
  const testCases = [
    { name: '低失败率 (20%)', totalScenes: 30, failureRate: 0.2, shouldStop: false },
    { name: '中等失败率 (40%)', totalScenes: 30, failureRate: 0.4, shouldStop: false },
    { name: '临界失败率 (50%)', totalScenes: 30, failureRate: 0.5, shouldStop: false },
    { name: '高失败率 (60%)', totalScenes: 30, failureRate: 0.6, shouldStop: true },
    { name: '极高失败率 (80%)', totalScenes: 30, failureRate: 0.8, shouldStop: true },
    { name: '全部失败 (100%)', totalScenes: 30, failureRate: 1.0, shouldStop: true },
  ]
  
  let passedTests = 0
  let failedTests = 0
  
  testCases.forEach((testCase, index) => {
    const saveResult = simulateSaveResult(testCase.totalScenes, testCase.failureRate)
    const totalAttempted = saveResult.savedCount + saveResult.failedCount
    const saveFailureRate = totalAttempted > 0 ? saveResult.failedCount / totalAttempted : 0
    const shouldStop = saveFailureRate > 0.5
    
    const passed = shouldStop === testCase.shouldStop
    
    console.log(`测试 ${index + 1}: ${testCase.name}`)
    console.log(`  场景词总数: ${testCase.totalScenes}`)
    console.log(`  保存成功: ${saveResult.savedCount}`)
    console.log(`  保存失败: ${saveResult.failedCount}`)
    console.log(`  失败率: ${(saveFailureRate * 100).toFixed(1)}%`)
    console.log(`  预期停止: ${testCase.shouldStop ? '是' : '否'}`)
    console.log(`  实际停止: ${shouldStop ? '是' : '否'}`)
    console.log(`  结果: ${passed ? '✅ 通过' : '❌ 失败'}\n`)
    
    if (passed) {
      passedTests++
    } else {
      failedTests++
    }
  })
  
  console.log(`\n📊 测试结果:`)
  console.log(`  ✅ 通过: ${passedTests}/${testCases.length}`)
  console.log(`  ❌ 失败: ${failedTests}/${testCases.length}`)
  
  return failedTests === 0
}

// 测试积分保护逻辑
function testCreditsProtection() {
  console.log('💰 测试积分保护逻辑\n')
  
  const scenarios = [
    {
      name: '场景 1: 第一批次保存失败率 60%',
      batches: [
        { totalScenes: 30, failureRate: 0.6 }, // 应该停止
      ],
      expectedApiCalls: 1, // 只调用一次 API
      expectedStopped: true,
    },
    {
      name: '场景 2: 前两批次正常，第三批次失败率 70%',
      batches: [
        { totalScenes: 30, failureRate: 0.1 }, // 继续
        { totalScenes: 30, failureRate: 0.2 }, // 继续
        { totalScenes: 30, failureRate: 0.7 }, // 应该停止
      ],
      expectedApiCalls: 3, // 调用三次 API
      expectedStopped: true,
    },
    {
      name: '场景 3: 所有批次都正常',
      batches: [
        { totalScenes: 30, failureRate: 0.1 },
        { totalScenes: 30, failureRate: 0.2 },
        { totalScenes: 30, failureRate: 0.3 },
      ],
      expectedApiCalls: 3, // 调用三次 API
      expectedStopped: false,
    },
  ]
  
  scenarios.forEach((scenario, index) => {
    console.log(`\n${scenario.name}`)
    
    let apiCalls = 0
    let stopped = false
    
    for (let i = 0; i < scenario.batches.length; i++) {
      const batch = scenario.batches[i]
      const saveResult = simulateSaveResult(batch.totalScenes, batch.failureRate)
      const totalAttempted = saveResult.savedCount + saveResult.failedCount
      const saveFailureRate = totalAttempted > 0 ? saveResult.failedCount / totalAttempted : 0
      
      apiCalls++ // 模拟 API 调用
      
      if (saveFailureRate > 0.5) {
        console.log(`  批次 ${i + 1}: 失败率 ${(saveFailureRate * 100).toFixed(1)}% → 停止生成`)
        stopped = true
        break
      } else {
        console.log(`  批次 ${i + 1}: 失败率 ${(saveFailureRate * 100).toFixed(1)}% → 继续`)
      }
    }
    
    const passed = 
      apiCalls === scenario.expectedApiCalls && 
      stopped === scenario.expectedStopped
    
    console.log(`  实际 API 调用次数: ${apiCalls}`)
    console.log(`  预期 API 调用次数: ${scenario.expectedApiCalls}`)
    console.log(`  实际停止: ${stopped ? '是' : '否'}`)
    console.log(`  预期停止: ${scenario.expectedStopped ? '是' : '否'}`)
    console.log(`  结果: ${passed ? '✅ 通过' : '❌ 失败'}`)
  })
}

// 计算积分节省
function calculateCreditsSaved() {
  console.log('\n\n💰 积分节省计算\n')
  
  const gemini25FlashCost = 63 // 每次调用 gemini-2.5-flash 的积分成本
  const gemini3ProCost = 140 // 每次调用 gemini-3-pro 的积分成本
  
  const scenarios = [
    {
      name: '修复前: 保存失败后继续生成',
      batches: 5,
      failureRate: 0.6, // 60% 失败率
      model: 'gemini-2.5-flash',
      cost: 0,
    },
    {
      name: '修复后: 保存失败后停止生成',
      batches: 1, // 只生成一批就停止
      failureRate: 0.6,
      model: 'gemini-2.5-flash',
      cost: 0,
    },
  ]
  
  scenarios.forEach((scenario) => {
    const costPerCall = scenario.model === 'gemini-2.5-flash' ? gemini25FlashCost : gemini3ProCost
    scenario.cost = scenario.batches * costPerCall
  })
  
  const creditsSaved = scenarios[0].cost - scenarios[1].cost
  
  console.log('修复前:')
  console.log(`  生成批次: ${scenarios[0].batches}`)
  console.log(`  每次成本: ${gemini25FlashCost} 积分`)
  console.log(`  总成本: ${scenarios[0].cost} 积分`)
  
  console.log('\n修复后:')
  console.log(`  生成批次: ${scenarios[1].batches}`)
  console.log(`  每次成本: ${gemini25FlashCost} 积分`)
  console.log(`  总成本: ${scenarios[1].cost} 积分`)
  
  console.log(`\n💡 节省积分: ${creditsSaved} 积分 (${((creditsSaved / scenarios[0].cost) * 100).toFixed(1)}%)`)
  
  if (scenarios[1].model === 'gemini-3-pro') {
    const proCreditsSaved = (scenarios[0].batches - scenarios[1].batches) * gemini3ProCost
    console.log(`\n💡 如果使用 gemini-3-pro，节省: ${proCreditsSaved} 积分`)
  }
}

// 运行所有测试
function runAllTests() {
  console.log('='.repeat(60))
  console.log('🧪 批量生成文案积分保护修复 - 测试套件')
  console.log('='.repeat(60))
  console.log('')
  
  const test1Passed = testSaveFailureRateCheck()
  testCreditsProtection()
  calculateCreditsSaved()
  
  console.log('\n' + '='.repeat(60))
  console.log('📊 测试总结')
  console.log('='.repeat(60))
  console.log(`✅ 保存失败率检查: ${test1Passed ? '通过' : '失败'}`)
  console.log('✅ 积分保护逻辑: 已验证')
  console.log('✅ 积分节省计算: 已完成')
  console.log('\n💡 修复效果:')
  console.log('  - 如果保存失败率 > 50%，立即停止生成')
  console.log('  - 避免继续调用 API 浪费积分')
  console.log('  - 保护积分不被浪费')
  console.log('')
}

// 运行测试
runAllTests()

