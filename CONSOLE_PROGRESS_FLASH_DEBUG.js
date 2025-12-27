// 🔍 进度闪烁检测代码
// 
// 使用方法：
// 1. 打开浏览器开发者工具（F12）
// 2. 切换到 Console（控制台）标签
// 3. 复制整个文件内容并粘贴到控制台，按回车执行
// 4. 代码会自动开始监控进度变化
//
// 功能：
// - 自动检测进度在47和52之间的闪烁
// - 记录所有进度变化历史
// - 提供详细的调试信息
//
// 常用命令：
// window.__progressFlashDebug.showHistory() - 查看历史记录
// window.__progressFlashDebug.stop() - 停止监控
// window.__progressFlashDebug.start() - 重新开始监控
// window.__progressFlashDebug.clear() - 清空历史记录

(function() {
  console.log('🔍 开始监控进度闪烁问题...');
  
  // 存储历史记录
  const history = [];
  let lastCompletedCount = null;
  let lastTasksSnapshot = null;
  let checkCount = 0;
  
  // 检查频率（毫秒）
  const CHECK_INTERVAL = 1000;
  
  // 获取当前任务的completed数量
  function getCurrentCompletedCount() {
    try {
      // 遍历所有div元素，查找包含"生成进度"的元素
      const allDivs = document.querySelectorAll('div');
      for (const div of allDivs) {
        const text = div.textContent || '';
        if (text.includes('生成进度') || text.includes('已完成行业数')) {
          // 尝试匹配数字格式：数字 / 数字
          const match = text.match(/(\d+)\s*\/\s*(\d+)/);
          if (match) {
            return {
              completed: parseInt(match[1], 10),
              total: parseInt(match[2], 10),
              element: div,
              fullText: text.trim()
            };
          }
        }
      }
    } catch (e) {
      console.warn('获取进度时出错:', e);
    }
    
    return null;
  }
  
  // 监听DOM变化（使用防抖，避免过于频繁的检查）
  let domCheckTimer = null;
  function monitorDOMChanges() {
    const observer = new MutationObserver((mutations) => {
      // 防抖：只在DOM变化后200ms检查一次
      if (domCheckTimer) {
        clearTimeout(domCheckTimer);
      }
      domCheckTimer = setTimeout(() => {
        const current = getCurrentCompletedCount();
        if (current) {
          checkCompletedCount(current.completed, current.total);
        }
      }, 200);
    });
    
    // 观察整个body的变化
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
    
    console.log('✅ DOM变化监听器已启动（200ms防抖）');
    return observer;
  }
  
  // 获取实际完成的任务数（从DOM解析）
  function getActualCompletedCount() {
    try {
      const taskElements = document.querySelectorAll('[class*="border"]');
      let completedCount = 0;
      taskElements.forEach((el) => {
        const text = el.textContent || '';
        if (text.includes('已完成') || text.includes('✅ 已完成')) {
          completedCount++;
        }
      });
      return completedCount;
    } catch (e) {
      return null;
    }
  }
  
  // 检查completed数量
  function checkCompletedCount(completed, total) {
    checkCount++;
    const timestamp = new Date().toISOString();
    
    // 获取实际完成的任务数
    const actualCompleted = getActualCompletedCount();
    
    // 检测显示进度和实际完成数的不一致
    if (actualCompleted !== null && actualCompleted !== completed) {
      console.warn(`⚠️ 不一致检测: 显示进度=${completed}, 实际完成=${actualCompleted}`, {
        timestamp,
        checkCount,
        displayed: completed,
        actual: actualCompleted,
        difference: actualCompleted - completed
      });
    }
    
    // 检测变化
    if (lastCompletedCount !== null && lastCompletedCount !== completed) {
      const change = completed - lastCompletedCount;
      const record = {
        timestamp,
        checkCount,
        completed,
        total,
        actualCompleted,
        change,
        from: lastCompletedCount,
        to: completed,
        stackTrace: new Error().stack
      };
      
      history.push(record);
      
      console.log(`⚠️ 进度变化检测到: ${lastCompletedCount} → ${completed} (变化: ${change > 0 ? '+' : ''}${change})`, {
        timestamp,
        checkCount,
        from: lastCompletedCount,
        to: completed,
        total,
        actualCompleted: actualCompleted !== null ? actualCompleted : 'N/A'
      });
      
      // 特别关注47和52之间的切换
      if ((lastCompletedCount === 47 && completed === 52) || 
          (lastCompletedCount === 52 && completed === 47)) {
        console.error('🚨 检测到47↔52闪烁！', record);
        console.log('📍 调用堆栈:', record.stackTrace);
        
        // 获取当前DOM快照
        const current = getCurrentCompletedCount();
        if (current && current.element) {
          console.log('📸 DOM快照:', {
            element: current.element,
            fullText: current.fullText,
            parent: current.element.parentElement?.textContent?.substring(0, 200)
          });
        }
        
        // 记录详细的任务状态
        inspectTaskData();
      }
    }
    
    lastCompletedCount = completed;
    
    // 每10次检查输出一次状态（包含实际完成数）
    if (checkCount % 10 === 0) {
      console.log(`📊 检查 #${checkCount}: 显示进度 ${completed}/${total}${actualCompleted !== null ? `, 实际完成 ${actualCompleted}` : ''}`, {
        historyLength: history.length,
        lastChange: history.length > 0 ? history[history.length - 1] : null
      });
    }
  }
  
  // 定期检查
  function startPeriodicCheck() {
    const intervalId = setInterval(() => {
      const current = getCurrentCompletedCount();
      if (current) {
        checkCompletedCount(current.completed, current.total);
      } else {
        // 如果找不到元素，尝试通过其他方式
        console.warn(`⚠️ 第${checkCount + 1}次检查: 无法获取进度信息`);
      }
    }, CHECK_INTERVAL);
    
    console.log(`✅ 定期检查已启动 (每${CHECK_INTERVAL}ms检查一次)`);
    return intervalId;
  }
  
  // 获取任务数据的详细信息（通过DOM或全局变量）
  function inspectTaskData() {
    console.log('🔍 检查任务数据...');
    
    // 尝试找到React组件实例
    try {
      const reactRoot = document.querySelector('#__next') || document.querySelector('#root');
      if (reactRoot) {
        console.log('找到React根元素:', reactRoot);
      }
    } catch (e) {
      console.warn('无法检查React组件:', e);
    }
    
    // 尝试从localStorage获取任务ID
    try {
      const taskId = localStorage.getItem('lastBatchTaskId');
      if (taskId) {
        console.log('📝 找到任务ID:', taskId);
      }
    } catch (e) {
      // 忽略
    }
    
    // 尝试从DOM获取所有任务状态
    try {
      const taskElements = document.querySelectorAll('[class*="border"]');
      const tasks = [];
      taskElements.forEach((el, idx) => {
        const text = el.textContent || '';
        if (text.includes('已完成') || text.includes('正在') || text.includes('等待')) {
          const match = text.match(/(\d+)\.\s*([^\n]+)/);
          if (match) {
            const status = text.includes('已完成') ? 'completed' : 
                          text.includes('正在') ? 'processing' : 'pending';
            tasks.push({
              index: parseInt(match[1], 10),
              industry: match[2].trim(),
              status,
              element: el
            });
          }
        }
      });
      if (tasks.length > 0) {
        const completedCount = tasks.filter(t => t.status === 'completed').length;
        console.log(`📋 找到 ${tasks.length} 个任务，已完成: ${completedCount}`);
        console.log('任务详情:', tasks);
      }
    } catch (e) {
      console.warn('无法解析任务列表:', e);
    }
  }
  
  // 显示历史记录
  function showHistory() {
    console.log('📜 历史记录:', history);
    console.log('📊 统计信息:', {
      totalChecks: checkCount,
      totalChanges: history.length,
      changes: history.map(h => `${h.from}→${h.to}`),
      flashCount: history.filter(h => 
        (h.from === 47 && h.to === 52) || (h.from === 52 && h.to === 47)
      ).length
    });
    
    return history;
  }
  
  // 导出到全局作用域
  window.__progressFlashDebug = {
    history,
    getCurrentCompletedCount,
    showHistory,
    inspectTaskData,
    start: function() {
      console.log('🚀 启动进度闪烁检测...');
      this.domObserver = monitorDOMChanges();
      this.intervalId = startPeriodicCheck();
      inspectTaskData();
      console.log('✅ 检测已启动！使用 window.__progressFlashDebug.showHistory() 查看历史记录');
    },
    stop: function() {
      if (this.domObserver) {
        this.domObserver.disconnect();
        console.log('🛑 DOM监听器已停止');
      }
      if (this.intervalId) {
        clearInterval(this.intervalId);
        console.log('🛑 定期检查已停止');
      }
    },
    clear: function() {
      history.length = 0;
      lastCompletedCount = null;
      checkCount = 0;
      console.log('🧹 历史记录已清空');
    }
  };
  
  // 自动启动
  console.log('📌 进度闪烁检测代码已加载');
  console.log('📌 使用 window.__progressFlashDebug.start() 开始监控');
  console.log('📌 使用 window.__progressFlashDebug.showHistory() 查看历史');
  console.log('📌 使用 window.__progressFlashDebug.stop() 停止监控');
  
  // 如果在页面加载完成后，自动启动
  if (document.readyState === 'complete') {
    setTimeout(() => {
      window.__progressFlashDebug.start();
    }, 2000);
  } else {
    window.addEventListener('load', () => {
      setTimeout(() => {
        window.__progressFlashDebug.start();
      }, 2000);
    });
  }
})();

