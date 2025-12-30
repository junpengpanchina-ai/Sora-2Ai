/**
 * 场景词视频生成调试脚本
 * 用于追踪：
 * 1. 场景词为什么不能生成视频
 * 2. 扣积分后自动刷新为什么没反应
 * 3. DOM操作错误（removeChild）
 * 
 * 使用方法：在浏览器控制台粘贴并执行
 */

(function() {
  'use strict';
  
  console.log('%c[SceneVideoDebug] 🚀 场景词视频生成调试脚本已启动', 'color: #00ff00; font-weight: bold; font-size: 14px;');
  
  // ==================== 配置 ====================
  const CONFIG = {
    logLevel: 'verbose', // 'verbose' | 'normal' | 'minimal'
    trackNetwork: true,
    trackDOM: true,
    trackCredits: true,
    trackVideoGeneration: true,
    autoReport: false, // 自动报告错误
  };
  
  // ==================== 日志工具 ====================
  const logger = {
    verbose: (...args) => {
      if (CONFIG.logLevel === 'verbose') {
        console.log('%c[SceneVideoDebug]', 'color: #888;', ...args);
      }
    },
    log: (...args) => {
      console.log('%c[SceneVideoDebug]', 'color: #2196F3;', ...args);
    },
    warn: (...args) => {
      console.warn('%c[SceneVideoDebug] ⚠️', 'color: #FF9800; font-weight: bold;', ...args);
    },
    error: (...args) => {
      console.error('%c[SceneVideoDebug] ❌', 'color: #F44336; font-weight: bold;', ...args);
    },
    success: (...args) => {
      console.log('%c[SceneVideoDebug] ✅', 'color: #4CAF50; font-weight: bold;', ...args);
    },
  };
  
  // ==================== 数据收集 ====================
  const debugData = {
    videoGenerations: [],
    creditUpdates: [],
    networkRequests: [],
    domErrors: [],
    sceneWordSubmissions: [],
    refreshAttempts: [],
    errors: [],
  };
  
  // ==================== 网络请求监控 ====================
  if (CONFIG.trackNetwork) {
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
      const url = args[0];
      const options = args[1] || {};
      const method = options.method || 'GET';
      const startTime = Date.now();
      
      // 记录请求
      const requestInfo = {
        url: typeof url === 'string' ? url : url?.url || 'unknown',
        method,
        timestamp: new Date().toISOString(),
        requestBody: options.body,
        headers: options.headers,
      };
      
      logger.verbose('📤 Network Request:', requestInfo);
      debugData.networkRequests.push(requestInfo);
      
      try {
        const response = await originalFetch.apply(this, args);
        const duration = Date.now() - startTime;
        
        // 克隆响应以便读取body
        const clonedResponse = response.clone();
        
        // 检查是否是视频生成相关请求
        if (url.includes('/api/video/generate')) {
          // 解析请求体以获取 prompt
          let requestPrompt = 'unknown';
          try {
            if (options.body && typeof options.body === 'string') {
              const bodyObj = JSON.parse(options.body);
              requestPrompt = bodyObj.prompt || 'unknown';
            }
          } catch (e) {
            // 忽略解析错误
          }
          
          logger.log('🎬 Video Generation Request:', {
            url,
            method,
            prompt: requestPrompt.substring(0, 100) + (requestPrompt.length > 100 ? '...' : ''),
            promptLength: requestPrompt.length,
            duration: `${duration}ms`,
            currentUrl: window.location.href,
          });
          
          try {
            const data = await clonedResponse.json();
            logger.log('📦 Video Generation Response:', {
              success: data.success,
              status: data.status,
              taskId: data.task_id,
              hasVideoUrl: !!data.video_url,
              error: data.error,
            });
            
            debugData.videoGenerations.push({
              ...requestInfo,
              requestPrompt: requestPrompt.substring(0, 200),
              response: data,
              duration,
              success: data.success,
              status: data.status,
              error: data.error,
              taskId: data.task_id,
              currentUrl: window.location.href,
            });
            
            // 检查是否成功
            if (data.success) {
              logger.success('✅ Video generation request succeeded');
              
              // 检查是否有task_id（需要轮询）
              if (data.task_id && data.status === 'processing') {
                logger.log('🔄 Video is processing, task_id:', data.task_id);
                logger.log('   Will start polling for results...');
              } else if (data.video_url) {
                logger.success('🎉 Video completed immediately!');
              }
              
              // 检查积分是否会被刷新
              logger.log('💰 Checking if credits will be refreshed...');
              setTimeout(() => {
                const recentCreditCalls = debugData.networkRequests.filter(req => {
                  return req.url.includes('/api/stats') && 
                         new Date(req.timestamp).getTime() > (Date.now() - 5000);
                });
                
                if (recentCreditCalls.length > 0) {
                  logger.success('✅ Credits refresh detected after video generation');
                } else {
                  logger.warn('⚠️ No credits refresh detected after video generation (may be delayed)');
                }
              }, 2000);
            } else {
              logger.error('❌ Video generation failed:', data.error);
              
              // 检查是否是积分不足
              if (data.error && (data.error.includes('credits') || data.error.includes('Insufficient'))) {
                logger.warn('⚠️ Insufficient credits detected!');
                logger.warn('   This might explain why video generation failed');
              }
            }
          } catch (e) {
            logger.warn('Failed to parse video generation response:', e);
          }
        }
        
        // 检查是否是积分查询请求
        if (url.includes('/api/stats')) {
          logger.verbose('💰 Credits Check Request:', {
            url,
            duration: `${duration}ms`,
          });
          
          try {
            const data = await clonedResponse.json();
            logger.log('💰 Credits Response:', {
              credits: data.credits,
              success: data.success,
            });
            
            debugData.creditUpdates.push({
              ...requestInfo,
              response: data,
              duration,
              credits: data.credits,
              timestamp: new Date().toISOString(),
            });
            
            if (data.credits !== undefined) {
              logger.success(`💰 Credits updated: ${data.credits}`);
            }
          } catch (e) {
            logger.warn('Failed to parse credits response:', e);
          }
        }
        
        // 检查是否是视频结果查询
        if (url.includes('/api/video/result/')) {
          logger.verbose('🔍 Video Result Poll:', {
            url,
            duration: `${duration}ms`,
          });
          
          try {
            const data = await clonedResponse.json();
            logger.log('🔍 Video Result:', {
              success: data.success,
              status: data.status,
              progress: data.progress,
              hasVideoUrl: !!data.video_url,
            });
          } catch (e) {
            logger.warn('Failed to parse video result response:', e);
          }
        }
        
        return response;
      } catch (error) {
        logger.error('Network request failed:', {
          url,
          method,
          error: error.message,
        });
        
        debugData.errors.push({
          type: 'network_error',
          url,
          method,
          error: error.message,
          timestamp: new Date().toISOString(),
        });
        
        throw error;
      }
    };
    
    logger.success('✅ Network monitoring enabled');
  }
  
  // ==================== DOM错误监控 ====================
  if (CONFIG.trackDOM) {
    // 监控removeChild错误
    const originalRemoveChild = Node.prototype.removeChild;
    Node.prototype.removeChild = function(child) {
      try {
        // 检查child是否是this的子节点
        if (!this.contains(child)) {
          logger.error('❌ removeChild Error: Node is not a child of this node', {
            parent: this,
            child: child,
            parentTag: this.tagName || this.nodeName,
            childTag: child.tagName || child.nodeName,
            stack: new Error().stack,
          });
          
          debugData.domErrors.push({
            type: 'removeChild_not_child',
            timestamp: new Date().toISOString(),
            parent: {
              tagName: this.tagName || this.nodeName,
              id: this.id,
              className: this.className,
            },
            child: {
              tagName: child.tagName || child.nodeName,
              id: child.id,
              className: child.className,
            },
            stack: new Error().stack,
          });
          
          // 尝试使用更安全的方法
          if (child.remove && typeof child.remove === 'function') {
            logger.warn('⚠️ Attempting to use child.remove() instead');
            child.remove();
            return child;
          }
        }
        
        return originalRemoveChild.call(this, child);
      } catch (error) {
        logger.error('❌ removeChild Exception:', {
          error: error.message,
          stack: error.stack,
        });
        
        debugData.domErrors.push({
          type: 'removeChild_exception',
          timestamp: new Date().toISOString(),
          error: error.message,
          stack: error.stack,
        });
        
        throw error;
      }
    };
    
    // 监控全局错误
    window.addEventListener('error', (event) => {
      if (event.message && event.message.includes('removeChild')) {
        logger.error('❌ Global removeChild Error:', {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack,
        });
        
        debugData.domErrors.push({
          type: 'global_removeChild_error',
          timestamp: new Date().toISOString(),
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack,
        });
      }
    });
    
    logger.success('✅ DOM error monitoring enabled');
  }
  
  // ==================== 场景词提交监控 ====================
  if (CONFIG.trackVideoGeneration) {
    // 监控表单提交
    document.addEventListener('submit', (event) => {
      const form = event.target;
      if (form.tagName === 'FORM') {
        // 检查是否是视频生成表单
        const textarea = form.querySelector('textarea');
        if (textarea) {
          const prompt = textarea.value;
          
          logger.log('📝 Form Submission Detected:', {
            prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
            promptLength: prompt.length,
            formAction: form.action,
            currentUrl: window.location.href,
          });
          
          debugData.sceneWordSubmissions.push({
            timestamp: new Date().toISOString(),
            prompt: prompt.substring(0, 200), // 只保存前200字符
            promptLength: prompt.length,
            formAction: form.action,
            currentUrl: window.location.href,
            type: 'form_submit',
          });
          
          // 检查是否是场景词（通常包含特定格式）
          if (prompt.includes('Create a professional') || prompt.length > 50) {
            logger.log('🎬 Scene word detected, monitoring video generation...');
          }
        }
      }
    }, true);
    
    // 监控按钮点击（可能是通过按钮触发表单提交）
    document.addEventListener('click', (event) => {
      const target = event.target;
      if (target && (target.tagName === 'BUTTON' || target.closest('button'))) {
        const button = target.tagName === 'BUTTON' ? target : target.closest('button');
        const buttonText = button.textContent || '';
        
        // 检查是否是生成视频按钮
        if (buttonText.includes('Generate') || buttonText.includes('生成') || buttonText.includes('Start')) {
          const form = button.closest('form');
          if (form) {
            const textarea = form.querySelector('textarea');
            if (textarea) {
              const prompt = textarea.value;
              logger.log('🖱️ Generate Button Clicked:', {
                buttonText: buttonText.trim(),
                prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
                promptLength: prompt.length,
                currentUrl: window.location.href,
              });
              
              debugData.sceneWordSubmissions.push({
                timestamp: new Date().toISOString(),
                prompt: prompt.substring(0, 200),
                promptLength: prompt.length,
                currentUrl: window.location.href,
                type: 'button_click',
                buttonText: buttonText.trim(),
              });
            }
          }
        }
      }
    }, true);
    
    // 监控 URL 参数变化（场景词页面通过 router.push 导航到 /video?prompt=...）
    let lastUrl = window.location.href;
    const urlCheckInterval = setInterval(() => {
      const currentUrl = window.location.href;
      if (currentUrl !== lastUrl) {
        const urlObj = new URL(currentUrl);
        const promptParam = urlObj.searchParams.get('prompt');
        
        if (promptParam) {
          const decodedPrompt = decodeURIComponent(promptParam);
          logger.log('🔗 URL Navigation with Prompt Detected:', {
            url: currentUrl,
            prompt: decodedPrompt.substring(0, 100) + (decodedPrompt.length > 100 ? '...' : ''),
            promptLength: decodedPrompt.length,
            fromUrl: lastUrl,
          });
          
          debugData.sceneWordSubmissions.push({
            timestamp: new Date().toISOString(),
            prompt: decodedPrompt.substring(0, 200),
            promptLength: decodedPrompt.length,
            currentUrl: currentUrl,
            fromUrl: lastUrl,
            type: 'url_navigation',
          });
          
          // 如果导航到 /video 页面，等待一下然后检查是否有表单
          if (urlObj.pathname === '/video') {
            setTimeout(() => {
              const videoForm = document.querySelector('form');
              const videoTextarea = document.querySelector('textarea');
              if (videoForm && videoTextarea) {
                logger.log('✅ Video page form detected, prompt should be pre-filled');
                logger.log('   Waiting for user to click Generate button...');
              } else {
                logger.warn('⚠️ Video page loaded but form not found yet');
              }
            }, 1000);
          }
        }
        
        lastUrl = currentUrl;
      }
    }, 500);
    
    // 监控页面加载完成后的 prompt 参数
    if (window.location.search.includes('prompt=')) {
      const urlObj = new URL(window.location.href);
      const promptParam = urlObj.searchParams.get('prompt');
      if (promptParam) {
        const decodedPrompt = decodeURIComponent(promptParam);
        logger.log('🔗 Page loaded with prompt parameter:', {
          prompt: decodedPrompt.substring(0, 100) + (decodedPrompt.length > 100 ? '...' : ''),
          promptLength: decodedPrompt.length,
          pathname: urlObj.pathname,
        });
        
        debugData.sceneWordSubmissions.push({
          timestamp: new Date().toISOString(),
          prompt: decodedPrompt.substring(0, 200),
          promptLength: decodedPrompt.length,
          currentUrl: window.location.href,
          type: 'page_load_with_prompt',
        });
      }
    }
    
    logger.success('✅ Form submission and navigation monitoring enabled');
  }
  
  // ==================== 积分刷新监控 ====================
  if (CONFIG.trackCredits) {
    // 监控积分显示元素的变化
    const creditObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          const target = mutation.target;
          
          // 检查是否是积分显示元素
          if (target.textContent && target.textContent.includes('Credits:')) {
            const creditsMatch = target.textContent.match(/Credits:\s*(\d+)/);
            if (creditsMatch) {
              const credits = parseInt(creditsMatch[1], 10);
              logger.log('💰 Credits display updated:', credits);
              
              debugData.creditUpdates.push({
                type: 'display_update',
                credits,
                timestamp: new Date().toISOString(),
              });
            }
          }
        }
      });
    });
    
    // 开始观察整个文档
    creditObserver.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    
    // 监控页面刷新/导航
    let lastCreditsCheck = Date.now();
    const creditsCheckInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastCheck = now - lastCreditsCheck;
      
      // 检查是否有积分相关的API调用
      const recentCreditCalls = debugData.networkRequests.filter(req => {
        return req.url.includes('/api/stats') && 
               new Date(req.timestamp).getTime() > (now - 10000); // 最近10秒
      });
      
      if (recentCreditCalls.length === 0 && timeSinceLastCheck > 30000) {
        logger.warn('⚠️ No credits refresh detected in the last 30 seconds');
        logger.warn('   This might indicate that credits are not being refreshed after video generation');
      }
      
      lastCreditsCheck = now;
    }, 30000);
    
    logger.success('✅ Credits monitoring enabled');
  }
  
  // ==================== 页面刷新监控 ====================
  // 监控router.push和window.location变化
  const originalPushState = window.history.pushState;
  const originalReplaceState = window.history.replaceState;
  
  window.history.pushState = function(...args) {
    const url = args[2];
    logger.log('🔄 History pushState:', url);
    
    // 检查是否是导航到视频页面
    if (url && url.includes('/video')) {
      const urlObj = new URL(url, window.location.origin);
      const promptParam = urlObj.searchParams.get('prompt');
      if (promptParam) {
        const decodedPrompt = decodeURIComponent(promptParam);
        logger.log('🎬 Navigation to video page with prompt:', {
          url: url,
          prompt: decodedPrompt.substring(0, 100) + (decodedPrompt.length > 100 ? '...' : ''),
          promptLength: decodedPrompt.length,
        });
      }
    }
    
    debugData.refreshAttempts.push({
      type: 'pushState',
      url: url,
      timestamp: new Date().toISOString(),
    });
    return originalPushState.apply(this, args);
  };
  
  window.history.replaceState = function(...args) {
    const url = args[2];
    logger.verbose('🔄 History replaceState:', url);
    
    debugData.refreshAttempts.push({
      type: 'replaceState',
      url: url,
      timestamp: new Date().toISOString(),
    });
    return originalReplaceState.apply(this, args);
  };
  
  // 监控 window.location 的变化（某些情况下可能直接使用 window.location.href）
  let locationHrefDescriptor = Object.getOwnPropertyDescriptor(window, 'location') || 
                                Object.getOwnPropertyDescriptor(Object.getPrototypeOf(window), 'location');
  
  if (locationHrefDescriptor && locationHrefDescriptor.set) {
    const originalLocationSetter = locationHrefDescriptor.set;
    Object.defineProperty(window, 'location', {
      set: function(value) {
        if (value && typeof value === 'string' && value.includes('/video')) {
          const urlObj = new URL(value, window.location.origin);
          const promptParam = urlObj.searchParams.get('prompt');
          if (promptParam) {
            logger.log('🔗 window.location change to video page:', {
              url: value,
              prompt: decodeURIComponent(promptParam).substring(0, 100),
            });
          }
        }
        return originalLocationSetter.call(window, value);
      },
      get: locationHrefDescriptor.get,
      configurable: true,
    });
  }
  
  // ==================== 报告功能 ====================
  window.getSceneVideoDebugReport = function() {
    const report = {
      summary: {
        totalVideoGenerations: debugData.videoGenerations.length,
        successfulGenerations: debugData.videoGenerations.filter(g => g.success).length,
        failedGenerations: debugData.videoGenerations.filter(g => !g.success).length,
        totalCreditUpdates: debugData.creditUpdates.length,
        totalDOMErrors: debugData.domErrors.length,
        totalSceneWordSubmissions: debugData.sceneWordSubmissions.length,
        totalErrors: debugData.errors.length,
      },
      recentVideoGenerations: debugData.videoGenerations.slice(-5),
      recentCreditUpdates: debugData.creditUpdates.slice(-5),
      recentDOMErrors: debugData.domErrors.slice(-5),
      recentSceneWordSubmissions: debugData.sceneWordSubmissions.slice(-5),
      recentErrors: debugData.errors.slice(-5),
      allData: debugData,
    };
    
    console.log('%c[SceneVideoDebug] 📊 Debug Report', 'color: #2196F3; font-weight: bold; font-size: 16px;');
    console.table(report.summary);
    console.log('Full report:', report);
    
    return report;
  };
  
  // ==================== 诊断功能 ====================
  window.diagnoseSceneVideoIssue = function() {
    logger.log('🔍 Running diagnostics...');
    
    const issues = [];
    
    // 检查场景词提交
    const sceneWordSubmissions = debugData.sceneWordSubmissions;
    if (sceneWordSubmissions.length > 0) {
      logger.log(`📝 Found ${sceneWordSubmissions.length} scene word submission(s)`);
      
      const lastSubmission = sceneWordSubmissions[sceneWordSubmissions.length - 1];
      logger.log('   Last submission:', {
        type: lastSubmission.type,
        promptLength: lastSubmission.promptLength,
        timestamp: lastSubmission.timestamp,
      });
      
      // 检查是否导航到了视频页面
      const urlNavigations = sceneWordSubmissions.filter(s => 
        s.type === 'url_navigation' || s.type === 'page_load_with_prompt'
      );
      
      if (urlNavigations.length > 0) {
        logger.log(`   ✅ ${urlNavigations.length} navigation(s) to video page detected`);
      } else {
        issues.push({
          type: 'no_navigation_to_video_page',
          severity: 'high',
          message: 'Scene word submitted but no navigation to /video page detected',
          details: {
            submissions: sceneWordSubmissions,
            suggestion: 'Check if router.push is working correctly',
          },
        });
      }
    } else {
      issues.push({
        type: 'no_scene_word_submissions',
        severity: 'medium',
        message: 'No scene word submissions detected',
        suggestion: 'Try submitting a scene word from a use case page',
      });
    }
    
    // 检查最近的视频生成
    const recentGenerations = debugData.videoGenerations.slice(-3);
    if (recentGenerations.length > 0) {
      logger.log(`🎬 Found ${recentGenerations.length} video generation attempt(s)`);
      
      const lastGeneration = recentGenerations[recentGenerations.length - 1];
      
      if (!lastGeneration.success) {
        issues.push({
          type: 'video_generation_failed',
          severity: 'high',
          message: `Last video generation failed: ${lastGeneration.error}`,
          details: lastGeneration,
        });
      } else {
        logger.success('   ✅ Last video generation succeeded');
      }
      
      // 检查是否有积分不足
      if (lastGeneration.error && lastGeneration.error.includes('credits')) {
        issues.push({
          type: 'insufficient_credits',
          severity: 'high',
          message: 'Insufficient credits detected',
          details: lastGeneration,
        });
      }
      
      // 检查是否有 prompt 匹配
      if (sceneWordSubmissions.length > 0 && lastGeneration.requestPrompt) {
        const lastSubmissionPrompt = sceneWordSubmissions[sceneWordSubmissions.length - 1].prompt;
        const generationPrompt = lastGeneration.requestPrompt;
        
        if (lastSubmissionPrompt && generationPrompt && 
            lastSubmissionPrompt.substring(0, 50) === generationPrompt.substring(0, 50)) {
          logger.success('   ✅ Prompt matches between submission and generation');
        } else {
          logger.warn('   ⚠️ Prompt mismatch between submission and generation');
        }
      }
    } else {
      if (sceneWordSubmissions.length > 0) {
        issues.push({
          type: 'scene_word_submitted_but_no_generation',
          severity: 'high',
          message: 'Scene word was submitted but no video generation request was made',
          details: {
            submissions: sceneWordSubmissions,
            possibleCauses: [
              'User navigated to /video page but did not click Generate button',
              'Form validation failed silently',
              'JavaScript error prevented form submission',
            ],
          },
        });
      } else {
        issues.push({
          type: 'no_generation_attempts',
          severity: 'medium',
          message: 'No video generation attempts detected',
          suggestion: 'Try generating a video from the /video page',
        });
      }
    }
    
    // 检查积分刷新
    const recentCreditUpdates = debugData.creditUpdates.filter(update => {
      const updateTime = new Date(update.timestamp).getTime();
      return Date.now() - updateTime < 60000; // 最近1分钟
    });
    
    if (recentCreditUpdates.length === 0 && recentGenerations.length > 0) {
      const lastGeneration = recentGenerations[recentGenerations.length - 1];
      const generationTime = new Date(lastGeneration.timestamp).getTime();
      const timeSinceGeneration = Date.now() - generationTime;
      
      if (timeSinceGeneration > 5000) { // 超过5秒还没刷新
        issues.push({
          type: 'credits_not_refreshed',
          severity: 'high',
          message: `Credits were not refreshed after video generation (${Math.round(timeSinceGeneration/1000)}s ago)`,
          details: {
            lastGeneration: lastGeneration,
            creditUpdates: debugData.creditUpdates.slice(-5),
            suggestion: 'Check if /api/stats is being called after successful generation',
          },
        });
      } else {
        logger.log('   ⏳ Credits refresh may be delayed, waiting...');
      }
    } else if (recentCreditUpdates.length > 0) {
      logger.success(`   ✅ ${recentCreditUpdates.length} credit update(s) detected`);
    }
    
    // 检查DOM错误
    if (debugData.domErrors.length > 0) {
      issues.push({
        type: 'dom_errors',
        severity: 'medium',
        message: `${debugData.domErrors.length} DOM errors detected`,
        details: debugData.domErrors.slice(-3),
      });
    }
    
    // 检查当前页面状态
    const currentUrl = window.location.href;
    const urlObj = new URL(currentUrl);
    const promptParam = urlObj.searchParams.get('prompt');
    
    if (urlObj.pathname === '/video') {
      logger.log('📍 Currently on /video page');
      if (promptParam) {
        logger.log('   ✅ Prompt parameter found in URL');
        const decodedPrompt = decodeURIComponent(promptParam);
        logger.log(`   Prompt: ${decodedPrompt.substring(0, 100)}${decodedPrompt.length > 100 ? '...' : ''}`);
        
        // 检查表单是否已填充
        setTimeout(() => {
          const textarea = document.querySelector('textarea');
          if (textarea && textarea.value) {
            logger.success('   ✅ Form textarea is filled');
          } else {
            logger.warn('   ⚠️ Form textarea is empty (may need to wait for React to update)');
          }
        }, 500);
      } else {
        logger.log('   ℹ️ No prompt parameter in URL');
      }
    } else {
      logger.log(`📍 Currently on ${urlObj.pathname} page`);
      if (urlObj.pathname.includes('use-case') || urlObj.pathname.includes('keyword')) {
        logger.log('   ℹ️ On a scene word page, should submit to navigate to /video');
      }
    }
    
    // 输出诊断结果
    if (issues.length > 0) {
      logger.warn(`⚠️ ${issues.length} issue(s) detected:`);
      issues.forEach((issue, index) => {
        console.group(`Issue ${index + 1}: ${issue.type} (${issue.severity})`);
        console.log('Message:', issue.message);
        if (issue.suggestion) {
          console.log('Suggestion:', issue.suggestion);
        }
        if (issue.details) {
          console.log('Details:', issue.details);
        }
        console.groupEnd();
      });
    } else {
      logger.success('✅ No issues detected');
    }
    
    return issues;
  };
  
  // ==================== 清理功能 ====================
  window.clearSceneVideoDebugData = function() {
    debugData.videoGenerations = [];
    debugData.creditUpdates = [];
    debugData.networkRequests = [];
    debugData.domErrors = [];
    debugData.sceneWordSubmissions = [];
    debugData.refreshAttempts = [];
    debugData.errors = [];
    logger.success('✅ Debug data cleared');
  };
  
  // ==================== 初始化完成 ====================
  logger.success('✅ 场景词视频生成调试脚本初始化完成');
  logger.log('可用命令:');
  logger.log('  - getSceneVideoDebugReport() - 获取完整调试报告');
  logger.log('  - diagnoseSceneVideoIssue() - 诊断问题');
  logger.log('  - clearSceneVideoDebugData() - 清除调试数据');
  
  // 自动运行一次诊断（延迟5秒，等待页面加载）
  setTimeout(() => {
    logger.log('🔍 Running initial diagnostics...');
    window.diagnoseSceneVideoIssue();
  }, 5000);
  
})();

