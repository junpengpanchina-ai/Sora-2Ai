# R2 图片调用简单指南

## 🎯 适用场景

**仅用于展示图片，不需要上传、删除等操作。**

## ⚡ 超简单配置

只需要在 `.env.local` 文件中添加一行：

```env
R2_PUBLIC_URL=https://pub-2868c824f92441499577980a0b61114c.r2.dev
```

**就这么简单！** 不需要配置 API Token，不需要其他复杂设置。

## 📝 使用方法

### 方式 1: 使用工具函数（推荐）

```typescript
import { getPublicUrl } from '@/lib/r2/client'

// 获取图片 URL
const imageUrl = getPublicUrl('images/hero.jpg')
// 结果: https://pub-2868c824f92441499577980a0b61114c.r2.dev/images/hero.jpg
```

### 方式 2: 在 React 组件中使用

```tsx
import { getPublicUrl } from '@/lib/r2/client'

function HeroImage() {
  const imageUrl = getPublicUrl('images/hero.jpg')
  
  return (
    <img 
      src={imageUrl} 
      alt="Hero Image"
      className="w-full rounded-lg"
    />
  )
}
```

### 方式 3: 直接构建 URL（最简单）

如果您知道图片路径，可以直接使用：

```tsx
function HeroImage() {
  const imageUrl = 'https://pub-2868c824f92441499577980a0b61114c.r2.dev/images/hero.jpg'
  
  return (
    <img 
      src={imageUrl} 
      alt="Hero Image"
      className="w-full rounded-lg"
    />
  )
}
```

### 方式 4: 在 Next.js Image 组件中使用

```tsx
import Image from 'next/image'
import { getPublicUrl } from '@/lib/r2/client'

function OptimizedImage({ imageKey }: { imageKey: string }) {
  const imageUrl = getPublicUrl(imageKey)
  
  return (
    <Image
      src={imageUrl}
      alt="R2 Image"
      width={800}
      height={600}
      className="rounded-lg"
    />
  )
}
```

## 🎨 实际应用示例

### 在首页展示图片

```tsx
// app/HomePageClient.tsx
import { getPublicUrl } from '@/lib/r2/client'

export default function HomePageClient() {
  const heroImage = getPublicUrl('images/homepage-hero.jpg')
  const featureImage1 = getPublicUrl('images/feature-1.jpg')
  const featureImage2 = getPublicUrl('images/feature-2.jpg')
  
  return (
    <div>
      {/* Hero Section */}
      <section className="relative">
        <img 
          src={heroImage} 
          alt="Hero"
          className="w-full h-96 object-cover"
        />
      </section>
      
      {/* Features */}
      <section className="grid grid-cols-2 gap-4">
        <img src={featureImage1} alt="Feature 1" />
        <img src={featureImage2} alt="Feature 2" />
      </section>
    </div>
  )
}
```

### 在卡片中展示图片

```tsx
import { getPublicUrl } from '@/lib/r2/client'

function FeatureCard({ imageKey, title }: { imageKey: string; title: string }) {
  const imageUrl = getPublicUrl(imageKey)
  
  return (
    <div className="card">
      <img 
        src={imageUrl} 
        alt={title}
        className="w-full h-48 object-cover rounded-t-lg"
      />
      <div className="p-4">
        <h3>{title}</h3>
      </div>
    </div>
  )
}
```

### 背景图片

```tsx
import { getPublicUrl } from '@/lib/r2/client'

function HeroSection() {
  const bgImage = getPublicUrl('images/hero-bg.jpg')
  
  return (
    <div 
      className="hero-section"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <h1>Welcome</h1>
    </div>
  )
}
```

## 📋 图片路径格式

图片路径应该相对于 R2 存储桶根目录：

- ✅ `images/hero.jpg`
- ✅ `images/features/feature-1.jpg`
- ✅ `banners/homepage-banner.png`
- ❌ `/images/hero.jpg`（不需要前导斜杠，工具函数会自动处理）
- ❌ `https://pub-.../images/hero.jpg`（不需要完整 URL，工具函数会自动添加）

## 🔍 如何找到图片路径？

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **R2** > 选择存储桶 `sora2`
3. 浏览文件，找到您需要的图片
4. 复制文件路径（例如：`images/hero.jpg`）

## ⚠️ 注意事项

1. **公共访问**: 确保 R2 存储桶已启用公共访问（您的存储桶已启用）
2. **文件路径**: 使用相对路径，不要包含存储桶名称
3. **图片格式**: 支持所有常见图片格式（jpg, png, gif, webp, svg 等）

## 🎯 快速检查清单

- [ ] 已在 `.env.local` 添加 `R2_PUBLIC_URL`
- [ ] 已重启开发服务器
- [ ] 知道图片在 R2 中的路径
- [ ] 可以在代码中使用 `getPublicUrl()` 函数

## 📚 相关文档

- `R2_QUICK_START.md` - 快速开始指南
- `R2_USAGE.md` - 详细使用说明

