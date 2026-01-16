#!/usr/bin/env node

/**
 * Index Health 周报生成器 V2
 * 
 * 生成 Notion/Sheet 格式的周报
 * 包含阈值和行动建议
 * 
 * 使用方法：
 * node scripts/generate-index-health-report-v2.js
 */

require('dotenv').config({ path: '.env.local' })
const fs = require('fs')
const path = require('path')

// 注意：由于这是 JS 文件，需要直接实现或使用 ts-node/tsx
// 这里我们直接实现核心逻辑

// 默认数据（实际使用时应该从 Google Search Console API 获取）
const defaultData = {
  impressions: {
    current: 1139,
    previous: 1050,
  },
  clicks: {
    current: 89,
    previous: 76,
  },
  ctr: {
    current: 0.078,
    previous: 0.072,
  },
  avgPosition: {
    current: 13.1,
    previous: 14.2,
  },
  discovered: 25462,
  crawled: 18000,
  indexed: 6500,
  crawlErrors5xx: 0,
  avgResponseTime: 320,
  crawlVolume: 850,
  coverageIssues: [
    {
      reason: 'Duplicate, Google chose different canonical',
      currentCount: 1200,
      previousCount: 1150,
      action: '优先修 canonical & 去重',
    },
    {
      reason: 'Crawled – currently not indexed',
      currentCount: 850,
      previousCount: 920,
      action: '收缩到 Tier1 + 加差异化段落（Industry Constraints）',
    },
    {
      reason: 'Discovered – currently not indexed',
      currentCount: 650,
      previousCount: 580,
      action: '分层 sitemap + 降发布频率',
    },
    {
      reason: 'Blocked by robots.txt',
      currentCount: 0,
      previousCount: 0,
      action: '无',
    },
    {
      reason: 'Soft 404',
      currentCount: 45,
      previousCount: 38,
      action: '直接剔除出 sitemap',
    },
  ],
  tier1: {
    submitted: 10000,
    indexed: 6500,
    indexedRate: 0.65,
    topQueries: [
      { query: 'how to use ai video for healthcare', impressions: 89 },
      { query: 'ai video for retail use case', impressions: 67 },
      { query: 'can ai video be used in education', impressions: 54 },
      { query: 'best ai video tool', impressions: 43 },
      { query: 'sora alternative', impressions: 38 },
      { query: 'text to video ai', impressions: 32 },
    ],
    topPages: [
      { url: '/use-cases/ai-video-healthcare-patient-education', impressions: 156 },
      { url: '/use-cases/ai-video-retail-product-demo', impressions: 134 },
      { url: '/use-cases/ai-video-education-explainer', impressions: 98 },
    ],
  },
}

function main() {
  console.log('📊 生成 Index Health 周报 V2...\n')

  // 检查是否有数据文件
  const dataFile = path.join(__dirname, '../data/index-health-data.json')
  let data = defaultData

  if (fs.existsSync(dataFile)) {
    try {
      const fileData = JSON.parse(fs.readFileSync(dataFile, 'utf8'))
      data = { ...defaultData, ...fileData }
      console.log('✅ 从文件加载数据:', dataFile)
    } catch (error) {
      console.warn('⚠️  无法读取数据文件，使用默认数据:', error.message)
    }
  } else {
    console.log('ℹ️  使用默认数据（创建 data/index-health-data.json 可自定义）')
  }

  // 生成报告
  const weekDate = new Date().toISOString().split('T')[0]
  const report = generateIndexHealthReport(data, weekDate)
  const csv = generateIndexHealthCSV(data, weekDate)

  // 保存报告
  const reportDir = path.join(__dirname, '../reports')
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true })
  }

  const reportFile = path.join(reportDir, `index-health-${weekDate}.md`)
  const csvFile = path.join(reportDir, `index-health-${weekDate}.csv`)

  fs.writeFileSync(reportFile, report, 'utf8')
  fs.writeFileSync(csvFile, csv, 'utf8')

  console.log('✅ Markdown 报告已生成:', reportFile)
  console.log('✅ CSV 报告已生成:', csvFile)
  console.log('\n📋 报告预览:')
  console.log('─'.repeat(60))
  console.log(report.split('\n').slice(0, 30).join('\n'))
  console.log('─'.repeat(60))
  console.log('\n💡 提示:')
  console.log('  - Markdown 文件可导入 Notion')
  console.log('  - CSV 文件可导入 Google Sheets')
  console.log('  - 编辑 data/index-health-data.json 可自定义数据')
}

if (require.main === module) {
  main()
}

module.exports = { main }
