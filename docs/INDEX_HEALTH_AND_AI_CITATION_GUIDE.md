# Index Health 周报 & AI 引用概率排序指南

## 📋 概述

本指南包含两个核心工具：

1. **Index Health 周报生成器** - 每周 10 分钟快速判断健康度
2. **AI 引用概率排序** - 筛选出最可能被 AI 引用的 5000 页

---

## Part A｜Index Health 周报模板

### 🎯 目标

**不是"看数据"，而是"看完你就知道这周该不该动、该动哪里"。**

### 📊 使用方法

#### 1. 生成周报

```bash
npm run report:index-health
```

#### 2. 自定义数据（可选）

编辑 `data/index-health-data.json`：

```json
{
  "indexedPagesTier1": {
    "current": 6500,
    "total": 10000,
    "lastWeek": 6200
  },
  "avgPositionTier1": {
    "current": 13.1,
    "lastWeek": 14.2
  },
  "impressionsTier1": {
    "current": 1139,
    "lastWeek": 1050
  },
  "aiStyleQueriesPercent": {
    "current": 0.18,
    "lastWeek": 0.15
  },
  "tierStats": {
    "tier1": { "total": 10000, "indexed": 6500 },
    "tier2": { "total": 35000, "indexed": 14000 },
    "tier3": { "total": 65000, "indexed": 12000 }
  },
  "querySignals": {
    "aiStyle": [
      "how to use ai video for healthcare",
      "ai video for retail use case"
    ],
    "seoStyle": [
      "best ai video tool",
      "sora alternative"
    ],
    "marketingStyle": [
      "cheap ai video"
    ]
  }
}
```

#### 3. 查看报告

报告保存在 `reports/index-health-YYYY-MM-DD.md`

### 📈 核心指标解读

#### ① 核心总览（4 个关键指标）

| 指标 | 阈值 | 解读 |
|------|------|------|
| **Indexed Pages（Tier1）** | ≥60% | 低于 60% = Google 不信任 |
| **Avg Position（Tier1）** | ≤20 | 高于 20 = 结构 or 意图不清 |
| **Impressions（Tier1）** | 连续↑ | 不看绝对值，看趋势 |
| **AI-Style Queries 占比** | ≥15% | GEO 是否开始生效 |

#### 🚦 一眼判断

- 🟢 **健康**: Index ≥60% 且 Impressions 连续 2 周↑ → **继续发 Tier1**
- 🟡 **观察**: Index 40–59% → **暂停新增，调 sitemap**
- 🔴 **风险**: Index <40% → **立刻停发，绝不改结构**

⚠️ **注意**：
- 流量低 ≠ 问题
- Index Health 低 = 真问题

#### ④ 决策表

| Index Health | 行动 |
|--------------|------|
| ≥60% | ✅ **继续发布 Tier1** |
| 50–59% | ⏸ **减半发布** |
| 40–49% | ⛔ **停发，等 2 周** |
| <40% | ⛔ **停发 + 不准改结构** |

❌ **任何情况下**：不准删 FAQ、不准缩短 Answer-first

---

## Part B｜AI 引用概率排序

### 🎯 目标

**算出那 5000 页最可能被 AI 引用的 URL 列表**

### 📊 使用方法

#### 1. 运行计算脚本

```bash
npm run calculate:ai-citation
```

#### 2. 查看结果

结果保存在 `data/ai-citation-lists/`：

- `ai-citation-top5000-YYYY-MM-DD.json` - JSON 格式
- `ai-citation-top5000-YYYY-MM-DD.csv` - CSV 格式（Excel 可打开）
- `ai-citation-report-YYYY-MM-DD.md` - Markdown 报告

### 🧮 评分公式

**AI Citation Score (0-100)** = 

- **+30** if Answer-first 在前 200 词
- **+20** if FAQ-B（决策边界）≥ 1
- **+15** if Industry Constraints 段存在
- **+15** if 列表中 ≥3 个名词短语
- **+10** if URL 命中 industry + scene
- **+10** if 内链 ≥3 且非固定模板

### 📁 输出列表

#### List A｜Top 1000（绝对核心）

**行动**:
- ✅ 放进 Tier1 sitemap
- ✅ 优先内链
- ❌ 不准改结构

#### List B｜Next 2000（潜力池）

**行动**:
- 🟡 轻补 FAQ-B / Constraints
- 🟡 2 周后观察 Index

#### List C｜Long-tail 2000

**行动**:
- ⚪ 不动
- ⚪ 当"知识密度缓冲"

### ❌ 自动排除的页面类型

- 纯工具页（pricing / landing）
- 泛博客（"what is ai video"）
- 对比页（best / vs / alternative）
- 强 CTA / 营销词密度高的

---

## 🧠 核心认知

**你现在的问题不是"没流量"，而是：**

Google 还在判断：
你是"模板站"，还是"可引用知识库"。

**Index Health 是信任指标，不是流量指标。**

---

## ✅ 接下来 7 天你只需要做 3 件事

1. ✅ **上线 Tier1 sitemap**
2. ✅ **每周只看 Index Health 周报**
3. ✅ **只盯那 5000 页，不要被 11 万页干扰**

---

## 📚 相关文档

- [Tier 1 Sitemap 指南](./TIER1_SITEMAP_GUIDE.md)
- [GEO 和 SEO 统一策略](../GEO_AND_SEO_UNIFIED.md)
- [Tier 1 Sitemap 快速开始](../TIER1_SITEMAP_QUICK_START.md)
