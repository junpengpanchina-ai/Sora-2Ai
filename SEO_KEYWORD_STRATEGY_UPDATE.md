# SEO关键词策略更新 - 从Sora2转向Sora Alternative

## 📋 更新概述

根据SEO分析，我们已经将网站的关键词策略从 **"Sora2"** 转向 **"Sora Alternative"** 和 **"Text to Video AI"**，因为这些才是用户真正搜索的关键词。

## ✅ 已完成的更改

### 1. 核心SEO Metadata更新

#### `app/layout.tsx`
- ✅ 默认title: `"Sora Alternative – Best AI Video Generators Like OpenAI Sora"`
- ✅ 默认description: 更新为包含 "Sora alternative", "text-to-video AI", "AI video generator" 等关键词
- ✅ OpenGraph数据更新
- ✅ 结构化数据（Schema.org）更新

#### `app/page.tsx`
- ✅ 首页title: `"Best Sora Alternatives for AI Video Generation"`
- ✅ 首页description: 强调 "Sora alternatives", "text-to-video AI tools", "compare top Sora alternatives"
- ✅ 结构化数据更新
- ✅ SEO隐藏文本内容更新，加入更多关键词

### 2. 首页H1和描述文本

#### `app/HomePageClient.tsx`
- ✅ 默认H1 (未登录): `"Best Sora Alternatives for AI Video Generation"`
- ✅ 默认H1 (已登录): `"Welcome back, {name}! Create AI Videos Like Sora"`
- ✅ 默认Badge文本: `"Best Sora Alternative"`
- ✅ 默认描述: 强调 "Sora alternatives", "text-to-video", "free AI video generator"

### 3. 数据库更新脚本

#### `UPDATE_HOMEPAGE_SEO_KEYWORDS.sql`
- ✅ 创建了SQL脚本来更新 `homepage_settings` 表中的所有文本
- ✅ 包括H1、描述、badge文本的更新

### 4. 动态页面SEO配置更新

#### `BATCH_CREATE_SEO_CONFIGS.sql`
- ✅ 更新了所有视频生成页面的SEO配置
- ✅ 关键词数组更新为包含：
  - `text to video ai`
  - `sora alternative`
  - `ai video generator`
  - `sora alternative free`
  - `ai video like sora`
  - `best sora alternative`
  - `openai sora alternative`
  - `free sora alternative`
- ✅ 所有SEO内容都更新为强调 "Sora alternative" 定位

## 🚀 下一步执行步骤

### Step 1: 执行数据库更新

在Supabase SQL Editor中执行：

```sql
-- 执行这个文件
UPDATE_HOMEPAGE_SEO_KEYWORDS.sql
```

这将更新首页设置中的H1和描述文本。

### Step 2: 重新执行SEO配置（可选）

如果你想更新现有的动态页面SEO配置，可以重新执行：

```sql
-- 执行这个文件（会更新现有配置）
BATCH_CREATE_SEO_CONFIGS.sql
```

### Step 3: 部署代码更改

```bash
# 提交更改
git add .
git commit -m "Update SEO strategy: Switch from Sora2 to Sora Alternative keywords"
git push

# 代码会自动部署到Vercel
```

### Step 4: 提交新的Sitemap到Google Search Console

1. 登录 [Google Search Console](https://search.google.com/search-console)
2. 选择你的网站
3. 进入 **Sitemaps** 部分
4. 提交或重新提交 sitemap URL

### Step 5: 监控效果（1-2周后）

在Google Search Console中监控：
- **Impressions（展示次数）**: 应该开始看到增长
- **Clicks（点击次数）**: 关注是否有用户点击
- **Average Position（平均排名）**: 关注关键词排名变化

## 📊 关键词策略总结

### 一级主词（目标关键词）
- ✅ `text to video ai`
- ✅ `ai video generator`
- ✅ `ai video from text`
- ✅ `ai video creation tool`

### 二级"借势词"（黄金区）
- ✅ `sora alternative`
- ✅ `ai video like sora`
- ✅ `sora competitor`
- ✅ `openai sora alternative`
- ✅ `free sora alternative`

### 长尾流量词（新站重点）
- ✅ `best sora alternative for creators`
- ✅ `sora alternative free online`
- ✅ `ai video generator without watermark`
- ✅ `text to video ai for youtube`
- ✅ `ai video generator for marketing`

## ⚠️ 重要提醒

1. **不要删除旧内容**: 现有的页面和内容都保留了，只是更新了关键词
2. **保持品牌一致性**: 虽然SEO关键词变了，但域名 `sora2aivideos.com` 仍然可以使用
3. **内容策略**: 建议后续创建以下内容页面：
   - `/best-sora-alternatives` - 对比文章
   - `/sora-vs-runway-vs-pika` - 工具对比
   - `/free-sora-alternative` - 免费替代方案
   - `/text-to-video-ai-guide` - 使用指南

## 📝 内容建议（用户提到的Day 3-5任务）

建议创建以下5篇内容：

1. **What is OpenAI Sora?** (`/what-is-openai-sora`)
   - 介绍Sora是什么
   - 自然引入我们的平台作为替代方案

2. **Best Sora Alternatives in 2025** (`/best-sora-alternatives-2025`)
   - 对比Runway, Pika, Luma, 我们的平台
   - 强调我们的优势

3. **Free Sora Alternatives Online** (`/free-sora-alternatives`)
   - 介绍免费/低成本的Sora替代方案
   - 突出我们的30免费credits

4. **Text to Video AI Tools Comparison** (`/text-to-video-ai-comparison`)
   - 全面对比各种text-to-video工具
   - 包含功能、价格、质量对比

5. **Sora vs Runway vs Pika vs Luma** (`/sora-vs-runway-vs-pika-vs-luma`)
   - 详细对比各个平台
   - 帮助用户做选择

## 🎯 预期效果

- **1-2周内**: 开始看到impressions（展示）
- **1个月内**: 开始有少量点击
- **2-3个月**: 如果内容质量好，应该能看到稳定的流量增长

## ✅ 检查清单

- [x] 更新layout.tsx metadata
- [x] 更新page.tsx metadata
- [x] 更新HomePageClient默认文本
- [x] 创建数据库更新SQL脚本
- [x] 更新动态页面SEO配置
- [ ] 执行数据库更新SQL
- [ ] 部署代码到生产环境
- [ ] 提交sitemap到GSC
- [ ] 创建内容页面（建议的5篇文章）
- [ ] 监控GSC数据（1-2周后）

---

**更新完成时间**: 2025-01-XX
**下次检查**: 1-2周后查看GSC数据

