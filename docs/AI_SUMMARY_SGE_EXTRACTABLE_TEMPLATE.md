# AI Summary / SGE 引用专用结构模板（GEO-A v2 · Extractable）

> **目标**：不是排名第一，而是"被摘要"  
> 👉 AI 能快速判断：
> - 你是不是解释源
> - 你是不是中立
> - 你是不是稳定

---

## 🧠 SGE 只摘 3 种段落

| 类型 | 被引用概率 | 说明 |
|------|-----------|------|
| 定义型（What / Why） | ⭐⭐⭐⭐⭐ | 最高优先级 |
| 决策支持型（When / Which） | ⭐⭐⭐⭐☆ | 高优先级 |
| 场景示例型（In practice） | ⭐⭐⭐⭐ | 中高优先级 |

### ❌ 不摘：

- ❌ 观点
- ❌ 情绪
- ❌ 结论性口号

---

## 🧱【必抄】AI Summary 标准结构（顺序不能乱）

### 🧩 Block 0：Context Anchor（1–2 句）

**这是"是否被引用"的第一关**

**模板**：
```
In many industries, teams need a way to explain complex concepts
without requiring real-time demos or live presentations.
```

**特征**：
- ✅ 不点名趋势
- ✅ 不点名时间
- ✅ 说"长期存在的问题"

**规则**：
- ❌ 不出现「you / we」
- ❌ 不出现品牌
- ❌ 不出现年份
- ❌ 不出现模型名

---

### 🧩 Block 1：Neutral Definition（50–70 字）

**这是 SGE 最爱摘的块**

**模板**：
```
[Concept] refers to a method of presenting information in a structured
and visual format so that users can understand a topic before making
a decision. It is commonly used when explanations need to be concise,
repeatable, and accessible across different contexts.
```

**规则**：
- ❌ 不出现「you / we」
- ❌ 不出现品牌
- ❌ 不出现年份
- ❌ 不出现模型名
- ✅ 使用第三人称
- ✅ 中性、客观的语调

**SGE 引用概率**：**40%**（最高）

---

### 🧩 Block 2：When It's Used（Bullet ×3）

**模板**：
```
It is often used when:
• the audience is unfamiliar with the topic
• explanations need to scale without live support
• consistency across explanations is important
```

**规则**：
- ✅ Bullet 必须是"条件"而不是"好处"
- ✅ 使用 "when" 引导的条件句
- ❌ 不使用 "benefits" 或 "advantages"

**SGE 引用概率**：**25%**

---

### 🧩 Block 3：How It Works (Process, 非教程)

**模板**：
```
The approach typically involves three steps:
1. identifying the core idea that needs explanation
2. presenting it in a simplified structure
3. reinforcing understanding through examples
```

**规则**：
- ⚠️ 不写工具
- ⚠️ 不写"如何用你的产品"
- ✅ 写"方法"或"过程"
- ✅ 使用第三人称

**SGE 引用概率**：**20%**

---

### 🧩 Block 4：Practical Scenario（轻示例）

**模板**：
```
For example, in industries where users compare multiple options,
this format helps them understand differences before engaging further.
```

**规则**：
- ✅ 点行业，不点公司
- ✅ 使用 "For example" 或 "In practice"
- ❌ 不使用具体公司名或产品名

**SGE 引用概率**：**5%**

---

### 🧩 Block 5：Boundary / Limitation（极关键）

**没有这一段，SGE 不信你**

**模板**：
```
However, this approach may not be suitable when
highly customized or real-time interaction is required.
```

**规则**：
- ✅ 必须包含边界条件
- ✅ 使用 "However" 或 "However, this may not be suitable when"
- ✅ 说明"什么时候不适合"
- ❌ 不要过度否定（保持中性）

**SGE 引用概率**：**10%**

---

## 📌 SGE 引用成功率最高的位置

| 位置 | 概率 | 说明 |
|------|------|------|
| Block 1（Neutral Definition） | 40% | 最高优先级 |
| Block 2（When It's Used） | 25% | 高优先级 |
| Block 3（How It Works） | 20% | 中高优先级 |
| Block 5（Boundary / Limitation） | 10% | 关键但概率较低 |
| Block 4（Practical Scenario） | 5% | 补充说明 |

---

## 🚫 3 个"会让 AI 跳过你"的写法

### ❌ 错误写法 1：绝对化表达

**❌ "This is the best way to…"**

**✅ 正确**："This approach is commonly used when…"

---

### ❌ 错误写法 2：时间敏感

**❌ "In 2025, everyone is…"**

**✅ 正确**："Many teams now use…" 或 "In many industries, teams need…"

---

### ❌ 错误写法 3：品牌/产品推广

**❌ "Our solution helps…"**

**✅ 正确**："This method helps…" 或 "The approach helps…"

---

## 📋 完整示例（可直接使用）

### 示例：AI Video for Patient Education

**Block 0：Context Anchor**
```
In many healthcare settings, teams need a way to explain medical
procedures and treatment options without requiring in-person consultations.
```

**Block 1：Neutral Definition**
```
Patient education videos refer to a method of presenting medical
information in a structured and visual format so that patients can
understand their condition and treatment options before making decisions.
It is commonly used when explanations need to be concise, repeatable,
and accessible across different contexts.
```

**Block 2：When It's Used**
```
It is often used when:
• patients are unfamiliar with medical terminology
• explanations need to scale without live support
• consistency across patient communications is important
```

**Block 3：How It Works**
```
The approach typically involves three steps:
1. identifying the core medical concept that needs explanation
2. presenting it in a simplified structure
3. reinforcing understanding through visual examples
```

**Block 4：Practical Scenario**
```
For example, in healthcare settings where patients compare multiple
treatment options, this format helps them understand differences
before engaging further with their healthcare provider.
```

**Block 5：Boundary / Limitation**
```
However, this approach may not be suitable when highly customized
or real-time interaction is required, such as emergency situations
or complex diagnostic discussions.
```

---

## 🔧 在 GEO-A v2 Prompt 中集成

### 更新 Answer-first 部分

将现有的 Answer-first 部分（120-160 词）按照 6 个 Block 结构重组：

```typescript
// lib/prompts/geo-a-template-prompt-v2.ts

// 在 Answer-first 部分添加 SGE Extractable 结构要求
const SGE_EXTRACTABLE_STRUCTURE = `
Answer-first section MUST follow this exact 6-block structure:

Block 0: Context Anchor (1-2 sentences)
- State the persistent problem or need
- No trends, no time, no brands

Block 1: Neutral Definition (50-70 words)
- Define the concept in third person
- No "you/we", no brands, no years, no model names
- SGE reference probability: 40%

Block 2: When It's Used (3 bullet points)
- Use "when" conditions, not benefits
- SGE reference probability: 25%

Block 3: How It Works (3 steps)
- Describe the process, not the tool
- SGE reference probability: 20%

Block 4: Practical Scenario (1 sentence)
- Mention industry, not company
- SGE reference probability: 5%

Block 5: Boundary / Limitation (1 sentence)
- State when it's NOT suitable
- SGE reference probability: 10%
`
```

---

## ✅ 检查清单

在生成内容前，确认：

- [ ] Block 0 不点名趋势、时间、品牌
- [ ] Block 1 使用第三人称，50-70 字
- [ ] Block 2 使用 "when" 条件，不是好处
- [ ] Block 3 写过程，不写工具
- [ ] Block 4 点行业，不点公司
- [ ] Block 5 包含边界条件
- [ ] 没有 "best way"、"2025"、"our solution" 等表达

---

## 💡 关键提醒

**你不是在"写内容"，你是在"构建可被引用的解释源"。**

SGE 要的是：
- ✅ **中立、客观、稳定**
- ❌ **不是：观点、情绪、推广**

---

## 📚 相关文档

- `docs/GEO_PRIORITY_PRODUCTION_TABLE.md` - GEO 命中率 × 索引率 双优先排产表
- `docs/TREND_MAPPING_LEXICON.md` - 趋势映射词库
- `lib/prompts/geo-a-template-prompt-v2.ts` - GEO-A v2 Prompt 实现

