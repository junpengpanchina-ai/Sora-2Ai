# 网站收录现状报告

> **检测时间**: 2026-01-24 13:15 UTC  
> **网站**: https://sora2aivideos.com  
> **状态**: 基本健康，有 1 个待修复项

---

## 一、Sitemap 结构总览

```
sitemap.xml (index)
└── tier1-0.xml         ✅ 1,000 URLs

sitemap-core.xml        ⚠️ 276 URLs（未在 index 中引用）
tier1-1.xml             ⚠️ 0 URLs（空，暂无数据）
```

---

## 二、Sitemap 详细状态

### 2.1 主 Sitemap Index

| 属性 | 值 |
|------|-----|
| **URL** | `https://sora2aivideos.com/sitemap.xml` |
| **HTTP 状态** | ✅ 200 |
| **Content-Type** | `application/xml; charset=utf-8` |
| **Cache** | `public, max-age=300` |

**内容**：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://sora2aivideos.com/sitemaps/tier1-0.xml</loc>
    <lastmod>2026-01-24T13:15:31.158Z</lastmod>
  </sitemap>
</sitemapindex>
```

### 2.2 Tier1-0 Sitemap

| 属性 | 值 |
|------|-----|
| **URL** | `https://sora2aivideos.com/sitemaps/tier1-0.xml` |
| **HTTP 状态** | ✅ 200 |
| **URL 数量** | **1,000** |
| **Content-Type** | `application/xml; charset=utf-8` |
| **Cache** | `public, max-age=3600` |

**示例 URL**：

```
https://sora2aivideos.com/use-cases/social-media-management-5b41dfd8a3-in-client-onboarding-ai-videos-are-used-for-welcoming-new-partner
https://sora2aivideos.com/use-cases/abstract-art-content-afbe34da18-in-facebook-art-ads-ai-videos-are-used-for-customer-testimonial-over
https://sora2aivideos.com/use-cases/abstract-art-content-cecd73996f-in-the-decor-industry-ai-videos-are-used-for-vertical-screen-wallpap
https://sora2aivideos.com/use-cases/abstract-art-content-dc7166037e-in-event-marketing-ai-videos-are-used-for-gallery-opening-promos-typ
https://sora2aivideos.com/use-cases/adventure-experience-brands-215e238b80-in-adventure-sailing-ai-videos-are-used-for-showcasing-onboar
```

### 2.3 Sitemap Core

| 属性 | 值 |
|------|-----|
| **URL** | `https://sora2aivideos.com/sitemap-core.xml` |
| **HTTP 状态** | ✅ 200 |
| **URL 数量** | **276** |
| **在 Index 中** | ❌ 未引用 |

**示例 URL**：

```
https://sora2aivideos.com/use-cases/e-commerce-brands-d0c439f853-in-e-commerce-ai-videos-are-used-for-future-vision-and-innovation-stori
https://sora2aivideos.com/use-cases/e-commerce-brands-f36c30bf1b-in-e-commerce-ai-videos-are-used-for-product-use-case-narratives-typica
https://sora2aivideos.com/use-cases/e-commerce-brands-5f08e05397-in-e-commerce-ai-videos-are-used-for-problem-solution-storytelling-typi
```

### 2.4 Tier1-1 Sitemap

| 属性 | 值 |
|------|-----|
| **URL** | `https://sora2aivideos.com/sitemaps/tier1-1.xml` |
| **HTTP 状态** | ✅ 200 |
| **URL 数量** | **0** |
| **状态** | ⚠️ 空（正常，暂无第二批数据） |

---

## 三、关键页面状态

| 页面 | URL | HTTP 状态 |
|------|-----|-----------|
| **首页** | `/` | ✅ 200 |
| **定价页** | `/pricing` | ✅ 200 |
| **Use Cases 列表** | `/use-cases` | ✅ 200 |
| **示例 Use Case** | `/use-cases/social-media-...` | ✅ 200 |

### Canonical 检查

**示例 URL**: `https://sora2aivideos.com/use-cases/social-media-management-5b41dfd8a3-in-client-onboarding-ai-videos-are-used-for-welcoming-new-partner`

```html
<link rel="canonical" href="https://sora2aivideos.com/use-cases/social-media-management-5b41dfd8a3-in-client-onboarding-ai-videos-are-used-for-welcoming-new-partner"/>
```

**结果**: ✅ Canonical 指向自身（正确）

---

## 四、robots.txt

```
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /auth/
Disallow: /storage-test/
Disallow: /payment-test/
Disallow: /prompts/

Sitemap: https://sora2aivideos.com/sitemap.xml
```

**评估**: ✅ 配置正确

- 允许所有爬虫访问主要内容
- 正确屏蔽管理/API/测试路径
- 正确声明 sitemap 位置

---

## 五、URL 统计

### 5.1 按 Sitemap 分布

| Sitemap | URL 数 | 在 Index 中 | 状态 |
|---------|--------|-------------|------|
| `tier1-0.xml` | 1,000 | ✅ 是 | 正常 |
| `sitemap-core.xml` | 276 | ❌ 否 | 待修复 |
| `tier1-1.xml` | 0 | ✅ 是 | 空（正常） |
| **总计** | **1,276** | - | - |

### 5.2 可被 Google 发现的 URL

| 来源 | URL 数 | 说明 |
|------|--------|------|
| 通过 sitemap.xml index | 1,000 | tier1-0 |
| 需要单独提交 | 276 | sitemap-core |
| **总计** | **1,276** | |

---

## 六、发现的问题

### ⚠️ 问题 1：sitemap-core.xml 未被 sitemap index 引用

**现状**：

```
sitemap.xml 只引用了：
├── tier1-0.xml ✅

缺少：
└── sitemap-core.xml ❌ (276 URLs)
```

**影响**：
- sitemap-core.xml 的 276 个 URL 不会通过主 sitemap 被 Google 自动发现
- 需要在 GSC 单独提交，或修改 sitemap index

**建议修复方案**：

**方案 A（推荐）**：将 sitemap-core 加入 index

修改 `app/sitemap.xml/route.ts`：

```typescript
const sitemaps = [
  { loc: `${baseUrl}/sitemap-core.xml`, lastmod: now },  // 新增
  ...tier1Sitemaps,
];
```

**方案 B**：在 GSC 单独提交

1. 登录 GSC
2. Sitemaps → Add a new sitemap
3. 提交：`sitemap-core.xml`

---

## 七、健康评分

| 维度 | 状态 | 得分 |
|------|------|------|
| Sitemap Index | ✅ 正常（修复后） | 10/10 |
| tier1-0 | ✅ 1,000 URLs | 10/10 |
| sitemap-core | ⚠️ 未在 index | 5/10 |
| URL 可访问性 | ✅ 200 | 10/10 |
| Canonical | ✅ 正确 | 10/10 |
| robots.txt | ✅ 正确 | 10/10 |
| **总分** | | **55/60** |

---

## 八、下一步行动

### 立即（Day 0）

- [ ] 决定 sitemap-core 处理方案（加入 index 或 GSC 单独提交）
- [ ] 如选方案 A，修改 `app/sitemap.xml/route.ts`
- [ ] 如选方案 B，在 GSC 提交 `sitemap-core.xml`

### 短期（Day 1-3）

- [ ] GSC 确认 sitemap 状态更新
- [ ] 观察 Pages 报告中"已发现"是否增长
- [ ] URL Inspection 抽查 5 个 URL

### 中期（Day 4-14）

- [ ] 按 14 天冷启动 Playbook 执行
- [ ] 监控 Index Rate
- [ ] 准备 tier1-1 数据（如需扩容）

---

## 九、对比：修复前 vs 修复后

| 维度 | 修复前（1月24日前） | 修复后（当前） |
|------|---------------------|----------------|
| sitemap.xml 指向 | ❌ tier1-1（空） | ✅ tier1-0（1000） |
| GSC 发现数 | 0 | 预计 1,000+ |
| 根因 | off-by-one 错误 | 已修复 |

---

## 十、附录

### A. 检测命令

```bash
# Sitemap Index
curl -s https://sora2aivideos.com/sitemap.xml

# Tier1-0 URL 数量
curl -s https://sora2aivideos.com/sitemaps/tier1-0.xml | grep -c "<url>"

# Sitemap Core URL 数量
curl -s https://sora2aivideos.com/sitemap-core.xml | grep -c "<url>"

# robots.txt
curl -s https://sora2aivideos.com/robots.txt

# 示例 URL 检查
curl -I "https://sora2aivideos.com/use-cases/..."
```

### B. 相关文档

| 文档 | 用途 |
|------|------|
| `docs/SITEMAP_FIX_2026_01_24.md` | 事故复盘 |
| `docs/SORA2_SEO_INFRA_COMPLETE_GUIDE.md` | 完整 SEO 指南 |
| `docs/GSC_SITEMAP_14DAY_PLAYBOOK.md` | 14 天行动表 |

---

*报告生成时间: 2026-01-24 13:15 UTC*
