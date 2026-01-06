#!/usr/bin/env node

/**
 * 快速登录检查脚本（浏览器 Console 版本）
 * 复制到浏览器 Console 运行，快速诊断登录问题
 */

const loginCheckScript = `
// ============================================
// 登录问题快速诊断脚本（浏览器 Console）
// 复制以下代码到浏览器 Console 运行
// ============================================

(async function diagnoseLogin() {
  console.log('%c🔍 登录问题诊断开始...', 'color: cyan; font-size: 16px; font-weight: bold');
  
  // 1. 检查 Supabase 客户端
  console.log('\\n📋 Step 1: 检查 Supabase 客户端');
  try {
    const { createClient } = await import('/lib/supabase/client.ts');
    const supabase = createClient();
    console.log('✅ Supabase 客户端创建成功');
    
    // 2. 检查当前 session
    console.log('\\n📋 Step 2: 检查当前 session');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session 错误:', sessionError);
    } else if (session) {
      console.log('✅ 当前有 session:', {
        userId: session.user?.id,
        email: session.user?.email,
        expiresAt: new Date(session.expires_at * 1000).toLocaleString(),
      });
    } else {
      console.log('⚠️  当前没有 session（未登录）');
    }
    
    // 3. 检查 Cookie
    console.log('\\n📋 Step 3: 检查 Cookie');
    const cookies = document.cookie.split(';').map(c => c.trim());
    const supabaseCookies = cookies.filter(c => c.includes('supabase') || c.startsWith('sb-'));
    
    if (supabaseCookies.length > 0) {
      console.log('✅ 找到 Supabase Cookie:', supabaseCookies);
    } else {
      console.log('⚠️  未找到 Supabase Cookie');
    }
    
    // 4. 检查 localStorage
    console.log('\\n📋 Step 4: 检查 localStorage');
    const localStorageKeys = Object.keys(localStorage);
    const supabaseStorageKeys = localStorageKeys.filter(
      k => k.includes('supabase') || k.startsWith('sb-')
    );
    
    if (supabaseStorageKeys.length > 0) {
      console.log('✅ 找到 Supabase localStorage keys:', supabaseStorageKeys);
      
      // 检查是否有 code_verifier
      const hasCodeVerifier = supabaseStorageKeys.some(key => {
        const value = localStorage.getItem(key);
        return value && (
          value.includes('code_verifier') ||
          value.includes('codeVerifier') ||
          value.includes('pkce')
        );
      });
      
      if (hasCodeVerifier) {
        console.log('✅ 检测到 PKCE code_verifier');
      } else {
        console.log('⚠️  未检测到 PKCE code_verifier');
      }
    } else {
      console.log('⚠️  未找到 Supabase localStorage keys');
    }
    
    // 5. 检查当前 URL
    console.log('\\n📋 Step 5: 检查当前 URL');
    const currentUrl = window.location.href;
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    
    console.log('当前 URL:', currentUrl);
    console.log('Origin:', origin);
    console.log('Pathname:', pathname);
    
    // 检查是否是回调页面
    if (pathname === '/auth/callback') {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');
      
      if (error) {
        console.error('❌ 回调页面检测到错误:', error);
      } else if (code) {
        console.log('✅ 回调页面检测到 code 参数');
      } else {
        console.log('⚠️  回调页面但没有 code 参数');
      }
    }
    
    // 6. 检查环境变量（如果可用）
    console.log('\\n📋 Step 6: 检查配置');
    console.log('预期回调 URL:', origin + '/auth/callback');
    console.log('\\n请检查以下配置:');
    console.log('1. Supabase Dashboard → Settings → API → Site URL');
    console.log('   应该包含:', origin);
    console.log('\\n2. Supabase Dashboard → Authentication → URL Configuration → Redirect URLs');
    console.log('   应该包含:');
    console.log('   -', origin + '/**');
    console.log('   -', origin + '/auth/callback');
    console.log('\\n3. Google Cloud Console → Authorized redirect URIs');
    console.log('   应该包含:');
    console.log('   - https://hgzpzsiafycwlqrkzbis.supabase.co/auth/v1/callback');
    console.log('   -', origin + '/auth/callback');
    
    // 7. 测试登录流程
    console.log('\\n📋 Step 7: 测试登录流程');
    console.log('点击登录按钮后，检查以下内容:');
    console.log('1. Network 标签页 → 查找 /auth/v1/token 或 /auth/v1/callback 请求');
    console.log('2. Console 标签页 → 查找红色错误');
    console.log('3. Application 标签页 → Cookies → 检查是否有新的 Supabase cookie');
    
    console.log('\\n✅ 诊断完成！');
    console.log('\\n💡 如果登录失败，请检查:');
    console.log('   - Supabase Site URL 配置');
    console.log('   - Redirect URLs 白名单');
    console.log('   - Google Cloud Console Redirect URIs');
    console.log('   - Cookie SameSite / Secure 设置');
    
  } catch (error) {
    console.error('❌ 诊断脚本执行失败:', error);
  }
})();
`;

console.log('============================================');
console.log('快速登录检查脚本');
console.log('============================================');
console.log('');
console.log('📋 使用方法：');
console.log('1. 打开网站：https://sora2aivideos.com');
console.log('2. 打开浏览器 DevTools（F12）');
console.log('3. 切换到 Console 标签页');
console.log('4. 复制以下代码并粘贴到 Console，按 Enter 运行');
console.log('');
console.log('============================================');
console.log(loginCheckScript);
console.log('============================================');
console.log('');
console.log('或者，你可以直接访问以下 URL 查看脚本：');
console.log('file://' + __filename);

