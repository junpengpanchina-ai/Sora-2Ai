require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少环境变量')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testUseCasesTable() {
  console.log('🔍 检查 use_cases 表...\n')

  try {
    // 测试 1: 检查表是否存在
    console.log('📊 测试 1: 检查表是否存在...')
    const { data, error } = await supabase
      .from('use_cases')
      .select('id')
      .limit(1)

    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        console.error('❌ use_cases 表不存在！')
        console.error('   请执行数据库迁移：supabase db push')
        console.error('   或手动执行：supabase/migrations/034_create_use_cases_table.sql\n')
        return false
      } else {
        console.error('❌ 查询失败:', error.message)
        console.error('   错误代码:', error.code)
        return false
      }
    }

    console.log('✅ use_cases 表存在\n')

    // 测试 2: 检查表结构
    console.log('📊 测试 2: 检查表结构...')
    const { data: structure, error: structureError } = await supabase
      .from('use_cases')
      .select('id, slug, title, h1, description, content, use_case_type, is_published, created_at')
      .limit(0)

    if (structureError) {
      console.error('⚠️  警告: 表结构可能不完整:', structureError.message)
    } else {
      console.log('✅ 表结构正常\n')
    }

    // 测试 3: 查询数据
    console.log('📊 测试 3: 查询数据...')
    const { data: records, error: queryError } = await supabase
      .from('use_cases')
      .select('id, slug, title, is_published')
      .limit(5)

    if (queryError) {
      console.error('❌ 查询数据失败:', queryError.message)
      return false
    }

    console.log(`✅ 查询成功，找到 ${records?.length || 0} 条记录`)
    if (records && records.length > 0) {
      console.log('\n前几条记录:')
      records.forEach((record, index) => {
        console.log(`  ${index + 1}. ${record.title} (${record.slug}) - ${record.is_published ? '已发布' : '草稿'}`)
      })
    } else {
      console.log('  (表为空，这是正常的)')
    }
    console.log('')

    return true
  } catch (err) {
    console.error('❌ 测试失败:', err.message)
    return false
  }
}

testUseCasesTable()
  .then((success) => {
    if (success) {
      console.log('✅ 所有测试通过！')
      process.exit(0)
    } else {
      console.log('❌ 测试失败，请检查上述错误信息')
      process.exit(1)
    }
  })
  .catch((err) => {
    console.error('❌ 未预期的错误:', err)
    process.exit(1)
  })

