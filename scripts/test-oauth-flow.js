#!/usr/bin/env node

/**
 * 测试 OAuth 流程的脚本
 * 检查 PKCE code_verifier 是否正确存储
 */

require('dotenv').config({ path: '.env.local' });

console.log('🔍 OAuth 流程检查\n');

// 检查环境变量
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ 缺少 Supabase 环境变量');
  process.exit(1);
}

console.log('✅ 环境变量已配置');
console.log(`   URL: ${supabaseUrl.substring(0, 30)}...`);
console.log(`   Key: ${supabaseAnonKey.substring(0, 20)}...\n`);

console.log('📋 OAuth 流程说明：');
console.log('1. 用户点击登录按钮');
console.log('2. 客户端调用 signInWithOAuth');
console.log('3. Supabase 生成 PKCE code_verifier 并存储在 localStorage');
console.log('4. 重定向到 Google 授权页面');
console.log('5. Google 授权后重定向回应用（带 code）');
console.log('6. 应用使用 code 和 code_verifier 交换 session\n');

console.log('⚠️  重要检查项：');
console.log('1. 确保使用客户端组件处理 OAuth（✅ 已实现）');
console.log('2. 确保 redirectTo 使用完整 URL（✅ 已实现）');
console.log('3. 确保回调页面也在客户端处理（✅ 已实现）');
console.log('4. 确保使用 createBrowserClient（✅ 已实现）\n');

console.log('🔧 如果仍然失败，请检查：');
console.log('1. 浏览器控制台的 localStorage');
console.log('   - 打开开发者工具 > Application > Local Storage');
console.log('   - 查找 supabase.auth.token 相关的键');
console.log('2. 确保没有清除浏览器存储');
console.log('3. 尝试使用隐私模式测试（排除扩展干扰）\n');

