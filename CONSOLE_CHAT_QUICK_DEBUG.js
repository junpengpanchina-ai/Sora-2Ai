// 快速聊天调试 - 一键诊断
// 粘贴到浏览器控制台运行

(async function() {
  console.clear()
  console.log('%c🔍 聊天功能快速诊断', 'font-size: 16px; font-weight: bold; color: #3b82f6;')
  console.log('='.repeat(50))
  
  // 1. 检查网络请求
  console.log('\n📡 监控网络请求...')
  const originalFetch = window.fetch
  let chatRequestCount = 0
  
  window.fetch = function(...args) {
    const url = args[0]
    if (typeof url === 'string' && url.includes('/api/admin/chat')) {
      chatRequestCount++
      const options = args[1] || {}
      
      console.log(`\n${'='.repeat(50)}`)
      console.log(`📤 请求 #${chatRequestCount}`)
      console.log('URL:', url)
      console.log('方法:', options.method || 'POST')
      console.log('请求体:', options.body ? JSON.parse(options.body) : null)
      
      return originalFetch.apply(this, args).then(async (response) => {
        console.log(`\n📥 响应 #${chatRequestCount}`)
        console.log('状态:', response.status, response.statusText)
        console.log('Content-Type:', response.headers.get('content-type'))
        
        if (response.headers.get('content-type')?.includes('text/event-stream')) {
          console.log('\n📊 流式数据监控:')
          const cloned = response.clone()
          const reader = cloned.body?.getReader()
          const decoder = new TextDecoder()
          let buffer = ''
          let chunkNum = 0
          let fullText = ''
          
          if (reader) {
            while (true) {
              const { done, value } = await reader.read()
              if (done) {
                console.log(`\n✅ 流式响应完成`)
                console.log(`   总数据块: ${chunkNum}`)
                console.log(`   总内容长度: ${fullText.length} 字符`)
                if (fullText) {
                  console.log(`   内容预览: ${fullText.substring(0, 200)}${fullText.length > 200 ? '...' : ''}`)
                } else {
                  console.log(`   ⚠️ 警告: 没有接收到任何内容！`)
                }
                break
              }
              
              chunkNum++
              buffer += decoder.decode(value, { stream: true })
              const lines = buffer.split('\n')
              buffer = lines.pop() || ''
              
              for (const line of lines) {
                const trimmed = line.trim()
                if (trimmed.startsWith('data: ')) {
                  try {
                    const data = JSON.parse(trimmed.slice(6))
                    if (data.choices?.[0]?.delta?.content) {
                      const content = data.choices[0].delta.content
                      fullText += content
                      process.stdout?.write?.(content) || console.log('   +', content.substring(0, 50))
                    }
                    if (trimmed.includes('[DONE]')) {
                      console.log('\n   🏁 收到结束标记')
                    }
                  } catch (e) {
                    // 忽略解析错误
                  }
                }
              }
            }
          }
        } else {
          const text = await response.clone().text()
          console.log('响应内容:', text.substring(0, 500))
        }
        
        return response
      }).catch(err => {
        console.error('❌ 请求失败:', err)
        throw err
      })
    }
    return originalFetch.apply(this, args)
  }
  
  // 2. 检查页面元素
  console.log('\n📋 页面元素检查:')
  const textarea = document.querySelector('textarea[placeholder*="输入你的问题"]')
  const buttons = Array.from(document.querySelectorAll('button'))
  const sendBtn = buttons.find(b => b.textContent?.includes('发送'))
  
  console.log('输入框:', textarea ? '✅ 找到' : '❌ 未找到')
  console.log('发送按钮:', sendBtn ? '✅ 找到' : '❌ 未找到')
  
  // 3. 检查消息DOM
  const messages = document.querySelectorAll('[class*="message"], [role="article"]')
  console.log(`当前消息数: ${messages.length}`)
  
  // 4. 提供测试函数
  window.quickTest = async function(msg = '测试') {
    console.log(`\n🚀 测试发送: "${msg}"`)
    if (textarea) {
      textarea.value = msg
      textarea.dispatchEvent(new Event('input', { bubbles: true }))
      await new Promise(r => setTimeout(r, 300))
      sendBtn?.click()
      console.log('✅ 已触发发送，请观察上面的网络请求日志')
    } else {
      console.error('❌ 未找到输入框')
    }
  }
  
  console.log('\n✅ 调试代码已加载！')
  console.log('💡 现在发送一条消息，或运行: quickTest("你的消息")')
  console.log('='.repeat(50))
})()

