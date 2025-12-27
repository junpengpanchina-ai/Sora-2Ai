// 🔍 全面问题检测代码
// 检测：DOM错误、任务恢复、进度闪烁、数据不一致等问题
//
// 使用方法：
// 1. 打开浏览器开发者工具（F12）
// 2. 切换到 Console（控制台）标签
// 3. 复制整个文件内容并粘贴到控制台，按回车执行

(function() {
  console.log('🔍 开始全面问题检测...');
  
  const debug = {
    // 存储所有检测到的信息
    errors: [],
    warnings: [],
    info: [],
    domErrors: [],
    taskData: null,
    progressHistory: [],
    
    // 检测DOM错误
    monitorDOMErrors: function() {
      // 捕获所有错误
      const originalError = window.onerror;
      window.onerror = (message, source, lineno, colno, error) => {
        if (message && message.includes('removeChild')) {
          const errorInfo = {
            type: 'DOM_ERROR',
            message,
            source,
            lineno,
            colno,
            error: error?.stack,
            timestamp: new Date().toISOString()
          };
          this.domErrors.push(errorInfo);
          console.error('🚨 DOM错误检测到:', errorInfo);
        }
        if (originalError) {
          originalError(message, source, lineno, colno, error);
        }
        return false;
      };
      
      // 捕获未处理的Promise错误
      window.addEventListener('unhandledrejection', (event) => {
        if (event.reason && event.reason.toString().includes('removeChild')) {
          const errorInfo = {
            type: 'PROMISE_REJECTION',
            message: event.reason.toString(),
            stack: event.reason?.stack,
            timestamp: new Date().toISOString()
          };
          this.domErrors.push(errorInfo);
          console.error('🚨 Promise错误检测到:', errorInfo);
        }
      });
      
      console.log('✅ DOM错误监听器已启动');
    },
    
    // 检测任务恢复问题
    checkTaskRestore: function() {
      console.log('🔍 检查任务恢复状态...');
      
      // 从localStorage获取任务ID
      const taskId = localStorage.getItem('lastBatchTaskId');
      if (taskId) {
        console.log('📝 找到任务ID:', taskId);
        this.info.push({
          type: 'TASK_ID',
          taskId,
          timestamp: new Date().toISOString()
        });
      } else {
        console.warn('⚠️ 未找到任务ID');
        this.warnings.push({
          type: 'NO_TASK_ID',
          message: 'localStorage中没有lastBatchTaskId',
          timestamp: new Date().toISOString()
        });
      }
      
      // 检查DOM中的任务列表
      this.checkTaskListInDOM();
    },
    
    // 检查DOM中的任务列表
    checkTaskListInDOM: function() {
      try {
        // 查找所有任务卡片
        const taskElements = document.querySelectorAll('[class*="border"]');
        const tasks = [];
        let completedCount = 0;
        let processingCount = 0;
        let pendingCount = 0;
        
        taskElements.forEach((el) => {
          const text = el.textContent || '';
          if (text.match(/\d+\.\s+[^\n]+/)) {
            const match = text.match(/(\d+)\.\s*([^\n]+)/);
            if (match) {
              const index = parseInt(match[1], 10);
              const industry = match[2].trim();
              let status = 'unknown';
              
              if (text.includes('已完成') || text.includes('✅ 已完成')) {
                status = 'completed';
                completedCount++;
              } else if (text.includes('正在') || text.includes('生成场景词')) {
                status = 'processing';
                processingCount++;
              } else if (text.includes('等待')) {
                status = 'pending';
                pendingCount++;
              }
              
              tasks.push({
                index,
                industry,
                status,
                element: el
              });
            }
          }
        });
        
        // 检查进度显示
        const progressInfo = this.getProgressFromDOM();
        
        const taskData = {
          totalTasks: tasks.length,
          completedCount,
          processingCount,
          pendingCount,
          tasks: tasks.slice(0, 10), // 只保存前10个任务的详情
          progressInfo,
          timestamp: new Date().toISOString()
        };
        
        this.taskData = taskData;
        
        console.log('📊 任务列表检查结果:', taskData);
        
        // 检查不一致
        if (progressInfo && progressInfo.completed !== completedCount) {
          const warning = {
            type: 'PROGRESS_MISMATCH',
            message: `进度显示不一致: 显示=${progressInfo.completed}, 实际完成=${completedCount}`,
            displayed: progressInfo.completed,
            actual: completedCount,
            difference: completedCount - progressInfo.completed,
            timestamp: new Date().toISOString()
          };
          this.warnings.push(warning);
          console.warn('⚠️ 进度不一致:', warning);
        }
        
        // 检查任务数量
        if (progressInfo && progressInfo.total !== tasks.length) {
          const warning = {
            type: 'TASK_COUNT_MISMATCH',
            message: `任务总数不一致: 显示=${progressInfo.total}, 实际=${tasks.length}`,
            displayed: progressInfo.total,
            actual: tasks.length,
            timestamp: new Date().toISOString()
          };
          this.warnings.push(warning);
          console.warn('⚠️ 任务总数不一致:', warning);
        }
        
        return taskData;
      } catch (e) {
        console.error('❌ 检查任务列表时出错:', e);
        this.errors.push({
          type: 'TASK_LIST_CHECK_ERROR',
          error: e.toString(),
          stack: e.stack,
          timestamp: new Date().toISOString()
        });
        return null;
      }
    },
    
    // 从DOM获取进度信息
    getProgressFromDOM: function() {
      try {
        const allDivs = document.querySelectorAll('div');
        for (const div of allDivs) {
          const text = div.textContent || '';
          if (text.includes('生成进度') || text.includes('已完成行业数')) {
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
        console.warn('获取进度信息时出错:', e);
      }
      return null;
    },
    
    // 监控进度变化
    monitorProgress: function() {
      let lastProgress = null;
      let checkCount = 0;
      
      const checkProgress = () => {
        checkCount++;
        const progressInfo = this.getProgressFromDOM();
        const taskData = this.checkTaskListInDOM();
        
        if (progressInfo) {
          const progressRecord = {
            checkCount,
            completed: progressInfo.completed,
            total: progressInfo.total,
            actualCompleted: taskData?.completedCount || null,
            actualTotal: taskData?.totalTasks || null,
            timestamp: new Date().toISOString()
          };
          
          this.progressHistory.push(progressRecord);
          
          // 检测变化
          if (lastProgress !== null && lastProgress.completed !== progressInfo.completed) {
            const change = progressInfo.completed - lastProgress.completed;
            console.log(`⚠️ 进度变化: ${lastProgress.completed} → ${progressInfo.completed} (变化: ${change > 0 ? '+' : ''}${change})`, progressRecord);
            
            // 特别关注47和52
            if ((lastProgress.completed === 47 && progressInfo.completed === 52) ||
                (lastProgress.completed === 52 && progressInfo.completed === 47)) {
              console.error('🚨 检测到47↔52闪烁！', {
                from: lastProgress,
                to: progressRecord,
                taskData
              });
            }
          }
          
          lastProgress = {
            completed: progressInfo.completed,
            total: progressInfo.total
          };
        }
        
        // 每10次检查输出一次
        if (checkCount % 10 === 0) {
          console.log(`📊 检查 #${checkCount}:`, {
            progress: progressInfo,
            taskData: taskData ? {
              total: taskData.totalTasks,
              completed: taskData.completedCount
            } : null
          });
        }
      };
      
      // 立即检查一次
      checkProgress();
      
      // 定期检查
      const intervalId = setInterval(checkProgress, 2000);
      
      console.log('✅ 进度监控已启动 (每2秒检查一次)');
      return intervalId;
    },
    
    // 检查React组件状态（如果可能）
    checkReactState: function() {
      try {
        const reactRoot = document.querySelector('#__next') || document.querySelector('#root');
        if (reactRoot) {
          console.log('找到React根元素');
          
          // 尝试通过React DevTools API获取状态
          if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
            console.log('React DevTools可用');
          }
        }
      } catch (e) {
        console.warn('检查React状态时出错:', e);
      }
    },
    
    // 显示所有检测结果
    showReport: function() {
      console.log('📋 完整检测报告');
      console.log('================');
      
      console.log('🚨 DOM错误:', this.domErrors);
      console.log('⚠️ 警告:', this.warnings);
      console.log('❌ 错误:', this.errors);
      console.log('ℹ️ 信息:', this.info);
      console.log('📊 任务数据:', this.taskData);
      console.log('📈 进度历史:', this.progressHistory);
      
      // 统计
      const stats = {
        domErrors: this.domErrors.length,
        warnings: this.warnings.length,
        errors: this.errors.length,
        progressChanges: this.progressHistory.filter((h, i, arr) => 
          i > 0 && h.completed !== arr[i-1].completed
        ).length,
        flash47_52: this.progressHistory.filter((h, i, arr) => 
          i > 0 && (
            (arr[i-1].completed === 47 && h.completed === 52) ||
            (arr[i-1].completed === 52 && h.completed === 47)
          )
        ).length
      };
      
      console.log('📊 统计:', stats);
      
      return {
        domErrors: this.domErrors,
        warnings: this.warnings,
        errors: this.errors,
        info: this.info,
        taskData: this.taskData,
        progressHistory: this.progressHistory,
        stats
      };
    },
    
    // 清空所有记录
    clear: function() {
      this.errors = [];
      this.warnings = [];
      this.info = [];
      this.domErrors = [];
      this.taskData = null;
      this.progressHistory = [];
      console.log('🧹 所有记录已清空');
    }
  };
  
  // 启动所有检测
  debug.monitorDOMErrors();
  debug.checkTaskRestore();
  debug.checkReactState();
  const progressInterval = debug.monitorProgress();
  
  // 导出到全局
  window.__comprehensiveDebug = {
    ...debug,
    stop: function() {
      if (progressInterval) {
        clearInterval(progressInterval);
        console.log('🛑 进度监控已停止');
      }
    }
  };
  
  console.log('✅ 全面检测已启动');
  console.log('📌 使用 window.__comprehensiveDebug.showReport() 查看完整报告');
  console.log('📌 使用 window.__comprehensiveDebug.checkTaskListInDOM() 手动检查任务列表');
  console.log('📌 使用 window.__comprehensiveDebug.stop() 停止监控');
})();

