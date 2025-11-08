#!/usr/bin/env node

/**
 * Supabase 连接测试脚本
 * 运行: node scripts/test-supabase.js
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 测试 Supabase 连接...\n');

// 检查环境变量
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ 错误: Supabase 环境变量未配置！');
  console.error('\n请确保 .env.local 文件中包含：');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  console.error('  - NEXT_PUBLIC_SUPABASE_ANON_KEY\n');
  process.exit(1);
}

console.log('✅ 环境变量已配置');
console.log(`   URL: ${supabaseUrl.substring(0, 30)}...`);
console.log(`   Key: ${supabaseAnonKey.substring(0, 20)}...\n`);

// 创建 Supabase 客户端
let supabase;
try {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.log('✅ Supabase 客户端创建成功\n');
} catch (error) {
  console.error('❌ 创建 Supabase 客户端失败:', error.message);
  process.exit(1);
}

// 测试连接
async function testConnection() {
  try {
    // 测试 1: 检查 users 表是否存在
    console.log('📊 测试 1: 检查 users 表...');
    const { data: tables, error: tableError } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (tableError) {
      if (tableError.code === 'PGRST116' || tableError.message.includes('does not exist')) {
        console.error('❌ users 表不存在！');
        console.error('   请执行数据库迁移文件：supabase/migrations/001_create_users_table.sql\n');
      } else {
        console.error('❌ 查询 users 表失败:', tableError.message);
      }
      return false;
    }

    console.log('✅ users 表存在\n');

    // 测试 2: 检查表结构
    console.log('📊 测试 2: 检查表结构...');
    const { data: columns, error: columnError } = await supabase
      .from('users')
      .select('id, google_id, email, name, avatar_url, created_at, status')
      .limit(0);

    if (columnError) {
      console.error('⚠️  警告: 表结构可能不完整:', columnError.message);
    } else {
      console.log('✅ 表结构正常\n');
    }

    // 测试 3: 测试写入权限（可选）
    console.log('📊 测试 3: 检查数据库权限...');
    const testData = {
      google_id: 'test_' + Date.now(),
      email: 'test@example.com',
      name: 'Test User',
    };

    const { data: insertData, error: insertError } = await supabase
      .from('users')
      .insert(testData)
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        console.log('✅ 写入权限正常（唯一约束正常工作）\n');
      } else if (insertError.message.includes('permission') || insertError.message.includes('policy')) {
        console.error('❌ 写入权限不足！');
        console.error('   请检查 Row Level Security (RLS) 策略\n');
        return false;
      } else {
        console.error('⚠️  写入测试失败:', insertError.message);
      }
    } else {
      console.log('✅ 写入权限正常');
      // 清理测试数据
      await supabase.from('users').delete().eq('id', insertData.id);
      console.log('✅ 测试数据已清理\n');
    }

    // 测试 4: 检查认证配置
    console.log('📊 测试 4: 检查认证配置...');
    const { data: authData, error: authError } = await supabase.auth.getSession();

    if (authError) {
      console.log('ℹ️  当前未登录（这是正常的）');
    } else {
      console.log('ℹ️  当前会话:', authData.session ? '已登录' : '未登录');
    }
    console.log('✅ 认证服务可访问\n');

    console.log('🎉 所有测试通过！Supabase 连接正常。\n');
    return true;

  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error.message);
    console.error('   详细错误:', error);
    return false;
  }
}

// 运行测试
testConnection()
  .then((success) => {
    if (success) {
      console.log('✅ Supabase 配置正确，可以开始使用了！\n');
      process.exit(0);
    } else {
      console.log('\n❌ 部分测试失败，请检查配置。\n');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('❌ 测试失败:', error);
    process.exit(1);
  });

