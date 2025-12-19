/**
 * 验证批量生成器保存的数据是否与数据库表结构完全匹配
 * 
 * 运行方式：
 * npx tsx scripts/verify-batch-generation-db.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少环境变量: NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifyBatchGenerationData() {
  console.log('🔍 开始验证批量生成器数据...\n')

  try {
    // 1. 检查表结构
    console.log('1. 检查 use_cases 表结构...')
    const { data: tableInfo, error: tableError } = await supabase
      .from('use_cases')
      .select('*')
      .limit(1)

    if (tableError) {
      console.error('❌ 无法访问 use_cases 表:', tableError.message)
      return
    }

    console.log('✅ use_cases 表存在\n')

    // 2. 检查最近生成的数据
    console.log('2. 检查最近生成的数据（最近 10 条）...')
    const { data: recentUseCases, error: fetchError } = await supabase
      .from('use_cases')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (fetchError) {
      console.error('❌ 获取数据失败:', fetchError.message)
      return
    }

    if (!recentUseCases || recentUseCases.length === 0) {
      console.log('⚠️  没有找到数据，请先运行批量生成')
      return
    }

    console.log(`✅ 找到 ${recentUseCases.length} 条数据\n`)

    // 3. 验证每条数据的字段完整性
    console.log('3. 验证数据字段完整性...\n')
    const requiredFields = [
      'slug',
      'title',
      'h1',
      'description',
      'content',
      'use_case_type',
      'is_published',
    ]

    const optionalFields = [
      'industry',
      'quality_status',
      'quality_score',
      'quality_issues',
      'seo_keywords',
      'created_by_admin_id',
    ]

    let allValid = true
    recentUseCases.forEach((useCase, index) => {
      console.log(`📄 数据 ${index + 1}: ${useCase.title?.substring(0, 50)}...`)
      
      // 检查必需字段
      const missingRequired = requiredFields.filter(field => !useCase[field as keyof typeof useCase])
      if (missingRequired.length > 0) {
        console.error(`   ❌ 缺少必需字段: ${missingRequired.join(', ')}`)
        allValid = false
      } else {
        console.log(`   ✅ 必需字段完整`)
      }

      // 显示可选字段
      const presentOptional = optionalFields.filter(field => useCase[field as keyof typeof useCase] !== null && useCase[field as keyof typeof useCase] !== undefined)
      if (presentOptional.length > 0) {
        console.log(`   📋 可选字段: ${presentOptional.join(', ')}`)
      }

      // 显示关键字段值
      console.log(`   - use_case_type: ${useCase.use_case_type}`)
      console.log(`   - industry: ${useCase.industry || '(null)'}`)
      console.log(`   - quality_status: ${useCase.quality_status || '(null)'}`)
      console.log(`   - quality_score: ${useCase.quality_score || '(null)'}`)
      console.log(`   - is_published: ${useCase.is_published}`)
      console.log('')
    })

    // 4. 统计字段完整性
    console.log('4. 数据统计...')
    const withIndustry = recentUseCases.filter(uc => uc.industry).length
    const withQualityStatus = recentUseCases.filter(uc => uc.quality_status).length
    const withQualityScore = recentUseCases.filter(uc => uc.quality_score !== null).length
    const published = recentUseCases.filter(uc => uc.is_published).length

    console.log(`   - 有 industry 字段: ${withIndustry}/${recentUseCases.length}`)
    console.log(`   - 有 quality_status 字段: ${withQualityStatus}/${recentUseCases.length}`)
    console.log(`   - 有 quality_score 字段: ${withQualityScore}/${recentUseCases.length}`)
    console.log(`   - 已发布: ${published}/${recentUseCases.length}`)

    // 5. 按使用场景类型分组统计
    console.log('\n5. 按使用场景类型分组统计...')
    const typeGroups: Record<string, number> = {}
    recentUseCases.forEach(uc => {
      const type = uc.use_case_type || 'unknown'
      typeGroups[type] = (typeGroups[type] || 0) + 1
    })
    Object.entries(typeGroups).forEach(([type, count]) => {
      console.log(`   - ${type}: ${count} 条`)
    })

    // 6. 按行业分组统计
    console.log('\n6. 按行业分组统计...')
    const industryGroups: Record<string, number> = {}
    recentUseCases.forEach(uc => {
      const industry = uc.industry || '(未设置)'
      industryGroups[industry] = (industryGroups[industry] || 0) + 1
    })
    Object.entries(industryGroups).forEach(([industry, count]) => {
      console.log(`   - ${industry}: ${count} 条`)
    })

    if (allValid) {
      console.log('\n✅ 所有数据验证通过！批量生成器与数据库完全匹配。')
    } else {
      console.log('\n⚠️  发现数据不完整，请检查批量生成器的保存逻辑。')
    }

  } catch (error) {
    console.error('❌ 验证过程出错:', error)
  }
}

verifyBatchGenerationData()

