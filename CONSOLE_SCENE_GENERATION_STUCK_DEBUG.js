// 场景应用生成失败/卡住诊断工具 - 专门诊断任务卡住和递归调用问题
// 粘贴到浏览器控制台运行

// 检查是否已经安装，如果已安装则先清理
if (window._sceneStuckDebugInstalled) {
  console.log('⚠️ 检测到已安装的调试工具，正在清理...')
  if (window._sceneStuckDebugOriginalFetch) {
    window.fetch = window._sceneStuckDebugOriginalFetch
  }
  if (window._sceneStuckDebugMonitoringInterval) {
    clearInterval(window._sceneStuckDebugMonitoringInterval)
  }
}

// 🔥 检测递归调用和栈溢出
let callStackDepth = 0
const MAX_STACK_DEPTH = 50
const stackOverflowDetections = []

console.clear()
console.log('%c🔍 场景应用生成失败/卡住诊断工具', 'font-size: 18px; font-weight: bold; color: #ef4444;')
console.log('='.repeat(70))

// 数据收集
const statusHistory = []
const processCalls = []
const errors = []
const stuckDetections = []
let currentTaskId = null
let lastStatus = null
let consecutiveStuckChecks = 0

// 1. 获取当前任务ID
function getCurrentTaskId() {
  // 尝试从localStorage获取
  const stored = localStorage.getItem('lastBatchTaskId')
  if (stored) {
    currentTaskId = stored
    console.log('📌 从localStorage获取任务ID:', currentTaskId)
    return currentTaskId
  }
  
  // 尝试从URL参数获取
  const urlParams = new URLSearchParams(window.location.search)
  const taskIdFromUrl = urlParams.get('taskId')
  if (taskIdFromUrl) {
    currentTaskId = taskIdFromUrl
    console.log('📌 从URL获取任务ID:', currentTaskId)
    return currentTaskId
  }
  
  console.warn('⚠️ 未找到任务ID，请手动设置: setTaskId("your-task-id")')
  return null
}

// 2. 监控所有批量生成相关的API调用
if (!window._sceneStuckDebugOriginalFetch) {
  window._sceneStuckDebugOriginalFetch = window.fetch
}
const originalFetch = window._sceneStuckDebugOriginalFetch
// 🔥 确保 originalFetch 在所有函数中可访问
window._sceneStuckDebugOriginalFetchRef = originalFetch

window.fetch = function(...args) {
  // 🔥 检测递归调用深度
  callStackDepth++
  if (callStackDepth > MAX_STACK_DEPTH) {
    const errorInfo = {
      type: 'StackOverflow',
      timestamp: Date.now(),
      depth: callStackDepth,
      url: typeof args[0] === 'string' ? args[0] : 'unknown',
      stack: new Error().stack,
    }
    
    stackOverflowDetections.push(errorInfo)
    
    console.error('\n%c🚨 检测到可能的栈溢出！', 'color: red; font-weight: bold; font-size: 16px;')
    console.error('调用深度:', callStackDepth)
    console.error('URL:', errorInfo.url)
    console.error('调用堆栈:', errorInfo.stack)
    
    callStackDepth = 0 // 重置深度
    throw new Error('Maximum call stack size exceeded - 检测到递归调用')
  }
  
  const url = args[0]
  const method = args[1]?.method || 'GET'
  
  // 监控状态查询
  if (typeof url === 'string' && url.includes('/api/admin/batch-generation/status/')) {
    const requestInfo = {
      url,
      method,
      timestamp: new Date().toISOString(),
      startTime: Date.now(),
    }
    
    return originalFetch.apply(this, args).then(async (response) => {
      const duration = Date.now() - requestInfo.startTime
      
      try {
        const cloned = response.clone()
        const data = await cloned.json()
        
        if (data.task) {
          const task = data.task
          const updatedAt = task.updated_at ? new Date(task.updated_at).getTime() : 0
          const minutesSinceUpdate = updatedAt ? (Date.now() - updatedAt) / 60000 : Infinity
          
          // 检查是否卡住
          const isStuck = minutesSinceUpdate >= 2 && ['pending', 'processing'].includes(task.status)
          
          if (isStuck) {
            consecutiveStuckChecks++
            
            // 记录卡住检测
            if (!stuckDetections.find(d => d.taskId === task.id && Math.abs(d.timestamp - Date.now()) < 5000)) {
              stuckDetections.push({
                taskId: task.id,
                timestamp: Date.now(),
                minutesSinceUpdate: minutesSinceUpdate.toFixed(1),
                status: task.status,
                progress: task.progress,
                currentIndex: task.current_industry_index,
                totalIndustries: task.total_industries,
                errorMessage: task.error_message,
                lastError: task.last_error,
              })
              
              console.warn(`\n%c⚠️ 检测到任务卡住 (第${consecutiveStuckChecks}次)`, 'color: orange; font-weight: bold; font-size: 14px;')
              console.warn('任务ID:', task.id)
              console.warn('状态:', task.status)
              console.warn('进度:', `${task.progress || 0}%`)
              console.warn('已停止更新:', `${minutesSinceUpdate.toFixed(1)} 分钟`)
              console.warn('当前行业索引:', task.current_industry_index)
              console.warn('总行业数:', task.total_industries)
              
              if (task.error_message || task.last_error) {
                console.error('错误信息:', task.error_message || task.last_error)
              }
              
              // 如果连续3次检测到卡住，建议恢复
              if (consecutiveStuckChecks >= 3) {
                console.error('\n%c🔧 建议操作:', 'color: red; font-weight: bold;')
                console.error('任务已连续3次检测为卡住状态，建议运行:')
                console.error('  recoverTask()  - 尝试自动恢复')
                console.error('  或')
                console.error('  recoverTask(null, true)  - 强制恢复')
              }
            }
          } else {
            // 如果状态有变化，重置计数
            if (lastStatus && (
              lastStatus.progress !== task.progress ||
              lastStatus.current_industry_index !== task.current_industry_index ||
              lastStatus.status !== task.status
            )) {
              consecutiveStuckChecks = 0
              console.log(`\n%c✅ 任务状态有更新`, 'color: green;')
              console.log('进度:', `${lastStatus.progress || 0}% → ${task.progress || 0}%`)
              console.log('行业索引:', `${lastStatus.current_industry_index || 0} → ${task.current_industry_index || 0}`)
            }
            
            lastStatus = {
              progress: task.progress,
              current_industry_index: task.current_industry_index,
              status: task.status,
            }
          }
          
          // 记录状态历史
          statusHistory.push({
            timestamp: Date.now(),
            task: {
              id: task.id,
              status: task.status,
              progress: task.progress,
              currentIndex: task.current_industry_index,
              totalIndustries: task.total_industries,
              updatedAt: task.updated_at,
              minutesSinceUpdate: minutesSinceUpdate.toFixed(1),
              errorMessage: task.error_message,
              lastError: task.last_error,
            },
            duration,
          })
        }
      } catch (e) {
        // 忽略JSON解析错误
      }
      
      return response
    }).catch(err => {
      callStackDepth = 0 // 重置深度
      
      const errorMessage = err.message || String(err)
      const isStackOverflow = errorMessage.includes('Maximum call stack size exceeded') ||
                             errorMessage.includes('stack overflow') ||
                             errorMessage.includes('too much recursion')
      
      const errorInfo = {
        type: isStackOverflow ? 'StackOverflow' : 'StatusCheckError',
        url,
        error: errorMessage,
        timestamp: new Date().toISOString(),
        stack: err.stack,
      }
      
      errors.push(errorInfo)
      
      if (isStackOverflow) {
        stackOverflowDetections.push({
          ...errorInfo,
          timestamp: Date.now(),
        })
        console.error('\n%c🚨 检测到栈溢出错误！', 'color: red; font-weight: bold; font-size: 16px;')
        console.error('URL:', url)
        console.error('错误:', errorMessage)
        console.error('调用堆栈:', err.stack)
      } else {
        console.error('%c❌ 状态查询失败:', 'color: red;', errorInfo)
      }
      
      return Promise.reject(err)
    }).finally(() => {
      callStackDepth = Math.max(0, callStackDepth - 1) // 减少深度
    })
  }
  
  // 监控处理进程调用
  if (typeof url === 'string' && url.includes('/api/admin/batch-generation/process')) {
    const requestInfo = {
      url,
      method,
      timestamp: new Date().toISOString(),
      startTime: Date.now(),
    }
    
    console.log(`\n%c🔄 检测到处理进程调用`, 'color: blue; font-weight: bold;')
    console.log('URL:', url)
    console.log('时间:', new Date(requestInfo.timestamp).toLocaleString())
    
    return originalFetch.apply(this, args).then(async (response) => {
      const duration = Date.now() - requestInfo.startTime
      
      try {
        const cloned = response.clone()
        const data = await cloned.json()
        
        processCalls.push({
          ...requestInfo,
          status: response.status,
          ok: response.ok,
          duration,
          response: data,
        })
        
        if (response.ok) {
          console.log('✅ 处理进程调用成功')
          console.log('响应:', data)
        } else {
          console.error('❌ 处理进程调用失败:', data)
          errors.push({
            type: 'ProcessCallError',
            ...requestInfo,
            status: response.status,
            error: data.error || data.message,
          })
        }
      } catch (e) {
        // 忽略JSON解析错误
      }
      
      return response
    }).catch(err => {
      callStackDepth = Math.max(0, callStackDepth - 1)
      const errorInfo = {
        type: 'ProcessCallNetworkError',
        ...requestInfo,
        error: err.message,
      }
      errors.push(errorInfo)
      console.error('%c❌ 处理进程调用网络错误:', 'color: red;', errorInfo)
      return Promise.reject(err)
    }).finally(() => {
      callStackDepth = Math.max(0, callStackDepth - 1)
    })
  }
  
  // 监控恢复调用
  if (typeof url === 'string' && url.includes('/api/admin/batch-generation/recover')) {
    const requestInfo = {
      url,
      method,
      timestamp: new Date().toISOString(),
      startTime: Date.now(),
    }
    
    console.log(`\n%c🔧 检测到恢复调用`, 'color: purple; font-weight: bold;')
    console.log('URL:', url)
    
    return originalFetch.apply(this, args).then(async (response) => {
      const duration = Date.now() - requestInfo.startTime
      const cloned = response.clone()
      const data = await cloned.json()
      
      console.log('恢复响应:', data)
      
      if (data.ok) {
        console.log('✅ 恢复调用成功')
        // 重置卡住计数
        consecutiveStuckChecks = 0
      } else {
        console.error('❌ 恢复调用失败:', data)
      }
      
      return response
    }).catch(err => {
      callStackDepth = Math.max(0, callStackDepth - 1)
      throw err
    }).finally(() => {
      callStackDepth = Math.max(0, callStackDepth - 1)
    })
  }
  
  try {
    const result = originalFetch.apply(this, args)
    // 如果是 Promise，在 finally 中减少深度
    if (result && typeof result.then === 'function') {
      return result.finally(() => {
        callStackDepth = Math.max(0, callStackDepth - 1)
      })
    }
    callStackDepth = Math.max(0, callStackDepth - 1)
    return result
  } catch (err) {
    callStackDepth = Math.max(0, callStackDepth - 1)
    throw err
  }
}

// 3. 获取任务详细状态
window.getTaskStatus = async function(taskId = null) {
  const id = taskId || currentTaskId || getCurrentTaskId()
  if (!id) {
    console.error('❌ 请提供任务ID或先设置: setTaskId("your-task-id")')
    return null
  }
  
  console.log(`\n%c🔍 获取任务详细状态: ${id}`, 'font-size: 14px; font-weight: bold; color: #00d4ff;')
  
  try {
    // 🔥 使用原始 fetch，避免递归调用
    const originalFetchRef = window._sceneStuckDebugOriginalFetchRef || window._sceneStuckDebugOriginalFetch
    const response = await originalFetchRef(`/api/admin/batch-generation/status/${id}`)
    const data = await response.json()
    
    if (!response.ok || !data.success) {
      console.error('❌ 获取任务状态失败:', data)
      return null
    }
    
    const task = data.task
    const updatedAt = task.updated_at ? new Date(task.updated_at).getTime() : 0
    const minutesSinceUpdate = updatedAt ? (Date.now() - updatedAt) / 60000 : Infinity
    const isStuck = minutesSinceUpdate >= 2 && ['pending', 'processing'].includes(task.status)
    
    console.log('\n%c📊 任务详情', 'font-size: 14px; font-weight: bold; color: #4ecdc4;')
    console.log('任务ID:', task.id)
    console.log('状态:', task.status)
    console.log('进度:', `${task.progress || 0}%`)
    console.log('当前行业索引:', task.current_industry_index || 0)
    console.log('总行业数:', task.total_industries || 0)
    console.log('已完成行业:', `${task.current_industry_index || 0} / ${task.total_industries || 0}`)
    console.log('已生成场景词:', task.total_scenes_generated || 0)
    console.log('已保存场景词:', task.total_scenes_saved || 0)
    console.log('每行业场景数:', task.scenes_per_industry || 0)
    console.log('使用场景类型:', task.use_case_type || 'N/A')
    console.log('最后更新:', task.updated_at)
    console.log('距离现在:', `${minutesSinceUpdate.toFixed(1)} 分钟前`)
    
    if (isStuck) {
      console.error('\n%c⚠️ 任务已卡住！', 'color: red; font-weight: bold; font-size: 16px;')
      console.error(`已 ${minutesSinceUpdate.toFixed(1)} 分钟未更新`)
    }
    
    if (task.error_message || task.last_error) {
      console.error('\n%c❌ 错误信息', 'color: red; font-weight: bold;')
      if (task.error_message) console.error('错误消息:', task.error_message)
      if (task.last_error) console.error('最后错误:', task.last_error)
    }
    
    // 显示当前处理的行业
    if (task.industries && Array.isArray(task.industries) && task.current_industry_index !== undefined) {
      const currentIndustry = task.industries[task.current_industry_index]
      if (currentIndustry) {
        console.log('\n当前处理行业:', currentIndustry)
      }
    }
    
    return task
  } catch (error) {
    console.error('❌ 获取任务状态异常:', error)
    return null
  }
}

// 4. 恢复卡住的任务
window.recoverTask = async function(taskId = null, force = false) {
  const id = taskId || currentTaskId || getCurrentTaskId()
  if (!id) {
    console.error('❌ 请提供任务ID或先设置: setTaskId("your-task-id")')
    return null
  }
  
  console.log(`\n%c🔧 尝试恢复任务: ${id}${force ? ' (强制)' : ''}`, 'font-size: 14px; font-weight: bold; color: #ff6b6b;')
  
  try {
    // 🔥 使用原始 fetch，避免递归调用
    const originalFetchRef = window._sceneStuckDebugOriginalFetchRef || window._sceneStuckDebugOriginalFetch
    const response = await originalFetchRef('/api/admin/batch-generation/recover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId: id, force }),
    })
    
    const data = await response.json()
    
    if (!response.ok || !data.ok) {
      console.error('❌ 恢复任务失败:', data)
      return null
    }
    
    console.log('✅ 恢复任务成功:', data.message)
    console.log('任务信息:', data.task)
    
    // 重置卡住计数
    consecutiveStuckChecks = 0
    
    // 等待3秒后检查状态
    setTimeout(() => {
      console.log('\n📊 检查恢复后的状态...')
      getTaskStatus(id)
    }, 3000)
    
    return data
  } catch (error) {
    console.error('❌ 恢复任务异常:', error)
    return null
  }
}

// 5. 设置任务ID
window.setTaskId = function(taskId) {
  currentTaskId = taskId
  localStorage.setItem('lastBatchTaskId', taskId)
  console.log('✅ 任务ID已设置:', taskId)
  return taskId
}

// 6. 持续监控任务状态（自动检测卡住）
window.startMonitoring = function(taskId = null, interval = 10000) {
  const id = taskId || currentTaskId || getCurrentTaskId()
  if (!id) {
    console.error('❌ 请提供任务ID或先设置: setTaskId("your-task-id")')
    return
  }
  
  // 如果已有监控在运行，先停止
  if (window._sceneStuckDebugMonitoringInterval) {
    console.log('⚠️ 监控已在运行，先停止旧的监控')
    clearInterval(window._sceneStuckDebugMonitoringInterval)
  }
  
  console.log(`\n%c🔄 开始监控任务: ${id} (每${interval/1000}秒检查一次)`, 'font-size: 14px; font-weight: bold; color: #00d4ff;')
  console.log('💡 将自动检测任务是否卡住')
  
  window._sceneStuckDebugMonitoringInterval = setInterval(() => {
    console.log(`\n[${new Date().toLocaleTimeString()}] 检查任务状态...`)
    getTaskStatus(id)
  }, interval)
  
  // 立即检查一次
  getTaskStatus(id)
}

window.stopMonitoring = function() {
  if (window._sceneStuckDebugMonitoringInterval) {
    clearInterval(window._sceneStuckDebugMonitoringInterval)
    window._sceneStuckDebugMonitoringInterval = null
    console.log('✅ 监控已停止')
  } else {
    console.log('⚠️ 没有正在运行的监控')
  }
}

// 7. 生成详细诊断报告
window.sceneStuckReport = function() {
  console.clear()
  console.log('%c📋 场景应用生成失败/卡住诊断报告', 'font-size: 18px; font-weight: bold; color: #00d4ff;')
  console.log('='.repeat(70))
  
  console.log('\n%c1. 当前任务', 'font-size: 14px; font-weight: bold; color: #4ecdc4;')
  if (currentTaskId) {
    console.log('任务ID:', currentTaskId)
    getTaskStatus(currentTaskId).then(task => {
      if (task) {
        console.log('\n%c2. 卡住检测记录', 'font-size: 14px; font-weight: bold; color: #ff6b6b;')
        if (stuckDetections.length === 0) {
          console.log('✅ 未检测到卡住情况')
        } else {
          console.error(`❌ 检测到 ${stuckDetections.length} 次卡住:`)
          stuckDetections.forEach((detection, index) => {
            console.error(`\n卡住 #${index + 1}:`)
            console.error('  时间:', new Date(detection.timestamp).toLocaleString())
            console.error('  已停止更新:', `${detection.minutesSinceUpdate} 分钟`)
            console.error('  状态:', detection.status)
            console.error('  进度:', `${detection.progress || 0}%`)
            console.error('  行业索引:', `${detection.currentIndex || 0} / ${detection.totalIndustries || 0}`)
            if (detection.errorMessage || detection.lastError) {
              console.error('  错误:', detection.errorMessage || detection.lastError)
            }
          })
        }
        
        console.log('\n%c3. 状态历史', 'font-size: 14px; font-weight: bold; color: #ffd93d;')
        if (statusHistory.length === 0) {
          console.log('ℹ️ 暂无状态历史')
        } else {
          console.log(`共 ${statusHistory.length} 条状态记录`)
          console.log('最近10条:')
          statusHistory.slice(-10).forEach((record, index) => {
            console.log(`  ${index + 1}. [${new Date(record.timestamp).toLocaleTimeString()}] 进度: ${record.task.progress || 0}% | 行业: ${record.task.currentIndex || 0}/${record.task.totalIndustries || 0} | 停止更新: ${record.task.minutesSinceUpdate}分钟`)
          })
        }
        
        console.log('\n%c4. 处理进程调用', 'font-size: 14px; font-weight: bold; color: #95e1d3;')
        if (processCalls.length === 0) {
          console.warn('⚠️ 未检测到处理进程调用')
          console.warn('这可能意味着后台处理进程没有运行')
        } else {
          console.log(`共 ${processCalls.length} 次处理进程调用:`)
          processCalls.slice(-5).forEach((call, index) => {
            console.log(`  ${index + 1}. [${new Date(call.timestamp).toLocaleString()}] ${call.status} (${call.duration}ms)`)
            if (call.response && call.response.error) {
              console.error('    错误:', call.response.error)
            }
          })
        }
        
        console.log('\n%c5. 错误统计', 'font-size: 14px; font-weight: bold; color: #ef4444;')
        if (errors.length === 0) {
          console.log('✅ 未发现错误')
        } else {
          console.error(`❌ 发现 ${errors.length} 个错误:`)
          
          // 优先显示栈溢出错误
          const stackOverflowErrors = errors.filter(e => e.type === 'StackOverflow')
          if (stackOverflowErrors.length > 0) {
            console.error(`\n🚨 栈溢出错误 (${stackOverflowErrors.length} 个):`)
            stackOverflowErrors.forEach((error, index) => {
              console.error(`\n栈溢出 #${index + 1}:`)
              console.error('  时间:', new Date(error.timestamp).toLocaleString())
              if (error.url) console.error('  URL:', error.url)
              if (error.error) console.error('  错误:', error.error)
              if (error.stack) console.error('  调用堆栈:', error.stack)
            })
          }
          
          const otherErrors = errors.filter(e => e.type !== 'StackOverflow')
          if (otherErrors.length > 0) {
            console.error(`\n其他错误 (${otherErrors.length} 个):`)
            otherErrors.forEach((error, index) => {
              console.error(`\n错误 #${index + 1}:`)
              console.error('  类型:', error.type)
              console.error('  时间:', new Date(error.timestamp).toLocaleString())
              if (error.url) console.error('  URL:', error.url)
              if (error.error) console.error('  错误:', error.error)
              if (error.status) console.error('  状态:', error.status)
            })
          }
        }
        
        console.log('\n%c5.5. 栈溢出检测', 'font-size: 14px; font-weight: bold; color: #ff0000;')
        if (stackOverflowDetections.length === 0) {
          console.log('✅ 未检测到栈溢出')
        } else {
          console.error(`🚨 检测到 ${stackOverflowDetections.length} 次栈溢出:`)
          stackOverflowDetections.forEach((detection, index) => {
            console.error(`\n栈溢出 #${index + 1}:`)
            console.error('  时间:', new Date(detection.timestamp).toLocaleString())
            console.error('  调用深度:', detection.depth)
            if (detection.url) console.error('  URL:', detection.url)
            if (detection.stack) console.error('  调用堆栈:', detection.stack)
          })
        }
        
        console.log('\n%c6. 修复建议', 'font-size: 14px; font-weight: bold; color: #a8e6cf;')
        
        if (stackOverflowDetections.length > 0) {
          console.log('🔧 栈溢出修复建议:')
          console.log('  1. 立即刷新页面（Ctrl+R 或 Cmd+R）')
          console.log('  2. 清除浏览器缓存和 localStorage')
          console.log('  3. 检查代码中是否有无限递归调用')
          console.log('  4. 检查 setState 回调是否导致无限更新')
          console.log('  5. 检查 useEffect 依赖项是否导致无限循环')
          console.log('  6. 运行以下命令清除任务状态:')
          console.log('     localStorage.removeItem("lastBatchTaskId")')
        }
        
        if (stuckDetections.length > 0 || (task && (Date.now() - new Date(task.updated_at).getTime()) / 60000 >= 2)) {
          console.log('🔧 任务卡住修复建议:')
          console.log('  1. 运行 recoverTask() 尝试自动恢复')
          console.log('  2. 如果自动恢复失败，运行 recoverTask(null, true) 强制恢复')
          console.log('  3. 检查 Vercel 日志查看后台处理进程是否有错误')
          console.log('  4. 检查 Supabase 数据库连接是否正常')
          console.log('  5. 检查 API Key (GEMINI_API_KEY) 是否有效')
          console.log('  6. 检查当前处理的行业是否有特殊字符或格式问题')
        }
        
        if (processCalls.length === 0) {
          console.log('🔧 未检测到处理进程调用:')
          console.log('  - 后台处理进程可能已停止')
          console.log('  - 运行 recoverTask() 重新触发处理进程')
          console.log('  - 检查 Vercel 函数日志')
        }
        
        if (errors.length > 0) {
          console.log('🔧 错误修复建议:')
          errors.forEach(error => {
            if (error.type === 'ProcessCallNetworkError') {
              console.log('  - 处理进程调用网络错误，检查 Vercel 函数是否正常运行')
            } else if (error.type === 'ProcessCallError') {
              console.log('  - 处理进程返回错误，检查 Vercel 日志获取详细错误信息')
            } else if (error.status === 401) {
              console.log('  - 认证失败，请重新登录')
            } else if (error.status === 500) {
              console.log('  - 服务器错误，检查 Vercel 日志')
            }
          })
        }
      }
    })
  } else {
    console.log('⚠️ 未设置任务ID')
    console.log('请运行: setTaskId("your-task-id")')
  }
}

// 8. 自动获取任务ID并显示初始状态
getCurrentTaskId()

console.log('\n✅ 调试工具已启动')
console.log('\n可用命令:')
console.log('  getTaskStatus(taskId?)     - 获取任务详细状态')
console.log('  recoverTask(taskId?, force) - 恢复卡住的任务（force=true强制恢复）')
console.log('  setTaskId(taskId)          - 设置当前任务ID')
console.log('  startMonitoring(taskId?, interval) - 开始持续监控（默认10秒）')
console.log('  stopMonitoring()           - 停止监控')
console.log('  sceneStuckReport()         - 查看完整诊断报告')
console.log('\n💡 快速开始:')
if (currentTaskId) {
  console.log(`  当前任务ID: ${currentTaskId}`)
  console.log('  运行 getTaskStatus() 查看详细状态')
  console.log('  运行 startMonitoring() 开始自动监控')
  console.log('  运行 sceneStuckReport() 查看完整报告')
} else {
  console.log('  运行 setTaskId("your-task-id") 设置任务ID')
}

// 标记已安装
window._sceneStuckDebugInstalled = true

// 自动显示初始状态
setTimeout(() => {
  if (currentTaskId) {
    console.log('\n%c📊 自动检查任务状态...', 'font-size: 12px; color: #888;')
    getTaskStatus(currentTaskId)
  }
}, 1000)

