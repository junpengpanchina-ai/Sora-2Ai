/**
 * 查看总注册用户数脚本
 * 
 * 使用方法：
 * 1. 在浏览器控制台执行
 * 2. 或者使用 Node.js 运行（需要配置环境变量）
 */

// 浏览器控制台版本
if (typeof window !== 'undefined') {
  (async function() {
    console.log('🔍 正在查询总注册用户数...\n')
    
    try {
      const response = await fetch('/api/admin/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (response.status === 401) {
        console.error('❌ 未授权，请先登录 Admin 后台')
        console.log('💡 请访问 /admin 登录后再执行此脚本')
        return
      }
      
      if (!response.ok) {
        const error = await response.json()
        console.error('❌ 请求失败:', error)
        return
      }
      
      const data = await response.json()
      
      if (data.success && data.stats) {
        console.log('📊 统计数据:')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log(`👥 总注册用户数: ${data.stats.total_users}`)
        console.log(`💎 总积分余额: ${data.stats.total_credits.toLocaleString()}`)
        console.log(`💰 总充值金额: $${data.stats.total_recharges.toFixed(2)}`)
        console.log(`📉 总消耗积分: ${data.stats.total_consumption.toLocaleString()}`)
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        
        return data.stats
      } else {
        console.error('❌ 数据格式错误:', data)
      }
    } catch (error) {
      console.error('❌ 查询失败:', error)
    }
  })()
} else {
  // Node.js 版本（需要配置环境变量）
  console.log('Node.js 版本需要配置 Supabase 环境变量')
  console.log('建议使用浏览器控制台版本')
}



