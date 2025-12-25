/**
 * 聊天功能调试 Console 代码
 * 在浏览器 Console 中复制粘贴运行
 */

// ============================================
// 1. 完整诊断（推荐先运行）
// ============================================
async function fullDiagnostics() {
  console.log('🔍 开始完整诊断...\n')
  const results = {
    timestamp: new Date().toISOString(),
    checks: {},
  }

  // 1.1 检查认证
  console.log('1️⃣ 检查管理员认证...')
  try {
    const authRes = await fetch('/api/admin/chat/sessions')
    const authData = await authRes.json()
    results.checks.auth = {
      status: authRes.status,
      success: authRes.ok,
      hasData: !!authData,
      error: authData.error || null,
    }
    console.log('   状态:', authRes.status, authRes.ok ? '✅' : '❌')
    if (authData.error) console.log('   错误:', authData.error)
  } catch (error) {
    results.checks.auth = { error: error.message }
    console.log('   ❌ 失败:', error.message)
  }

  // 1.2 检查数据库表
  console.log('\n2️⃣ 检查数据库表...')
  try {
    const sessionsRes = await fetch('/api/admin/chat/sessions')
    const sessionsData = await sessionsRes.json()
    results.checks.database = {
      status: sessionsRes.status,
      success: sessionsRes.ok,
      hasSessions: Array.isArray(sessionsData.data),
      sessionCount: sessionsData.data?.length || 0,
      error: sessionsData.error || null,
      debug: sessionsData.debug || null,
    }
    console.log('   状态:', sessionsRes.status, sessionsRes.ok ? '✅' : '❌')
    console.log('   会话数:', sessionsData.data?.length || 0)
    if (sessionsData.error) {
      console.log('   ❌ 错误:', sessionsData.error)
      if (sessionsData.debug) {
        console.log('   调试信息:', sessionsData.debug)
      }
    }
  } catch (error) {
    results.checks.database = { error: error.message }
    console.log('   ❌ 失败:', error.message)
  }

  // 1.3 测试创建会话
  console.log('\n3️⃣ 测试创建会话...')
  try {
    const createRes = await fetch('/api/admin/chat/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '测试会话 ' + Date.now() }),
    })
    const createData = await createRes.json()
    results.checks.createSession = {
      status: createRes.status,
      success: createRes.ok,
      hasSession: !!createData.data,
      sessionId: createData.data?.id || null,
      error: createData.error || null,
    }
    console.log('   状态:', createRes.status, createRes.ok ? '✅' : '❌')
    if (createData.data) {
      console.log('   会话ID:', createData.data.id)
    }
    if (createData.error) {
      console.log('   ❌ 错误:', createData.error)
    }
    
    // 如果创建成功，尝试删除测试会话
    if (createData.data?.id) {
      try {
        await fetch(`/api/admin/chat/sessions?id=${createData.data.id}`, {
          method: 'DELETE',
        })
        console.log('   🗑️  已清理测试会话')
      } catch {}
    }
  } catch (error) {
    results.checks.createSession = { error: error.message }
    console.log('   ❌ 失败:', error.message)
  }

  // 1.4 测试发送消息
  console.log('\n4️⃣ 测试发送消息...')
  try {
    // 先创建一个会话
    const sessionRes = await fetch('/api/admin/chat/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '消息测试会话' }),
    })
    const sessionData = await sessionRes.json()
    
    if (sessionData.data?.id) {
      const messageRes = await fetch('/api/admin/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionData.data.id,
          message: '这是一条测试消息',
          stream: false,
          saveHistory: true,
        }),
      })
      
      let messageData
      try {
        messageData = await messageRes.json()
      } catch (jsonError) {
        const text = await messageRes.text()
        messageData = {
          error: 'JSON 解析失败',
          rawResponse: text.substring(0, 200),
          status: messageRes.status,
        }
      }
      
      results.checks.sendMessage = {
        status: messageRes.status,
        success: messageRes.ok,
        hasResponse: !!messageData,
        hasContent: !!messageData.content,
        error: messageData.error || null,
        rawResponse: messageData.rawResponse || null,
      }
      console.log('   状态:', messageRes.status, messageRes.ok ? '✅' : '❌')
      if (messageData.content) {
        console.log('   响应长度:', messageData.content.length, '字符')
      }
      if (messageData.error) {
        console.log('   ❌ 错误:', messageData.error)
      }
      if (messageData.rawResponse) {
        console.log('   ⚠️  原始响应:', messageData.rawResponse)
      }
      
      // 清理测试会话
      try {
        await fetch(`/api/admin/chat/sessions?id=${sessionData.data.id}`, {
          method: 'DELETE',
        })
      } catch {}
    } else {
      results.checks.sendMessage = {
        error: '无法创建测试会话',
        sessionError: sessionData.error,
      }
      console.log('   ❌ 无法创建测试会话')
    }
  } catch (error) {
    results.checks.sendMessage = { error: error.message }
    console.log('   ❌ 失败:', error.message)
  }

  // 1.5 检查环境变量（前端无法直接访问，但可以检查 API 响应）
  console.log('\n5️⃣ 检查 API 端点...')
  const endpoints = [
    { name: 'GET /api/admin/chat/sessions', url: '/api/admin/chat/sessions', method: 'GET' },
    { name: 'POST /api/admin/chat/sessions', url: '/api/admin/chat/sessions', method: 'POST' },
    { name: 'POST /api/admin/chat', url: '/api/admin/chat', method: 'POST' },
    { name: 'GET /api/admin/chat/debug', url: '/api/admin/chat/debug', method: 'GET' },
  ]
  
  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint.url, {
        method: endpoint.method,
        ...(endpoint.method === 'POST' && endpoint.url.includes('sessions') ? {
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'test' }),
        } : {}),
      })
      console.log(`   ${endpoint.name}:`, res.status, res.ok ? '✅' : '❌')
    } catch (error) {
      console.log(`   ${endpoint.name}:`, '❌', error.message)
    }
  }

  console.log('\n📊 诊断结果汇总:')
  console.log(JSON.stringify(results, null, 2))
  
  return results
}

// ============================================
// 2. 快速检查（简化版）
// ============================================
async function quickCheck() {
  console.log('⚡ 快速检查...\n')
  
  // 检查会话列表
  try {
    const res = await fetch('/api/admin/chat/sessions')
    const data = await res.json()
    console.log('会话列表:', res.status, res.ok ? '✅' : '❌')
    console.log('数据:', data)
    if (!res.ok) {
      console.error('错误:', data.error)
      if (data.debug) console.error('调试:', data.debug)
    }
  } catch (error) {
    console.error('请求失败:', error)
  }
  
  // 尝试创建会话
  try {
    const res = await fetch('/api/admin/chat/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '快速测试' }),
    })
    const data = await res.json()
    console.log('\n创建会话:', res.status, res.ok ? '✅' : '❌')
    console.log('数据:', data)
    if (res.ok && data.data?.id) {
      // 删除测试会话
      await fetch(`/api/admin/chat/sessions?id=${data.data.id}`, {
        method: 'DELETE',
      })
      console.log('已清理测试会话')
    }
  } catch (error) {
    console.error('创建失败:', error)
  }
}

// ============================================
// 3. 测试创建会话
// ============================================
async function testCreateSession(title = '测试会话') {
  console.log('🧪 测试创建会话:', title)
  try {
    const res = await fetch('/api/admin/chat/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    })
    const data = await res.json()
    console.log('状态:', res.status)
    console.log('结果:', data)
    return data
  } catch (error) {
    console.error('失败:', error)
    return { error: error.message }
  }
}

// ============================================
// 4. 测试发送消息
// ============================================
async function testSendMessage(sessionId = null, message = '测试消息') {
  console.log('💬 测试发送消息...')
  try {
    const res = await fetch('/api/admin/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        message,
        stream: false,
        saveHistory: true,
      }),
    })
    
    let data
    try {
      data = await res.json()
    } catch (jsonError) {
      const text = await res.text()
      console.error('❌ JSON 解析失败')
      console.error('原始响应:', text.substring(0, 500))
      return { error: 'JSON 解析失败', rawResponse: text }
    }
    
    console.log('状态:', res.status)
    console.log('结果:', data)
    return data
  } catch (error) {
    console.error('失败:', error)
    return { error: error.message }
  }
}

// ============================================
// 5. 检查网络请求详情
// ============================================
async function checkNetworkDetails() {
  console.log('🌐 检查网络请求详情...\n')
  
  const endpoints = [
    '/api/admin/chat/sessions',
    '/api/admin/chat/debug',
  ]
  
  for (const endpoint of endpoints) {
    console.log(`检查: ${endpoint}`)
    try {
      const res = await fetch(endpoint)
      console.log('  状态:', res.status, res.statusText)
      console.log('  Headers:', Object.fromEntries(res.headers.entries()))
      
      const contentType = res.headers.get('content-type')
      if (contentType?.includes('application/json')) {
        const data = await res.json()
        console.log('  数据:', data)
      } else {
        const text = await res.text()
        console.log('  响应类型:', contentType)
        console.log('  内容预览:', text.substring(0, 200))
      }
    } catch (error) {
      console.error('  失败:', error)
    }
    console.log('')
  }
}

// ============================================
// 使用说明
// ============================================
console.log(`
╔══════════════════════════════════════════════════════════╗
║           聊天功能调试 Console 代码                      ║
╚══════════════════════════════════════════════════════════╝

📋 可用函数：

1. fullDiagnostics()      - 完整诊断（推荐）
2. quickCheck()           - 快速检查
3. testCreateSession()    - 测试创建会话
4. testSendMessage()      - 测试发送消息
5. checkNetworkDetails()  - 检查网络请求详情

🚀 快速开始：
   await fullDiagnostics()

💡 示例：
   await testCreateSession('我的测试会话')
   await testSendMessage(null, 'Hello')
   await quickCheck()

`)

// 导出函数到全局作用域
if (typeof window !== 'undefined') {
  window.fullDiagnostics = fullDiagnostics
  window.quickCheck = quickCheck
  window.testCreateSession = testCreateSession
  window.testSendMessage = testSendMessage
  window.checkNetworkDetails = checkNetworkDetails
}

