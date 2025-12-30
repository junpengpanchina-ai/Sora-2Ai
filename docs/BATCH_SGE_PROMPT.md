# 批量 SGE Prompt（10 万页不漂移版 · GEO-A v2）

> **目标一句话**：生成"AI Summary / SGE 可直接摘"的解释页  
> ❌ 不追热点  
> ❌ 不伤索引  
> ✅ 可长期复用

---

## 🧠 设计原则（你理解这 3 条就够）

1. **解释 > 结论**
2. **结构 > 文采**
3. **边界感 = 信任感**

👉 **这个 Prompt 是给模型"戴轨道"，不是让它自由发挥。**

---

## 🔒 批量生成专用 Prompt（最终版，可直接用）

### ⚠️ 强烈建议：

- **temperature ≤ 0.4**
- **不允许追加段落**
- **不允许自创趋势/时间**

---

### 📌 SYSTEM / INSTRUCTION

```
You are writing a neutral, extractable explanation page
designed to be cited by AI summaries (e.g. search-generated summaries).

The content must be:
- factual
- timeless
- non-promotional
- understandable without prior context

Do NOT:
- mention trends, dates, or model names
- use "you", "we", or brand references
- make claims of superiority
- include calls to action
```

---

### 📌 USER PROMPT（你批量替换变量即可）

```
Write an explanation page for the industry: {{INDUSTRY}}
and the application scenario: {{SCENARIO}}.

Follow EXACTLY this structure and order.
Do not add or remove sections.

---

[Context Anchor]
(1–2 sentences describing a persistent, industry-wide problem.)

[Neutral Definition]
(50–70 words defining the core concept in neutral terms.)

[When It Is Used]
(Exactly 3 bullet points describing conditions, not benefits.)

[How It Works]
(3-step process explanation, no tools, no instructions.)

[Practical Scenario]
(One short example, industry-level, no companies.)

[Limitations]
(1–2 sentences explaining when this approach is not suitable.)
```

---

## 🧪 质量自检（程序可自动）

| 检查项 | 必须 | 说明 |
|--------|------|------|
| 段落数 = 6 | ✅ | 必须正好 6 个段落 |
| Bullet = 3 | ✅ | "When It Is Used" 必须 3 个 bullet |
| 无年份 / 无趋势词 | ✅ | 不能出现年份、趋势词 |
| 有 Limitations | ✅ | 必须包含边界条件 |
| 行业名出现 ≥1 次 | ✅ | 至少提及一次行业名 |

👉 **不满足 = 直接降级 G-B 或 G-None**

---

## 📦 批量策略（15w 页不漂）

### 1 行业 × 6 场景 = 1 组

**同组共享**：
- Context Anchor 结构
- How It Works 逻辑

**只变**：
- 行业名
- 场景名
- Practical Scenario 语义

👉 **这是 "稳定指纹"，不是重复内容。**

---

## 🔧 TypeScript 实现示例

```typescript
// lib/prompts/batch-sge-prompt.ts

export const BATCH_SGE_SYSTEM_PROMPT = `You are writing a neutral, extractable explanation page
designed to be cited by AI summaries (e.g. search-generated summaries).

The content must be:
- factual
- timeless
- non-promotional
- understandable without prior context

Do NOT:
- mention trends, dates, or model names
- use "you", "we", or brand references
- make claims of superiority
- include calls to action`

export function buildBatchSGEPrompt(params: {
  industry: string
  scenario: string
}): string {
  return `Write an explanation page for the industry: ${params.industry}
and the application scenario: ${params.scenario}.

Follow EXACTLY this structure and order.
Do not add or remove sections.

---

[Context Anchor]
(1–2 sentences describing a persistent, industry-wide problem.)

[Neutral Definition]
(50–70 words defining the core concept in neutral terms.)

[When It Is Used]
(Exactly 3 bullet points describing conditions, not benefits.)

[How It Works]
(3-step process explanation, no tools, no instructions.)

[Practical Scenario]
(One short example, industry-level, no companies.)

[Limitations]
(1–2 sentences explaining when this approach is not suitable.)`
}

/**
 * 质量自检函数
 */
export function validateSGEContent(content: string, industry: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  // 检查段落数 = 6
  const sections = [
    'Context Anchor',
    'Neutral Definition',
    'When It Is Used',
    'How It Works',
    'Practical Scenario',
    'Limitations',
  ]
  
  let foundSections = 0
  for (const section of sections) {
    if (content.includes(section) || content.toLowerCase().includes(section.toLowerCase())) {
      foundSections++
    }
  }
  
  if (foundSections < 6) {
    errors.push(`段落数不足：找到 ${foundSections} 个段落，需要 6 个`)
  }
  
  // 检查 Bullet = 3
  const bulletMatches = content.match(/^[\s]*[•\-\*]\s/gm)
  if (!bulletMatches || bulletMatches.length < 3) {
    errors.push(`Bullet 数量不足：找到 ${bulletMatches?.length || 0} 个，需要 3 个`)
  }
  
  // 检查无年份 / 无趋势词
  const yearPattern = /\b(202[0-9]|203[0-9]|20[4-9][0-9])\b/
  if (yearPattern.test(content)) {
    errors.push('包含年份')
  }
  
  const trendWords = ['trend', 'hot', 'viral', 'latest', 'new release', 'breakthrough']
  for (const word of trendWords) {
    if (content.toLowerCase().includes(word)) {
      errors.push(`包含趋势词：${word}`)
      break
    }
  }
  
  // 检查有 Limitations
  if (!content.toLowerCase().includes('limitation') && 
      !content.toLowerCase().includes('not suitable') &&
      !content.toLowerCase().includes('however')) {
    errors.push('缺少 Limitations 段落')
  }
  
  // 检查行业名出现 ≥1 次
  if (!content.toLowerCase().includes(industry.toLowerCase())) {
    errors.push(`行业名 "${industry}" 未出现`)
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  }
}
```

---

## 📋 完整示例

### 输入参数

```typescript
{
  industry: "Healthcare",
  scenario: "Patient Education"
}
```

### 生成内容示例

```
[Context Anchor]
In many healthcare settings, teams need a way to explain medical
procedures and treatment options without requiring in-person consultations.

[Neutral Definition]
Patient education videos refer to a method of presenting medical
information in a structured and visual format so that patients can
understand their condition and treatment options before making decisions.
It is commonly used when explanations need to be concise, repeatable,
and accessible across different contexts.

[When It Is Used]
• patients are unfamiliar with medical terminology
• explanations need to scale without live support
• consistency across patient communications is important

[How It Works]
The approach typically involves three steps:
1. identifying the core medical concept that needs explanation
2. presenting it in a simplified structure
3. reinforcing understanding through visual examples

[Practical Scenario]
For example, in healthcare settings where patients compare multiple
treatment options, this format helps them understand differences
before engaging further with their healthcare provider.

[Limitations]
However, this approach may not be suitable when highly customized
or real-time interaction is required, such as emergency situations
or complex diagnostic discussions.
```

---

## 🎯 批量生成流程

### 1. 准备数据

```typescript
const industries = ['Healthcare', 'Education', 'Manufacturing']
const scenarios = [
  'Patient Education',
  'Safety Training',
  'Product Demonstration',
  'Onboarding',
  'Compliance Training',
  'Customer Support',
]

// 1 行业 × 6 场景 = 1 组
const groups = industries.map(industry => ({
  industry,
  scenarios,
}))
```

### 2. 批量生成

```typescript
for (const group of groups) {
  for (const scenario of group.scenarios) {
    const prompt = buildBatchSGEPrompt({
      industry: group.industry,
      scenario,
    })
    
    // 调用 API 生成内容
    const content = await generateContent({
      systemPrompt: BATCH_SGE_SYSTEM_PROMPT,
      userPrompt: prompt,
      temperature: 0.4, // 强烈建议 ≤ 0.4
    })
    
    // 质量自检
    const validation = validateSGEContent(content, group.industry)
    if (!validation.isValid) {
      console.error('质量检查失败:', validation.errors)
      // 降级处理或重试
    }
  }
}
```

---

## ✅ 检查清单

在批量生成前，确认：

- [ ] temperature ≤ 0.4
- [ ] 不允许追加段落
- [ ] 不允许自创趋势/时间
- [ ] 质量自检程序已实现
- [ ] 不满足质量要求的内容会被降级

---

## 💡 关键提醒

**你不是在"写内容"，你是在"构建可被引用的解释源"。**

**这个 Prompt 是给模型"戴轨道"，不是让它自由发挥。**

**1 行业 × 6 场景 = 1 组，同组共享结构，只变变量。**

---

## 📚 相关文档

- `docs/AI_SUMMARY_SGE_EXTRACTABLE_TEMPLATE.md` - AI Summary / SGE 引用专用结构模板
- `docs/INDEX_HEALTH_DASHBOARD.md` - 索引健康仪表盘
- `docs/GEO_PRIORITY_PRODUCTION_TABLE.md` - GEO 命中率 × 索引率 双优先排产表

