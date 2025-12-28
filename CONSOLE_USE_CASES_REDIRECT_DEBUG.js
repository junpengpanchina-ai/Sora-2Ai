// 使用场景页面跳转检测工具 - 检测自动刷新跳回首页的问题
// 粘贴到浏览器控制台运行

console.clear()
console.log('%c🔍 使用场景页面跳转检测工具', 'font-size: 16px; font-weight: bold; color: #ef4444;')
console.log('='.repeat(60))

// 首先保存所有原始函数，避免递归
if (!window._useCasesRedirectDebugOriginalConsoleLog) {
  window._useCasesRedirectDebugOriginalConsoleLog = console.log
}
if (!window._useCasesRedirectDebugOriginalConsoleError) {
  window._useCasesRedirectDebugOriginalConsoleError = console.error
}
if (!window._useCasesRedirectDebugOriginalConsoleWarn) {
  window._useCasesRedirectDebugOriginalConsoleWarn = console.warn
}

const originalConsoleLog = window._useCasesRedirectDebugOriginalConsoleLog
const originalConsoleError = window._useCasesRedirectDebugOriginalConsoleError
const originalConsoleWarn = window._useCasesRedirectDebugOriginalConsoleWarn

// 数据收集
const redirects = []
const navigationEvents = []
const locationChanges = []
const apiCalls = []
const errors = []
let eventCount = 0

// 1. 检测页面跳转（location.replace, location.assign, location.reload）
// 注意：location.href 设置无法直接拦截，但可以通过 URL 变化检测来捕获
const originalLocationReplace = window.location.replace
const originalLocationAssign = window.location.assign
const originalLocationReload = window.location.reload

window.location.replace = function(url) {
  const redirectInfo = {
    id: ++eventCount,
    type: 'LocationReplace',
    from: window.location.href,
    to: String(url),
    timestamp: new Date().toISOString(),
    stack: new Error().stack,
  }
  
  redirects.push(redirectInfo)
  originalConsoleError(`%c🚨 检测到 location.replace()`, 'color: red; font-weight: bold; font-size: 14px;')
  originalConsoleError('从:', redirectInfo.from)
  originalConsoleError('到:', redirectInfo.to)
  originalConsoleError('调用堆栈:', redirectInfo.stack)
  
  return originalLocationReplace.call(window.location, url)
}

window.location.assign = function(url) {
  const redirectInfo = {
    id: ++eventCount,
    type: 'LocationAssign',
    from: window.location.href,
    to: String(url),
    timestamp: new Date().toISOString(),
    stack: new Error().stack,
  }
  
  redirects.push(redirectInfo)
  originalConsoleWarn(`%c⚠️ 检测到 location.assign()`, 'color: orange; font-weight: bold;')
  originalConsoleWarn('从:', redirectInfo.from)
  originalConsoleWarn('到:', redirectInfo.to)
  originalConsoleWarn('调用堆栈:', redirectInfo.stack)
  
  return originalLocationAssign.call(window.location, url)
}

window.location.reload = function() {
  const reloadInfo = {
    id: ++eventCount,
    type: 'LocationReload',
    url: window.location.href,
    timestamp: new Date().toISOString(),
    stack: new Error().stack,
  }
  
  redirects.push(reloadInfo)
  originalConsoleWarn(`%c⚠️ 检测到 location.reload()`, 'color: orange; font-weight: bold;')
  originalConsoleWarn('URL:', reloadInfo.url)
  originalConsoleWarn('调用堆栈:', reloadInfo.stack)
  
  return originalLocationReload.call(window.location)
}

// 2. 检测 Next.js 路由跳转（router.push, router.replace）
let nextRouter = null
function interceptNextRouter() {
  // 尝试从 window 或 React 组件中获取 router
  if (typeof window !== 'undefined') {
    // 监听 Next.js 路由事件
    window.addEventListener('beforeunload', () => {
      const unloadInfo = {
        id: ++eventCount,
        type: 'BeforeUnload',
        url: window.location.href,
        timestamp: new Date().toISOString(),
      }
      navigationEvents.push(unloadInfo)
      originalConsoleWarn(`%c⚠️ 页面即将卸载`, 'color: yellow;')
      originalConsoleWarn('URL:', unloadInfo.url)
    })
    
    // 检测 popstate（浏览器前进/后退）
    window.addEventListener('popstate', (event) => {
      const popStateInfo = {
        id: ++eventCount,
        type: 'PopState',
        url: window.location.href,
        state: event.state,
        timestamp: new Date().toISOString(),
      }
      navigationEvents.push(popStateInfo)
      originalConsoleLog(`%c📄 popstate 事件`, 'color: blue;')
      originalConsoleLog('URL:', popStateInfo.url)
    })
  }
}

// 3. 检测 URL 变化（MutationObserver + history API）
let currentUrl = window.location.href
const urlCheckInterval = setInterval(() => {
  const newUrl = window.location.href
  if (newUrl !== currentUrl) {
    const urlChangeInfo = {
      id: ++eventCount,
      type: 'URLChange',
      from: currentUrl,
      to: newUrl,
      timestamp: new Date().toISOString(),
    }
    
    locationChanges.push(urlChangeInfo)
    
    // 检查是否是跳转到首页
    if (newUrl.endsWith('/') || newUrl.endsWith('/admin') || newUrl.includes('/admin?') || newUrl === window.location.origin + '/') {
      originalConsoleError(`%c🚨 检测到跳转到首页！`, 'color: red; font-weight: bold; font-size: 16px;')
      originalConsoleError('从:', currentUrl)
      originalConsoleError('到:', newUrl)
      originalConsoleError('时间:', new Date(urlChangeInfo.timestamp).toLocaleString())
      
      // 分析可能的原因
      if (currentUrl.includes('/admin') && currentUrl.includes('use-cases')) {
        originalConsoleError('⚠️ 从使用场景页面跳转到首页！')
        originalConsoleError('可能原因:')
        originalConsoleError('  - 认证失败导致重定向')
        originalConsoleError('  - 错误处理导致跳转')
        originalConsoleError('  - 自动刷新触发重定向')
      }
    } else {
      originalConsoleLog(`%c🔄 URL 变化`, 'color: cyan;')
      originalConsoleLog('从:', currentUrl)
      originalConsoleLog('到:', newUrl)
    }
    
    currentUrl = newUrl
  }
}, 100) // 每100ms检查一次

// 4. 检测使用场景相关的 API 调用
const originalFetch = window.fetch
if (!window._useCasesRedirectDebugOriginalFetch) {
  window._useCasesRedirectDebugOriginalFetch = window.fetch
}
window.fetch = function(...args) {
  const url = args[0]
  const startTime = Date.now()
  
  if (typeof url === 'string' && url.includes('/api/admin/use-cases')) {
    const apiInfo = {
      id: ++eventCount,
      type: 'UseCasesAPI',
      url,
      method: args[1]?.method || 'GET',
      timestamp: new Date().toISOString(),
      stack: new Error().stack,
    }
    
    apiCalls.push(apiInfo)
    originalConsoleLog(`%c📋 使用场景 API 调用 #${eventCount}`, 'color: blue; font-weight: bold;')
    originalConsoleLog('URL:', url)
    originalConsoleLog('方法:', apiInfo.method)
    
    // 包装响应以检测错误
    return window._useCasesRedirectDebugOriginalFetch.apply(this, args)
      .then((response) => {
        const duration = Date.now() - startTime
        apiInfo.duration = duration
        apiInfo.status = response.status
        apiInfo.ok = response.ok
        
        if (!response.ok) {
          apiInfo.hasError = true
          originalConsoleError(`%c❌ API 调用失败`, 'color: red;')
          originalConsoleError('URL:', url)
          originalConsoleError('状态:', response.status, response.statusText)
          
          // 检查是否是认证错误（可能导致跳转）
          if (response.status === 401 || response.status === 403) {
            originalConsoleError('⚠️ 认证错误！这可能导致页面跳转到登录页或首页')
            errors.push({
              id: ++eventCount,
              type: 'AuthError',
              url,
              status: response.status,
              timestamp: new Date().toISOString(),
            })
          }
          
          // 尝试读取错误详情
          response.clone().json().then((data) => {
            if (data.error || data.details) {
              originalConsoleError('错误详情:', data.error || data.details)
              apiInfo.errorDetails = data.error || data.details
              
              // 检查错误消息中是否包含重定向提示
              const errorMsg = String(data.error || data.details || '')
              if (errorMsg.includes('redirect') || errorMsg.includes('跳转') || errorMsg.includes('重定向')) {
                originalConsoleError('🚨 错误消息包含重定向提示！')
              }
            }
          }).catch(() => {
            // 忽略 JSON 解析错误
          })
        }
        
        return response
      })
      .catch((error) => {
        apiInfo.hasError = true
        apiInfo.networkError = error.message || String(error)
        originalConsoleError(`%c❌ API 网络错误`, 'color: red;')
        originalConsoleError('URL:', url)
        originalConsoleError('错误:', error.message || String(error))
        throw error
      })
  }
  
  return window._useCasesRedirectDebugOriginalFetch.apply(this, args)
}

// 5. 检测全局错误（可能导致页面跳转）
const originalOnError = window.onerror
window.onerror = function(message, source, lineno, colno, error) {
  const errorInfo = {
    id: ++eventCount,
    type: 'GlobalError',
    message: String(message),
    source,
    lineno,
    colno,
    error: error?.stack,
    timestamp: new Date().toISOString(),
    currentUrl: window.location.href,
  }
  
  errors.push(errorInfo)
  
  // 检查错误是否可能导致跳转
  const errorMsg = String(message || '')
  if (errorMsg.includes('redirect') || 
      errorMsg.includes('跳转') || 
      errorMsg.includes('unauthorized') ||
      errorMsg.includes('401') ||
      errorMsg.includes('403')) {
    originalConsoleError(`%c🚨 可能导致跳转的错误`, 'color: red; font-weight: bold; font-size: 14px;')
    originalConsoleError('错误:', errorMsg)
    originalConsoleError('当前 URL:', errorInfo.currentUrl)
    originalConsoleError('堆栈:', error?.stack)
  }
  
  if (originalOnError) {
    return originalOnError.apply(this, arguments)
  }
  return false
}

// 6. 检测 Promise 拒绝（可能导致跳转）
window.addEventListener('unhandledrejection', (event) => {
  const rejectionInfo = {
    id: ++eventCount,
    type: 'UnhandledRejection',
    reason: event.reason?.message || String(event.reason || ''),
    stack: event.reason?.stack,
    timestamp: new Date().toISOString(),
    currentUrl: window.location.href,
  }
  
  errors.push(rejectionInfo)
  
  const reasonMsg = String(rejectionInfo.reason || '')
  if (reasonMsg.includes('redirect') || 
      reasonMsg.includes('跳转') || 
      reasonMsg.includes('unauthorized') ||
      reasonMsg.includes('401') ||
      reasonMsg.includes('403')) {
    originalConsoleError(`%c🚨 未处理的 Promise 拒绝（可能导致跳转）`, 'color: red; font-weight: bold;')
    originalConsoleError('原因:', rejectionInfo.reason)
    originalConsoleError('当前 URL:', rejectionInfo.currentUrl)
  }
})

// 7. 检测页面可见性变化（可能导致刷新）
document.addEventListener('visibilitychange', () => {
  const visibilityInfo = {
    id: ++eventCount,
    type: 'VisibilityChange',
    hidden: document.hidden,
    visibilityState: document.visibilityState,
    url: window.location.href,
    timestamp: new Date().toISOString(),
  }
  
  navigationEvents.push(visibilityInfo)
  
  if (document.hidden) {
    originalConsoleLog(`%c👁️ 页面隐藏`, 'color: gray;')
  } else {
    originalConsoleLog(`%c👁️ 页面显示`, 'color: green;')
    originalConsoleLog('URL:', visibilityInfo.url)
    
    // 检查 URL 是否变化（可能被重定向了）
    if (visibilityInfo.url.endsWith('/') || visibilityInfo.url === window.location.origin + '/') {
      originalConsoleError(`%c🚨 页面显示时发现已跳转到首页！`, 'color: red; font-weight: bold;')
    }
  }
})

// 8. 生成详细报告
window.useCasesRedirectReport = function() {
  originalConsoleLog.clear()
  originalConsoleLog('%c📋 使用场景页面跳转检测报告', 'font-size: 18px; font-weight: bold; color: #00d4ff;')
  originalConsoleLog('='.repeat(60))
  
  originalConsoleLog('\n%c1. 统计信息', 'font-size: 14px; font-weight: bold; color: #4ecdc4;')
  originalConsoleLog(`总事件数: ${eventCount}`)
  originalConsoleLog(`跳转次数: ${redirects.length}`)
  originalConsoleLog(`导航事件: ${navigationEvents.length}`)
  originalConsoleLog(`URL 变化: ${locationChanges.length}`)
  originalConsoleLog(`API 调用: ${apiCalls.length}`)
  originalConsoleLog(`错误数量: ${errors.length}`)
  
  // 分析跳转到首页的情况
  const homeRedirects = redirects.filter(r => 
    r.to && (r.to.endsWith('/') || r.to === window.location.origin + '/' || r.to.includes('/admin'))
  )
  const homeUrlChanges = locationChanges.filter(l => 
    l.to && (l.to.endsWith('/') || l.to === window.location.origin + '/')
  )
  
  originalConsoleLog(`跳转到首页: ${homeRedirects.length + homeUrlChanges.length} 次`)
  
  originalConsoleLog('\n%c2. 跳转记录', 'font-size: 14px; font-weight: bold; color: #ff6b6b;')
  if (redirects.length === 0) {
    originalConsoleLog('✅ 未检测到直接跳转')
  } else {
    redirects.forEach((redirect, index) => {
      originalConsoleLog(`\n跳转 #${index + 1}:`)
      originalConsoleLog('  类型:', redirect.type)
      originalConsoleLog('  从:', redirect.from)
      originalConsoleLog('  到:', redirect.to)
      originalConsoleLog('  时间:', new Date(redirect.timestamp).toLocaleString())
      
      // 检查是否是从使用场景页面跳转
      if (redirect.from && redirect.from.includes('use-cases')) {
        originalConsoleError('  🚨 这是从使用场景页面的跳转！')
      }
      
      // 检查是否是跳转到首页
      if (redirect.to && (redirect.to.endsWith('/') || redirect.to === window.location.origin + '/')) {
        originalConsoleError('  🚨 跳转到首页！')
      }
    })
  }
  
  originalConsoleLog('\n%c3. URL 变化记录', 'font-size: 14px; font-weight: bold; color: #ffd93d;')
  if (locationChanges.length === 0) {
    originalConsoleLog('ℹ️ 未检测到 URL 变化')
  } else {
    const homeChanges = locationChanges.filter(l => 
      l.to && (l.to.endsWith('/') || l.to === window.location.origin + '/')
    )
    
    if (homeChanges.length > 0) {
      originalConsoleError(`❌ 检测到 ${homeChanges.length} 次跳转到首页:`)
      homeChanges.forEach((change, index) => {
        originalConsoleError(`\n跳转 #${index + 1}:`)
        originalConsoleError('  从:', change.from)
        originalConsoleError('  到:', change.to)
        originalConsoleError('  时间:', new Date(change.timestamp).toLocaleString())
        
        if (change.from && change.from.includes('use-cases')) {
          originalConsoleError('  🚨 从使用场景页面跳转到首页！')
        }
      })
    }
    
    originalConsoleLog(`\n所有 URL 变化 (${locationChanges.length} 次):`)
    locationChanges.slice(-20).forEach((change, index) => {
      originalConsoleLog(`  ${index + 1}. [${new Date(change.timestamp).toLocaleTimeString()}] ${change.from} → ${change.to}`)
    })
  }
  
  originalConsoleLog('\n%c4. API 调用记录', 'font-size: 14px; font-weight: bold; color: #95e1d3;')
  if (apiCalls.length === 0) {
    originalConsoleLog('ℹ️ 未检测到使用场景 API 调用')
  } else {
    const failedCalls = apiCalls.filter(a => a.hasError)
    originalConsoleLog(`共 ${apiCalls.length} 次 API 调用`)
    originalConsoleLog(`失败: ${failedCalls.length} 次`)
    
    if (failedCalls.length > 0) {
      originalConsoleError(`\n失败的 API 调用 (${failedCalls.length} 次):`)
      failedCalls.forEach((call, index) => {
        originalConsoleError(`\n失败 #${index + 1}:`)
        originalConsoleError('  URL:', call.url)
        originalConsoleError('  状态:', call.status)
        if (call.errorDetails) {
          originalConsoleError('  错误:', call.errorDetails)
        }
        if (call.networkError) {
          originalConsoleError('  网络错误:', call.networkError)
        }
        originalConsoleError('  时间:', new Date(call.timestamp).toLocaleString())
        
        // 检查是否在失败后发生了跳转
        const redirectsAfter = redirects.filter(r => 
          new Date(r.timestamp) > new Date(call.timestamp) &&
          new Date(r.timestamp) - new Date(call.timestamp) < 5000 // 5秒内
        )
        if (redirectsAfter.length > 0) {
          originalConsoleError(`  ⚠️ API 失败后 ${redirectsAfter.length} 秒内发生了跳转！`)
        }
      })
    }
  }
  
  originalConsoleLog('\n%c5. 错误记录', 'font-size: 14px; font-weight: bold; color: #ef4444;')
  if (errors.length === 0) {
    originalConsoleLog('✅ 未检测到错误')
  } else {
    originalConsoleError(`❌ 检测到 ${errors.length} 个错误:`)
    
    const authErrors = errors.filter(e => e.type === 'AuthError')
    if (authErrors.length > 0) {
      originalConsoleError(`\n认证错误 (${authErrors.length} 个):`)
      authErrors.forEach((error, index) => {
        originalConsoleError(`  ${index + 1}. [${new Date(error.timestamp).toLocaleTimeString()}] ${error.url} - 状态: ${error.status}`)
      })
    }
    
    const globalErrors = errors.filter(e => e.type === 'GlobalError')
    if (globalErrors.length > 0) {
      originalConsoleError(`\n全局错误 (${globalErrors.length} 个):`)
      globalErrors.slice(-10).forEach((error, index) => {
        originalConsoleError(`  ${index + 1}. [${new Date(error.timestamp).toLocaleTimeString()}] ${error.message}`)
      })
    }
  }
  
  originalConsoleLog('\n%c6. 时间线分析', 'font-size: 14px; font-weight: bold; color: #a8e6cf;')
  
  // 合并所有事件并按时间排序
  const allEvents = [
    ...redirects.map(r => ({ ...r, category: 'redirect' })),
    ...locationChanges.map(l => ({ ...l, category: 'urlChange' })),
    ...apiCalls.map(a => ({ ...a, category: 'api' })),
    ...errors.map(e => ({ ...e, category: 'error' })),
  ].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
  
  if (allEvents.length > 0) {
    originalConsoleLog('最近20个事件的时间线:')
    allEvents.slice(-20).forEach((event, index) => {
      const time = new Date(event.timestamp).toLocaleTimeString()
      const category = event.category
      let icon = '•'
      let color = 'gray'
      
      if (category === 'redirect') {
        icon = '🚨'
        color = 'red'
      } else if (category === 'urlChange') {
        icon = '🔄'
        color = 'cyan'
      } else if (category === 'api') {
        icon = event.hasError ? '❌' : '📋'
        color = event.hasError ? 'red' : 'blue'
      } else if (category === 'error') {
        icon = '⚠️'
        color = 'orange'
      }
      
      originalConsoleLog(`  ${index + 1}. [${time}] ${icon} ${category}:`, event)
    })
  }
  
  originalConsoleLog('\n%c7. 问题分析', 'font-size: 14px; font-weight: bold; color: #ff6b6b;')
  
  if (homeRedirects.length > 0 || homeUrlChanges.length > 0) {
    originalConsoleError('🚨 检测到跳转到首页的问题！')
    originalConsoleError('\n可能的原因:')
    
    // 检查是否在 API 失败后跳转
    const failedApiBeforeRedirect = apiCalls.filter(api => {
      if (!api.hasError) return false
      return redirects.some(r => 
        new Date(r.timestamp) > new Date(api.timestamp) &&
        new Date(r.timestamp) - new Date(api.timestamp) < 3000
      )
    })
    
    if (failedApiBeforeRedirect.length > 0) {
      originalConsoleError('  1. API 调用失败后触发跳转')
      originalConsoleError(`     - ${failedApiBeforeRedirect.length} 次 API 失败后发生跳转`)
    }
    
    // 检查认证错误
    const authErrors = errors.filter(e => e.type === 'AuthError')
    if (authErrors.length > 0) {
      originalConsoleError('  2. 认证错误导致跳转')
      originalConsoleError(`     - ${authErrors.length} 个认证错误`)
    }
    
    // 检查是否在页面可见性变化时跳转
    const visibilityChanges = navigationEvents.filter(e => e.type === 'VisibilityChange')
    const redirectsAfterVisibility = redirects.filter(r => {
      return visibilityChanges.some(v => 
        new Date(r.timestamp) > new Date(v.timestamp) &&
        new Date(r.timestamp) - new Date(v.timestamp) < 2000
      )
    })
    if (redirectsAfterVisibility.length > 0) {
      originalConsoleError('  3. 页面可见性变化时触发跳转')
    }
    
    originalConsoleError('\n建议检查:')
    originalConsoleError('  - 检查认证中间件是否在错误时重定向')
    originalConsoleError('  - 检查错误处理组件是否触发跳转')
    originalConsoleError('  - 检查自动刷新逻辑是否导致跳转')
    originalConsoleError('  - 检查 Next.js 路由守卫')
  } else {
    originalConsoleLog('✅ 未检测到跳转到首页的问题')
  }
  
  return {
    totalEvents: eventCount,
    redirects: redirects.length,
    homeRedirects: homeRedirects.length + homeUrlChanges.length,
    apiCalls: apiCalls.length,
    failedApiCalls: apiCalls.filter(a => a.hasError).length,
    errors: errors.length,
    authErrors: errors.filter(e => e.type === 'AuthError').length,
  }
}

// 9. 清理工具
window.useCasesRedirectClean = function() {
  // 恢复原始函数
  if (window._useCasesRedirectDebugOriginalFetch) {
    window.fetch = window._useCasesRedirectDebugOriginalFetch
  }
  if (originalLocationReplace) {
    window.location.replace = originalLocationReplace
  }
  if (originalLocationAssign) {
    window.location.assign = originalLocationAssign
  }
  if (originalLocationReload) {
    window.location.reload = originalLocationReload
  }
  if (originalOnError) {
    window.onerror = originalOnError
  }
  
  // 停止 URL 检查
  if (urlCheckInterval) {
    clearInterval(urlCheckInterval)
  }
  
  // 清空数据
  redirects.length = 0
  navigationEvents.length = 0
  locationChanges.length = 0
  apiCalls.length = 0
  errors.length = 0
  eventCount = 0
  
  originalConsoleLog('✅ 调试工具已清理')
}

// 启动拦截
interceptNextRouter()

// 标记已安装
window._useCasesRedirectDebugInstalled = true

originalConsoleLog('\n✅ 调试工具已启动')
originalConsoleLog('\n可用命令:')
originalConsoleLog('  useCasesRedirectReport()  - 查看详细报告')
originalConsoleLog('  useCasesRedirectClean()   - 清理调试工具')
originalConsoleLog('\n💡 工具会自动检测:')
originalConsoleLog('  - 页面跳转（location.href, replace, assign）')
originalConsoleLog('  - URL 变化')
originalConsoleLog('  - 使用场景 API 调用和错误')
originalConsoleLog('  - 认证错误')
originalConsoleLog('  - 全局错误和 Promise 拒绝')
originalConsoleLog('  - 页面可见性变化')
originalConsoleLog('\n📊 运行 useCasesRedirectReport() 查看完整分析\n')

// 记录初始 URL
originalConsoleLog('\n%c📊 初始状态', 'font-size: 12px; color: #888;')
originalConsoleLog('当前 URL:', window.location.href)
originalConsoleLog('页面路径:', window.location.pathname)

