// 完整聊天诊断代码 - 实际发送消息并监控整个流程
// 粘贴到浏览器控制台运行

(async function() {
  console.clear()
  console.log('%c🔍 完整聊天诊断 - 实际测试', 'font-size: 18px; font-weight: bold; color: #3b82f6;')
  console.log('='.repeat(60))
  
  const diagnostics = {
    networkRequest: null,
    networkResponse: null,
    streamData: [],
    errors: [],
    reactUpdates: [],
    finalState: null
  }
  
  // 1. 拦截并监控所有网络请求
  console.log('\n📡 步骤1: 设置网络监控...')
  const originalFetch = window.fetch
  let requestId = 0
  
  window.fetch = function(...args) {
    const url = args[0]
    if (typeof url === 'string' && url.includes('/api/admin/chat')) {
      requestId++
      const reqId = requestId
      const options = args[1] || {}
      const requestBody = options.body ? JSON.parse(options.body) : null
      
      console.log(`\n${'='.repeat(60)}`)
      console.log(`📤 网络请求 #${reqId}`)
      console.log('时间:', new Date().toLocaleTimeString())
      console.log('URL:', url)
      console.log('方法:', options.method || 'POST')
      console.log('请求体:', requestBody)
      
      diagnostics.networkRequest = {
        id: reqId,
        url,
        method: options.method || 'POST',
        body: requestBody,
        timestamp: new Date().toISOString()
      }
      
      return originalFetch.apply(this, args).then(async (response) => {
        console.log(`\n📥 网络响应 #${reqId}`)
        console.log('状态:', response.status, response.statusText)
        console.log('Content-Type:', response.headers.get('content-type'))
        console.log('Headers:', Object.fromEntries(response.headers.entries()))
        
        diagnostics.networkResponse = {
          id: reqId,
          status: response.status,
          statusText: response.statusText,
          contentType: response.headers.get('content-type'),
          headers: Object.fromEntries(response.headers.entries()),
          timestamp: new Date().toISOString()
        }
        
        // 如果是流式响应，详细监控
        if (response.headers.get('content-type')?.includes('text/event-stream')) {
          console.log('\n📊 开始监控流式数据...')
          
          const cloned = response.clone()
          const reader = cloned.body?.getReader()
          const decoder = new TextDecoder()
          let buffer = ''
          let chunkCount = 0
          let totalContent = ''
          let hasError = false
          let doneReceived = false
          
          if (!reader) {
            console.error('❌ 无法创建reader！')
            diagnostics.errors.push('无法创建流式响应reader')
            return response
          }
          
          try {
            while (true) {
              const { done, value } = await reader.read()
              
              if (done) {
                console.log(`\n✅ 流式响应完成`)
                console.log(`   总数据块: ${chunkCount}`)
                console.log(`   总内容长度: ${totalContent.length} 字符`)
                console.log(`   收到结束标记: ${doneReceived ? '是' : '否'}`)
                
                diagnostics.streamData.push({
                  type: 'complete',
                  chunkCount,
                  totalLength: totalContent.length,
                  hasEndMarker: doneReceived,
                  timestamp: new Date().toISOString()
                })
                
                if (totalContent.length === 0 && !hasError) {
                  console.error('⚠️ 警告: 没有接收到任何内容！')
                  diagnostics.errors.push('流式响应没有内容')
                }
                
                break
              }
              
              chunkCount++
              buffer += decoder.decode(value, { stream: true })
              const lines = buffer.split('\n')
              buffer = lines.pop() || ''
              
              for (const line of lines) {
                const trimmed = line.trim()
                
                if (!trimmed) continue
                
                if (trimmed === 'data: [DONE]') {
                  doneReceived = true
                  console.log('   🏁 收到结束标记 [DONE]')
                  diagnostics.streamData.push({ type: 'done', timestamp: new Date().toISOString() })
                  continue
                }
                
                if (trimmed.startsWith('data: ')) {
                  try {
                    const jsonStr = trimmed.slice(6)
                    const data = JSON.parse(jsonStr)
                    
                    // 检查错误
                    if (data.error) {
                      hasError = true
                      console.error('   ❌ API返回错误:', data.error)
                      diagnostics.errors.push({
                        type: 'api_error',
                        error: data.error,
                        timestamp: new Date().toISOString()
                      })
                    }
                    
                    // 检查choices
                    if (data.choices && data.choices.length > 0) {
                      const delta = data.choices[0].delta
                      const finishReason = data.choices[0].finish_reason
                      
                      if (finishReason) {
                        console.log(`   🏁 完成原因: ${finishReason}`)
                        diagnostics.streamData.push({
                          type: 'finish',
                          reason: finishReason,
                          timestamp: new Date().toISOString()
                        })
                      }
                      
                      if (delta?.content) {
                        totalContent += delta.content
                        const preview = delta.content.substring(0, 50)
                        console.log(`   📝 数据块 #${chunkCount}: "${preview}${delta.content.length > 50 ? '...' : ''}" (累计: ${totalContent.length} 字符)`)
                        
                        diagnostics.streamData.push({
                          type: 'content',
                          chunk: chunkCount,
                          content: delta.content,
                          totalLength: totalContent.length,
                          timestamp: new Date().toISOString()
                        })
                      } else if (delta && Object.keys(delta).length > 0) {
                        console.log(`   ℹ️ 数据块 #${chunkCount} (无content):`, delta)
                      }
                    } else if (data.model) {
                      console.log(`   ℹ️ 模型信息: ${data.model}`)
                      diagnostics.streamData.push({
                        type: 'model',
                        model: data.model,
                        timestamp: new Date().toISOString()
                      })
                    } else {
                      console.log(`   ℹ️ 其他数据:`, data)
                    }
                  } catch (parseError) {
                    console.warn(`   ⚠️ 解析失败 (块 #${chunkCount}):`, trimmed.substring(0, 100))
                    diagnostics.errors.push({
                      type: 'parse_error',
                      chunk: chunkCount,
                      line: trimmed.substring(0, 200),
                      error: parseError.message,
                      timestamp: new Date().toISOString()
                    })
                  }
                } else {
                  console.log(`   ℹ️ 非标准行:`, trimmed.substring(0, 100))
                }
              }
            }
            
            // 最终内容摘要
            if (totalContent) {
              console.log(`\n📄 完整响应内容预览:`)
              console.log(totalContent.substring(0, 500) + (totalContent.length > 500 ? '...' : ''))
              console.log(`\n总长度: ${totalContent.length} 字符`)
            }
            
            diagnostics.finalState = {
              totalContent,
              totalLength: totalContent.length,
              chunkCount,
              hasError,
              doneReceived
            }
            
          } catch (streamError) {
            console.error('❌ 读取流式数据时出错:', streamError)
            diagnostics.errors.push({
              type: 'stream_error',
              error: streamError.message,
              timestamp: new Date().toISOString()
            })
          }
        } else {
          // 非流式响应
          const text = await response.clone().text()
          console.log('响应内容:', text.substring(0, 500))
          diagnostics.finalState = { responseText: text }
        }
        
        return response
      }).catch(err => {
        console.error(`❌ 请求失败 #${reqId}:`, err)
        diagnostics.errors.push({
          type: 'fetch_error',
          error: err.message,
          timestamp: new Date().toISOString()
        })
        throw err
      })
    }
    return originalFetch.apply(this, args)
  }
  
  // 2. 监控React状态更新（通过DOM变化）
  console.log('✅ 网络监控已设置')
  
  console.log('\n⚛️ 步骤2: 设置React状态监控...')
  let messageCount = 0
  let lastMessages = []
  
  const checkMessages = () => {
    // 尝试多种选择器找到消息
    const selectors = [
      '[class*="message"]',
      '[role="article"]',
      '[class*="chat"] > div',
      'div[class*="rounded-2xl"]'
    ]
    
    let foundMessages = []
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector)
      if (elements.length > 0) {
        foundMessages = Array.from(elements).map(el => ({
          text: el.textContent?.substring(0, 100) || '',
          className: el.className,
          role: el.getAttribute('role')
        }))
        break
      }
    }
    
    if (foundMessages.length !== messageCount) {
      const newCount = foundMessages.length
      console.log(`\n📊 消息数量变化: ${messageCount} → ${newCount}`)
      
      if (newCount > messageCount) {
        const newMessages = foundMessages.slice(messageCount)
        console.log('   新增消息:')
        newMessages.forEach((msg, idx) => {
          console.log(`   - 消息 #${messageCount + idx + 1}: ${msg.text.substring(0, 80)}...`)
        })
        
        diagnostics.reactUpdates.push({
          type: 'message_added',
          count: newCount,
          messages: newMessages,
          timestamp: new Date().toISOString()
        })
      }
      
      messageCount = newCount
      lastMessages = foundMessages
    }
  }
  
  const messageMonitor = setInterval(checkMessages, 1000)
  console.log('✅ 消息监控已启动（每秒检查）')
  
  // 3. 监控控制台错误
  console.log('\n🔴 步骤3: 设置错误监控...')
  const originalError = console.error
  const originalWarn = console.warn
  
  console.error = function(...args) {
    const errorMsg = args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ')
    if (errorMsg.includes('chat') || errorMsg.includes('Chat') || errorMsg.includes('fetch')) {
      console.log('   ❌ 捕获到相关错误:', ...args)
      diagnostics.errors.push({
        type: 'console_error',
        message: errorMsg,
        timestamp: new Date().toISOString()
      })
    }
    originalError.apply(console, args)
  }
  
  console.warn = function(...args) {
    const warnMsg = args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ')
    if (warnMsg.includes('chat') || warnMsg.includes('Chat') || warnMsg.includes('解析')) {
      console.log('   ⚠️ 捕获到相关警告:', ...args)
    }
    originalWarn.apply(console, args)
  }
  console.log('✅ 错误监控已设置')
  
  // 4. 提供测试函数
  console.log('\n🧪 步骤4: 准备测试函数...')
  
  window.testChatDiagnostic = async function(testMessage = '你好，请回复我') {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`🚀 开始测试发送消息: "${testMessage}"`)
    console.log('='.repeat(60))
    
    // 重置诊断数据
    diagnostics.networkRequest = null
    diagnostics.networkResponse = null
    diagnostics.streamData = []
    diagnostics.errors = []
    diagnostics.reactUpdates = []
    diagnostics.finalState = null
    
    // 找到输入框和按钮
    const textarea = document.querySelector('textarea[placeholder*="输入你的问题"]')
    const buttons = Array.from(document.querySelectorAll('button'))
    const sendBtn = buttons.find(b => b.textContent?.includes('发送') && !b.disabled)
    
    if (!textarea) {
      console.error('❌ 未找到输入框！')
      return diagnostics
    }
    
    if (!sendBtn) {
      console.error('❌ 未找到发送按钮！')
      return diagnostics
    }
    
    console.log('✅ 找到输入框和发送按钮')
    
    // 设置输入值
    textarea.value = testMessage
    textarea.dispatchEvent(new Event('input', { bubbles: true }))
    textarea.dispatchEvent(new Event('change', { bubbles: true }))
    
    // 触发React更新
    const nativeSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      'value'
    )?.set
    if (nativeSetter) {
      nativeSetter.call(textarea, testMessage)
      textarea.dispatchEvent(new Event('input', { bubbles: true }))
    }
    
    console.log('✅ 已设置输入值，等待500ms...')
    await new Promise(r => setTimeout(r, 500))
    
    // 记录初始消息数
    checkMessages()
    const initialCount = messageCount
    
    // 点击发送
    console.log('📤 点击发送按钮...')
    sendBtn.click()
    
    console.log('⏳ 等待响应...（最多60秒）')
    
    // 等待响应
    let waitTime = 0
    const maxWait = 60000
    const checkInterval = 1000
    
    while (waitTime < maxWait) {
      await new Promise(r => setTimeout(r, checkInterval))
      waitTime += checkInterval
      
      // 检查是否收到响应
      if (diagnostics.finalState || diagnostics.errors.length > 0) {
        break
      }
      
      // 每5秒输出一次状态
      if (waitTime % 5000 === 0) {
        console.log(`   ⏳ 等待中... (${waitTime / 1000}秒)`)
      }
    }
    
    // 最终检查
    checkMessages()
    const finalCount = messageCount
    
    // 生成诊断报告
    console.log(`\n${'='.repeat(60)}`)
    console.log('📋 诊断报告')
    console.log('='.repeat(60))
    
    console.log('\n1️⃣ 网络请求:')
    if (diagnostics.networkRequest) {
      console.log('   ✅ 请求已发送')
      console.log('   - URL:', diagnostics.networkRequest.url)
      console.log('   - 方法:', diagnostics.networkRequest.method)
    } else {
      console.log('   ❌ 未检测到网络请求')
    }
    
    console.log('\n2️⃣ 网络响应:')
    if (diagnostics.networkResponse) {
      console.log('   ✅ 收到响应')
      console.log('   - 状态:', diagnostics.networkResponse.status)
      console.log('   - Content-Type:', diagnostics.networkResponse.contentType)
    } else {
      console.log('   ❌ 未收到响应')
    }
    
    console.log('\n3️⃣ 流式数据:')
    if (diagnostics.streamData.length > 0) {
      const contentChunks = diagnostics.streamData.filter(d => d.type === 'content')
      console.log(`   ✅ 收到 ${contentChunks.length} 个内容数据块`)
      if (diagnostics.finalState?.totalLength) {
        console.log(`   - 总内容长度: ${diagnostics.finalState.totalLength} 字符`)
      }
    } else {
      console.log('   ❌ 未收到流式数据')
    }
    
    console.log('\n4️⃣ React状态更新:')
    console.log(`   - 初始消息数: ${initialCount}`)
    console.log(`   - 最终消息数: ${finalCount}`)
    if (finalCount > initialCount) {
      console.log('   ✅ 消息已添加到UI')
    } else {
      console.log('   ❌ 消息未添加到UI（可能是React状态更新问题）')
    }
    
    console.log('\n5️⃣ 错误信息:')
    if (diagnostics.errors.length === 0) {
      console.log('   ✅ 未发现错误')
    } else {
      console.log(`   ❌ 发现 ${diagnostics.errors.length} 个错误:`)
      diagnostics.errors.forEach((err, idx) => {
        console.log(`   - 错误 #${idx + 1}:`, err)
      })
    }
    
    console.log('\n6️⃣ 问题诊断:')
    const issues = []
    
    if (!diagnostics.networkRequest) {
      issues.push('❌ 网络请求未发送（可能是按钮点击未触发）')
    }
    
    if (!diagnostics.networkResponse) {
      issues.push('❌ 未收到网络响应（可能是网络问题或API错误）')
    } else if (diagnostics.networkResponse.status !== 200) {
      issues.push(`❌ API返回错误状态: ${diagnostics.networkResponse.status}`)
    }
    
    if (diagnostics.streamData.length === 0 && diagnostics.networkResponse) {
      issues.push('❌ 收到响应但无流式数据（可能是API格式问题）')
    }
    
    if (diagnostics.finalState?.totalLength === 0) {
      issues.push('❌ 流式数据为空（API可能返回了空响应）')
    }
    
    if (finalCount === initialCount && diagnostics.finalState?.totalLength > 0) {
      issues.push('❌ 收到数据但UI未更新（React状态更新问题）')
    }
    
    if (issues.length === 0) {
      console.log('   ✅ 未发现明显问题')
    } else {
      issues.forEach(issue => console.log('   ', issue))
    }
    
    console.log(`\n${'='.repeat(60)}`)
    console.log('💡 完整诊断数据已保存在 window.chatDiagnostics')
    window.chatDiagnostics = diagnostics
    
    return diagnostics
  }
  
  console.log('✅ 测试函数已准备')
  console.log('\n📝 使用方法:')
  console.log('   运行: testChatDiagnostic("你的测试消息")')
  console.log('   或直接在页面上发送消息，诊断代码会自动监控')
  console.log('\n' + '='.repeat(60))
  
  // 清理函数
  window.stopChatDiagnostic = function() {
    clearInterval(messageMonitor)
    window.fetch = originalFetch
    console.error = originalError
    console.warn = originalWarn
    console.log('✅ 诊断监控已停止')
  }
  
  console.log('💡 运行 stopChatDiagnostic() 可以停止监控\n')
})()

