/**
 * Index Health 周报生成器
 * 
 * 生成 Notion/Sheet 格式的周报
 * 包含阈值和行动建议
 */

export interface IndexHealthData {
  // 站点健康总览
  impressions: { current: number; previous: number }
  clicks: { current: number; previous: number }
  ctr: { current: number; previous: number }
  avgPosition: { current: number; previous: number }
  
  // 索引覆盖
  discovered: number
  crawled: number
  indexed: number
  
  // Crawl stats
  crawlErrors5xx: number
  avgResponseTime: number
  crawlVolume: number
  
  // Coverage Top 原因
  coverageIssues: Array<{
    reason: string
    currentCount: number
    previousCount: number
    action: string
  }>
  
  // Tier1 专项
  tier1: {
    submitted: number
    indexed: number
    indexedRate: number
    topQueries: Array<{ query: string; impressions: number }>
    topPages: Array<{ url: string; impressions: number }>
  }
}

/**
 * 生成 Markdown 格式的周报（可导入 Notion）
 */
export function generateIndexHealthReport(data: IndexHealthData, weekDate: string): string {
  const impressionsTrend = data.impressions.current > data.impressions.previous ? '↑' 
    : data.impressions.current < data.impressions.previous ? '↓' 
    : '→'
  
  // const clicksTrend = data.clicks.current > data.clicks.previous ? '↑'
  //   : data.clicks.current < data.clicks.previous ? '↓'
  //   : '→'
  
  const indexedRate = data.discovered > 0 ? (data.indexed / data.discovered) : 0
  const tier1IndexedRate = data.tier1.submitted > 0 ? (data.tier1.indexed / data.tier1.submitted) : 0
  
  // 健康判断
  const isHealthy = indexedRate >= 0.4 && 
    data.impressions.current > data.impressions.previous &&
    tier1IndexedRate >= 0.6
  
  const healthStatus = isHealthy ? '🟢 健康'
    : indexedRate >= 0.2 ? '🟡 观察'
    : '🔴 风险'

  return `# Index Health Weekly Report – sora2aivideos.com

**报告日期**: ${weekDate}  
**生成时间**: ${new Date().toISOString()}

---

## ① 核心总览（只看 4 个数）

👉 **这是"生死指标"，不达标就不动内容**

| 指标 | 当前值 | 上周 | 阈值 | 解读 |
|------|--------|------|------|------|
| **Indexed Pages（Tier1）** | ${data.tier1.indexed} / ${data.tier1.submitted} (${(tier1IndexedRate * 100).toFixed(1)}%) | ${impressionsTrend} | ≥60% | ${tier1IndexedRate >= 0.6 ? '✅ 达标' : '❌ 低于阈值'} |
| **Avg Position（Tier1）** | ${data.avgPosition.current.toFixed(1)} | ${data.avgPosition.current < data.avgPosition.previous ? '↑' : data.avgPosition.current > data.avgPosition.previous ? '↓' : '→'} | ≤20 | ${data.avgPosition.current <= 20 ? '✅ 达标' : '❌ 高于阈值'} |
| **Impressions（Tier1）** | ${data.impressions.current.toLocaleString()} | ${impressionsTrend} | 连续↑ | ${impressionsTrend === '↑' ? '✅ 上升趋势' : impressionsTrend === '→' ? '🟡 持平' : '❌ 下降'} |
| **AI-Style Queries 占比** | ${((data.tier1.topQueries.filter(q => isAIStyleQuery(q.query)).length / Math.max(1, data.tier1.topQueries.length)) * 100).toFixed(1)}% | ${impressionsTrend} | ≥15% | ${(data.tier1.topQueries.filter(q => isAIStyleQuery(q.query)).length / Math.max(1, data.tier1.topQueries.length)) >= 0.15 ? '✅ 达标' : '❌ 低于阈值'} |

### 🚦 一眼判断（最重要）

**${healthStatus}**

${isHealthy 
  ? `- ✅ Index ≥60% 且 Impressions 连续 2 周↑ → **继续发 Tier1**`
  : indexedRate >= 0.2
  ? `- 🟡 Index 20–40% → **暂停新增，调 sitemap**`
  : `- 🔴 Index <20% → **立刻停发，绝不改结构**`}

⚠️ **注意**：
- 流量低 ≠ 问题
- Index Health 低 = 真问题

---

## ② Tier 分层健康度（只看比例）

| Tier | 页面数 | Indexed | Index Rate | 行动 |
|------|--------|---------|-------------|------|
| **Tier 1** | ${data.tier1.submitted.toLocaleString()} | ${data.tier1.indexed.toLocaleString()} | ${(tier1IndexedRate * 100).toFixed(1)}% | ${tier1IndexedRate >= 0.6 ? '✅ 继续' : '🟡 不急'} |
| **Tier 2** | ${(data.discovered - data.tier1.submitted).toLocaleString()} | ${(data.indexed - data.tier1.indexed).toLocaleString()} | ${data.discovered > data.tier1.submitted ? (((data.indexed - data.tier1.indexed) / (data.discovered - data.tier1.submitted)) * 100).toFixed(1) : 0}% | 🟡 不急 |
| **Tier 3** | ${(data.discovered * 0.5).toLocaleString()} | ${(data.indexed * 0.2).toLocaleString()} | ${(20).toFixed(1)}% | ❌ 不管 |

**规则**：
- 你只对 **Tier1** 负责
- Tier2 是"未来资产"
- Tier3 只是"噪声缓冲层"

---

## ③ 查询信号（是不是 AI 在"看你"）

### ✅ AI 偏好型（好信号）

${data.tier1.topQueries.filter(q => isAIStyleQuery(q.query)).slice(0, 5).map(q => `- "${q.query}" (${q.impressions} impressions)`).join('\n') || '- （暂无数据）'}

### ⚠️ SEO 偏好型（中性）

${data.tier1.topQueries.filter(q => isSEOStyleQuery(q.query)).slice(0, 5).map(q => `- "${q.query}" (${q.impressions} impressions)`).join('\n') || '- （暂无数据）'}

### 📌 周报里只写一句话：

**"AI-style queries 本周占比 ${((data.tier1.topQueries.filter(q => isAIStyleQuery(q.query)).length / Math.max(1, data.tier1.topQueries.length)) * 100).toFixed(1)}%，较上周 ${impressionsTrend === '↑' ? '上升' : impressionsTrend === '↓' ? '下降' : '持平'}"**

---

## ④ 本周是否允许"动内容"？（决策表）

| Index Health | 行动 |
|--------------|------|
| ≥60% | ✅ **继续发布 Tier1** |
| 50–59% | ⏸ **减半发布** |
| 40–49% | ⛔ **停发，等 2 周** |
| <40% | ⛔ **停发 + 不准改结构** |

**当前决策**: ${tier1IndexedRate >= 0.6 ? '✅ 继续发布 Tier1' 
  : tier1IndexedRate >= 0.5 ? '⏸ 减半发布' 
  : tier1IndexedRate >= 0.4 ? '⛔ 停发，等 2 周' 
  : '⛔ 停发 + 不准改结构'} (Index Rate: ${(tier1IndexedRate * 100).toFixed(1)}%)

❌ **任何情况下**：不准删 FAQ、不准缩短 Answer-first

---

## ⑤ 一句话总结（给自己看的）

**"本周 Google 是否在'消化'我们的知识库？"**

${isHealthy ? '✅ **是** - Google 正在消化，继续发布 Tier1' 
  : indexedRate >= 0.2 ? '🟡 **需要等待** - Index 率在观察区间，暂停新增' 
  : '❌ **否** - Index 率过低，立刻停发并检查结构'}

---

## 📊 Coverage Top 原因（前 5）

${data.coverageIssues.slice(0, 5).map((issue, i) => `
${i + 1}. **${issue.reason}**
   - 本周: ${issue.currentCount}
   - 上周: ${issue.previousCount}
   - 处理: ${issue.action}
`).join('\n')}

---

## 📈 Crawl Stats

- **5xx 错误**: ${data.crawlErrors5xx} ${data.crawlErrors5xx === 0 ? '✅' : '❌'}
- **平均响应时间**: ${data.avgResponseTime}ms ${data.avgResponseTime < 500 ? '✅' : '⚠️'}
- **抓取量**: ${data.crawlVolume.toLocaleString()} 页/天

---

**生成时间**: ${new Date().toISOString()}  
**下次更新**: ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
`
}

/**
 * 判断是否为 AI 偏好型查询
 */
function isAIStyleQuery(query: string): boolean {
  const aiPatterns = [
    /how\s+to\s+use\s+ai\s+video\s+for/i,
    /ai\s+video\s+for\s+.*\s+use\s+case/i,
    /can\s+ai\s+video\s+be\s+used\s+in/i,
    /when\s+should\s+.*\s+not\s+use/i,
    /what\s+are\s+.*\s+limitations/i,
  ]
  return aiPatterns.some(pattern => pattern.test(query))
}

/**
 * 判断是否为 SEO 偏好型查询
 */
function isSEOStyleQuery(query: string): boolean {
  const seoPatterns = [
    /best\s+ai\s+video\s+tool/i,
    /sora\s+alternative/i,
    /text\s+to\s+video\s+ai/i,
  ]
  return seoPatterns.some(pattern => pattern.test(query))
}

/**
 * 生成 CSV 格式（可导入 Google Sheets）
 */
export function generateIndexHealthCSV(data: IndexHealthData): string {
  // const indexedRate = data.discovered > 0 ? (data.indexed / data.discovered) : 0
  const tier1IndexedRate = data.tier1.submitted > 0 ? (data.tier1.indexed / data.tier1.submitted) : 0
  
  const rows = [
    ['Metric', 'Current', 'Previous', 'Threshold', 'Status'],
    ['Indexed Pages (Tier1)', `${data.tier1.indexed}/${data.tier1.submitted}`, `${(tier1IndexedRate * 100).toFixed(1)}%`, '≥60%', tier1IndexedRate >= 0.6 ? '✅' : '❌'],
    ['Avg Position (Tier1)', data.avgPosition.current.toFixed(1), '', '≤20', data.avgPosition.current <= 20 ? '✅' : '❌'],
    ['Impressions (Tier1)', data.impressions.current.toString(), data.impressions.previous.toString(), '连续↑', data.impressions.current > data.impressions.previous ? '✅' : '❌'],
    ['AI-Style Queries %', `${((data.tier1.topQueries.filter(q => isAIStyleQuery(q.query)).length / Math.max(1, data.tier1.topQueries.length)) * 100).toFixed(1)}%`, '', '≥15%', (data.tier1.topQueries.filter(q => isAIStyleQuery(q.query)).length / Math.max(1, data.tier1.topQueries.length)) >= 0.15 ? '✅' : '❌'],
  ]
  
  return rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
}
