// 简单聊天测试 - 一键诊断无回复问题
// 粘贴到浏览器控制台运行

console.clear()
console.log('%c🔍 聊天无回复诊断', 'font-size: 16px; font-weight: bold; color: #ef4444;')

// 监控网络请求
const originalFetch = window.fetch
window.fetch = function(...args) {
  const url = args[0]
  if (typeof url === 'string' && url.includes('/api/admin/chat')) {
    console.log('\n📤 发送请求:', url)
    return originalFetch.apply(this, args).then(async (response) => {
      console.log('📥 收到响应:', response.status, response.statusText)
      
      if (response.headers.get('content-type')?.includes('text/event-stream')) {
        console.log('📊 监控流式数据...')
        const cloned = response.clone()
        const reader = cloned.body?.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        let content = ''
        let hasError = false
        
        if (reader) {
          while (true) {
            const { done, value } = await reader.read()
            if (done) {
              console.log(`\n✅ 流式响应完成`)
              console.log(`   内容长度: ${content.length} 字符`)
              if (content.length === 0 && !hasError) {
                console.error('❌ 问题: 没有接收到任何内容！')
                console.log('可能原因:')
                console.log('  1. API返回空响应')
                console.log('  2. 流式数据解析失败')
                console.log('  3. API Key配置错误')
              } else if (content.length > 0) {
                console.log(`   内容预览: ${content.substring(0, 200)}...`)
                console.log('✅ 数据已接收，检查UI是否更新...')
              }
              break
            }
            
            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''
            
            for (const line of lines) {
              const trimmed = line.trim()
              if (trimmed.startsWith('data: ')) {
                try {
                  const data = JSON.parse(trimmed.slice(6))
                  
                  if (data.error) {
                    hasError = true
                    console.error('❌ API错误:', data.error)
                  }
                  
                  if (data.choices?.[0]?.delta?.content) {
                    content += data.choices[0].delta.content
                    process.stdout?.write?.(data.choices[0].delta.content) || 
                      console.log('   +', data.choices[0].delta.content.substring(0, 50))
                  }
                } catch (e) {
                  // 忽略解析错误
                }
              }
            }
          }
        }
      }
      
      return response
    }).catch(err => {
      console.error('❌ 请求失败:', err)
      return Promise.reject(err)
    })
  }
  return originalFetch.apply(this, args)
}

console.log('✅ 监控已启动')
console.log('💡 现在发送一条消息，观察上面的日志\n')

// 提供快速测试
window.quickTest = async function(msg = '测试') {
  const textarea = document.querySelector('textarea[placeholder*="输入你的问题"]')
  const sendBtn = Array.from(document.querySelectorAll('button')).find(b => 
    b.textContent?.includes('发送') && !b.disabled
  )
  
  if (!textarea || !sendBtn) {
    console.error('❌ 未找到输入框或发送按钮')
    return
  }
  
  textarea.value = msg
  textarea.dispatchEvent(new Event('input', { bubbles: true }))
  await new Promise(r => setTimeout(r, 300))
  sendBtn.click()
  console.log('📤 已触发发送')
}

console.log('💡 运行 quickTest("你的消息") 可以快速测试')

