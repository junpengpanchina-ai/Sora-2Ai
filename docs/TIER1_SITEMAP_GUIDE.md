# Tier 1 Sitemap 实施指南

## 🎯 目标

创建 Tier 1 专用 sitemap，让 Google 明确知道：
**这 1 万页是我最有信心被引用的知识库核心。**

## 📋 实施内容

### 1. 新增文件

- ✅ `/app/sitemap-tier1.xml/route.ts` - Tier 1 sitemap 生成器
- ✅ `/app/sitemap-index.xml/route.ts` - Sitemap 索引（主入口）
- ✅ `/lib/utils/tier1-checker.ts` - Tier 1 判定工具

### 2. 更新文件

- ✅ `/app/robots.ts` - 更新为指向 `sitemap-index.xml`

## 🔍 Tier 1 判定规则

Tier 1 页面 = 同时满足以下 **≥4 条**：

1. ✅ **URL 能解析出 industry** - `use_cases.industry` 字段不为空
2. ✅ **URL 能解析出 scene** - `use_cases.use_case_type` 字段不为空
3. ✅ **正文长度 ≥ 800 词** - 计算 `content` 字段的英文单词数
4. ✅ **FAQ 数量 ≥ 3** - 从 `content` 中解析 FAQ 部分
5. ✅ **存在 How-to / Steps 结构** - 从 `content` 中检查步骤结构

### 判定逻辑

```typescript
import { checkTier1 } from '@/lib/utils/tier1-checker'

const result = checkTier1({
  industry: page.industry,
  slug: page.slug,
  use_case_type: page.use_case_type,
  content: page.content,
})

// result.isTier1 = true (满足 ≥4 条)
// result.score = 4-5 (满足的条件数量)
// result.criteria = { hasIndustry, hasScene, hasEnoughWords, hasEnoughFAQ, hasSteps }
```

## 🧩 Sitemap 结构

### 最终结构

```
/sitemap-index.xml          # 主入口（Google 从这里开始）
├── /sitemap-tier1.xml      # Tier 1 页面（GEO 核心，优先抓取）
└── /sitemap.xml            # 全量 sitemap（所有其他页面）
    ├── /sitemap-core.xml
    ├── /sitemap-static.xml
    ├── /sitemap-long-tail.xml
    └── /sitemap-scenes.xml
```

### Sitemap Index 内容

```xml
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://sora2aivideos.com/sitemap-tier1.xml</loc>
  </sitemap>
  <sitemap>
    <loc>https://sora2aivideos.com/sitemap.xml</loc>
  </sitemap>
</sitemapindex>
```

## ✅ 已完成的实施

### 1. Tier 1 Sitemap (`/app/sitemap-tier1.xml/route.ts`)

- ✅ 查询所有已发布的 use cases
- ✅ 过滤出符合 Tier 1 标准的页面（≥4 条条件）
- ✅ 生成 XML sitemap，优先级 0.9
- ✅ 限制最多 50,000 个 URL（sitemap 协议限制）

### 2. Sitemap Index (`/app/sitemap-index.xml/route.ts`)

- ✅ 包含 Tier 1 sitemap（优先）
- ✅ 包含全量 sitemap（现有）
- ✅ 作为 Google 的主要入口

### 3. Robots.txt (`/app/robots.ts`)

- ✅ 更新为指向 `sitemap-index.xml`

## 📊 预期效果

### 第 1-7 天

- ✅ Tier1 sitemap 抓取量 ↑
- ✅ "Crawled but not indexed" 会先↑（正常，Google 在消化）

### 第 7-21 天

- ✅ Tier1 的 Index Rate 明显高于 Tier2
- ✅ Avg position 稳定在 10-20

### 第 30-45 天

- ✅ 开始出现长尾 queries
- ✅ AI Overview / 引用型摘要
- ✅ 非品牌曝光

## 🚨 重要提醒

### ❌ 千万不要做的 3 件事

1. ❌ **不要把 Tier1 再扩大到 5 万**
   - Tier1 应该是精选的核心页面
   - 扩大范围会降低 Tier1 的价值

2. ❌ **不要因为"没流量"改结构**
   - 流量是"后果"，不是"信号"
   - 保持 GEO 结构稳定

3. ❌ **不要删 Tier2 / Tier3 页面**
   - 全量 sitemap 仍然重要
   - 只是优先级不同

## 📌 Google Search Console 操作

### 1. 提交新 Sitemap

1. 打开 Google Search Console
2. 进入 **站点地图** (Sitemaps)
3. 提交新 sitemap：
   ```
   https://sora2aivideos.com/sitemap-index.xml
   ```

### 2. 验证提交

- ✅ 等待 1-2 天，Google 会开始抓取
- ✅ 在 Search Console 中查看抓取统计
- ✅ 检查 Tier1 sitemap 的抓取情况

### 3. 监控指标

**关注这些指标**：
- Tier1 sitemap 的抓取量
- Tier1 页面的索引率
- Tier1 页面的平均排名

**不要过度关注**：
- 短期流量变化
- 单页排名波动

## 🧠 核心认知

**你现在不是在"等流量"，**  
**你是在把自己从"模板站候选"升级成"可引用知识库"。**

Tier1 sitemap 是这个转变的"官方声明"。

## 📚 相关文档

- [GEO 和 SEO 统一策略](./GEO_AND_SEO_UNIFIED.md)
- [GEO 命中率指南](./GEO_HIT_RATE_GUIDE.md)
- [完整 GEO & SEO 指南](../docs/COMPLETE_GEO_SEO_GUIDE.md)
