/**
 * 测试聊天 API 调用
 * 运行: node scripts/test-chat-api.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const grsaiApiKey = process.env.GRSAI_API_KEY
const grsaiChatHost = 'https://api.grsai.com'

console.log('🧪 测试聊天 API...\n')

// 1. 检查环境变量
console.log('1. 检查环境变量:')
console.log(`   NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅ 已设置' : '❌ 未设置'}`)
console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? '✅ 已设置' : '❌ 未设置'}`)
console.log(`   GRSAI_API_KEY: ${grsaiApiKey ? '✅ 已设置' : '❌ 未设置'}`)
console.log('')

if (!grsaiApiKey) {
  console.error('❌ GRSAI_API_KEY 未设置，无法测试 API')
  process.exit(1)
}

// 2. 测试 Gemini API 连接
async function testGeminiApi() {
  console.log('2. 测试 Gemini API 连接:')
  try {
    const response = await fetch(`${grsaiChatHost}/v1/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${grsaiApiKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      const data = await response.json()
      console.log('   ✅ API 连接成功')
      console.log(`   状态: ${response.status}`)
      if (data.data && Array.isArray(data.data)) {
        console.log(`   可用模型数: ${data.data.length}`)
      }
    } else {
      const errorText = await response.text()
      console.log('   ❌ API 连接失败')
      console.log(`   状态: ${response.status} ${response.statusText}`)
      console.log(`   错误: ${errorText.substring(0, 200)}`)
    }
  } catch (error) {
    console.log('   ❌ API 连接失败')
    console.log(`   错误: ${error.message}`)
  }
  console.log('')
}

// 3. 测试发送消息
async function testSendMessage() {
  console.log('3. 测试发送消息:')
  try {
    const response = await fetch(`${grsaiChatHost}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${grsaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gemini-2-flash',
        stream: false,
        messages: [
          { role: 'user', content: 'Hello, this is a test message' },
        ],
      }),
    })

    const data = await response.json()

    if (response.ok) {
      if (data.choices && data.choices.length > 0 && data.choices[0].message?.content) {
        console.log('   ✅ 消息发送成功')
        console.log(`   模型: ${data.model || 'N/A'}`)
        console.log(`   响应长度: ${data.choices[0].message.content.length} 字符`)
        console.log(`   内容预览: ${data.choices[0].message.content.substring(0, 100)}...`)
      } else {
        console.log('   ⚠️  API 返回成功但内容为空')
        console.log(`   完整响应: ${JSON.stringify(data, null, 2)}`)
      }
    } else {
      console.log('   ❌ 消息发送失败')
      console.log(`   状态: ${response.status} ${response.statusText}`)
      console.log(`   错误: ${JSON.stringify(data, null, 2)}`)
    }
  } catch (error) {
    console.log('   ❌ 消息发送失败')
    console.log(`   错误: ${error.message}`)
  }
  console.log('')
}

// 运行测试
async function runTests() {
  await testGeminiApi()
  await testSendMessage()
  
  console.log('✅ 测试完成')
}

runTests().catch(console.error)

