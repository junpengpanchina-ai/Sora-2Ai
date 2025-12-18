# Gemini-2.5-Flash 使用场景生成 Prompt 模板

## 📋 完整 Prompt 结构

### System Prompt（系统提示词）
```
You are a professional SEO content writer for Sora2, an AI video generation platform. Generate high-quality, product-focused use case content that highlights Sora2's capabilities. All output must be in English.
```

**作用：**
- 定义 AI 的角色：专业的 SEO 内容写手
- 明确平台：Sora2 AI 视频生成平台
- 要求：高质量、产品导向的内容
- 语言要求：必须英文输出

---

### User Prompt（用户提示词）

#### 1. 平台核心定位
```
【Platform Core: AI Video Generation】
Sora2 is a professional AI video generation platform that specializes in creating high-quality videos from text and images.
```

#### 2. 产品功能特性（必须突出）
```
【Product Features (Must Highlight)】
- Text-to-video generation: Convert text prompts into high-quality AI-generated videos
- Image-to-video generation: Transform static images into dynamic AI videos
- Multiple AI video styles: Realistic, cinematic, animated, commercial, educational
- Supports various video formats: 9:16 (vertical for TikTok/Shorts), 16:9 (horizontal for YouTube)
- Fast AI video generation: Create videos in minutes using AI technology
- No watermark: Professional quality AI video output
- Cost-effective AI video creation: Affordable pricing for creators and businesses
- AI-powered video editing: Intelligent scene transitions and effects
```

#### 3. 动态参数
```
【Parameters】
Use Case Keyword: ${task.keyword}        // 例如: "AI Video Generator"
Industry: ${task.industry || 'General'}  // 例如: "Fitness & Sports"
Use Case Type: ${task.useCaseType}       // 例如: "marketing"
```

#### 4. 内容要求
```
【Content Requirements】
- Content must be highly relevant to Sora2's actual features
- Emphasize how Sora2 solves real problems in this industry
- Include specific use cases that Sora2 can handle
- Use natural, engaging language
- Each paragraph: 60-120 words
- All content in English
```

#### 5. 内容结构（固定模板）
```
【Content Structure】
H1: AI Video Generation for [${task.keyword}] - Sora2 Use Case
H2: Introduction to this use case (explain what it is and why it matters)
H2: Why Sora2 is perfect for ${task.keyword} (3-5 specific reasons related to Sora2 features)
H2: How to use Sora2 for ${task.keyword} (step-by-step guide)
    H3: Step 1: Create your text prompt
    H3: Step 2: Choose video style and format
    H3: Step 3: Generate and download
H2: Real-world examples with Sora2 (specific scenarios)
H2: Benefits of using Sora2 for ${task.keyword} (cost, speed, quality advantages)
H2: Frequently Asked Questions (3-5 questions)
H2: Get started with Sora2 (call-to-action)
```

#### 6. 重要提示
```
IMPORTANT: 
- You MUST start with an H1 heading (single #)
- Focus on Sora2's actual capabilities
- Make it clear this is about Sora2 platform
- Include actionable steps users can take
```

#### 7. 结尾要求
```
Please output high-quality SEO content in English.
```

---

## 🎯 完整示例

### 实际发送给 Gemini-2.5-Flash 的完整 Prompt

**System Message:**
```
You are a professional SEO content writer for Sora2, an AI video generation platform. Generate high-quality, product-focused use case content that highlights Sora2's capabilities. All output must be in English.
```

**User Message:**
```
Generate a use case page for Sora2 AI video generation platform.

【Platform Core: AI Video Generation】
Sora2 is a professional AI video generation platform that specializes in creating high-quality videos from text and images.

【Product Features (Must Highlight)】
- Text-to-video generation: Convert text prompts into high-quality AI-generated videos
- Image-to-video generation: Transform static images into dynamic AI videos
- Multiple AI video styles: Realistic, cinematic, animated, commercial, educational
- Supports various video formats: 9:16 (vertical for TikTok/Shorts), 16:9 (horizontal for YouTube)
- Fast AI video generation: Create videos in minutes using AI technology
- No watermark: Professional quality AI video output
- Cost-effective AI video creation: Affordable pricing for creators and businesses
- AI-powered video editing: Intelligent scene transitions and effects

【Parameters】
Use Case Keyword: AI Video Generator
Industry: Fitness & Sports
Use Case Type: marketing

【Content Requirements】
- Content must be highly relevant to Sora2's actual features
- Emphasize how Sora2 solves real problems in this industry
- Include specific use cases that Sora2 can handle
- Use natural, engaging language
- Each paragraph: 60-120 words
- All content in English

【Content Structure】
H1: AI Video Generation for AI Video Generator - Sora2 Use Case
H2: Introduction to this use case (explain what it is and why it matters)
H2: Why Sora2 is perfect for AI Video Generator (3-5 specific reasons related to Sora2 features)
H2: How to use Sora2 for AI Video Generator (step-by-step guide)
    H3: Step 1: Create your text prompt
    H3: Step 2: Choose video style and format
    H3: Step 3: Generate and download
H2: Real-world examples with Sora2 (specific scenarios)
H2: Benefits of using Sora2 for AI Video Generator (cost, speed, quality advantages)
H2: Frequently Asked Questions (3-5 questions)
H2: Get started with Sora2 (call-to-action)

IMPORTANT: 
- You MUST start with an H1 heading (single #)
- Focus on Sora2's actual capabilities
- Make it clear this is about Sora2 platform
- Include actionable steps users can take

Please output high-quality SEO content in English.
```

---

## 🔑 关键话术特点

### 1. **强调 AI 视频生成**
- 所有功能描述都包含 "AI" 关键词
- 明确这是 AI 驱动的视频生成平台

### 2. **产品导向**
- 强调 Sora2 的实际功能
- 突出解决真实业务问题
- 包含具体的使用步骤

### 3. **SEO 优化**
- 固定 H1/H2/H3 结构
- 包含关键词自然分布
- 每段 60-120 字，适合 SEO

### 4. **行业适配**
- 根据选择的行业动态调整内容
- 强调在该行业的具体应用场景

### 5. **行动导向**
- 包含明确的步骤指南
- 有 CTA（Call-to-Action）
- 提供实际可操作的建议

---

## 📝 输出格式要求

1. **必须从 H1 开始**（单 # 号）
2. **Markdown 格式**
3. **英文内容**
4. **结构化内容**（H2/H3 层级清晰）
5. **每段 60-120 字**

---

## 🎨 话术统一性保证

所有生成的内容都会：
- ✅ 强调 Sora2 是 AI 视频生成平台
- ✅ 突出 AI 技术能力
- ✅ 包含具体功能点
- ✅ 提供使用步骤
- ✅ 展示实际应用场景
- ✅ 包含 FAQ 和 CTA

这样确保了所有使用场景页面的内容风格统一、专业且 SEO 友好。

