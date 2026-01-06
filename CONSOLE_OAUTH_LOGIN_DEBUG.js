// ============================================
// OAuth 登录调试 Console 代码（完整版，可直接粘贴）
// ============================================

// 1. 完整 OAuth 诊断函数
async function oauthDiagnostics() {
  console.log('🔍 开始 OAuth 登录诊断...\n')
  const results = {
    timestamp: new Date().toISOString(),
    url: window.location.href,
    checks: {},
  }

  // 1.1 检查 URL 参数
  console.log('1️⃣ 检查 URL 参数...')
  const urlParams = new URLSearchParams(window.location.search)
  const code = urlParams.get('code')
  const errorParam = urlParams.get('error')
  const errorDescription = urlParams.get('error_description')
  
  results.checks.urlParams = {
    hasCode: !!code,
    codeLength: code?.length || 0,
    codePreview: code ? code.substring(0, 30) + '...' : null,
    hasError: !!errorParam,
    error: errorParam,
    errorDescription: errorDescription,
  }
  
  console.log('   Code 参数:', code ? `✅ 存在 (${code.length} 字符)` : '❌ 不存在')
  if (code) {
    console.log('   Code 预览:', code.substring(0, 30) + '...')
  }
  console.log('   错误参数:', errorParam || '无')
  if (errorDescription) {
    console.log('   错误描述:', errorDescription)
  }

  // 1.2 检查 localStorage
  console.log('\n2️⃣ 检查 localStorage...')
  try {
    const allStorageKeys = Object.keys(localStorage)
    const supabaseKeys = allStorageKeys.filter(
      key => key.includes('supabase') || key.startsWith('sb-')
    )
    
    results.checks.localStorage = {
      totalKeys: allStorageKeys.length,
      supabaseKeys: supabaseKeys.length,
      keys: supabaseKeys,
    }
    
    console.log('   总键数:', allStorageKeys.length)
    console.log('   Supabase 相关键数:', supabaseKeys.length)
    console.log('   Supabase 键列表:', supabaseKeys)
    
    // 检查 code_verifier
    let codeVerifierFound = false
    let codeVerifierSource = null
    
    const normalizedKeys = allStorageKeys.map(key => ({
      key,
      normalized: key.toLowerCase(),
    }))
    
    const directCodeKey = normalizedKeys.find(item =>
      item.normalized.includes('code_verifier') ||
      item.normalized.includes('code-verifier') ||
      item.normalized.includes('oauth-code-verifier')
    )
    
    if (directCodeKey) {
      codeVerifierFound = true
      codeVerifierSource = { type: 'direct_key', key: directCodeKey.key }
      const value = localStorage.getItem(directCodeKey.key)
      console.log('   ✅ 找到 code_verifier (直接键):', directCodeKey.key)
      console.log('      值长度:', value?.length || 0)
    } else {
      // 检查 Supabase 键中的值
      for (const key of supabaseKeys) {
        const rawValue = localStorage.getItem(key)
        if (!rawValue) continue
        
        if (
          rawValue.includes('code_verifier') ||
          rawValue.includes('codeVerifier') ||
          rawValue.includes('oauthCodeVerifier') ||
          rawValue.includes('pkce')
        ) {
          codeVerifierFound = true
          codeVerifierSource = { type: 'value_contains', key }
          console.log('   ✅ 找到 code_verifier (值中包含):', key)
          break
        }
        
        try {
          const parsedValue = JSON.parse(rawValue)
          if (
            parsedValue &&
            (
              parsedValue.code_verifier ||
              parsedValue.codeVerifier ||
              parsedValue.oauthCodeVerifier ||
              parsedValue?.session?.codeVerifier ||
              parsedValue?.pkce ||
              parsedValue?.authSession?.codeVerifier
            )
          ) {
            codeVerifierFound = true
            codeVerifierSource = { type: 'json_parsed', key }
            console.log('   ✅ 找到 code_verifier (JSON 解析):', key)
            break
          }
        } catch (e) {
          // 不是 JSON，继续
        }
      }
    }
    
    results.checks.codeVerifier = {
      found: codeVerifierFound,
      source: codeVerifierSource,
    }
    
    if (!codeVerifierFound) {
      console.log('   ❌ 未找到 code_verifier')
    }
    
    // 显示所有 Supabase 键的值（脱敏）
    console.log('\n   Supabase 存储内容:')
    for (const key of supabaseKeys) {
      const value = localStorage.getItem(key)
      if (value) {
        try {
          const parsed = JSON.parse(value)
          console.log(`   ${key}:`, JSON.stringify(parsed, null, 2).substring(0, 200))
        } catch (e) {
          console.log(`   ${key}:`, value.substring(0, 100))
        }
      }
    }
    
  } catch (error) {
    results.checks.localStorage = { error: error.message }
    console.log('   ❌ 检查失败:', error.message)
  }

  // 1.3 检查 sessionStorage
  console.log('\n3️⃣ 检查 sessionStorage...')
  try {
    const sessionKeys = Object.keys(sessionStorage)
    const supabaseSessionKeys = sessionKeys.filter(
      key => key.includes('supabase') || key.startsWith('sb-')
    )
    
    results.checks.sessionStorage = {
      totalKeys: sessionKeys.length,
      supabaseKeys: supabaseSessionKeys.length,
      keys: supabaseSessionKeys,
    }
    
    console.log('   总键数:', sessionKeys.length)
    console.log('   Supabase 相关键数:', supabaseSessionKeys.length)
    if (supabaseSessionKeys.length > 0) {
      console.log('   键列表:', supabaseSessionKeys)
    }
  } catch (error) {
    results.checks.sessionStorage = { error: error.message }
    console.log('   ❌ 检查失败:', error.message)
  }

  // 1.4 检查 Supabase 客户端
  console.log('\n4️⃣ 检查 Supabase 客户端...')
  try {
    // 尝试动态导入 Supabase 客户端
    const supabaseModule = await import('/lib/supabase/client.js')
    const { createClient } = supabaseModule
    const supabase = createClient()
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    results.checks.supabaseSession = {
      hasSession: !!session,
      userId: session?.user?.id || null,
      email: session?.user?.email || null,
      error: sessionError?.message || null,
    }
    
    if (session) {
      console.log('   ✅ 有活动会话')
      console.log('   用户 ID:', session.user.id)
      console.log('   邮箱:', session.user.email)
    } else {
      console.log('   ❌ 无活动会话')
      if (sessionError) {
        console.log('   错误:', sessionError.message)
      }
    }
  } catch (error) {
    results.checks.supabaseSession = { error: error.message }
    console.log('   ❌ 无法检查 Supabase:', error.message)
    console.log('   提示: 确保在正确的页面运行此脚本')
  }

  // 1.5 检查当前页面路径
  console.log('\n5️⃣ 检查页面路径...')
  results.checks.path = {
    pathname: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash,
    origin: window.location.origin,
  }
  console.log('   路径名:', window.location.pathname)
  console.log('   查询参数:', window.location.search)
  console.log('   哈希:', window.location.hash)
  console.log('   源:', window.location.origin)

  console.log('\n📊 诊断结果汇总:')
  console.log(JSON.stringify(results, null, 2))
  
  return results
}

// 2. 快速检查 code_verifier
function checkCodeVerifier() {
  console.log('⚡ 快速检查 code_verifier...\n')
  
  const allKeys = Object.keys(localStorage)
  const supabaseKeys = allKeys.filter(
    key => key.includes('supabase') || key.startsWith('sb-')
  )
  
  console.log('Supabase 相关键:', supabaseKeys)
  
  for (const key of supabaseKeys) {
    const value = localStorage.getItem(key)
    if (value) {
      try {
        const parsed = JSON.parse(value)
        if (parsed.code_verifier || parsed.codeVerifier || parsed.pkce) {
          console.log(`✅ 在 ${key} 中找到 code_verifier`)
          console.log('值:', parsed)
          return { found: true, key, value: parsed }
        }
      } catch (e) {
        if (value.includes('code_verifier') || value.includes('codeVerifier')) {
          console.log(`✅ 在 ${key} 的值中找到 code_verifier 字符串`)
          console.log('值预览:', value.substring(0, 200))
          return { found: true, key, value: value.substring(0, 200) }
        }
      }
    }
  }
  
  console.log('❌ 未找到 code_verifier')
  return { found: false }
}

// 3. 清除所有 OAuth 相关存储
function clearOAuthStorage() {
  console.log('🧹 清除 OAuth 相关存储...\n')
  
  const allKeys = Object.keys(localStorage)
  const supabaseKeys = allKeys.filter(
    key => key.includes('supabase') || key.startsWith('sb-') || 
           key.includes('oauth') || key.includes('code_verifier')
  )
  
  console.log('找到', supabaseKeys.length, '个相关键')
  
  for (const key of supabaseKeys) {
    localStorage.removeItem(key)
    console.log('已删除:', key)
  }
  
  const sessionKeys = Object.keys(sessionStorage)
  const supabaseSessionKeys = sessionKeys.filter(
    key => key.includes('supabase') || key.startsWith('sb-') || 
           key.includes('oauth')
  )
  
  for (const key of supabaseSessionKeys) {
    sessionStorage.removeItem(key)
    console.log('已删除 (sessionStorage):', key)
  }
  
  console.log('\n✅ 清除完成！请重新尝试登录。')
}

// 4. 测试手动交换 code
async function testExchangeCode(code = null) {
  console.log('🧪 测试手动交换 code...\n')
  
  if (!code) {
    const urlParams = new URLSearchParams(window.location.search)
    code = urlParams.get('code')
  }
  
  if (!code) {
    console.log('❌ 未找到 code 参数')
    return { error: 'No code parameter' }
  }
  
  console.log('Code:', code.substring(0, 30) + '...')
  
  try {
    const supabaseModule = await import('/lib/supabase/client.js')
    const { createClient } = supabaseModule
    const supabase = createClient()
    
    // 尝试交换 code
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.log('❌ 交换失败:', error.message)
      return { error: error.message, details: error }
    }
    
    if (data.session) {
      console.log('✅ 交换成功！')
      console.log('用户 ID:', data.session.user.id)
      console.log('邮箱:', data.session.user.email)
      return { success: true, session: data.session }
    }
    
    return { error: 'No session returned' }
  } catch (error) {
    console.log('❌ 错误:', error.message)
    return { error: error.message }
  }
}

// 5. 显示所有存储内容（调试用）
function showAllStorage() {
  console.log('📦 所有 localStorage 内容:\n')
  const allKeys = Object.keys(localStorage)
  for (const key of allKeys) {
    const value = localStorage.getItem(key)
    console.log(`${key}:`, value?.substring(0, 200) || '(空)')
  }
  
  console.log('\n📦 所有 sessionStorage 内容:\n')
  const sessionKeys = Object.keys(sessionStorage)
  for (const key of sessionKeys) {
    const value = sessionStorage.getItem(key)
    console.log(`${key}:`, value?.substring(0, 200) || '(空)')
  }
}

// 6. 从错误消息中提取 code 并尝试修复
async function extractCodeFromError() {
  console.log('🔧 尝试从错误消息中提取 code...\n')
  
  const urlParams = new URLSearchParams(window.location.search)
  const errorParam = urlParams.get('error')
  
  if (!errorParam) {
    console.log('❌ URL 中没有错误参数')
    return { error: 'No error parameter found' }
  }
  
  console.log('错误消息:', errorParam)
  
  // 尝试从错误消息中提取 code
  // 格式可能是: "Unable to exchange external code: 4/0ATX87l..."
  const codeMatch = errorParam.match(/code:\s*([^\s]+)/i) || 
                    errorParam.match(/code\s+([^\s]+)/i) ||
                    errorParam.match(/(4\/[A-Za-z0-9_-]+)/)
  
  if (codeMatch && codeMatch[1]) {
    const extractedCode = codeMatch[1]
    console.log('✅ 提取到 code:', extractedCode.substring(0, 30) + '...')
    console.log('   完整 code:', extractedCode)
    
    // 检查 code_verifier
    const verifierCheck = checkCodeVerifier()
    if (!verifierCheck.found) {
      console.log('⚠️ 警告: 未找到 code_verifier，交换可能会失败')
      console.log('   建议: 先运行 clearOAuthStorage()，然后重新登录')
      return { 
        code: extractedCode, 
        hasVerifier: false,
        suggestion: 'Clear storage and retry login'
      }
    }
    
    console.log('✅ 找到 code_verifier')
    console.log('\n⚠️  重要提示:')
    console.log('   由于当前在 /login 页面，无法直接交换 code')
    console.log('   需要导航到 /auth/callback 页面才能完成交换')
    console.log('\n💡 解决方案:')
    console.log('   1. 运行 clearOAuthStorage() 清除旧数据')
    console.log('   2. 重新点击"使用 Google 账号登录"')
    console.log('   3. 完成授权后会自动跳转到 /auth/callback')
    console.log('   4. 在回调页面会自动完成 code 交换')
    console.log('\n📋 提取到的 code 信息:')
    console.log('   Code:', extractedCode)
    console.log('   Code 长度:', extractedCode.length)
    console.log('   Code_verifier:', verifierCheck.found ? '存在' : '不存在')
    
    return { 
      code: extractedCode, 
      hasVerifier: verifierCheck.found,
      suggestion: 'Clear storage and retry login',
      nextSteps: [
        'Run clearOAuthStorage()',
        'Click "Sign in with Google" again',
        'Complete authorization',
        'Code will be exchanged automatically on callback page'
      ]
    }
  } else {
    console.log('❌ 无法从错误消息中提取 code')
    console.log('   错误消息格式可能不正确')
    return { error: 'Could not extract code from error message' }
  }
}

// 7. 修复建议（基于当前状态）
function getFixSuggestions() {
  console.log('💡 修复建议:\n')
  
  const urlParams = new URLSearchParams(window.location.search)
  const errorParam = urlParams.get('error')
  const verifierCheck = checkCodeVerifier()
  
  console.log('当前状态:')
  console.log('  - 错误消息:', errorParam || '无')
  console.log('  - code_verifier:', verifierCheck.found ? '✅ 存在' : '❌ 不存在')
  console.log('  - 当前页面:', window.location.pathname)
  
  console.log('\n建议操作:')
  
  if (!verifierCheck.found) {
    console.log('1. ❗ code_verifier 不存在')
    console.log('   操作: 运行 clearOAuthStorage() 清除旧数据')
    console.log('   然后: 重新尝试登录')
  } else if (errorParam && errorParam.includes('exchange')) {
    console.log('1. ❗ code 交换失败')
    console.log('   可能原因:')
    console.log('     - code 已过期（通常 10 分钟内有效）')
    console.log('     - code_verifier 和 code 不匹配（不同会话）')
    console.log('     - Supabase 配置问题')
    console.log('   操作步骤:')
    console.log('     a) 运行 clearOAuthStorage() 清除存储')
    console.log('     b) 重新尝试登录（生成新的 code 和 code_verifier）')
    console.log('     c) 如果仍然失败，检查 Supabase 项目设置中的重定向 URL')
  } else {
    console.log('1. ✅ 存储状态正常')
    console.log('   操作: 重新尝试登录')
  }
  
  console.log('\n2. 检查 Supabase 配置:')
  console.log('   - 确保重定向 URL 在 Supabase Dashboard 中正确配置')
  console.log('   - 检查 URL 是否完全匹配（包括协议、域名、路径）')
  console.log('   - 确保没有多余的斜杠或参数')
  
  console.log('\n3. 如果问题持续:')
  console.log('   - 尝试使用邮箱魔法链接登录（绕过 OAuth）')
  console.log('   - 检查浏览器控制台是否有其他错误')
  console.log('   - 检查网络请求是否成功（Network 标签）')
  
  return {
    hasVerifier: verifierCheck.found,
    hasError: !!errorParam,
    suggestions: []
  }
}

console.log(`
╔══════════════════════════════════════════════════════════╗
║         OAuth 登录调试 Console 代码                      ║
╚══════════════════════════════════════════════════════════╝

✅ 所有函数已加载！

📋 可用函数：
1. oauthDiagnostics()        - 完整 OAuth 诊断（推荐）
2. checkCodeVerifier()       - 快速检查 code_verifier
3. clearOAuthStorage()        - 清除所有 OAuth 相关存储
4. testExchangeCode(code)    - 测试手动交换 code
5. showAllStorage()          - 显示所有存储内容
6. extractCodeFromError()    - 从错误消息中提取 code 并尝试修复
7. getFixSuggestions()       - 获取基于当前状态的修复建议

🚀 快速开始：
   await oauthDiagnostics()

💡 常见问题排查：
   // 1. 完整诊断
   await oauthDiagnostics()
   
   // 2. 检查 code_verifier
   checkCodeVerifier()
   
   // 3. 从错误消息中提取 code（如果有）
   await extractCodeFromError()
   
   // 4. 获取修复建议
   getFixSuggestions()
   
   // 5. 清除存储后重试
   clearOAuthStorage()
   
   // 6. 查看所有存储
   showAllStorage()

🔍 诊断流程：
   1. 运行 oauthDiagnostics() 查看完整信息
   2. 如果有错误消息，运行 extractCodeFromError() 尝试修复
   3. 运行 getFixSuggestions() 获取建议
   4. 如果缺少 code_verifier 或 code 不匹配，运行 clearOAuthStorage()
   5. 重新尝试登录
   6. 如果仍然失败，检查 Supabase 配置中的重定向 URL

⚠️  常见问题：
   - "Unable to exchange external code": code 已过期或不匹配
     解决: clearOAuthStorage() 然后重新登录
   
   - code_verifier 不存在: 存储被清除或跨域问题
     解决: clearOAuthStorage() 然后重新登录
   
   - code 交换失败: Supabase 配置问题
     解决: 检查 Supabase Dashboard 中的重定向 URL 配置

`)

