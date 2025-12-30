// Gemini API 调用监控和调试工具
// 直接复制粘贴到浏览器控制台运行

(function() {
  'use strict'
  
  console.clear()
  console.log('%c🔍 Gemini API 调用监控工具', 'font-size: 16px; font-weight: bold; color: #3b82f6;')
  console.log('='.repeat(60))
  
  // 存储所有API调用记录
  window._geminiApiCalls = window._geminiApiCalls || []
  const apiCalls = window._geminiApiCalls
  
  // 存储错误记录
  window._geminiApiErrors = window._geminiApiErrors || []
  const errors = window._geminiApiErrors
  
  // 存储流式响应数据
  window._streamResponses = window._streamResponses || []
  const streamResponses = window._streamResponses
  
  // 拦截 fetch 请求
  const originalFetch = window.fetch
  window.fetch = function(...args) {
    const url = args[0]
    const options = args[1] || {}
    
    // 监控聊天 API 调用
    const isChatApi = typeof url === 'string' && (
      url.includes('/api/admin/chat') || 
      url.includes('/api/admin/seo-chat') ||
      url.includes('/api/admin/grsai-chat')
    )
    
    // 监控 GRSAI Chat API 调用（内部调用）
    const isGeminiApi = typeof url === 'string' && url.includes('/v1/chat/completions')
    
    if (isChatApi || isGeminiApi) {
      const requestInfo = {
        timestamp: Date.now(),
        url,
        method: options.method || 'GET',
        model: null,
        requestBody: null,
        startTime: Date.now(),
        apiType: isChatApi ? 'ChatAPI' : 'GeminiAPI',
      }
      
      // 解析请求体
      if (options.body) {
        try {
          const body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body
          
          if (isChatApi) {
            // 聊天API请求
            requestInfo.model = body.model || 'auto-select'
            requestInfo.requestBody = {
              message: body.message ? body.message.substring(0, 50) + '...' : null,
              messageLength: body.message?.length || 0,
              imagesCount: body.images?.length || 0,
              stream: body.stream !== false, // 默认true
              sessionId: body.sessionId || null,
            }
            
            console.log(`\n📤 [${new Date().toLocaleTimeString()}] 聊天API请求:`, {
              url: url.split('/').pop(),
              message: requestInfo.requestBody.message,
              images: requestInfo.requestBody.imagesCount,
              stream: requestInfo.requestBody.stream,
            })
          } else {
            // Gemini API请求
            requestInfo.model = body.model || 'unknown'
            requestInfo.requestBody = {
              model: body.model,
              messagesCount: body.messages?.length || 0,
              hasTools: !!body.tools,
              stream: body.stream || false,
            }
            
            console.log(`\n📤 [${new Date().toLocaleTimeString()}] Gemini API 请求:`, {
              model: requestInfo.model,
              messages: requestInfo.requestBody.messagesCount,
              stream: requestInfo.requestBody.stream,
              hasTools: requestInfo.requestBody.hasTools,
            })
          }
        } catch (e) {
          // 忽略解析错误
        }
      }
      
      apiCalls.push(requestInfo)
      
      // 拦截响应
      return originalFetch.apply(this, args).then(async (response) => {
        const duration = Date.now() - requestInfo.startTime
        const responseInfo = {
          ...requestInfo,
          duration: `${duration}ms`,
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          data: null,
        }
        
        // 处理流式响应（聊天API默认使用流式）
        if (isChatApi && response.headers.get('content-type')?.includes('text/event-stream')) {
          console.log(`%c📡 [${new Date().toLocaleTimeString()}] 收到流式响应:`, 'color: blue; font-weight: bold;', {
            status: response.status,
            ok: response.ok,
          })
          
          // 拦截流式响应读取
          const originalBody = response.body
          if (originalBody) {
            const reader = originalBody.getReader()
            const decoder = new TextDecoder()
            let buffer = ''
            let fullContent = ''
            let chunkCount = 0
            let hasError = false
            let errorMessage = null
            const streamId = Date.now()
            
            const streamInfo = {
              id: streamId,
              timestamp: Date.now(),
              url,
              model: requestInfo.model,
              chunks: [],
              fullContent: '',
              error: null,
            }
            streamResponses.push(streamInfo)
            
            // 创建新的可读流
            const newStream = new ReadableStream({
              async start(controller) {
                try {
                  while (true) {
                    const { done, value } = await reader.read()
                    if (done) break
                    
                    buffer += decoder.decode(value, { stream: true })
                    const lines = buffer.split('\n')
                    buffer = lines.pop() || ''
                    
                    for (const line of lines) {
                      const trimmed = line.trim()
                      if (trimmed.startsWith('data: ')) {
                        const dataStr = trimmed.slice(6)
                        if (dataStr === '[DONE]') {
                          console.log(`%c✅ [${new Date().toLocaleTimeString()}] 流式响应完成:`, 'color: green; font-weight: bold;', {
                            chunks: chunkCount,
                            contentLength: `${fullContent.length} 字符`,
                          })
                          if (fullContent.length > 0) {
                            console.log('📄 内容预览:', fullContent.substring(0, 200) + (fullContent.length > 200 ? '...' : ''))
                          }
                          streamInfo.fullContent = fullContent
                          controller.enqueue(value)
                          controller.close()
                          return
                        }
                        
                        try {
                          const data = JSON.parse(dataStr)
                          chunkCount++
                          
                          if (data.error) {
                            hasError = true
                            errorMessage = data.error
                            console.error(`%c❌ [${new Date().toLocaleTimeString()}] 流式响应错误:`, 'color: red; font-weight: bold;', data.error)
                            streamInfo.error = data.error
                          }
                          
                          if (data.choices?.[0]?.delta?.content) {
                            fullContent += data.choices[0].delta.content
                            streamInfo.chunks.push({
                              timestamp: Date.now(),
                              content: data.choices[0].delta.content,
                            })
                          }
                          
                          controller.enqueue(value)
                        } catch (e) {
                          // 忽略解析错误
                          controller.enqueue(value)
                        }
                      } else if (trimmed) {
                        controller.enqueue(value)
                      }
                    }
                  }
                  
                  if (hasError && !fullContent) {
                    errors.push({
                      type: 'StreamError',
                      ...responseInfo,
                      error: errorMessage,
                    })
                  } else if (!hasError && fullContent.length === 0) {
                    errors.push({
                      type: 'EmptyStreamContent',
                      ...responseInfo,
                    })
                    console.error(`%c⚠️⚠️⚠️ [${new Date().toLocaleTimeString()}] 流式响应为空！`, 'color: red; font-weight: bold;')
                  } else if (!hasError) {
                    streamInfo.fullContent = fullContent
                  }
                  
                  controller.close()
                } catch (err) {
                  controller.error(err)
                }
              },
            })
            
            return new Response(newStream, {
              status: response.status,
              statusText: response.statusText,
              headers: response.headers,
            })
          }
        }
        
        // 处理非流式响应
        const cloned = response.clone()
        
        try {
          const data = await cloned.json()
          responseInfo.data = data
          
          if (isChatApi) {
            // 聊天API响应
            if (!response.ok || !data.success) {
              errors.push({
                type: 'ChatAPIError',
                ...responseInfo,
              })
              console.error(`%c❌ [${new Date().toLocaleTimeString()}] 聊天API错误:`, 'color: red; font-weight: bold;', {
                status: response.status,
                error: data.error,
                debug: data.debug,
                duration: responseInfo.duration,
              })
            } else {
              console.log(`%c✅ [${new Date().toLocaleTimeString()}] 聊天API成功:`, 'color: green; font-weight: bold;', {
                model: data.model,
                duration: responseInfo.duration,
              })
            }
          } else {
            // Gemini API响应
            const hasChoices = !!data.choices && data.choices.length > 0
            const hasContent = hasChoices && !!data.choices[0]?.message?.content
            const contentLength = hasContent ? data.choices[0].message.content.length : 0
            const finishReason = data.choices?.[0]?.finish_reason
            
            if (!response.ok || data.error) {
              errors.push({
                type: 'APIError',
                ...responseInfo,
              })
              console.error(`%c❌ [${new Date().toLocaleTimeString()}] Gemini API错误:`, 'color: red; font-weight: bold;', {
                status: response.status,
                statusText: response.statusText,
                model: requestInfo.model,
                error: data.error,
                duration: responseInfo.duration,
              })
            } else if (!hasChoices) {
              errors.push({
                type: 'EmptyChoices',
                ...responseInfo,
              })
              console.error(`%c⚠️⚠️⚠️ [${new Date().toLocaleTimeString()}] 严重问题：API 返回空 choices 数组！`, 'color: red; font-weight: bold;', {
                model: requestInfo.model,
                fullResponse: data,
                duration: responseInfo.duration,
              })
            } else if (!hasContent) {
              errors.push({
                type: 'EmptyContent',
                ...responseInfo,
              })
              console.error(`%c⚠️⚠️⚠️ [${new Date().toLocaleTimeString()}] 严重问题：API 返回空 content！`, 'color: red; font-weight: bold;', {
                model: requestInfo.model,
                finishReason,
                fullResponse: data,
                duration: responseInfo.duration,
              })
            } else {
              console.log(`%c✅ [${new Date().toLocaleTimeString()}] Gemini API成功:`, 'color: green; font-weight: bold;', {
                model: data.model || requestInfo.model,
                contentLength: `${contentLength} 字符`,
                finishReason,
                duration: responseInfo.duration,
              })
              
              // 显示内容预览
              if (contentLength > 0) {
                const preview = data.choices[0].message.content.substring(0, 200)
                console.log('📄 内容预览:', preview + (contentLength > 200 ? '...' : ''))
              }
            }
          }
        } catch (e) {
          // 不是JSON响应或读取失败
          if (!response.ok) {
            const errorText = await cloned.text()
            errors.push({
              type: 'ResponseError',
              ...responseInfo,
              errorText,
            })
            console.error(`%c❌ [${new Date().toLocaleTimeString()}] 响应错误:`, 'color: red; font-weight: bold;', {
              status: response.status,
              statusText: response.statusText,
              model: requestInfo.model,
              errorText: errorText.substring(0, 200),
              duration: responseInfo.duration,
            })
          }
        }
        
        return response
      }).catch(err => {
        const errorInfo = {
          ...requestInfo,
          error: err.message,
          stack: err.stack,
          duration: `${Date.now() - requestInfo.startTime}ms`,
        }
        errors.push({
          type: 'NetworkError',
          ...errorInfo,
        })
        console.error(`%c❌ [${new Date().toLocaleTimeString()}] 网络错误:`, 'color: red; font-weight: bold;', {
          model: requestInfo.model,
          error: err.message,
          duration: errorInfo.duration,
        })
        return Promise.reject(err)
      })
    }
    
    return originalFetch.apply(this, args)
  }
  
  // 查看所有API调用
  window.showApiCalls = function(limit = 20) {
    const calls = apiCalls.slice(-limit)
    if (calls.length === 0) {
      console.log('ℹ️ 暂无API调用记录')
      return
    }
    
    console.log(`\n📊 最近 ${calls.length} 次API调用:`)
    calls.forEach((call, index) => {
      const time = new Date(call.timestamp).toLocaleTimeString()
      console.log(`${index + 1}. [${time}] ${call.model || 'unknown'} - ${call.duration || 'pending'}`)
      if (call.data) {
        const hasChoices = !!call.data.choices && call.data.choices.length > 0
        const hasContent = hasChoices && !!call.data.choices[0]?.message?.content
        console.log(`   状态: ${call.ok ? '✅' : '❌'} ${call.status} | Choices: ${hasChoices ? '✅' : '❌'} | Content: ${hasContent ? '✅' : '❌'}`)
      }
    })
  }
  
  // 查看所有错误
  window.showErrors = function() {
    if (errors.length === 0) {
      console.log('✅ 没有错误记录')
      return
    }
    
    console.log(`\n❌ 共 ${errors.length} 个错误:`)
    errors.forEach((error, index) => {
      const time = new Date(error.timestamp).toLocaleTimeString()
      console.log(`\n${index + 1}. [${time}] ${error.type}`)
      console.log(`   模型: ${error.model || 'unknown'}`)
      console.log(`   状态: ${error.status || 'N/A'}`)
      console.log(`   错误: ${error.error || error.errorText || 'N/A'}`)
      if (error.data) {
        console.log(`   响应:`, error.data)
      }
    })
  }
  
  // 统计信息
  window.showStats = function() {
    const totalCalls = apiCalls.length
    const successfulCalls = apiCalls.filter(call => call.ok && call.data?.choices?.length > 0).length
    const failedCalls = errors.length
    const emptyChoices = errors.filter(e => e.type === 'EmptyChoices').length
    const emptyContent = errors.filter(e => e.type === 'EmptyContent').length
    const networkErrors = errors.filter(e => e.type === 'NetworkError').length
    
    console.log('\n📊 API调用统计:')
    console.log(`   总调用数: ${totalCalls}`)
    console.log(`   成功: ${successfulCalls} (${totalCalls > 0 ? ((successfulCalls / totalCalls) * 100).toFixed(1) : 0}%)`)
    console.log(`   失败: ${failedCalls} (${totalCalls > 0 ? ((failedCalls / totalCalls) * 100).toFixed(1) : 0}%)`)
    console.log(`   - 空choices: ${emptyChoices}`)
    console.log(`   - 空content: ${emptyContent}`)
    console.log(`   - 网络错误: ${networkErrors}`)
    
    // 按模型统计
    const modelStats = {}
    apiCalls.forEach(call => {
      const model = call.model || 'unknown'
      if (!modelStats[model]) {
        modelStats[model] = { total: 0, success: 0, failed: 0 }
      }
      modelStats[model].total++
      if (call.ok && call.data?.choices?.length > 0) {
        modelStats[model].success++
      } else {
        modelStats[model].failed++
      }
    })
    
    if (Object.keys(modelStats).length > 0) {
      console.log('\n📊 按模型统计:')
      Object.entries(modelStats).forEach(([model, stats]) => {
        console.log(`   ${model}:`)
        console.log(`     总调用: ${stats.total}`)
        console.log(`     成功: ${stats.success} (${stats.total > 0 ? ((stats.success / stats.total) * 100).toFixed(1) : 0}%)`)
        console.log(`     失败: ${stats.failed} (${stats.total > 0 ? ((stats.failed / stats.total) * 100).toFixed(1) : 0}%)`)
      })
    }
  }
  
  // 清除记录
  window.clearApiCalls = function() {
    apiCalls.length = 0
    errors.length = 0
    console.log('✅ 已清除所有API调用记录')
  }
  
  // 测试API连接
  window.testGeminiApi = async function(message = '你好') {
    console.log(`\n🧪 测试 Gemini API 连接（消息: "${message}"）...`)
    
    try {
      const response = await fetch('/api/admin/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message,
          stream: false, // 使用非流式以便测试
          saveHistory: false,
        }),
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        console.log('✅ API连接正常')
        console.log('响应:', {
          model: data.model,
          hasData: !!data.data,
          hasChoices: !!data.data?.choices,
          contentLength: data.data?.choices?.[0]?.message?.content?.length || 0,
        })
        if (data.data?.choices?.[0]?.message?.content) {
          console.log('📄 响应内容预览:', data.data.choices[0].message.content.substring(0, 200) + '...')
        }
      } else {
        console.error('❌ API连接失败:', data)
        if (data.debug) {
          console.error('调试信息:', data.debug)
        }
      }
    } catch (error) {
      console.error('❌ 测试失败:', error.message)
    }
  }
  
  // 查看流式响应记录
  window.showStreamResponses = function(limit = 10) {
    const streams = streamResponses.slice(-limit)
    if (streams.length === 0) {
      console.log('ℹ️ 暂无流式响应记录')
      return
    }
    
    console.log(`\n📡 最近 ${streams.length} 个流式响应:`)
    streams.forEach((stream, index) => {
      const time = new Date(stream.timestamp).toLocaleTimeString()
      console.log(`\n${index + 1}. [${time}] ${stream.model || 'unknown'}`)
      console.log(`   块数: ${stream.chunks.length}`)
      console.log(`   内容长度: ${stream.fullContent.length} 字符`)
      if (stream.error) {
        console.log(`   错误: ${stream.error}`)
      }
      if (stream.fullContent) {
        console.log(`   预览: ${stream.fullContent.substring(0, 100)}...`)
      }
    })
  }
  
  // 实时监控模式
  window.startMonitoring = function() {
    console.log('\n🔄 开始实时监控 Gemini API 调用...')
    console.log('💡 所有API调用和响应都会自动记录')
    console.log('💡 使用 showApiCalls() 查看调用记录')
    console.log('💡 使用 showErrors() 查看错误记录')
    console.log('💡 使用 showStats() 查看统计信息')
    console.log('💡 使用 stopMonitoring() 停止监控')
  }
  
  window.stopMonitoring = function() {
    window.fetch = originalFetch
    console.log('✅ 已停止监控（fetch已恢复）')
  }
  
  console.log('\n✅ 监控工具已加载')
  console.log('\n可用命令:')
  console.log('  showApiCalls(limit)      - 查看API调用记录（默认20条）')
  console.log('  showStreamResponses(limit) - 查看流式响应记录（默认10条）')
  console.log('  showErrors()            - 查看所有错误')
  console.log('  showStats()             - 查看统计信息')
  console.log('  clearApiCalls()          - 清除所有记录')
  console.log('  testGeminiApi(message)   - 测试API连接（默认消息："你好"）')
  console.log('  startMonitoring()        - 开始监控（已自动启动）')
  console.log('  stopMonitoring()         - 停止监控')
  
  // 自动开始监控
  window.startMonitoring()
  
  console.log('\n💡 现在发送一条消息，观察上面的日志')
  console.log('💡 如果看到 "⚠️⚠️⚠️ 严重问题：API 返回空 choices 数组"，说明Gemini API没有响应')
  console.log('💡 如果看到 "⚠️⚠️⚠️ 流式响应为空！"，说明流式响应没有内容')
  console.log('💡 运行 testGeminiApi("测试") 可以快速测试API连接')
  
})()
