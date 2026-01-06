#!/usr/bin/env node

/**
 * 登录问题诊断脚本
 * 快速检查所有可能导致登录失败的配置问题
 */

const fs = require('fs')
const path = require('path')

// 加载环境变量
try {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })
} catch (e) {
  // dotenv 可能未安装，尝试直接读取 .env.local
  const envPath = path.join(__dirname, '..', '.env.local')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8')
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/)
      if (match) {
        const key = match[1].trim()
        const value = match[2].trim().replace(/^["']|["']$/g, '')
        if (!process.env[key]) {
          process.env[key] = value
        }
      }
    })
  }
}

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function check(condition, message, fix = '') {
  if (condition) {
    log(`✅ ${message}`, 'green')
    return true
  } else {
    log(`❌ ${message}`, 'red')
    if (fix) {
      log(`   修复建议: ${fix}`, 'yellow')
    }
    return false
  }
}

log('\n🔍 登录问题诊断开始...\n', 'cyan')

// 1. 检查环境变量
log('📋 Step 1: 检查环境变量', 'blue')
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const appUrl = process.env.NEXT_PUBLIC_APP_URL

const envChecks = [
  check(!!supabaseUrl, 'NEXT_PUBLIC_SUPABASE_URL 已设置', '在 .env.local 或 Vercel 环境变量中设置'),
  check(!!supabaseAnonKey, 'NEXT_PUBLIC_SUPABASE_ANON_KEY 已设置', '在 .env.local 或 Vercel 环境变量中设置'),
  check(!!appUrl, 'NEXT_PUBLIC_APP_URL 已设置', '在 .env.local 或 Vercel 环境变量中设置'),
]

if (supabaseUrl) {
  const isProduction = supabaseUrl.includes('supabase.co')
  const isLocalhost = appUrl?.includes('localhost')
  
  if (isProduction && isLocalhost) {
    log('⚠️  检测到生产 Supabase URL 但本地开发环境', 'yellow')
    log('   确保 Supabase Site URL 包含: http://localhost:3000', 'yellow')
  } else if (isProduction && appUrl && !appUrl.includes('localhost')) {
    const expectedUrl = appUrl.replace(/^http:/, 'https:')
    log(`⚠️  生产环境检测到: ${appUrl}`, 'yellow')
    log(`   确保 Supabase Site URL 包含: ${expectedUrl}`, 'yellow')
  }
}

// 2. 检查 Supabase URL 格式
log('\n📋 Step 2: 检查 Supabase 配置格式', 'blue')
if (supabaseUrl) {
  const urlChecks = [
    check(
      supabaseUrl.startsWith('https://'),
      'Supabase URL 使用 HTTPS',
      '确保 Supabase URL 以 https:// 开头'
    ),
    check(
      supabaseUrl.includes('.supabase.co'),
      'Supabase URL 格式正确',
      '确保 Supabase URL 格式为 https://xxx.supabase.co'
    ),
  ]
}

// 3. 检查应用 URL 格式
log('\n📋 Step 3: 检查应用 URL 配置', 'blue')
if (appUrl) {
  const isHttps = appUrl.startsWith('https://')
  const isHttp = appUrl.startsWith('http://')
  const isLocalhost = appUrl.includes('localhost')
  
  check(
    isHttps || isLocalhost,
    `应用 URL 格式正确: ${appUrl}`,
    isHttp && !isLocalhost ? '生产环境必须使用 HTTPS (https://)' : ''
  )
  
  if (isLocalhost) {
    log('ℹ️  本地开发环境检测到', 'cyan')
    log('   确保 Supabase Site URL 包含: http://localhost:3000', 'cyan')
  } else {
    log('ℹ️  生产环境检测到', 'cyan')
    log(`   确保 Supabase Site URL = ${appUrl.replace(/^http:/, 'https:')}`, 'cyan')
  }
}

// 4. 检查回调 URL 格式
log('\n📋 Step 4: 检查回调 URL 配置', 'blue')
if (appUrl) {
  const callbackUrl = `${appUrl}/auth/callback`
  const httpsCallbackUrl = callbackUrl.replace(/^http:/, 'https:')
  
  log(`   预期回调 URL: ${httpsCallbackUrl}`, 'cyan')
  log('   确保以下配置正确:', 'cyan')
  log('   1. Supabase Redirect URLs 包含:', 'yellow')
  log(`      - ${httpsCallbackUrl}`, 'yellow')
  log(`      - ${appUrl.replace(/^http:/, 'https:')}/**`, 'yellow')
  log('   2. Google Cloud Console Authorized redirect URIs 包含:', 'yellow')
  if (supabaseUrl) {
    const supabaseCallback = `${supabaseUrl}/auth/v1/callback`
    log(`      - ${supabaseCallback}`, 'yellow')
  }
  log(`      - ${httpsCallbackUrl}`, 'yellow')
}

// 5. 生成检查清单
log('\n📋 Step 5: Supabase Dashboard 检查清单', 'blue')
log('   请手动检查以下配置:', 'cyan')
log('')
log('   ✅ Supabase Dashboard → Settings → API', 'yellow')
log('      Site URL = https://sora2aivideos.com', 'yellow')
log('')
log('   ✅ Supabase Dashboard → Authentication → URL Configuration', 'yellow')
log('      Redirect URLs 包含:', 'yellow')
log('      - https://sora2aivideos.com/**', 'yellow')
log('      - https://sora2aivideos.com/auth/callback', 'yellow')
log('')
log('   ✅ Supabase Dashboard → Authentication → Providers → Google', 'yellow')
log('      - 开关已启用（绿色）', 'yellow')
log('      - Client ID 正确', 'yellow')
log('      - Client Secret 正确', 'yellow')
log('')
log('   ✅ Google Cloud Console → APIs & Services → Credentials', 'yellow')
log('      Authorized redirect URIs 包含:', 'yellow')
if (supabaseUrl) {
  log(`      - ${supabaseUrl}/auth/v1/callback`, 'yellow')
}
log('      - https://sora2aivideos.com/auth/callback', 'yellow')

// 6. 浏览器测试建议
log('\n📋 Step 6: 浏览器测试建议', 'blue')
log('   1. 打开无痕窗口（Cmd+Shift+N / Ctrl+Shift+N）', 'cyan')
log('   2. 打开 DevTools（F12）', 'cyan')
log('   3. 访问网站并点击登录', 'cyan')
log('   4. 检查 Console 是否有红色错误', 'cyan')
log('   5. 检查 Network 标签页的 auth 请求', 'cyan')
log('   6. 在 Console 运行以下代码检查 session:', 'cyan')
log('')
log('      const { createClient } = await import("/lib/supabase/client.ts")', 'yellow')
log('      const supabase = createClient()', 'yellow')
log('      const { data: { session } } = await supabase.auth.getSession()', 'yellow')
log('      console.log("Session:", session)', 'yellow')

// 总结
log('\n📊 诊断总结', 'cyan')
const allEnvChecks = envChecks.every(c => c)
if (allEnvChecks) {
  log('✅ 环境变量配置正确', 'green')
  log('⚠️  请手动检查 Supabase Dashboard 和 Google Cloud Console 配置', 'yellow')
} else {
  log('❌ 环境变量配置有问题，请先修复', 'red')
}

log('\n💡 关键提醒:', 'cyan')
log('   登录失败 = 转化率为 0，是系统级阻断', 'red')
log('   修好登录 = 你现在 ROI 最高的一步', 'green')
log('')

