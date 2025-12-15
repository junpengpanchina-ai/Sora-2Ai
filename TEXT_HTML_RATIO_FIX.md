# 文本-HTML 比率优化指南

## 🔴 问题描述

**9 个页面的文本-HTML 比率较低**（0.02-0.10），这意味着：
- HTML 代码（标签、样式、脚本）占用了大量空间
- 实际文本内容相对较少
- 可能影响搜索引擎抓取和理解页面内容

**受影响的页面：**
- `/` (首页) - 0.10
- `/prompts` - 0.09
- `/support` - 0.03
- `/video` 和多个 `/video?prompt=...` - 0.02

## 📊 文本-HTML 比率说明

**什么是文本-HTML 比率？**
- 比率 = 可见文本字符数 / HTML 总字符数
- 建议比率：**15-30%** 以上
- 当前比率：**2-10%**（过低）

**为什么重要？**
- 搜索引擎需要足够的文本内容来理解页面主题
- 比率过低可能被视为"内容贫乏"
- 影响 SEO 排名和搜索可见度

## ✅ 解决方案

### 1. 添加更多有意义的文本内容

#### A. 首页 (`app/page.tsx` + `app/HomePageClient.tsx`)

**问题**：主要是图片、视频和动态内容，文本较少

**解决方案**：在服务器端组件中添加介绍性文本

```typescript
// app/page.tsx
export default function HomePage() {
  return (
    <>
      {/* 添加 SEO 友好的文本内容 */}
      <section className="sr-only">
        <h2>About Sora2Ai Videos</h2>
        <p>
          Sora2Ai Videos is a cutting-edge AI video generation platform powered by OpenAI Sora 2.0. 
          Transform your text prompts into stunning, professional-quality videos in seconds. 
          Whether you're creating marketing content, social media videos, or creative projects, 
          our platform makes video generation accessible to everyone.
        </p>
        <p>
          Get started with 30 free credits when you sign up. No credit card required. 
          Our platform supports various video styles including cinematic, documentary, fashion, 
          nature, and abstract content. Each video is generated using advanced AI technology 
          to ensure high quality and creative results.
        </p>
      </section>
      <HomePageClient userProfile={null} />
    </>
  )
}
```

#### B. 提示库页面 (`app/prompts/page.tsx`)

**问题**：主要是客户端组件，文本内容在加载后才显示

**解决方案**：在服务器端添加介绍文本

```typescript
// app/prompts/page.tsx
export default async function PromptsPage() {
  return (
    <>
      {/* SEO 友好的介绍内容 */}
      <section className="sr-only">
        <h2>AI Video Prompt Library</h2>
        <p>
          Browse our comprehensive collection of AI video generation prompts. 
          Each prompt is carefully crafted to help you create stunning videos 
          using OpenAI Sora 2.0 technology. Our library includes prompts for 
          various categories including nature, character, action, scenery, 
          abstract, and cinematic content.
        </p>
        <p>
          Whether you're a beginner or an experienced video creator, our prompt 
          library provides ready-to-use templates that you can copy and customize. 
          Each prompt includes detailed descriptions and examples to help you 
          understand how to use them effectively.
        </p>
      </section>
      <PromptsPageClient />
    </>
  )
}
```

#### C. 支持页面 (`app/support/page.tsx`)

**问题**：文本内容太少

**解决方案**：添加更多说明文本

```typescript
// app/support/page.tsx
export default function SupportPage() {
  return (
    <div className="flex min-h-screen flex-col bg-energy-hero/20 py-16 dark:bg-gray-900/80">
      <div className="mx-auto w-full max-w-4xl rounded-3xl bg-white px-8 py-12 shadow-2xl dark:bg-gray-800 sm:px-10 lg:px-12">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* 添加更多文本内容 */}
          <div className="mb-8 space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              How We Can Help
            </h2>
            <p className="text-base text-gray-600 dark:text-gray-300">
              Our support team is dedicated to resolving your issues quickly and efficiently. 
              Whether you're experiencing technical difficulties, have questions about video 
              generation, or need help with your account, we're here to assist you.
            </p>
            <p className="text-base text-gray-600 dark:text-gray-300">
              Please provide as much detail as possible about your issue, including when it 
              occurred, what you were trying to do, and any error messages you may have seen. 
              This information helps us diagnose and resolve your issue faster.
            </p>
          </div>
          
          {/* 原有内容 */}
          <div className="space-y-3 text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Customer Support Feedback
            </h1>
            <p className="text-base text-gray-600 dark:text-gray-300">
              Help us resolve your bottlenecks faster by sharing detailed context about the issue,
              who we can reach, and when you prefer to be contacted.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg dark:border-gray-700 dark:bg-gray-900/60">
            <SupportFeedbackForm />
          </div>
        </div>
      </div>
    </div>
  )
}
```

#### D. 视频生成页面 (`app/video/page.tsx` + `app/video/VideoPageClient.tsx`)

**问题**：主要是表单和动态内容，文本较少

**解决方案**：添加更多说明和帮助文本

```typescript
// 在 VideoPageClient.tsx 中添加更多文本内容
<div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-6">
  <h2 className="text-2xl font-semibold text-white mb-4">
    How to Create AI Videos
  </h2>
  <div className="space-y-4 text-blue-100/80">
    <p>
      Creating AI-generated videos with Sora2Ai is simple and straightforward. 
      Start by entering a detailed text prompt that describes the video you want to create. 
      Be specific about the scene, style, camera movement, and mood you're looking for.
    </p>
    <p>
      Our platform uses OpenAI Sora 2.0, one of the most advanced AI video generation 
      models available. Each video is generated with high quality and attention to detail. 
      You can choose between portrait (9:16) or landscape (16:9) aspect ratios, and 
      select video duration of 10 or 15 seconds.
    </p>
    <p>
      After submitting your prompt, the video generation process typically takes a few 
      minutes. You'll receive real-time updates on the progress, and once complete, 
      you can download and use your video immediately.
    </p>
  </div>
</div>
```

### 2. 使用 `sr-only` 类添加隐藏但可抓取的文本

**目的**：为搜索引擎提供更多文本内容，但不影响用户界面

```css
/* 在 globals.css 中添加 */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

**使用示例**：
```typescript
<section className="sr-only">
  <h2>About This Page</h2>
  <p>详细的页面描述文本，搜索引擎可以抓取，但用户看不到</p>
</section>
```

### 3. 优化 HTML 结构

**减少不必要的嵌套**：
```typescript
// ❌ 不好的做法（过多嵌套）
<div>
  <div>
    <div>
      <div>
        <p>Text</p>
      </div>
    </div>
  </div>
</div>

// ✅ 好的做法（简化结构）
<div>
  <p>Text</p>
</div>
```

**使用语义化 HTML**：
```typescript
// ✅ 使用语义化标签
<article>
  <header>
    <h1>Title</h1>
  </header>
  <section>
    <p>Content</p>
  </section>
</article>
```

### 4. 将内联样式移到 CSS 文件

**减少 HTML 中的样式代码**：
```typescript
// ❌ 不好的做法
<div style={{ color: 'red', fontSize: '16px', margin: '10px' }}>Text</div>

// ✅ 好的做法
<div className="text-red text-base m-2.5">Text</div>
```

## 🎯 实施步骤

### 步骤 1: 为每个页面添加介绍性文本

1. **首页**：添加平台介绍和使用说明
2. **提示库**：添加提示词库说明和使用指南
3. **支持页面**：添加帮助说明和常见问题
4. **视频生成页**：添加使用教程和最佳实践

### 步骤 2: 使用 `sr-only` 类添加 SEO 文本

在关键页面添加隐藏但可抓取的文本内容，增加文本-HTML 比率。

### 步骤 3: 优化 HTML 结构

- 减少不必要的 div 嵌套
- 使用语义化 HTML 标签
- 将内联样式移到 CSS 类

### 步骤 4: 验证改进

使用 SEO 工具重新检查文本-HTML 比率，目标达到 **15% 以上**。

## 📈 预期效果

| 页面 | 当前比率 | 目标比率 | 改进方法 |
|------|---------|---------|---------|
| 首页 | 0.10 | 0.20+ | 添加介绍文本 |
| 提示库 | 0.09 | 0.18+ | 添加说明和指南 |
| 支持页 | 0.03 | 0.15+ | 添加帮助内容 |
| 视频生成 | 0.02 | 0.15+ | 添加教程文本 |

## ⚠️ 注意事项

1. **不要过度优化**：保持文本自然，避免关键词堆砌
2. **用户体验优先**：`sr-only` 文本不应影响页面功能
3. **内容相关性**：添加的文本必须与页面主题相关
4. **定期检查**：使用 SEO 工具定期监控文本-HTML 比率

## 🔍 验证方法

1. **使用 SEO 工具**：重新运行 SEO 分析，检查文本-HTML 比率
2. **查看页面源码**：检查 HTML 中是否有足够的文本内容
3. **Google Search Console**：监控页面索引和排名变化
