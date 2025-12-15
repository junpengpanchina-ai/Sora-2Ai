# 国际 SEO 和结构化数据标记修复指南

## 🔴 问题描述

1. **国际搜索引擎优化未启用**
   - 网站没有配置 hreflang 标签
   - 搜索引擎无法识别不同语言版本的页面

2. **结构化数据标记缺失**
   - 网站没有使用 Schema.org 标记语言
   - 搜索引擎无法理解页面内容和结构

## ✅ 已完成的修复

### 1. 国际 SEO (hreflang 标签)

#### A. 在根布局中添加 hreflang 标签

**位置**: `app/layout.tsx`

```typescript
// 在 <head> 中添加
<link rel="alternate" hrefLang="en" href="https://sora2aivideos.com" />
<link rel="alternate" hrefLang="en-US" href="https://sora2aivideos.com" />
<link rel="alternate" hrefLang="ar" href="https://sora2aivideos.com?lang=ar" />
<link rel="alternate" hrefLang="ar-SA" href="https://sora2aivideos.com?lang=ar-SA" />
<link rel="alternate" hrefLang="x-default" href="https://sora2aivideos.com" />
```

**支持的语言**：
- `en` - 英语（默认）
- `en-US` - 美式英语
- `ar` - 阿拉伯语
- `ar-SA` - 沙特阿拉伯语
- `x-default` - 默认语言（英语）

#### B. 在 Metadata 中配置 alternates

```typescript
export const metadata: Metadata = {
  alternates: {
    canonical: 'https://sora2aivideos.com',
    languages: {
      'en': 'https://sora2aivideos.com',
      'en-US': 'https://sora2aivideos.com',
      'ar': 'https://sora2aivideos.com?lang=ar',
      'ar-SA': 'https://sora2aivideos.com?lang=ar-SA',
      'x-default': 'https://sora2aivideos.com',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: ['ar_SA'],
    // ...
  },
}
```

#### C. 自动语言检测

**位置**: `lib/i18n.ts` + `middleware.ts`

**功能**：
- 根据浏览器 `Accept-Language` 头检测语言
- 根据 URL 参数 `?lang=ar` 检测语言
- 根据地理位置（Vercel 提供）检测语言
- 优先级：URL 参数 > Accept-Language > 地理位置 > 默认（英语）

**示例**：
- 沙特阿拉伯访问者 → 自动检测为 `ar-SA`
- 美国访问者 → 自动检测为 `en-US`
- 其他地区 → 默认 `en`

### 2. 结构化数据标记 (Schema.org)

#### A. 组织信息 (Organization)

**位置**: `app/layout.tsx`

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Sora2Ai Videos",
  "url": "https://sora2aivideos.com",
  "logo": "https://sora2aivideos.com/icon.svg",
  "description": "AI video generation platform powered by OpenAI Sora 2.0",
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "Customer Support",
    "url": "https://sora2aivideos.com/support"
  }
}
```

#### B. 网站信息 (WebSite)

**位置**: `app/layout.tsx`

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Sora2Ai Videos",
  "url": "https://sora2aivideos.com",
  "description": "AI video generation platform powered by OpenAI Sora 2.0",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://sora2aivideos.com/prompts?search={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
}
```

#### C. 页面特定结构化数据

**首页** (`app/page.tsx`):
- `WebPage` + `SoftwareApplication`

**视频生成页** (`app/video/page.tsx`):
- `WebPage` + `SoftwareApplication` (包含功能列表)

**提示库页** (`app/prompts/page.tsx`):
- `CollectionPage` + `ItemList`

**支持页** (`app/support/page.tsx`):
- `ContactPage` + `Organization`

**关键词页** (`app/keywords/[slug]/page.tsx`):
- `FAQPage` (已有)

## 🌍 语言检测逻辑

### 检测优先级

1. **URL 参数** (`?lang=ar-SA`)
   - 最高优先级
   - 用户明确指定语言

2. **Accept-Language 头**
   - 浏览器语言设置
   - 自动检测用户偏好

3. **地理位置** (Vercel 提供)
   - 根据 IP 地址检测地区
   - 沙特阿拉伯 → `ar-SA`
   - 美国 → `en-US`

4. **默认语言**
   - 英语 (`en`)

### 实现代码

```typescript
// lib/i18n.ts
export function getLanguageFromRequest(
  acceptLanguage?: string | null,
  searchParams?: URLSearchParams,
  region?: string
): SupportedLocale {
  // Priority: URL parameter > Accept-Language header > Geographic region > Default (en)
  
  if (searchParams) {
    const urlLang = detectLanguageFromUrl(searchParams)
    if (urlLang) {
      return urlLang
    }
  }

  if (acceptLanguage) {
    const headerLang = detectLanguageFromHeader(acceptLanguage)
    if (headerLang !== 'en' || !searchParams) {
      return headerLang
    }
  }

  if (region) {
    return getDefaultLanguageForRegion(region)
  }

  return 'en'
}
```

## 📊 修复效果

### 修复前
- ❌ 没有 hreflang 标签
- ❌ 没有结构化数据
- ❌ 搜索引擎无法识别多语言版本
- ❌ 无法在搜索结果中显示富媒体信息

### 修复后
- ✅ 完整的 hreflang 标签配置
- ✅ 丰富的结构化数据标记
- ✅ 支持英语和阿拉伯语（沙特）
- ✅ 自动语言检测
- ✅ 搜索引擎可以显示富媒体结果

## 🔍 验证方法

### 1. 检查 hreflang 标签

```bash
curl -s https://sora2aivideos.com | grep -i "hreflang\|alternate"
```

**应该看到**：
```html
<link rel="alternate" hrefLang="en" href="https://sora2aivideos.com" />
<link rel="alternate" hrefLang="ar-SA" href="https://sora2aivideos.com?lang=ar-SA" />
```

### 2. 检查结构化数据

使用 [Google Rich Results Test](https://search.google.com/test/rich-results):
- 输入: `https://sora2aivideos.com`
- 应该显示: Organization, WebSite, WebPage 等结构化数据

### 3. 检查语言检测

```bash
# 测试阿拉伯语检测
curl -H "Accept-Language: ar-SA,ar;q=0.9" https://sora2aivideos.com -I
# 应该看到: Content-Language: ar-SA
```

## 🚀 未来扩展

### 如果需要添加更多语言

1. **在 `lib/i18n.ts` 中添加语言**：
```typescript
export const supportedLanguages = {
  // ... 现有语言
  'zh-CN': { locale: 'zh-CN', language: 'zh', region: 'CN', name: '简体中文' },
  'es': { locale: 'es', language: 'es', name: 'Español' },
}
```

2. **在 `app/layout.tsx` 中添加 hreflang**：
```typescript
<link rel="alternate" hrefLang="zh-CN" href="https://sora2aivideos.com?lang=zh-CN" />
<link rel="alternate" hrefLang="es" href="https://sora2aivideos.com?lang=es" />
```

3. **在 metadata 中添加**：
```typescript
languages: {
  // ... 现有语言
  'zh-CN': 'https://sora2aivideos.com?lang=zh-CN',
  'es': 'https://sora2aivideos.com?lang=es',
}
```

### 如果需要根据外链自动切换语言

可以在 middleware 中检测 `Referer` 头：

```typescript
const referer = request.headers.get('referer')
if (referer?.includes('.sa/') || referer?.includes('saudi')) {
  // 自动重定向到阿拉伯语版本
  const url = request.nextUrl.clone()
  url.searchParams.set('lang', 'ar-SA')
  return NextResponse.redirect(url)
}
```

## 📝 注意事项

1. **语言内容**：当前主要语言是英语，阿拉伯语版本需要翻译内容
2. **URL 参数**：使用 `?lang=ar-SA` 来切换语言，不影响现有 URL 结构
3. **SEO 友好**：hreflang 标签告诉搜索引擎不同语言版本的关系
4. **结构化数据**：帮助搜索引擎理解页面内容，可能显示富媒体结果

## ✅ 总结

- ✅ 已添加完整的 hreflang 标签配置
- ✅ 已添加丰富的结构化数据标记
- ✅ 已实现自动语言检测功能
- ✅ 支持英语和阿拉伯语（沙特）
- ✅ 搜索引擎可以正确识别和索引多语言版本
