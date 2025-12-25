/**
 * 检查聊天功能所需的数据库表是否存在
 * 运行: node scripts/check-chat-tables.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少 Supabase 环境变量')
  console.log('请确保 .env.local 中包含:')
  console.log('  NEXT_PUBLIC_SUPABASE_URL=...')
  console.log('  SUPABASE_SERVICE_ROLE_KEY=...')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkTables() {
  console.log('🔍 检查聊天功能数据库表...\n')

  const tables = ['admin_chat_sessions', 'admin_chat_messages']

  for (const tableName of tables) {
    try {
      // 尝试查询表
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1)

      if (error) {
        if (error.code === '42P01') {
          // 表不存在
          console.log(`❌ ${tableName}: 表不存在`)
          console.log(`   需要运行迁移文件: supabase/migrations/041_create_admin_chat_history.sql`)
        } else {
          console.log(`⚠️  ${tableName}: 查询失败`)
          console.log(`   错误: ${error.message}`)
          console.log(`   错误代码: ${error.code}`)
        }
      } else {
        console.log(`✅ ${tableName}: 表存在且可访问`)
        console.log(`   样本数据: ${data ? data.length : 0} 条`)
      }
    } catch (err) {
      console.log(`❌ ${tableName}: 检查失败`)
      console.log(`   错误: ${err.message}`)
    }
    console.log('')
  }

  // 检查表结构
  console.log('📋 检查表结构...\n')
  
  try {
    const { data: sessionsColumns } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'admin_chat_sessions'
        ORDER BY ordinal_position;
      `
    }).catch(() => ({ data: null }))

    if (sessionsColumns) {
      console.log('admin_chat_sessions 表结构:')
      sessionsColumns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`)
      })
    } else {
      console.log('⚠️  无法获取表结构（可能需要使用 SQL Editor 手动检查）')
    }
  } catch (err) {
    console.log('⚠️  无法检查表结构:', err.message)
  }

  console.log('\n💡 如果表不存在，请在 Supabase Dashboard 的 SQL Editor 中运行:')
  console.log('   supabase/migrations/041_create_admin_chat_history.sql')
}

checkTables()
  .then(() => {
    console.log('\n✅ 检查完成')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ 检查失败:', error)
    process.exit(1)
  })

