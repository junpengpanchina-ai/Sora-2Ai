#!/usr/bin/env node

/**
 * Supabase 使用情况监控脚本
 * 用于检查数据库大小、带宽使用、连接数等指标
 * 
 * 使用方法：
 * node scripts/monitor-supabase-usage.js
 */

require('dotenv').config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ 错误: 缺少 Supabase 配置')
  console.error('请确保 .env.local 文件中包含:')
  console.error('  - NEXT_PUBLIC_SUPABASE_URL')
  console.error('  - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// 免费计划限制
const FREE_PLAN_LIMITS = {
  databaseSize: 500 * 1024 * 1024, // 500 MB
  bandwidth: 5 * 1024 * 1024 * 1024, // 5 GB
  storage: 1 * 1024 * 1024 * 1024, // 1 GB
  maxConnections: 60,
}

// Pro 计划限制
const PRO_PLAN_LIMITS = {
  databaseSize: 8 * 1024 * 1024 * 1024, // 8 GB
  bandwidth: 50 * 1024 * 1024 * 1024, // 50 GB
  storage: 100 * 1024 * 1024 * 1024, // 100 GB
  maxConnections: 200,
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

function formatPercentage(used, total) {
  const percentage = (used / total) * 100
  return `${percentage.toFixed(2)}%`
}

async function checkDatabaseSize() {
  try {
    const { createClient } = require('@supabase/supabase-js')
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    
    // 查询数据库大小（PostgreSQL）
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `
        SELECT 
          pg_database.datname,
          pg_size_pretty(pg_database_size(pg_database.datname)) AS size,
          pg_database_size(pg_database.datname) AS size_bytes
        FROM pg_database
        WHERE datname = current_database();
      `
    })
    
    if (error) {
      // 如果 RPC 不可用，尝试直接查询
      const { data: altData, error: altError } = await supabase
        .from('_prisma_migrations')
        .select('*')
        .limit(1)
      
      if (altError) {
        console.warn('⚠️  无法直接查询数据库大小，请通过 Supabase Dashboard 查看')
        return null
      }
    }
    
    return data
  } catch (error) {
    console.warn('⚠️  查询数据库大小失败:', error.message)
    return null
  }
}

async function checkTableSizes() {
  try {
    const { createClient } = require('@supabase/supabase-js')
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    
    // 查询各表大小
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `
        SELECT 
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
          pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
        LIMIT 10;
      `
    })
    
    if (error) {
      console.warn('⚠️  无法查询表大小')
      return null
    }
    
    return data
  } catch (error) {
    console.warn('⚠️  查询表大小失败:', error.message)
    return null
  }
}

async function checkConnectionCount() {
  try {
    const { createClient } = require('@supabase/supabase-js')
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    
    // 查询当前连接数
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `
        SELECT count(*) as connection_count
        FROM pg_stat_activity
        WHERE datname = current_database();
      `
    })
    
    if (error) {
      console.warn('⚠️  无法查询连接数')
      return null
    }
    
    return data?.[0]?.connection_count || 0
  } catch (error) {
    console.warn('⚠️  查询连接数失败:', error.message)
    return null
  }
}

async function checkStorageUsage() {
  try {
    const { createClient } = require('@supabase/supabase-js')
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    
    // 查询存储桶使用情况
    const { data: buckets, error } = await supabase.storage.listBuckets()
    
    if (error) {
      console.warn('⚠️  无法查询存储桶:', error.message)
      return null
    }
    
    let totalSize = 0
    const bucketSizes = []
    
    for (const bucket of buckets || []) {
      const { data: files } = await supabase.storage.from(bucket.name).list()
      let bucketSize = 0
      
      if (files) {
        for (const file of files) {
          if (file.metadata?.size) {
            bucketSize += file.metadata.size
          }
        }
      }
      
      totalSize += bucketSize
      bucketSizes.push({
        name: bucket.name,
        size: bucketSize,
        fileCount: files?.length || 0,
      })
    }
    
    return {
      total: totalSize,
      buckets: bucketSizes,
    }
  } catch (error) {
    console.warn('⚠️  查询存储使用情况失败:', error.message)
    return null
  }
}

async function main() {
  console.log('🔍 开始检查 Supabase 使用情况...\n')
  console.log('📊 Supabase 项目:', SUPABASE_URL.replace('https://', '').replace('.supabase.co', ''))
  console.log('')
  
  // 检查数据库大小
  console.log('📦 数据库大小:')
  const dbSize = await checkDatabaseSize()
  if (dbSize) {
    console.log('   ', dbSize)
  } else {
    console.log('   ⚠️  无法自动查询，请通过 Supabase Dashboard 查看')
    console.log('   📍 访问: https://supabase.com/dashboard/project/_/settings/database')
  }
  console.log('')
  
  // 检查表大小
  console.log('📋 主要表大小:')
  const tableSizes = await checkTableSizes()
  if (tableSizes && tableSizes.length > 0) {
    tableSizes.forEach((table, index) => {
      console.log(`   ${index + 1}. ${table.tablename}: ${table.size}`)
    })
  } else {
    console.log('   ⚠️  无法自动查询表大小')
  }
  console.log('')
  
  // 检查连接数
  console.log('🔌 数据库连接数:')
  const connectionCount = await checkConnectionCount()
  if (connectionCount !== null) {
    const percentage = formatPercentage(connectionCount, FREE_PLAN_LIMITS.maxConnections)
    const status = connectionCount >= FREE_PLAN_LIMITS.maxConnections * 0.8 ? '⚠️' : '✅'
    console.log(`   ${status} 当前连接: ${connectionCount} / ${FREE_PLAN_LIMITS.maxConnections} (${percentage})`)
    
    if (connectionCount >= FREE_PLAN_LIMITS.maxConnections * 0.8) {
      console.log('   ⚠️  警告: 连接数接近限制，建议考虑升级到 Pro 计划')
    }
  } else {
    console.log('   ⚠️  无法自动查询连接数')
  }
  console.log('')
  
  // 检查存储使用情况
  console.log('💾 存储使用情况:')
  const storageUsage = await checkStorageUsage()
  if (storageUsage) {
    const percentage = formatPercentage(storageUsage.total, FREE_PLAN_LIMITS.storage)
    const status = storageUsage.total >= FREE_PLAN_LIMITS.storage * 0.8 ? '⚠️' : '✅'
    console.log(`   ${status} 已使用: ${formatBytes(storageUsage.total)} / ${formatBytes(FREE_PLAN_LIMITS.storage)} (${percentage})`)
    
    if (storageUsage.buckets.length > 0) {
      console.log('   存储桶详情:')
      storageUsage.buckets.forEach(bucket => {
        console.log(`     - ${bucket.name}: ${formatBytes(bucket.size)} (${bucket.fileCount} 个文件)`)
      })
    }
    
    if (storageUsage.total >= FREE_PLAN_LIMITS.storage * 0.8) {
      console.log('   ⚠️  警告: 存储空间接近限制，建议考虑升级到 Pro 计划')
    }
  } else {
    console.log('   ⚠️  无法自动查询存储使用情况')
  }
  console.log('')
  
  // 总结和建议
  console.log('📊 免费计划限制:')
  console.log(`   - 数据库大小: ${formatBytes(FREE_PLAN_LIMITS.databaseSize)}`)
  console.log(`   - 带宽: ${formatBytes(FREE_PLAN_LIMITS.bandwidth)}/月`)
  console.log(`   - 存储: ${formatBytes(FREE_PLAN_LIMITS.storage)}`)
  console.log(`   - 最大连接数: ${FREE_PLAN_LIMITS.maxConnections}`)
  console.log('')
  
  console.log('💡 建议:')
  console.log('   1. 定期运行此脚本监控使用情况')
  console.log('   2. 在 Supabase Dashboard 查看详细使用情况:')
  console.log('      https://supabase.com/dashboard/project/_/settings/usage')
  console.log('   3. 如果接近限制，考虑升级到 Pro 计划 ($25/月)')
  console.log('   4. 优化数据库查询和连接使用')
  console.log('')
  
  console.log('✅ 检查完成!')
}

main().catch(error => {
  console.error('❌ 检查失败:', error)
  process.exit(1)
})

