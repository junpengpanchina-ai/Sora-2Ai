// 批量生成卡顿诊断工具 - 一键诊断任务卡住问题
// 粘贴到浏览器控制台运行

// 检查是否已经安装，如果已安装则先清理
if (window._batchDebugInstalled) {
  console.log('⚠️ 检测到已安装的调试工具，正在清理...')
  if (window._batchDebugOriginalFetch) {
    window.fetch = window._batchDebugOriginalFetch
  }
  if (window._batchDebugMonitoringInterval) {
    clearInterval(window._batchDebugMonitoringInterval)
  }
}

console.clear()
console.log('%c🔄 批量生成卡顿诊断工具', 'font-size: 16px; font-weight: bold; color: #ef4444;')
console.log('='.repeat(60))

// 数据收集
const apiCalls = []
const errors = []
const stuckTasks = []
let currentTaskId = null

// 1. 获取当前任务ID（从localStorage或手动指定）
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

// 2. 监控批量生成相关的API调用
// 保存原始fetch函数
if (!window._batchDebugOriginalFetch) {
  window._batchDebugOriginalFetch = window.fetch
}
const originalFetch = window._batchDebugOriginalFetch
window.fetch = function(...args) {
  const url = args[0]
  
  if (typeof url === 'string' && url.includes('/api/admin/batch-generation')) {
    const requestInfo = {
      url,
      method: args[1]?.method || 'GET',
      timestamp: new Date().toISOString(),
      startTime: Date.now(),
    }
    
    console.log(`\n📤 批量生成API: ${requestInfo.method} ${url}`)
    
    return originalFetch.apply(this, args).then(async (response) => {
      const duration = Date.now() - requestInfo.startTime
      const responseInfo = {
        ...requestInfo,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        duration: `${duration}ms`,
      }
      
      // 记录慢请求（超过30秒）
      if (duration > 30000) {
        console.warn(`⚠️ 慢请求警告: ${url} 耗时 ${duration}ms`)
        errors.push({
          type: 'SlowRequest',
          ...responseInfo,
        })
      }
      
      // 克隆响应以便读取内容
      const cloned = response.clone()
      
      try {
        const data = await cloned.json()
        responseInfo.data = data
        
        if (!response.ok || data.error) {
          errors.push({
            type: 'APIError',
            ...responseInfo,
          })
          console.error('%c❌ API错误:', 'color: red;', responseInfo)
        } else {
          console.log('✅ API成功:', {
            success: data.success,
            status: data.task?.status,
            progress: data.task?.progress,
            currentIndex: data.task?.current_industry_index,
            totalIndustries: data.task?.total_industries,
          })
          
          // 检查任务是否卡住
          if (data.task) {
            checkTaskStuck(data.task)
          }
        }
      } catch (e) {
        // 不是JSON响应，忽略
      }
      
      apiCalls.push(responseInfo)
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
      console.error('%c❌ 网络错误:', 'color: red;', errorInfo)
      return Promise.reject(err)
    })
  }
  
  return originalFetch.apply(this, args)
}

// 3. 检查任务是否卡住
function checkTaskStuck(task) {
  if (!task.updated_at) return
  
  const updatedAt = new Date(task.updated_at).getTime()
  const minutesSinceUpdate = (Date.now() - updatedAt) / 60000
  
  if (minutesSinceUpdate >= 10 && ['pending', 'processing'].includes(task.status)) {
    const stuckInfo = {
      taskId: task.id,
      status: task.status,
      progress: task.progress,
      currentIndex: task.current_industry_index,
      totalIndustries: task.total_industries,
      minutesSinceUpdate: minutesSinceUpdate.toFixed(1),
      updatedAt: task.updated_at,
    }
    
    // 避免重复记录
    if (!stuckTasks.find(t => t.taskId === task.id)) {
      stuckTasks.push(stuckInfo)
      console.warn('%c⚠️ 检测到卡住的任务:', 'color: orange; font-weight: bold;', stuckInfo)
    }
  }
}

// 4. 获取任务状态
window.getTaskStatus = async function(taskId = null) {
  const id = taskId || currentTaskId || getCurrentTaskId()
  if (!id) {
    console.error('❌ 请提供任务ID或先设置: setTaskId("your-task-id")')
    return null
  }
  
  console.log(`\n🔍 获取任务状态: ${id}`)
  
  try {
    const response = await fetch(`/api/admin/batch-generation/status/${id}`)
    const data = await response.json()
    
    if (!response.ok || !data.success) {
      console.error('❌ 获取任务状态失败:', data)
      return null
    }
    
    const task = data.task
    const updatedAt = task.updated_at ? new Date(task.updated_at).getTime() : 0
    const minutesSinceUpdate = updatedAt ? (Date.now() - updatedAt) / 60000 : Infinity
    
    console.log('\n%c📊 任务详情', 'font-size: 14px; font-weight: bold; color: #00d4ff;')
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
    console.log('GEO:', task.geo || 'N/A')
    console.log('最后更新:', task.updated_at)
    console.log('距离现在:', `${minutesSinceUpdate.toFixed(1)} 分钟前`)
    
    if (task.error_message || task.last_error) {
      console.error('\n%c❌ 错误信息', 'color: red; font-weight: bold;')
      if (task.error_message) console.error('错误消息:', task.error_message)
      if (task.last_error) console.error('最后错误:', task.last_error)
    }
    
    // 检查是否卡住
    if (minutesSinceUpdate >= 10 && ['pending', 'processing'].includes(task.status)) {
      console.warn(`\n%c⚠️ 任务可能卡住了！`, 'color: orange; font-weight: bold; font-size: 14px;')
      console.warn(`已 ${minutesSinceUpdate.toFixed(1)} 分钟未更新`)
      console.log('建议运行: recoverTask() 来恢复任务')
    }
    
    // 显示当前处理的行业
    if (task.industries && task.current_industry_index !== undefined) {
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

// 5. 恢复卡住的任务
window.recoverTask = async function(taskId = null, force = false) {
  const id = taskId || currentTaskId || getCurrentTaskId()
  if (!id) {
    console.error('❌ 请提供任务ID或先设置: setTaskId("your-task-id")')
    return null
  }
  
  console.log(`\n🔄 尝试恢复任务: ${id}${force ? ' (强制)' : ''}`)
  
  try {
    const response = await fetch('/api/admin/batch-generation/recover', {
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
    
    // 等待2秒后检查状态
    setTimeout(() => {
      console.log('\n📊 检查恢复后的状态...')
      getTaskStatus(id)
    }, 2000)
    
    return data
  } catch (error) {
    console.error('❌ 恢复任务异常:', error)
    return null
  }
}

// 6. 设置任务ID
window.setTaskId = function(taskId) {
  currentTaskId = taskId
  localStorage.setItem('lastBatchTaskId', taskId)
  console.log('✅ 任务ID已设置:', taskId)
  return taskId
}

// 7. 持续监控任务状态
window.startMonitoring = function(taskId = null, interval = 10000) {
  const id = taskId || currentTaskId || getCurrentTaskId()
  if (!id) {
    console.error('❌ 请提供任务ID或先设置: setTaskId("your-task-id")')
    return
  }
  
  // 如果已有监控在运行，先停止
  if (window._batchDebugMonitoringInterval) {
    console.log('⚠️ 监控已在运行，先停止旧的监控')
    clearInterval(window._batchDebugMonitoringInterval)
  }
  
  console.log(`\n🔄 开始监控任务: ${id} (每${interval/1000}秒检查一次)`)
  
  window._batchDebugMonitoringInterval = setInterval(() => {
    console.log(`\n[${new Date().toLocaleTimeString()}] 检查任务状态...`)
    getTaskStatus(id)
  }, interval)
  
  // 立即检查一次
  getTaskStatus(id)
}

window.stopMonitoring = function() {
  if (window._batchDebugMonitoringInterval) {
    clearInterval(window._batchDebugMonitoringInterval)
    window._batchDebugMonitoringInterval = null
    console.log('✅ 监控已停止')
  } else {
    console.log('⚠️ 没有正在运行的监控')
  }
}

// 8. 生成诊断报告
window.batchDebugReport = function() {
  console.clear()
  console.log('%c📋 批量生成诊断报告', 'font-size: 18px; font-weight: bold; color: #00d4ff;')
  console.log('='.repeat(60))
  
  console.log('\n%c1. 当前任务', 'font-size: 14px; font-weight: bold; color: #4ecdc4;')
  if (currentTaskId) {
    console.log('任务ID:', currentTaskId)
    getTaskStatus(currentTaskId).then(task => {
      if (task) {
        console.log('\n%c2. API调用统计', 'font-size: 14px; font-weight: bold; color: #ff6b6b;')
        console.log(`总调用次数: ${apiCalls.length}`)
        if (apiCalls.length > 0) {
          console.log('最近5次调用:')
          apiCalls.slice(-5).forEach((call, index) => {
            console.log(`${index + 1}. [${call.timestamp}] ${call.method} ${call.url} - ${call.status} (${call.duration})`)
          })
        }
        
        console.log('\n%c3. 错误统计', 'font-size: 14px; font-weight: bold; color: #ef4444;')
        if (errors.length === 0) {
          console.log('✅ 未发现错误')
        } else {
          console.error(`❌ 发现 ${errors.length} 个错误:`)
          errors.forEach((error, index) => {
            console.error(`\n错误 #${index + 1}:`, error)
          })
        }
        
        console.log('\n%c4. 卡住的任务', 'font-size: 14px; font-weight: bold; color: #ffd93d;')
        if (stuckTasks.length === 0) {
          console.log('✅ 未发现卡住的任务')
        } else {
          console.warn(`⚠️ 发现 ${stuckTasks.length} 个卡住的任务:`)
          stuckTasks.forEach((task, index) => {
            console.warn(`\n任务 #${index + 1}:`, task)
          })
        }
        
        console.log('\n%c5. 修复建议', 'font-size: 14px; font-weight: bold; color: #a8e6cf;')
        
        if (stuckTasks.length > 0 || (task && (Date.now() - new Date(task.updated_at).getTime()) / 60000 >= 10)) {
          console.log('🔧 任务卡住修复建议:')
          console.log('  1. 运行 recoverTask() 尝试自动恢复')
          console.log('  2. 如果自动恢复失败，运行 recoverTask(null, true) 强制恢复')
          console.log('  3. 检查 Vercel 日志查看是否有错误')
          console.log('  4. 检查 Supabase 数据库连接是否正常')
          console.log('  5. 检查 API Key 是否有效')
        }
        
        if (errors.length > 0) {
          console.log('🔧 错误修复建议:')
          errors.forEach(error => {
            if (error.type === 'NetworkError') {
              console.log('  - 网络连接问题，检查网络或API服务状态')
            } else if (error.type === 'SlowRequest') {
              console.log('  - API响应慢，可能是服务器负载高或网络问题')
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
    console.log('请运行: setTaskId("your-task-id") 或 getCurrentTaskId()')
  }
}

// 9. 自动获取任务ID并显示初始状态
getCurrentTaskId()

console.log('\n✅ 调试工具已启动')
console.log('\n可用命令:')
console.log('  getTaskStatus(taskId?)     - 获取任务状态（不传参数使用当前任务）')
console.log('  recoverTask(taskId?, force) - 恢复卡住的任务（force=true强制恢复）')
console.log('  setTaskId(taskId)          - 设置当前任务ID')
console.log('  startMonitoring(taskId?, interval) - 开始持续监控（默认10秒）')
console.log('  stopMonitoring()           - 停止监控')
console.log('  batchDebugReport()         - 查看完整诊断报告')
console.log('\n💡 快速开始:')
if (currentTaskId) {
  console.log(`  当前任务ID: ${currentTaskId}`)
  console.log('  运行 getTaskStatus() 查看状态')
  console.log('  运行 startMonitoring() 开始监控')
} else {
  console.log('  运行 setTaskId("your-task-id") 设置任务ID')
}

// 标记已安装
window._batchDebugInstalled = true

// 自动显示初始报告
setTimeout(() => {
  if (currentTaskId) {
    console.log('\n%c📊 自动检查任务状态...', 'font-size: 12px; color: #888;')
    getTaskStatus(currentTaskId)
  }
}, 1000)

