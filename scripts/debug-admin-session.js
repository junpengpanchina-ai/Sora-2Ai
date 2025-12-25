/**
 * 管理员会话调试脚本
 * 在浏览器控制台中运行此脚本来诊断会话刷新失败的问题
 * 
 * 使用方法：
 * 1. 打开浏览器控制台 (F12)
 * 2. 复制整个脚本内容
 * 3. 粘贴到控制台并回车执行
 */

(async function debugAdminSession() {
  console.log('🔍 开始诊断管理员会话问题...\n')
  
  const results = {
    cookie: null,
    tokenHash: null,
    sessionValidation: null,
    refreshEndpoint: null,
    databaseRPC: null,
    networkStatus: null,
    errors: []
  }

  // 1. 检查 Cookie
  console.log('1️⃣ 检查 Cookie...')
  try {
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=')
      acc[key] = value
      return acc
    }, {})
    
    const adminToken = cookies['admin_session_token']
    if (adminToken) {
      results.cookie = {
        exists: true,
        length: adminToken.length,
        preview: adminToken.substring(0, 20) + '...'
      }
      console.log('✅ Cookie 存在:', results.cookie)
    } else {
      results.cookie = { exists: false }
      console.error('❌ Cookie 不存在')
      results.errors.push('admin_session_token cookie 不存在')
    }
  } catch (error) {
    console.error('❌ 检查 Cookie 失败:', error)
    results.errors.push(`Cookie 检查失败: ${error.message}`)
  }

  // 2. 检查网络连接
  console.log('\n2️⃣ 检查网络连接...')
  try {
    const networkTest = await fetch('/api/health', { method: 'GET' }).catch(() => null)
    if (networkTest) {
      results.networkStatus = { online: true, status: networkTest.status }
      console.log('✅ 网络连接正常')
    } else {
      // 尝试检查其他端点
      const testResponse = await fetch(window.location.origin, { method: 'HEAD' })
      results.networkStatus = { 
        online: true, 
        status: testResponse.status,
        note: '使用主页测试'
      }
      console.log('✅ 网络连接正常 (通过主页测试)')
    }
  } catch (error) {
    results.networkStatus = { online: false, error: error.message }
    console.error('❌ 网络连接失败:', error.message)
    results.errors.push(`网络连接失败: ${error.message}`)
  }

  // 3. 测试会话刷新端点
  console.log('\n3️⃣ 测试会话刷新端点...')
  try {
    const startTime = Date.now()
    const response = await fetch('/api/auth/admin-refresh-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    const endTime = Date.now()
    const responseTime = endTime - startTime
    
    let responseData = null
    try {
      responseData = await response.json()
    } catch (e) {
      responseData = { raw: await response.text() }
    }

    results.refreshEndpoint = {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      responseTime: `${responseTime}ms`,
      data: responseData,
      headers: {
        contentType: response.headers.get('content-type'),
        date: response.headers.get('date'),
      }
    }

    if (response.ok) {
      console.log('✅ 会话刷新端点正常:', results.refreshEndpoint)
    } else {
      console.error('❌ 会话刷新端点返回错误:', results.refreshEndpoint)
      results.errors.push(`会话刷新失败: ${response.status} ${response.statusText}`)
      
      // 详细错误信息
      if (responseData?.error) {
        console.error('   错误详情:', responseData.error)
        if (responseData?.details) {
          console.error('   详细信息:', responseData.details)
        }
        if (responseData?.code) {
          console.error('   错误代码:', responseData.code)
          if (responseData.code === 'SESSION_EXPIRED') {
            console.error('   ⚠️  会话已过期，需要重新登录')
          }
        }
      }
      
      // 针对 500 错误的特殊分析
      if (response.status === 500) {
        console.error('   🔍 500 错误可能原因分析:')
        console.error('      - 数据库 RPC 函数 admin_extend_session 调用失败')
        console.error('      - 会话在数据库中已过期（函数只更新未过期的会话）')
        console.error('      - 数据库连接问题')
        console.error('      - 权限不足')
      }
    }
  } catch (error) {
    results.refreshEndpoint = {
      error: error.message,
      type: error.name,
      stack: error.stack
    }
    console.error('❌ 会话刷新端点请求失败:', error)
    results.errors.push(`会话刷新请求失败: ${error.message}`)
    
    // 检查是否是网络错误
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      console.error('   ⚠️  这可能是网络连接问题')
      results.errors.push('网络连接问题: Failed to fetch')
    }
    
    // 检查是否是 CORS 错误
    if (error.message.includes('CORS') || error.message.includes('cross-origin')) {
      console.error('   ⚠️  这可能是 CORS 跨域问题')
      results.errors.push('CORS 跨域问题')
    }
  }

  // 4. 检查其他相关端点
  console.log('\n4️⃣ 检查其他相关端点...')
  const endpoints = [
    '/api/auth/admin-login',
    '/api/admin/batch-generation/status/test-task-id-12345', // 测试端点
  ]

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, { 
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5秒超时
      })
      console.log(`   ${endpoint}: ${response.status} ${response.statusText}`)
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn(`   ${endpoint}: 请求超时`)
      } else {
        console.warn(`   ${endpoint}: ${error.message}`)
      }
    }
  }

  // 5. 检查浏览器环境
  console.log('\n5️⃣ 检查浏览器环境...')
  const browserInfo = {
    userAgent: navigator.userAgent,
    cookieEnabled: navigator.cookieEnabled,
    onLine: navigator.onLine,
    language: navigator.language,
    platform: navigator.platform,
    url: window.location.href,
    origin: window.location.origin,
  }
  console.log('浏览器信息:', browserInfo)
  results.browserInfo = browserInfo

  // 6. 检查是否有扩展程序干扰
  console.log('\n6️⃣ 检查扩展程序干扰...')
  const extensionErrors = []
  const originalError = window.onerror
  window.onerror = (message, source, lineno, colno, error) => {
    if (source && source.includes('content-script')) {
      extensionErrors.push({
        message,
        source,
        lineno,
        colno
      })
    }
    if (originalError) {
      originalError(message, source, lineno, colno, error)
    }
  }

  // 7. 检查 localStorage 和 sessionStorage
  console.log('\n7️⃣ 检查存储...')
  try {
    const localStorageData = {}
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        localStorageData[key] = localStorage.getItem(key)?.substring(0, 50) + '...'
      }
    }
    console.log('localStorage:', localStorageData)
    results.storage = { localStorage: localStorageData }
    
    // 检查批量生成任务 ID
    const lastBatchTaskId = localStorage.getItem('lastBatchTaskId')
    if (lastBatchTaskId) {
      console.log('   发现批量生成任务 ID:', lastBatchTaskId)
      results.lastBatchTaskId = lastBatchTaskId
      
      // 尝试获取任务状态
      try {
        const taskResponse = await fetch(`/api/admin/batch-generation/status/${lastBatchTaskId}`)
        if (taskResponse.ok) {
          const taskData = await taskResponse.json()
          console.log('   任务状态:', taskData.status || '未知')
          results.batchTaskStatus = taskData
        } else {
          console.warn('   无法获取任务状态:', taskResponse.status)
        }
      } catch (taskError) {
        console.warn('   获取任务状态失败:', taskError.message)
      }
    }
  } catch (error) {
    console.warn('检查存储失败:', error)
  }

  // 8. 生成诊断报告
  console.log('\n' + '='.repeat(60))
  console.log('📊 诊断报告')
  console.log('='.repeat(60))
  
  console.log('\n✅ 正常项目:')
  if (results.cookie?.exists) console.log('  - Cookie 存在')
  if (results.networkStatus?.online) console.log('  - 网络连接正常')
  if (results.refreshEndpoint?.ok) console.log('  - 会话刷新端点正常')
  
  console.log('\n❌ 问题项目:')
  if (results.errors.length === 0) {
    console.log('  - 未发现明显问题')
  } else {
    results.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`)
    })
  }

  console.log('\n📋 详细结果:')
  console.log(JSON.stringify(results, null, 2))

  // 9. 提供修复建议
  console.log('\n💡 修复建议:')
  
  if (!results.cookie?.exists) {
    console.log('  1. Cookie 不存在，请重新登录')
  }
  
  if (!results.networkStatus?.online) {
    console.log('  2. 网络连接问题，请检查:')
    console.log('     - 网络连接是否正常')
    console.log('     - 是否有防火墙或代理阻止')
    console.log('     - DNS 解析是否正常')
  }
  
  if (results.refreshEndpoint?.status === 500) {
    console.log('  3. 服务器返回 500 错误，可能原因:')
    console.log('     - 数据库连接问题')
    console.log('     - RPC 函数 admin_extend_session 不存在或权限不足')
    console.log('     - 会话已过期（函数只更新未过期的会话）')
    console.log('     - 服务器日志可能有更详细的错误信息')
    console.log('')
    console.log('   💡 解决方案:')
    console.log('     1. 检查服务器日志（Vercel/服务器控制台）')
    console.log('     2. 确认数据库迁移已执行（008_add_admin_extend_session.sql）')
    console.log('     3. 重新登录以创建新会话')
    console.log('     4. 如果问题持续，检查数据库连接配置')
  }
  
  if (results.refreshEndpoint?.status === 401) {
    console.log('  4. 会话已过期，请重新登录')
    console.log('')
    console.log('   💡 解决方案:')
    console.log('     执行以下命令清除会话并重新登录:')
    console.log('     document.cookie = "admin_session_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/";')
    console.log('     window.location.href = "/admin/login";')
  }
  
  // 检查批量生成任务
  if (results.lastBatchTaskId) {
    console.log('  6. 发现批量生成任务，状态:', results.batchTaskStatus?.status || '未知')
    if (results.batchTaskStatus?.status === 'processing') {
      console.log('     ⚠️  任务仍在进行中，会话刷新失败可能影响任务进度')
      console.log('     💡 建议: 检查任务是否仍在正常运行')
    }
  }

  if (extensionErrors.length > 0) {
    console.log('  5. 检测到浏览器扩展程序错误:')
    console.log('     - 这些错误通常不影响应用功能')
    console.log('     - 可以尝试禁用扩展程序后重试')
  }

  console.log('\n🔧 快速修复命令:')
  console.log('')
  console.log('  // 1. 清除 Cookie 并重新登录')
  console.log('  document.cookie = "admin_session_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/";')
  console.log('  window.location.href = "/admin/login";')
  console.log('')
  console.log('  // 2. 手动测试会话刷新')
  console.log('  fetch("/api/auth/admin-refresh-session", { method: "POST" })')
  console.log('    .then(r => r.json())')
  console.log('    .then(console.log)')
  console.log('    .catch(console.error)')
  console.log('')
  console.log('  // 3. 检查批量生成任务状态（如果有）')
  if (results.lastBatchTaskId) {
    console.log(`  fetch("/api/admin/batch-generation/status/${results.lastBatchTaskId}")`)
    console.log('    .then(r => r.json())')
    console.log('    .then(data => console.log("任务状态:", data))')
    console.log('    .catch(console.error)')
  } else {
    console.log('  // 没有发现批量生成任务')
  }
  console.log('')
  console.log('  // 4. 一键修复：清除会话并跳转登录（复制整行执行）')
  console.log('  (() => { document.cookie = "admin_session_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/"; window.location.href = "/admin/login"; })();')

  return results
})().then(results => {
  console.log('\n✅ 诊断完成！结果已保存在变量中')
  console.log('   使用 window.debugResults 查看完整结果')
  window.debugResults = results
}).catch(error => {
  console.error('❌ 诊断脚本执行失败:', error)
})


