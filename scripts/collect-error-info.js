#!/usr/bin/env node

/**
 * 错误信息收集脚本
 * 帮助用户收集所有必要的调试信息
 */

const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

console.log('📋 错误信息收集指南\n')
console.log('='.repeat(60))

console.log('\n🔍 步骤 1: 浏览器控制台信息')
console.log('-'.repeat(60))
console.log('1. 打开浏览器开发者工具 (F12)')
console.log('2. 切换到 Console 标签')
console.log('3. 尝试登录')
console.log('4. 复制所有红色错误信息')
console.log('\n或者在控制台运行以下代码：')
console.log(`
(async function() {
  const info = {
    url: window.location.href,
    origin: window.location.origin,
    localStorage: {
      allKeys: Object.keys(localStorage),
      supabaseKeys: Object.keys(localStorage).filter(k => k.includes('supabase')),
      hasCodeVerifier: Object.keys(localStorage).some(k => 
        k.includes('code-verifier') || k.includes('verifier')
      ),
    },
    cookies: document.cookie,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
  };
  console.log('=== 诊断信息 ===');
  console.log(JSON.stringify(info, null, 2));
  return info;
})();
`)

console.log('\n🔍 步骤 2: 网络请求信息')
console.log('-'.repeat(60))
console.log('1. 切换到 Network 标签')
console.log('2. 清除网络日志')
console.log('3. 尝试登录')
console.log('4. 查找失败的请求（红色）')
console.log('5. 点击失败的请求，查看：')
console.log('   - Request URL')
console.log('   - Status Code')
console.log('   - Response（如果有）')

console.log('\n🔍 步骤 3: Supabase Auth Logs')
console.log('-'.repeat(60))
console.log('1. 访问: https://supabase.com/dashboard')
console.log('2. 选择项目: hgzpzsiafycwlqrkzbis')
console.log('3. 进入: Logs > Auth Logs')
console.log('4. 查看最近的登录尝试')
console.log('5. 复制错误信息或截图')

console.log('\n🔍 步骤 4: Vercel 日志（如果已部署）')
console.log('-'.repeat(60))
console.log('1. 访问: https://vercel.com/dashboard')
console.log('2. 选择项目')
console.log('3. 进入: Deployments > 最新部署 > Functions')
console.log('4. 查找: /api/log-error')
console.log('5. 查看日志，搜索: [Client Error]')

console.log('\n📋 需要收集的信息清单')
console.log('='.repeat(60))
console.log('✅ 浏览器控制台错误（完整消息）')
console.log('✅ 网络请求失败详情（URL、状态码、响应）')
console.log('✅ Supabase Auth Logs（最近的认证尝试）')
console.log('✅ 当前环境（本地/生产）')
console.log('✅ 使用的浏览器')
console.log('✅ 具体错误消息（用户看到的）')

console.log('\n🎯 常见错误及需要的信息')
console.log('-'.repeat(60))
console.log('1. "code_verifier not found"')
console.log('   → 需要: localStorage 诊断信息')
console.log('2. "redirect_uri_mismatch"')
console.log('   → 需要: 当前 URL、网络请求详情')
console.log('3. "invalid request"')
console.log('   → 需要: Supabase Auth Logs、网络请求详情')
console.log('4. "OAuth 配置错误"')
console.log('   → 需要: Supabase Dashboard 截图')

console.log('\n📝 快速诊断命令')
console.log('-'.repeat(60))
console.log('运行: npm run diagnose:login')
console.log('然后提供完整的输出结果')

console.log('\n' + '='.repeat(60))
console.log('收集完上述信息后，请提供给我，我会帮你诊断问题！\n')

