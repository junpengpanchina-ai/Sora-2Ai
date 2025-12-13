/**
 * R2 配置测试 - 浏览器Console版本
 * 
 * 使用方法：
 * 1. 打开浏览器开发者工具 (F12)
 * 2. 进入 Console 标签
 * 3. 复制下面的代码并粘贴
 * 4. 按 Enter 运行
 */

(async function testR2ConfigInBrowser() {
  console.log('🔍 开始测试 R2 配置...\n')
  console.log('='.repeat(60))
  
  // 测试1: 图片列表API
  console.log('\n1️⃣ 测试图片列表 API...')
  try {
    const imageResponse = await fetch('/api/admin/r2/list?type=image&maxKeys=10')
    const imageData = await imageResponse.json()
    
    console.log('  HTTP 状态码:', imageResponse.status)
    console.log('  响应数据:', imageData)
    
    if (imageResponse.ok && imageData.success) {
      console.log('  ✅ 图片列表API工作正常')
      console.log('  文件数量:', imageData.files?.length || 0)
      if (imageData.files && imageData.files.length > 0) {
        console.log('  示例文件:', imageData.files[0])
      }
    } else {
      console.error('  ❌ 图片列表API失败')
      console.error('  错误信息:', imageData.error || '未知错误')
      console.error('  详细信息:', imageData.details || '无')
      
      // 详细错误分析
      if (imageData.details) {
        console.log('\n  🔍 错误分析:')
        const details = imageData.details
        
        if (details.includes('length') && details.includes('32')) {
          console.error('    - Secret Access Key 长度错误')
          console.error('    - AWS SDK 期望 32 字符')
          console.error('    - 当前配置可能是 64 字符十六进制')
          console.log('\n  💡 可能的原因:')
          console.log('    1. Vercel 环境变量配置错误')
          console.log('    2. 代码未部署最新版本（缺少转换逻辑）')
          console.log('    3. 密钥格式与 AWS SDK 不兼容')
          console.log('\n  🛠️ 解决方案:')
          console.log('    1. 检查 Vercel 环境变量是否正确')
          console.log('    2. 确认已重新部署最新代码')
          console.log('    3. 查看 Vercel Function Logs 确认转换是否执行')
          console.log('    4. 如果仍然失败，可能需要重新创建 API Token')
        } else if (details.includes('not configured')) {
          console.error('    - R2 客户端未配置')
          console.log('\n  💡 可能的原因:')
          console.log('    1. 环境变量未设置')
          console.log('    2. 环境变量值为空')
          console.log('\n  🛠️ 解决方案:')
          console.log('    1. 检查 Vercel 环境变量是否已配置')
          console.log('    2. 确保所有必需的变量都已设置')
        } else if (details.includes('InvalidAccessKeyId') || details.includes('SignatureDoesNotMatch')) {
          console.error('    - 凭证无效')
          console.log('\n  💡 可能的原因:')
          console.log('    1. Access Key ID 或 Secret Access Key 错误')
          console.log('    2. 密钥不匹配')
          console.log('\n  🛠️ 解决方案:')
          console.log('    1. 检查环境变量值是否正确')
          console.log('    2. 重新创建 Cloudflare R2 API Token')
        } else {
          console.log('    - 其他错误:', details)
        }
      }
      
      // 显示配置建议
      if (imageData.config) {
        console.log('\n  📋 当前配置状态:')
        console.log('    ', imageData.config)
      }
      
      if (imageData.troubleshooting) {
        console.log('\n  🔧 故障排除步骤:')
        Object.entries(imageData.troubleshooting).forEach(([key, value]) => {
          console.log(`    ${key}: ${value}`)
        })
      }
    }
  } catch (error) {
    console.error('  ❌ 请求失败:', error)
  }
  
  // 测试2: 视频列表API
  console.log('\n2️⃣ 测试视频列表 API...')
  try {
    const videoResponse = await fetch('/api/admin/r2/list?type=video&maxKeys=10')
    const videoData = await videoResponse.json()
    
    console.log('  HTTP 状态码:', videoResponse.status)
    console.log('  响应数据:', videoData)
    
    if (videoResponse.ok && videoData.success) {
      console.log('  ✅ 视频列表API工作正常')
      console.log('  文件数量:', videoData.files?.length || 0)
    } else {
      console.error('  ❌ 视频列表API失败')
      console.error('  错误信息:', videoData.error || '未知错误')
      console.error('  详细信息:', videoData.details || '无')
    }
  } catch (error) {
    console.error('  ❌ 请求失败:', error)
  }
  
  // 测试3: 检查服务器日志（如果可能）
  console.log('\n3️⃣ 检查建议...')
  console.log('  如果需要查看详细的服务器日志:')
  console.log('  1. 登录 Vercel Dashboard')
  console.log('  2. 进入项目 → Functions')
  console.log('  3. 查看 /api/admin/r2/list 函数的日志')
  console.log('  4. 搜索 "[R2]" 关键词查看转换日志')
  
  console.log('\n' + '='.repeat(60))
  console.log('✅ 测试完成')
  console.log('='.repeat(60))
})();

