// 聊天功能调试代码 - 粘贴到浏览器控制台运行
// 用于诊断为什么AI助手没有像ChatGPT一样回复信息

console.log('🔍 开始聊天功能调试...\n')

// 1. 检查当前页面状态
console.log('📋 1. 页面状态检查:')
console.log('   - URL:', window.location.href)
console.log('   - 当前时间:', new Date().toLocaleString())

// 2. 模拟发送消息并监控整个流程
async function debugChatFlow() {
  console.log('\n📤 2. 模拟发送消息流程:')
  
  // 检查是否有输入框和发送按钮
  const textarea = document.querySelector('textarea[placeholder*="输入你的问题"]')
  // 查找发送按钮（通过文本内容）
  const allButtons = Array.from(document.querySelectorAll('button'))
  const sendButton = allButtons.find(btn => btn.textContent?.includes('发送') && !btn.disabled)
  
  console.log('   - 找到输入框:', !!textarea)
  console.log('   - 找到发送按钮:', !!sendButton)
  
  if (!textarea) {
    console.error('   ❌ 未找到输入框！请确保在AI助手页面')
    return
  }
  
  // 监听所有网络请求
  console.log('\n🌐 3. 监听网络请求:')
  const originalFetch = window.fetch
  let requestCount = 0
  
  window.fetch = function(...args) {
    const url = args[0]
    const options = args[1] || {}
    
    if (typeof url === 'string' && url.includes('/api/admin/chat')) {
      requestCount++
      console.log(`\n   📡 请求 #${requestCount}:`, {
        url,
        method: options.method || 'GET',
        body: options.body ? JSON.parse(options.body) : null,
        timestamp: new Date().toISOString()
      })
      
      // 包装响应以监控流式数据
      return originalFetch.apply(this, args).then(async (response) => {
        console.log(`   ✅ 响应 #${requestCount}:`, {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          contentType: response.headers.get('content-type')
        })
        
        if (response.headers.get('content-type')?.includes('text/event-stream')) {
          console.log('   📊 检测到流式响应，开始监控数据流...')
          
          // 克隆响应以便同时读取和返回
          const clonedResponse = response.clone()
          const reader = clonedResponse.body?.getReader()
          const decoder = new TextDecoder()
          let buffer = ''
          let chunkCount = 0
          let totalContent = ''
          
          if (reader) {
            try {
              while (true) {
                const { done, value } = await reader.read()
                if (done) {
                  console.log(`   ✅ 流式响应完成: 共接收 ${chunkCount} 个数据块，总长度 ${totalContent.length} 字符`)
                  break
                }
                
                chunkCount++
                buffer += decoder.decode(value, { stream: true })
                const lines = buffer.split('\n')
                buffer = lines.pop() || ''
                
                for (const line of lines) {
                  const trimmed = line.trim()
                  if (trimmed && trimmed.startsWith('data: ')) {
                    try {
                      const data = JSON.parse(trimmed.slice(6))
                      
                      if (data.choices && data.choices.length > 0) {
                        const delta = data.choices[0].delta
                        if (delta?.content) {
                          totalContent += delta.content
                          console.log(`   📝 数据块 #${chunkCount}:`, {
                            content: delta.content.substring(0, 50) + (delta.content.length > 50 ? '...' : ''),
                            totalLength: totalContent.length,
                            model: data.model || '未知'
                          })
                        }
                      }
                      
                      if (trimmed === 'data: [DONE]') {
                        console.log('   🏁 收到结束标记 [DONE]')
                      }
                    } catch (e) {
                      console.warn('   ⚠️ 解析数据块失败:', trimmed.substring(0, 100))
                    }
                  }
                }
              }
            } catch (error) {
              console.error('   ❌ 读取流式数据失败:', error)
            }
          }
        } else {
          // 非流式响应，直接读取
          const text = await response.clone().text()
          console.log('   📄 响应内容:', text.substring(0, 500))
        }
        
        return response
      }).catch((error) => {
        console.error(`   ❌ 请求失败 #${requestCount}:`, error)
        throw error
      })
    }
    
    return originalFetch.apply(this, args)
  }
  
  // 3. 检查React组件状态（如果可能）
  console.log('\n⚛️ 4. React组件状态检查:')
  try {
    // 尝试找到React DevTools
    const reactFiber = document.querySelector('textarea')?._reactInternalFiber ||
                      document.querySelector('textarea')?._reactInternalInstance
    
    if (reactFiber) {
      console.log('   ✅ 找到React组件')
    } else {
      console.log('   ℹ️ 无法直接访问React状态（需要React DevTools）')
    }
  } catch (e) {
    console.log('   ℹ️ 无法检查React状态')
  }
  
  // 4. 检查消息列表DOM
  console.log('\n💬 5. 消息列表检查:')
  const messageElements = document.querySelectorAll('[class*="message"], [class*="chat"]')
  console.log(`   - 找到 ${messageElements.length} 个可能的消息元素`)
  
  // 5. 检查是否有错误提示
  console.log('\n⚠️ 6. 错误信息检查:')
  const errorElements = document.querySelectorAll('[class*="error"], [class*="alert"], [role="alert"]')
  if (errorElements.length > 0) {
    console.log(`   ⚠️ 找到 ${errorElements.length} 个可能的错误元素:`)
    errorElements.forEach((el, idx) => {
      console.log(`   - 错误 #${idx + 1}:`, el.textContent?.substring(0, 100))
    })
  } else {
    console.log('   ✅ 未发现明显的错误提示')
  }
  
  // 6. 检查控制台错误
  console.log('\n🔴 7. 控制台错误检查:')
  const originalError = console.error
  console.error = function(...args) {
    console.log('   ❌ 捕获到错误:', ...args)
    originalError.apply(console, args)
  }
  
  // 7. 提供手动测试函数
  console.log('\n🧪 8. 测试函数已准备:')
  window.testChatSend = async function(testMessage = '测试消息') {
    console.log(`\n🚀 开始测试发送消息: "${testMessage}"`)
    
    if (!textarea) {
      console.error('❌ 未找到输入框')
      return
    }
    
    // 设置输入值
    textarea.value = testMessage
    textarea.dispatchEvent(new Event('input', { bubbles: true }))
    textarea.dispatchEvent(new Event('change', { bubbles: true }))
    
    // 触发React状态更新
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      'value'
    )?.set
    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(textarea, testMessage)
      textarea.dispatchEvent(new Event('input', { bubbles: true }))
    }
    
    console.log('   ✅ 已设置输入值')
    
    // 等待一下让React更新
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 点击发送按钮
    if (sendButton) {
      console.log('   📤 点击发送按钮...')
      sendButton.click()
    } else {
      // 尝试通过键盘事件发送
      console.log('   📤 尝试通过键盘发送 (Cmd+Enter)...')
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        metaKey: true, // Cmd on Mac
        ctrlKey: true, // Ctrl on Windows
        bubbles: true,
        cancelable: true
      })
      textarea.dispatchEvent(enterEvent)
    }
    
    console.log('   ⏳ 等待响应...（请观察上面的网络请求日志）')
  }
  
  console.log('\n✅ 调试代码已加载！')
  console.log('📝 使用方法:')
  console.log('   1. 在页面上正常发送一条消息')
  console.log('   2. 观察上面的网络请求和响应日志')
  console.log('   3. 或者运行: testChatSend("你的测试消息")')
  console.log('\n💡 提示: 如果看到流式响应但UI没有更新，可能是React状态更新问题')
}

// 执行调试
debugChatFlow()

// 9. 定期检查消息列表变化
console.log('\n👀 9. 启动消息列表监控:')
let lastMessageCount = 0
const messageMonitor = setInterval(() => {
  const messages = document.querySelectorAll('[class*="message"], [role="article"]')
  if (messages.length !== lastMessageCount) {
    console.log(`   📊 消息数量变化: ${lastMessageCount} → ${messages.length}`)
    lastMessageCount = messages.length
    
    // 检查最后一条消息
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      const content = lastMessage.textContent || ''
      console.log(`   💬 最后一条消息: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`)
    }
  }
}, 2000)

console.log('   ✅ 消息监控已启动（每2秒检查一次）')
console.log('   💡 运行 clearInterval(messageMonitor) 可以停止监控\n')

