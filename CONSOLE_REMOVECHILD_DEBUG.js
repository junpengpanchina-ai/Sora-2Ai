// removeChild 错误诊断工具 - 详细追踪 DOM 操作错误
// 粘贴到浏览器控制台运行

console.clear()
console.log('%c🔍 removeChild 错误诊断工具', 'font-size: 16px; font-weight: bold; color: #ef4444;')
console.log('='.repeat(60))

// 数据收集
const removeChildErrors = []
const domOperations = []
const componentStates = []
let errorCount = 0

// 1. 捕获所有 removeChild 错误
const originalErrorHandler = window.onerror
window.onerror = function(message, source, lineno, colno, error) {
  if (message && (message.includes('removeChild') || message.includes('not a child'))) {
    errorCount++
    const errorInfo = {
      id: errorCount,
      type: 'removeChildError',
      message: String(message),
      source: String(source),
      lineno,
      colno,
      stack: error?.stack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    }
    
    removeChildErrors.push(errorInfo)
    
    console.error(`%c❌ removeChild 错误 #${errorCount}`, 'color: red; font-weight: bold; font-size: 14px;')
    console.error('时间:', new Date().toLocaleString())
    console.error('消息:', errorInfo.message)
    console.error('来源:', errorInfo.source)
    console.error('位置:', `行 ${errorInfo.lineno}, 列 ${errorInfo.colno}`)
    console.error('堆栈:', errorInfo.stack)
    console.error('完整信息:', errorInfo)
    
    // 分析堆栈跟踪
    if (error?.stack) {
      analyzeStackTrace(error.stack)
    }
  }
  
  if (originalErrorHandler) {
    return originalErrorHandler.apply(this, arguments)
  }
  return false
}

// 2. 捕获未处理的 Promise 拒绝
const originalUnhandledRejection = window.onunhandledrejection
window.onunhandledrejection = function(event) {
  const reason = event.reason
  const message = reason?.message || String(reason)
  
  if (message.includes('removeChild') || message.includes('not a child')) {
    errorCount++
    const errorInfo = {
      id: errorCount,
      type: 'removeChildPromiseRejection',
      message,
      stack: reason?.stack,
      reason,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    }
    
    removeChildErrors.push(errorInfo)
    
    console.error(`%c❌ removeChild Promise 拒绝 #${errorCount}`, 'color: orange; font-weight: bold; font-size: 14px;')
    console.error('时间:', new Date().toLocaleString())
    console.error('消息:', errorInfo.message)
    console.error('堆栈:', errorInfo.stack)
    console.error('完整信息:', errorInfo)
    
    if (reason?.stack) {
      analyzeStackTrace(reason.stack)
    }
  }
  
  if (originalUnhandledRejection) {
    return originalUnhandledRejection.apply(this, arguments)
  }
}

// 3. 监控所有 removeChild 调用
if (!window._removeChildDebugOriginal) {
  window._removeChildDebugOriginal = Node.prototype.removeChild
}
const originalRemoveChild = window._removeChildDebugOriginal

Node.prototype.removeChild = function(child) {
  const operationId = Date.now() + Math.random()
  const operation = {
    id: operationId,
    timestamp: new Date().toISOString(),
    parent: this,
    child: child,
    parentTag: this.tagName || this.nodeName || 'UNKNOWN',
    childTag: child.tagName || child.nodeName || 'UNKNOWN',
    parentId: this.id || null,
    childId: child.id || null,
    parentClass: this.className || null,
    childClass: child.className || null,
    isConnected: child.isConnected,
    parentContains: this.contains ? this.contains(child) : 'unknown',
    stack: new Error().stack,
  }
  
  domOperations.push(operation)
  
  // 检查是否会导致错误
  const willFail = !this.contains || !this.contains(child)
  
  if (willFail) {
    console.warn(`%c⚠️ 潜在的 removeChild 错误`, 'color: orange; font-weight: bold;')
    console.warn('操作 ID:', operationId)
    console.warn('父节点:', {
      tag: operation.parentTag,
      id: operation.parentId,
      class: operation.parentClass,
      node: this,
    })
    console.warn('子节点:', {
      tag: operation.childTag,
      id: operation.childId,
      class: operation.childClass,
      isConnected: operation.isConnected,
      node: child,
    })
    console.warn('检查结果:', {
      parentContains: operation.parentContains,
      willFail,
    })
    console.warn('调用堆栈:', operation.stack)
  }
  
  try {
    // 安全地执行 removeChild
    if (this.contains && this.contains(child)) {
      return originalRemoveChild.call(this, child)
    } else {
      console.warn(`%c⚠️ 阻止了 removeChild 错误`, 'color: yellow; font-weight: bold;')
      console.warn('节点不是子节点，安全返回')
      // 尝试使用 remove() 方法
      if (child.remove && typeof child.remove === 'function') {
        try {
          child.remove()
          console.log('✅ 使用 remove() 方法成功移除节点')
        } catch (e) {
          console.warn('remove() 方法也失败:', e)
        }
      }
      return child
    }
  } catch (error) {
    errorCount++
    const errorInfo = {
      id: errorCount,
      type: 'removeChildException',
      message: error.message,
      stack: error.stack,
      operation,
      timestamp: new Date().toISOString(),
    }
    
    removeChildErrors.push(errorInfo)
    
    console.error(`%c❌ removeChild 异常 #${errorCount}`, 'color: red; font-weight: bold; font-size: 14px;')
    console.error('错误:', error)
    console.error('操作信息:', operation)
    
    // 尝试安全处理
    if (child.remove && typeof child.remove === 'function') {
      try {
        child.remove()
        console.log('✅ 使用 remove() 方法作为后备方案')
      } catch (e) {
        console.warn('后备方案也失败:', e)
      }
    }
    
    return child
  }
}

// 4. 分析堆栈跟踪
function analyzeStackTrace(stack) {
  if (!stack) return
  
  console.log('\n%c📊 堆栈分析', 'font-size: 12px; font-weight: bold; color: #00d4ff;')
  
  const lines = stack.split('\n')
  const reactLines = lines.filter(line => 
    line.includes('react') || 
    line.includes('React') || 
    line.includes('a2') || 
    line.includes('a5') || 
    line.includes('a6')
  )
  
  if (reactLines.length > 0) {
    console.log('React 相关调用:')
    reactLines.forEach((line, index) => {
      console.log(`  ${index + 1}. ${line.trim()}`)
    })
  }
  
  const componentLines = lines.filter(line => 
    line.includes('Component') || 
    line.includes('useEffect') || 
    line.includes('useState') ||
    line.includes('VideoPage') ||
    line.includes('BatchGenerator') ||
    line.includes('AdminUseCases')
  )
  
  if (componentLines.length > 0) {
    console.log('组件相关调用:')
    componentLines.forEach((line, index) => {
      console.log(`  ${index + 1}. ${line.trim()}`)
    })
  }
}

// 5. 检查当前 DOM 状态
function checkDOMState() {
  console.log('\n%c📋 当前 DOM 状态', 'font-size: 14px; font-weight: bold; color: #4ecdc4;')
  
  // 检查所有可能的下载链接
  const downloadLinks = document.querySelectorAll('a[download]')
  console.log('下载链接数量:', downloadLinks.length)
  downloadLinks.forEach((link, index) => {
    console.log(`  链接 ${index + 1}:`, {
      href: link.href,
      download: link.download,
      isConnected: link.isConnected,
      parent: link.parentNode?.tagName || 'none',
    })
  })
  
  // 检查视频元素
  const videoElements = document.querySelectorAll('video')
  console.log('视频元素数量:', videoElements.length)
  
  // 检查是否有未连接的节点
  const allElements = document.querySelectorAll('*')
  const disconnected = Array.from(allElements).filter(el => !el.isConnected)
  if (disconnected.length > 0) {
    console.warn('发现未连接的节点:', disconnected.length)
  }
}

// 6. 检查 React 组件状态
function checkReactState() {
  console.log('\n%c⚛️ React 状态检查', 'font-size: 14px; font-weight: bold; color: #61dafb;')
  
  // 尝试从 React DevTools 获取信息
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    console.log('✅ React DevTools 已安装')
  } else {
    console.log('ℹ️ React DevTools 未检测到')
  }
  
  // 检查是否有挂载的组件
  const reactRoots = document.querySelectorAll('[data-reactroot], #__next, #root')
  console.log('React 根节点数量:', reactRoots.length)
  
  // 检查组件卸载标记
  if (window._videoDebugInstalled) {
    console.log('✅ 视频调试工具已安装')
  }
  if (window._batchDebugInstalled) {
    console.log('✅ 批量生成调试工具已安装')
  }
}

// 7. 生成详细报告
window.removeChildReport = function() {
  console.clear()
  console.log('%c📋 removeChild 错误详细报告', 'font-size: 18px; font-weight: bold; color: #00d4ff;')
  console.log('='.repeat(60))
  
  console.log('\n%c1. 错误统计', 'font-size: 14px; font-weight: bold; color: #ef4444;')
  console.log(`总错误数: ${removeChildErrors.length}`)
  console.log(`DOM 操作数: ${domOperations.length}`)
  
  if (removeChildErrors.length === 0) {
    console.log('✅ 未发现 removeChild 错误')
  } else {
    console.log('\n%c错误详情:', 'font-size: 12px; font-weight: bold;')
    removeChildErrors.forEach((error, index) => {
      console.log(`\n错误 #${index + 1}:`)
      console.log('  类型:', error.type)
      console.log('  时间:', new Date(error.timestamp).toLocaleString())
      console.log('  消息:', error.message)
      if (error.operation) {
        console.log('  操作信息:', error.operation)
      }
      if (error.stack) {
        console.log('  堆栈:', error.stack)
      }
    })
  }
  
  console.log('\n%c2. DOM 操作记录', 'font-size: 14px; font-weight: bold; color: #ff6b6b;')
  if (domOperations.length === 0) {
    console.log('ℹ️ 未记录到 DOM 操作')
  } else {
    console.log(`共记录 ${domOperations.length} 次操作`)
    console.log('最近 10 次操作:')
    domOperations.slice(-10).forEach((op, index) => {
      console.log(`\n操作 #${domOperations.length - 10 + index + 1}:`)
      console.log('  时间:', new Date(op.timestamp).toLocaleString())
      console.log('  父节点:', op.parentTag, op.parentId || '', op.parentClass || '')
      console.log('  子节点:', op.childTag, op.childId || '', op.childClass || '')
      console.log('  已连接:', op.isConnected)
      console.log('  父包含子:', op.parentContains)
    })
  }
  
  console.log('\n%c3. 当前状态', 'font-size: 14px; font-weight: bold; color: #4ecdc4;')
  checkDOMState()
  checkReactState()
  
  console.log('\n%c4. 修复建议', 'font-size: 14px; font-weight: bold; color: #a8e6cf;')
  
  if (removeChildErrors.length > 0) {
    console.log('🔧 基于错误分析的建议:')
    
    const hasReactErrors = removeChildErrors.some(e => e.stack?.includes('react') || e.stack?.includes('a2'))
    if (hasReactErrors) {
      console.log('  - 错误可能来自 React 内部渲染')
      console.log('  - 建议检查组件卸载时的清理逻辑')
      console.log('  - 确保所有异步操作在组件卸载前完成')
    }
    
    const hasVideoErrors = removeChildErrors.some(e => 
      e.stack?.includes('VideoPage') || 
      e.stack?.includes('video') ||
      e.operation?.childTag === 'A' && e.operation?.childId?.includes('download')
    )
    if (hasVideoErrors) {
      console.log('  - 错误可能与视频下载功能相关')
      console.log('  - 检查视频下载链接的移除逻辑')
      console.log('  - 确保下载链接在移除前检查父节点')
    }
    
    const hasBatchErrors = removeChildErrors.some(e => 
      e.stack?.includes('Batch') || 
      e.stack?.includes('IndustryScene')
    )
    if (hasBatchErrors) {
      console.log('  - 错误可能与批量生成组件相关')
      console.log('  - 检查轮询和状态更新的清理逻辑')
    }
    
    console.log('\n通用建议:')
    console.log('  1. 在 removeChild 前使用 contains() 检查')
    console.log('  2. 使用 element.remove() 替代 removeChild（更安全）')
    console.log('  3. 在组件卸载时清理所有 DOM 操作')
    console.log('  4. 使用 isMountedRef 检查组件状态')
  }
  
  return {
    errors: removeChildErrors,
    operations: domOperations,
    errorCount: removeChildErrors.length,
    operationCount: domOperations.length,
  }
}

// 8. 实时监控开关
let isMonitoring = true
window.removeChildMonitor = function(enable = true) {
  isMonitoring = enable
  console.log(`监控已${enable ? '开启' : '关闭'}`)
}

// 9. 清理工具
window.removeChildClean = function() {
  // 恢复原始函数
  if (window._removeChildDebugOriginal) {
    Node.prototype.removeChild = window._removeChildDebugOriginal
  }
  window.onerror = originalErrorHandler
  window.onunhandledrejection = originalUnhandledRejection
  
  // 清空数据
  removeChildErrors.length = 0
  domOperations.length = 0
  errorCount = 0
  
  console.log('✅ 调试工具已清理')
}

// 标记已安装
window._removeChildDebugInstalled = true

console.log('\n✅ 调试工具已启动')
console.log('\n可用命令:')
console.log('  removeChildReport()      - 查看详细报告')
console.log('  removeChildMonitor()     - 切换监控开关')
console.log('  removeChildClean()       - 清理调试工具')
console.log('  checkDOMState()          - 检查当前 DOM 状态')
console.log('  checkReactState()        - 检查 React 状态')
console.log('\n💡 工具会自动捕获所有 removeChild 错误并记录详细信息\n')

// 自动检查初始状态
setTimeout(() => {
  console.log('\n%c📊 初始状态检查', 'font-size: 12px; color: #888;')
  checkDOMState()
  checkReactState()
}, 1000)

