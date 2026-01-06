// ============================================
// 使用场景查询超时调试 - 粘贴到浏览器控制台运行
// ============================================

console.log('%c🔍 使用场景查询超时调试工具', 'font-size: 18px; font-weight: bold; color: #00d4ff;');
console.log('开始诊断使用场景列表查询超时问题...\n');

// 1. 检查当前页面状态
console.log('📋 1. 页面状态检查:');
console.log('   - URL:', window.location.href);
console.log('   - 当前时间:', new Date().toLocaleString());
console.log('   - 用户代理:', navigator.userAgent.substring(0, 50) + '...');

// 2. 测试API端点（带性能监控）
async function testUseCasesAPI(params = {}) {
  console.log('\n📤 2. 测试使用场景API:');
  
  const defaultParams = {
    limit: 50,
    offset: 0,
    type: 'all',
    industry: 'all',
    status: 'all',
    quality_status: 'all',
    search: '',
    ...params
  };
  
  const queryString = new URLSearchParams(
    Object.entries(defaultParams)
      .filter(([_, v]) => v !== 'all' && v !== '')
      .map(([k, v]) => [k, String(v)])
  ).toString();
  
  const url = `/api/admin/use-cases?${queryString}`;
  console.log('   - 请求URL:', url);
  console.log('   - 请求参数:', defaultParams);
  
  const startTime = performance.now();
  let requestId = null;
  
  try {
    // 创建AbortController用于超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn('   ⚠️ 请求超时（30秒），正在取消...');
      controller.abort();
    }, 30000);
    
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    clearTimeout(timeoutId);
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log(`   ⏱️ 请求耗时: ${duration.toFixed(2)}ms (${(duration / 1000).toFixed(2)}秒)`);
    console.log('   - 响应状态:', response.status, response.statusText);
    console.log('   - 响应头:', Object.fromEntries(response.headers.entries()));
    
    const contentType = response.headers.get('content-type');
    console.log('   - Content-Type:', contentType);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('   ❌ 请求失败:');
      try {
        const errorJson = JSON.parse(errorText);
        console.error('   - 错误信息:', errorJson);
        return { success: false, error: errorJson, duration };
      } catch {
        console.error('   - 错误文本:', errorText.substring(0, 500));
        return { success: false, error: { message: errorText }, duration };
      }
    }
    
    const data = await response.json();
    console.log('   ✅ 请求成功:');
    console.log('   - 返回数据:', {
      success: data.success,
      count: data.count,
      totalCount: data.totalCount,
      limit: data.limit,
      offset: data.offset,
      useCasesLength: Array.isArray(data.useCases) ? data.useCases.length : 0
    });
    
    if (Array.isArray(data.useCases) && data.useCases.length > 0) {
      console.log('   - 第一条记录示例:', {
        id: data.useCases[0].id,
        slug: data.useCases[0].slug,
        title: data.useCases[0].title?.substring(0, 50),
        use_case_type: data.useCases[0].use_case_type,
        industry: data.useCases[0].industry
      });
    }
    
    return { success: true, data, duration };
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.error('   ❌ 请求异常:');
    console.error('   - 错误类型:', error.name);
    console.error('   - 错误消息:', error.message);
    console.error('   - 错误堆栈:', error.stack);
    console.error(`   - 失败耗时: ${duration.toFixed(2)}ms`);
    
    if (error.name === 'AbortError') {
      console.error('   ⚠️ 请求被取消（可能是超时）');
    }
    
    return { success: false, error: { name: error.name, message: error.message }, duration };
  }
}

// 3. 测试不同查询场景
async function testDifferentScenarios() {
  console.log('\n🧪 3. 测试不同查询场景:');
  
  const scenarios = [
    { name: '基础查询（无过滤）', params: { limit: 10, offset: 0 } },
    { name: '小批量查询', params: { limit: 5, offset: 0 } },
    { name: '大批量查询', params: { limit: 100, offset: 0 } },
    { name: '带类型过滤', params: { limit: 10, type: 'video' } },
    { name: '带行业过滤', params: { limit: 10, industry: 'technology' } },
    { name: '带状态过滤', params: { limit: 10, status: 'published' } },
    { name: '带搜索查询', params: { limit: 10, search: 'test' } },
  ];
  
  const results = [];
  
  for (const scenario of scenarios) {
    console.log(`\n   📝 测试: ${scenario.name}`);
    const result = await testUseCasesAPI(scenario.params);
    results.push({ ...scenario, result });
    
    // 避免请求过快
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n   📊 测试结果汇总:');
  results.forEach(({ name, result }) => {
    const status = result.success ? '✅' : '❌';
    const duration = result.duration ? `${(result.duration / 1000).toFixed(2)}s` : 'N/A';
    console.log(`   ${status} ${name}: ${duration}`);
    if (!result.success && result.error) {
      console.log(`      └─ 错误: ${result.error.message || result.error.details || '未知错误'}`);
    }
  });
  
  return results;
}

// 4. 监控网络请求
function monitorNetworkRequests() {
  console.log('\n🌐 4. 启动网络请求监控:');
  
  const originalFetch = window.fetch;
  let requestCount = 0;
  const requests = [];
  
  window.fetch = function(...args) {
    const url = args[0];
    const options = args[1] || {};
    
    if (typeof url === 'string' && url.includes('/api/admin/use-cases')) {
      requestCount++;
      const requestId = requestCount;
      const startTime = performance.now();
      
      console.log(`\n   📡 请求 #${requestId}:`, {
        url,
        method: options.method || 'GET',
        timestamp: new Date().toISOString()
      });
      
      const requestInfo = {
        id: requestId,
        url,
        method: options.method || 'GET',
        startTime,
        status: 'pending'
      };
      requests.push(requestInfo);
      
      return originalFetch.apply(this, args).then(async (response) => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        requestInfo.endTime = endTime;
        requestInfo.duration = duration;
        requestInfo.status = response.status;
        requestInfo.statusText = response.statusText;
        
        console.log(`   ✅ 响应 #${requestId}:`, {
          status: response.status,
          statusText: response.statusText,
          duration: `${duration.toFixed(2)}ms`,
          contentType: response.headers.get('content-type')
        });
        
        if (!response.ok) {
          const errorText = await response.clone().text();
          try {
            const errorJson = JSON.parse(errorText);
            console.error(`   ❌ 错误详情 #${requestId}:`, errorJson);
            requestInfo.error = errorJson;
          } catch {
            requestInfo.error = { message: errorText.substring(0, 200) };
          }
        } else {
          const data = await response.clone().json();
          requestInfo.dataSize = JSON.stringify(data).length;
          if (Array.isArray(data.useCases)) {
            requestInfo.recordCount = data.useCases.length;
          }
        }
        
        return response;
      }).catch((error) => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        requestInfo.endTime = endTime;
        requestInfo.duration = duration;
        requestInfo.status = 'error';
        requestInfo.error = { name: error.name, message: error.message };
        
        console.error(`   ❌ 请求失败 #${requestId}:`, error);
        throw error;
      });
    }
    
    return originalFetch.apply(this, args);
  };
  
  console.log('   ✅ 网络监控已启动');
  console.log('   💡 所有 /api/admin/use-cases 请求将被监控');
  
  // 提供查看请求历史的方法
  window.getUseCasesRequests = () => {
    console.log('\n📊 请求历史:');
    requests.forEach(req => {
      console.log(`   #${req.id}: ${req.method} ${req.url}`);
      console.log(`     状态: ${req.status}, 耗时: ${req.duration ? `${req.duration.toFixed(2)}ms` : 'N/A'}`);
      if (req.error) {
        console.log(`     错误: ${req.error.message || JSON.stringify(req.error)}`);
      }
    });
    return requests;
  };
  
  return { requests, stop: () => { window.fetch = originalFetch; } };
}

// 5. 检查数据库连接状态
async function checkDatabaseConnection() {
  console.log('\n🔌 5. 检查数据库连接:');
  
  try {
    // 尝试一个简单的API调用
    const response = await fetch('/api/admin/use-cases?limit=1&offset=0', {
      method: 'GET',
      signal: AbortSignal.timeout(5000) // 5秒超时
    });
    
    if (response.ok) {
      console.log('   ✅ 数据库连接正常');
      const data = await response.json();
      console.log('   - 可以获取数据:', !!data.useCases);
    } else {
      console.warn('   ⚠️ 数据库连接可能有问题');
      console.warn('   - 状态码:', response.status);
    }
  } catch (error) {
    console.error('   ❌ 数据库连接检查失败:');
    console.error('   - 错误:', error.message);
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      console.error('   ⚠️ 连接超时，可能是数据库响应慢或网络问题');
    }
  }
}

// 6. 提供快速测试函数
window.testUseCasesAPI = testUseCasesAPI;
window.testUseCasesScenarios = testDifferentScenarios;
window.checkUseCasesDB = checkDatabaseConnection;

console.log('\n✅ 调试工具已加载！');
console.log('📝 可用函数:');
console.log('   1. testUseCasesAPI(params) - 测试API调用');
console.log('     示例: testUseCasesAPI({ limit: 10, type: "video" })');
console.log('   2. testUseCasesScenarios() - 测试多个场景');
console.log('   3. checkUseCasesDB() - 检查数据库连接');
console.log('   4. getUseCasesRequests() - 查看请求历史（需要先启动监控）');
console.log('\n💡 提示:');
console.log('   - 如果看到超时错误，可能是数据库查询太慢');
console.log('   - 尝试减少 limit 参数或添加更多过滤条件');
console.log('   - 检查数据库索引是否优化');

// 自动启动监控
const monitor = monitorNetworkRequests();

// 执行初始检查
checkDatabaseConnection().then(() => {
  console.log('\n🚀 开始基础测试...');
  return testUseCasesAPI({ limit: 10, offset: 0 });
}).then(result => {
  if (result.success) {
    console.log('\n✅ 基础测试通过！');
  } else {
    console.log('\n❌ 基础测试失败，请查看上面的错误信息');
  }
}).catch(err => {
  console.error('\n❌ 测试过程出错:', err);
});

