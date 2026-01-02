# 稳态放大执行方案

## 🎯 核心认知

> **你现在不是在「做 SEO」，而是在运营一个可预测的搜索资产系统。**
> 
> **你现在已经不在"SEO 竞争层"，而是在训练一个搜索引擎如何理解你的知识体系。**
> 
> **大多数站永远到不了这一步。**

---

## ✅ 一、你现在处在什么阶段

### 当前状态

| 项 | 状态 |
|------|------|
| **指数健康** | ≈45–55%（消化中） |
| **AI-Prime 覆盖率** | 已完成（10% 高质量池） |
| **结构稳定性** | ✅ 高 |
| **模板一致性** | ✅ 已解决 |
| **风险等级** | 🟡 可控 |
| **下一阶段目标** | 把「被理解」转成「被引用」 |

### 👉 你现在最重要的不是发更多内容，而是：

> **让 Google/AI "确信你是一个稳定、可信、可扩展的知识源"。**

---

## ✅ 二、三样"现在就能用"的东西

### ① 自动挑出最该升级的 10 个页面

#### 🎯 推荐权重公式（直接可用）

```
priority_score =
  (ai_prime_score * 0.45)
  + (ai_signal_score * 0.30)
  + (purchase_intent * 0.15)
  + (index_health_weight * 0.10)
```

其中：

```
index_health_weight =
  index_health >= 60 ? 1 :
  index_health >= 40 ? 0.5 :
  0
```

#### ✅ SQL（可直接跑）

**文件**：`database/migrations/select_top_10_upgrade_pages.sql`

```sql
SELECT
  page_id,
  slug,
  ai_prime_score,
  ai_signal_score,
  purchase_intent,
  index_health,
  (
    ai_prime_score * 0.45 +
    ai_signal_score * 0.30 +
    purchase_intent * 0.15 +
    CASE
      WHEN index_health >= 60 THEN 1
      WHEN index_health >= 40 THEN 0.5
      ELSE 0
    END * 0.10
  ) AS upgrade_priority
FROM page_meta
WHERE
  status = 'published'
  AND ai_prime_score >= 4
  AND geo_level = 'G-A'
ORDER BY upgrade_priority DESC
LIMIT 10;
```

👉 **这 10 条 = 当前最值得升级成"赚钱页"的页面**  
（不会伤 Index，也最容易产生转化）

#### ✅ TypeScript 实现

**文件**：`lib/upgrade-priority-calculator.ts`

```typescript
import { calculateUpgradePriority, selectTopUpgradePages } from '@/lib/upgrade-priority-calculator'

// 计算单个页面优先级
const result = calculateUpgradePriority({
  aiPrimeScore: 5,
  aiSignalScore: 6,
  purchaseIntent: 2,
  indexHealth: 55,
  indexState: 'indexed'
})

// 批量选择 Top 10
const top10 = selectTopUpgradePages(pages, 10)
```

---

### ② AI-Prime → Conversion 信息流（清晰版）

你现在的结构已经是正确的，只需要 **一条非常清晰的"心理路径"**：

```
[AI Search / Google]
        ↓
[AI-Prime Page]
  - 解释
  - 定义
  - 中立
        ↓
[Bridge Module]   ← 你刚加的
  - 认知延伸
  - 无推销
        ↓
[Conversion Layer]
  - 示例 / 场景
  - "如果你想继续了解…"
```

#### 关键点（很多人会搞错）

❌ **Conversion 不是 CTA**  
✅ **Conversion = "允许继续探索的路径"**

---

### ③ 真正可用的 Bridge → Conversion 示例

#### 🧩 Bridge（你已经在用的）

```markdown
### What You Can Explore Next

In many real-world learning environments, understanding a concept is only the starting point.
People usually benefit from seeing how the same idea appears in different practical contexts.

For example, structured visual explanations can help clarify how processes change across use cases,
allowing learners to build confidence before applying knowledge independently.
```

#### ➡️ 接一个"非销售型 Conversion Block"

```markdown
### Exploring Related Use Cases

In practice, similar approaches are often used in areas such as onboarding, skills training,
or process explanation. These use cases help illustrate how the same concept can be adapted
to different audiences and communication goals.

If you're exploring how this approach works across scenarios,
reviewing related examples can provide additional context and perspective.
```

#### ⚠️ 注意这里

- ✅ 没有"try / buy / start"
- ✅ 没有品牌名
- ✅ 没有行动命令
- ✅ 但自然暗示"你可以继续看"

**完整模板库**：👉 [`BRIDGE_TO_CONVERSION_TEMPLATES.md`](./BRIDGE_TO_CONVERSION_TEMPLATES.md)

---

## 🧠 三、14 天「安全放量」节奏（非常关键）

### Day 1–3（现在）

**只升级那 10 个页面**

每页只加：
- ✅ 1 个 Bridge 模块
- ✅ 0–1 个 Conversion 模块

👉 **目标：测试"AI 是否继续吃你"**

---

### Day 4–7

**观察**：

| 指标 | 正常 |
|------|------|
| 索引 | 缓慢上升 |
| 印象 | 稳定或略增 |
| 平均位置 | 不下降 |

**如果成立 → 继续**

---

### Day 8–14

**每天增加 5–10 个页面**

- ✅ 只用已验证过的结构
- ✅ 不改模板、不改节奏

---

## 🧭 你现在最重要的 3 件事

1. ✅ **不要再加新结构**
2. ✅ **不要改已有成功页**
3. ✅ **让 Google"习惯你现在的样子"**

---

## 📊 完整执行清单

### 今天（30 分钟）

- [ ] 执行 `select_top_10_upgrade_pages.sql`，选出 10 个页面
- [ ] 为这 10 个页面添加 Bridge 模块
- [ ] 为其中 5 个页面添加 Conversion Block（使用模板）

### 接下来 7 天

- [ ] 每天观察 3 个指标（Indexed、Impressions、Avg position）
- [ ] 如果指标正常，继续添加 Conversion Block
- [ ] 不改模板、不改结构

### Day 8–14

- [ ] 如果 Index Health ≥ 60%，每天新增 5–10 个页面
- [ ] 使用已验证的结构
- [ ] 继续观察指标

---

## 🧠 最后一句真话

> **你现在已经不在"SEO 竞争层"，而是在训练一个搜索引擎如何理解你的知识体系。**
> 
> **大多数站永远到不了这一步。**

---

## 📝 相关文档

- **AI-Prime → Conversion 完整指南**：👉 [`AI_PRIME_TO_CONVERSION_GUIDE.md`](./AI_PRIME_TO_CONVERSION_GUIDE.md)
- **Bridge → Conversion 模板库**：👉 [`BRIDGE_TO_CONVERSION_TEMPLATES.md`](./BRIDGE_TO_CONVERSION_TEMPLATES.md)
- **升级优先级计算器**：👉 `lib/upgrade-priority-calculator.ts`
- **SQL 查询**：👉 `database/migrations/select_top_10_upgrade_pages.sql`

---

**最后更新**：2025年1月2日  
**状态**：✅ 稳态放大方案已就绪，可直接执行

