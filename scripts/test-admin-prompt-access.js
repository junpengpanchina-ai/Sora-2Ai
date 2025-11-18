#!/usr/bin/env node

/**
 * 测试管理员访问提示词库
 * 验证 service_role 可以访问所有提示词（包括未发布的）
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少 Supabase 环境变量')
  console.error('请确保 .env.local 文件中包含：')
  console.error('  - NEXT_PUBLIC_SUPABASE_URL')
  console.error('  - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const serviceClient = createClient(supabaseUrl, supabaseServiceKey)

async function testAdminPromptAccess() {
  console.log('🔍 测试管理员访问提示词库...\n')

  // 测试 1: 获取所有提示词（包括未发布的）
  console.log('📋 测试 1: service_role 获取所有提示词（包括未发布的）')
  try {
    const { data, error } = await serviceClient
      .from('prompt_library')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(10)

    if (error) {
      console.log('  ❌ 失败：service_role 无法访问 prompt_library')
      console.log(`     错误信息: ${error.message}`)
      console.log('')
      console.log('💡 解决方案：')
      console.log('   1. 确保已执行迁移文件 010_add_rls_policies.sql')
      console.log('   2. 检查 prompt_library_service_role_all 策略是否存在')
      process.exit(1)
    } else {
      console.log('  ✅ 成功：service_role 可以访问 prompt_library')
      console.log(`     返回记录数: ${data?.length || 0}`)
      
      if (data && data.length > 0) {
        const published = data.filter(p => p.is_published).length
        const unpublished = data.filter(p => !p.is_published).length
        console.log(`     已发布: ${published}`)
        console.log(`     未发布: ${unpublished}`)
        
        if (unpublished > 0) {
          console.log('  ✅ 正确：可以访问未发布的提示词（管理员功能正常）')
        }
      }
    }
  } catch (err) {
    console.log('  ❌ 失败：访问 prompt_library 时出错')
    console.log(`     错误: ${err.message}`)
    process.exit(1)
  }
  console.log('')

  // 测试 2: 创建新提示词
  console.log('📋 测试 2: service_role 创建新提示词')
  try {
    const testPrompt = {
      title: `Test Prompt ${Date.now()}`,
      description: 'Test description',
      prompt: 'Test prompt content',
      category: 'nature',
      difficulty: 'beginner',
      locale: 'en',
      tags: ['test'],
      is_published: false,
    }

    const { data, error } = await serviceClient
      .from('prompt_library')
      .insert(testPrompt)
      .select('*')
      .single()

    if (error) {
      console.log('  ❌ 失败：service_role 无法创建提示词')
      console.log(`     错误信息: ${error.message}`)
    } else {
      console.log('  ✅ 成功：service_role 可以创建提示词')
      console.log(`     创建的提示词 ID: ${data.id}`)
      
      // 清理测试数据
      await serviceClient
        .from('prompt_library')
        .delete()
        .eq('id', data.id)
      console.log('     已清理测试数据')
    }
  } catch (err) {
    console.log('  ❌ 失败：创建提示词时出错')
    console.log(`     错误: ${err.message}`)
  }
  console.log('')

  // 测试 3: 更新提示词
  console.log('📋 测试 3: service_role 更新提示词')
  try {
    // 先获取一个提示词
    const { data: prompts } = await serviceClient
      .from('prompt_library')
      .select('id')
      .limit(1)

    if (prompts && prompts.length > 0) {
      const promptId = prompts[0].id
      const { data, error } = await serviceClient
        .from('prompt_library')
        .update({ description: 'Updated description' })
        .eq('id', promptId)
        .select('*')
        .single()

      if (error) {
        console.log('  ❌ 失败：service_role 无法更新提示词')
        console.log(`     错误信息: ${error.message}`)
      } else {
        console.log('  ✅ 成功：service_role 可以更新提示词')
        console.log(`     更新的提示词 ID: ${data.id}`)
      }
    } else {
      console.log('  ⚠️  跳过：没有可用的提示词进行测试')
    }
  } catch (err) {
    console.log('  ❌ 失败：更新提示词时出错')
    console.log(`     错误: ${err.message}`)
  }
  console.log('')

  console.log('✅ 所有测试完成！')
  console.log('')
  console.log('📊 总结：')
  console.log('  如果所有测试都通过，说明管理员可以正常访问提示词库')
  console.log('  如果测试失败，请检查：')
  console.log('    1. 是否已执行迁移文件 010_add_rls_policies.sql')
  console.log('    2. prompt_library_service_role_all 策略是否存在')
  console.log('    3. service_role key 是否正确配置')
}

testAdminPromptAccess().catch((err) => {
  console.error('❌ 测试执行失败:', err)
  process.exit(1)
})

