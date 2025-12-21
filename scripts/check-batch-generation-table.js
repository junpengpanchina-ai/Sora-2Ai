#!/usr/bin/env node

/**
 * 检查 batch_generation_tasks 表是否存在
 * 使用方法: node scripts/check-batch-generation-table.js
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  console.error('❌ 缺少 NEXT_PUBLIC_SUPABASE_URL')
  process.exit(1)
}

if (!supabaseServiceKey) {
  console.error('❌ 缺少 SUPABASE_SERVICE_ROLE_KEY')
  console.error('请从 Supabase Dashboard > Settings > API 获取 service_role key')
  process.exit(1)
}

const serviceClient = createClient(supabaseUrl, supabaseServiceKey)

async function checkTable() {
  console.log('🔍 检查 batch_generation_tasks 表...\n')

  try {
    // 尝试查询表是否存在
    const { data, error } = await serviceClient
      .from('batch_generation_tasks')
      .select('id')
      .limit(1)

    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        console.error('❌ 表不存在！')
        console.error(`   错误代码: ${error.code}`)
        console.error(`   错误信息: ${error.message}`)
        console.error('\n📋 解决方案:')
        console.error('   1. 打开 Supabase Dashboard: https://supabase.com/dashboard')
        console.error('   2. 选择项目: Sora AI Platform')
        console.error('   3. 进入 SQL Editor > New query')
        console.error('   4. 复制并执行 supabase/migrations/038_create_batch_generation_tasks.sql 中的 SQL')
        console.error('   5. 或者查看 DATABASE_MIGRATION_BATCH_GENERATION_TASKS.md 获取详细说明')
        process.exit(1)
      } else {
        console.error('❌ 查询表时出错:')
        console.error(`   错误代码: ${error.code}`)
        console.error(`   错误信息: ${error.message}`)
        if (error.hint) {
          console.error(`   提示: ${error.hint}`)
        }
        process.exit(1)
      }
    } else {
      console.log('✅ 表存在！')
      console.log(`   表名: batch_generation_tasks`)
      console.log(`   查询结果: ${data ? '可以正常查询' : '表为空'}`)
      
      // 检查表结构
      try {
        const { data: countData, error: countError } = await serviceClient
          .from('batch_generation_tasks')
          .select('*', { count: 'exact', head: true })
        
        if (!countError) {
          console.log(`   记录数: ${countData || 0}`)
        }
      } catch (e) {
        // 忽略计数错误
      }
      
      console.log('\n✅ 数据库表检查通过，可以正常使用批量生成功能！')
      process.exit(0)
    }
  } catch (error) {
    console.error('❌ 检查表时发生异常:')
    console.error(error)
    process.exit(1)
  }
}

checkTable()

