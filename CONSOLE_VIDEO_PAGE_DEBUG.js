/**
 * 视频生成页面调试脚本
 * 
 * 问题检测：
 * 1. 乱码问题（URL 参数、编码）
 * 2. 自动刷新问题
 * 3. 视频生成 API 调用
 * 4. 积分消耗情况
 * 5. 错误处理
 * 
 * 使用方法：
 * 1. 打开视频生成页面
 * 2. 打开浏览器控制台（F12）
 * 3. 复制粘贴此脚本并执行
 */

(function() {
  console.log('🔍 开始视频生成页面诊断...\n')
  
  // ==================== 1. 页面基本信息 ====================
  console.group('📋 页面基本信息')
  console.log('URL:', window.location.href)
  console.log('Pathname:', window.location.pathname)
  console.log('Search:', window.location.search)
  console.log('Hash:', window.location.hash)
  console.log('Document Title:', document.title)
  console.log('Document Charset:', document.characterSet || document.charset)
  console.log('Document Encoding:', document.inputEncoding || 'unknown')
  console.groupEnd()
  
  // ==================== 2. URL 参数解析（乱码检测） ====================
  console.group('🔤 URL 参数解析（乱码检测）')
  const urlParams = new URLSearchParams(window.location.search)
  const params = {}
  urlParams.forEach((value, key) => {
    params[key] = value
    // 检测乱码
    const hasGarbledText = /[^\x00-\x7F]/.test(value) && !/[\u4e00-\u9fa5]/.test(value)
    if (hasGarbledText) {
      console.warn(`⚠️ 参数 "${key}" 可能包含乱码:`, value)
      console.log('  原始编码:', encodeURIComponent(value))
      console.log('  尝试解码:', decodeURIComponent(value))
    }
  })
  console.log('所有 URL 参数:', params)
  
  // 检查 prompt 参数
  if (params.prompt) {
    console.log('Prompt 参数:', params.prompt)
    console.log('Prompt 长度:', params.prompt.length)
    console.log('Prompt 编码检查:', {
      original: params.prompt,
      encoded: encodeURIComponent(params.prompt),
      decoded: decodeURIComponent(params.prompt),
      hasSpecialChars: /[^\w\s\-.,!?]/.test(params.prompt)
    })
  }
  console.groupEnd()
  
  // ==================== 3. 自动刷新检测 ====================
  console.group('🔄 自动刷新检测')
  
  // 检测页面刷新相关代码
  const scripts = Array.from(document.scripts)
  const refreshPatterns = [
    /location\.reload/,
    /window\.location\.reload/,
    /router\.refresh/,
    /router\.reload/,
    /setInterval.*reload/,
    /setTimeout.*reload/,
    /meta.*refresh/i
  ]
  
  let foundRefresh = false
  scripts.forEach((script, index) => {
    if (script.textContent) {
      refreshPatterns.forEach(pattern => {
        if (pattern.test(script.textContent)) {
          console.warn(`⚠️ 发现刷新代码 (Script ${index}):`, pattern)
          foundRefresh = true
        }
      })
    }
  })
  
  // 检查 meta refresh
  const metaRefresh = document.querySelector('meta[http-equiv="refresh"]')
  if (metaRefresh) {
    console.warn('⚠️ 发现 Meta Refresh:', metaRefresh.content)
    foundRefresh = true
  }
  
  // 监听页面卸载（可能是自动刷新）
  let unloadCount = 0
  const originalUnload = window.onbeforeunload
  window.addEventListener('beforeunload', () => {
    unloadCount++
    console.warn(`⚠️ 页面即将卸载 (第 ${unloadCount} 次)`)
  })
  
  // 监听 visibility change（可能是自动刷新）
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      console.warn('⚠️ 页面变为隐藏状态')
    } else {
      console.warn('⚠️ 页面变为可见状态')
    }
  })
  
  if (!foundRefresh) {
    console.log('✅ 未发现明显的自动刷新代码')
  }
  
  console.groupEnd()
  
  // ==================== 4. React 状态检测 ====================
  console.group('⚛️ React 状态检测')
  
  // 尝试获取 React 组件状态
  const reactRoot = document.querySelector('#__next') || document.querySelector('[data-reactroot]')
  if (reactRoot) {
    console.log('✅ 找到 React 根元素')
    
    // 检查是否有视频相关的元素
    const videoElements = document.querySelectorAll('video')
    console.log('视频元素数量:', videoElements.length)
    videoElements.forEach((video, index) => {
      console.log(`视频 ${index + 1}:`, {
        src: video.src,
        currentSrc: video.currentSrc,
        readyState: video.readyState,
        error: video.error,
        networkState: video.networkState
      })
    })
    
    // 检查是否有错误信息
    const errorElements = document.querySelectorAll('[class*="error"], [id*="error"], [role="alert"]')
    if (errorElements.length > 0) {
      console.warn('⚠️ 发现错误元素:', errorElements.length)
      errorElements.forEach((el, index) => {
        console.log(`错误 ${index + 1}:`, el.textContent)
      })
    }
  } else {
    console.warn('⚠️ 未找到 React 根元素')
  }
  
  console.groupEnd()
  
  // ==================== 5. API 调用监控 ====================
  console.group('🌐 API 调用监控')
  
  // 拦截 fetch 请求
  const originalFetch = window.fetch
  const apiCalls = []
  
  window.fetch = function(...args) {
    const url = args[0]
    const options = args[1] || {}
    
    // 记录 API 调用
    if (typeof url === 'string' && (url.includes('/api/') || url.includes('/video'))) {
      const callInfo = {
        url,
        method: options.method || 'GET',
        timestamp: new Date().toISOString(),
        body: options.body
      }
      apiCalls.push(callInfo)
      
      console.log('📡 API 调用:', callInfo)
      
      // 如果是视频生成 API
      if (url.includes('/api/video/generate')) {
        console.warn('🎬 视频生成 API 调用:', {
          url,
          method: callInfo.method,
          body: options.body ? JSON.parse(options.body) : null
        })
      }
      
      // 如果是视频结果 API
      if (url.includes('/api/video/result')) {
        console.warn('📹 视频结果 API 调用:', {
          url,
          method: callInfo.method
        })
      }
    }
    
    return originalFetch.apply(this, args)
      .then(response => {
        // 记录响应
        if (typeof url === 'string' && (url.includes('/api/') || url.includes('/video'))) {
          console.log('📥 API 响应:', {
            url,
            status: response.status,
            statusText: response.statusText,
            ok: response.ok
          })
          
          // 克隆响应以便读取 body
          response.clone().json().then(data => {
            console.log('📦 API 响应数据:', data)
            
            // 检查错误
            if (!response.ok || !data.success) {
              console.error('❌ API 错误:', {
                url,
                status: response.status,
                error: data.error,
                details: data.details,
                technicalDetails: data.technicalDetails
              })
            }
            
            // 检查积分相关
            if (data.credits !== undefined) {
              console.warn('💰 积分信息:', {
                credits: data.credits,
                consumed: data.creditsConsumed,
                remaining: data.creditsRemaining
              })
            }
          }).catch(() => {
            // 忽略 JSON 解析错误
          })
        }
        
        return response
      })
      .catch(error => {
        console.error('❌ API 调用失败:', {
          url,
          error: error.message,
          stack: error.stack
        })
        throw error
      })
  }
  
  console.log('✅ Fetch 拦截器已安装')
  console.log('提示: 所有 API 调用将被记录')
  
  console.groupEnd()
  
  // ==================== 6. 积分消耗检测 ====================
  console.group('💰 积分消耗检测')
  
  // 检查 localStorage 中的积分信息
  const storedCredits = localStorage.getItem('credits')
  if (storedCredits) {
    console.log('本地存储的积分:', storedCredits)
  }
  
  // 监听积分相关的 API 调用
  const creditApiPatterns = [
    /credits/,
    /consumption/,
    /deduct/,
    /refund/
  ]
  
  console.log('提示: 积分相关的 API 调用将在上面显示')
  
  console.groupEnd()
  
  // ==================== 7. 错误监听 ====================
  console.group('🚨 错误监听')
  
  // 全局错误监听
  window.addEventListener('error', (event) => {
    console.error('❌ 全局错误:', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error
    })
  })
  
  // Promise 错误监听
  window.addEventListener('unhandledrejection', (event) => {
    console.error('❌ 未处理的 Promise 拒绝:', {
      reason: event.reason,
      promise: event.promise
    })
  })
  
  // React 错误边界（如果存在）
  const errorBoundary = document.querySelector('[data-error-boundary]')
  if (errorBoundary) {
    console.warn('⚠️ 发现错误边界元素')
  }
  
  console.log('✅ 错误监听器已安装')
  
  console.groupEnd()
  
  // ==================== 8. 视频生成状态检测 ====================
  console.group('🎥 视频生成状态检测')
  
  // 检查是否有正在进行的任务
  const checkVideoTask = async () => {
    try {
      // 尝试从 localStorage 获取任务 ID
      const taskId = localStorage.getItem('currentVideoTaskId')
      if (taskId) {
        console.log('📋 发现任务 ID:', taskId)
        
        // 检查任务状态
        const response = await fetch(`/api/video/result/${taskId}`)
        const data = await response.json()
        
        console.log('📊 任务状态:', {
          taskId,
          status: data.status,
          progress: data.progress,
          videoUrl: data.video_url,
          error: data.error
        })
        
        if (data.status === 'processing') {
          console.warn('⚠️ 任务仍在处理中，可能正在消耗积分')
        } else if (data.status === 'failed') {
          console.error('❌ 任务失败:', data.error)
        } else if (data.status === 'succeeded') {
          console.log('✅ 任务成功:', data.video_url)
        }
      } else {
        console.log('ℹ️ 未发现当前任务 ID')
      }
    } catch (error) {
      console.error('❌ 检查任务状态失败:', error)
    }
  }
  
  // 立即检查
  checkVideoTask()
  
  // 每 5 秒检查一次
  const taskCheckInterval = setInterval(checkVideoTask, 5000)
  
  console.log('✅ 任务状态监控已启动（每 5 秒检查一次）')
  console.log('提示: 使用 clearInterval(taskCheckInterval) 停止监控')
  
  console.groupEnd()
  
  // ==================== 9. 诊断报告 ====================
  console.group('📊 诊断报告')
  
  const report = {
    timestamp: new Date().toISOString(),
    url: window.location.href,
    hasGarbledText: Object.values(params).some(v => /[^\x00-\x7F]/.test(v) && !/[\u4e00-\u9fa5]/.test(v)),
    hasRefreshCode: foundRefresh,
    videoElements: document.querySelectorAll('video').length,
    errorElements: document.querySelectorAll('[class*="error"], [id*="error"], [role="alert"]').length,
    apiCallsCount: apiCalls.length
  }
  
  console.log('诊断结果:', report)
  
  // 生成建议
  const suggestions = []
  
  if (report.hasGarbledText) {
    suggestions.push('⚠️ 发现可能的乱码问题，检查 URL 参数编码')
  }
  
  if (report.hasRefreshCode) {
    suggestions.push('⚠️ 发现自动刷新代码，可能导致页面重复加载')
  }
  
  if (report.videoElements === 0) {
    suggestions.push('⚠️ 未发现视频元素，可能视频未加载')
  }
  
  if (report.errorElements > 0) {
    suggestions.push('⚠️ 发现错误元素，检查页面错误信息')
  }
  
  if (suggestions.length === 0) {
    suggestions.push('✅ 未发现明显问题')
  }
  
  console.log('建议:', suggestions)
  
  console.groupEnd()
  
  // ==================== 10. 导出诊断工具 ====================
  // 确保在全局作用域创建对象，添加错误处理
  try {
    // 保存变量引用，确保闭包正常工作
    const debugApiCalls = apiCalls
    const debugReport = report
    const debugSuggestions = suggestions
    const debugTaskCheckInterval = taskCheckInterval
    const debugOriginalFetch = originalFetch
    
    window.videoPageDebug = {
    // 重新检查
    recheck: () => {
      console.log('🔄 重新检查...')
      location.reload()
    },
    
    // 查看 API 调用历史
    getApiCalls: () => {
      console.table(apiCalls)
      return apiCalls
    },
    
    // 检查任务状态
    checkTask: checkVideoTask,
    
    // 停止任务监控
    stopMonitoring: () => {
      clearInterval(taskCheckInterval)
      console.log('✅ 已停止任务监控')
    },
    
    // 获取诊断报告
    getReport: () => {
      return {
        ...report,
        apiCalls,
        suggestions
      }
    },
    
    // 清除所有监控
    clear: () => {
      clearInterval(taskCheckInterval)
      window.fetch = originalFetch
      console.log('✅ 已清除所有监控')
    }
  }
  
  console.log('\n✅ 诊断脚本已加载完成！')
  console.log('💡 使用 window.videoPageDebug 访问诊断工具')
  console.log('   示例: window.videoPageDebug.getReport()')
  console.log('   示例: window.videoPageDebug.getApiCalls()')
  console.log('   示例: window.videoPageDebug.checkTask()')
  console.log('   示例: window.videoPageDebug.stopMonitoring()')
  console.log('   示例: window.videoPageDebug.clear()')
  
  // 验证对象已创建
  if (window.videoPageDebug && typeof window.videoPageDebug.getReport === 'function') {
    console.log('✅ window.videoPageDebug 对象已成功创建')
  } else {
    console.error('❌ window.videoPageDebug 对象创建失败')
    // 创建备用对象
    window.videoPageDebug = {
      error: '对象创建失败',
      getReport: () => ({ error: '诊断工具初始化失败' }),
      getApiCalls: () => [],
      checkTask: () => console.error('诊断工具未正确初始化'),
      stopMonitoring: () => {},
      clear: () => {}
    }
  }
  
  } catch (error) {
    console.error('❌ 创建诊断工具失败:', error)
    // 即使出错也创建一个基本对象
    window.videoPageDebug = {
      error: error.message,
      getReport: () => ({ error: '诊断工具初始化失败' }),
      getApiCalls: () => [],
      checkTask: () => console.error('诊断工具未正确初始化'),
      stopMonitoring: () => {},
      clear: () => {}
    }
  }
  
})();

