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
const apiErrors = [] // 专门收集 API 错误
let updateCount = 0

// 1. 检测自动刷新操作
const originalFetch = window.fetch
if (!window._forceUpdateDebugOriginalFetch) {
  window._forceUpdateDebugOriginalFetch = window.fetch
}
window.fetch = function(...args) {
  const url = args[0]
  const startTime = Date.now()
  
  // 检测刷新相关的 API 调用
  if (typeof url === 'string') {
    const isRefreshCall = 
      url.includes('/api/admin/stats') ||
      url.includes('/api/admin/use-cases') ||
      url.includes('/api/stats') ||
      url.includes('refresh') ||
      url.includes('fetch')
    
    // 特别检测使用场景列表查询
    const isUseCasesQuery = url.includes('/api/admin/use-cases')
    const isUseCasesListQuery = isUseCasesQuery && (
      url.includes('limit=0') || // 统计查询
      url.includes('status=') || // 状态筛选
      url.includes('quality_status=') // 质量筛选
    )
    
    if (isRefreshCall) {
      const refreshInfo = {
        id: ++updateCount,
        type: isUseCasesQuery ? 'UseCasesQuery' : 'AutoRefresh',
        url,
        method: args[1]?.method || 'GET',
        timestamp: new Date().toISOString(),
        stack: new Error().stack,
        isUseCasesListQuery: isUseCasesListQuery,
      }
      
      autoRefreshes.push(refreshInfo)
      
      // 使用原始 console.log 避免递归
      if (isUseCasesQuery) {
        originalConsoleLog(`%c📋 使用场景列表查询 #${updateCount}`, 'color: orange; font-weight: bold;')
      } else {
        originalConsoleLog(`%c🔄 检测到自动刷新 #${updateCount}`, 'color: blue; font-weight: bold;')
      }
      originalConsoleLog('URL:', url)
      originalConsoleLog('时间:', new Date(refreshInfo.timestamp).toLocaleString())
      
      // 如果是使用场景查询，检查是否有潜在问题
      if (isUseCasesListQuery) {
        originalConsoleLog('⚠️ 这是使用场景列表统计查询（可能导致频繁刷新）')
      }
    }
  }
  
  // 包装 fetch 以检测错误响应
  return window._forceUpdateDebugOriginalFetch.apply(this, args)
    .then((response) => {
      const duration = Date.now() - startTime
      
      // 检测使用场景查询的错误
      if (typeof url === 'string' && url.includes('/api/admin/use-cases')) {
        if (!response.ok) {
          const errorInfo = {
            id: ++updateCount,
            type: 'UseCasesQueryError',
            url,
            status: response.status,
            statusText: response.statusText,
            timestamp: new Date().toISOString(),
            duration,
            stack: new Error().stack,
          }
          
          apiErrors.push(errorInfo)
          
          originalConsoleError(`%c❌ 使用场景查询失败 #${updateCount}`, 'color: red; font-weight: bold;')
          originalConsoleError('URL:', url)
          originalConsoleError('状态:', response.status, response.statusText)
          originalConsoleError('耗时:', duration, 'ms')
          
          // 尝试读取错误详情（不阻塞主流程）
          response.clone().json().then((data) => {
            if (data.error || data.details) {
              originalConsoleError('错误详情:', data.error || data.details)
              errorInfo.errorDetails = data.error || data.details
            }
          }).catch(() => {
            // 忽略 JSON 解析错误
          })
        } else if (duration > 5000) {
          // 慢查询警告
          originalConsoleWarn(`%c⚠️ 使用场景查询较慢 (${duration}ms)`, 'color: yellow;')
          originalConsoleWarn('URL:', url)
        }
      }
      
      return response
    })
    .catch((error) => {
      // 网络错误或其他错误
      if (typeof url === 'string' && url.includes('/api/admin/use-cases')) {
        const errorInfo = {
          id: ++updateCount,
          type: 'UseCasesQueryNetworkError',
          url,
          error: error.message || String(error),
          timestamp: new Date().toISOString(),
          duration: Date.now() - startTime,
          stack: error.stack || new Error().stack,
        }
        
        apiErrors.push(errorInfo)
        
        originalConsoleError(`%c❌ 使用场景查询网络错误 #${updateCount}`, 'color: red; font-weight: bold;')
        originalConsoleError('URL:', url)
        originalConsoleError('错误:', error.message || String(error))
      }
      
      throw error
    })
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
  // 先调用原始函数，避免任何递归问题
  const result = originalConsoleLog.apply(console, args)
  
  // 然后检测消息内容（不影响原始输出）
  try {
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
        
        // 使用原始 console.log 输出额外标记（不传递原始 args，避免重复）
        if (message.includes('activeTab 已更新')) {
          originalConsoleLog(`%c🔄 标签页切换`, 'color: purple; font-weight: bold;')
        } else if (message.includes('渲染')) {
          originalConsoleLog(`%c🎨 组件渲染`, 'color: cyan;')
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
  } catch (e) {
    // 如果检测过程中出错，不影响原始 console.log 的输出
    // 静默失败，避免导致更多问题
  }
  
  return result
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
  if (console.clear) {
    console.clear()
  }
  originalConsoleLog('%c📋 强制更新检测报告', 'font-size: 18px; font-weight: bold; color: #00d4ff;')
  originalConsoleLog('='.repeat(60))
  
  // 预先计算使用场景查询统计（避免重复计算）
  const useCasesQueries = autoRefreshes.filter(r => r.type === 'UseCasesQuery')
  const useCasesErrors = apiErrors.filter(e => e.type === 'UseCasesQueryError' || e.type === 'UseCasesQueryNetworkError')
  
  originalConsoleLog('\n%c1. 统计信息', 'font-size: 14px; font-weight: bold; color: #4ecdc4;')
  originalConsoleLog(`总更新次数: ${forceUpdates.length}`)
  originalConsoleLog(`自动刷新次数: ${autoRefreshes.length}`)
  originalConsoleLog(`组件渲染次数: ${componentRenders.length}`)
  originalConsoleLog(`状态更新次数: ${stateUpdates.length}`)
  originalConsoleLog(`DOM 变化次数: ${domMutations.length}`)
  originalConsoleLog(`API 错误次数: ${apiErrors.length}`)
  originalConsoleLog(`使用场景查询次数: ${useCasesQueries.length}`)
  originalConsoleLog(`使用场景查询错误: ${useCasesErrors.length}`)
  
  originalConsoleLog('\n%c2. 自动刷新记录', 'font-size: 14px; font-weight: bold; color: #ff6b6b;')
  if (autoRefreshes.length === 0) {
    originalConsoleLog('✅ 未检测到自动刷新')
  } else {
    originalConsoleLog(`共 ${autoRefreshes.length} 次自动刷新:`)
    
    // 分别显示使用场景查询和其他刷新
    const otherRefreshes = autoRefreshes.filter(r => r.type !== 'UseCasesQuery')
    
    if (useCasesQueries.length > 0) {
      originalConsoleLog(`\n📋 使用场景查询 (${useCasesQueries.length} 次):`)
      useCasesQueries.slice(-10).forEach((refresh, index) => {
        originalConsoleLog(`  ${index + 1}. [${new Date(refresh.timestamp).toLocaleTimeString()}] ${refresh.url}`)
        if (refresh.isUseCasesListQuery) {
          originalConsoleLog('     ⚠️ 统计查询（可能导致频繁刷新）')
        }
      })
      if (useCasesQueries.length > 10) {
        originalConsoleLog(`  ... 还有 ${useCasesQueries.length - 10} 次查询`)
      }
    }
    
    if (otherRefreshes.length > 0) {
      originalConsoleLog(`\n🔄 其他自动刷新 (${otherRefreshes.length} 次):`)
      otherRefreshes.slice(-10).forEach((refresh, index) => {
        originalConsoleLog(`  ${index + 1}. [${new Date(refresh.timestamp).toLocaleTimeString()}] ${refresh.url}`)
      })
      if (otherRefreshes.length > 10) {
        originalConsoleLog(`  ... 还有 ${otherRefreshes.length - 10} 次刷新`)
      }
    }
  }
  
  originalConsoleLog('\n%c3. 定时器记录', 'font-size: 14px; font-weight: bold; color: #ffd93d;')
  const intervals = forceUpdates.filter(u => u.type === 'SetInterval')
  if (intervals.length === 0) {
    originalConsoleLog('✅ 未检测到定时器')
  } else {
    originalConsoleLog(`共 ${intervals.length} 个定时器:`)
    intervals.forEach((interval, index) => {
      originalConsoleLog(`\n定时器 #${index + 1}:`)
      originalConsoleLog('  间隔:', interval.delay, 'ms', `(${(interval.delay/1000).toFixed(1)}秒)`)
      originalConsoleLog('  回调:', interval.callback.substring(0, 100) + '...')
    })
  }
  
  originalConsoleLog('\n%c4. 组件渲染记录', 'font-size: 14px; font-weight: bold; color: #95e1d3;')
  if (componentRenders.length === 0) {
    originalConsoleLog('ℹ️ 未检测到组件渲染日志')
  } else {
    originalConsoleLog(`共 ${componentRenders.length} 次渲染:`)
    originalConsoleLog('最近10次:')
    componentRenders.slice(-10).forEach((render, index) => {
      originalConsoleLog(`  ${index + 1}. [${new Date(render.timestamp).toLocaleTimeString()}] ${render.message}`)
    })
  }
  
  originalConsoleLog('\n%c5. DOM 变化记录', 'font-size: 14px; font-weight: bold; color: #a8e6cf;')
  if (domMutations.length === 0) {
    originalConsoleLog('ℹ️ 未检测到 DOM 变化')
  } else {
    const removals = domMutations.filter(m => m.removedNodes > 0)
    originalConsoleLog(`共 ${domMutations.length} 次 DOM 变化`)
    originalConsoleLog(`其中 ${removals.length} 次涉及节点移除`)
    
    if (removals.length > 0) {
      originalConsoleLog('\n节点移除记录:')
      removals.slice(-10).forEach((mutation, index) => {
        originalConsoleLog(`  ${index + 1}. [${new Date(mutation.timestamp).toLocaleTimeString()}] 移除 ${mutation.removedNodes} 个节点 (目标: ${mutation.target})`)
      })
    }
  }
  
  originalConsoleLog('\n%c6. removeChild 错误分析', 'font-size: 14px; font-weight: bold; color: #ef4444;')
  const errors = forceUpdates.filter(u => u.type === 'removeChildError')
  if (errors.length === 0) {
    originalConsoleLog('✅ 未检测到 removeChild 错误')
  } else {
    originalConsoleError(`❌ 检测到 ${errors.length} 个 removeChild 错误:`)
    errors.forEach((error, index) => {
      originalConsoleError(`\n错误 #${index + 1}:`)
      originalConsoleError('  时间:', new Date(error.timestamp).toLocaleString())
      originalConsoleError('  错误前自动刷新次数:', error.autoRefreshCount)
      originalConsoleError('  错误前组件渲染次数:', error.componentRenderCount)
      originalConsoleError('  错误前状态更新次数:', error.stateUpdateCount)
      originalConsoleError('  错误前 DOM 变化次数:', error.domMutationCount)
      
      // 分析可能的原因
      if (error.autoRefreshCount > 0) {
        originalConsoleWarn('  ⚠️ 可能原因: 自动刷新导致组件重新渲染')
      }
      if (error.componentRenderCount > 0) {
        originalConsoleWarn('  ⚠️ 可能原因: 组件频繁渲染导致 DOM 操作冲突')
      }
      if (error.domMutationCount > 0) {
        originalConsoleWarn('  ⚠️ 可能原因: DOM 频繁变化导致节点关系改变')
      }
    })
  }
  
  originalConsoleLog('\n%c7. API 错误分析', 'font-size: 14px; font-weight: bold; color: #ff6b6b;')
  if (apiErrors.length === 0) {
    originalConsoleLog('✅ 未检测到 API 错误')
  } else {
    originalConsoleError(`❌ 检测到 ${apiErrors.length} 个 API 错误:`)
    
    if (useCasesErrors.length > 0) {
      originalConsoleError(`\n📋 使用场景查询错误 (${useCasesErrors.length} 个):`)
      useCasesErrors.forEach((error, index) => {
        originalConsoleError(`\n错误 #${index + 1}:`)
        originalConsoleError('  时间:', new Date(error.timestamp).toLocaleString())
        originalConsoleError('  URL:', error.url)
        if (error.status) {
          originalConsoleError('  状态:', error.status, error.statusText)
        }
        if (error.error) {
          originalConsoleError('  错误:', error.error)
        }
        if (error.errorDetails) {
          originalConsoleError('  详情:', error.errorDetails)
        }
        if (error.duration) {
          originalConsoleError('  耗时:', error.duration, 'ms')
        }
      })
    }
    
    const otherErrors = apiErrors.filter(e => e.type !== 'UseCasesQueryError' && e.type !== 'UseCasesQueryNetworkError')
    if (otherErrors.length > 0) {
      originalConsoleError(`\n其他 API 错误 (${otherErrors.length} 个):`)
      otherErrors.slice(-5).forEach((error, index) => {
        originalConsoleError(`  ${index + 1}. [${new Date(error.timestamp).toLocaleTimeString()}] ${error.url || '未知URL'}`)
      })
    }
  }
  
  originalConsoleLog('\n%c8. 修复建议', 'font-size: 14px; font-weight: bold; color: #a8e6cf;')
  
  if (useCasesQueries.length > 20) {
    originalConsoleLog('🔧 使用场景查询过于频繁:')
    originalConsoleLog('  - 检查是否有多个组件同时查询')
    originalConsoleLog('  - 考虑使用缓存减少查询次数')
    originalConsoleLog('  - 检查自动刷新是否在查询时触发')
    originalConsoleLog('  - 考虑合并多个统计查询为单个请求')
  }
  
  if (autoRefreshes.length > 10) {
    originalConsoleLog('🔧 自动刷新过于频繁:')
    originalConsoleLog('  - 检查自动刷新间隔设置')
    originalConsoleLog('  - 考虑增加刷新间隔时间')
    originalConsoleLog('  - 检查是否有多个自动刷新定时器同时运行')
  }
  
  if (useCasesErrors.length > 0) {
    originalConsoleLog('🔧 使用场景查询错误修复:')
    originalConsoleLog('  - 检查 API 路由是否正确')
    originalConsoleLog('  - 检查数据库连接是否正常')
    originalConsoleLog('  - 检查查询参数是否正确')
    originalConsoleLog('  - 检查是否有权限问题')
    originalConsoleLog('  - 查看服务器日志获取详细错误信息')
  }
  
  if (componentRenders.length > 50) {
    originalConsoleLog('🔧 组件渲染过于频繁:')
    originalConsoleLog('  - 检查组件依赖项，避免不必要的重新渲染')
    originalConsoleLog('  - 使用 React.memo 优化组件')
    originalConsoleLog('  - 检查状态更新是否导致级联渲染')
  }
  
  if (errors.length > 0) {
    originalConsoleLog('🔧 removeChild 错误修复:')
    originalConsoleLog('  - 在 removeChild 前检查节点关系')
    originalConsoleLog('  - 使用 element.remove() 替代 removeChild')
    originalConsoleLog('  - 确保组件卸载时清理所有 DOM 操作')
    originalConsoleLog('  - 检查自动刷新是否在组件卸载时仍在执行')
  }
  
  return {
    totalUpdates: forceUpdates.length,
    autoRefreshes: autoRefreshes.length,
    componentRenders: componentRenders.length,
    stateUpdates: stateUpdates.length,
    domMutations: domMutations.length,
    apiErrors: apiErrors.length,
    useCasesQueries: useCasesQueries.length,
    useCasesErrors: useCasesErrors.length,
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

