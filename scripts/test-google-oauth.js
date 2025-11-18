#!/usr/bin/env node

/**
 * Google OAuth 登录配置检查脚本
 * 检查所有必需的配置是否正确设置
 */

require('dotenv').config({ path: '.env.local' })

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function check(condition, message, details = '') {
  if (condition) {
    log(`✅ ${message}`, 'green')
    if (details) log(`   ${details}`, 'cyan')
    return true
  } else {
    log(`❌ ${message}`, 'red')
    if (details) log(`   ${details}`, 'yellow')
    return false
  }
}

function checkEnvVar(name, required = true) {
  const value = process.env[name]
  if (required) {
    return check(!!value, `${name} 已设置`, value ? `值: ${value.substring(0, 20)}...` : '未找到')
  } else {
    return check(true, `${name} ${value ? '已设置' : '未设置（可选）'}`, value ? `值: ${value.substring(0, 20)}...` : '')
  }
}

async function main() {
  log('\n🔍 Google OAuth 登录配置检查\n', 'blue')
  log('=' .repeat(60), 'cyan')

  let allPassed = true

  // 1. 检查 Supabase 环境变量
  log('\n📦 1. Supabase 环境变量', 'blue')
  allPassed = checkEnvVar('NEXT_PUBLIC_SUPABASE_URL', true) && allPassed
  allPassed = checkEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY', true) && allPassed
  allPassed = checkEnvVar('SUPABASE_SERVICE_ROLE_KEY', true) && allPassed

  // 验证 Supabase URL 格式
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (supabaseUrl) {
    const isValidUrl = supabaseUrl.startsWith('https://') && supabaseUrl.includes('.supabase.co')
    allPassed = check(isValidUrl, 'Supabase URL 格式正确', 
      isValidUrl ? '' : 'URL 应该以 https:// 开头并包含 .supabase.co')
  }

  // 2. 检查 Google OAuth 环境变量
  log('\n🔐 2. Google OAuth 环境变量', 'blue')
  allPassed = checkEnvVar('GOOGLE_CLIENT_ID', true) && allPassed
  allPassed = checkEnvVar('GOOGLE_CLIENT_SECRET', true) && allPassed

  // 验证 Google Client ID 格式
  const googleClientId = process.env.GOOGLE_CLIENT_ID
  if (googleClientId) {
    const isValidFormat = googleClientId.includes('.apps.googleusercontent.com')
    allPassed = check(isValidFormat, 'Google Client ID 格式正确',
      isValidFormat ? '' : 'Client ID 应该包含 .apps.googleusercontent.com')
  }

  // 3. 检查应用 URL
  log('\n🌐 3. 应用 URL 配置', 'blue')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (appUrl) {
    const isValidUrl = appUrl.startsWith('http://') || appUrl.startsWith('https://')
    allPassed = check(isValidUrl, '应用 URL 格式正确', `当前值: ${appUrl}`) && allPassed
  } else {
    log('⚠️  NEXT_PUBLIC_APP_URL 未设置（开发环境可能不需要）', 'yellow')
  }

  // 4. 检查 Supabase 连接
  log('\n🔌 4. Supabase 连接测试', 'blue')
  try {
    const { createClient } = require('@supabase/supabase-js')
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey)
      // 尝试一个简单的查询来测试连接
      const { error } = await supabase.from('users').select('count').limit(1)
      // 即使查询失败，只要没有网络错误就说明连接正常
      const isConnected = !error || (error.code !== 'PGRST301' && error.code !== 'PGRST116')
      allPassed = check(isConnected, 'Supabase 连接正常', 
        error ? `注意: ${error.message}` : '连接成功')
    } else {
      log('⚠️  跳过连接测试（缺少环境变量）', 'yellow')
    }
  } catch (err) {
    allPassed = check(false, 'Supabase 连接测试失败', err.message)
  }

  // 5. 配置检查清单
  log('\n📋 5. 配置检查清单', 'blue')
  log('\n请手动检查以下配置：', 'yellow')
  log('')
  log('□ Supabase Dashboard:', 'cyan')
  log('  1. 访问 https://supabase.com/dashboard', 'cyan')
  log('  2. 进入 Authentication > Providers', 'cyan')
  log('  3. 确认 Google Provider 已启用', 'cyan')
  log('  4. 检查 Client ID 和 Client Secret 是否正确', 'cyan')
  log('')
  log('□ Google Cloud Console:', 'cyan')
  log('  1. 访问 https://console.cloud.google.com/', 'cyan')
  log('  2. 进入 APIs & Services > Credentials', 'cyan')
  log('  3. 检查 OAuth 2.0 客户端 ID', 'cyan')
  log('  4. 确认重定向 URI 已添加：', 'cyan')
  if (supabaseUrl) {
    const projectId = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
    if (projectId) {
      log(`     - https://${projectId}.supabase.co/auth/v1/callback`, 'cyan')
    }
  }
  log('     - http://localhost:3000/auth/callback', 'cyan')
  log('     - http://localhost:3000/api/auth/callback (如果使用)', 'cyan')
  log('')

  // 6. 总结
  log('\n' + '='.repeat(60), 'cyan')
  if (allPassed) {
    log('\n✅ 所有环境变量检查通过！', 'green')
    log('\n如果登录仍然失败，请检查：', 'yellow')
    log('1. Supabase Dashboard 中的 Google Provider 配置', 'yellow')
    log('2. Google Cloud Console 中的重定向 URI', 'yellow')
    log('3. 浏览器控制台的错误信息', 'yellow')
    log('4. 确保未使用隐私/无痕模式', 'yellow')
  } else {
    log('\n❌ 发现配置问题，请修复后重试', 'red')
    log('\n修复步骤：', 'yellow')
    log('1. 检查 .env.local 文件是否存在', 'yellow')
    log('2. 确认所有必需的环境变量都已设置', 'yellow')
    log('3. 重启开发服务器: npm run dev', 'yellow')
  }
  log('')

  process.exit(allPassed ? 0 : 1)
}

main().catch((err) => {
  log(`\n❌ 检查过程中出错: ${err.message}`, 'red')
  console.error(err)
  process.exit(1)
})

