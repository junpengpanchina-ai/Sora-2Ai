#!/usr/bin/env node

/**
 * R2 配置测试脚本
 * 在浏览器 Console 或 Node.js 中运行来检测 R2 配置问题
 * 
 * 使用方法：
 * 1. 在浏览器 Console 中：直接粘贴代码并运行
 * 2. 在 Node.js 中：node scripts/test-r2-config.js
 */

// 测试配置值（从你的环境变量中复制）
const TEST_CONFIG = {
  R2_ACCOUNT_ID: '2776117bb412e09a1d30cbe886cd3935',
  R2_ACCESS_KEY_ID: 'J8lziNGKBquRTcaapZSy1ClUxgpnjbBSUzQzy4wt',
  R2_SECRET_ACCESS_KEY: '282788fb2875ab728cecdf2f1b81afafc1bf8442793bf260befa614aaad9f746',
  R2_BUCKET_NAME: 'sora2',
  R2_S3_ENDPOINT: 'https://2776117bb412e09a1d30cbe886cd3935.r2.cloudflarestorage.com',
  R2_PUBLIC_URL: 'https://pub-2868c824f92441499577980a0b61114c.r2.dev',
}

function testR2Config() {
  console.log('🔍 开始检测 R2 配置...\n')
  
  const results = {
    checks: [],
    errors: [],
    warnings: [],
    info: [],
  }
  
  // 检查1: 配置完整性
  console.log('1️⃣ 检查配置完整性...')
  const requiredKeys = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME']
  for (const key of requiredKeys) {
    const value = TEST_CONFIG[key]
    if (!value || value.trim() === '') {
      results.errors.push(`❌ ${key} 未配置`)
      console.error(`  ❌ ${key}: 未配置`)
    } else {
      results.checks.push(`✅ ${key}: 已配置 (${value.length}字符)`)
      console.log(`  ✅ ${key}: 已配置 (${value.length}字符)`)
    }
  }
  
  // 检查2: Access Key ID 格式
  console.log('\n2️⃣ 检查 Access Key ID 格式...')
  const accessKeyId = TEST_CONFIG.R2_ACCESS_KEY_ID.trim()
  const accessKeyLength = accessKeyId.length
  console.log(`  Access Key ID 长度: ${accessKeyLength} 字符`)
  console.log(`  Access Key ID 值: ${accessKeyId.substring(0, 10)}...`)
  
  if (accessKeyLength < 10) {
    results.errors.push('❌ Access Key ID 太短（应该至少20字符）')
  } else if (accessKeyLength > 100) {
    results.errors.push('❌ Access Key ID 太长（可能格式错误）')
  } else {
    results.checks.push(`✅ Access Key ID 长度正常: ${accessKeyLength}字符`)
  }
  
  // 检查3: Secret Access Key 格式和转换
  console.log('\n3️⃣ 检查 Secret Access Key 格式...')
  const secretKey = TEST_CONFIG.R2_SECRET_ACCESS_KEY.trim()
  const secretLength = secretKey.length
  console.log(`  Secret Access Key 长度: ${secretLength} 字符`)
  console.log(`  Secret Access Key 值: ${secretKey.substring(0, 10)}...`)
  
  // 检查是否为十六进制
  const isHex = /^[0-9a-fA-F]+$/.test(secretKey)
  console.log(`  是否为十六进制格式: ${isHex ? '✅ 是' : '❌ 否'}`)
  
  if (secretLength === 64 && isHex) {
    results.info.push('ℹ️ Secret Access Key 是64字符十六进制格式')
    
    // 尝试转换
    console.log('\n  尝试转换为Base64...')
    try {
      // 在Node.js环境中
      if (typeof Buffer !== 'undefined') {
        const hexBuffer = Buffer.from(secretKey, 'hex')
        const base64Secret = hexBuffer.toString('base64').replace(/=+$/, '')
        console.log(`  ✅ 转换为Base64成功: ${base64Secret.length}字符`)
        console.log(`  Base64值: ${base64Secret.substring(0, 20)}...`)
        results.info.push(`ℹ️ Base64转换后长度: ${base64Secret.length}字符`)
        
        // 尝试使用前32字符
        const first32Chars = secretKey.substring(0, 32)
        console.log(`  ℹ️ 前32字符: ${first32Chars}`)
        results.info.push(`ℹ️ 前32字符选项: ${first32Chars}`)
      } else {
        // 浏览器环境
        console.log('  ⚠️ 浏览器环境，无法直接转换，需要在服务器端测试')
        results.warnings.push('⚠️ 需要在服务器端测试Base64转换')
      }
    } catch (error) {
      results.errors.push(`❌ Base64转换失败: ${error.message}`)
      console.error(`  ❌ 转换失败:`, error)
    }
  } else if (secretLength === 32) {
    results.checks.push('✅ Secret Access Key 长度是32字符（符合AWS SDK期望）')
  } else if (secretLength === 40) {
    results.warnings.push('⚠️ Secret Access Key 长度是40字符（可能是Base64格式）')
  } else if (secretLength === 43 || secretLength === 44) {
    results.checks.push(`✅ Secret Access Key 长度是${secretLength}字符（可能是Base64格式）`)
  } else {
    results.warnings.push(`⚠️ Secret Access Key 长度异常: ${secretLength}字符（AWS SDK期望32字符）`)
  }
  
  // 检查4: Account ID
  console.log('\n4️⃣ 检查 Account ID...')
  const accountId = TEST_CONFIG.R2_ACCOUNT_ID.trim()
  if (accountId.length === 32 && /^[0-9a-fA-F]{32}$/i.test(accountId)) {
    results.checks.push('✅ Account ID 格式正确')
    console.log(`  ✅ Account ID 格式正确: ${accountId}`)
  } else {
    results.errors.push(`❌ Account ID 格式错误: ${accountId}`)
    console.error(`  ❌ Account ID 格式错误: ${accountId}`)
  }
  
  // 检查5: Endpoint URL
  console.log('\n5️⃣ 检查 Endpoint URL...')
  const endpoint = TEST_CONFIG.R2_S3_ENDPOINT
  if (endpoint && endpoint.startsWith('https://') && endpoint.includes('.r2.cloudflarestorage.com')) {
    results.checks.push('✅ Endpoint URL 格式正确')
    console.log(`  ✅ Endpoint: ${endpoint}`)
  } else {
    results.errors.push('❌ Endpoint URL 格式错误')
    console.error(`  ❌ Endpoint URL 格式错误: ${endpoint}`)
  }
  
  // 总结
  console.log('\n' + '='.repeat(60))
  console.log('📊 检测结果总结')
  console.log('='.repeat(60))
  
  if (results.errors.length > 0) {
    console.log('\n❌ 错误:')
    results.errors.forEach(error => console.log(`  ${error}`))
  }
  
  if (results.warnings.length > 0) {
    console.log('\n⚠️ 警告:')
    results.warnings.forEach(warning => console.log(`  ${warning}`))
  }
  
  if (results.info.length > 0) {
    console.log('\nℹ️ 信息:')
    results.info.forEach(info => console.log(`  ${info}`))
  }
  
  console.log('\n✅ 通过检查:')
  results.checks.forEach(check => console.log(`  ${check}`))
  
  // 建议
  console.log('\n💡 建议:')
  if (secretLength === 64 && isHex) {
    console.log('  1. Secret Access Key 是64字符十六进制')
    console.log('  2. 代码应该自动转换为Base64（43字符）')
    console.log('  3. 如果仍然失败，可能需要使用前32字符')
    console.log('  4. 或者联系Cloudflare支持确认正确的格式')
  } else if (secretLength !== 32) {
    console.log('  1. Secret Access Key 长度不符合AWS SDK的期望（32字符）')
    console.log('  2. 建议重新创建Cloudflare R2 API Token')
    console.log('  3. 确保直接从Dashboard复制，不要修改')
  }
  
  console.log('\n' + '='.repeat(60))
  
  return results
}

// 在浏览器Console中使用的版本
const browserVersion = `
// 在浏览器Console中运行以下代码来测试R2配置

async function testR2ConfigInBrowser() {
  console.log('🔍 测试R2 API端点...\\n')
  
  try {
    // 测试图片列表API
    console.log('1️⃣ 测试图片列表API...')
    const imageResponse = await fetch('/api/admin/r2/list?type=image&maxKeys=10')
    const imageData = await imageResponse.json()
    
    console.log('响应状态:', imageResponse.status)
    console.log('响应数据:', imageData)
    
    if (imageResponse.ok && imageData.success) {
      console.log('✅ 图片列表API工作正常')
      console.log('文件数量:', imageData.files?.length || 0)
    } else {
      console.error('❌ 图片列表API失败:', imageData.error || imageData.details)
      
      // 分析错误
      if (imageData.details) {
        const details = imageData.details
        if (details.includes('length') && details.includes('32')) {
          console.error('\\n🔍 错误分析:')
          console.error('  - Secret Access Key长度错误')
          console.error('  - AWS SDK期望32字符')
          console.error('  - 当前可能是64字符十六进制格式')
          console.error('\\n💡 解决方案:')
          console.error('  1. 检查Vercel环境变量是否正确配置')
          console.error('  2. 确认代码已部署最新版本（包含转换逻辑）')
          console.error('  3. 查看Vercel Function Logs确认转换是否执行')
        }
      }
    }
    
    // 测试视频列表API
    console.log('\\n2️⃣ 测试视频列表API...')
    const videoResponse = await fetch('/api/admin/r2/list?type=video&maxKeys=10')
    const videoData = await videoResponse.json()
    
    console.log('响应状态:', videoResponse.status)
    console.log('响应数据:', videoData)
    
    if (videoResponse.ok && videoData.success) {
      console.log('✅ 视频列表API工作正常')
      console.log('文件数量:', videoData.files?.length || 0)
    } else {
      console.error('❌ 视频列表API失败:', videoData.error || videoData.details)
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error)
  }
}

// 运行测试
testR2ConfigInBrowser()
`

// 如果在Node.js环境中运行
if (typeof module !== 'undefined' && module.exports) {
  testR2Config()
}

// 导出函数供其他脚本使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testR2Config, browserVersion }
}

