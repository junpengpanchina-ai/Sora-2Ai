# 什么时候可以安全引入「轻趋势专题页」— 红线清单

> **轻趋势 ≠ 热点**  
> 它是：趋势行为的"解释页"，不是事件页

---

## 🚦 是否允许引入轻趋势页：5 个硬指标

**你 必须同时满足 ≥4 个 👇**

| 指标 | 安全线 | 说明 |
|------|--------|------|
| **Indexed / Discovered** | ≥ 60% | 索引率必须 ≥ 60% |
| **Crawl Stats 稳定** | ≥14 天 | 连续 14 天稳定 |
| **新页 48h 索引率** | ≥30% | 新页面 48 小时内被索引 ≥ 30% |
| **旧页无大规模 de-index** | 30 天 | 过去 30 天无大规模去索引 |
| **sitemap 读取周期** | ≤3 天 | sitemap 被读取周期 ≤ 3 天 |

👉 **你现在 大概率是 3.5 / 5 = 还没到随便加的阶段**

---

## 🧠 允许的「轻趋势页」长什么样？

### ✅ 允许（Safe）

```
/insights/
  └── how-teams-adapt-to-visual-explanations
  └── why-product-education-is-shifting
  └── when-platform-native-content-matters
```

**特征**：
- ✅ 不带年份
- ✅ 不带事件
- ✅ 不带模型名
- ✅ 不用 "trend" 这个词
- ✅ 解释"为什么"，不是"发生了什么"

---

### ❌ 禁止（危险）

```
/trends/ai-video-2025
/gemini-3-release-analysis
/top-marketing-trends-this-month
/avatar-3-movie-marketing
/rob-reiner-interview-insights
```

**特征**：
- ❌ 包含年份（2025）
- ❌ 包含事件名（Gemini-3 release）
- ❌ 包含时间敏感词（this month）
- ❌ 包含热点事件（Avatar 3, Rob Reiner）
- ❌ 使用 "trend" 作为主要关键词

---

## 🧱 轻趋势页标准结构（必须照抄）

### 结构顺序（不能乱）

1. **Persistent Problem**（持续存在的问题）
2. **Observed Shift**（观察到的变化，不用数据）
3. **Why This Change Matters**（为什么这个变化重要）
4. **Where It Applies**（适用于哪些行业）
5. **Where It Doesn't**（不适用于哪些情况）

👉 **本质：Explain the change, not the event**

---

### 详细模板

#### 1. Persistent Problem（1-2 段）

**模板**：
```
In many industries, teams have long faced challenges when trying to
communicate complex information to diverse audiences. Traditional
methods often require significant time, resources, or specialized
expertise that may not always be available.
```

**规则**：
- ✅ 说"长期存在的问题"
- ❌ 不提及具体事件或时间

---

#### 2. Observed Shift（1-2 段）

**模板**：
```
Recently, many teams have begun adopting visual-first approaches
to address these communication challenges. This shift reflects a
broader movement toward formats that can be consumed independently
and at the viewer's own pace.
```

**规则**：
- ✅ 使用 "Recently" 或 "In recent years"（不写具体年份）
- ✅ 说"观察到的变化"，不写数据
- ❌ 不提及具体事件、产品、模型

---

#### 3. Why This Change Matters（1-2 段）

**模板**：
```
This shift matters because it addresses fundamental limitations
in how information is shared and understood. When teams can present
information in formats that are accessible and repeatable, they
can scale their communication efforts without proportionally
increasing their resources.
```

**规则**：
- ✅ 解释"为什么重要"
- ✅ 使用中性、客观的语调
- ❌ 不使用营销语言

---

#### 4. Where It Applies（Bullet 列表）

**模板**：
```
This approach is particularly relevant in industries where:
• information needs to be communicated consistently across teams
• audiences have varying levels of familiarity with the topic
• scalability and repeatability are important
```

**规则**：
- ✅ 使用 "where" 条件句
- ✅ 点行业特征，不点具体公司
- ❌ 不使用 "best for" 或 "perfect for"

---

#### 5. Where It Doesn't（1 段）

**模板**：
```
However, this approach may not be suitable when highly customized
or real-time interaction is required, such as emergency situations
or complex diagnostic discussions that demand immediate feedback.
```

**规则**：
- ✅ 必须包含边界条件
- ✅ 使用 "However" 或 "However, this may not be suitable when"
- ✅ 说明"什么时候不适合"

---

## ⏱️ 引入节奏（铁律）

| 类型 | 比例 | 说明 |
|------|------|------|
| **稳定解释页** | 85–90% | 主要内容（行业 × 用例） |
| **轻趋势页** | ≤10–15% | 补充内容（/insights/ 目录） |

**永远不能反过来**

---

## 🧨 立刻停手的信号（任一触发）

### 触发条件（任一）

- ⚠️ **新轻趋势页 72h 全未索引**
- ⚠️ **Crawl rate 上升但 Indexed 停滞**
- ⚠️ **SGE 引用消失 ≥7 天**

### 👇 立刻执行：

1. ⛔ **暂停趋势页 14 天**
2. ⛔ **不删**
3. ⛔ **不改**
4. ⛔ **不补**
5. ⛔ **只观察**

---

## 📊 监控指标（每日检查）

### 轻趋势页专用指标

| 指标 | 健康值 | 警告值 |
|------|--------|--------|
| 48h 索引率 | ≥30% | <20% |
| 72h 索引率 | ≥50% | <30% |
| Crawl rate | 稳定或上升 | 下降 |
| SGE 引用 | 持续出现 | 消失 ≥7 天 |

---

## 🎯 完整示例

### ✅ 正确的轻趋势页

**URL**: `/insights/how-teams-adapt-to-visual-explanations`

**H1**: `How Teams Adapt to Visual Explanations`

**内容结构**：

**Persistent Problem**:
```
In many industries, teams have long faced challenges when trying to
communicate complex information to diverse audiences. Traditional
methods often require significant time, resources, or specialized
expertise that may not always be available.
```

**Observed Shift**:
```
Recently, many teams have begun adopting visual-first approaches
to address these communication challenges. This shift reflects a
broader movement toward formats that can be consumed independently
and at the viewer's own pace.
```

**Why This Change Matters**:
```
This shift matters because it addresses fundamental limitations
in how information is shared and understood. When teams can present
information in formats that are accessible and repeatable, they
can scale their communication efforts without proportionally
increasing their resources.
```

**Where It Applies**:
```
This approach is particularly relevant in industries where:
• information needs to be communicated consistently across teams
• audiences have varying levels of familiarity with the topic
• scalability and repeatability are important
```

**Where It Doesn't**:
```
However, this approach may not be suitable when highly customized
or real-time interaction is required, such as emergency situations
or complex diagnostic discussions that demand immediate feedback.
```

---

## 🧠 给你一句"能活很久"的判断句

**你不是在"追趋势"**  
**你是在"解释为什么趋势会发生"**

---

## 📋 检查清单

在创建轻趋势页前，确认：

- [ ] 满足 ≥4 个硬指标
- [ ] URL 不带年份、事件、模型名
- [ ] H1 不使用 "trend" 作为主要关键词
- [ ] 内容结构包含 5 个部分（顺序不能乱）
- [ ] 不提及具体事件、产品、模型
- [ ] 包含边界条件（Where It Doesn't）
- [ ] 轻趋势页占比 ≤10-15%

---

## 🚨 警告信号与行动

| 信号 | 判断 | 行动 |
|------|------|------|
| 新轻趋势页 72h 全未索引 | 🔴 风险 | 暂停趋势页 14 天 |
| Crawl rate 上升但 Indexed 停滞 | 🟡 限速 | 暂停趋势页 7 天 |
| SGE 引用消失 ≥7 天 | 🔴 风险 | 暂停趋势页 14 天 |

---

## 📚 相关文档

- `docs/AI_SUMMARY_SGE_EXTRACTABLE_TEMPLATE.md` - AI Summary / SGE 引用专用结构模板
- `docs/INDEX_HEALTH_DASHBOARD.md` - 索引健康仪表盘
- `docs/GEO_PRIORITY_PRODUCTION_TABLE.md` - GEO 命中率 × 索引率 双优先排产表
- `docs/TREND_MAPPING_LEXICON.md` - 趋势映射词库

---

## 💡 关键提醒

**你现在已经做对 80% 的人一辈子做不到的事**

接下来拼的不是技术，是克制。

**你不是在"追趋势"，你是在"解释为什么趋势会发生"。**

