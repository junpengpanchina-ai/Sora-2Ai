/**
 * 用户场景同步调试脚本
 * 用于诊断前端为什么没有同步用户场景数据
 * 
 * 使用方法：
 * 1. 打开浏览器控制台（F12）
 * 2. 复制整个脚本内容
 * 3. 粘贴到控制台并执行
 * 4. 查看调试输出
 */

(function() {
  'use strict'
  
  console.log('%c🔍 用户场景同步调试工具', 'font-size: 16px; font-weight: bold; color: #3B82F6;')
  console.log('开始诊断用户场景同步问题...\n')
  
  // ==================== 1. 检查用户认证状态 ====================
  console.group('👤 用户认证状态检查')
  
  const checkUserAuth = async () => {
    try {
      // 检查 localStorage 中的 session
      const sessionKeys = Object.keys(localStorage).filter(key => 
        key.includes('supabase') || key.includes('auth') || key.includes('session')
      )
      console.log('Session 相关 localStorage keys:', sessionKeys)
      
      // 检查是否有 Supabase client
      let supabaseClient = null
      if (typeof window !== 'undefined' && window.supabase) {
        supabaseClient = window.supabase
        console.log('✅ 找到全局 Supabase client')
      } else {
        console.warn('⚠️ 未找到全局 Supabase client')
      }
      
      // 尝试调用需要认证的 API
      const testEndpoints = [
        '/api/payment/recharge-records',
        '/api/use-cases',
        '/api/stats'
      ]
      
      for (const endpoint of testEndpoints) {
        try {
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          })
          
          console.log(`${endpoint}:`, {
            status: response.status,
            ok: response.ok,
            statusText: response.statusText
          })
          
          if (response.status === 401) {
            console.warn(`❌ ${endpoint} - 401 未授权`)
          } else if (response.ok) {
            console.log(`✅ ${endpoint} - 认证成功`)
          }
        } catch (error) {
          console.error(`❌ ${endpoint} - 请求失败:`, error.message)
        }
      }
    } catch (error) {
      console.error('❌ 检查用户状态失败:', error)
    }
  }
  
  await checkUserAuth()
  console.groupEnd()
  
  // ==================== 2. 检查 Use Cases API 调用 ====================
  console.group('📚 Use Cases API 检查')
  
  const checkUseCasesAPI = async () => {
    try {
      console.log('正在检查 Use Cases API...')
      
      const response = await fetch('/api/use-cases', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      
      console.log('API 响应状态:', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Use Cases 数据:', {
          success: data.success,
          total: data.useCases?.length || 0,
          hasData: !!data.useCases,
          firstItem: data.useCases?.[0] || null
        })
        
        if (data.useCases && data.useCases.length > 0) {
          console.table(data.useCases.slice(0, 5).map(uc => ({
            id: uc.id,
            title: uc.title?.substring(0, 30) || 'N/A',
            industry: uc.industry || 'N/A',
            scene: uc.scene || 'N/A',
            status: uc.status || 'N/A'
          })))
        } else {
          console.warn('⚠️ Use Cases 数据为空')
        }
      } else {
        const errorText = await response.text()
        console.error('❌ Use Cases API 错误:', {
          status: response.status,
          error: errorText
        })
      }
    } catch (error) {
      console.error('❌ Use Cases API 请求失败:', error)
    }
  }
  
  await checkUseCasesAPI()
  console.groupEnd()
  
  // ==================== 3. 检查前端组件状态 ====================
  console.group('🎨 前端组件状态检查')
  
  const checkFrontendComponents = () => {
    try {
      // 检查 React 组件
      const reactRoot = document.querySelector('#__next') || document.querySelector('[data-reactroot]')
      if (reactRoot) {
        console.log('✅ 找到 React 根元素')
      } else {
        console.warn('⚠️ 未找到 React 根元素')
      }
      
      // 检查 Use Cases 相关元素
      const useCasesElements = {
        searchInput: document.querySelector('input[placeholder*="Search"], input[placeholder*="搜索"]'),
        useCasesList: document.querySelector('[class*="use-case"], [class*="UseCase"]'),
        totalCount: document.querySelector('text*="Total", text*="总数"'),
        categoryFilters: document.querySelectorAll('[class*="category"], [class*="filter"]')
      }
      
      console.log('Use Cases 页面元素:', {
        searchInput: !!useCasesElements.searchInput,
        useCasesList: !!useCasesElements.useCasesList,
        categoryFilters: useCasesElements.categoryFilters.length
      })
      
      // 检查是否有错误消息
      const errorMessages = document.querySelectorAll('[class*="error"], [class*="Error"], [class*="empty"]')
      if (errorMessages.length > 0) {
        console.warn('⚠️ 发现可能的错误消息元素:', errorMessages.length)
        errorMessages.forEach((el, idx) => {
          console.log(`错误消息 ${idx + 1}:`, el.textContent?.substring(0, 100))
        })
      }
      
      // 检查 localStorage 和 sessionStorage
      const storageData = {
        localStorage: {
          pending_recharge_id: localStorage.getItem('pending_recharge_id'),
          post_login_redirect: localStorage.getItem('post_login_redirect'),
          supabaseKeys: Object.keys(localStorage).filter(k => k.includes('supabase'))
        },
        sessionStorage: {
          payment_checkout_redirect_attempt: sessionStorage.getItem('payment_checkout_redirect_attempt'),
          sessionKeys: Object.keys(sessionStorage).filter(k => k.includes('session') || k.includes('auth'))
        }
      }
      
      console.log('存储数据:', storageData)
      
    } catch (error) {
      console.error('❌ 检查前端组件失败:', error)
    }
  }
  
  checkFrontendComponents()
  console.groupEnd()
  
  // ==================== 4. 监控 API 调用 ====================
  console.group('📡 API 调用监控')
  
  const apiCalls: Array<{
    url: string
    method: string
    status?: number
    timestamp: string
    error?: string
  }> = []
  
  // 拦截 fetch 调用
  const originalFetch = window.fetch
  window.fetch = async function(...args) {
    const [input, init] = args
    const url = typeof input === 'string' ? input : input.url
    const method = init?.method || 'GET'
    
    const callInfo = {
      url,
      method,
      timestamp: new Date().toISOString()
    }
    
    try {
      const response = await originalFetch.apply(this, args)
      callInfo.status = response.status
      
      // 记录 Use Cases 相关调用
      if (url.includes('use-case') || url.includes('use_cases')) {
        console.log('📚 Use Cases API 调用:', {
          url,
          method,
          status: response.status,
          ok: response.ok
        })
        
        if (response.ok) {
          try {
            const clone = response.clone()
            const data = await clone.json()
            console.log('Use Cases 响应数据:', {
              success: data.success,
              count: data.useCases?.length || data.data?.length || 0
            })
          } catch {
            // 忽略解析错误
          }
        }
      }
      
      // 记录认证相关调用
      if (response.status === 401) {
        console.warn('🚨 401 未授权:', url)
      }
      
      apiCalls.push(callInfo)
      return response
    } catch (error) {
      callInfo.error = error instanceof Error ? error.message : 'Unknown error'
      apiCalls.push(callInfo)
      console.error('❌ API 调用失败:', callInfo)
      throw error
    }
  }
  
  console.log('✅ API 调用监控已启动')
  console.log('💡 所有 API 调用将被记录')
  console.groupEnd()
  
  // ==================== 5. 检查网络请求 ====================
  console.group('🌐 网络请求检查')
  
  const checkNetworkRequests = () => {
    if (typeof PerformanceObserver !== 'undefined') {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name.includes('use-case') || entry.name.includes('use_cases')) {
              console.log('Use Cases 网络请求:', {
                name: entry.name,
                duration: entry.duration,
                type: entry.entryType
              })
            }
          }
        })
        
        observer.observe({ entryTypes: ['resource', 'navigation'] })
        console.log('✅ 性能监控已启动')
      } catch (error) {
        console.warn('⚠️ 性能监控启动失败:', error)
      }
    }
    
    // 检查已完成的请求
    if (performance && performance.getEntriesByType) {
      const resources = performance.getEntriesByType('resource')
      const useCaseRequests = resources.filter(r => 
        r.name.includes('use-case') || r.name.includes('use_cases')
      )
      
      if (useCaseRequests.length > 0) {
        console.log('已完成的 Use Cases 请求:', useCaseRequests.length)
        useCaseRequests.forEach(req => {
          console.log('  -', req.name, `(${req.duration.toFixed(2)}ms)`)
        })
      } else {
        console.warn('⚠️ 未发现 Use Cases 相关请求')
      }
    }
  }
  
  checkNetworkRequests()
  console.groupEnd()
  
  // ==================== 6. 诊断工具 ====================
  console.group('🛠️ 诊断工具')
  
  // 确保在全局作用域创建对象，添加错误处理
  try {
    // 保存变量引用，确保闭包正常工作
    const debugApiCalls = apiCalls
    const debugOriginalFetch = originalFetch
    const debugCheckUserAuth = checkUserAuth
    const debugCheckUseCasesAPI = checkUseCasesAPI
    
    window.userScenariosSyncDebug = {
      // 查看 API 调用历史
      getApiCalls: () => {
        console.table(debugApiCalls)
        return debugApiCalls
      },
      
      // 重新检查用户认证
      checkAuth: debugCheckUserAuth,
      
      // 重新检查 Use Cases
      checkUseCases: debugCheckUseCasesAPI,
      
      // 手动触发 Use Cases 加载
      reloadUseCases: async () => {
        console.log('🔄 手动重新加载 Use Cases...')
        try {
          const response = await fetch('/api/use-cases?t=' + Date.now(), {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store'
          })
          
          const data = await response.json()
          console.log('重新加载结果:', {
            status: response.status,
            success: data.success,
            count: data.useCases?.length || 0
          })
          
          return data
        } catch (error) {
          console.error('重新加载失败:', error)
          return { error: error instanceof Error ? error.message : 'Unknown error' }
        }
      },
      
      // 检查特定用户场景
      checkUserScenarios: async (userId) => {
        console.log('🔍 检查用户场景:', userId)
        try {
          const response = await fetch(`/api/use-cases?user_id=${userId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          })
          
          const data = await response.json()
          console.log('用户场景数据:', data)
          return data
        } catch (error) {
          console.error('检查用户场景失败:', error)
          return { error: error instanceof Error ? error.message : 'Unknown error' }
        }
      },
      
      // 清除监控
      clear: () => {
        if (debugOriginalFetch) {
          window.fetch = debugOriginalFetch
        }
        console.log('✅ 已清除监控')
      }
    }
    
    console.log('✅ 诊断工具已创建')
    console.log('💡 使用 window.userScenariosSyncDebug 访问工具')
    console.log('   示例: window.userScenariosSyncDebug.getApiCalls()')
    console.log('   示例: window.userScenariosSyncDebug.reloadUseCases()')
    console.log('   示例: window.userScenariosSyncDebug.checkUserScenarios("user-id")')
    
    // 验证对象已创建
    if (window.userScenariosSyncDebug && typeof window.userScenariosSyncDebug.getApiCalls === 'function') {
      console.log('✅ window.userScenariosSyncDebug 对象已成功创建')
    } else {
      console.error('❌ window.userScenariosSyncDebug 对象创建失败')
      // 创建备用对象
      window.userScenariosSyncDebug = {
        error: '对象创建失败',
        getApiCalls: () => {
          console.error('诊断工具未正确初始化')
          return []
        },
        checkAuth: () => {
          console.error('诊断工具未正确初始化')
        },
        checkUseCases: () => {
          console.error('诊断工具未正确初始化')
        },
        reloadUseCases: () => {
          console.error('诊断工具未正确初始化')
          return { error: '工具未初始化' }
        },
        checkUserScenarios: () => {
          console.error('诊断工具未正确初始化')
          return { error: '工具未初始化' }
        },
        clear: () => {
          console.log('诊断工具未正确初始化，无法清除监控')
        }
      }
    }
  } catch (error) {
    console.error('❌ 创建诊断工具失败:', error)
    // 即使出错也创建一个基本对象，避免 undefined 错误
    window.userScenariosSyncDebug = {
      error: error instanceof Error ? error.message : 'Unknown error',
      getApiCalls: () => {
        console.error('诊断工具初始化失败:', error instanceof Error ? error.message : 'Unknown error')
        return []
      },
      checkAuth: () => {
        console.error('诊断工具初始化失败:', error instanceof Error ? error.message : 'Unknown error')
      },
      checkUseCases: () => {
        console.error('诊断工具初始化失败:', error instanceof Error ? error.message : 'Unknown error')
      },
      reloadUseCases: () => {
        console.error('诊断工具初始化失败:', error instanceof Error ? error.message : 'Unknown error')
        return { error: error instanceof Error ? error.message : 'Unknown error' }
      },
      checkUserScenarios: () => {
        console.error('诊断工具初始化失败:', error instanceof Error ? error.message : 'Unknown error')
        return { error: error instanceof Error ? error.message : 'Unknown error' }
      },
      clear: () => {
        console.log('诊断工具未正确初始化，无法清除监控')
      }
    }
  }
  
  console.groupEnd()
  
  console.log('\n✅ 用户场景同步调试脚本已加载完成！')
  console.log('💡 现在可以：')
  console.log('   1. 查看上面的诊断结果')
  console.log('   2. 使用 window.userScenariosSyncDebug 工具进行进一步检查')
  console.log('   3. 尝试重新加载 Use Cases: window.userScenariosSyncDebug.reloadUseCases()')
  console.log('💡 如果 window.userScenariosSyncDebug 未定义，请刷新页面后重新执行脚本')
  
})();

