/**
 * 支付按钮调试脚本
 * 
 * 问题检测：
 * 1. 支付按钮点击事件
 * 2. API 调用错误
 * 3. 401 未授权
 * 4. 支付链接生成
 * 
 * 使用方法：
 * 1. 打开包含支付按钮的页面
 * 2. 打开浏览器控制台（F12）
 * 3. 复制粘贴此脚本并执行
 * 4. 点击支付按钮，查看调试信息
 */

(function() {
  console.log('🔍 开始支付按钮调试...\n')
  
  // ==================== 1. 检测支付按钮 ====================
  console.group('🔘 支付按钮检测')
  
  const checkoutButtons = Array.from(document.querySelectorAll('button')).filter(btn => {
    const text = btn.textContent || ''
    return text.includes('Checkout') || text.includes('Continue') || text.includes('Buy')
  })
  
  console.log('找到支付按钮数量:', checkoutButtons.length)
  checkoutButtons.forEach((btn, index) => {
    console.log(`按钮 ${index + 1}:`, {
      text: btn.textContent?.trim(),
      disabled: btn.disabled,
      hasOnClick: btn.onclick !== null,
      className: btn.className
    })
  })
  
  console.groupEnd()
  
  // ==================== 2. 拦截 fetch 请求 ====================
  console.group('🌐 API 调用监控')
  
  const originalFetch = window.fetch
  const apiCalls = []
  
  window.fetch = function(...args) {
    const url = args[0]
    const options = args[1] || {}
    
    // 记录支付相关 API 调用
    if (typeof url === 'string' && url.includes('/api/payment')) {
      const callInfo = {
        url,
        method: options.method || 'GET',
        timestamp: new Date().toISOString(),
        body: options.body
      }
      apiCalls.push(callInfo)
      
      console.log('💳 支付 API 调用:', callInfo)
      
      // 如果是支付链接 API
      if (url.includes('/api/payment/payment-link')) {
        console.warn('🎯 支付链接 API 调用:', {
          url,
          method: callInfo.method,
          body: options.body ? JSON.parse(options.body) : null
        })
      }
      
      return originalFetch.apply(this, args)
        .then(async response => {
          // 记录响应
          const responseData = await response.clone().json().catch(() => ({}))
          
          console.log('📥 支付 API 响应:', {
            url,
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            data: responseData
          })
          
          // 检查错误
          if (!response.ok) {
            console.error('❌ 支付 API 错误:', {
              url,
              status: response.status,
              error: responseData.error,
              details: responseData.details
            })
            
            // 401 未授权
            if (response.status === 401) {
              console.error('🚨 401 未授权 - 需要登录')
              console.log('建议: 检查用户是否已登录')
            }
            
            // 400 错误请求
            if (response.status === 400) {
              console.error('🚨 400 错误请求:', responseData)
            }
            
            // 500 服务器错误
            if (response.status === 500) {
              console.error('🚨 500 服务器错误:', responseData)
            }
          } else {
            // 成功响应
            if (responseData.success && responseData.payment_link_url) {
              console.log('✅ 支付链接生成成功:', responseData.payment_link_url)
            }
          }
          
          return response
        })
        .catch(error => {
          console.error('❌ 支付 API 调用失败:', {
            url,
            error: error.message,
            stack: error.stack
          })
          throw error
        })
    }
    
    return originalFetch.apply(this, args)
  }
  
  console.log('✅ Fetch 拦截器已安装')
  console.log('提示: 所有支付 API 调用将被记录')
  
  console.groupEnd()
  
  // ==================== 3. 监听按钮点击 ====================
  console.group('👆 按钮点击监控')
  
  // 为所有支付按钮添加点击监听
  checkoutButtons.forEach((btn, index) => {
    btn.addEventListener('click', (e) => {
      console.log(`🔘 按钮 ${index + 1} 被点击:`, {
        text: btn.textContent?.trim(),
        disabled: btn.disabled,
        timestamp: new Date().toISOString()
      })
      
      // 检查按钮是否被禁用
      if (btn.disabled) {
        console.warn('⚠️ 按钮被禁用，点击无效')
      }
    }, true) // 使用捕获阶段
  })
  
  console.log(`✅ 已为 ${checkoutButtons.length} 个按钮添加点击监听`)
  
  console.groupEnd()
  
  // ==================== 4. 检查支付计划数据 ====================
  console.group('📋 支付计划数据检查')
  
  const checkPaymentPlans = async () => {
    try {
      const response = await fetch('/api/payment/payment-link?t=' + Date.now(), { cache: 'no-store' })
      const data = await response.json()
      
      console.log('支付计划 API 响应:', data)
      
      if (data.success && data.payment_links) {
        console.log('✅ 支付计划加载成功')
        console.log('支付计划数量:', data.payment_links.length)
        
        // 查找 $4.9 计划
        const starterPlan = data.payment_links.find(p => p.amount <= 10 && p.amount > 0)
        if (starterPlan) {
          console.log('✅ 找到 Starter 计划:', starterPlan)
        } else {
          console.warn('⚠️ 未找到 Starter 计划（$4.9）')
        }
        
        // 显示所有计划
        console.table(data.payment_links.map(p => ({
          name: p.name,
          amount: `$${p.amount}`,
          credits: p.credits,
          videos: p.videos,
          id: p.id,
          hasPaymentLink: !!p.id
        })))
      } else {
        console.error('❌ 支付计划加载失败:', data.error || 'Unknown error')
      }
    } catch (error) {
      console.error('❌ 检查支付计划失败:', error)
    }
  }
  
  // 立即检查
  checkPaymentPlans()
  
  console.groupEnd()
  
  // ==================== 5. 检查用户登录状态 ====================
  console.group('👤 用户登录状态检查')
  
  const checkUserAuth = async () => {
    try {
      // 检查 localStorage 中的 session
      const sessionKeys = Object.keys(localStorage).filter(key => 
        key.includes('supabase') || key.includes('auth') || key.includes('session')
      )
      console.log('Session 相关 localStorage keys:', sessionKeys)
      
      // 尝试调用需要认证的 API
      const response = await fetch('/api/payment/payment-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_link_id: 'test' })
      })
      
      if (response.status === 401) {
        console.warn('⚠️ 用户未登录（401 Unauthorized）')
        console.log('建议: 用户需要先登录才能购买')
      } else if (response.ok) {
        console.log('✅ 用户已登录')
      } else {
        console.warn('⚠️ 未知状态:', response.status)
      }
    } catch (error) {
      console.error('❌ 检查用户状态失败:', error)
    }
  }
  
  // 延迟检查，避免干扰页面加载
  setTimeout(checkUserAuth, 1000)
  
  console.groupEnd()
  
  // ==================== 6. 错误监听 ====================
  console.group('🚨 错误监听')
  
  // 全局错误监听
  window.addEventListener('error', (event) => {
    if (event.message.includes('payment') || event.message.includes('checkout') || event.message.includes('stripe')) {
      console.error('❌ 支付相关错误:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        error: event.error
      })
    }
  })
  
  // Promise 错误监听
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && (
      event.reason.message?.includes('payment') || 
      event.reason.message?.includes('checkout') ||
      event.reason.message?.includes('stripe')
    )) {
      console.error('❌ 未处理的支付 Promise 拒绝:', {
        reason: event.reason,
        promise: event.promise
      })
    }
  })
  
  console.log('✅ 错误监听器已安装')
  
  console.groupEnd()
  
  // ==================== 7. 诊断工具 ====================
  console.group('🛠️ 诊断工具')
  
  // 确保在全局作用域创建对象，添加错误处理
  try {
    // 保存变量引用，确保闭包正常工作
    const debugApiCalls = apiCalls
    const debugOriginalFetch = originalFetch
    
    window.paymentCheckoutDebug = {
      // 查看 API 调用历史
      getApiCalls: () => {
        console.table(debugApiCalls)
        return debugApiCalls
      },
      
      // 检查支付计划
      checkPlans: checkPaymentPlans,
      
      // 检查用户状态
      checkAuth: checkUserAuth,
      
      // 测试支付链接 API（需要替换为真实的 payment_link_id）
      testCheckout: async (paymentLinkId) => {
        if (!paymentLinkId) {
          console.error('❌ 请提供 payment_link_id')
          return
        }
        
        console.log('🧪 测试支付链接 API:', paymentLinkId)
        
        try {
          const res = await fetch('/api/payment/payment-link', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ payment_link_id: paymentLinkId }),
          })
          
          const json = await res.json()
          
          console.log('测试结果:', {
            status: res.status,
            ok: res.ok,
            data: json
          })
          
          if (res.status === 401) {
            console.error('❌ 401 未授权 - 需要登录')
          } else if (!res.ok) {
            console.error('❌ 请求失败:', json.error)
          } else if (json.success) {
            console.log('✅ 支付链接生成成功:', json.payment_link_url)
          }
          
          return { status: res.status, data: json }
        } catch (error) {
          console.error('❌ 测试失败:', error)
          return { error: error.message }
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
    console.log('💡 使用 window.paymentCheckoutDebug 访问工具')
    console.log('   示例: window.paymentCheckoutDebug.getApiCalls()')
    console.log('   示例: window.paymentCheckoutDebug.checkPlans()')
    console.log('   示例: window.paymentCheckoutDebug.testCheckout("payment_link_id")')
    
    // 验证对象已创建
    if (window.paymentCheckoutDebug && typeof window.paymentCheckoutDebug.checkPlans === 'function') {
      console.log('✅ window.paymentCheckoutDebug 对象已成功创建')
    } else {
      console.error('❌ window.paymentCheckoutDebug 对象创建失败')
      // 创建备用对象
      window.paymentCheckoutDebug = {
        error: '对象创建失败',
        getApiCalls: () => {
          console.error('诊断工具未正确初始化')
          return []
        },
        checkPlans: () => {
          console.error('诊断工具未正确初始化')
        },
        checkAuth: () => {
          console.error('诊断工具未正确初始化')
        },
        testCheckout: () => {
          console.error('诊断工具未正确初始化')
        },
        clear: () => {}
      }
    }
  } catch (error) {
    console.error('❌ 创建诊断工具失败:', error)
    // 即使出错也创建一个基本对象，避免 undefined 错误
    window.paymentCheckoutDebug = {
      error: error.message,
      getApiCalls: () => {
        console.error('诊断工具初始化失败:', error.message)
        return []
      },
      checkPlans: () => {
        console.error('诊断工具初始化失败:', error.message)
      },
      checkAuth: () => {
        console.error('诊断工具初始化失败:', error.message)
      },
      testCheckout: () => {
        console.error('诊断工具初始化失败:', error.message)
      },
      clear: () => {
        console.log('诊断工具未正确初始化，无法清除监控')
      }
    }
  }
  
  console.groupEnd()
  
  console.log('\n✅ 支付按钮调试脚本已加载完成！')
  console.log('💡 现在点击支付按钮，查看调试信息')
  console.log('💡 如果 window.paymentCheckoutDebug 未定义，请刷新页面后重新执行脚本')
  
})();

