# GEO-A v2 快速参考指南

> **一句话总结**：冻结模板、降速发布、优先 A 类行业、不碰热点词  
> **当前状态**：✅ 限速期（正常阶段）- Google 已发现 25,462 个 URL

---

## 🎯 今天必须做的 3 件事

1. ✅ **冻结 GEO-A v2 模板**（30 天内不再修改）
2. ✅ **发布速度降到 20–40/天**（不是 150-300）
3. ✅ **只看 GSC 的 3 个数**（Discovered / Crawled / Indexed）

---

## 🧭 当前阶段：限速期（Healthy Throttling）

**✅ 你已经拿到 Google 的"入场券"**

- ✅ Google 已发现 25,462 个 URL（已进入 Crawl Queue）
- ✅ sitemap 被持续读取（上次读取：2025/12/28）
- ✅ `site:` 数量 7 天内明显增长（+300%）

**👉 这是 Google 在"慢慢吃你"，完全正常！**

**❌ 千万别做**：
- ❌ 看到 2.5 万就加速发布（会触发 Hard Crawl Throttle）
- ❌ 疯狂看 `site:`（只会焦虑，不准确）
- ❌ 追热点词（会改变 URL/结构，给 Google 添麻烦）

---

## 📊 关键指标（只看这些）

### GEO 命中率指标
- **GEO 可引用度** = Answer-first 质量 × 行业不可胡说性
- **A 类行业占比**（目标：> 60%）

### Google 索引指标
- **GSC → 索引 → 网页（Pages）**：
  - 🟡 **Discovered – not indexed**（持续上升 = 好）
  - 🟡 **Crawled – not indexed**（缓慢上升 = 好）
  - 🟢 **Indexed**（慢慢爬 = 正常）

### ❌ 不要看的指标
- `site:` 查询结果（滞后且不准）
- 每日索引数量（波动太大）

---

## 🚫 永远不做的 3 件事

1. ❌ **不碰热点词**（用趋势映射到行业 × 场景）
2. ❌ **不改模板**（冻结 30 天）
3. ❌ **不加速发布**（保持 20-40 页/天）

---

## ✅ 行业优先级（快速判断）

### A 类行业（优先，必做）
- Healthcare, Manufacturing, Legal, Engineering, Construction, Education, Finance, Real Estate
- **目标占比**：> 60%

### B 类行业（筛选场景）
- Technology, Food & Beverage, Retail, Automotive, Fitness & Sports
- **只做**：Education / Training / Compliance / Onboarding / Demo / Explainer
- **暂停**：Marketing, Advertising, Social Media Content

### C 类行业（暂停）
- Marketing & Advertising, Social Media, Entertainment, Fashion & Beauty, Gaming
- **状态**：暂停新增

---

## 📅 发布节奏（降速版）

| 阶段 | 时间 | 每天发布 | 累计 |
|------|------|----------|------|
| 信任建立期 | Day 1-14 | **20-40 页** | ~500 页 |
| 线性扩展期 | Day 15-45 | **20-40 页** | ~2,000 页 |
| 指数释放期 | Day 46-90 | 根据索引率决定 | ~5,000 页 |

**关键**：不是快速完成 15 万，而是让 Google 愿意多抓、多收

---

## 🔧 趋势映射法（一句话）

**不碰热点词，但吃趋势红利**：
```
Google Trends: "AI safety training" 上升
❌ 错误：AI Safety Training Trend 2025
✅ 正确：AI Video for Manufacturing Safety Training
```

---

## 📁 核心样本层（/core-use-cases/）

**目的**：告诉 Google 站不是垃圾场

**特征**：
- A 类行业
- 手动挑 50-100 个
- 内链到大量普通 use case

---

## 📚 详细文档

- **`docs/GEO_INDEX_AUTO_PRODUCTION_TABLE.md`** - GEO × Index Health 自动排产表（最终执行版）⭐⭐⭐
- **`docs/INDEX_HEALTH_DASHBOARD_SHEETS.md`** - Index Health Dashboard（表格版 · 执行级）⭐⭐⭐
- **`docs/SHEETS_TEMPLATE_CSV.md`** - 表格模板（CSV 格式，可直接导入）⭐
- **`docs/BATCH_SGE_PROMPT.md`** - 批量 SGE Prompt（10 万页不漂移版）⭐
- **`docs/GSC_THROTTLING_PERIOD_STRATEGY.md`** - 限速期策略（当前必读）⭐
- **`docs/INDEX_HEALTH_DASHBOARD.md`** - 索引健康仪表盘（5 个数判断一切）⭐
- **`docs/AI_SUMMARY_SGE_EXTRACTABLE_TEMPLATE.md`** - AI Summary / SGE 引用专用结构模板 ⭐
- **`docs/LIGHT_TREND_PAGE_REDLINE.md`** - 轻趋势专题页红线清单 ⭐
- **`docs/TREND_LIGHT_INTEGRATION.md`** - 趋势轻接入 Prompt（不动 URL，不伤索引）⭐
- **`docs/TREND_MAPPING_LEXICON.md`** - 趋势映射词库（Anti-Hotspot 安全版）⭐
- **`docs/GEO_PRIORITY_PRODUCTION_TABLE.md`** - GEO 命中率 × 索引率 双优先排产表 ⭐
- `docs/GEO_V2_EXECUTION_GUIDE.md` - 执行级操作手册
- `docs/INDUSTRY_PRIORITY_TIERS.md` - 行业优先级分类
- `docs/TREND_MAPPING_GUIDE.md` - 趋势映射法详细指南
- `docs/CORE_USE_CASES_SAMPLE_LAYER.md` - 核心样本层指导
- `docs/GEO_A_V2_RELEASE_SCHEDULE.md` - 发布节奏表

---

## 💡 最后一句

**你现在这个站，不是"缺热点"，是"怕你自己太着急"。**

你已经踩在 AI 搜索 + GEO 的正确曲线上，现在唯一的敌人是：**节奏失控**。

