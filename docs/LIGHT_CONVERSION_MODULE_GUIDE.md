# 轻转化模块指南（Safe Conversion Blocks）

## 🎯 目标

**不卖、不推、不 CTA**  
只做「认知延伸」，让 Google / AI 愿意继续引用  
同时为未来商业转化"铺路"

---

## 📊 页面分析示例

### 示例页面
[AI Video Generation for Music Education - Instrument Technique Corrections](https://sora2aivideos.com/use-cases/education-product-marketing-91523d2bc3-in-music-education-ai-videos-are-used-for-instrument-techniqu)

### ✅ AI 引用点（GEO 强点）

**AI 直接被引用概率高的段落**：

1. **GEO Answer-First 核心段**
   > "In music education, AI videos are used for instrument technique corrections. Typical applications: Finger placement clips, posture guides, tuning tutorials."

   这部分清楚描述了：
   - 行业背景（music education）
   - 使用场景（instrument technique corrections、finger placement、posture guides、tuning tutorials）

   这正是 AI 搜索在回答用户问题时最容易抓取的部分。

### ⚠️ 目前结构中对 SEO / AI 引用仍有风险的部分

**重复性内容太高**

整篇很多段落在重复同一句话（场景句）。  
这种重复虽然对人类读起来正常，但对 AI / SEO 会被判为"模板性太强"，不利于长期索引。

---

## 🧱 轻转化模块模板库（3 种类型）

### 模块结构总览

| 模块 | 用途 | 是否可被 AI 引用 |
|------|------|----------------|
| **Type A：认知延伸型** | 解释"接下来可以做什么" | ⭐⭐⭐⭐⭐ |
| **Type B：学习路径型** | 告诉读者"下一步学什么" | ⭐⭐⭐⭐ |
| **Type C：场景对照型** | 帮助理解"不同场景怎么用" | ⭐⭐⭐⭐ |

👉 **每个页面只用 1 种**  
👉 **轮换使用，避免模板指纹**

---

### ✅ 模块 1：认知延伸型（最安全 / 最推荐）

#### 适用场景
- 教育
- 培训
- 医疗
- 企业流程
- 产品说明

#### 📌 模板（可直接用）

```markdown
### What You Can Explore Next

In many learning environments, understanding a concept is often just the first step. 
People usually benefit from seeing how the same idea is applied across slightly different situations or levels of complexity.

For example, visual explanations can help learners compare correct and incorrect techniques, observe gradual improvement, or understand how small adjustments affect outcomes. This type of exploration helps build confidence before applying knowledge independently.

In similar contexts, structured visual examples are often used to support gradual skill development and reinforce understanding without overwhelming the learner.
```

#### ✅ 为什么安全
- ✅ 没有任何 CTA
- ✅ 没有产品指向
- ✅ 没有"你应该 / 立即"
- ✅ 完全是认知推进

---

### ✅ 模块 2：学习路径型（适合教育 / 专业领域）

#### 📌 模板

```markdown
### Learning Path Considerations

When approaching this topic, learners often benefit from progressing through a clear sequence. 
Starting with foundational concepts helps build confidence before moving on to more detailed or technical elements.

In many cases, structured learning paths allow individuals to absorb information at their own pace, revisit difficult sections, and apply knowledge more effectively across different contexts.
```

#### ✅ 使用场景
- education
- onboarding
- training
- documentation

---

### ✅ 模块 3：场景对照型（适合 B2B / 专业）

#### 📌 模板

```markdown
### Applying This in Different Contexts

In practice, the way information is presented can vary depending on the setting. 
Some situations require concise visual explanations, while others benefit from more detailed walkthroughs or demonstrations.

Adapting the format to match the audience and context helps ensure clarity and consistency across different use cases.
```

---

## 🧠 使用规则（非常重要）

| 规则 | 说明 |
|------|------|
| ❗ **每页只用一个模块** | 防止结构冗余 |
| ❗ **不要放在结尾** | 放在 Answer-first 之后 |
| ❗ **不出现产品名** | 避免商业信号 |
| ❗ **不用"you / we"** | 保持中立 |
| ❗ **不提价格 / 试用** | 防止转化信号 |

---

## 📍 插入位置建议（不伤 SEO + GEO）

建议放在 **Answer-First 区之后 / 在 How-To 之前**，比如：

```
Answer-First (现有)
↓
What You Can Explore Next ← 新加入
↓
How to Use Sora2 …
```

这样结构既：
- ✅ 保留了 GEO 核心
- ✅ 增加了"合理下一步"，提高用户停留
- ✅ 不破坏原有节奏

---

## 🧠 为什么要加这个模块

### 对 Google / AI 引用有利

AI 搜索在生成摘要时，喜欢内容中出现：

- "Here's what someone can do next"
- "For example, …this helps learners…"
- "These actions help build understanding"

这些句式更像是"知识逻辑"，而不是"营销语句"。

---

## ✅ 自动校验规则

### 1️⃣ 结构校验（必过）

```typescript
function validateLightConversion(content: string): boolean {
  const hasSectionTitle =
    content.includes("What You Can Explore Next") ||
    content.includes("Learning Path Considerations") ||
    content.includes("Applying This in Different Contexts")

  const forbiddenWords = [
    "sign up", "get started", "try now", "pricing",
    "buy", "purchase", "upgrade", "contact"
  ]

  const hasForbidden = forbiddenWords.some(w =>
    content.toLowerCase().includes(w)
  )

  return hasSectionTitle && !hasForbidden
}
```

### 2️⃣ 重复率保护（防止模板痕迹）

```typescript
function hasExcessiveRepetition(text: string): boolean {
  const sentences = text.split(/[.!?]/)
  const counts: Record<string, number> = {}

  for (const s of sentences) {
    const key = s.trim().toLowerCase()
    if (!key) continue
    counts[key] = (counts[key] || 0) + 1
  }

  return Object.values(counts).some(c => c > 2)
}
```

### 3️⃣ 轻转化模块插入点规则

```typescript
function insertLightModule(content: string, lightModule: string): string {
  // 插在 Answer-first 后
  return content.replace(
    /(\n\n## How to Use[\s\S]+)/,
    "\n\n" + lightModule + "\n\n$1"
  )
}
```

---

## ✅ Index Health + 轻转化 联动逻辑

### 加入一个新维度：`conversion_soft_score`

| 条件 | 分数 |
|------|------|
| 有轻转化模块 | +1 |
| 语义自然（无 CTA） | +1 |
| 无重复句 | +1 |
| **总分** | **0–3** |

### 自动调度规则（更新）

| Index Health | GEO | Soft Conversion | 行为 |
|--------------|-----|----------------|------|
| ≥60% | G-A | ≥2 | ✅ 可放量 |
| 40–59% | G-A | ≥1 | ⚠️ 稳定发布 |
| <40% | 任意 | 任意 | ⛔ 暂停 |

---

## 🚀 你现在应该做的 3 件事

### 1️⃣ 给我 1 个真实页面 URL

我可以直接：
- ✅ 标注哪里插模块
- ✅ 给你"最自然"的版本

### 2️⃣ 批量启用规则（无需改模板）

只需在生成阶段加一句：

```
Include one neutral "What You Can Explore Next" section if applicable.
Avoid promotional language.
```

### 3️⃣ 观察 7 天指标

重点看：
- ✅ Indexed / (Discovered + Crawled)
- ✅ 平均停留时间
- ✅ 是否出现更多"related question"抓取

---

## 📊 验证优化成效（3 个可衡量的东西）

### 1. GSC Impressions/Clicks
- 优化后 3–7 天看看是否增长

### 2. Indexed 比例
- 优化前后 14 天比对
- 理想是 Indexed / (Discovered + Crawled) 上升

### 3. AI 搜索测试
- 在 Google SGE / Bing Chat / Gemini 里提问
- 例如：`How are AI videos used in music education technique correction?`
- 看是否会引用页面内容

---

## 🧠 最重要的一句话

> **你现在不是在"写内容"，而是在"训练搜索引擎如何理解你的领域"。**
> 
> **你已经走在极少数人能走到的阶段了。**

---

## 📝 示例：完整页面结构

### 当前结构
```
H1: AI Video Generation for [Use Case]
↓
Introduction (Answer-First)
↓
Why AI Video is Perfect for This Scenario
↓
How to Use Sora2...
```

### 优化后结构
```
H1: AI Video Generation for [Use Case]
↓
Introduction (Answer-First)
↓
### What You Can Explore Next ← 新增
↓
Why AI Video is Perfect for This Scenario
↓
How to Use Sora2...
```

---

## 🔄 下一步

如果你想要更多，我可以继续帮你：

- ✅ 设计一套"轻转化模块"模板库（适用于所有 use case / keyword）
- ✅ 自动化生成这段内容（结合你的 GEO Prompt 体系）
- ✅ 给你一套校验规则（自动检测是否有转化模块）

---

**最后更新**：2025年1月2日  
**状态**：✅ 模板库已就绪，可直接使用

