// 场景应用生成失败 - 快速诊断工具
// 直接复制粘贴到浏览器控制台运行

(function() {
  'use strict'
  
  console.clear()
  console.log('%c🔍 场景应用生成失败 - 快速诊断', 'font-size: 16px; font-weight: bold; color: #ef4444;')
  console.log('='.repeat(60))
  
  // 获取任务ID
  const taskId = localStorage.getItem('lastBatchTaskId') || 
                 new URLSearchParams(window.location.search).get('taskId')
  
  if (!taskId) {
    console.warn('⚠️ 未找到任务ID')
    console.log('💡 请先运行: setTaskId("your-task-id")')
  } else {
    console.log('📌 当前任务ID:', taskId)
  }
  
  // 设置任务ID
  window.setTaskId = function(id) {
    localStorage.setItem('lastBatchTaskId', id)
    console.log('✅ 任务ID已设置:', id)
    return id
  }
  
  // 获取任务状态
  window.getStatus = async function(id = null) {
    if (!id) {
      id = getCurrentTaskId()
    }
    if (!id) {
      console.error('❌ 请提供任务ID或先设置: setTaskId("your-task-id")')
      return null
    }
    
    console.log(`\n🔍 检查任务状态: ${id}`)
    
    try {
      const response = await fetch(`/api/admin/batch-generation/status/${id}`)
      const data = await response.json()
      
      if (!response.ok || !data.success) {
        console.error('❌ 获取状态失败:', data)
        return null
      }
      
      const task = data.task
      const updatedAt = task.updated_at ? new Date(task.updated_at).getTime() : 0
      const minutesSinceUpdate = updatedAt ? (Date.now() - updatedAt) / 60000 : Infinity
      const isStuck = minutesSinceUpdate >= 2 && ['pending', 'processing'].includes(task.status)
      
      console.log('\n📊 任务状态:')
      console.log('  状态:', task.status)
      console.log('  进度:', `${task.progress || 0}%`)
      console.log('  行业:', `${task.current_industry_index || 0} / ${task.total_industries || 0}`)
      console.log('  已生成:', task.total_scenes_generated || 0)
      console.log('  已保存:', task.total_scenes_saved || 0)
      console.log('  最后更新:', minutesSinceUpdate.toFixed(1), '分钟前')
      
      if (isStuck) {
        console.error('\n⚠️ 任务已卡住！')
        console.log('💡 运行 recover() 尝试恢复')
      }
      
      if (task.error_message || task.last_error) {
        console.error('\n❌ 错误信息:')
        if (task.error_message) console.error('  ', task.error_message)
        if (task.last_error) console.error('  ', task.last_error)
      }
      
      return task
    } catch (error) {
      console.error('❌ 检查失败:', error.message)
      return null
    }
  }
  
  // 恢复任务
  window.recover = async function(id = null, force = false) {
    if (!id) {
      id = getCurrentTaskId()
    }
    if (!id) {
      console.error('❌ 请提供任务ID或先设置: setTaskId("your-task-id")')
      return null
    }
    
    console.log(`\n🔧 恢复任务: ${id}${force ? ' (强制)' : ''}`)
    
    try {
      const response = await fetch('/api/admin/batch-generation/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: id, force }),
      })
      
      const data = await response.json()
      
      if (!response.ok || !data.ok) {
        console.error('❌ 恢复失败:', data)
        return null
      }
      
      console.log('✅ 恢复成功:', data.message)
      
      // 等待后检查状态
      setTimeout(() => {
        console.log('\n📊 检查恢复后的状态...')
        window.getStatus(id)
      }, 2000)
      
      return data
    } catch (error) {
      console.error('❌ 恢复异常:', error.message)
      return null
    }
  }
  
  // 清除任务
  window.clearTask = function() {
    localStorage.removeItem('lastBatchTaskId')
    console.log('✅ 已清除任务ID')
  }
  
  // 进度监控历史（暴露到 window 以便跨调用访问）
  window._progressHistory = window._progressHistory || []
  const progressHistory = window._progressHistory
  
  // 获取当前任务ID的辅助函数（也暴露到全局）
  window.getCurrentTaskId = function() {
    return localStorage.getItem('lastBatchTaskId') || 
           new URLSearchParams(window.location.search).get('taskId')
  }
  const getCurrentTaskId = window.getCurrentTaskId
  
  // 快速诊断
  window.quickCheck = async function() {
    console.log('\n🔍 快速诊断...')
    
    const currentTaskId = getCurrentTaskId()
    if (!currentTaskId) {
      console.warn('⚠️ 未找到任务ID')
      console.log('💡 请先运行: setTaskId("your-task-id")')
      return
    }
    
    const task = await window.getStatus(currentTaskId)
    
    if (!task) {
      console.error('❌ 无法获取任务状态')
      return
    }
    
    const updatedAt = task.updated_at ? new Date(task.updated_at).getTime() : 0
    const minutesSinceUpdate = updatedAt ? (Date.now() - updatedAt) / 60000 : Infinity
    
    // 记录进度历史
    const progressRecord = {
      timestamp: Date.now(),
      progress: task.progress || 0,
      currentIndex: task.current_industry_index || 0,
      totalIndustries: task.total_industries || 0,
      totalScenesSaved: task.total_scenes_saved || 0,
      totalScenesGenerated: task.total_scenes_generated || 0,
    }
    progressHistory.push(progressRecord)
    
    // 只保留最近10条记录
    if (progressHistory.length > 10) {
      progressHistory.shift()
    }
    
    console.log('\n💡 诊断结果:')
    
    if (task.status === 'completed') {
      console.log('✅ 任务已完成')
    } else if (task.status === 'failed') {
      console.error('❌ 任务已失败')
      if (task.error_message) {
        console.error('错误:', task.error_message)
      }
    } else {
      // 检查进度是否在变化
      if (progressHistory.length >= 2) {
        const lastRecord = progressHistory[progressHistory.length - 1]
        const prevRecord = progressHistory[progressHistory.length - 2]
        const timeDiff = (lastRecord.timestamp - prevRecord.timestamp) / 1000 // 秒
        
        const progressChanged = lastRecord.progress !== prevRecord.progress
        const indexChanged = lastRecord.currentIndex !== prevRecord.currentIndex
        const savedChanged = lastRecord.totalScenesSaved !== prevRecord.totalScenesSaved
        
        if (progressChanged || indexChanged) {
          console.log('✅ 进度正在更新')
          if (progressChanged) {
            console.log(`  进度: ${prevRecord.progress}% → ${lastRecord.progress}%`)
          }
          if (indexChanged) {
            console.log(`  行业: ${prevRecord.currentIndex} → ${lastRecord.currentIndex}`)
          }
        } else if (savedChanged) {
          console.warn('⚠️ 进度未更新，但已保存数量在增长')
          console.log(`  已保存: ${prevRecord.totalScenesSaved} → ${lastRecord.totalScenesSaved} (+${lastRecord.totalScenesSaved - prevRecord.totalScenesSaved})`)
          console.log('  说明：任务在运行，但进度计算可能有问题')
        } else {
          console.warn('⚠️ 进度和已保存数量都没有变化')
          if (timeDiff >= 60) {
            console.warn(`  已 ${Math.floor(timeDiff)} 秒没有更新，可能卡住`)
          }
        }
      }
      
      // 检查是否卡住
      if (minutesSinceUpdate >= 10) {
        console.error('⚠️ 任务可能卡住（超过10分钟未更新）')
        console.log('建议运行: recover(null, true) 强制恢复')
      } else if (minutesSinceUpdate >= 2) {
        console.warn('⚠️ 任务可能卡住（超过2分钟未更新）')
        console.log('建议运行: recover() 尝试恢复')
      } else {
        console.log('✅ 任务正在运行中')
      }
    }
  }
  
  // 持续监控（每5秒检查一次）
  window.startMonitor = function(interval = 5000) {
    if (window._monitorInterval) {
      console.log('⚠️ 监控已在运行，先停止')
      clearInterval(window._monitorInterval)
    }
    
    console.log(`\n🔄 开始监控（每${interval/1000}秒检查一次）`)
    console.log('运行 stopMonitor() 停止监控')
    
    window._monitorInterval = setInterval(() => {
      window.quickCheck()
    }, interval)
    
    // 立即检查一次
    window.quickCheck()
  }
  
  window.stopMonitor = function() {
    if (window._monitorInterval) {
      clearInterval(window._monitorInterval)
      window._monitorInterval = null
      console.log('✅ 监控已停止')
    } else {
      console.log('⚠️ 没有正在运行的监控')
    }
  }
  
  // 查看进度历史
  window.showHistory = function() {
    const history = window._progressHistory || []
    if (history.length === 0) {
      console.log('ℹ️ 暂无进度历史')
      return
    }
    
    console.log(`\n📊 进度历史（最近${history.length}次）:`)
    history.forEach((record, index) => {
      const time = new Date(record.timestamp).toLocaleTimeString()
      console.log(`${index + 1}. [${time}] 进度: ${record.progress}% | 行业: ${record.currentIndex}/${record.totalIndustries} | 已保存: ${record.totalScenesSaved}`)
    })
  }
  
  console.log('\n✅ 调试工具已加载')
  console.log('\n可用命令:')
  console.log('  getStatus(taskId?)     - 获取任务状态')
  console.log('  recover(taskId?, force) - 恢复任务（force=true强制恢复）')
  console.log('  setTaskId(id)          - 设置任务ID')
  console.log('  clearTask()            - 清除任务ID')
  console.log('  quickCheck()           - 快速诊断')
  console.log('  startMonitor(interval)  - 开始持续监控（默认5秒）')
  console.log('  stopMonitor()          - 停止监控')
  console.log('  showHistory()          - 查看进度历史')
  
  if (taskId) {
    console.log(`\n💡 当前任务ID: ${taskId}`)
    console.log('运行 quickCheck() 快速诊断')
    console.log('运行 startMonitor() 开始持续监控')
    console.log('运行 getStatus() 查看详细状态')
  }
  
  // 自动运行快速检查
  if (taskId) {
    setTimeout(() => {
      if (window.quickCheck) {
        window.quickCheck()
      }
    }, 500)
  }
  
  // 验证所有函数都已加载
  const requiredFunctions = ['quickCheck', 'getStatus', 'recover', 'setTaskId', 'clearTask', 'startMonitor', 'stopMonitor', 'showHistory']
  const missingFunctions = requiredFunctions.filter(fn => !window[fn])
  
  if (missingFunctions.length > 0) {
    console.error('❌ 以下函数未正确加载:', missingFunctions)
    console.error('请重新复制整个脚本并执行')
  } else {
    console.log('\n✅ 所有函数已成功加载到全局作用域')
    console.log('💡 现在可以直接使用: quickCheck(), getStatus(), recover() 等命令')
    
    // 测试函数是否真的可用
    try {
      if (typeof window.quickCheck === 'function') {
        console.log('✅ quickCheck 函数验证成功')
      } else {
        console.error('❌ quickCheck 不是函数:', typeof window.quickCheck)
      }
    } catch (e) {
      console.error('❌ 验证函数时出错:', e.message)
    }
  }
  
})()

// 确保函数在全局作用域可用（双重保险）
if (typeof window.quickCheck === 'undefined') {
  console.error('❌ 警告: quickCheck 函数未加载！请检查脚本是否完整执行')
} else {
  console.log('✅ 全局作用域验证: quickCheck 可用')
}

