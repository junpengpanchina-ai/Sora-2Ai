// ============================================
// OAuth Exchange 网络请求调试工具
// 用于捕获和显示 token exchange 请求的详细信息
// ============================================

(function() {
  console.log('🔍 OAuth Exchange 网络请求调试工具已启动...\n')
  
  // 存储捕获的请求
  const capturedRequests = []
  
  // 保存原始的 fetch
  const originalFetch = window.fetch
  
  // 拦截 fetch 请求
  window.fetch = function(...args) {
    const url = args[0]
    const options = args[1] || {}
    
    // 检查是否是 Supabase auth token exchange 请求
    const isTokenExchange = 
      typeof url === 'string' && (
        url.includes('/auth/v1/token') ||
        url.includes('/auth/v1/callback') ||
        url.includes('grant_type=pkce') ||
        url.includes('exchange') ||
        (url.includes('supabase') && url.includes('auth'))
      )
    
    if (isTokenExchange) {
      const requestInfo = {
        timestamp: new Date().toISOString(),
        url: url,
        method: options.method || 'GET',
        headers: options.headers || {},
        body: options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : null,
      }
      
      console.log('🔍 [Network] 捕获到 OAuth 相关请求:')
      console.log('   URL:', requestInfo.url)
      console.log('   Method:', requestInfo.method)
      console.log('   Headers:', requestInfo.headers)
      if (requestInfo.body) {
        console.log('   Body:', requestInfo.body.substring(0, 200))
      }
      
      const startTime = Date.now()
      
      return originalFetch.apply(this, args)
        .then(async (response) => {
          const duration = Date.now() - startTime
          
          // 克隆响应以便读取
          const clonedResponse = response.clone()
          
          let responseBody = null
          let responseText = null
          
          try {
            responseText = await clonedResponse.text()
            try {
              responseBody = JSON.parse(responseText)
            } catch (e) {
              // 不是 JSON，使用文本
              responseBody = responseText
            }
          } catch (e) {
            responseText = '无法读取响应'
          }
          
          const responseInfo = {
            ...requestInfo,
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            duration: `${duration}ms`,
            responseHeaders: Object.fromEntries(response.headers.entries()),
            responseBody: responseBody,
            responseText: responseText?.substring(0, 500),
          }
          
          capturedRequests.push(responseInfo)
          
          console.log('\n📊 [Network] OAuth 请求响应:')
          console.log('   Status Code:', responseInfo.status, responseInfo.statusText)
          console.log('   Duration:', responseInfo.duration)
          console.log('   OK:', responseInfo.ok)
          
          if (responseBody) {
            if (typeof responseBody === 'object') {
              console.log('   Response Body:', JSON.stringify(responseBody, null, 2))
              
              // 提取关键错误信息
              if (responseBody.error) {
                console.error('\n❌ [Network] 错误详情:')
                console.error('   error:', responseBody.error)
                if (responseBody.error_description) {
                  console.error('   error_description:', responseBody.error_description)
                }
                if (responseBody.error_code) {
                  console.error('   error_code:', responseBody.error_code)
                }
                
                // 根据错误类型提供诊断建议
                console.error('\n💡 [Network] 诊断建议:')
                if (responseBody.error === 'invalid_client') {
                  console.error('   ⚠️  Google Client ID/Secret 配置错误')
                  console.error('   ✅ 检查: Supabase Dashboard → Authentication → Providers → Google')
                  console.error('   ✅ 检查: Google Cloud Console → OAuth client credentials')
                } else if (responseBody.error === 'redirect_uri_mismatch' || responseBody.error_description?.includes('redirect')) {
                  console.error('   ⚠️  重定向 URL 不匹配')
                  console.error('   ✅ 检查: Google Cloud Console → Authorized redirect URIs')
                  console.error('   ✅ 必须包含: https://<project-ref>.supabase.co/auth/v1/callback')
                } else if (responseBody.error === 'invalid_grant' || responseBody.error_description?.includes('already redeemed')) {
                  console.error('   ⚠️  Code 已过期或被重复使用')
                  console.error('   ✅ 检查: 是否多次执行 exchangeCodeForSession')
                } else if (responseBody.error_description?.includes('Unable to exchange external code')) {
                  console.error('   ⚠️  Supabase 无法与 Google 交换 token')
                  console.error('   ✅ 检查: Supabase Dashboard → Logs Explorer')
                  console.error('   ✅ 检查: Google Cloud Console → OAuth client 状态')
                }
              }
            } else {
              console.log('   Response Text:', responseBody.substring(0, 500))
            }
          }
          
          console.log('\n' + '='.repeat(60) + '\n')
          
          return response
        })
        .catch((error) => {
          const errorInfo = {
            ...requestInfo,
            error: error.message,
            errorStack: error.stack,
          }
          
          capturedRequests.push(errorInfo)
          
          console.error('\n❌ [Network] 请求失败:')
          console.error('   URL:', errorInfo.url)
          console.error('   Error:', errorInfo.error)
          console.error('\n' + '='.repeat(60) + '\n')
          
          throw error
        })
    }
    
    // 非 OAuth 请求，正常处理
    return originalFetch.apply(this, args)
  }
  
  // 提供查看捕获请求的函数
  window.showOAuthRequests = function() {
    console.log('📋 已捕获的 OAuth 请求:', capturedRequests.length)
    if (capturedRequests.length > 0) {
      console.table(capturedRequests.map(req => ({
        timestamp: req.timestamp,
        url: req.url?.substring(0, 80) || 'N/A',
        status: req.status || 'N/A',
        duration: req.duration || 'N/A',
        error: req.error || (req.responseBody?.error || 'N/A'),
      })))
      
      console.log('\n详细请求信息:')
      capturedRequests.forEach((req, index) => {
        console.log(`\n请求 #${index + 1}:`)
        console.log(JSON.stringify(req, null, 2))
      })
    } else {
      console.log('还没有捕获到 OAuth 请求')
      console.log('💡 提示: 打开无痕窗口 → /login → 点击 Google 登录')
    }
    return capturedRequests
  }
  
  // 清除捕获的请求
  window.clearOAuthRequests = function() {
    const count = capturedRequests.length
    capturedRequests.length = 0
    console.log(`✅ 已清除 ${count} 个捕获的请求`)
  }
  
  console.log(`
╔══════════════════════════════════════════════════════════╗
║    OAuth Exchange 网络请求调试工具（已启动）            ║
╚══════════════════════════════════════════════════════════╝

✅ 网络请求拦截已启用

📋 可用命令：
   showOAuthRequests()    - 查看所有捕获的 OAuth 请求
   clearOAuthRequests()   - 清除捕获的请求记录

💡 使用方法：
   1. 打开无痕窗口（避免缓存干扰）
   2. 访问 /login 页面
   3. 点击"使用 Google 账号登录"
   4. 完成授权后，回到站点
   5. 运行 showOAuthRequests() 查看捕获的请求详情

🔍 工具会自动捕获：
   - Request URL（请求 URL）
   - Status Code（状态码）
   - Response Body（响应体，包含 error / error_description）
   - Request Headers（请求头）
   - Duration（请求耗时）

`)
})()

