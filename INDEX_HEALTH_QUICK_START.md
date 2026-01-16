# Index Health 周报 & AI 引用概率 - 快速开始

## 🚀 5 分钟快速开始

### 1️⃣ Index Health 周报

#### 生成周报

```bash
npm run report:index-health
```

#### 自定义数据（可选）

1. 复制示例文件：
   ```bash
   cp data/index-health-data.example.json data/index-health-data.json
   ```

2. 编辑 `data/index-health-data.json`，填入从 Google Search Console 获取的数据

3. 再次运行：
   ```bash
   npm run report:index-health
   ```

#### 查看报告

报告保存在：`reports/index-health-YYYY-MM-DD.md`

---

### 2️⃣ AI 引用概率排序

#### 计算 Top 5000

```bash
npm run calculate:ai-citation
```

#### 查看结果

结果保存在 `data/ai-citation-lists/`：

- **JSON**: `ai-citation-top5000-YYYY-MM-DD.json`
- **CSV**: `ai-citation-top5000-YYYY-MM-DD.csv` (Excel 可打开)
- **报告**: `ai-citation-report-YYYY-MM-DD.md`

---

## 📊 数据来源（Google Search Console）

### Index Health 周报需要的数据

1. **Indexed Pages (Tier1)**
   - GSC → 索引 → 网页
   - 筛选 Tier1 页面（从 sitemap-tier1.xml）

2. **Avg Position (Tier1)**
   - GSC → 效果 → 平均排名
   - 筛选 Tier1 页面

3. **Impressions (Tier1)**
   - GSC → 效果 → 展示次数
   - 筛选 Tier1 页面

4. **AI-Style Queries**
   - GSC → 效果 → 查询
   - 手动筛选 AI 偏好型查询（如 "how to use ai video for..."）

---

## 🎯 核心判断

### 🚦 一眼判断（最重要）

- 🟢 **健康**: Index ≥60% 且 Impressions 连续 2 周↑ → **继续发 Tier1**
- 🟡 **观察**: Index 40–59% → **暂停新增，调 sitemap**
- 🔴 **风险**: Index <40% → **立刻停发，绝不改结构**

### 决策表

| Index Health | 行动 |
|--------------|------|
| ≥60% | ✅ **继续发布 Tier1** |
| 50–59% | ⏸ **减半发布** |
| 40–49% | ⛔ **停发，等 2 周** |
| <40% | ⛔ **停发 + 不准改结构** |

---

## 📁 AI Citation Top 5000 输出

### List A｜Top 1000（绝对核心）

- ✅ 放进 Tier1 sitemap
- ✅ 优先内链
- ❌ 不准改结构

### List B｜Next 2000（潜力池）

- 🟡 轻补 FAQ-B / Constraints
- 🟡 2 周后观察 Index

### List C｜Long-tail 2000

- ⚪ 不动
- ⚪ 当"知识密度缓冲"

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

## 📚 完整文档

- [完整指南](./docs/INDEX_HEALTH_AND_AI_CITATION_GUIDE.md)
- [Tier 1 Sitemap 指南](./docs/TIER1_SITEMAP_GUIDE.md)
- [GEO 和 SEO 统一策略](./GEO_AND_SEO_UNIFIED.md)
