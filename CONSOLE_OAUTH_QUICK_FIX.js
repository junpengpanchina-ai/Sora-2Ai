// ============================================
// OAuth 登录快速修复 - 直接复制粘贴到控制台
// ============================================

(function() {
  // 快速清除 OAuth 存储
  window.clearOAuth = function() {
    console.log('🧹 清除 OAuth 存储...\n')
    
    const localStorageKeys = Object.keys(localStorage)
    const sessionStorageKeys = Object.keys(sessionStorage)
    
    const oauthKeys = [
      ...localStorageKeys.filter(k => k.includes('supabase') || k.startsWith('sb-') || k.includes('oauth') || k.includes('code_verifier')),
      ...sessionStorageKeys.filter(k => k.includes('supabase') || k.startsWith('sb-') || k.includes('oauth') || k.includes('code_verifier'))
    ]
    
    const uniqueKeys = [...new Set(oauthKeys)]
    
    uniqueKeys.forEach(key => {
      localStorage.removeItem(key)
      sessionStorage.removeItem(key)
      console.log('✅ 已删除:', key)
    })
    
    console.log(`\n✅ 清除完成！已删除 ${uniqueKeys.length} 个键`)
    console.log('💡 现在请重新点击"使用 Google 账号登录"')
    
    return { cleared: uniqueKeys.length, keys: uniqueKeys }
  }

  // 检查 code_verifier
  window.checkVerifier = function() {
    console.log('🔍 检查 code_verifier...\n')
    
    const allKeys = [...Object.keys(localStorage), ...Object.keys(sessionStorage)]
    const verifierKeys = allKeys.filter(k => 
      k.toLowerCase().includes('code_verifier') || 
      k.toLowerCase().includes('code-verifier') ||
      k.toLowerCase().includes('oauth-code-verifier')
    )
    
    if (verifierKeys.length > 0) {
      console.log('✅ 找到 code_verifier:')
      verifierKeys.forEach(key => {
        const value = localStorage.getItem(key) || sessionStorage.getItem(key)
        console.log(`   ${key}: ${value ? value.substring(0, 50) + '...' : '(空)'}`)
      })
      return { found: true, keys: verifierKeys }
    } else {
      console.log('❌ 未找到 code_verifier')
      return { found: false }
    }
  }

  // 检查当前错误
  window.checkError = function() {
    console.log('🔍 检查当前错误...\n')
    
    const urlParams = new URLSearchParams(window.location.search)
    const error = urlParams.get('error')
    
    if (error) {
      console.log('❌ 发现错误:', error)
      
      // 尝试提取 code
      const codeMatch = error.match(/(4\/[A-Za-z0-9_-]+)/)
      if (codeMatch) {
        console.log('📋 提取到 code:', codeMatch[1])
        console.log('💡 这个 code 可能已过期或不匹配')
      }
      
      console.log('\n💡 建议:')
      console.log('   1. 运行 clearOAuth() 清除存储')
      console.log('   2. 重新点击"使用 Google 账号登录"')
      
      return { hasError: true, error, code: codeMatch?.[1] || null }
    } else {
      console.log('✅ 没有错误')
      return { hasError: false }
    }
  }

  // 一键诊断
  window.quickFix = function() {
    console.log('🚀 一键诊断和修复...\n')
    console.log('='.repeat(50))
    
    const errorCheck = window.checkError()
    console.log('\n')
    const verifierCheck = window.checkVerifier()
    console.log('\n')
    
    console.log('💡 修复建议:')
    if (errorCheck.hasError || !verifierCheck.found) {
      console.log('   需要清除存储并重新登录')
      console.log('   运行: clearOAuth()')
      console.log('   然后: 重新点击登录按钮')
    } else {
      console.log('   存储状态正常，如果仍有问题，请检查 Supabase 配置')
    }
    
    return { error: errorCheck, verifier: verifierCheck }
  }

  // 显示帮助信息
  console.log(`
╔══════════════════════════════════════════════════════════╗
║      OAuth 登录调试工具（已加载）                       ║
╚══════════════════════════════════════════════════════════╝

✅ 所有函数已加载！现在可以使用：

🚀 一键诊断和修复：
   quickFix()

🔧 常用命令：
   clearOAuth()      - 清除所有 OAuth 存储（推荐）
   checkVerifier()   - 检查 code_verifier
   checkError()      - 检查当前错误

💡 典型使用流程：
   1. quickFix()           # 查看问题
   2. clearOAuth()         # 清除存储
   3. 重新点击登录按钮     # 重新登录

`)
})()

