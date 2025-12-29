// ============================================
// Payment Flow Debug Console Scripts
// 在浏览器 Console 里直接运行这些代码来测试支付流程
// ============================================

// ============================================
// 1. 检查所有支付计划（payment plans）
// ============================================
async function checkPaymentPlans() {
  console.log('🔍 [1] 检查所有支付计划...')
  try {
    const res = await fetch('/api/payment-plans')
    const data = await res.json()
    console.log('✅ Payment Plans Response:', data)
    
    if (data.success && data.plans) {
      console.log(`\n📊 找到 ${data.plans.length} 个计划:`)
      data.plans.forEach((plan, idx) => {
        console.log(`\n[${idx + 1}] ${plan.plan_name}`)
        console.log(`   金额: $${plan.amount} ${plan.currency.toUpperCase()}`)
        console.log(`   积分: ${plan.credits}`)
        console.log(`   视频: ${plan.videos}`)
        console.log(`   是否激活: ${plan.is_active ? '✅' : '❌'}`)
        console.log(`   Stripe Payment Link ID: ${plan.stripe_payment_link_id || '(未设置)'}`)
        console.log(`   Stripe Buy Button ID: ${plan.stripe_buy_button_id || '(未设置)'}`)
        console.log(`   是否为 Starter (≤$10): ${plan.amount <= 10 ? '✅ YES' : '❌ NO'}`)
      })
      
      // 检查是否有 4.9 计划
      const starter49 = data.plans.find(p => Math.abs(p.amount - 4.9) < 0.01)
      if (starter49) {
        console.log('\n✅ 找到 $4.9 Starter 计划!')
        console.log('   配置:', starter49)
      } else {
        console.log('\n❌ 未找到 $4.9 Starter 计划!')
        console.log('   请检查 Admin 里是否已创建并启用该计划')
      }
      
      // 检查是否有 39 和 299 计划
      const plan39 = data.plans.find(p => Math.abs(p.amount - 39) < 0.01)
      const plan299 = data.plans.find(p => Math.abs(p.amount - 299) < 0.01)
      console.log(`\n📋 升级计划检查:`)
      console.log(`   $39 计划: ${plan39 ? '✅' : '❌'}`)
      console.log(`   $299 计划: ${plan299 ? '✅' : '❌'}`)
    } else {
      console.error('❌ 获取计划失败:', data)
    }
  } catch (error) {
    console.error('❌ 请求失败:', error)
  }
}

// ============================================
// 2. 测试 Payment Link 创建流程（模拟点击 "Continue to Checkout"）
// ============================================
async function testPaymentLink(paymentLinkId) {
  console.log(`\n🔍 [2] 测试 Payment Link 创建流程...`)
  console.log(`   使用的 Payment Link ID: ${paymentLinkId}`)
  
  if (!paymentLinkId) {
    console.error('❌ 请提供 payment_link_id 参数')
    console.log('   用法: testPaymentLink("28EbJ14jUg2L6550Ug0kE05")')
    return
  }
  
  try {
    const res = await fetch('/api/payment/payment-link', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        payment_link_id: paymentLinkId,
      }),
    })
    
    const data = await res.json()
    console.log('📤 Request Body:', { payment_link_id: paymentLinkId })
    console.log('📥 Response Status:', res.status)
    console.log('📥 Response Data:', data)
    
    if (res.ok && data.success) {
      console.log('\n✅ Payment Link 创建成功!')
      console.log(`   Stripe URL: ${data.payment_link_url}`)
      console.log(`   充值单 ID: ${data.recharge_id || '(未返回)'}`)
      console.log('\n💡 如果这是真实测试，你可以复制上面的 URL 到新标签页打开')
    } else {
      console.error('\n❌ Payment Link 创建失败!')
      console.error(`   错误信息: ${data.error || 'Unknown error'}`)
      console.error(`   完整响应:`, data)
    }
  } catch (error) {
    console.error('❌ 请求失败:', error)
  }
}

// ============================================
// 3. 检查当前用户积分和充值记录
// ============================================
async function checkUserCredits() {
  console.log('\n🔍 [3] 检查当前用户积分和充值记录...')
  
  try {
    // 检查用户积分（通过 stats API）
    const statsRes = await fetch('/api/stats')
    const statsData = await statsRes.json()
    
    if (statsData.success) {
      console.log('✅ 用户积分信息:')
      console.log(`   当前积分: ${statsData.credits || 0}`)
      if (statsData.stats) {
        console.log(`   视频总数: ${statsData.stats.total || 0}`)
        console.log(`   成功: ${statsData.stats.succeeded || 0}`)
        console.log(`   处理中: ${statsData.stats.processing || 0}`)
        console.log(`   失败: ${statsData.stats.failed || 0}`)
      }
    } else {
      console.log('⚠️  无法获取积分信息（可能未登录）')
      console.log('   响应:', statsData)
    }
    
    // 检查充值记录
    const rechargeRes = await fetch('/api/payment/recharge-records')
    const rechargeData = await rechargeRes.json()
    
    if (rechargeData.success) {
      const records = rechargeData.records || []
      const userCredits = rechargeData.user_credits ?? 0
      
      console.log(`\n📋 充值记录 (共 ${records.length} 条):`)
      console.log(`   数据库中的积分: ${userCredits}`)
      
      if (records.length === 0) {
        console.log('   ⚠️  暂无充值记录（新用户）')
      } else {
        records.forEach((record, idx) => {
          console.log(`\n   [${idx + 1}] 充值单 #${record.id}`)
          console.log(`      金额: $${record.amount}`)
          console.log(`      积分: ${record.credits}`)
          console.log(`      状态: ${record.status}`)
          console.log(`      支付方式: ${record.payment_method || 'N/A'}`)
          console.log(`      创建时间: ${record.created_at}`)
          if (record.completed_at) {
            console.log(`      完成时间: ${record.completed_at}`)
          }
        })
      }
    } else {
      console.log('\n⚠️  无法获取充值记录')
      console.log('   响应:', rechargeData)
    }
  } catch (error) {
    console.error('❌ 请求失败:', error)
  }
}

// ============================================
// 4. 检查用户是否是新用户（用于显示 Starter Banner）
// ============================================
async function checkIsNewUser() {
  console.log('\n🔍 [4] 检查是否为新用户（用于显示 Starter Banner）...')
  
  try {
    const statsRes = await fetch('/api/stats')
    const statsData = await statsRes.json()
    
    if (!statsData.success) {
      console.log('⚠️  未登录或无法获取用户信息')
      return
    }
    
    const credits = statsData.credits || 0
    
    const rechargeRes = await fetch('/api/payment/recharge-records')
    const rechargeData = await rechargeRes.json()
    const hasRecharge = rechargeData.success && rechargeData.records && rechargeData.records.length > 0
    
    console.log('📊 用户状态:')
    console.log(`   当前积分: ${credits}`)
    console.log(`   是否有充值记录: ${hasRecharge ? '✅ 有' : '❌ 无（新用户）'}`)
    console.log(`   积分是否 ≤ 30: ${credits <= 30 ? '✅ YES' : '❌ NO'}`)
    
    const shouldShowStarterBanner = !hasRecharge && credits <= 30
    console.log(`\n${shouldShowStarterBanner ? '✅' : '❌'} 是否应显示 Starter Banner: ${shouldShowStarterBanner ? 'YES' : 'NO'}`)
    
    if (shouldShowStarterBanner) {
      console.log('\n💡 建议: 在视频生成页面显示 "$4.9 Starter Pack" 引导横幅')
    }
  } catch (error) {
    console.error('❌ 请求失败:', error)
  }
}

// ============================================
// 5. 一键完整测试（运行所有检查）
// ============================================
async function runFullPaymentTest() {
  console.log('🚀 ===========================================')
  console.log('🚀 开始完整支付流程测试')
  console.log('🚀 ===========================================\n')
  
  await checkPaymentPlans()
  await checkUserCredits()
  await checkIsNewUser()
  
  console.log('\n\n✅ ===========================================')
  console.log('✅ 测试完成')
  console.log('✅ ===========================================')
  console.log('\n💡 下一步:')
  console.log('   1. 如果看到 $4.9 计划，运行: testPaymentLink("28EbJ14jUg2L6550Ug0kE05")')
  console.log('   2. 如果看到 $39 计划，运行: testPaymentLink("dRmcN55nY4k33WXfPa0kE03")')
  console.log('   3. 如果看到 $299 计划，运行: testPaymentLink("fZu00jaIidUDctt46s0kE02")')
}

// ============================================
// 6. 快速测试特定 Payment Link
// ============================================
async function quickTest49() {
  console.log('🚀 快速测试 $4.9 Starter 计划...\n')
  await testPaymentLink('28EbJ14jUg2L6550Ug0kE05')
}

async function quickTest39() {
  console.log('🚀 快速测试 $39 Basic 计划...\n')
  await testPaymentLink('dRmcN55nY4k33WXfPa0kE03')
}

async function quickTest299() {
  console.log('🚀 快速测试 $299 Professional 计划...\n')
  await testPaymentLink('fZu00jaIidUDctt46s0kE02')
}

// ============================================
// 使用说明
// ============================================
console.log(`
╔══════════════════════════════════════════════════════════════╗
║          Payment Flow Debug Console Scripts                 ║
╚══════════════════════════════════════════════════════════════╝

📋 可用函数:

1. runFullPaymentTest()
   → 一键运行所有检查（推荐首次使用）

2. checkPaymentPlans()
   → 检查所有支付计划配置

3. testPaymentLink("payment_link_id")
   → 测试 Payment Link 创建流程
   示例: testPaymentLink("28EbJ14jUg2L6550Ug0kE05")

4. checkUserCredits()
   → 检查当前用户积分和充值记录

5. checkIsNewUser()
   → 检查是否为新用户（用于显示 Starter Banner）

6. quickTest49()
   → 快速测试 $4.9 Starter 计划

7. quickTest39()
   → 快速测试 $39 Basic 计划

8. quickTest299()
   → 快速测试 $299 Professional 计划

💡 开始测试: 运行 runFullPaymentTest()
`)

