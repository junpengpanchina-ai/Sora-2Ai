# 完整 GEO & SEO 指南 - 更新日志

> **更新日期**：2025-12-30  
> **更新内容**：整合所有关键改进，修复硬伤，加入商业转化层

---

## ✅ 已完成的更新

### 0️⃣ 立即修正的硬错误（必须改）

#### ✅ Robots.txt 域名修正

**问题**：文档中写的是错误的域名 `www.sora2ai.com`

**修正**：
- ✅ 已更新为正确域名：`https://sora2aivideos.com`
- ✅ 添加了警告说明：会影响 Google 发现和抓取量

**位置**：`docs/COMPLETE_GEO_SEO_GUIDE.md` - SEO 优化要点章节

---

### 1️⃣ GEO-A v2 补成"可索引 + 可变体 + 可控重复"

#### ✅ Variant ID 追踪系统

**新增内容**：
- Variant ID 格式：`H1{A/B}_AF{A/B/C}_PP{time/understanding/scale/cost}`
- 数据库字段建议
- 用途说明（追溯、分析、运营）

**位置**：`docs/COMPLETE_GEO_SEO_GUIDE.md` - GEO-A v2 策略章节

---

### 2️⃣ Index Health Dashboard 增加 2 个变化率指标

#### ✅ 新增索引率（近 7 天）

**计算公式**：
```
新增索引率 = ΔIndexed_7d / Δ(Discovered + Crawled)_7d
```

**阈值**：
- ≥30%：健康
- 15–30%：限速
- <15%：风险

#### ✅ Crawl→Index 转化率（近 7 天）

**计算公式**：
```
Crawl→Index 转化率 = ΔIndexed_7d / ΔCrawled_7d
```

**阈值**：
- ≥30%：健康
- 15–30%：限速
- <15%：风险

**位置**：`docs/COMPLETE_GEO_SEO_GUIDE.md` - Index Health Dashboard 章节

---

### 3️⃣ 自动排产系统加入 Purchase Intent

#### ✅ 新增第四维：Purchase Intent（购买意图分）

**分数定义**：
- **3 分**：明确交付任务（product demo / listing video / course promo）
- **2 分**：工作场景强（onboarding / training / internal comms）
- **1 分**：学习/解释型（what is / why / how）
- **0 分**：纯泛营销/空泛场景

**排产规则**：
- ✅ 优先发布：GEO≥80 且 Intent≥2 的页
- ⚠️ Intent≤1 的页默认做 "SEO/GEO资产层"，不背转化 KPI

**代码实现**：
- ✅ `lib/production-scheduler.ts` 已更新
- ✅ 添加 `calculatePurchaseIntent()` 函数
- ✅ 更新 `makeProductionDecision()` 函数

**位置**：
- `docs/COMPLETE_GEO_SEO_GUIDE.md` - 自动排产系统章节
- `lib/production-scheduler.ts` - 代码实现

---

### 4️⃣ 商业转化层（Conversion Layer v1）

#### ✅ 新增完整章节

**核心内容**：
1. Prompt Preview（80% 填好）
2. CTA 统一改文案（"Continue generating this video"）
3. 付费墙只锁 4 件事（Export / No watermark / Style controls / Prompt edit）
4. 三步漏斗指标（Page → Prompt → 注册 → 付费）
5. 红线规则（解释页不背付费 KPI，交付页才背）

**页面设计模板**：
- 视频示例区域
- Prompt Preview 组件
- 转化引导区域

**位置**：`docs/COMPLETE_GEO_SEO_GUIDE.md` - 商业转化层章节

---

### 5️⃣ 趋势映射部分补"合法可索引的写法规范"

#### ✅ 禁词清单

**绝对别写的词**：
- trending / hot / viral
- this week / latest / 2025 / 2026
- Google Trends shows / according to trends
- "爆火/热搜/风口"（中文语义，英文同义也算）

#### ✅ 安全替代表达

**使用这些表达替代**：
- "in many teams" / "commonly used when"
- "in practice" / "in scenarios where"
- "when teams need to" / "in many industries"

**位置**：`docs/COMPLETE_GEO_SEO_GUIDE.md` - 趋势映射词库章节

---

### 6️⃣ 页面类型分层（避免 KPI 混乱）

#### ✅ 三层页面定义

1. **Asset Layer（资产层）**
   - SGE 6-block + GEO 解释页
   - KPI：引用/索引/覆盖
   - Purchase Intent ≤ 1

2. **Conversion Layer（转化层）**⭐ 核心
   - 行业 × 交付场景（Intent ≥ 2）
   - KPI：Prompt 点击→注册→付费
   - 你现在缺第2层，所以"收录了但不赚钱"是必然

3. **Core Sample Layer（样本层）**
   - 少量人工/高质量示例页
   - KPI：外链/品牌信任/加速抓取扩散

**位置**：`docs/COMPLETE_GEO_SEO_GUIDE.md` - 页面类型分层章节

---

## 🚀 下一步最该做的 3 个动作

### 1️⃣ 修 robots sitemap 域名（立刻）⚠️

**行动**：
1. 检查 `app/robots.ts` 和 `app/robots.txt`
2. 确保使用正确域名：`https://sora2aivideos.com`
3. 验证 `getBaseUrl()` 函数返回正确域名

**影响**：会直接影响发现量/抓取量，不是小问题

---

### 2️⃣ 排产表加入 Intent 分（今天就能做）

**行动**：
1. 在数据库中添加 `purchase_intent` 字段（0-3 分）
2. 更新内容生成流程，自动计算 Purchase Intent
3. 更新排产决策，优先发布 Intent≥2 的页

**代码已就绪**：
- ✅ `lib/production-scheduler.ts` 已更新
- ✅ `calculatePurchaseIntent()` 函数已实现

---

### 3️⃣ 所有 Intent≥2 页面加 Prompt Preview + CTA 改文案（本周最值钱）

**行动**：
1. 为所有 Intent≥2 的页面添加 Prompt Preview 组件
2. 统一 CTA 文案为 "Continue generating this video"
3. 监控三步漏斗指标：
   - Page → Prompt 点击率（目标 ≥8%）
   - Prompt → 注册率（目标 ≥25%）
   - 注册 → 付费率（目标 ≥5%）

**预期效果**：
- 将"信息页"转化为"正在进行的任务页"
- 提升用户转化率

---

## 📊 更新后的完整系统

### 4 个分数系统

1. **GEO 命中率**（0-100）
2. **Index Health**（0-100%）
3. **Trend Pressure**（0-4）
4. **Purchase Intent**（0-3）⭐ 新增

### 7 个核心指标

**存量指标**（5 个）：
1. Discovered – not indexed
2. Crawled – not indexed
3. Indexed
4. Crawl requests/day
5. Sitemap read success

**变化率指标**（2 个）⭐ 新增：
6. 新增索引率（近 7 天）
7. Crawl→Index 转化率（近 7 天）

### 3 层页面类型

1. **Asset Layer**（资产层）
2. **Conversion Layer**（转化层）⭐ 核心
3. **Core Sample Layer**（样本层）

---

## 📚 相关文档

- `docs/COMPLETE_GEO_SEO_GUIDE.md` - 完整 GEO & SEO 指南（已更新）⭐⭐⭐⭐⭐
- `lib/production-scheduler.ts` - 自动排产决策函数（已更新）
- `docs/BUSINESS_INTEGRATED_STRATEGY.md` - 业务整合策略

---

**所有更新已完成，可直接使用！**

