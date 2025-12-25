// ============================================
// 聊天功能调试 Console 代码（完整版，可直接粘贴）
// ============================================

// 1. 完整诊断函数
async function fullDiagnostics() {
  console.log('🔍 开始完整诊断...\n')
  const results = {
    timestamp: new Date().toISOString(),
    checks: {},
  }

  // 1.1 检查认证和会话列表
  console.log('1️⃣ 检查会话列表...')
  try {
    const authRes = await fetch('/api/admin/chat/sessions')
    const authData = await authRes.json()
    results.checks.auth = {
      status: authRes.status,
      success: authRes.ok,
      hasData: !!authData,
      error: authData.error || null,
      debug: authData.debug || null,
    }
    console.log('   状态:', authRes.status, authRes.ok ? '✅' : '❌')
    if (authData.error) {
      console.log('   ❌ 错误:', authData.error)
      if (authData.debug) {
        console.log('   🔍 调试信息:', authData.debug)
        console.log('   完整调试:', JSON.stringify(authData.debug, null, 2))
      }
    } else {
      console.log('   ✅ 成功，会话数:', authData.data?.length || 0)
    }
  } catch (error) {
    results.checks.auth = { error: error.message }
    console.log('   ❌ 请求失败:', error.message)
  }

  // 1.2 测试创建会话
  console.log('\n2️⃣ 测试创建会话...')
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
      debug: createData.debug || null,
    }
    console.log('   状态:', createRes.status, createRes.ok ? '✅' : '❌')
    if (createData.data) {
      console.log('   ✅ 会话ID:', createData.data.id)
    }
    if (createData.error) {
      console.log('   ❌ 错误:', createData.error)
      if (createData.debug) {
        console.log('   🔍 调试信息:', JSON.stringify(createData.debug, null, 2))
      }
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
    console.log('   ❌ 请求失败:', error.message)
  }

  // 1.3 测试发送消息
  console.log('\n3️⃣ 测试发送消息...')
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
          rawResponse: text.substring(0, 500),
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
        console.log('   ✅ 响应长度:', messageData.content.length, '字符')
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
        sessionDebug: sessionData.debug,
      }
      console.log('   ❌ 无法创建测试会话')
      if (sessionData.error) console.log('   错误:', sessionData.error)
      if (sessionData.debug) console.log('   调试:', JSON.stringify(sessionData.debug, null, 2))
    }
  } catch (error) {
    results.checks.sendMessage = { error: error.message }
    console.log('   ❌ 请求失败:', error.message)
  }

  console.log('\n📊 诊断结果汇总:')
  console.log(JSON.stringify(results, null, 2))
  
  return results
}

// 2. 快速检查
async function quickCheck() {
  console.log('⚡ 快速检查...\n')
  
  try {
    const res = await fetch('/api/admin/chat/sessions')
    const data = await res.json()
    console.log('会话列表:', res.status, res.ok ? '✅' : '❌')
    console.log('完整响应:', JSON.stringify(data, null, 2))
    if (!res.ok && data.debug) {
      console.log('🔍 调试信息:', JSON.stringify(data.debug, null, 2))
    }
  } catch (error) {
    console.error('请求失败:', error)
  }
}

// 3. 测试创建会话
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
    console.log('完整响应:', JSON.stringify(data, null, 2))
    if (data.debug) {
      console.log('调试信息:', JSON.stringify(data.debug, null, 2))
    }
    return data
  } catch (error) {
    console.error('失败:', error)
    return { error: error.message }
  }
}

// 4. 测试发送消息
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
    console.log('完整响应:', JSON.stringify(data, null, 2))
    return data
  } catch (error) {
    console.error('失败:', error)
    return { error: error.message }
  }
}

console.log(`
╔══════════════════════════════════════════════════════════╗
║           聊天功能调试 Console 代码                      ║
╚══════════════════════════════════════════════════════════╝

✅ 所有函数已加载！

📋 可用函数：
1. fullDiagnostics()      - 完整诊断（推荐）
2. quickCheck()           - 快速检查
3. testCreateSession()    - 测试创建会话
4. testSendMessage()     - 测试发送消息

🚀 快速开始：
   await fullDiagnostics()

💡 示例：
   await testCreateSession('我的测试会话')
   await testSendMessage(null, 'Hello')
   await quickCheck()

`)

