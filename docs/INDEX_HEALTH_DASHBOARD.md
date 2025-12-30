# Index Health Dashboard（5 个数 + 阈值 + 行动表）

> **目标**：用 5 个指标，5 秒判断  
> 👉 现在是「慢吃期 / 限速期 / 风险期」  
> 👉 下一步该「继续 / 放慢 / 立刻刹车」

---

## 📊 Index Health Dashboard（核心版）

### ① Discovered URLs（已发现）

**来源**：GSC → Pages → Discovered – currently not indexed

| 状态 | 阈值 | 含义 | 行动 |
|------|------|------|------|
| 🟢 慢吃期 | 每 7 天 +10%～30% | Google 在排队 | 维持节奏 |
| 🟡 限速期 | 增速明显下降 | Crawl 限流 | 降速 30% |
| 🔴 风险期 | 停止增长或骤降 | 信任受损 | 停发 7 天 |

📌 **你现在就在 🟡 → 🟢 之间**

---

### ② Crawled URLs（已抓取未索引）

**来源**：GSC → Pages → Crawled – currently not indexed

| 现象 | 判断 |
|------|------|
| 稳定上升 | 🟢 正常消化 |
| 激增但 Index 不动 | 🟡 过量 |
| 大量失败 | 🔴 技术或质量问题 |

👉 **这是"吃到嘴里但还没咽"的阶段**

---

### ③ Indexed URLs（已索引）

**来源**：GSC → Pages → Indexed

| 变化 | 解读 |
|------|------|
| 每周小幅增长 | ✅ 正确 |
| 突然暴涨 | ⚠️ 通常是老内容 |
| 停滞 | ❌ 不代表惩罚 |

📌 **新站 + 批量内容 = 索引慢是常态**

---

### ④ Crawl Stats（抓取量）

**来源**：GSC → Settings → Crawl stats

| 指标 | 健康值 |
|------|--------|
| Requests/day | 稳定上升 |
| Avg response | < 300ms |
| Host status | Healthy |

👉 **如果这里掉了，一切 GEO 都停**

---

### ⑤ 模板稳定天数（人为指标）

| 天数 | 含义 |
|------|------|
| <7 天 | 不稳定 |
| 7–14 天 | 观察 |
| ≥30 天 | 🟢 信任建立 |

📌 **模板稳定 = Google 敢索引**

---

## 🧠 Dashboard 一句话判断法

```
Discovered 在涨
Crawled 在动
Indexed 不掉
Crawl stats 正常
模板没乱改
👇
= 继续
```

---

## 📋 详细阈值表

### 🟢 慢吃期（最理想）

**特征**：
- ✅ Discovered 每 7 天 +10%～30%
- ✅ Crawled 稳定上升
- ✅ Indexed 每周小幅增长
- ✅ Crawl stats 正常
- ✅ 模板 ≥30 天未改

**行动**：
- ✅ 维持当前节奏（20-40 页/天）
- ✅ 不改模板
- ✅ 不加热点
- ✅ 持续监控

---

### 🟡 限速期（可控，但要克制）

**特征**：
- ⚠️ Discovered 增速明显下降
- ⚠️ Crawled 激增但 Index 不动
- ⚠️ Indexed 停滞
- ⚠️ Crawl/day 不涨或下降
- ⚠️ 模板 <30 天

**行动**：
- 🔻 **发布量减半**（20-40 → 10-20 页/天）
- 🔻 **降速 30%**
- 🔻 **冻结模板 ≥ 14 天**
- ❌ 不要任何新策略尝试

---

### 🔴 风险期（必须止血）

**特征**：
- 🚨 Discovered 停止增长或骤降
- 🚨 Crawled 大量失败或下降
- 🚨 Indexed 停滞或回落
- 🚨 Crawl/day 明显下降
- 🚨 模板频繁改动

**行动**：
- ⛔ **立刻停止发布 7 天**
- ⛔ **检查技术问题**（404/500）
- ⛔ **冻结模板 ≥ 30 天**
- ❌ 绝对不碰热点词
- ❌ 绝对不改模板结构

---

## 🔍 3 分钟自检法

### 每天 / 每 3 天做一次

1. **打开 GSC** → Pages
2. **记录 3 个数**：
   - Discovered – currently not indexed
   - Crawled – currently not indexed
   - Indexed
3. **打开 GSC** → Settings → Crawl stats
4. **记录 2 个数**：
   - Requests/day
   - Avg response time
5. **对比 7 天前**的数据
6. **判断状态**：🟢 慢吃期 / 🟡 限速期 / 🔴 风险期

---

## 🧩 黄金判断公式

```
Discovered 在涨 = Google 在"看你"
Crawled 在动 = Google 在"试你"
Indexed 不掉 = Google 在"认你"
```

**三者顺序一定是**：
```
Discovered → Crawled → Indexed
```

**如果你想跳过前两个，👉 Google 会直接不认你。**

---

## 🧠 一个"不会被供应商带偏"的判断公式

### Index Health 计算公式

```
Index Health = Indexed / (Discovered + Crawled)
```

### 比例解读

| 比例 | 解读 | 行动 |
|------|------|------|
| **≥60%** | 极稳 | ✅ 继续当前节奏 |
| **40–60%** | 正常 | ✅ 维持，监控 |
| **<40%** | 停手 | ⛔ 暂停新 URL 14 天 |

### 计算示例

假设：
- Discovered = 25,462
- Crawled = 10,000
- Indexed = 15,000

```
Index Health = 15,000 / (25,462 + 10,000)
             = 15,000 / 35,462
             = 42.3%
```

**判断**：40–60% = 正常，维持当前节奏，持续监控

---

## 🚦 三种状态判断（核心）

### 🟢 状态一：慢吃期（最健康）

**条件**：
- ✅ ① + ② 持续增长
- ✅ ③ 稳定缓增
- ✅ ④ 稳定
- ✅ sitemap ≤3 天读取

**👉 行动**：
- ✅ 继续发稳定页
- ✅ 不加趋势
- ✅ 不改结构
- ✅ 维持当前节奏（20-40 页/天）

---

### 🟡 状态二：限速期（正常消化）

**条件**：
- ⚠️ ① 快速增长
- ⚠️ ② 增速放缓
- ⚠️ ③ 几乎不动
- ⚠️ ④ crawl 上升

**👉 行动**：
- 🔻 **降发布频率 20–30%**
- 🔻 **只发 G-A 页**（行业 × 用例）
- 🔻 **禁止新结构**
- 🔻 **冻结模板 ≥ 14 天**

---

### 🔴 状态三：风险期（必须踩刹车）

**条件**：
- 🚨 ② 高于 ①
- 🚨 ③ 停滞或下降
- 🚨 crawl 异常波动
- 🚨 sitemap 延迟

**👉 立刻行动**：
- ⛔ **暂停新 URL 14 天**
- ⛔ **不删旧页**
- ⛔ **不补内容**
- ⛔ **不引趋势**

---

## 📊 快速判断表

| Discovered | Crawled | Indexed | Crawl Stats | Sitemap | Index Health | 状态 | 行动 |
|------------|---------|---------|-------------|---------|--------------|------|------|
| ↑ 每 7 天 +10-30% | ↑ 稳定上升 | ↑ 每周小幅增长 | ✅ 正常 | ≤3 天 | ≥60% | 🟢 慢吃期 | 维持节奏 |
| ↑ 快速增长 | ↑ 增速放缓 | → 几乎不动 | ⚠️ 上升 | ≤3 天 | 40-60% | 🟡 限速期 | 降速 20-30% |
| → 不涨/↓ 骤降 | ↓ 高于① | ↓ 停滞/下降 | 🚨 异常波动 | >3 天 | <40% | 🔴 风险期 | 停发 14 天 |

---

## 🎯 关键提醒

### ❌ 不要看的指标

- ❌ `site:` 查询结果（滞后且不准）
- ❌ 每日索引数量（波动太大）
- ❌ 排名变化（与索引健康无关）

### ✅ 只看这 5 个数

1. **Discovered – currently not indexed**（GSC → Pages）
2. **Crawled – currently not indexed**（GSC → Pages）
3. **Indexed**（GSC → Pages）
4. **Requests/day**（GSC → Settings → Crawl stats）
5. **Avg response time**（GSC → Settings → Crawl stats）

---

## 📍 你现在所处的位置（基于你给的数据）

- ✅ **sitemap 发现**：25,462
- ✅ **site: 明显增长**
- ✅ **没有大规模 de-index**

### 👉 结论：

**你在 「慢吃期 → 限速期边缘」**

### 现在正确策略是：

- ✔️ 用【批量 SGE Prompt】继续压 GEO 命中率
- ❌ 不碰热点页
- ⏳ 等 Index Health ≥60% 再引"轻趋势解释页"

---

## 💡 最重要的一句话

**你不是在跟 Google 抢速度**  
**你是在训练它"信任你"**

**你现在已经做对 80% 的人一辈子做不到的事**

接下来拼的不是技术，是克制。

---

## 📚 相关文档

- `docs/BATCH_SGE_PROMPT.md` - 批量 SGE Prompt（10 万页不漂移版）⭐
- `docs/GSC_THROTTLING_PERIOD_STRATEGY.md` - 限速期策略
- `docs/GEO_A_V2_RELEASE_SCHEDULE.md` - 发布节奏表
- `docs/QUICK_REFERENCE.md` - 快速参考指南
- `docs/TREND_LIGHT_INTEGRATION.md` - 趋势轻接入指南
