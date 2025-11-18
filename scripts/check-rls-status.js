#!/usr/bin/env node

/**
 * 检查 RLS 状态脚本
 * 用于检查哪些表已启用 RLS，哪些策略已创建
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

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

async function checkRLSStatus() {
  console.log('🔍 检查 RLS 状态...\n')

  const tables = [
    'users',
    'video_tasks',
    'recharge_records',
    'consumption_records',
    'after_sales_issues',
    'prompt_library',
    'admin_users',
    'admin_sessions',
  ]

  for (const table of tables) {
    try {
      // 查询 RLS 是否启用
      const { data, error } = await serviceClient.rpc('exec_sql', {
        sql: `
          SELECT 
            tablename,
            CASE 
              WHEN EXISTS (
                SELECT 1 
                FROM pg_tables 
                WHERE schemaname = 'public' 
                AND tablename = $1
              ) THEN
                (SELECT relrowsecurity 
                 FROM pg_class 
                 WHERE relname = $1 
                 AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public'))
              ELSE NULL
            END as rls_enabled
          FROM pg_tables 
          WHERE schemaname = 'public' 
          AND tablename = $1;
        `,
        params: [table],
      })

      // 使用直接 SQL 查询
      const { data: rlsData, error: rlsError } = await serviceClient
        .from('_realtime')
        .select('*')
        .limit(0)
        .then(() => {
          // 如果表存在，尝试查询 RLS 状态
          return serviceClient.rpc('exec_sql', {
            query: `
              SELECT 
                tablename,
                (SELECT relrowsecurity 
                 FROM pg_class 
                 WHERE relname = '${table}' 
                 AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) as rls_enabled
              FROM pg_tables 
              WHERE schemaname = 'public' 
              AND tablename = '${table}';
            `,
          })
        })
        .catch(() => ({ data: null, error: null }))

      // 更简单的方法：直接查询 pg_class
      const checkQuery = `
        SELECT 
          relname as table_name,
          relrowsecurity as rls_enabled
        FROM pg_class
        WHERE relname = '${table}'
        AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
      `

      // 使用 Supabase 的 REST API 直接查询（需要 service_role）
      console.log(`📋 检查表: ${table}`)
      
      // 尝试查询策略
      const policiesQuery = `
        SELECT 
          schemaname,
          tablename,
          policyname,
          permissive,
          roles,
          cmd,
          qual,
          with_check
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = '${table}';
      `

      // 由于 Supabase JS 客户端不支持直接执行 SQL，我们使用另一种方法
      // 尝试访问表，如果 RLS 启用但没有策略，会返回错误
      const { data: testData, error: testError } = await serviceClient
        .from(table)
        .select('*')
        .limit(0)

      if (testError) {
        if (testError.message.includes('permission denied') || testError.message.includes('RLS')) {
          console.log(`  ✅ RLS 已启用（有策略限制）`)
        } else {
          console.log(`  ⚠️  表访问错误: ${testError.message}`)
        }
      } else {
        // 如果能访问，检查是否有策略
        console.log(`  ⚠️  表可访问，需要检查 RLS 状态`)
        console.log(`     提示: 请在 Supabase Dashboard > Table Editor > ${table} > Settings 中检查 RLS 状态`)
      }
    } catch (err) {
      console.log(`  ❌ 检查失败: ${err.message}`)
    }
    console.log('')
  }

  console.log('💡 建议:')
  console.log('1. 访问 Supabase Dashboard > SQL Editor')
  console.log('2. 执行以下 SQL 查询检查 RLS 状态:')
  console.log(`
    SELECT 
      tablename,
      (SELECT relrowsecurity 
       FROM pg_class 
       WHERE relname = tablename 
       AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) as rls_enabled
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN ('users', 'video_tasks', 'recharge_records', 'consumption_records', 'after_sales_issues');
  `)
  console.log('')
  console.log('3. 检查策略:')
  console.log(`
    SELECT schemaname, tablename, policyname, cmd, roles
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename IN ('users', 'video_tasks', 'recharge_records', 'consumption_records', 'after_sales_issues');
  `)
}

checkRLSStatus().catch((err) => {
  console.error('❌ 检查失败:', err)
  process.exit(1)
})

