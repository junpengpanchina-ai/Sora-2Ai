// 快速测试聊天API
// 运行: node test-chat-api.js

const fetch = require('node-fetch')

async function testChatAPI() {
  console.log('🧪 测试聊天API...\n')
  
  try {
    // 注意：这个脚本需要在服务器端运行，或者需要配置正确的URL
    const url = process.env.API_URL || 'http://localhost:3000/api/admin/chat'
    
    console.log('📤 发送请求到:', url)
    console.log('消息: "你好"')
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 注意：需要有效的管理员session cookie
      },
      body: JSON.stringify({
        message: '你好',
        stream: false, // 使用非流式以便测试
        saveHistory: false,
      }),
    })
    
    console.log('\n📥 响应状态:', response.status, response.statusText)
    
    const data = await response.json()
    console.log('\n📊 响应数据:')
    console.log(JSON.stringify(data, null, 2))
    
    if (data.success) {
      console.log('\n✅ API调用成功')
      if (data.data?.choices?.[0]?.message?.content) {
        console.log('📄 响应内容:', data.data.choices[0].message.content.substring(0, 200))
      } else {
        console.log('⚠️ 响应中没有内容')
      }
    } else {
      console.log('\n❌ API调用失败:', data.error)
      if (data.debug) {
        console.log('🔍 调试信息:', data.debug)
      }
    }
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message)
    console.error('堆栈:', error.stack)
  }
}

testChatAPI()
