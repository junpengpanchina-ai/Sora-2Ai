#!/usr/bin/env node

/**
 * Google 登录诊断脚本
 * 检查所有可能导致登录失败的配置问题
 */

const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

console.log('🔍 Google 登录诊断工具\n')
console.log('=' .repeat(60))

// 1. 检查环境变量
console.log('\n📋 1. 环境变量检查')
console.log('-'.repeat(60))

const requiredVars = {
  'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  'GOOGLE_CLIENT_ID': process.env.GOOGLE_CLIENT_ID,
  'GOOGLE_CLIENT_SECRET': process.env.GOOGLE_CLIENT_SECRET,
  'NEXT_PUBLIC_APP_URL': process.env.NEXT_PUBLIC_APP_URL,
}

let hasErrors = false

Object.entries(requiredVars).forEach(([key, value]) => {
  if (!value) {
    console.log(`❌ ${key}: 未设置`)
    hasErrors = true
  } else {
    const displayValue = key.includes('SECRET') || key.includes('KEY')
      ? `${value.substring(0, 20)}...`
      : value
    console.log(`✅ ${key}: ${displayValue}`)
  }
})

// 2. 检查 URL 配置
console.log('\n🌐 2. URL 配置检查')
console.log('-'.repeat(60))

const appUrl = process.env.NEXT_PUBLIC_APP_URL
if (appUrl) {
  const isLocalhost = appUrl.includes('localhost') || appUrl.includes('127.0.0.1')
  const isProduction = appUrl.includes('sora2aivideos.com') || appUrl.includes('vercel.app')
  
  console.log(`当前 APP_URL: ${appUrl}`)
  
  if (isLocalhost) {
    console.log('✅ 检测到本地开发环境')
    console.log('⚠️  确保 Supabase Site URL 包含: http://localhost:3000')
    console.log('⚠️  确保 Google 重定向 URI 包含: http://localhost:3000/auth/callback')
  } else if (isProduction) {
    console.log('✅ 检测到生产环境')
    console.log('⚠️  确保 Supabase Site URL 包含生产 URL')
    console.log('⚠️  确保 Google 重定向 URI 包含生产回调 URL')
  } else {
    console.log('⚠️  无法确定环境类型')
  }
} else {
  console.log('❌ NEXT_PUBLIC_APP_URL 未设置')
  hasErrors = true
}

// 3. 检查 Supabase 配置
console.log('\n🔐 3. Supabase 配置检查')
console.log('-'.repeat(60))

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
if (supabaseUrl) {
  const projectId = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
  if (projectId) {
    console.log(`✅ Supabase 项目 ID: ${projectId}`)
    console.log(`✅ Supabase URL: ${supabaseUrl}`)
    console.log(`\n📝 需要在 Google Cloud Console 添加的重定向 URI:`)
    console.log(`   ${supabaseUrl}/auth/v1/callback`)
  } else {
    console.log('❌ Supabase URL 格式不正确')
    hasErrors = true
  }
} else {
  console.log('❌ NEXT_PUBLIC_SUPABASE_URL 未设置')
  hasErrors = true
}

// 4. 检查 Google OAuth 配置
console.log('\n🔑 4. Google OAuth 配置检查')
console.log('-'.repeat(60))

const googleClientId = process.env.GOOGLE_CLIENT_ID
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET

if (googleClientId) {
  const expectedClientId = '222103705593-0v1ntpdj5lvlmgj7tokoaq101rm5kq5o.apps.googleusercontent.com'
  if (googleClientId === expectedClientId) {
    console.log('✅ Google Client ID 正确')
  } else {
    console.log('⚠️  Google Client ID 与预期不符')
    console.log(`   当前: ${googleClientId}`)
    console.log(`   预期: ${expectedClientId}`)
  }
} else {
  console.log('❌ GOOGLE_CLIENT_ID 未设置')
  hasErrors = true
}

if (googleClientSecret) {
  if (googleClientSecret.startsWith('GOCSPX-')) {
    console.log('✅ Google Client Secret 格式正确')
  } else {
    console.log('⚠️  Google Client Secret 格式可能不正确')
  }
} else {
  console.log('❌ GOOGLE_CLIENT_SECRET 未设置')
  hasErrors = true
}

// 5. 检查代码配置
console.log('\n💻 5. 代码配置检查')
console.log('-'.repeat(60))

const loginButtonPath = path.join(__dirname, '..', 'components', 'LoginButton.tsx')
if (fs.existsSync(loginButtonPath)) {
  const content = fs.readFileSync(loginButtonPath, 'utf8')
  
  // 检查重定向 URL
  if (content.includes('window.location.origin')) {
    console.log('✅ 使用动态重定向 URL (window.location.origin)')
  } else {
    console.log('⚠️  未使用动态重定向 URL')
  }
  
  // 检查 skipBrowserRedirect
  if (content.includes('skipBrowserRedirect: true')) {
    console.log('✅ 使用手动重定向 (skipBrowserRedirect: true)')
  } else {
    console.log('⚠️  未使用手动重定向')
  }
  
  // 检查 code_verifier 验证
  if (content.includes('code-verifier') || content.includes('code_verifier')) {
    console.log('✅ 包含 code_verifier 验证逻辑')
  } else {
    console.log('⚠️  未找到 code_verifier 验证逻辑')
  }
} else {
  console.log('❌ LoginButton.tsx 文件不存在')
  hasErrors = true
}

// 6. 总结和建议
console.log('\n📊 诊断总结')
console.log('='.repeat(60))

if (hasErrors) {
  console.log('\n❌ 发现配置错误，请修复上述问题')
} else {
  console.log('\n✅ 基本配置检查通过')
}

console.log('\n📋 需要手动检查的配置:')
console.log('\n1. Supabase Dashboard:')
console.log('   - Authentication > Providers > Google (已启用)')
console.log('   - Settings > API > Site URL (包含当前环境 URL)')
console.log('   - Authentication > URL Configuration > Redirect URLs')

console.log('\n2. Google Cloud Console:')
console.log('   - APIs & Services > Credentials > OAuth 2.0 客户端')
console.log('   - Authorized redirect URIs 必须包含:')
if (supabaseUrl) {
  console.log(`     ${supabaseUrl}/auth/v1/callback`)
}
if (appUrl) {
  console.log(`     ${appUrl}/auth/callback`)
}

console.log('\n3. 浏览器设置:')
console.log('   - 允许 Cookie 和网站数据')
console.log('   - 未使用无痕模式')
console.log('   - 清除缓存和 Cookie')

console.log('\n' + '='.repeat(60))
console.log('诊断完成！\n')

