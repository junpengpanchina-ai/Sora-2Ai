// 聊天API流式响应调试工具
// 直接复制粘贴到浏览器控制台运行

(function() {
  'use strict'
  
  console.clear()
  console.log('%c🔍 聊天API流式响应调试工具', 'font-size: 16px; font-weight: bold; color: #3b82f6;')
  console.log('='.repeat(60))
  
  // 存储所有流式响应记录
  window._chatStreamResponses = window._chatStreamResponses || []
  const streamResponses = window._chatStreamResponses
  
  // 拦截 fetch 请求
  const originalFetch = window.fetch
  window.fetch = function(...args) {
    const url = args[0]
    const options = args[1] || {}
    
    // 只监控聊天API
    const isChatApi = typeof url === 'string' && (
      url.includes('/api/admin/chat') || 
      url.includes('/api/admin/seo-chat')
    )
    
    if (isChatApi && options.method === 'POST') {
      const requestInfo = {
        timestamp: Date.now(),
        url,
        method: options.method,
        requestBody: null,
        startTime: Date.now(),
      }
      
      // 解析请求体
      if (options.body) {
        try {
          const body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body
          requestInfo.requestBody = {
            message: body.message ? body.message.substring(0, 50) + '...' : null,
            messageLength: body.message?.length || 0,
            imagesCount: body.images?.length || 0,
            stream: body.stream !== false,
            sessionId: body.sessionId || null,
            model: body.model || 'auto',
          }
          
          console.log(`\n📤 [${new Date().toLocaleTimeString()}] 聊天API请求:`, {
            url: url.split('/').pop(),
            message: requestInfo.requestBody.message,
            messageLength: requestInfo.requestBody.messageLength,
            images: requestInfo.requestBody.imagesCount,
            stream: requestInfo.requestBody.stream,
            model: requestInfo.requestBody.model,
          })
        } catch (e) {
          // 忽略解析错误
        }
      }
      
      // 拦截响应
      return originalFetch.apply(this, args).then(async (response) => {
        const duration = Date.now() - requestInfo.startTime
        
        // 检查是否是流式响应
        const isStream = response.headers.get('content-type')?.includes('text/event-stream')
        
        if (isStream) {
          console.log(`%c📡 [${new Date().toLocaleTimeString()}] 收到流式响应:`, 'color: blue; font-weight: bold;', {
            status: response.status,
            ok: response.ok,
            duration: `${duration}ms`,
          })
          
          // 创建流式响应记录
          const streamId = Date.now()
          const streamInfo = {
            id: streamId,
            timestamp: Date.now(),
            url,
            requestBody: requestInfo.requestBody,
            chunks: [],
            fullContent: '',
            finishReason: null,
            error: null,
            model: null,
            totalChunks: 0,
            contentChunks: 0,
          }
          streamResponses.push(streamInfo)
          
          // 拦截流式响应读取
          const originalBody = response.body
          if (originalBody) {
            const reader = originalBody.getReader()
            const decoder = new TextDecoder()
            let buffer = ''
            let chunkIndex = 0
            
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
                      if (!trimmed || trimmed === 'data: [DONE]') {
                        if (trimmed === 'data: [DONE]') {
                          console.log(`%c✅ [${new Date().toLocaleTimeString()}] 流式响应完成:`, 'color: green; font-weight: bold;', {
                            totalChunks: streamInfo.totalChunks,
                            contentChunks: streamInfo.contentChunks,
                            contentLength: `${streamInfo.fullContent.length} 字符`,
                            finishReason: streamInfo.finishReason,
                            model: streamInfo.model,
                            hasError: !!streamInfo.error,
                          })
                          
                          if (streamInfo.fullContent.length === 0) {
                            console.error(`%c⚠️⚠️⚠️ [${new Date().toLocaleTimeString()}] 流式响应为空！`, 'color: red; font-weight: bold;', {
                              finishReason: streamInfo.finishReason,
                              error: streamInfo.error,
                              totalChunks: streamInfo.totalChunks,
                              contentChunks: streamInfo.contentChunks,
                            })
                          } else {
                            console.log('📄 内容预览:', streamInfo.fullContent.substring(0, 200) + (streamInfo.fullContent.length > 200 ? '...' : ''))
                          }
                        }
                        controller.enqueue(value)
                        continue
                      }
                      
                      if (trimmed.startsWith('data: ')) {
                        const dataStr = trimmed.slice(6)
                        chunkIndex++
                        streamInfo.totalChunks++
                        
                        try {
                          const data = JSON.parse(dataStr)
                          
                          // 记录模型信息
                          if (data.model && !streamInfo.model) {
                            streamInfo.model = data.model
                            console.log(`%c🤖 [${new Date().toLocaleTimeString()}] 检测到模型: ${data.model}`, 'color: cyan;')
                          }
                          
                          // 检查错误
                          if (data.error) {
                            streamInfo.error = data.error
                            console.error(`%c❌ [${new Date().toLocaleTimeString()}] API错误 (Chunk #${chunkIndex}):`, 'color: red; font-weight: bold;', data.error)
                          }
                          
                          // 检查finish_reason
                          if (data.choices?.[0]?.finish_reason) {
                            streamInfo.finishReason = data.choices[0].finish_reason
                            console.log(`%c🏁 [${new Date().toLocaleTimeString()}] 完成原因 (Chunk #${chunkIndex}): ${streamInfo.finishReason}`, 
                              streamInfo.finishReason === 'content_filter' || streamInfo.finishReason === 'safety' 
                                ? 'color: red; font-weight: bold;' 
                                : 'color: yellow;')
                            
                            if (streamInfo.finishReason === 'content_filter' || streamInfo.finishReason === 'safety') {
                              console.error(`%c⚠️⚠️⚠️ 内容被过滤！`, 'color: red; font-weight: bold;', {
                                finishReason: streamInfo.finishReason,
                                message: requestInfo.requestBody?.message,
                              })
                            }
                          }
                          
                          // 检查content
                          if (data.choices?.[0]?.delta?.content) {
                            streamInfo.contentChunks++
                            const content = data.choices[0].delta.content
                            streamInfo.fullContent += content
                            
                            streamInfo.chunks.push({
                              index: chunkIndex,
                              timestamp: Date.now(),
                              content: content,
                              contentLength: content.length,
                              cumulativeLength: streamInfo.fullContent.length,
                            })
                            
                            // 只显示前几个content chunk的详细信息
                            if (streamInfo.contentChunks <= 3) {
                              console.log(`%c📝 [${new Date().toLocaleTimeString()}] Content Chunk #${streamInfo.contentChunks}:`, 'color: green;', {
                                content: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
                                length: `${content.length} 字符`,
                                cumulative: `${streamInfo.fullContent.length} 字符`,
                              })
                            }
                          } else if (data.choices?.[0]?.delta && Object.keys(data.choices[0].delta).length > 0) {
                            // 有delta但没有content
                            console.warn(`%c⚠️ [${new Date().toLocaleTimeString()}] Chunk #${chunkIndex} 有delta但无content:`, 'color: yellow;', {
                              delta: data.choices[0].delta,
                              finishReason: data.choices[0].finish_reason,
                            })
                          } else if (chunkIndex <= 5) {
                            // 前5个chunk都记录详细信息
                            console.log(`%cℹ️ [${new Date().toLocaleTimeString()}] Chunk #${chunkIndex}:`, 'color: gray;', {
                              hasChoices: !!data.choices,
                              choicesLength: data.choices?.length || 0,
                              hasDelta: !!data.choices?.[0]?.delta,
                              hasContent: !!data.choices?.[0]?.delta?.content,
                              finishReason: data.choices?.[0]?.finish_reason,
                              model: data.model,
                            })
                          }
                          
                          controller.enqueue(value)
                        } catch (e) {
                          // 解析错误，但继续传递数据
                          console.warn(`%c⚠️ [${new Date().toLocaleTimeString()}] Chunk #${chunkIndex} 解析失败:`, 'color: yellow;', {
                            error: e.message,
                            dataStr: dataStr.substring(0, 100),
                          })
                          controller.enqueue(value)
                        }
                      } else {
                        controller.enqueue(value)
                      }
                    }
                  }
                  
                  controller.close()
                } catch (err) {
                  console.error(`%c❌ [${new Date().toLocaleTimeString()}] 流式响应读取错误:`, 'color: red; font-weight: bold;', err)
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
        
        return response
      }).catch(err => {
        console.error(`%c❌ [${new Date().toLocaleTimeString()}] 请求失败:`, 'color: red; font-weight: bold;', {
          error: err.message,
          url,
        })
        return Promise.reject(err)
      })
    }
    
    return originalFetch.apply(this, args)
  }
  
  // 查看流式响应记录
  window.showStreamResponses = function(limit = 5) {
    const streams = streamResponses.slice(-limit)
    if (streams.length === 0) {
      console.log('ℹ️ 暂无流式响应记录')
      return
    }
    
    console.log(`\n📡 最近 ${streams.length} 个流式响应:`)
    streams.forEach((stream, index) => {
      const time = new Date(stream.timestamp).toLocaleTimeString()
      console.log(`\n${index + 1}. [${time}]`)
      console.log(`   模型: ${stream.model || 'unknown'}`)
      console.log(`   总chunks: ${stream.totalChunks}`)
      console.log(`   内容chunks: ${stream.contentChunks}`)
      console.log(`   内容长度: ${stream.fullContent.length} 字符`)
      console.log(`   完成原因: ${stream.finishReason || 'N/A'}`)
      if (stream.error) {
        console.log(`   错误:`, stream.error)
      }
      if (stream.fullContent) {
        console.log(`   预览: ${stream.fullContent.substring(0, 100)}...`)
      }
    })
  }
  
  // 查看详细的流式响应
  window.showStreamDetails = function(index = -1) {
    const streams = streamResponses
    if (streams.length === 0) {
      console.log('ℹ️ 暂无流式响应记录')
      return
    }
    
    const stream = index >= 0 ? streams[index] : streams[streams.length - 1]
    if (!stream) {
      console.error('❌ 无效的索引')
      return
    }
    
    console.log(`\n📊 流式响应详情:`)
    console.log(`   时间: ${new Date(stream.timestamp).toLocaleString()}`)
    console.log(`   模型: ${stream.model || 'unknown'}`)
    console.log(`   总chunks: ${stream.totalChunks}`)
    console.log(`   内容chunks: ${stream.contentChunks}`)
    console.log(`   内容长度: ${stream.fullContent.length} 字符`)
    console.log(`   完成原因: ${stream.finishReason || 'N/A'}`)
    if (stream.error) {
      console.log(`   错误:`, stream.error)
    }
    
    if (stream.chunks.length > 0) {
      console.log(`\n📝 内容chunks详情:`)
      stream.chunks.forEach((chunk, i) => {
        console.log(`   ${i + 1}. Chunk #${chunk.index}: ${chunk.contentLength} 字符 (累计: ${chunk.cumulativeLength})`)
        if (i < 3) {
          console.log(`      内容: "${chunk.content.substring(0, 50)}${chunk.content.length > 50 ? '...' : ''}"`)
        }
      })
    } else {
      console.log(`\n⚠️ 没有内容chunks！`)
      console.log(`   可能原因:`)
      console.log(`   - finish_reason: ${stream.finishReason || 'N/A'}`)
      console.log(`   - 错误: ${stream.error ? JSON.stringify(stream.error) : 'N/A'}`)
    }
    
    if (stream.fullContent) {
      console.log(`\n📄 完整内容:`)
      console.log(stream.fullContent)
    }
  }
  
  // 统计信息
  window.showStreamStats = function() {
    const total = streamResponses.length
    const withContent = streamResponses.filter(s => s.fullContent.length > 0).length
    const empty = streamResponses.filter(s => s.fullContent.length === 0).length
    const filtered = streamResponses.filter(s => s.finishReason === 'content_filter' || s.finishReason === 'safety').length
    const withErrors = streamResponses.filter(s => s.error).length
    
    console.log('\n📊 流式响应统计:')
    console.log(`   总请求数: ${total}`)
    console.log(`   有内容: ${withContent} (${total > 0 ? ((withContent / total) * 100).toFixed(1) : 0}%)`)
    console.log(`   空响应: ${empty} (${total > 0 ? ((empty / total) * 100).toFixed(1) : 0}%)`)
    console.log(`   被过滤: ${filtered} (${total > 0 ? ((filtered / total) * 100).toFixed(1) : 0}%)`)
    console.log(`   有错误: ${withErrors} (${total > 0 ? ((withErrors / total) * 100).toFixed(1) : 0}%)`)
    
    if (empty > 0) {
      console.log(`\n⚠️ 空响应详情:`)
      streamResponses.filter(s => s.fullContent.length === 0).forEach((stream, i) => {
        console.log(`   ${i + 1}. finish_reason: ${stream.finishReason || 'N/A'}, 错误: ${stream.error ? JSON.stringify(stream.error) : 'N/A'}`)
      })
    }
  }
  
  // 清除记录
  window.clearStreamResponses = function() {
    streamResponses.length = 0
    console.log('✅ 已清除所有流式响应记录')
  }
  
  console.log('\n✅ 调试工具已加载')
  console.log('\n可用命令:')
  console.log('  showStreamResponses(limit)  - 查看流式响应记录（默认5条）')
  console.log('  showStreamDetails(index)    - 查看详细的流式响应（默认最后一条，-1表示最后一条）')
  console.log('  showStreamStats()           - 查看统计信息')
  console.log('  clearStreamResponses()      - 清除所有记录')
  
  console.log('\n💡 现在发送一条消息，观察上面的日志')
  console.log('💡 如果看到 "⚠️⚠️⚠️ 流式响应为空！"，运行 showStreamDetails() 查看详情')
  console.log('💡 如果看到 "⚠️⚠️⚠️ 内容被过滤！"，说明内容触发了安全过滤')
  
})()
