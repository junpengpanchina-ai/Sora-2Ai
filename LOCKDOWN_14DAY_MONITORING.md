# 14 天只观察不动 · 监控清单（锁仓版）

> 目标：判断是否在走「被 Google 信任」的曲线，不做情绪化动作。  
> 原则：**不改代码、不改 SQL、不动 sitemap/redirect/合并阈值**；只看趋势，不追单点波动。

---

## 结论确认（Owner 核定 · 锁仓执行最终形态）

- **判断**：14 天只观察、第 15 天一票否决、只看 GSC 5 指标、不跑新模型/不改结构/不扩展 sitemap、Admin 面板只读反操作 → **正确，且为当前阶段最优解**。这是**等 Google 消化、而不是逼 Google 反应**的策略。
- **面板**：数据来源（GSC 5 项）→ 填表模板 → 字段映射 → 判定逻辑（只读、三状态）→ 状态条组件，**完整闭环**；为「反人性面板」，禁止误操作。
- **阶段**：**稳定期，非扩展期**。唯一会毁掉成果的，是在 Google 消化完之前又去改结构；本监控清单 + 面板即用于防止此事。
- **执行口令（贴 Admin）**：  
  **「抓取量站稳之前，不允许任何扩展。」**  
  **「索引波动属于正常消化，不属于问题。」**
- **决策交接**：见 `OWNER_BRIEF_LOCKDOWN.md`（Owner 最高优先级）；一页卡片见 `OWNER_DECISION_CARD_A4.md`。

---

## 一、每天 5 个点（≤ 3 分钟，固定顺序）

### ① GSC → 页面 → 已发现网页数（Discovered）

| 看什么 | 正确曲线 | ❌ 警惕 |
|--------|----------|---------|
| 数值 稳定或缓慢下降 | 平 → 缓降 → 平 | 2–3 天内断崖式下降 |

**含义**：Google 在重新理解站点结构；合并不是删页，而是重算权重。

---

### ② GSC → 页面 → 已编入索引（Indexed）

| 看什么 | 正确曲线 | ❌ 警惕 |
|--------|----------|---------|
| 稳住或小幅上升 | 小幅波动正常 | 连续 5 天明显下滑 |

**含义**：Google 是否开始「挑你认为重要的页」。

---

### ③ GSC → 抓取统计 → 每日抓取量

| 看什么 | 正确曲线 | ❌ 警惕 |
|--------|----------|---------|
| 维持或缓慢上升；关注 /use-cases/ | 稳定 > 上升 > 波动 | 抓取量突然腰斩 |

**含义**：抓取 = 信任投票；Google 是否继续花预算在你身上。

---

### ④ GSC → 站点地图 → Tier1 sitemap 状态

| 看什么 | 正确曲线 |
|--------|----------|
| 状态：成功 ✅；已发现网页数 逐步变化 | 不要求立刻等于 Tier1 数量；Google 会延迟消化 |

**含义**：sitemap 是你对 Google 的声明，是否被采信需要时间。

---

### ⑤ Spot check（人工抽 2 个 URL）

- **1 个主 Scene（tier=1）**：canonical 正确、可索引、无异常 308/500。
- **1 个被合并页（noindex + canonical）**：noindex 生效、canonical 指向主 Scene。

**含义**：防工程性错误。**不看排名、不看点击**。

---

## 二、14 天判断标准

### ✅ 健康（满足 2 条即可）→ 继续静置，不动

- 抓取量 稳定或上升  
- 已索引页 没有连续下滑  
- sitemap 一直成功  
- 已发现页 没有断崖式减少  

### ⚠️ 观察（允许）→ 继续观察，不动

- 已发现页 下降  
- 已索引页 轻微波动  
- 抓取量 1–2 天回落  

### ❌ 介入（才需要动作）

连续 5–7 天：抓取量明显下降、已索引页持续减少、sitemap 报错、大量 Crawled – not indexed 且比例飙升。  
→ **这时才开仓**，而不是现在。

---

## 三、第 15 天阈值表（是否开启下一批主 Scene）

**使用方式**：第 15 天打开 GSC，对照 5 个指标，**只看结论列 → 执行动作**。不许主观发挥。

### 核心判定（5 指标 · 一票否决）

| # | 指标 | 看什么 | 通过 | 未通过含义 |
|---|------|--------|------|------------|
| 1 | 抓取量（7 日均值） | 最近 7 天 vs 前 7 天 | ≥ 0 或上升 | Google 在降预算 |
| 2 | 已索引页数 | 7 日趋势 | 不连续下滑 | 主 Scene 还没站稳 |
| 3 | 已发现页数 | 是否断崖 | ≤ -10% 可接受 | 正在重算（可接受） |
| 4 | sitemap 状态（Tier1） | 成功 | 无错误 | 工程问题，必须先修 |
| 5 | URL 抽检 | 2 主 + 2 合并 | canonical / noindex 正常 | 工程或规则错误 |

### 结论区

| 结论 | 条件 | 动作 |
|------|------|------|
| **🟢 允许开启下一批** | #1 抓取量 ≥ 0；#2 已索引未连续下滑；#4 sitemap 无错误 | 每 type +3–5 主 Scene；只跑 084；阈值不变；不改 sitemap、不加 redirect |
| **🟡 继续静置** | #1 略降但未连续；#2 横盘；#3 已发现下降（允许） | 什么都不做；再等 7 天 |
| **🔴 禁止扩展** | 抓取量 连续 5–7 天下降；已索引 连续 5 天下降；sitemap 报错；抽检 canonical/noindex 错误 | 禁止新主 Scene、禁止下一批；只允许修工程错误 |

### 节奏上限（防超速）

| 周期 | 最大动作 |
|------|----------|
| 7 天 | 每 type ≤ 5 个主 Scene |
| 14 天 | 总主 Scene 增量 ≤ 10–15% |
| 30 天 | 不超过 1 次大结构判断 |

---

## 四、每日填表模板（人工 · 3 分钟）

**每天只填一行。** 来源：GSC（不跑脚本、不接 API）。

### 5 个指标（固定）

| # | 指标 | GSC 位置 |
|---|------|----------|
| 1 | 抓取量 | Settings → Crawl stats |
| 2 | 已发现 | Pages → Not indexed → Discovered |
| 3 | 已索引 | Pages → Indexed |
| 4 | Sitemap 成功率 | Sitemaps |
| 5 | URL 抽检 | URL Inspection |

### 填表行（复制用）

```
日期：YYYY-MM-DD
1️⃣ 抓取量：今日 ____ pages/day ； 对比昨日 ↑/→/↓
2️⃣ 已发现：当前 ____ ； 对比昨日 ↑/→/↓
3️⃣ 已索引：当前 ____ ； 对比昨日 ↑/→/↓
4️⃣ Tier1 Sitemap：成功/有警告/报错 ； 已提交 ____ ； 已发现 ____ ； 已索引 ____
5️⃣ URL 抽检：主 Scene 索引✓/✗ canonical✓/✗ ； 被合并页 noindex✓/✗ canonical✓/✗
今日结论：🟢 EXPAND / 🟡 HOLD / 🔴 STOP
备注（≤1 句）：__________
```

---

## 五、填表 → Admin 面板字段映射

**一行 = 一天**；全部为观察值，不做新算法。

| 面板字段 | 类型 | 对应填表 |
|----------|------|----------|
| `date` | date | 日期 |
| `phase` | HOLD/EXPAND/STOP | 今日结论 |
| `crawl_pages_per_day` | number | 今日抓取量 |
| `crawl_trend` | up/flat/down | 抓取 对比昨日 |
| `discovered_total` | number | 已发现 当前 |
| `discovered_trend` | up/flat/down | 已发现 对比昨日 |
| `indexed_total` | number | 已索引 当前 |
| `indexed_trend` | up/flat/down | 已索引 对比昨日 |
| `sitemap_status` | success/warning/error | Tier1 状态 |
| `sitemap_submitted` | number | 已提交 URL 数 |
| `sitemap_discovered` | number | 已发现 |
| `sitemap_indexed` | number | 已索引 |
| `sample_main_scene_ok` | boolean | 主 Scene canonical+index ✓ |
| `sample_merged_scene_ok` | boolean | 被合并页 noindex+canonical ✓ |
| `note` | text | 备注 |

### 第 15 天只读计算（不新增字段）

```
pass =
  crawl_trend !== 'down' 且 非连续5天下滑 &&
  indexed_trend 非连续5天下滑 &&
  sitemap_status !== 'error' &&
  sample_main_scene_ok &&
  sample_merged_scene_ok
```
- `pass = true` → 显示 🟢 可进入下一批  
- `pass = false` → 显示 🟡 继续 HOLD 7 天  
- 不自动触发任何动作，只显示提示。

---

## 六、心态与执行口令

> 你现在做的是「让 Google 重新理解你」，不是「让 Google 立刻奖励你」。  
> AI Overview / LLM 引用的前置：**结构稳定、语义收敛、行为可预测**。这三步你已经做完。

**执行口令（贴 Admin 看板）**：  
> 「抓取量站稳之前，不允许任何扩展。」  
> 「索引波动是消化，不是问题。」  
> 「只在抓取量站稳后扩展；索引不稳，一律不动。」

---

## 七、面板顶部固定提示（必须原样）

> 当前阶段：稳定期（Lockdown）  
> 架构已完成，Google 正在建立信任。  
> 扩展只在「抓取量站稳」后进行。

**状态标识（Admin 顶部，可中英并行）**：  
> Current Phase: LOCKDOWN · Architecture completed. Waiting for Google / LLM trust ramp. Expansion is blocked by design.

---

## 八、交接说明（写在面板/文档最前）

> 这是一个**防止误操作**的面板。  
> 唯一作用：在正确的时间允许继续，在错误的时间阻止动手。

---

## 九、相关文档

| 文档 | 用途 |
|------|------|
| **OWNER_BRIEF_LOCKDOWN.md** | 决策交接 / 反误操作；Owner 定义，最高优先级 |
| **OWNER_DECISION_CARD_A4.md** | 一页老板决策卡片，贴 Admin / Notion |
| **STRATEGY_AND_RECENT_CHANGES.md** | 策略总览、两日调整、锁仓结论与后续节奏 |
