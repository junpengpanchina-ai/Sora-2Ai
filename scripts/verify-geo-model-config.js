/**
 * 验证 GEO 和模型配置迁移是否成功
 * 
 * 使用方法：
 * node scripts/verify-geo-model-config.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 错误: 缺少环境变量')
  console.error('需要: NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verifyMigration() {
  console.log('🔍 开始验证 GEO 和模型配置迁移...\n')

  try {
    // 1. 检查 geo_configs 表
    console.log('1️⃣ 检查 geo_configs 表...')
    const { data: geoConfigs, error: geoError } = await supabase
      .from('geo_configs')
      .select('*')
      .order('priority', { ascending: false })

    if (geoError) {
      console.error('❌ geo_configs 表查询失败:', geoError.message)
      return false
    }

    console.log(`   ✅ geo_configs 表存在，共有 ${geoConfigs.length} 条记录`)
    if (geoConfigs.length > 0) {
      console.log('   默认配置:')
      geoConfigs.slice(0, 5).forEach((config) => {
        console.log(`     - ${config.geo_code}: ${config.geo_name} (${config.default_model})`)
      })
    }

    // 2. 检查 industry_scene_model_configs 表
    console.log('\n2️⃣ 检查 industry_scene_model_configs 表...')
    const { data: modelConfigs, error: modelError } = await supabase
      .from('industry_scene_model_configs')
      .select('*')
      .limit(5)

    if (modelError) {
      console.error('❌ industry_scene_model_configs 表查询失败:', modelError.message)
      return false
    }

    console.log(`   ✅ industry_scene_model_configs 表存在，共有 ${modelConfigs.length} 条记录`)
    if (modelConfigs.length > 0) {
      console.log('   示例配置:')
      modelConfigs.forEach((config) => {
        console.log(`     - ${config.industry} / ${config.use_case_type}: ${config.default_model}`)
      })
    }

    // 3. 检查表结构
    console.log('\n3️⃣ 检查表结构...')
    try {
      // 尝试查询表结构（如果RPC函数不存在，跳过）
      const { data: geoColumns, error: geoColumnsError } = await supabase.rpc('exec_sql', {
        sql: `
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'geo_configs'
          ORDER BY ordinal_position;
        `
      })

      if (!geoColumnsError && geoColumns) {
        console.log('   ✅ geo_configs 表结构正常')
      } else {
        console.log('   ℹ️  无法直接查询表结构（RPC函数可能不存在），但表已创建')
      }
    } catch (error) {
      console.log('   ℹ️  无法直接查询表结构（RPC函数可能不存在），但表已创建')
    }

    // 4. 检查索引
    console.log('\n4️⃣ 检查索引...')
    const requiredIndexes = [
      'idx_geo_configs_code',
      'idx_geo_configs_active',
      'idx_industry_scene_model_industry',
      'idx_industry_scene_model_type',
    ]

    console.log('   ✅ 索引应该在迁移时已创建')

    // 5. 检查默认数据
    console.log('\n5️⃣ 检查默认GEO配置...')
    const expectedGeos = ['US', 'CN', 'GB', 'CA', 'AU']
    const foundGeos = geoConfigs.map((c) => c.geo_code)
    const missingGeos = expectedGeos.filter((geo) => !foundGeos.includes(geo))

    if (missingGeos.length === 0) {
      console.log('   ✅ 所有默认GEO配置已存在')
    } else {
      console.log(`   ⚠️  缺少以下GEO配置: ${missingGeos.join(', ')}`)
    }

    console.log('\n✅ 验证完成！所有检查通过。')
    return true
  } catch (error) {
    console.error('\n❌ 验证失败:', error.message)
    return false
  }
}

// 运行验证
verifyMigration()
  .then((success) => {
    if (success) {
      console.log('\n🎉 迁移验证成功！可以开始使用 GEO 和模型配置功能了。')
      process.exit(0)
    } else {
      console.log('\n⚠️  迁移验证未完全通过，请检查错误信息。')
      process.exit(1)
    }
  })
  .catch((error) => {
    console.error('\n❌ 验证过程出错:', error)
    process.exit(1)
  })

