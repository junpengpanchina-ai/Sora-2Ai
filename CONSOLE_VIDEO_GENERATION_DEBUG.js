// 视频生成失败调试工具 - 一键诊断DOM错误和生成问题
// 粘贴到浏览器控制台运行

// 检查是否已经安装，如果已安装则先清理
if (window._videoDebugInstalled) {
  console.log('⚠️ 检测到已安装的调试工具，正在清理...')
  if (window._videoDebugOriginalFetch) {
    window.fetch = window._videoDebugOriginalFetch
  }
  if (window._videoDebugOriginalErrorHandler) {
    window.onerror = window._videoDebugOriginalErrorHandler
  }
  if (window._videoDebugOriginalUnhandledRejection) {
    window.onunhandledrejection = window._videoDebugOriginalUnhandledRejection
  }
  if (window._videoDebugOriginalRemoveChild) {
    Node.prototype.removeChild = window._videoDebugOriginalRemoveChild
  }
  if (window._videoDebugOriginalConsoleLog) {
    console.log = window._videoDebugOriginalConsoleLog
  }
  if (window._videoDebugMountCheckInterval) {
    clearInterval(window._videoDebugMountCheckInterval)
  }
}

console.clear()
console.log('%c🎬 视频生成失败诊断工具', 'font-size: 16px; font-weight: bold; color: #ef4444;')
console.log('='.repeat(60))

// 错误收集
const errorLog = []
const domErrors = []
const apiErrors = []
const stateChanges = []

// 1. 捕获全局错误（包括DOM错误）
if (!window._videoDebugOriginalErrorHandler) {
  window._videoDebugOriginalErrorHandler = window.onerror
}
const originalErrorHandler = window._videoDebugOriginalErrorHandler
window.onerror = function(message, source, lineno, colno, error) {
  const errorInfo = {
    type: 'GlobalError',
    message: String(message),
    source: String(source),
    lineno,
    colno,
    stack: error?.stack,
    timestamp: new Date().toISOString(),
  }
  
  errorLog.push(errorInfo)
  
  // 特别关注removeChild错误
  if (message.includes('removeChild') || message.includes('not a child')) {
    domErrors.push(errorInfo)
    console.error('%c❌ DOM操作错误捕获:', 'color: red; font-weight: bold;', errorInfo)
  }
  
  if (originalErrorHandler) {
    return originalErrorHandler.apply(this, arguments)
  }
  return false
}

// 2. 捕获未处理的Promise拒绝
if (!window._videoDebugOriginalUnhandledRejection) {
  window._videoDebugOriginalUnhandledRejection = window.onunhandledrejection
}
const originalUnhandledRejection = window._videoDebugOriginalUnhandledRejection
window.onunhandledrejection = function(event) {
  const errorInfo = {
    type: 'UnhandledRejection',
    reason: event.reason,
    message: event.reason?.message || String(event.reason),
    stack: event.reason?.stack,
    timestamp: new Date().toISOString(),
  }
  
  errorLog.push(errorInfo)
  console.error('%c❌ 未处理的Promise拒绝:', 'color: orange; font-weight: bold;', errorInfo)
  
  if (originalUnhandledRejection) {
    return originalUnhandledRejection.apply(this, arguments)
  }
}

// 3. 监控DOM操作（特别是removeChild）
if (!window._videoDebugOriginalRemoveChild) {
  window._videoDebugOriginalRemoveChild = Node.prototype.removeChild
}
const originalRemoveChild = window._videoDebugOriginalRemoveChild
Node.prototype.removeChild = function(child) {
  try {
    // 检查节点是否真的是子节点
    if (!this.contains(child)) {
      const errorInfo = {
        type: 'DOMRemoveChildError',
        message: `尝试移除不是子节点的节点`,
        parent: this,
        child: child,
        parentTag: this.tagName || this.nodeName,
        childTag: child.tagName || child.nodeName,
        timestamp: new Date().toISOString(),
        stack: new Error().stack,
      }
      
      domErrors.push(errorInfo)
      console.error('%c❌ removeChild错误:', 'color: red; font-weight: bold;', errorInfo)
      
      // 不抛出错误，而是返回child（安全处理）
      return child
    }
    
    return originalRemoveChild.call(this, child)
  } catch (error) {
    const errorInfo = {
      type: 'DOMRemoveChildException',
      message: error.message,
      stack: error.stack,
      parent: this,
      child: child,
      timestamp: new Date().toISOString(),
    }
    
    domErrors.push(errorInfo)
    console.error('%c❌ removeChild异常:', 'color: red; font-weight: bold;', errorInfo)
    
    // 安全处理：如果移除失败，尝试返回child
    return child
  }
}

// 4. 监控视频生成API请求
if (!window._videoDebugOriginalFetch) {
  window._videoDebugOriginalFetch = window.fetch
}
const originalFetch = window._videoDebugOriginalFetch
window.fetch = function(...args) {
  const url = args[0]
  
  // 监控视频生成相关API
  if (typeof url === 'string' && (
    url.includes('/api/video/generate') ||
    url.includes('/api/video/result/') ||
    url.includes('/api/video/download/')
  )) {
    const requestInfo = {
      url,
      method: args[1]?.method || 'GET',
      timestamp: new Date().toISOString(),
    }
    
    console.log(`\n📤 视频API请求: ${requestInfo.method} ${url}`)
    
    return originalFetch.apply(this, args).then(async (response) => {
      const responseInfo = {
        ...requestInfo,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      }
      
      console.log(`📥 视频API响应: ${response.status} ${response.statusText}`)
      
      // 克隆响应以便读取内容
      const cloned = response.clone()
      
      try {
        const data = await cloned.json()
        responseInfo.data = data
        
        if (!response.ok || data.error) {
          apiErrors.push(responseInfo)
          console.error('%c❌ API错误:', 'color: red;', responseInfo)
        } else {
          console.log('✅ API成功:', {
            success: data.success,
            status: data.status,
            taskId: data.task_id,
            hasVideoUrl: !!data.video_url,
            progress: data.progress,
          })
        }
      } catch (e) {
        // 不是JSON响应，忽略
      }
      
      return response
    }).catch(err => {
      const errorInfo = {
        ...requestInfo,
        error: err.message,
        stack: err.stack,
      }
      apiErrors.push(errorInfo)
      console.error('%c❌ 请求失败:', 'color: red;', errorInfo)
      return Promise.reject(err)
    })
  }
  
  return originalFetch.apply(this, args)
}

// 5. 监控React状态更新（通过控制台日志）
if (!window._videoDebugOriginalConsoleLog) {
  window._videoDebugOriginalConsoleLog = console.log
}
const originalConsoleLog = window._videoDebugOriginalConsoleLog
console.log = function(...args) {
  const message = args[0]
  
  // 捕获VideoPage相关的日志
  if (typeof message === 'string' && message.includes('[VideoPage]')) {
    const logInfo = {
      message: args.join(' '),
      timestamp: new Date().toISOString(),
      args: args,
    }
    
    stateChanges.push(logInfo)
    
    // 特别关注关键状态变化
    if (message.includes('Polling') || 
        message.includes('completed') || 
        message.includes('failed') ||
        message.includes('starting polling')) {
      console.log('%c📊 状态变化:', 'color: blue; font-weight: bold;', ...args)
    }
  }
  
  return originalConsoleLog.apply(console, args)
}

// 6. 监控组件卸载和异步操作
let componentUnmountTime = null
let activeAsyncOperations = []
let lastVideoPageCheck = null

const checkComponentMount = () => {
  // 检查是否有VideoPage相关的元素（更精确的检测）
  const videoPageElements = document.querySelectorAll(
    'form[action*="video"], [class*="VideoPage"], [data-video-page], textarea[placeholder*="提示词"], button:has-text("生成")'
  )
  const hasVideoForm = document.querySelector('form') && 
    (window.location.pathname.includes('/video') || document.querySelector('textarea'))
  
  const isMounted = videoPageElements.length > 0 || hasVideoForm
  
  if (!isMounted && lastVideoPageCheck === true && componentUnmountTime === null) {
    componentUnmountTime = new Date().toISOString()
    console.warn('%c⚠️ 组件可能已卸载:', 'color: orange; font-weight: bold;', {
      timestamp: componentUnmountTime,
      note: '如果此时有异步操作，可能导致DOM错误',
      activeAsyncOps: activeAsyncOperations.length,
    })
    
    // 如果有活跃的异步操作，特别警告
    if (activeAsyncOperations.length > 0) {
      console.error('%c🚨 检测到组件卸载时仍有活跃的异步操作!', 'color: red; font-weight: bold; font-size: 14px;')
      console.error('活跃操作:', activeAsyncOperations)
    }
  }
  
  lastVideoPageCheck = isMounted
}

// 追踪异步操作
const trackAsyncOperation = (name, promise) => {
  const opId = Date.now() + Math.random()
  const operation = {
    id: opId,
    name,
    startTime: new Date().toISOString(),
    promise,
  }
  
  activeAsyncOperations.push(operation)
  console.log(`🔄 开始异步操作: ${name} (ID: ${opId})`)
  
  promise
    .then(() => {
      const index = activeAsyncOperations.findIndex(op => op.id === opId)
      if (index > -1) {
        activeAsyncOperations.splice(index, 1)
        console.log(`✅ 异步操作完成: ${name} (ID: ${opId})`)
      }
    })
    .catch(err => {
      const index = activeAsyncOperations.findIndex(op => op.id === opId)
      if (index > -1) {
        activeAsyncOperations.splice(index, 1)
        console.error(`❌ 异步操作失败: ${name} (ID: ${opId})`, err)
      }
    })
  
  return promise
}

// 定期检查组件状态
// 如果已有检查在运行，先清理
if (window._videoDebugMountCheckInterval) {
  clearInterval(window._videoDebugMountCheckInterval)
}
window._videoDebugMountCheckInterval = setInterval(checkComponentMount, 500) // 更频繁的检查

// 导出异步操作追踪到全局
window.trackAsyncOp = trackAsyncOperation

// 7. 提供诊断报告函数
window.videoDebugReport = function() {
  console.clear()
  console.log('%c📋 视频生成诊断报告', 'font-size: 18px; font-weight: bold; color: #00d4ff;')
  console.log('='.repeat(60))
  
  console.log('\n%c1. DOM错误统计', 'font-size: 14px; font-weight: bold; color: #ef4444;')
  if (domErrors.length === 0) {
    console.log('✅ 未发现DOM操作错误')
  } else {
    console.error(`❌ 发现 ${domErrors.length} 个DOM错误:`)
    domErrors.forEach((error, index) => {
      console.error(`\n错误 #${index + 1}:`, error)
    })
  }
  
  console.log('\n%c2. API错误统计', 'font-size: 14px; font-weight: bold; color: #ff6b6b;')
  if (apiErrors.length === 0) {
    console.log('✅ 未发现API错误')
  } else {
    console.error(`❌ 发现 ${apiErrors.length} 个API错误:`)
    apiErrors.forEach((error, index) => {
      console.error(`\n错误 #${index + 1}:`, error)
    })
  }
  
  console.log('\n%c3. 状态变化记录', 'font-size: 14px; font-weight: bold; color: #4ecdc4;')
  console.log(`共记录 ${stateChanges.length} 条状态变化`)
  if (stateChanges.length > 0) {
    console.log('最近5条:')
    stateChanges.slice(-5).forEach((change, index) => {
      console.log(`${index + 1}. [${change.timestamp}] ${change.message}`)
    })
  }
  
  console.log('\n%c4. 组件卸载状态', 'font-size: 14px; font-weight: bold; color: #ffd93d;')
  if (componentUnmountTime) {
    console.warn(`⚠️ 组件在 ${componentUnmountTime} 可能已卸载`)
    if (activeAsyncOperations.length > 0) {
      console.error(`🚨 卸载时仍有 ${activeAsyncOperations.length} 个活跃的异步操作:`)
      activeAsyncOperations.forEach(op => {
        console.error(`  - ${op.name} (开始于: ${op.startTime})`)
      })
    }
  } else {
    console.log('✅ 组件仍在挂载状态')
  }
  
  if (activeAsyncOperations.length > 0) {
    console.warn(`⚠️ 当前有 ${activeAsyncOperations.length} 个活跃的异步操作`)
  }
  
  console.log('\n%c5. 当前页面状态', 'font-size: 14px; font-weight: bold; color: #95e1d3;')
  const currentUrl = window.location.href
  console.log('URL:', currentUrl)
  console.log('路径:', window.location.pathname)
  
  // 检查是否有视频相关的DOM元素
  const videoElements = document.querySelectorAll('video')
  const resultElements = document.querySelectorAll('[class*="result"], [id*="result"]')
  console.log('视频元素数量:', videoElements.length)
  console.log('结果元素数量:', resultElements.length)
  
  // 检查localStorage中的状态
  const storageKeys = Object.keys(localStorage).filter(k => k.includes('video') || k.includes('task'))
  if (storageKeys.length > 0) {
    console.log('相关localStorage键:', storageKeys)
  }
  
  console.log('\n%c6. 建议修复方案', 'font-size: 14px; font-weight: bold; color: #a8e6cf;')
  
  if (domErrors.length > 0) {
    console.log('🔧 DOM错误修复建议:')
    console.log('  1. 检查组件卸载时是否清理了所有DOM操作')
    console.log('  2. 在removeChild前确保节点确实是子节点')
    console.log('  3. 使用React的ref而不是直接DOM操作')
    console.log('  4. 确保异步操作完成前组件未卸载')
  }
  
  if (apiErrors.length > 0) {
    console.log('🔧 API错误修复建议:')
    apiErrors.forEach(error => {
      if (error.status === 401) {
        console.log('  - 认证失败，请检查登录状态')
      } else if (error.status === 404) {
        console.log('  - 资源未找到，可能任务ID无效')
      } else if (error.status >= 500) {
        console.log('  - 服务器错误，请稍后重试')
      }
    })
  }
  
  if (componentUnmountTime && (domErrors.length > 0 || apiErrors.length > 0)) {
    console.log('🔧 组件卸载问题:')
    console.log('  - 组件在异步操作完成前卸载')
    console.log('  - 建议使用isMountedRef检查组件状态')
    console.log('  - 在useEffect cleanup中取消所有异步操作')
    console.log('  - 检查VideoPageClient.tsx中的轮询逻辑')
    console.log('  - 确保所有setState调用前检查isMountedRef.current')
  }
  
  if (activeAsyncOperations.length > 0) {
    console.log('🔧 活跃异步操作:')
    console.log('  - 这些操作可能在组件卸载后仍在运行')
    console.log('  - 建议在组件卸载时取消这些操作')
    console.log('  - 使用AbortController取消fetch请求')
    console.log('  - 使用clearInterval清理定时器')
  }
  
  return {
    domErrors,
    apiErrors,
    stateChanges,
    componentUnmountTime,
    totalErrors: errorLog.length,
  }
}

// 8. 提供清理函数
window.videoDebugClean = function() {
  // 恢复原始函数
  if (window._videoDebugOriginalErrorHandler) {
    window.onerror = window._videoDebugOriginalErrorHandler
  }
  if (window._videoDebugOriginalUnhandledRejection) {
    window.onunhandledrejection = window._videoDebugOriginalUnhandledRejection
  }
  if (window._videoDebugOriginalRemoveChild) {
    Node.prototype.removeChild = window._videoDebugOriginalRemoveChild
  }
  if (window._videoDebugOriginalFetch) {
    window.fetch = window._videoDebugOriginalFetch
  }
  if (window._videoDebugOriginalConsoleLog) {
    console.log = window._videoDebugOriginalConsoleLog
  }
  
  // 清理定时器
  if (window._videoDebugMountCheckInterval) {
    clearInterval(window._videoDebugMountCheckInterval)
    window._videoDebugMountCheckInterval = null
  }
  
  // 清空日志
  errorLog.length = 0
  domErrors.length = 0
  apiErrors.length = 0
  stateChanges.length = 0
  
  // 清除标记
  window._videoDebugInstalled = false
  
  console.log('✅ 调试工具已清理')
}

// 9. 提供实时监控开关
let realtimeMonitoring = true
window.videoDebugToggle = function() {
  realtimeMonitoring = !realtimeMonitoring
  console.log(`监控已${realtimeMonitoring ? '开启' : '关闭'}`)
}

console.log('\n✅ 调试工具已启动')
console.log('\n可用命令:')
console.log('  videoDebugReport()  - 查看完整诊断报告')
console.log('  videoDebugClean()   - 清理调试工具（恢复原始函数）')
console.log('  videoDebugToggle()  - 切换实时监控')
console.log('\n💡 现在尝试生成视频，工具会自动捕获错误\n')

// 标记已安装
window._videoDebugInstalled = true

// 自动在5秒后显示初始报告
setTimeout(() => {
  console.log('\n%c📊 初始状态检查', 'font-size: 14px; font-weight: bold; color: #00d4ff;')
  console.log('当前URL:', window.location.href)
  console.log('页面路径:', window.location.pathname)
  console.log('错误计数:', errorLog.length)
  console.log('DOM错误:', domErrors.length)
  console.log('API错误:', apiErrors.length)
}, 5000)

