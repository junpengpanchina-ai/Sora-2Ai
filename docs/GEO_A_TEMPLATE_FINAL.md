# AI 必引用页面模板（GEO-A 标准版）- 最终版

> **适用页面类型**：Industry × Scene（可选 Platform）  
> **目标**：进入 G-A，优先被 AI 搜索引用  
> **硬红线**：严格按此模板生成，不允许修改结构

---

## 🏁 最终结论（内部规范）

**只要页面严格按此模板生成，且行业 ∈ A / B 类，页面默认进入 G-A 候选池。**

你现在已经不缺内容、不缺技术、不缺规模。  
你缺的是：**统一、冷静、可被 AI 信任的"表达形态"**。

**这套模板，就是。**

---

## 🧠 为什么这套模板 = "AI 几乎必引用"

### LLM 的判断路径

1. **行业明确** → 不会误用
2. **结构稳定** → 可抽取
3. **语言冷静** → 可引用
4. **Steps + FAQ** → 可拼答案
5. **非营销** → 安全

### 核心认知

👉 **AI 不是在"喜欢你"**  
👉 **AI 是在 "敢不敢用你"**

**这套模板 = 敢用**

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
- ✅ 行业名必须出现 ≥2 次
- ❌ 禁止 CTA
- ❌ 禁止夸张词

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

---

### ⑤ How to Use Sora2（Steps｜必有）

**标题**：`How to Create AI Videos for [Use Case] with Sora2`

**固定三步（列表格式）**：
```
1. Write a clear text prompt describing the scenario, audience, and goal.
2. Choose a video style and format that fits the platform or context.
3. Generate the video and download it for use or distribution.
```

**这是 AI 搜索最容易直接引用的块**

---

### ⑥ Real-world Examples

**模板**：
```
For example, a [industry role] can use an AI-generated video to explain [specific task].
Another common scenario is using short videos for [platform or situation], helping 
[who] quickly understand [what].
```

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

## 💻 代码使用

### 方法 1：使用 Prompt 模板

```typescript
import { buildGEOATemplatePrompt } from '@/lib/prompts/geo-a-template-prompt'

const prompt = buildGEOATemplatePrompt({
  industry: 'Dental Clinics',
  useCase: 'Patient Education',
  industryRole: 'dental professionals',
  targetAudience: 'patients',
  problem: 'treatment procedures',
  oldMethod: 'printed diagrams',
  platform: 'patient portals',
})

// 发送给 LLM 生成内容
```

### 方法 2：验证生成的内容

```typescript
import { validateGEOAContent } from '@/lib/prompts/geo-a-template-prompt'

const result = validateGEOAContent(generatedContent, 'Dental Clinics')

if (result.isValid) {
  console.log('✅ 内容符合 GEO-A 标准')
} else {
  console.log('❌ 问题:', result.issues)
  console.log('得分:', result.score)
}
```

### 方法 3：批量生成

```typescript
import { buildGEOATemplatePrompt } from '@/lib/prompts/geo-a-template-prompt'
import { calculateGEOHitRate } from '@/lib/utils/geo-hit-rate'

// 批量生成
for (const item of useCases) {
  const prompt = buildGEOATemplatePrompt({
    industry: item.industry,
    useCase: item.title,
  })
  
  // 生成内容...
  const generatedContent = await generateContent(prompt)
  
  // 验证
  const validation = validateGEOAContent(generatedContent, item.industry)
  const geoRate = calculateGEOHitRate({
    description: generatedContent,
    content: generatedContent,
    industry: item.industry,
    use_case_type: item.use_case_type,
  })
  
  if (validation.isValid && geoRate.geoLevel === 'G-A') {
    // 保存到数据库
  }
}
```

---

## 📋 使用检查清单

在生成内容前，必须确认：

- [ ] H1 包含行业名，无营销词
- [ ] Answer-first 区 150-200 词，行业名出现 ≥2 次
- [ ] Use Cases 是名词短语列表（5-8 条）
- [ ] Why This Matters 说明真实痛点
- [ ] How to Use 是列表格式（3 步）
- [ ] Real-world Examples 具体不夸张
- [ ] Benefits 是功能性列表（4-6 条）
- [ ] FAQ ≥3 个，至少 1 个入门型问题
- [ ] CTA 只有 1 句，放在最后
- [ ] 全文无营销语言、无夸张词、无 CTA（除最后）

---

## 🎯 关键优势

### 你现在这套体系天然适配未来 3 件事

1. **AI 搜索**（ChatGPT / Gemini / Perplexity）
   - ✅ 结构优化、行业分类

2. **Google AI Overviews**
   - ✅ FAQ 结构、Steps 格式

3. **企业级 API / 数据授权**
   - ✅ 可追溯、可解释的等级系统
   - 你不是"内容"，你是"资料源"

### 大多数站只做第 1 步，你已经在第 2.5 步

---

## 📁 相关文件

- `lib/prompts/geo-a-page-template.md` - 详细模板文档
- `lib/prompts/geo-a-template-prompt.ts` - 可执行的 Prompt 代码
- `lib/utils/geo-hit-rate.ts` - GEO 命中率计算（验证模板）
- `lib/data/industries-geo-classification.ts` - 行业分类（A/B/C）
- `docs/GEO_OPERATIONAL_RULES.md` - 运营规则
- `docs/GEO_HIT_RATE_SUMMARY.md` - 完整总结

---

## 🚀 立即使用

### 步骤 1：选择行业和场景

```typescript
const params = {
  industry: 'Dental Clinics', // A 类行业
  useCase: 'Patient Education',
  industryRole: 'dental professionals',
  targetAudience: 'patients',
}
```

### 步骤 2：生成 Prompt

```typescript
const prompt = buildGEOATemplatePrompt(params)
```

### 步骤 3：生成内容

```typescript
const content = await generateWithLLM(prompt)
```

### 步骤 4：验证

```typescript
const validation = validateGEOAContent(content, params.industry)
const geoRate = calculateGEOHitRate({
  description: content,
  content: content,
  industry: params.industry,
  use_case_type: 'education-explainer',
})

if (validation.isValid && geoRate.geoLevel === 'G-A') {
  // ✅ 符合标准，可以发布
}
```

---

**所有工具已就绪，可直接用于批量生成 1 万 / 10 万条内容。** ✅




