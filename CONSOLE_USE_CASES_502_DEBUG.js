// ============================================
// 21万场景词不显示/乱码问题诊断工具
// 粘贴到浏览器控制台运行
// ============================================

console.log('%c🔍 21万场景词问题诊断工具', 'font-size: 18px; font-weight: bold; color: #00d4ff;');
console.log('开始诊断场景词不显示和乱码问题...\n');

// 1. 检查页面编码和字符集
console.log('📋 1. 页面编码检查:');
console.log('   - Document Charset:', document.characterSet || document.charset);
console.log('   - Document Encoding:', document.inputEncoding || 'unknown');
console.log('   - Meta Charset:', document.querySelector('meta[charset]')?.getAttribute('charset') || '未找到');
console.log('   - HTML Lang:', document.documentElement.lang || '未设置');

// 2. 测试 /api/use-cases API（带详细诊断）
async function testUseCasesAPI(params = {}) {
  console.log('\n📤 2. 测试 /api/use-cases API:');
  
  const defaultParams = {
    page: 1,
    limit: 24,
    type: 'all',
    industry: 'all',
    q: '',
    ...params
  };
  
  const queryString = new URLSearchParams(
    Object.entries(defaultParams)
      .filter(([_, v]) => v !== 'all' && v !== '')
      .map(([k, v]) => [k, String(v)])
  ).toString();
  
  const url = `/api/use-cases?${queryString}`;
  console.log('   - 请求URL:', url);
  console.log('   - 请求参数:', defaultParams);
  
  const startTime = performance.now();
  
  try {
    // 创建AbortController用于超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn('   ⚠️ 请求超时（25秒），正在取消...');
      controller.abort();
    }, 25000);
    
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Accept-Charset': 'utf-8',
      }
    });
    
    clearTimeout(timeoutId);
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log(`   ⏱️ 请求耗时: ${duration.toFixed(2)}ms (${(duration / 1000).toFixed(2)}秒)`);
    console.log('   - 响应状态:', response.status, response.statusText);
    
    // 检查响应头
    const headers = Object.fromEntries(response.headers.entries());
    console.log('   - 响应头:', headers);
    
    const contentType = response.headers.get('content-type');
    console.log('   - Content-Type:', contentType);
    
    // 检查编码
    if (contentType) {
      const hasCharset = contentType.includes('charset');
      const hasUtf8 = contentType.toLowerCase().includes('utf-8');
      console.log('   - 编码检查:', {
        '有charset声明': hasCharset,
        'UTF-8编码': hasUtf8,
        '状态': hasCharset && hasUtf8 ? '✅ 正确' : '⚠️ 可能有问题'
      });
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('   ❌ 请求失败:');
      console.error('   - 状态码:', response.status);
      
      // 检查响应文本编码
      try {
        // 尝试检测编码
        const textBytes = new TextEncoder().encode(errorText);
        const decoder = new TextDecoder('utf-8', { fatal: true });
        try {
          decoder.decode(textBytes);
          console.log('   - 响应文本编码: ✅ UTF-8');
        } catch {
          console.warn('   - 响应文本编码: ⚠️ 可能不是UTF-8');
        }
      } catch (e) {
        console.warn('   - 编码检测失败:', e);
      }
      
      try {
        const errorJson = JSON.parse(errorText);
        console.error('   - 错误信息:', errorJson);
        
        // 检查错误信息中的中文是否乱码
        if (errorJson.details || errorJson.error) {
          const errorMsg = (errorJson.details || errorJson.error || '').toString();
          const hasChinese = /[\u4e00-\u9fa5]/.test(errorMsg);
          const looksGarbled = /[^\x00-\x7F]/.test(errorMsg) && !hasChinese;
          console.log('   - 错误信息编码检查:', {
            '包含中文': hasChinese,
            '可能乱码': looksGarbled,
            '状态': hasChinese ? '✅ 正常' : looksGarbled ? '❌ 乱码' : '⚠️ 无中文'
          });
        }
        
        return { success: false, error: errorJson, duration, status: response.status };
      } catch {
        console.error('   - 错误文本（前500字符）:', errorText.substring(0, 500));
        
        // 检查文本是否乱码
        const hasChinese = /[\u4e00-\u9fa5]/.test(errorText);
        const looksGarbled = /[^\x00-\x7F]/.test(errorText) && !hasChinese;
        console.log('   - 文本编码检查:', {
          '包含中文': hasChinese,
          '可能乱码': looksGarbled,
          '状态': hasChinese ? '✅ 正常' : looksGarbled ? '❌ 乱码' : '⚠️ 无中文'
        });
        
        return { success: false, error: { message: errorText }, duration, status: response.status };
      }
    }
    
    // 成功响应
    const responseText = await response.text();
    
    // 检查响应文本编码
    try {
      const textBytes = new TextEncoder().encode(responseText);
      const decoder = new TextDecoder('utf-8', { fatal: true });
      decoder.decode(textBytes);
      console.log('   - 响应文本编码: ✅ UTF-8');
    } catch {
      console.warn('   - 响应文本编码: ⚠️ 可能不是UTF-8');
    }
    
    const data = JSON.parse(responseText);
    console.log('   ✅ 请求成功:');
    console.log('   - 返回数据:', {
      success: data.success,
      totalCount: data.totalCount,
      page: data.page,
      limit: data.limit,
      hasMore: data.hasMore,
      itemsLength: Array.isArray(data.items) ? data.items.length : 0
    });
    
    if (Array.isArray(data.items) && data.items.length > 0) {
      const firstItem = data.items[0];
      console.log('   - 第一条记录示例:', {
        id: firstItem.id,
        slug: firstItem.slug,
        title: firstItem.title?.substring(0, 50),
        description: firstItem.description?.substring(0, 50),
        use_case_type: firstItem.use_case_type,
        industry: firstItem.industry
      });
      
      // 检查数据中的中文是否乱码
      const title = (firstItem.title || '').toString();
      const desc = (firstItem.description || '').toString();
      const hasChineseInTitle = /[\u4e00-\u9fa5]/.test(title);
      const hasChineseInDesc = /[\u4e00-\u9fa5]/.test(desc);
      const looksGarbledTitle = /[^\x00-\x7F]/.test(title) && !hasChineseInTitle;
      const looksGarbledDesc = /[^\x00-\x7F]/.test(desc) && !hasChineseInDesc;
      
      console.log('   - 数据编码检查:');
      console.log('     Title:', {
        '包含中文': hasChineseInTitle,
        '可能乱码': looksGarbledTitle,
        '状态': hasChineseInTitle ? '✅ 正常' : looksGarbledTitle ? '❌ 乱码' : '⚠️ 无中文'
      });
      console.log('     Description:', {
        '包含中文': hasChineseInDesc,
        '可能乱码': looksGarbledDesc,
        '状态': hasChineseInDesc ? '✅ 正常' : looksGarbledDesc ? '❌ 乱码' : '⚠️ 无中文'
      });
      
      // 显示实际内容（用于肉眼检查）
      console.log('   - 实际内容预览:');
      console.log('     Title:', title.substring(0, 100));
      console.log('     Description:', desc.substring(0, 100));
    } else {
      console.warn('   ⚠️ 返回的数据为空数组');
    }
    
    return { success: true, data, duration };
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.error('   ❌ 请求异常:');
    console.error('   - 错误类型:', error.name);
    console.error('   - 错误消息:', error.message);
    console.error(`   - 失败耗时: ${duration.toFixed(2)}ms`);
    
    if (error.name === 'AbortError') {
      console.error('   ⚠️ 请求被取消（可能是超时）');
      console.error('   💡 建议: 查询21万条数据可能太慢，尝试减少limit或添加过滤条件');
    }
    
    return { success: false, error: { name: error.name, message: error.message }, duration };
  }
}

// 3. 测试不同查询场景
async function testDifferentScenarios() {
  console.log('\n🧪 3. 测试不同查询场景:');
  
  const scenarios = [
    { name: '基础查询（小批量）', params: { page: 1, limit: 10 } },
    { name: '默认查询', params: { page: 1, limit: 24 } },
    { name: '第二页', params: { page: 2, limit: 24 } },
    { name: '带类型过滤', params: { page: 1, limit: 24, type: 'advertising-promotion' } },
    { name: '带行业过滤', params: { page: 1, limit: 24, industry: 'E-commerce Stores' } },
    { name: '带搜索查询', params: { page: 1, limit: 24, q: 'video' } },
    { name: '中文搜索', params: { page: 1, limit: 24, q: '视频' } },
  ];
  
  const results = [];
  
  for (const scenario of scenarios) {
    console.log(`\n   📝 测试: ${scenario.name}`);
    const result = await testUseCasesAPI(scenario.params);
    results.push({ ...scenario, result });
    
    // 避免请求过快
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n   📊 测试结果汇总:');
  results.forEach(({ name, result }) => {
    const status = result.success ? '✅' : '❌';
    const duration = result.duration ? `${(result.duration / 1000).toFixed(2)}s` : 'N/A';
    const httpStatus = result.status ? ` (HTTP ${result.status})` : '';
    console.log(`   ${status} ${name}: ${duration}${httpStatus}`);
    if (!result.success && result.error) {
      const errorMsg = result.error.message || result.error.details || '未知错误';
      console.log(`      └─ 错误: ${errorMsg}`);
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
    
    if (typeof url === 'string' && url.includes('/api/use-cases')) {
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
        requestInfo.contentType = response.headers.get('content-type');
        
        console.log(`   ✅ 响应 #${requestId}:`, {
          status: response.status,
          statusText: response.statusText,
          duration: `${duration.toFixed(2)}ms`,
          contentType: requestInfo.contentType
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
          if (Array.isArray(data.items)) {
            requestInfo.recordCount = data.items.length;
            requestInfo.totalCount = data.totalCount;
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
  console.log('   💡 所有 /api/use-cases 请求将被监控');
  
  // 提供查看请求历史的方法
  window.getUseCasesRequests = () => {
    console.log('\n📊 请求历史:');
    requests.forEach(req => {
      console.log(`   #${req.id}: ${req.method} ${req.url}`);
      console.log(`     状态: ${req.status}, 耗时: ${req.duration ? `${req.duration.toFixed(2)}ms` : 'N/A'}`);
      if (req.error) {
        console.log(`     错误: ${req.error.message || JSON.stringify(req.error)}`);
      }
      if (req.recordCount !== undefined) {
        console.log(`     记录数: ${req.recordCount}, 总数: ${req.totalCount || 'N/A'}`);
      }
    });
    return requests;
  };
  
  return { requests, stop: () => { window.fetch = originalFetch; } };
}

// 5. 检查当前页面状态
function checkPageState() {
  console.log('\n📄 5. 检查当前页面状态:');
  
  // 检查是否有加载中的状态
  const loadingElements = document.querySelectorAll('[class*="loading"], [class*="Loading"]');
  console.log('   - 加载中元素数量:', loadingElements.length);
  
  // 检查是否有错误显示
  const errorElements = document.querySelectorAll('[class*="error"], [class*="Error"]');
  console.log('   - 错误元素数量:', errorElements.length);
  
  // 检查use cases列表
  const useCasesList = document.querySelectorAll('[class*="use-case"], [class*="UseCase"]');
  console.log('   - Use Cases元素数量:', useCasesList.length);
  
  // 检查总数显示
  const totalCountElements = Array.from(document.querySelectorAll('*')).filter(el => {
    const text = el.textContent || '';
    return /215693|215,693|21万|21萬/i.test(text);
  });
  console.log('   - 显示总数的元素:', totalCountElements.length);
  if (totalCountElements.length > 0) {
    console.log('   - 总数文本:', totalCountElements[0].textContent?.substring(0, 100));
  }
}

// 6. 提供快速测试函数
window.testUseCasesAPI = testUseCasesAPI;
window.testUseCasesScenarios = testDifferentScenarios;
window.checkUseCasesPage = checkPageState;

console.log('\n✅ 调试工具已加载！');
console.log('📝 可用函数:');
console.log('   1. testUseCasesAPI(params) - 测试API调用');
console.log('     示例: testUseCasesAPI({ page: 1, limit: 24 })');
console.log('   2. testUseCasesScenarios() - 测试多个场景');
console.log('   3. checkUseCasesPage() - 检查页面状态');
console.log('   4. getUseCasesRequests() - 查看请求历史（需要先启动监控）');
console.log('\n💡 提示:');
console.log('   - 如果看到502错误，可能是查询超时（20秒限制）');
console.log('   - 如果看到乱码，检查Content-Type是否包含charset=utf-8');
console.log('   - 21万条数据查询可能很慢，建议添加索引或优化查询');

// 自动启动监控
const monitor = monitorNetworkRequests();

// 执行初始检查
checkPageState();
checkDatabaseConnection().then(() => {
  console.log('\n🚀 开始基础测试...');
  return testUseCasesAPI({ page: 1, limit: 10 });
}).then(result => {
  if (result.success) {
    console.log('\n✅ 基础测试通过！');
  } else {
    console.log('\n❌ 基础测试失败，请查看上面的错误信息');
    if (result.status === 502) {
      console.log('\n💡 502错误通常表示:');
      console.log('   1. 查询超时（20秒限制）');
      console.log('   2. 数据库连接问题');
      console.log('   3. 查询太复杂，需要优化');
    }
  }
}).catch(err => {
  console.error('\n❌ 测试过程出错:', err);
});

// 数据库连接检查（简化版）
async function checkDatabaseConnection() {
  console.log('\n🔌 6. 检查数据库连接:');
  
  try {
    const response = await fetch('/api/use-cases?page=1&limit=1', {
      method: 'GET',
      signal: AbortSignal.timeout(5000) // 5秒超时
    });
    
    if (response.ok) {
      console.log('   ✅ 数据库连接正常');
      const data = await response.json();
      console.log('   - 可以获取数据:', !!data.items);
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
