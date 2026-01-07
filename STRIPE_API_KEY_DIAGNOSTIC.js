/**
 * Stripe API Key 诊断脚本
 * 
 * 在浏览器控制台运行此脚本来检测 Stripe 配置问题
 * 
 * 使用方法：
 * 1. 打开浏览器开发者工具 (F12)
 * 2. 切换到 Console 标签
 * 3. 复制粘贴整个脚本并回车
 */

(async function stripeDiagnostic() {
  console.log('%c🔍 Stripe API Key 诊断开始', 'color: #1f75ff; font-size: 16px; font-weight: bold;');
  console.log('='.repeat(60));

  const results = {
    frontend: {},
    backend: {},
    recommendations: []
  };

  // 1. 检查前端认证状态
  console.log('\n📱 1. 检查前端认证状态...');
  try {
    // 尝试从 window 对象获取 Supabase 客户端（如果已初始化）
    let supabase = null;
    
    // 方法1: 检查是否有全局 Supabase 客户端
    if (window.supabase) {
      supabase = window.supabase;
    } else {
      // 方法2: 从 localStorage 读取 Supabase 配置
      const supabaseUrl = localStorage.getItem('sb-url') || 
                         document.querySelector('script[data-supabase-url]')?.dataset.supabaseUrl ||
                         window.__NEXT_DATA__?.env?.NEXT_PUBLIC_SUPABASE_URL;
      
      const supabaseKey = localStorage.getItem('sb-key') ||
                          document.querySelector('script[data-supabase-key]')?.dataset.supabaseKey ||
                          window.__NEXT_DATA__?.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (supabaseUrl && supabaseKey) {
        // 如果找到了配置，提示用户需要手动检查
        console.log('⚠️ 找到 Supabase 配置，但无法在控制台直接创建客户端');
        console.log('请检查浏览器 Network 标签中的认证请求');
      }
    }
    
    // 检查 localStorage 中的认证 token
    const authKeys = Object.keys(localStorage).filter(k => 
      k.includes('supabase') || k.includes('auth') || k.includes('sb-')
    );
    
    if (authKeys.length > 0) {
      console.log('✅ 找到认证相关存储:', authKeys.length, '个键');
      results.frontend.hasAuthStorage = true;
      results.frontend.authKeys = authKeys;
    } else {
      console.log('❌ 未找到认证存储');
      results.frontend.hasAuthStorage = false;
    }
    
    // 检查是否有 session
    const sessionKey = authKeys.find(k => k.includes('session') || k.includes('token'));
    if (sessionKey) {
      try {
        const sessionData = localStorage.getItem(sessionKey);
        if (sessionData) {
          console.log('✅ 找到 session 数据');
          results.frontend.hasSession = true;
        }
      } catch (e) {
        console.log('⚠️ 无法读取 session 数据');
      }
    }
    
    console.log('💡 提示: 如果看到 401 错误，请先登录');
    results.recommendations.push('如果 API 返回 401，请先登录后再测试');
    
  } catch (error) {
    console.error('❌ 检查认证状态失败:', error);
    results.frontend.error = error.message;
  }

  // 2. 测试创建 Checkout Session API
  console.log('\n💳 2. 测试创建 Checkout Session API...');
  try {
    const testPlanId = 'starter';
    console.log(`测试计划: ${testPlanId}`);

    // 获取认证 token（从 localStorage）
    let authToken = null;
    const authKeys = Object.keys(localStorage).filter(k => 
      k.includes('supabase') && (k.includes('token') || k.includes('access'))
    );
    
    if (authKeys.length > 0) {
      try {
        const tokenData = localStorage.getItem(authKeys[0]);
        if (tokenData) {
          const parsed = JSON.parse(tokenData);
          authToken = parsed?.access_token || parsed?.token;
        }
      } catch (e) {
        // 忽略解析错误
      }
    }

    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
      console.log('✅ 已添加认证头');
    } else {
      console.log('⚠️ 未找到认证 token，可能返回 401');
    }

    const response = await fetch('/api/payment/create-plan-checkout', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ planId: testPlanId }),
    });

    const data = await response.json();
    results.backend.status = response.status;
    results.backend.response = data;

    if (response.ok && data.success) {
      console.log('✅ API 调用成功!', {
        checkoutUrl: data.checkout_url,
        sessionId: data.session_id
      });
    } else {
      console.error('❌ API 调用失败:', {
        status: response.status,
        error: data.error,
        details: data.details,
        stripeErrorType: data.stripeErrorType,
        stripeErrorCode: data.stripeErrorCode
      });

      // 分析错误类型
      if (data.stripeErrorCode === 'api_key_expired') {
        console.error('%c🔴 Stripe API Key 已过期！', 'color: red; font-weight: bold;');
        results.recommendations.push('🔴 Stripe API Key 已过期！需要在 Vercel 环境变量中更新 STRIPE_SECRET_KEY');
      } else if (data.stripeErrorCode === 'api_key_invalid') {
        console.error('%c🔴 Stripe API Key 无效！', 'color: red; font-weight: bold;');
        results.recommendations.push('🔴 Stripe API Key 无效！请检查 Vercel 环境变量中的 STRIPE_SECRET_KEY 是否正确');
      } else if (response.status === 401) {
        console.error('%c🔴 认证失败！', 'color: red; font-weight: bold;');
        results.recommendations.push('🔴 认证失败！请先登录后再测试');
      } else if (response.status === 500) {
        console.error('%c🔴 服务器错误！', 'color: red; font-weight: bold;');
        results.recommendations.push('🔴 服务器错误！请检查 Vercel 日志获取详细信息');
      }
    }
  } catch (error) {
    console.error('❌ API 调用异常:', error);
    results.backend.error = error.message;
    results.recommendations.push('🔴 网络错误或 API 路由不存在');
  }

  // 3. 检查环境变量（仅前端可见的）
  console.log('\n🔧 3. 检查前端环境变量...');
  const envVars = {};
  
  // 从 window.__NEXT_DATA__ 获取环境变量（Next.js）
  if (window.__NEXT_DATA__?.env) {
    envVars.NEXT_PUBLIC_SUPABASE_URL = window.__NEXT_DATA__.env.NEXT_PUBLIC_SUPABASE_URL || '未设置';
    envVars.NEXT_PUBLIC_APP_URL = window.__NEXT_DATA__.env.NEXT_PUBLIC_APP_URL || window.location.origin;
  } else {
    envVars.NEXT_PUBLIC_SUPABASE_URL = '未找到（可能在生产环境）';
    envVars.NEXT_PUBLIC_APP_URL = window.location.origin;
  }
  
  console.log('前端环境变量:', envVars);
  results.frontend.envVars = envVars;

  // 4. 检查本地存储的认证信息
  console.log('\n💾 4. 检查本地存储...');
  try {
    const supabaseKeys = Object.keys(localStorage).filter(key => 
      key.includes('supabase') || key.includes('auth')
    );
    console.log('Supabase 相关键:', supabaseKeys.length > 0 ? supabaseKeys : '无');
    results.frontend.localStorageKeys = supabaseKeys;
  } catch (error) {
    console.error('检查本地存储失败:', error);
  }

  // 5. 生成诊断报告
  console.log('\n' + '='.repeat(60));
  console.log('%c📊 诊断报告', 'color: #1f75ff; font-size: 16px; font-weight: bold;');
  console.log('='.repeat(60));

  console.table({
    '前端认证': results.frontend.hasSession ? '✅ 已登录' : '❌ 未登录',
    'API 状态': results.backend.status === 200 ? '✅ 正常' : `❌ ${results.backend.status || '未知'}`,
    'Stripe 错误': results.backend.response?.stripeErrorCode || '无',
  });

  if (results.recommendations.length > 0) {
    console.log('\n💡 建议:');
    results.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
  }

  // 6. 提供修复步骤
  if (results.backend.response?.stripeErrorCode === 'api_key_expired') {
    console.log('\n' + '='.repeat(60));
    console.log('%c🔧 修复步骤 (Stripe API Key 已过期)', 'color: #ff6b6b; font-size: 14px; font-weight: bold;');
    console.log('='.repeat(60));
    console.log(`
1. 登录 Stripe Dashboard: https://dashboard.stripe.com/
2. 进入 Developers > API keys
3. 创建新的 Secret Key 或使用现有的有效密钥
4. 复制新的 Secret Key (以 sk_live_ 或 sk_test_ 开头)
5. 在 Vercel Dashboard 中：
   - 进入项目设置 > Environment Variables
   - 找到 STRIPE_SECRET_KEY
   - 更新为新的密钥值
   - 保存并重新部署
6. 等待部署完成后再次测试
    `);
  }

  console.log('\n✅ 诊断完成！');
  return results;
})();

