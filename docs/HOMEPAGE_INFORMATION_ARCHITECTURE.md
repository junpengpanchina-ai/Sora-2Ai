# 首页信息架构（SEO + 转化共存）

> **目标**：不破坏 GEO，又能自然转化  
> **战略**：你不是在卖视频生成器，而是在卖"已经想好的结果"

---

## 🎯 核心原则

### 首页禁忌

**绝对不要**：
- ❌ 不讲价格
- ❌ 不讲套餐
- ❌ 不强调"AI 最强"
- ❌ 不堆卖点
- ❌ 不直接链接到注册页
- ❌ 不强调"免费"

---

## 🧱 页面结构（从上到下）

### ① Hero（不卖，只定位）

**标题**：
```
AI Video Generation for Real Business Scenarios
```

**副标题**：
```
Create structured videos for education, training, and communication.
```

**特征**：
- ✅ 不卖产品
- ✅ 只定位场景
- ✅ 不强调"AI 最强"
- ✅ 不堆卖点
- ✅ 客观、中性

---

### ② What You Can Create（场景入口）

**标题**：
```
What You Can Create
```

**内容**（链接到 Intent ≥2 页面）：

#### 场景列表

1. **Product demo videos**
   - 链接：`/use-cases/product-demo-showcase`
   - Intent：3 分
   - 描述：Showcase your products with professional demo videos

2. **Training & onboarding videos**
   - 链接：`/use-cases/education-explainer`
   - Intent：2 分
   - 描述：Create structured training content for teams

3. **Customer education content**
   - 链接：`/use-cases/education-explainer`
   - Intent：2 分
   - 描述：Help customers understand your products and services

4. **Recruitment & internal communication**
   - 链接：`/use-cases/ugc-creator-content`
   - Intent：2-3 分
   - 描述：Communicate with teams and candidates effectively

**设计要点**：
- ✅ 每个场景都是可点击的链接
- ✅ 链接到对应的 Intent ≥2 页面
- ✅ 不直接链接到产品页
- ✅ 使用卡片式布局

---

### ③ How It Works（极简 3 步）

**标题**：
```
How It Works
```

**步骤**：

#### Step 1: Choose a scenario
- Select from industry-specific use cases
- Preview the structure before generating

#### Step 2: Preview the generated structure
- See the complete video structure
- Review the prompt and settings

#### Step 3: Customize and export
- Adjust details as needed
- Export your video

**特征**：
- ✅ 极简，不超过 3 步
- ✅ 不强调技术细节
- ✅ 不卖功能
- ✅ 使用图标 + 文字

---

### ④ Example Preview（轻展示）

**标题**：
```
Example Preview
```

**内容**：
- ✅ 1–2 个真实 Prompt 示例（非视频）
- ✅ 让用户理解"我能得到什么"
- ✅ 展示实际生成效果

**示例 1**：
```
Product Demo Video
Industry: E-commerce
Scenario: Product demonstration for online store

Prompt Preview:
"Create a professional 10-second product demo video for an e-commerce store showcasing a smart home device. The video should highlight key features in a clear, engaging way suitable for social media platforms."

[Continue generating this video] ← CTA
```

**示例 2**：
```
Training Video
Industry: Healthcare
Scenario: Patient education content

Prompt Preview:
"Create a 10-second educational video explaining pre-visit preparation for healthcare patients. The video should be clear, accessible, and suitable for sharing via email or patient portals."

[Continue generating this video] ← CTA
```

**设计要点**：
- ✅ 展示真实 Prompt（80% 已填好）
- ✅ 让用户感觉"已经开始了"
- ✅ CTA：Continue generating this video

---

### ⑤ Why Teams Use This（信任区）

**标题**：
```
Why Teams Use This
```

**内容**（列表形式）：
- ✅ Reduces manual work
- ✅ Standardized output
- ✅ Easy to adapt
- ✅ Platform-ready formats

**特征**：
- ✅ 使用名词短语
- ✅ 不营销化
- ✅ 客观陈述
- ✅ 简洁明了

---

### ⑥ CTA（弱）

**标题**：
```
Start creating your first video
```

**副标题**：
```
No credit card required
```

**按钮**：
```
Continue → [链接到场景选择页 /use-cases]
```

**特征**：
- ✅ 弱 CTA，不强制
- ✅ 不强调"免费试用"
- ✅ 引导到场景选择，不是注册页
- ✅ 使用中性语言

---

## 📊 首页 SEO 优化

### Meta 标签

**Title**：
```
AI Video Generation for Business Scenarios | Sora2
```

**Description**：
```
Create structured videos for education, training, and communication. 
Choose from industry-specific scenarios and generate professional videos 
for your business needs.
```

**特征**：
- ✅ 包含核心关键词
- ✅ 不营销化
- ✅ 客观描述
- ✅ 120-160 字符

---

### 结构化数据

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Sora2",
  "description": "AI Video Generation for Real Business Scenarios",
  "url": "https://sora2aivideos.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://sora2aivideos.com/use-cases?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
```

---

## 📊 首页转化路径设计

```
首页
  ↓
场景选择（What You Can Create）
  ↓
Intent ≥2 页面（Product demo / Training / etc.）
  ↓
Prompt Preview（80% 填好）
  ↓
Continue generating this video
  ↓
注册/登录（如果需要）
  ↓
生成视频
```

---

## 🎨 设计实现建议

### React 组件结构

```tsx
// app/page.tsx

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <HeroSection />
      
      {/* What You Can Create */}
      <ScenariosSection />
      
      {/* How It Works */}
      <HowItWorksSection />
      
      {/* Example Preview */}
      <ExamplePreviewSection />
      
      {/* Why Teams Use This */}
      <BenefitsSection />
      
      {/* CTA */}
      <CTASection />
    </>
  )
}
```

---

### 场景卡片组件

```tsx
// components/ScenarioCard.tsx

interface ScenarioCardProps {
  title: string
  description: string
  href: string
  intentScore: 2 | 3
}

export function ScenarioCard({ title, description, href, intentScore }: ScenarioCardProps) {
  return (
    <a
      href={href}
      className="block p-6 border rounded-lg hover:border-blue-500 transition"
    >
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
      <span className="text-sm text-blue-600 mt-2 inline-block">
        View scenarios →
      </span>
    </a>
  )
}
```

---

### Prompt Preview 组件

```tsx
// components/PromptPreview.tsx

interface PromptPreviewProps {
  industry: string
  scenario: string
  prompt: string
}

export function PromptPreview({ industry, scenario, prompt }: PromptPreviewProps) {
  return (
    <div className="bg-gray-50 p-6 rounded-lg">
      <div className="mb-4">
        <span className="text-sm text-gray-600">Industry: {industry}</span>
        <span className="text-sm text-gray-600 ml-4">Scenario: {scenario}</span>
      </div>
      <div className="bg-white p-4 rounded border mb-4">
        <p className="text-sm text-gray-700">{prompt}</p>
      </div>
      <a
        href={`/use-cases?industry=${encodeURIComponent(industry)}&scenario=${encodeURIComponent(scenario)}`}
        className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
      >
        Continue generating this video
      </a>
    </div>
  )
}
```

---

## 🎯 最后的战略一句话

**你不是在卖视频生成器，而是在卖"已经想好的结果"。**

---

## 📚 相关文档

- `docs/EXECUTION_TEMPLATES.md` - 执行模板（完整交付版）
- `docs/BUSINESS_INTEGRATED_STRATEGY.md` - 业务整合策略
- `lib/purchase-intent-calculator.ts` - Purchase Intent 计算函数

---

**最后更新**：2025-12-30

