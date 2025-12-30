# GEO × Index Health 自动排产表（最终执行版）

> **一句话目标**：  
> 👉 不靠感觉  
> 👉 不追热点  
> 👉 自动判断「先发谁、慢发谁、暂停谁」

---

## 🧠 你现在只需要维护 3 个分数

### ① GEO 命中率（内容层）

**范围**：0–100

| 分数 | 含义 | 说明 |
|------|------|------|
| **≥80** | **G-A**（AI 可引用） | 主力内容 |
| **60–79** | **G-B**（可收录，但少引用） | 补充内容 |
| **<60** | **G-C**（填充层） | 禁止发布 |

👉 **你现在主力是 G-A v2，这是对的。**

---

### ② Index Health（索引层）

**计算公式**：
```
Index Health = Indexed / (Discovered + Crawled)
```

| 比例 | 状态 | 说明 |
|------|------|------|
| **≥60%** | 健康 | 可以放量 |
| **40–59%** | 消化中 | 限速期，需控制 |
| **<40%** | 风险 | 必须暂停 |

👉 **你现在 ≈ 45–55%（限速期）**

---

### ③ Trend Pressure（趋势压力值）⚠️

| 内容类型 | Pressure | 说明 |
|---------|----------|------|
| Evergreen 解释页 | **0** | 无趋势压力 |
| 行业场景页 | **+1** | 轻微趋势 |
| 趋势映射词（非热搜） | **+2** | 中等趋势 |
| 热搜 / 时效词 | **+4** | 高风险 |

**规则**：
- 当 **Index Health <60%**，总 Pressure **≤2**
- 当 **Index Health ≥60%**，总 Pressure **≤4**

---

## 📊 自动排产矩阵（你照表执行）

### 🟢 优先发布（放心发）

| GEO | Index Health | Trend Pressure | 行动 | 说明 |
|-----|--------------|----------------|------|------|
| **G-A** | **≥60%** | **≤2** | ✅ **放量** | 最理想状态，可以加速 |
| **G-A** | **40–59%** | **0–1** | ✅ **稳定** | 当前状态，维持节奏 |
| **G-B** | **≥60%** | **0** | ✅ **少量** | 补充内容，少量发布 |

---

### 🟡 控制发布（慢一点）

| GEO | Index Health | Trend Pressure | 行动 | 说明 |
|-----|--------------|----------------|------|------|
| **G-A** | **40–59%** | **2** | ⚠️ **减速 30%** | 趋势压力稍高，降速 |
| **G-B** | **40–59%** | **0–1** | ⚠️ **观察** | 监控索引率 |
| **G-A** | **<40%** | **0** | ⚠️ **只发样本** | 风险期，仅样本页 |

---

### 🔴 暂停发布（不争论）

| GEO | Index Health | Trend Pressure | 行动 | 说明 |
|-----|--------------|----------------|------|------|
| **任意** | **<40%** | **≥1** | ⛔ **停** | 风险期 + 趋势 = 禁止 |
| **任意** | **任意** | **≥3** | ⛔ **停** | 趋势压力过高 |
| **G-C** | **任意** | **任意** | ⛔ **不发** | 低质量内容禁止 |

---

## ✅ 你现在唯一允许的「趋势玩法」

### ❌ 不是热点
### ❌ 不是热搜
### ❌ 不改 URL

### ✅ 允许的：趋势映射解释页

**示例（正确）**：
```
Industry: E-commerce
Scenario: Product demo videos
Mapped trend: Short-form video adoption
（不出现 TikTok / 年份 / 热度）
```

**不允许（红线）**：
- ❌ "2025 hottest"
- ❌ "Google Trends shows"
- ❌ "爆火 / viral / trending now"

👉 **趋势只能作为"解释背景"，不能成为页面主题**

---

## 📅 你每天照这个「发布节奏」跑

### 当前阶段：限速期

| 指标 | 数值 |
|------|------|
| **每日总量** | **20–40 页** |
| **结构比例** | 见下表 |

### 结构比例

| 类型 | 比例 | 说明 |
|------|------|------|
| **G-A Evergreen** | **70%** | 主要内容（14-28 页/天） |
| **行业 × 场景** | **20%** | 补充内容（4-8 页/天） |
| **趋势映射解释页** | **10%** | 趋势内容（2-4 页/天，Pressure ≤2） |

### 禁止事项

- ❌ 新 URL 结构
- ❌ 新内容模块
- ❌ 热点专题页

---

## 🧠 给你一个"不会被供应商骗"的判断锚点

**如果有人说**：
> "现在不追热点就晚了"

**你只回一句**：
> **"Index Health 过 60% 再说。"**

---

## ✅ 你下一步 7 天 checklist（照抄）

### 每天必做

- [ ] **每天记录 5 个数**（Dashboard）
  - Discovered – not indexed
  - Crawled – not indexed
  - Indexed
  - Crawl requests/day
  - Sitemap read success

- [ ] **计算 Index Health**
  ```
  Index Health = Indexed / (Discovered + Crawled)
  ```

- [ ] **根据排产矩阵决定发布策略**
  - 🟢 优先发布：G-A + Index ≥60% + Pressure ≤2
  - 🟡 控制发布：G-A + Index 40-59% + Pressure 2
  - 🔴 暂停发布：Index <40% 或 Pressure ≥3

### 每周必做

- [ ] **Index Health ≥60% 前，不碰热搜**
- [ ] **所有新内容必须 ≥G-A**（GEO 命中率 ≥80）
- [ ] **趋势内容必须是「解释型」，不是「事件型」**

---

## 📊 快速决策表

### 场景 1：Index Health = 55%，GEO = G-A，Trend Pressure = 1

**判断**：
- GEO: G-A ✅
- Index: 40-59% ✅
- Pressure: 0-1 ✅

**行动**：✅ **稳定发布**（20-40 页/天）

---

### 场景 2：Index Health = 35%，GEO = G-A，Trend Pressure = 2

**判断**：
- GEO: G-A ✅
- Index: <40% ❌
- Pressure: 2 ❌

**行动**：⛔ **暂停发布**（Index <40% + Pressure ≥1）

---

### 场景 3：Index Health = 65%，GEO = G-A，Trend Pressure = 0

**判断**：
- GEO: G-A ✅
- Index: ≥60% ✅
- Pressure: ≤2 ✅

**行动**：✅ **放量发布**（可以加速到 50-80 页/天）

---

## 🔧 TypeScript 实现示例

```typescript
// lib/production-scheduler.ts

export type GEOScore = 'G-A' | 'G-B' | 'G-C'
export type IndexHealthStatus = 'healthy' | 'digesting' | 'risk'
export type ProductionAction = 'scale' | 'stable' | 'slow' | 'sample' | 'stop'

export interface ProductionDecision {
  geoScore: GEOScore
  indexHealth: number // 0-100
  trendPressure: number // 0-4
  action: ProductionAction
  dailyLimit: number
  reason: string
}

export function calculateIndexHealth(
  indexed: number,
  discovered: number,
  crawled: number
): number {
  const total = discovered + crawled
  if (total === 0) return 0
  return Math.round((indexed / total) * 100)
}

export function getIndexHealthStatus(health: number): IndexHealthStatus {
  if (health >= 60) return 'healthy'
  if (health >= 40) return 'digesting'
  return 'risk'
}

export function makeProductionDecision(
  geoScore: GEOScore,
  indexHealth: number,
  trendPressure: number
): ProductionDecision {
  const status = getIndexHealthStatus(indexHealth)
  
  // 🔴 暂停发布（不争论）
  if (geoScore === 'G-C') {
    return {
      geoScore,
      indexHealth,
      trendPressure,
      action: 'stop',
      dailyLimit: 0,
      reason: 'G-C 内容禁止发布',
    }
  }
  
  if (indexHealth < 40 && trendPressure >= 1) {
    return {
      geoScore,
      indexHealth,
      trendPressure,
      action: 'stop',
      dailyLimit: 0,
      reason: 'Index Health <40% + Trend Pressure ≥1',
    }
  }
  
  if (trendPressure >= 3) {
    return {
      geoScore,
      indexHealth,
      trendPressure,
      action: 'stop',
      dailyLimit: 0,
      reason: 'Trend Pressure ≥3',
    }
  }
  
  // 🟢 优先发布（放心发）
  if (geoScore === 'G-A' && indexHealth >= 60 && trendPressure <= 2) {
    return {
      geoScore,
      indexHealth,
      trendPressure,
      action: 'scale',
      dailyLimit: 50, // 可以放量
      reason: 'G-A + Index ≥60% + Pressure ≤2',
    }
  }
  
  if (geoScore === 'G-A' && indexHealth >= 40 && indexHealth < 60 && trendPressure <= 1) {
    return {
      geoScore,
      indexHealth,
      trendPressure,
      action: 'stable',
      dailyLimit: 30, // 稳定节奏
      reason: 'G-A + Index 40-59% + Pressure 0-1',
    }
  }
  
  if (geoScore === 'G-B' && indexHealth >= 60 && trendPressure === 0) {
    return {
      geoScore,
      indexHealth,
      trendPressure,
      action: 'stable',
      dailyLimit: 10, // 少量补充
      reason: 'G-B + Index ≥60% + Pressure 0',
    }
  }
  
  // 🟡 控制发布（慢一点）
  if (geoScore === 'G-A' && indexHealth >= 40 && indexHealth < 60 && trendPressure === 2) {
    return {
      geoScore,
      indexHealth,
      trendPressure,
      action: 'slow',
      dailyLimit: 20, // 减速 30%
      reason: 'G-A + Index 40-59% + Pressure 2',
    }
  }
  
  if (geoScore === 'G-B' && indexHealth >= 40 && indexHealth < 60 && trendPressure <= 1) {
    return {
      geoScore,
      indexHealth,
      trendPressure,
      action: 'slow',
      dailyLimit: 5, // 观察
      reason: 'G-B + Index 40-59% + Pressure 0-1',
    }
  }
  
  if (geoScore === 'G-A' && indexHealth < 40 && trendPressure === 0) {
    return {
      geoScore,
      indexHealth,
      trendPressure,
      action: 'sample',
      dailyLimit: 5, // 只发样本
      reason: 'G-A + Index <40% + Pressure 0',
    }
  }
  
  // 默认：暂停
  return {
    geoScore,
    indexHealth,
    trendPressure,
    action: 'stop',
    dailyLimit: 0,
    reason: '不符合任何发布条件',
  }
}
```

---

## 📋 每日发布分配示例

### 当前状态：Index Health = 50%，GEO = G-A，Trend Pressure = 1

**决策**：✅ 稳定发布（20-40 页/天）

**分配**：
- **G-A Evergreen**：70% = 14-28 页/天
- **行业 × 场景**：20% = 4-8 页/天
- **趋势映射解释页**：10% = 2-4 页/天（Pressure ≤2）

---

## 💡 最后一句实话

**你现在这套体系，已经不是 SEO 了，**  
**而是 在给 AI 搜索喂"可信知识层"。**

**慢一点 = 活得久。**

---

## 📚 相关文档

- `docs/INDEX_HEALTH_DASHBOARD.md` - 索引健康仪表盘
- `docs/BATCH_SGE_PROMPT.md` - 批量 SGE Prompt
- `docs/GEO_PRIORITY_PRODUCTION_TABLE.md` - GEO 命中率 × 索引率 双优先排产表
- `docs/TREND_MAPPING_LEXICON.md` - 趋势映射词库

