/**
 * Google Translate API CORS 错误检测工具
 * 用于检测和诊断 Google Translate API 相关的 CORS 错误、网络请求失败和未捕获的 Promise 错误
 * 
 * 使用方法：
 * 1. 打开浏览器控制台（F12）
 * 2. 复制整个文件内容
 * 3. 粘贴到控制台并回车
 * 4. 工具会自动开始监控
 * 
 * 可用命令：
 * - translateCorsReport() - 查看详细报告
 * - translateCorsClean() - 清理调试工具
 */

(function() {
  'use strict'
  
  // 如果已经加载过，先清理
  if (window._translateCorsDebugLoaded) {
    if (window._translateCorsDebugClean) {
      window._translateCorsDebugClean()
    }
  }
  
  // 保存原始函数
  const originalConsoleError = window.console.error.bind(window.console)
  const originalConsoleWarn = window.console.warn.bind(window.console)
  const originalFetch = window.fetch.bind(window)
  const originalXHROpen = XMLHttpRequest.prototype.open
  const originalXHRSend = XMLHttpRequest.prototype.send
  
  // 数据收集
  const corsErrors = []
  const networkErrors = []
  const promiseErrors = []
  const translateRequests = []
  const xhrRequests = []
  let eventCount = 0
  
  // 保存到 window 以便外部访问
  window._translateCorsDebugLoaded = true
  window._translateCorsDebugOriginalConsoleError = originalConsoleError
  window._translateCorsDebugOriginalConsoleWarn = originalConsoleWarn
  
  // 拦截 console.error
  window.console.error = function(...args) {
    const message = args.map(arg => String(arg)).join(' ')
    
    // 跳过报告函数自身的输出（避免误判）
    if (message.includes('Google Translate CORS 错误报告') || 
        message.includes('translateCorsReport') ||
        message.includes('问题分析') ||
        message.includes('摘要:')) {
      return originalConsoleError(...args)
    }
    
    // 检测 CORS 错误
    if (message.includes('CORS') || message.includes('Access-Control-Allow-Origin')) {
      const errorInfo = {
        id: ++eventCount,
        type: 'CORS_ERROR',
        message: message,
        timestamp: new Date().toISOString(),
        stack: new Error().stack,
        url: window.location.href,
        tab: new URLSearchParams(window.location.search).get('tab') || 'unknown',
      }
      
      corsErrors.push(errorInfo)
      originalConsoleError('%c🚫 CORS 错误检测', 'color: red; font-weight: bold; font-size: 14px;', ...args)
      originalConsoleError('详细信息:', errorInfo)
    }
    // 检测 Google Translate 相关错误
    else if (message.includes('translate') || message.includes('googleapis.com')) {
      const errorInfo = {
        id: ++eventCount,
        type: 'TRANSLATE_ERROR',
        message: message,
        timestamp: new Date().toISOString(),
        stack: new Error().stack,
        url: window.location.href,
      }
      
      translateRequests.push(errorInfo)
      originalConsoleError('%c🌐 Google Translate 错误', 'color: orange; font-weight: bold;', ...args)
    }
    // 检测网络错误
    else if (message.includes('Failed to load resource') || message.includes('ERR_FAILED') || message.includes('net::')) {
      const errorInfo = {
        id: ++eventCount,
        type: 'NETWORK_ERROR',
        message: message,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        tab: new URLSearchParams(window.location.search).get('tab') || 'unknown',
      }
      
      networkErrors.push(errorInfo)
      originalConsoleError('%c📡 网络错误检测', 'color: red; font-weight: bold;', ...args)
    }
    // 检测未捕获的 Promise 错误
    else if (message.includes('Uncaught (in promise)') || message.includes('UnhandledPromiseRejection')) {
      const errorInfo = {
        id: ++eventCount,
        type: 'PROMISE_ERROR',
        message: message,
        timestamp: new Date().toISOString(),
        stack: new Error().stack,
        url: window.location.href,
        tab: new URLSearchParams(window.location.search).get('tab') || 'unknown',
      }
      
      promiseErrors.push(errorInfo)
      originalConsoleError('%c⚠️ Promise 错误检测', 'color: orange; font-weight: bold;', ...args)
      originalConsoleError('详细信息:', errorInfo)
    }
    else {
      // 其他错误正常输出
      originalConsoleError(...args)
    }
  }
  
  // 拦截 console.warn
  window.console.warn = function(...args) {
    const message = args.map(arg => String(arg)).join(' ')
    
    // 检测 CORS 相关警告
    if (message.includes('CORS') || message.includes('Access-Control')) {
      const warningInfo = {
        id: ++eventCount,
        type: 'CORS_WARNING',
        message: message,
        timestamp: new Date().toISOString(),
        url: window.location.href,
      }
      
      corsErrors.push(warningInfo)
      originalConsoleWarn('%c⚠️ CORS 警告', 'color: orange; font-weight: bold;', ...args)
    }
    else {
      originalConsoleWarn(...args)
    }
  }
  
  // 拦截 fetch
  window.fetch = function(...args) {
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || 'unknown'
    const startTime = Date.now()
    
    // 检测 Google Translate API 请求
    if (url.includes('translate') || url.includes('googleapis.com')) {
      const requestInfo = {
        id: ++eventCount,
        type: 'TRANSLATE_FETCH',
        url: url,
        method: args[1]?.method || 'GET',
        timestamp: new Date().toISOString(),
        tab: new URLSearchParams(window.location.search).get('tab') || 'unknown',
      }
      
      translateRequests.push(requestInfo)
      originalConsoleWarn('%c🌐 Google Translate API 请求', 'color: blue; font-weight: bold;', url)
      
      return originalFetch(...args)
        .then(response => {
          const duration = Date.now() - startTime
          requestInfo.duration = duration
          requestInfo.status = response.status
          requestInfo.ok = response.ok
          
          if (!response.ok) {
            originalConsoleError('%c❌ Google Translate API 请求失败', 'color: red; font-weight: bold;', {
              url,
              status: response.status,
              statusText: response.statusText,
              duration: `${duration}ms`,
            })
          } else {
            originalConsoleWarn('%c✅ Google Translate API 请求成功', 'color: green;', {
              url,
              status: response.status,
              duration: `${duration}ms`,
            })
          }
          
          return response
        })
        .catch(error => {
          const duration = Date.now() - startTime
          requestInfo.duration = duration
          requestInfo.error = error.message
          requestInfo.errorType = error.name
          
          const errorInfo = {
            id: ++eventCount,
            type: 'TRANSLATE_FETCH_ERROR',
            url: url,
            error: error.message,
            errorType: error.name,
            timestamp: new Date().toISOString(),
            duration: duration,
            tab: new URLSearchParams(window.location.search).get('tab') || 'unknown',
          }
          
          networkErrors.push(errorInfo)
          originalConsoleError('%c❌ Google Translate API 请求异常', 'color: red; font-weight: bold;', errorInfo)
          
          throw error
        })
    }
    
    return originalFetch(...args)
  }
  
  // 拦截 XMLHttpRequest
  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    this._translateCorsDebugUrl = url
    this._translateCorsDebugMethod = method
    this._translateCorsDebugStartTime = Date.now()
    
    // 检测 Google Translate API 请求
    if (url.includes('translate') || url.includes('googleapis.com')) {
      const requestInfo = {
        id: ++eventCount,
        type: 'TRANSLATE_XHR',
        url: url,
        method: method,
        timestamp: new Date().toISOString(),
        tab: new URLSearchParams(window.location.search).get('tab') || 'unknown',
      }
      
      xhrRequests.push(requestInfo)
      this._translateCorsDebugRequestInfo = requestInfo
      originalConsoleWarn('%c🌐 Google Translate XHR 请求', 'color: blue; font-weight: bold;', { method, url })
    }
    
    return originalXHROpen.call(this, method, url, ...rest)
  }
  
  XMLHttpRequest.prototype.send = function(...args) {
    const xhr = this
    
    // 监听 XHR 事件
    if (xhr._translateCorsDebugUrl && (xhr._translateCorsDebugUrl.includes('translate') || xhr._translateCorsDebugUrl.includes('googleapis.com'))) {
      xhr.addEventListener('error', function() {
        const duration = Date.now() - (xhr._translateCorsDebugStartTime || Date.now())
        const errorInfo = {
          id: ++eventCount,
          type: 'TRANSLATE_XHR_ERROR',
          url: xhr._translateCorsDebugUrl,
          method: xhr._translateCorsDebugMethod,
          error: 'XHR error event',
          timestamp: new Date().toISOString(),
          duration: duration,
          tab: new URLSearchParams(window.location.search).get('tab') || 'unknown',
        }
        
        networkErrors.push(errorInfo)
        if (xhr._translateCorsDebugRequestInfo) {
          xhr._translateCorsDebugRequestInfo.error = 'XHR error event'
          xhr._translateCorsDebugRequestInfo.duration = duration
        }
        
        originalConsoleError('%c❌ Google Translate XHR 错误', 'color: red; font-weight: bold;', errorInfo)
      })
      
      xhr.addEventListener('load', function() {
        const duration = Date.now() - (xhr._translateCorsDebugStartTime || Date.now())
        if (xhr._translateCorsDebugRequestInfo) {
          xhr._translateCorsDebugRequestInfo.duration = duration
          xhr._translateCorsDebugRequestInfo.status = xhr.status
          xhr._translateCorsDebugRequestInfo.ok = xhr.status >= 200 && xhr.status < 300
        }
        
        if (xhr.status >= 400) {
          originalConsoleError('%c❌ Google Translate XHR 失败', 'color: red; font-weight: bold;', {
            url: xhr._translateCorsDebugUrl,
            status: xhr.status,
            statusText: xhr.statusText,
            duration: `${duration}ms`,
          })
        }
      })
    }
    
    return originalXHRSend.apply(this, args)
  }
  
  // 全局错误处理
  const originalOnError = window.onerror
  window.onerror = function(message, source, lineno, colno, error) {
    const errorMessage = String(message)
    
    // 检测 CORS 或 Google Translate 相关错误
    if (errorMessage.includes('CORS') || 
        errorMessage.includes('translate') || 
        errorMessage.includes('googleapis.com') ||
        errorMessage.includes('Access-Control')) {
      const errorInfo = {
        id: ++eventCount,
        type: 'GLOBAL_ERROR',
        message: errorMessage,
        source: source,
        lineno: lineno,
        colno: colno,
        error: error?.stack || error?.message,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        tab: new URLSearchParams(window.location.search).get('tab') || 'unknown',
      }
      
      if (errorMessage.includes('CORS')) {
        corsErrors.push(errorInfo)
      } else {
        networkErrors.push(errorInfo)
      }
      
      originalConsoleError('%c🚨 全局错误检测', 'color: red; font-weight: bold; font-size: 14px;', errorInfo)
    }
    
    if (originalOnError) {
      return originalOnError(message, source, lineno, colno, error)
    }
    return false
  }
  
  // Promise 拒绝处理
  const originalUnhandledRejection = window.onunhandledrejection
  window.addEventListener('unhandledrejection', function(event) {
    const reason = event.reason
    const reasonStr = reason?.message || String(reason) || 'Unknown'
    
    // 检测 Google Translate 相关的 Promise 错误
    if (reasonStr.includes('translate') || 
        reasonStr.includes('googleapis.com') ||
        reasonStr.includes('CORS') ||
        reasonStr.includes('hd')) {
      const errorInfo = {
        id: ++eventCount,
        type: 'UNHANDLED_PROMISE_REJECTION',
        reason: reasonStr,
        error: reason?.stack || reason?.message || String(reason),
        timestamp: new Date().toISOString(),
        url: window.location.href,
        tab: new URLSearchParams(window.location.search).get('tab') || 'unknown',
      }
      
      promiseErrors.push(errorInfo)
      originalConsoleError('%c⚠️ 未处理的 Promise 拒绝', 'color: orange; font-weight: bold; font-size: 14px;', errorInfo)
      
      // 如果是 CORS 相关，也添加到 CORS 错误列表
      if (reasonStr.includes('CORS') || reasonStr.includes('Access-Control')) {
        corsErrors.push(errorInfo)
      }
    }
    
    if (originalUnhandledRejection) {
      originalUnhandledRejection(event)
    }
  })
  
  // 报告函数
  window.translateCorsReport = function() {
    const report = {
      summary: {
        totalCorsErrors: corsErrors.length,
        totalNetworkErrors: networkErrors.length,
        totalPromiseErrors: promiseErrors.length,
        totalTranslateRequests: translateRequests.length,
        totalXhrRequests: xhrRequests.length,
        currentUrl: window.location.href,
        currentTab: new URLSearchParams(window.location.search).get('tab') || 'unknown',
        timestamp: new Date().toISOString(),
      },
      corsErrors: corsErrors,
      networkErrors: networkErrors,
      promiseErrors: promiseErrors,
      translateRequests: translateRequests,
      xhrRequests: xhrRequests,
    }
    
    // 使用 console.log 输出报告标题，避免被错误拦截器捕获
    const originalConsoleLog = window.console.log.bind(window.console)
    originalConsoleLog('%c📊 Google Translate CORS 错误报告', 'color: blue; font-weight: bold; font-size: 16px; background: #f0f0f0; padding: 10px;')
    originalConsoleLog('='.repeat(80))
    originalConsoleLog('📋 摘要:', report.summary)
    originalConsoleLog('='.repeat(80))
    
    if (corsErrors.length > 0) {
      originalConsoleLog('%c🚫 CORS 错误 (' + corsErrors.length + ' 个)', 'color: red; font-weight: bold; font-size: 14px;')
      corsErrors.forEach((error, index) => {
        originalConsoleLog(`  ${index + 1}. [${error.timestamp}] ${error.type}:`, error)
      })
    }
    
    if (networkErrors.length > 0) {
      originalConsoleLog('%c📡 网络错误 (' + networkErrors.length + ' 个)', 'color: red; font-weight: bold; font-size: 14px;')
      networkErrors.forEach((error, index) => {
        originalConsoleLog(`  ${index + 1}. [${error.timestamp}] ${error.type}:`, error)
      })
    }
    
    if (promiseErrors.length > 0) {
      originalConsoleLog('%c⚠️ Promise 错误 (' + promiseErrors.length + ' 个)', 'color: orange; font-weight: bold; font-size: 14px;')
      promiseErrors.forEach((error, index) => {
        originalConsoleLog(`  ${index + 1}. [${error.timestamp}] ${error.type}:`, error)
      })
    }
    
    if (translateRequests.length > 0) {
      originalConsoleLog('%c🌐 Google Translate 请求 (' + translateRequests.length + ' 个)', 'color: blue; font-weight: bold; font-size: 14px;')
      translateRequests.forEach((request, index) => {
        originalConsoleLog(`  ${index + 1}. [${request.timestamp}] ${request.type}:`, request)
      })
    }
    
    if (xhrRequests.length > 0) {
      originalConsoleLog('%c📨 XHR 请求 (' + xhrRequests.length + ' 个)', 'color: blue; font-weight: bold; font-size: 14px;')
      xhrRequests.forEach((request, index) => {
        originalConsoleLog(`  ${index + 1}. [${request.timestamp}] ${request.type}:`, request)
      })
    }
    
    // 分析问题
    originalConsoleLog('='.repeat(80))
    originalConsoleLog('%c🔍 问题分析', 'color: purple; font-weight: bold; font-size: 14px;')
    
    const useCasesTabErrors = [...corsErrors, ...networkErrors, ...promiseErrors].filter(
      e => e.tab === 'use-cases'
    )
    
    if (useCasesTabErrors.length > 0) {
      originalConsoleLog(`  ⚠️ 在使用场景标签页检测到 ${useCasesTabErrors.length} 个错误`)
    }
    
    const translateApiErrors = [...corsErrors, ...networkErrors].filter(
      e => e.url?.includes('translate') || e.url?.includes('googleapis.com') || e.message?.includes('translate')
    )
    
    if (translateApiErrors.length > 0) {
      originalConsoleLog(`  ⚠️ 检测到 ${translateApiErrors.length} 个 Google Translate API 相关错误`)
      originalConsoleLog('  建议:')
      originalConsoleLog('    1. 检查是否在页面中使用了 Google Translate API')
      originalConsoleLog('    2. 确认 API 密钥和配置是否正确')
      originalConsoleLog('    3. 检查 CORS 策略配置')
      originalConsoleLog('    4. 考虑使用代理服务器或后端 API 来避免 CORS 问题')
    }
    
    const corsOnlyErrors = corsErrors.filter(e => e.type === 'CORS_ERROR')
    if (corsOnlyErrors.length > 0) {
      originalConsoleLog(`  🚫 检测到 ${corsOnlyErrors.length} 个纯 CORS 错误`)
      originalConsoleLog('  建议:')
      originalConsoleLog('    1. Google Translate API 不支持浏览器直接调用（CORS 限制）')
      originalConsoleLog('    2. 需要通过后端服务器代理请求')
      originalConsoleLog('    3. 或者使用 Google Translate Widget（不需要 API）')
      originalConsoleLog('    4. 检查是否有浏览器扩展（如翻译扩展）在尝试调用 API')
    }
    
    if (corsErrors.length === 0 && networkErrors.length === 0 && promiseErrors.length === 0 && translateRequests.length === 0 && xhrRequests.length === 0) {
      originalConsoleLog('  ✅ 目前没有检测到任何 Google Translate 相关的错误或请求')
      originalConsoleLog('  工具正在后台监控，当出现错误时会自动捕获')
    }
    
    originalConsoleLog('='.repeat(80))
    originalConsoleLog('完整报告对象已保存到 window.translateCorsReportData')
    window.translateCorsReportData = report
    
    return report
  }
  
  // 清理函数
  window.translateCorsClean = function() {
    window.console.error = originalConsoleError
    window.console.warn = originalConsoleWarn
    window.fetch = originalFetch
    XMLHttpRequest.prototype.open = originalXHROpen
    XMLHttpRequest.prototype.send = originalXHRSend
    window.onerror = originalOnError
    
    delete window._translateCorsDebugLoaded
    delete window.translateCorsReport
    delete window.translateCorsClean
    delete window._translateCorsDebugOriginalConsoleError
    delete window._translateCorsDebugOriginalConsoleWarn
    
    originalConsoleWarn('🧹 Google Translate CORS 调试工具已清理')
  }
  
  // 自动输出启动信息
  originalConsoleWarn('%c🔍 Google Translate CORS 错误检测工具已启动', 'color: green; font-weight: bold; font-size: 14px; background: #f0f0f0; padding: 5px;')
  originalConsoleWarn('使用 translateCorsReport() 查看详细报告')
  originalConsoleWarn('使用 translateCorsClean() 清理调试工具')
  
})()

