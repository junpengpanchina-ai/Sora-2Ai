#!/usr/bin/env node

/**
 * Index Health 周报生成器
 * 
 * 生成每周的 Index Health 报告，包含：
 * - 核心总览（4 个关键指标）
 * - Tier 分层健康度
 * - 查询信号分析
 * - 决策表（是否允许动内容）
 * 
 * 使用方法：
 * 1. 从 Google Search Console 手动获取数据（或未来集成 API）
 * 2. 运行: node scripts/generate-index-health-report.js
 * 3. 查看生成的报告
 */

const fs = require('fs')
const path = require('path')

// 配置：可以从环境变量或配置文件读取
const CONFIG = {
  siteUrl: process.env.SITE_URL || 'sora2aivideos.com',
  reportDate: new Date().toISOString().split('T')[0],
  // 阈值配置
  thresholds: {
    indexedPagesTier1: 0.6, // 60%
    avgPositionTier1: 20,
    aiStyleQueriesMin: 0.15, // 15%
  },
}

/**
 * 生成周报内容
 */
function generateReport(data) {
  const {
    // 核心总览数据
    indexedPagesTier1 = { current: 0, total: 0, lastWeek: 0 },
    avgPositionTier1 = { current: 0, lastWeek: 0 },
    impressionsTier1 = { current: 0, lastWeek: 0 },
    aiStyleQueriesPercent = { current: 0, lastWeek: 0 },
    
    // Tier 分层数据
    tierStats = {
      tier1: { total: 0, indexed: 0 },
      tier2: { total: 0, indexed: 0 },
      tier3: { total: 0, indexed: 0 },
    },
    
    // 查询信号数据
    querySignals = {
      aiStyle: [],
      seoStyle: [],
      marketingStyle: [],
    },
  } = data

  // 计算指标
  const indexedRate = indexedPagesTier1.total > 0 
    ? (indexedPagesTier1.current / indexedPagesTier1.total) 
    : 0
  
  const indexedRateLastWeek = indexedPagesTier1.total > 0
    ? (indexedPagesTier1.lastWeek / indexedPagesTier1.total)
    : 0
  
  const indexedTrend = indexedPagesTier1.current > indexedPagesTier1.lastWeek ? '↑' 
    : indexedPagesTier1.current < indexedPagesTier1.lastWeek ? '↓' 
    : '→'
  
  const positionTrend = avgPositionTier1.current < avgPositionTier1.lastWeek ? '↑' 
    : avgPositionTier1.current > avgPositionTier1.lastWeek ? '↓' 
    : '→'
  
  const impressionsTrend = impressionsTier1.current > impressionsTier1.lastWeek ? '↑' 
    : impressionsTier1.current < impressionsTier1.lastWeek ? '↓' 
    : '→'
  
  const aiQueriesTrend = aiStyleQueriesPercent.current > aiStyleQueriesPercent.lastWeek ? '↑' 
    : aiStyleQueriesPercent.current < aiStyleQueriesPercent.lastWeek ? '↓' 
    : '→'

  // 判断健康状态
  const isHealthy = indexedRate >= CONFIG.thresholds.indexedPagesTier1 && 
    impressionsTier1.current > impressionsTier1.lastWeek
  
  const healthStatus = isHealthy ? '🟢 健康' 
    : indexedRate >= 0.4 && indexedRate < 0.6 ? '🟡 观察' 
    : '🔴 风险'

  // 生成报告
  const report = `# Index Health Weekly Report – ${CONFIG.siteUrl}

**报告日期**: ${CONFIG.reportDate}  
**生成时间**: ${new Date().toLocaleString()}

---

## ① 核心总览（只看 4 个数）

👉 **这是"生死指标"，不达标就不动内容**

| 指标 | 当前值 | 上周 | 阈值 | 解读 |
|------|--------|------|------|------|
| **Indexed Pages（Tier1）** | ${indexedPagesTier1.current} / ${indexedPagesTier1.total} (${(indexedRate * 100).toFixed(1)}%) | ${indexedTrend} | ≥60% | ${indexedRate >= CONFIG.thresholds.indexedPagesTier1 ? '✅ 达标' : '❌ 低于阈值'} |
| **Avg Position（Tier1）** | ${avgPositionTier1.current.toFixed(1)} | ${positionTrend} | ≤20 | ${avgPositionTier1.current <= CONFIG.thresholds.avgPositionTier1 ? '✅ 达标' : '❌ 高于阈值'} |
| **Impressions（Tier1）** | ${impressionsTier1.current.toLocaleString()} | ${impressionsTrend} | 连续↑ | ${impressionsTrend === '↑' ? '✅ 上升趋势' : impressionsTrend === '→' ? '🟡 持平' : '❌ 下降'} |
| **AI-Style Queries 占比** | ${(aiStyleQueriesPercent.current * 100).toFixed(1)}% | ${aiQueriesTrend} | ≥15% | ${aiStyleQueriesPercent.current >= CONFIG.thresholds.aiStyleQueriesMin ? '✅ 达标' : '❌ 低于阈值'} |

### 🚦 一眼判断（最重要）

**${healthStatus}**

${isHealthy 
  ? `- ✅ Index ≥60% 且 Impressions 连续 2 周↑ → **继续发 Tier1**`
  : indexedRate >= 0.4 && indexedRate < 0.6
  ? `- 🟡 Index 40–59% → **暂停新增，调 sitemap**`
  : `- 🔴 Index <40% → **立刻停发，绝不改结构**`}

⚠️ **注意**：
- 流量低 ≠ 问题
- Index Health 低 = 真问题

---

## ② Tier 分层健康度（只看比例）

| Tier | 页面数 | Indexed | Index Rate | 行动 |
|------|--------|---------|-------------|------|
| **Tier 1** | ${tierStats.tier1.total.toLocaleString()} | ${tierStats.tier1.indexed.toLocaleString()} | ${tierStats.tier1.total > 0 ? ((tierStats.tier1.indexed / tierStats.tier1.total) * 100).toFixed(1) : 0}% | ${tierStats.tier1.total > 0 && (tierStats.tier1.indexed / tierStats.tier1.total) >= 0.6 ? '✅ 继续' : '🟡 不急'} |
| **Tier 2** | ${tierStats.tier2.total.toLocaleString()} | ${tierStats.tier2.indexed.toLocaleString()} | ${tierStats.tier2.total > 0 ? ((tierStats.tier2.indexed / tierStats.tier2.total) * 100).toFixed(1) : 0}% | 🟡 不急 |
| **Tier 3** | ${tierStats.tier3.total.toLocaleString()} | ${tierStats.tier3.indexed.toLocaleString()} | ${tierStats.tier3.total > 0 ? ((tierStats.tier3.indexed / tierStats.tier3.total) * 100).toFixed(1) : 0}% | ❌ 不管 |

**规则**：
- 你只对 **Tier1** 负责
- Tier2 是"未来资产"
- Tier3 只是"噪声缓冲层"

---

## ③ 查询信号（是不是 AI 在"看你"）

GSC → 搜索结果 → 查询 → 筛选 **非品牌词**

### ✅ AI 偏好型（好信号）

${querySignals.aiStyle.length > 0 
  ? querySignals.aiStyle.slice(0, 5).map(q => `- "${q}"`).join('\n')
  : '- （暂无数据）'}

### ⚠️ SEO 偏好型（中性）

${querySignals.seoStyle.length > 0 
  ? querySignals.seoStyle.slice(0, 5).map(q => `- "${q}"`).join('\n')
  : '- （暂无数据）'}

### ❌ 营销型（不重要）

${querySignals.marketingStyle.length > 0 
  ? querySignals.marketingStyle.slice(0, 5).map(q => `- "${q}"`).join('\n')
  : '- （暂无数据）'}

### 📌 周报里只写一句话：

**"AI-style queries 本周占比 ${(aiStyleQueriesPercent.current * 100).toFixed(1)}%，较上周 ${aiQueriesTrend === '↑' ? '上升' : aiQueriesTrend === '↓' ? '下降' : '持平'}"**

---

## ④ 本周是否允许"动内容"？（决策表）

| Index Health | 行动 |
|--------------|------|
| ≥60% | ✅ **继续发布 Tier1** |
| 50–59% | ⏸ **减半发布** |
| 40–49% | ⛔ **停发，等 2 周** |
| <40% | ⛔ **停发 + 不准改结构** |

**当前决策**: ${indexedRate >= 0.6 ? '✅ 继续发布 Tier1' 
  : indexedRate >= 0.5 ? '⏸ 减半发布' 
  : indexedRate >= 0.4 ? '⛔ 停发，等 2 周' 
  : '⛔ 停发 + 不准改结构'} (Index Rate: ${(indexedRate * 100).toFixed(1)}%)

❌ **任何情况下**：不准删 FAQ、不准缩短 Answer-first

---

## ⑤ 一句话总结（给自己看的）

**"本周 Google 是否在'消化'我们的知识库？"**

${isHealthy ? '✅ **是** - Google 正在消化，继续发布 Tier1' 
  : indexedRate >= 0.4 ? '🟡 **需要等待** - Index 率在观察区间，暂停新增' 
  : '❌ **否** - Index 率过低，立刻停发并检查结构'}

---

## 📊 数据来源说明

- **Indexed Pages**: Google Search Console → 索引 → 网页
- **Avg Position**: Google Search Console → 效果 → 平均排名（筛选 Tier1 页面）
- **Impressions**: Google Search Console → 效果 → 展示次数（筛选 Tier1 页面）
- **AI-Style Queries**: Google Search Console → 效果 → 查询（手动筛选 AI 偏好型查询）

---

**生成时间**: ${new Date().toISOString()}  
**下次更新**: ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
`

  return report
}

/**
 * 主函数
 */
function main() {
  console.log('📊 生成 Index Health 周报...\n')

  // 默认数据（实际使用时应该从 Google Search Console 获取）
  const defaultData = {
    indexedPagesTier1: {
      current: 6500,
      total: 10000,
      lastWeek: 6200,
    },
    avgPositionTier1: {
      current: 13.1,
      lastWeek: 14.2,
    },
    impressionsTier1: {
      current: 1139,
      lastWeek: 1050,
    },
    aiStyleQueriesPercent: {
      current: 0.18, // 18%
      lastWeek: 0.15, // 15%
    },
    tierStats: {
      tier1: { total: 10000, indexed: 6500 },
      tier2: { total: 35000, indexed: 14000 },
      tier3: { total: 65000, indexed: 12000 },
    },
    querySignals: {
      aiStyle: [
        'how to use ai video for healthcare',
        'ai video for retail use case',
        'can ai video be used in education',
      ],
      seoStyle: [
        'best ai video tool',
        'sora alternative',
        'text to video ai',
      ],
      marketingStyle: [
        'cheap ai video',
        'discount sora',
      ],
    },
  }

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
  const report = generateReport(data)

  // 保存报告
  const reportDir = path.join(__dirname, '../reports')
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true })
  }

  const reportFile = path.join(reportDir, `index-health-${CONFIG.reportDate}.md`)
  fs.writeFileSync(reportFile, report, 'utf8')

  console.log('✅ 报告已生成:', reportFile)
  console.log('\n📋 报告预览:')
  console.log('─'.repeat(60))
  console.log(report.split('\n').slice(0, 30).join('\n'))
  console.log('─'.repeat(60))
  console.log('\n💡 提示: 编辑 data/index-health-data.json 可自定义数据')
}

if (require.main === module) {
  main()
}

module.exports = { generateReport }
