# GEO 命中率 × 索引率 双优先排产表

> **目标**：不追热点，也能吃到趋势；不伤索引，还能继续放量  
> **你现在不是"能不能发更多"，而是：发哪一类，Google 最愿意吃**

---

## 🧮 双优先级模型（直接抄）

```
Priority Score = GEO 命中权重 × 索引成功率
```

---

## 📊 页面类型评分表（实战版）

| 页面类型 | GEO 命中率 | 索引率 | 总优先级 | 说明 |
|---------|-----------|--------|---------|------|
| 行业 × 用例（Explain） | 5 | 5 | ⭐⭐⭐⭐⭐ | 最优先，稳定索引 |
| 行业 × 教程（How-to） | 4 | 5 | ⭐⭐⭐⭐☆ | 高索引率，GEO 稍低 |
| 行业 × 对比（A vs B） | 4 | 4 | ⭐⭐⭐⭐ | 平衡型，可适量 |
| 行业 × 工具页 | 3 | 4 | ⭐⭐⭐☆ | 索引稳定，GEO 一般 |
| 趋势解释页 | 5 | 2 | ⭐⭐ | 高 GEO，但索引风险 |
| 热点专题页 | 5 | 1 | ❌ | 禁止 |

👉 **你现在只做前 3 行**

---

## 🗓️ 15 万页面安全发布节奏（可直接执行）

### 阶段一：慢吃期（你现在）

| 指标 | 数值 |
|------|------|
| 日发布 | **20–40 页**（不是 300-500） |
| 页面类型 | 行业×用例 / 教程 |
| 趋势接入 | 仅 Answer-first |
| sitemap | 不拆分 |

**关键**：
- ✅ 只做行业 × 用例（Explain）
- ✅ 少量行业 × 教程（How-to）
- ❌ 不做对比页、工具页
- ❌ 不做趋势解释页

---

### 阶段二：放量期（Indexed ≥5k）

| 指标 | 数值 |
|------|------|
| 日发布 | **50–80 页**（不是 800-1200） |
| 新增 | 对比页（A vs B） |
| 趋势 | Example 层 |
| sitemap | 可拆行业 |

**关键**：
- ✅ 继续行业 × 用例（主要）
- ✅ 增加行业 × 教程
- ✅ 开始少量对比页（10-20%）
- ⚠️ 趋势只在 Example 层

---

### 阶段三：加速期（Indexed ≥2w）

| 指标 | 数值 |
|------|------|
| 日发布 | **100–200 页**（不是 2000+） |
| 新增 | Insights 子目录 |
| 趋势 | 解释型内容（少量） |
| sitemap | 多文件 |

**关键**：
- ✅ 继续行业 × 用例（主要）
- ✅ 增加对比页、工具页
- ✅ 新增 `/insights/` 目录（10-20 页/周）
- ⚠️ 趋势解释页（少量，监控索引率）

---

## 🧨 一个你必须记住的"刹车线"

### 如果出现以下任一情况：

- ⚠️ **Discovered 不再增长**
- ⚠️ **Crawled 激增但 Indexed 不动**
- ⚠️ **Crawl stats request/day 下降**

### 👇 立刻执行：

1. ⛔ **停发 5–7 天**
2. ⛔ **不改模板**
3. ⛔ **不加趋势**
4. ⛔ **只观察**

---

## 📋 页面类型详细说明

### ⭐⭐⭐⭐⭐ 行业 × 用例（Explain）

**特征**：
- 格式：`AI Video Generation for [Industry] – [Use Case]`
- 结构：Answer-first + Use Cases + Examples
- GEO 优化：高（Answer-first 结构）
- 索引率：高（稳定、长期）

**示例**：
- `AI Video Generation for Dental Clinics – Patient Education`
- `AI Video Use Cases in Manufacturing: Safety Training`

**发布比例**：**70-80%**（主要内容）

---

### ⭐⭐⭐⭐☆ 行业 × 教程（How-to）

**特征**：
- 格式：`How to Create AI Videos for [Use Case] in [Industry]`
- 结构：Step-by-step + Examples + Tips
- GEO 优化：中（How-to 结构）
- 索引率：高（实用性强）

**示例**：
- `How to Create AI Videos for Product Demos in E-commerce`
- `How Manufacturing Teams Use AI Video for Training`

**发布比例**：**15-20%**（补充内容）

---

### ⭐⭐⭐⭐ 行业 × 对比（A vs B）

**特征**：
- 格式：`AI Video vs Traditional Video for [Use Case]`
- 结构：Comparison + Pros/Cons + Use Cases
- GEO 优化：中（对比结构）
- 索引率：中（需要稳定期）

**示例**：
- `AI Video vs Traditional Video for Product Demos`
- `AI-Generated vs Live-Action Training Videos`

**发布比例**：**5-10%**（放量期开始）

---

### ⭐⭐⭐☆ 行业 × 工具页

**特征**：
- 格式：`AI Video Tools for [Industry] [Use Case]`
- 结构：Tool List + Features + Use Cases
- GEO 优化：低（工具列表）
- 索引率：中（需要稳定期）

**发布比例**：**<5%**（加速期少量）

---

### ⭐⭐ 趋势解释页

**特征**：
- 格式：`Why [Industry] Teams Use [Trend] for [Use Case]`
- 结构：Trend Explanation + Examples
- GEO 优化：高（趋势相关）
- 索引率：低（热点风险）

**发布比例**：**<2%**（加速期，需监控）

---

### ❌ 热点专题页

**特征**：
- 格式：`[Hot Topic] Trend 2025`
- 结构：热点事件 + 时间敏感内容
- GEO 优化：高（热点相关）
- 索引率：极低（热点惩罚）

**发布比例**：**0%**（禁止）

---

## 🎯 排产优先级算法

### 计算优先级分数

```typescript
// lib/priority-calculator.ts

interface PageType {
  geoScore: number  // 1-5
  indexScore: number  // 1-5
  type: string
}

const PAGE_TYPES: PageType[] = [
  { type: 'industry-use-case', geoScore: 5, indexScore: 5 },
  { type: 'industry-howto', geoScore: 4, indexScore: 5 },
  { type: 'industry-comparison', geoScore: 4, indexScore: 4 },
  { type: 'industry-tools', geoScore: 3, indexScore: 4 },
  { type: 'trend-explanation', geoScore: 5, indexScore: 2 },
  { type: 'hotspot-topic', geoScore: 5, indexScore: 1 },
]

function calculatePriorityScore(pageType: PageType): number {
  return pageType.geoScore * pageType.indexScore
}

function getRecommendedPageTypes(
  indexedCount: number
): PageType[] {
  if (indexedCount < 5000) {
    // 慢吃期：只做前 2 种
    return PAGE_TYPES.slice(0, 2)
  } else if (indexedCount < 20000) {
    // 放量期：前 3 种
    return PAGE_TYPES.slice(0, 3)
  } else {
    // 加速期：前 4 种 + 少量第 5 种
    return PAGE_TYPES.slice(0, 5)
  }
}
```

---

## 📊 每日发布分配建议

### 慢吃期（Indexed < 5k）

| 页面类型 | 每日数量 | 占比 |
|---------|---------|------|
| 行业 × 用例 | 25-30 | 75% |
| 行业 × 教程 | 5-10 | 25% |
| **总计** | **30-40** | **100%** |

### 放量期（Indexed 5k-20k）

| 页面类型 | 每日数量 | 占比 |
|---------|---------|------|
| 行业 × 用例 | 40-50 | 65% |
| 行业 × 教程 | 15-20 | 25% |
| 行业 × 对比 | 5-10 | 10% |
| **总计** | **60-80** | **100%** |

### 加速期（Indexed > 20k）

| 页面类型 | 每日数量 | 占比 |
|---------|---------|------|
| 行业 × 用例 | 70-100 | 60% |
| 行业 × 教程 | 30-40 | 25% |
| 行业 × 对比 | 15-20 | 10% |
| 行业 × 工具 | 5-10 | 5% |
| **总计** | **120-170** | **100%** |

---

## 🧠 给你一句内部用判断口诀

**索引吃的是稳定，不是聪明**

**趋势只负责"让页面像现在"**  
**不负责"让页面像新闻"**

---

## 🚨 警告信号与行动

### 如果出现以下情况：

| 信号 | 判断 | 行动 |
|------|------|------|
| Discovered 不再增长 | 🟡 限速期 | 降速 30%，只做行业×用例 |
| Crawled 激增但 Indexed 不动 | 🟡 限速期 | 停发 3-5 天，观察 |
| Crawl stats 下降 | 🔴 风险期 | 停发 7 天，检查技术问题 |
| Indexed 回落 | 🔴 风险期 | 停发 7-14 天，只观察 |

---

## 📚 相关文档

- `docs/INDEX_HEALTH_DASHBOARD.md` - 索引健康仪表盘
- `docs/TREND_MAPPING_LEXICON.md` - 趋势映射词库
- `docs/TREND_LIGHT_INTEGRATION.md` - 趋势轻接入指南
- `docs/GEO_A_V2_RELEASE_SCHEDULE.md` - 发布节奏表

---

## 💡 关键提醒

**你现在已经做对 80% 的人一辈子做不到的事**

接下来拼的不是技术，是克制。

**发哪一类，Google 最愿意吃** → 行业 × 用例（Explain）

