// 强制更新检测工具 - 检测系统自动刷新和强制更新导致的问题
// 粘贴到浏览器控制台运行

// 首先保存所有原始函数，避免递归
if (!window._forceUpdateDebugOriginalConsoleLog) {
  window._forceUpdateDebugOriginalConsoleLog = console.log
}
if (!window._forceUpdateDebugOriginalConsoleError) {
  window._forceUpdateDebugOriginalConsoleError = console.error
}
if (!window._forceUpdateDebugOriginalConsoleWarn) {
  window._forceUpdateDebugOriginalConsoleWarn = console.warn
}

const originalConsoleLog = window._forceUpdateDebugOriginalConsoleLog
const originalConsoleError = window._forceUpdateDebugOriginalConsoleError
const originalConsoleWarn = window._forceUpdateDebugOriginalConsoleWarn

console.clear()
originalConsoleLog('%c🔍 强制更新检测工具', 'font-size: 16px; font-weight: bold; color: #ef4444;')
originalConsoleLog('='.repeat(60))

// 数据收集
const forceUpdates = []
const autoRefreshes = []
const componentRenders = []
const stateUpdates = []
const domMutations = []
let updateCount = 0

// 1. 检测自动刷新操作
const originalFetch = window.fetch
if (!window._forceUpdateDebugOriginalFetch) {
  window._forceUpdateDebugOriginalFetch = window.fetch
}
window.fetch = function(...args) {
  const url = args[0]
  
  // 检测刷新相关的 API 调用
  if (typeof url === 'string') {
    const isRefreshCall = 
      url.includes('/api/admin/stats') ||
      url.includes('/api/admin/use-cases') ||
      url.includes('/api/stats') ||
      url.includes('refresh') ||
      url.includes('fetch')
    
    if (isRefreshCall) {
      const refreshInfo = {
        id: ++updateCount,
        type: 'AutoRefresh',
        url,
        method: args[1]?.method || 'GET',
        timestamp: new Date().toISOString(),
        stack: new Error().stack,
      }
      
      autoRefreshes.push(refreshInfo)
      // 使用原始 console.log 避免递归
      originalConsoleLog(`%c🔄 检测到自动刷新 #${updateCount}`, 'color: blue; font-weight: bold;')
      originalConsoleLog('URL:', url)
      originalConsoleLog('时间:', new Date(refreshInfo.timestamp).toLocaleString())
      originalConsoleLog('调用堆栈:', refreshInfo.stack)
    }
  }
  
  return window._forceUpdateDebugOriginalFetch.apply(this, args)
}

// 2. 检测 setInterval 和 setTimeout（自动刷新定时器）
const originalSetInterval = window.setInterval
if (!window._forceUpdateDebugOriginalSetInterval) {
  window._forceUpdateDebugOriginalSetInterval = window.setInterval
}
window.setInterval = function(callback, delay, ...args) {
  const intervalInfo = {
    id: ++updateCount,
    type: 'SetInterval',
    delay,
    callback: callback.toString().substring(0, 200),
    timestamp: new Date().toISOString(),
    stack: new Error().stack,
  }
  
  forceUpdates.push(intervalInfo)
  // 使用原始 console.log 避免递归
  originalConsoleLog(`%c⏰ 检测到定时器 #${updateCount}`, 'color: orange; font-weight: bold;')
  originalConsoleLog('间隔:', delay, 'ms', `(${(delay/1000).toFixed(1)}秒)`)
  originalConsoleLog('回调函数:', intervalInfo.callback)
  originalConsoleLog('调用堆栈:', intervalInfo.stack)
  
  // 包装回调以检测执行
  const wrappedCallback = function(...callbackArgs) {
    const execInfo = {
      id: Date.now() + Math.random(),
      type: 'IntervalExecution',
      intervalId: updateCount,
      timestamp: new Date().toISOString(),
    }
    forceUpdates.push(execInfo)
    // 使用原始 console.log 避免递归
    originalConsoleLog(`%c▶️ 定时器执行 #${updateCount}`, 'color: green;')
    return callback.apply(this, callbackArgs)
  }
  
  return window._forceUpdateDebugOriginalSetInterval(wrappedCallback, delay, ...args)
}

// 3. 检测 React 组件渲染
console.log = function(...args) {
  const message = args[0]
  
  // 检测组件渲染日志
  if (typeof message === 'string') {
    if (message.includes('渲染') || 
        message.includes('Render') || 
        message.includes('组件') ||
        message.includes('Component') ||
        message.includes('activeTab 已更新') ||
        message.includes('AdminUseCasesManager') ||
        message.includes('AdminClient')) {
      
      const renderInfo = {
        id: ++updateCount,
        type: 'ComponentRender',
        message: args.join(' '),
        timestamp: new Date().toISOString(),
      }
      
      componentRenders.push(renderInfo)
      
      // 使用原始 console.log 避免递归
      if (message.includes('activeTab 已更新')) {
        originalConsoleLog(`%c🔄 标签页切换`, 'color: purple; font-weight: bold;', ...args)
      } else if (message.includes('渲染')) {
        originalConsoleLog(`%c🎨 组件渲染`, 'color: cyan;', ...args)
      }
    }
    
    // 检测状态更新
    if (message.includes('状态') || 
        message.includes('State') || 
        message.includes('更新') ||
        message.includes('Update') ||
        message.includes('setState')) {
      
      const stateInfo = {
        id: ++updateCount,
        type: 'StateUpdate',
        message: args.join(' '),
        timestamp: new Date().toISOString(),
      }
      
      stateUpdates.push(stateInfo)
    }
  }
  
  return originalConsoleLog.apply(console, args)
}

// 4. 检测 DOM 变化（MutationObserver）
let mutationObserver = null
function startDOMObservation() {
  if (mutationObserver) {
    mutationObserver.disconnect()
  }
  
  mutationObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' && (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0)) {
        const mutationInfo = {
          id: ++updateCount,
          type: 'DOMMutation',
          addedNodes: mutation.addedNodes.length,
          removedNodes: mutation.removedNodes.length,
          target: mutation.target.tagName || mutation.target.nodeName,
          timestamp: new Date().toISOString(),
        }
        
        domMutations.push(mutationInfo)
        
        if (mutation.removedNodes.length > 0) {
          // 使用原始 console.warn 避免递归
          originalConsoleWarn(`%c🗑️ DOM 节点移除`, 'color: red;', {
            移除数量: mutation.removedNodes.length,
            目标: mutationInfo.target,
          })
        }
      }
    })
  })
  
  if (document.body) {
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    })
    // 使用原始 console.log 避免递归
    originalConsoleLog('✅ DOM 变化监控已启动')
  }
}

// 5. 检测 removeChild 错误（与之前的工具集成）
const originalErrorHandler = window.onerror
if (!window._forceUpdateDebugOriginalErrorHandler) {
  window._forceUpdateDebugOriginalErrorHandler = window.onerror
}
window.onerror = function(message, source, lineno, colno, error) {
  if (message && (message.includes('removeChild') || message.includes('not a child'))) {
    const errorInfo = {
      id: ++updateCount,
      type: 'removeChildError',
      message: String(message),
      timestamp: new Date().toISOString(),
      autoRefreshCount: autoRefreshes.length,
      componentRenderCount: componentRenders.length,
      stateUpdateCount: stateUpdates.length,
      domMutationCount: domMutations.length,
      recentAutoRefreshes: autoRefreshes.slice(-5),
      recentRenders: componentRenders.slice(-5),
    }
    
    forceUpdates.push(errorInfo)
    
    // 使用原始 console.error 避免递归
    originalConsoleError(`%c❌ removeChild 错误 #${updateCount}`, 'color: red; font-weight: bold; font-size: 14px;')
    originalConsoleError('时间:', new Date(errorInfo.timestamp).toLocaleString())
    originalConsoleError('错误前自动刷新次数:', errorInfo.autoRefreshCount)
    originalConsoleError('错误前组件渲染次数:', errorInfo.componentRenderCount)
    originalConsoleError('错误前状态更新次数:', errorInfo.stateUpdateCount)
    originalConsoleError('错误前 DOM 变化次数:', errorInfo.domMutationCount)
    originalConsoleError('最近5次自动刷新:', errorInfo.recentAutoRefreshes)
    originalConsoleError('最近5次组件渲染:', errorInfo.recentRenders)
  }
  
  if (window._forceUpdateDebugOriginalErrorHandler) {
    return window._forceUpdateDebugOriginalErrorHandler.apply(this, arguments)
  }
  return false
}

// 6. 检测页面可见性变化（可能导致强制刷新）
document.addEventListener('visibilitychange', () => {
  const visibilityInfo = {
    id: ++updateCount,
    type: 'VisibilityChange',
    hidden: document.hidden,
    visibilityState: document.visibilityState,
    timestamp: new Date().toISOString(),
  }
  
  forceUpdates.push(visibilityInfo)
  // 使用原始 console.log 避免递归
  originalConsoleLog(`%c👁️ 页面可见性变化`, 'color: yellow;', {
    隐藏: visibilityInfo.hidden,
    状态: visibilityInfo.visibilityState,
  })
})

// 7. 检测窗口焦点变化
window.addEventListener('focus', () => {
  const focusInfo = {
    id: ++updateCount,
    type: 'WindowFocus',
    timestamp: new Date().toISOString(),
  }
  
  forceUpdates.push(focusInfo)
  // 使用原始 console.log 避免递归
  originalConsoleLog(`%c🎯 窗口获得焦点`, 'color: green;')
})

window.addEventListener('blur', () => {
  const blurInfo = {
    id: ++updateCount,
    type: 'WindowBlur',
    timestamp: new Date().toISOString(),
  }
  
  forceUpdates.push(blurInfo)
  // 使用原始 console.log 避免递归
  originalConsoleLog(`%c👋 窗口失去焦点`, 'color: gray;')
})

// 8. 生成详细报告
window.forceUpdateReport = function() {
  console.clear()
  console.log('%c📋 强制更新检测报告', 'font-size: 18px; font-weight: bold; color: #00d4ff;')
  console.log('='.repeat(60))
  
  console.log('\n%c1. 统计信息', 'font-size: 14px; font-weight: bold; color: #4ecdc4;')
  console.log(`总更新次数: ${forceUpdates.length}`)
  console.log(`自动刷新次数: ${autoRefreshes.length}`)
  console.log(`组件渲染次数: ${componentRenders.length}`)
  console.log(`状态更新次数: ${stateUpdates.length}`)
  console.log(`DOM 变化次数: ${domMutations.length}`)
  
  console.log('\n%c2. 自动刷新记录', 'font-size: 14px; font-weight: bold; color: #ff6b6b;')
  if (autoRefreshes.length === 0) {
    console.log('✅ 未检测到自动刷新')
  } else {
    console.log(`共 ${autoRefreshes.length} 次自动刷新:`)
    autoRefreshes.forEach((refresh, index) => {
      console.log(`\n刷新 #${index + 1}:`)
      console.log('  时间:', new Date(refresh.timestamp).toLocaleString())
      console.log('  URL:', refresh.url)
      console.log('  方法:', refresh.method)
    })
  }
  
  console.log('\n%c3. 定时器记录', 'font-size: 14px; font-weight: bold; color: #ffd93d;')
  const intervals = forceUpdates.filter(u => u.type === 'SetInterval')
  if (intervals.length === 0) {
    console.log('✅ 未检测到定时器')
  } else {
    console.log(`共 ${intervals.length} 个定时器:`)
    intervals.forEach((interval, index) => {
      console.log(`\n定时器 #${index + 1}:`)
      console.log('  间隔:', interval.delay, 'ms', `(${(interval.delay/1000).toFixed(1)}秒)`)
      console.log('  回调:', interval.callback.substring(0, 100) + '...')
    })
  }
  
  console.log('\n%c4. 组件渲染记录', 'font-size: 14px; font-weight: bold; color: #95e1d3;')
  if (componentRenders.length === 0) {
    console.log('ℹ️ 未检测到组件渲染日志')
  } else {
    console.log(`共 ${componentRenders.length} 次渲染:`)
    console.log('最近10次:')
    componentRenders.slice(-10).forEach((render, index) => {
      console.log(`  ${index + 1}. [${new Date(render.timestamp).toLocaleTimeString()}] ${render.message}`)
    })
  }
  
  console.log('\n%c5. DOM 变化记录', 'font-size: 14px; font-weight: bold; color: #a8e6cf;')
  if (domMutations.length === 0) {
    console.log('ℹ️ 未检测到 DOM 变化')
  } else {
    const removals = domMutations.filter(m => m.removedNodes > 0)
    console.log(`共 ${domMutations.length} 次 DOM 变化`)
    console.log(`其中 ${removals.length} 次涉及节点移除`)
    
    if (removals.length > 0) {
      console.log('\n节点移除记录:')
      removals.slice(-10).forEach((mutation, index) => {
        console.log(`  ${index + 1}. [${new Date(mutation.timestamp).toLocaleTimeString()}] 移除 ${mutation.removedNodes} 个节点 (目标: ${mutation.target})`)
      })
    }
  }
  
  console.log('\n%c6. removeChild 错误分析', 'font-size: 14px; font-weight: bold; color: #ef4444;')
  const errors = forceUpdates.filter(u => u.type === 'removeChildError')
  if (errors.length === 0) {
    console.log('✅ 未检测到 removeChild 错误')
  } else {
    console.error(`❌ 检测到 ${errors.length} 个 removeChild 错误:`)
    errors.forEach((error, index) => {
      console.error(`\n错误 #${index + 1}:`)
      console.error('  时间:', new Date(error.timestamp).toLocaleString())
      console.error('  错误前自动刷新次数:', error.autoRefreshCount)
      console.error('  错误前组件渲染次数:', error.componentRenderCount)
      console.error('  错误前状态更新次数:', error.stateUpdateCount)
      console.error('  错误前 DOM 变化次数:', error.domMutationCount)
      
      // 分析可能的原因
      if (error.autoRefreshCount > 0) {
        console.warn('  ⚠️ 可能原因: 自动刷新导致组件重新渲染')
      }
      if (error.componentRenderCount > 0) {
        console.warn('  ⚠️ 可能原因: 组件频繁渲染导致 DOM 操作冲突')
      }
      if (error.domMutationCount > 0) {
        console.warn('  ⚠️ 可能原因: DOM 频繁变化导致节点关系改变')
      }
    })
  }
  
  console.log('\n%c7. 修复建议', 'font-size: 14px; font-weight: bold; color: #a8e6cf;')
  
  if (autoRefreshes.length > 10) {
    console.log('🔧 自动刷新过于频繁:')
    console.log('  - 检查自动刷新间隔设置')
    console.log('  - 考虑增加刷新间隔时间')
    console.log('  - 检查是否有多个自动刷新定时器同时运行')
  }
  
  if (componentRenders.length > 50) {
    console.log('🔧 组件渲染过于频繁:')
    console.log('  - 检查组件依赖项，避免不必要的重新渲染')
    console.log('  - 使用 React.memo 优化组件')
    console.log('  - 检查状态更新是否导致级联渲染')
  }
  
  if (errors.length > 0) {
    console.log('🔧 removeChild 错误修复:')
    console.log('  - 在 removeChild 前检查节点关系')
    console.log('  - 使用 element.remove() 替代 removeChild')
    console.log('  - 确保组件卸载时清理所有 DOM 操作')
    console.log('  - 检查自动刷新是否在组件卸载时仍在执行')
  }
  
  return {
    totalUpdates: forceUpdates.length,
    autoRefreshes: autoRefreshes.length,
    componentRenders: componentRenders.length,
    stateUpdates: stateUpdates.length,
    domMutations: domMutations.length,
    errors: errors.length,
  }
}

// 9. 清理工具
window.forceUpdateClean = function() {
  // 恢复原始函数
  if (window._forceUpdateDebugOriginalFetch) {
    window.fetch = window._forceUpdateDebugOriginalFetch
  }
  if (window._forceUpdateDebugOriginalSetInterval) {
    window.setInterval = window._forceUpdateDebugOriginalSetInterval
  }
  if (window._forceUpdateDebugOriginalConsoleLog) {
    console.log = window._forceUpdateDebugOriginalConsoleLog
  }
  if (window._forceUpdateDebugOriginalErrorHandler) {
    window.onerror = window._forceUpdateDebugOriginalErrorHandler
  }
  
  // 停止 DOM 观察
  if (mutationObserver) {
    mutationObserver.disconnect()
    mutationObserver = null
  }
  
  // 清空数据
  forceUpdates.length = 0
  autoRefreshes.length = 0
  componentRenders.length = 0
  stateUpdates.length = 0
  domMutations.length = 0
  updateCount = 0
  
  // 使用原始 console.log 避免递归
  originalConsoleLog('✅ 调试工具已清理')
}

// 标记已安装
window._forceUpdateDebugInstalled = true

// 启动 DOM 观察
startDOMObservation()

// 使用原始 console.log 输出初始信息
originalConsoleLog('\n✅ 调试工具已启动')
originalConsoleLog('\n可用命令:')
originalConsoleLog('  forceUpdateReport()  - 查看详细报告')
originalConsoleLog('  forceUpdateClean()   - 清理调试工具')
originalConsoleLog('\n💡 工具会自动检测:')
originalConsoleLog('  - 自动刷新操作')
originalConsoleLog('  - 定时器设置')
originalConsoleLog('  - 组件渲染')
originalConsoleLog('  - 状态更新')
originalConsoleLog('  - DOM 变化')
originalConsoleLog('  - removeChild 错误')
originalConsoleLog('\n📊 运行 forceUpdateReport() 查看完整分析\n')

// 自动显示初始状态
setTimeout(() => {
  originalConsoleLog('\n%c📊 初始状态检查', 'font-size: 12px; color: #888;')
  originalConsoleLog('当前 URL:', window.location.href)
  originalConsoleLog('页面路径:', window.location.pathname)
  originalConsoleLog('页面可见性:', document.visibilityState)
}, 1000)

