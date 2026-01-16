// ============================================
// Cookie 认证测试脚本
// 直接复制粘贴到浏览器控制台运行
// ============================================

(async function() {
  console.log('🍪 Cookie 认证测试\n')
  
  // 1. 检查所有 Cookie
  console.log('1️⃣ 检查所有 Cookie:')
  const allCookies = document.cookie.split(';').map(c => c.trim())
  console.log(`   找到 ${allCookies.length} 个 Cookie`)
  
  const supabaseCookies = allCookies.filter(c => 
    c.includes('supabase') || c.startsWith('sb-')
  )
  
  if (supabaseCookies.length === 0) {
    console.log('   ❌ 未找到 Supabase Cookie')
    console.log('   💡 这可能意味着:')
    console.log('      - Session 未正确设置')
    console.log('      - Cookie 被 SameSite 策略阻止')
    console.log('      - 需要刷新页面让 middleware 设置 Cookie')
  } else {
    console.log(`   ✅ 找到 ${supabaseCookies.length} 个 Supabase Cookie:`)
    supabaseCookies.forEach(cookie => {
      const [key, value] = cookie.split('=')
      const preview = value ? (value.length > 50 ? value.substring(0, 50) + '...' : value) : '(空)'
      console.log(`   - ${key}: ${preview}`)
    })
  }
  
  // 2. 测试 API（依赖 Cookie）
  console.log('\n2️⃣ 测试 API 调用（使用 Cookie 认证）:')
  
  console.log('   📤 测试 /api/stats...')
  try {
    const statsRes = await fetch('/api/stats', {
      credentials: 'include', // 确保发送 Cookie
    })
    console.log(`   状态: ${statsRes.status} ${statsRes.statusText}`)
    
    if (statsRes.ok) {
      const statsData = await statsRes.json()
      if (statsData.success) {
        console.log('   ✅ 成功! Cookie 认证工作正常')
        console.log(`   当前积分: ${statsData.credits || 0}`)
      } else {
        console.log('   ❌ API 返回 success: false')
      }
    } else if (statsRes.status === 401) {
      console.log('   ❌ 401 未授权')
      console.log('   💡 Cookie 可能不存在或已过期')
    }
  } catch (e) {
    console.log(`   ❌ 请求失败: ${e.message}`)
  }
  
  console.log('\n   📤 测试 /api/payment/recharge-records...')
  try {
    const rechargeRes = await fetch('/api/payment/recharge-records', {
      credentials: 'include', // 确保发送 Cookie
    })
    console.log(`   状态: ${rechargeRes.status} ${rechargeRes.statusText}`)
    
    if (rechargeRes.ok) {
      const rechargeData = await rechargeRes.json()
      console.log('   ✅ 成功! Cookie 认证工作正常')
      console.log(`   记录数: ${(rechargeData.records || []).length}`)
      console.log(`   用户积分: ${rechargeData.user_credits || 0}`)
    } else if (rechargeRes.status === 401) {
      console.log('   ❌ 401 未授权')
      const errorData = await rechargeRes.json().catch(() => ({}))
      console.log(`   错误: ${errorData.error || 'Unauthorized'}`)
      console.log('\n   💡 可能的原因:')
      console.log('      1. Cookie 不存在（需要刷新页面让 middleware 设置）')
      console.log('      2. Cookie 已过期（需要重新登录）')
      console.log('      3. Cookie 的域名/路径不匹配')
    } else {
      const errorData = await rechargeRes.json().catch(() => ({}))
      console.log(`   ⚠️  其他错误: ${rechargeRes.status}`)
      console.log(`   详情:`, errorData)
    }
  } catch (e) {
    console.log(`   ❌ 请求失败: ${e.message}`)
  }
  
  // 3. 检查 localStorage（对比）
  console.log('\n3️⃣ 检查 localStorage（对比）:')
  const localStorageKeys = Object.keys(localStorage).filter(k => 
    k.includes('supabase') || k.startsWith('sb-')
  )
  
  if (localStorageKeys.length > 0) {
    console.log(`   ✅ 找到 ${localStorageKeys.length} 个 localStorage 键`)
    console.log('   💡 localStorage 有数据但 Cookie 没有，可能需要:')
    console.log('      - 刷新页面让 middleware 同步 Cookie')
    console.log('      - 或者手动将 token 添加到请求头')
  } else {
    console.log('   ❌ localStorage 也没有数据')
  }
  
  // 4. 建议
  console.log('\n💡 建议:')
  if (supabaseCookies.length === 0 && localStorageKeys.length > 0) {
    console.log('   ⚠️  localStorage 有 token 但 Cookie 没有')
    console.log('   → 尝试刷新页面，让 middleware 设置 Cookie')
    console.log('   → 或者检查 Cookie 的 SameSite 设置')
  } else if (supabaseCookies.length > 0) {
    console.log('   ✅ Cookie 存在，如果 API 仍然 401，可能是:')
    console.log('      - Cookie 格式不正确')
    console.log('      - Cookie 已过期')
    console.log('      - 服务器端无法读取 Cookie')
  } else {
    console.log('   ❌ 没有找到任何认证信息')
    console.log('   → 请先登录')
  }
  
  console.log('\n✅ 测试完成!')
})();
