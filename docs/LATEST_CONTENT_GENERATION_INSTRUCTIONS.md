# 最新文案生成指令（含重复内容优化）

> **更新时间**：2025-12-29  
> **核心优化**：避免内容重复，减少 Fallback 触发，节省积分消耗

---

## 🎯 核心原则

### 1. 严格遵循 GEO-A 模板结构
- 不允许修改结构
- 不允许跳过任何部分
- 必须包含所有必需元素

### 2. 避免内容重复（新增）🔥
- **同一句子或短语不能重复超过 2 次**
- **使用同义词和不同表达方式**
- **每个段落使用不同措辞，保持相同含义**

### 3. 遵守内容红线
- 禁止营销语言
- 禁止夸张词
- 禁止在 Answer-first 区添加 CTA

---

## 📋 完整模板结构

### ① H1（AI 定位锚点）

```
AI Video Generation for [Industry] – [Specific Use Case]
```

**规则**：
- ✅ 必须出现【行业名】
- ❌ 禁止营销词：ultimate / best / boost / revolutionary
- ❌ 禁止抽象词：solution / innovation

**示例**：
- ✅ `AI Video Generation for Dental Clinics – Patient Education`
- ❌ `The Ultimate AI Video Solution for Healthcare`

---

### ② Answer-first 区（GEO 核心区｜150–200 词）

**固定开头句（强制）**：
```
In [industry], AI-generated videos are commonly used for [specific use case], 
especially in scenarios such as [scene 1], [scene 2], and [scene 3].
```

**完整模板**：
```
In [industry], AI-generated videos are commonly used for [specific use case], 
especially in scenarios such as [scene 1], [scene 2], and [scene 3].

This use case focuses on helping [industry role] explain, demonstrate, or present 
[object/process] in a clear and visual way. Instead of relying on static images or 
long explanations, AI-generated videos make complex information easier to understand 
for [target audience].

Typical applications include onboarding, education, demonstrations, and internal or 
external communication. These videos are usually short, structured, and designed for 
specific platforms or viewing contexts.
```

**硬红线**：
- ✅ 行业名必须出现 ≥2 次（但要用不同表达方式，不要机械重复）
- ❌ 禁止 CTA
- ❌ 禁止夸张词
- 🔥 **新增**：避免重复使用相同的句子结构

**示例（正确）**：
```
In dental clinics, AI-generated videos are commonly used for patient education, 
especially in scenarios such as treatment explanations, procedure overviews, and 
pre-appointment instructions.

This use case focuses on helping dental professionals explain dental procedures, 
treatment options, and oral health information in a clear and visual way. Instead 
of relying on static images or long explanations, AI-generated videos make complex 
dental information easier to understand for patients.

Typical applications include treatment explanations, procedure demonstrations, 
appointment reminders, and oral hygiene education. These videos are usually short, 
structured, and designed for specific platforms or viewing contexts.
```

**示例（错误 - 重复过多）**：
```
In dental clinics, AI-generated videos are commonly used for patient education.
In dental clinics, AI-generated videos are commonly used for patient education.
In dental clinics, AI-generated videos are commonly used for patient education.
```
（同一句话重复 3 次以上）

---

### ③ Use Cases（名词短语列表）

**标题**：`Common Use Cases in [Industry]`

**模板**：
```
- Patient education videos
- Service introduction clips
- Appointment process explainers
- Treatment overview animations
- Internal staff training videos
```

**规则**：
- ✅ 只允许名词短语
- ✅ 每条 2–5 个词
- ✅ 5–8 条最佳
- ❌ 禁止：Boost engagement / Increase conversions

---

### ④ Why This Matters（行业痛点区）

**模板**：
```
In [industry], explaining [problem] is often challenging because [reason].
Traditional methods such as [old method] are time-consuming and difficult to scale.

AI-generated video helps address this by providing a consistent and visual way to 
communicate information, reducing misunderstandings and saving time for both 
professionals and audiences.
```

**🔥 优化**：使用不同的表达方式描述同一个概念，避免机械重复

---

### ⑤ How to Use Sora2（Steps｜必有）

**标题**：`How to Create AI Videos for [Use Case] with Sora2`

**固定三步（列表格式，必须）**：
```
1. Write a clear text prompt describing the scenario, audience, and goal.
2. Choose a video style and format that fits the platform or context.
3. Generate the video and download it for use or distribution.
```

**📌 这是 AI 搜索最容易直接引用的块**

**必须使用列表格式，不能写成段落**

---

### ⑥ Real-world Examples

**模板**：
```
For example, a [industry role] can use an AI-generated video to explain [specific task].
Another common scenario is using short videos for [platform or situation], helping 
[who] quickly understand [what].
```

**🔥 优化**：使用不同的例子和表达方式，避免重复相同的句式

---

### ⑦ Benefits（列表型）

**模板**：
```
- Faster content creation
- Consistent visual presentation
- Lower production cost
- Easy updates and reuse
- Platform-ready formats
```

**规则**：
- ✅ 功能性，不是营销
- ✅ 4–6 条
- ❌ 禁止：Dramatically increase / Boost visibility

---

### ⑧ FAQ（≥3，必须含 1 个入门型）

**硬规则**：至少 1 个入门问题必须是：
- `Do I need any equipment?`
- `Is this expensive?`
- `Can small businesses use this?`
- `How much does it cost?`

**模板示例**：
```
Q: Is AI video suitable for [industry]?
A: Yes. It is commonly used for explaining processes, services, and information in a clear way.

Q: Do I need any special equipment to create AI videos?
A: No. Videos can be created using text or images without cameras or editing software.

Q: Is AI-generated video expensive?
A: It is generally more cost-effective than traditional video production.
```

**🔥 优化**：使用不同的问法和答法，避免重复相同的表达

---

### ⑨ CTA（极轻，不影响 GEO）

**模板**：
```
Get started with Sora2 to create AI-generated videos for [industry] use cases.
```

**规则**：
- ✅ 只允许 1 句
- ✅ 放在页面最后

---

## 🔥 新增：避免重复内容规则

### 问题诊断

**发现的问题**：
- 核心描述句在全文重复超过 8 次
- 导致质量检查触发 Fallback（重复内容 > 30%）
- Fallback 导致重复消耗积分（60 + 110 = 170 积分）

### 解决方案

**在 Prompt 中添加以下要求**：

```
🔥 CRITICAL: Avoid repeating the same sentence or phrase more than 2 times throughout the entire content
🔥 CRITICAL: Use varied expressions and synonyms instead of mechanical repetition
🔥 CRITICAL: Each section should use different wording while maintaining the same meaning
```

### 具体规则

1. **关键词重复**：
   - ✅ 允许：在 SEO/GEO 需要时重复关键词（但要用不同表达）
   - ❌ 禁止：机械重复相同的句子

2. **段落表达**：
   - ✅ 每个段落使用不同的措辞
   - ✅ 使用同义词和不同句式
   - ❌ 禁止：完全相同的句子重复 3 次以上

3. **内容质量**：
   - ✅ 保持 SEO/GEO 价值（关键词密度）
   - ✅ 提高可读性（避免重复）
   - ❌ 不要为了 SEO 而牺牲可读性

---

## 📋 完整 Prompt 模板

### 基础模板

```typescript
const GEO_A_PROMPT = `
You are an expert content writer specializing in GEO (Generative Engine Optimization).

Generate a use case page for Sora2 AI video generation platform.

【Platform Core: AI Video Generation】
Sora2 is a professional AI video generation platform that specializes in creating high-quality videos from text and images.

【Product Features】
- Text-to-video generation
- Image-to-video generation
- Multiple AI video styles: Realistic, cinematic, animated, commercial, educational
- Supports various video formats: 9:16 (vertical for TikTok/Shorts), 16:9 (horizontal for YouTube)
- Fast AI video generation: Create videos in minutes using AI technology
- No watermark: Professional quality AI video output
- Cost-effective AI video creation: Affordable pricing for creators and businesses

【Target Context】
Use Case Keyword: ${keyword}
Industry: ${industry}
Use Case Type: ${useCaseType}

【Content Requirements】
- Content must be highly relevant to Sora2's actual features AND the ${industry} industry context
- Emphasize how Sora2 solves real problems specific to ${industry} industry
- Include specific use cases that Sora2 can handle for ${keyword} in ${industry} contexts
- Use natural, engaging language that resonates with ${industry} industry professionals
- Each paragraph: 60-120 words
- All content in English
- Make sure the content is specifically tailored to: ${keyword} + ${industry} + ${useCaseType}

🔥 CRITICAL: Avoid repeating the same sentence or phrase more than 2 times throughout the entire content
🔥 CRITICAL: Use varied expressions and synonyms instead of mechanical repetition
🔥 CRITICAL: Each section should use different wording while maintaining the same meaning

【Content Structure - SEO + GEO Optimized】
H1: AI Video Generation for ${keyword} in ${industry} - Sora2 Use Case

H2: Introduction (GEO-1: Answer-First Structure - 150-200 words)
Start with this exact format:
"In ${industry}, AI-generated videos are commonly used for ${keyword}."
Follow with:
- Typical applications include: [list of noun phrases]
- This page explains how teams use AI video tools for this purpose, which platforms are most suitable, and practical steps to get started.

H2: Why Sora2 is perfect for ${keyword} in ${industry} (3-5 specific reasons)
Use noun phrases in lists, NOT marketing sentences

H2: How to use Sora2 for ${keyword} in ${industry} (GEO-3: Step-by-step guide)
    H3: Step 1: Create your text prompt (with ${industry} industry-specific examples)
    H3: Step 2: Choose video style and format (recommended for ${useCaseType})
    H3: Step 3: Generate and download

H2: Real-world examples with Sora2 for ${keyword} in ${industry}
Use noun phrases for examples

H2: Benefits of using Sora2 for ${keyword} in ${industry}
List format with noun phrases

H2: Frequently Asked Questions (GEO-4: Answer questions non-experts would ask)
Must include at least 3 questions like:
- "Is AI video suitable for ${industry}?"
- "Do I need filming equipment for ${keyword}?"
- "Which platform works best for ${keyword} in ${industry}?"
Keep answers 2-4 sentences, no marketing jargon.

H2: Get started with Sora2 for ${keyword} (call-to-action)

IMPORTANT: 
- You MUST start with an H1 heading (single #)
- Focus on Sora2's actual capabilities
- Make it clear this is about Sora2 platform
- Include actionable steps users can take
- The content MUST be specifically relevant to: ${keyword} + ${industry} + ${useCaseType}
- Do NOT generate generic content - make it highly specific to these parameters
- 🔥 AVOID REPETITION: Never repeat the same sentence or phrase more than 2 times
- 🔥 VARIETY: Each section should use different wording while maintaining the same meaning and SEO value

Please output high-quality SEO + GEO optimized content in English that is specifically tailored to ${keyword} in the ${industry} industry for ${useCaseType} purposes.
`
```

---

## 📋 内容检查清单

在生成内容前，必须确认：

### 结构检查
- [ ] H1 包含行业名，无营销词
- [ ] Answer-first 区 150-200 词，行业名出现 ≥2 次
- [ ] Use Cases 是名词短语列表（5-8 条）
- [ ] Why This Matters 说明真实痛点
- [ ] How to Use 是列表格式（3 步）
- [ ] Real-world Examples 具体不夸张
- [ ] Benefits 是功能性列表（4-6 条）
- [ ] FAQ ≥3 个，至少 1 个入门型问题
- [ ] CTA 只有 1 句，放在最后

### 内容质量检查（新增）
- [ ] 同一句子或短语没有重复超过 2 次
- [ ] 使用了同义词和不同表达方式
- [ ] 每个段落使用不同措辞
- [ ] 全文无营销语言、无夸张词

### 红线检查
- [ ] 开头 150-200 词没有营销语言
- [ ] 至少 3 个 FAQ（非营销问题）
- [ ] How-to Steps 是列表格式，不是段落
- [ ] 使用名词短语，不是营销句

---

## 🎯 预期效果

### 内容质量
- ✅ 结构完整（符合 GEO-A 标准）
- ✅ 内容不重复（提高可读性）
- ✅ SEO/GEO 优化（保持关键词密度）

### 积分消耗
- ✅ 减少 Fallback 触发（从 70% 降到 30%）
- ✅ 降低平均积分消耗（从 201 降到 ~120）
- ✅ 节省约 40% 的积分消耗

---

## 📁 相关文件

- `docs/GEO_A_TEMPLATE_FINAL.md` - GEO-A 模板最终版
- `docs/GEO_OPERATIONAL_RULES.md` - GEO 运营规则
- `docs/CONTENT_RED_LINES.md` - 内容红线规则
- `lib/prompts/geo-a-page-template.md` - 详细模板文档
- `lib/prompts/geo-a-template-prompt.ts` - 可执行的 Prompt 代码
- `FALLBACK_OPTIMIZATION_FIX.md` - Fallback 优化修复说明

---

## 🚀 立即使用

### 步骤 1：选择参数

```typescript
const params = {
  keyword: 'Patient Education',
  industry: 'Dental Clinics',
  useCaseType: 'education-explainer',
}
```

### 步骤 2：生成 Prompt

```typescript
import { buildGEOATemplatePrompt } from '@/lib/prompts/geo-a-template-prompt'

const prompt = buildGEOATemplatePrompt({
  industry: params.industry,
  useCase: params.keyword,
  industryRole: 'dental professionals',
  targetAudience: 'patients',
  problem: 'treatment procedures',
  oldMethod: 'printed diagrams',
  platform: 'patient portals',
})
```

### 步骤 3：添加避免重复指令

```typescript
const finalPrompt = prompt + `

🔥 CRITICAL: Avoid repeating the same sentence or phrase more than 2 times throughout the entire content
🔥 CRITICAL: Use varied expressions and synonyms instead of mechanical repetition
🔥 CRITICAL: Each section should use different wording while maintaining the same meaning
`
```

### 步骤 4：生成内容

```typescript
const content = await generateWithLLM(finalPrompt)
```

### 步骤 5：验证

```typescript
import { validateGEOAContent } from '@/lib/prompts/geo-a-template-prompt'
import { calculateGEOHitRate } from '@/lib/utils/geo-hit-rate'

const validation = validateGEOAContent(content, params.industry)
const geoRate = calculateGEOHitRate({
  description: content,
  content: content,
  industry: params.industry,
  use_case_type: params.useCaseType,
})

if (validation.isValid && geoRate.geoLevel === 'G-A') {
  // ✅ 符合标准，可以发布
}
```

---

**所有工具已就绪，可直接用于批量生成内容。** ✅

