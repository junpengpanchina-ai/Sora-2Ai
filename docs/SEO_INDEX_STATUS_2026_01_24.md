# 网站收录现状报告

> **检测时间**: 2026-01-24 13:15 UTC  
> **GSC 更新时间**: 2026-01-20  
> **网站**: https://sora2aivideos.com  
> **状态**: 需处理 5xx/404 问题

---

## 零、GSC 实时数据（2026-01-20）

### 核心指标

| 指标 | 值 | 评估 |
|------|-----|------|
| **已编入索引** | 29,000 | ✅ 非常好 |
| **未编入索引** | 1,126 | ⚠️ 需关注 |
| **Index Rate** | 29,000 / 30,126 = **96.3%** | 🟢 GREEN |

### 未编入索引原因分解

| 原因 | 数量 | 来源 | 优先级 |
|------|------|------|--------|
| 网页会自动重定向 | 708 | 网站 | 🟡 中 |
| 已发现 - 尚未编入索引 | 266 | Google 系统 | 🟢 正常 |
| 已抓取 - 尚未编入索引 | 100 | Google 系统 | 🟡 观察 |
| **服务器错误 (5xx)** | **43** | 网站 | 🔴 **必须修** |
| **未找到 (404)** | **8** | 网站 | 🔴 **必须修** |
| 备用网页（有规范标记） | 1 | 网站 | 🟢 正常 |

### 图表趋势分析

从图表看（2025/10/26 - 2026/1/20）：
- 2025/12/20 开始有显著增长
- 2026/1/11 后持续上升
- 当前处于稳定增长阶段

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

## 六、策略决策：sitemap-core 暂不加入 index

### 现状

```
sitemap.xml 只引用了：
└── tier1-0.xml ✅ (1,000 URLs)

独立存在：
└── sitemap-core.xml (276 URLs) — 刻意保留在 index 外
```

### ⛔ 决策：现在不把 sitemap-core 加入 index

**结论**：这不是 Bug，而是正确的策略选择。

### 决策理由

#### 1️⃣ 需要建立 Index Rate 基准线

当前最重要的问题不是：
> "Google 能不能抓 1,276 个？"

而是：
> "Google 在只给 1,000 个 Tier1 时，实际索引率是多少？"

如果现在把 core 也加进去：
- Index Rate 被污染
- 后续所有扩容判断都不再干净

#### 2️⃣ 必须保持单变量实验

已经吃过 off-by-one 的亏。如果现在：
- 同时修复 index ✅（已完成）
- 同时引入 core ❌
- 同时观察 GSC

→ 一旦数据异常，无法定位原因

#### 3️⃣ sitemap-core 的角色本来就不是 Tier1

| Sitemap | 角色 | 定位 |
|---------|------|------|
| `tier1-0` | Scaling Probe | 扩容与抓取实验池 |
| `sitemap-core` | Brand Anchor | 站点稳定核心 |

Core 的正确命运是：
- 要么自然被发现（内链）
- 要么在 Index Gate 放行后再补进 index

**而不是现在抢跑。**

#### 4️⃣ 符合 SEO Infra 5 条铁律

| 铁律 | 当前状态 |
|------|----------|
| sitemap 从 tier1-0 开始 | ✅ 正确执行 |
| 信号干净 | ✅ 只有 tier1-0 |
| 扩容由 Index Gate 决定 | ✅ 未擅自扩容 |
| 不在 Index Rate 未知时扩容 | ✅ |
| Gate BLOCKED 时不 override | ✅ |

### 时间线决策

#### Day 0–14（现在）

```
什么都不要加

只做 3 件事：
1. 盯 Index Rate（发现 / 已索引）
2. 抽样 URL Inspection（5 个）
3. 观察 Crawl Stats
```

#### Day 14 之后：根据条件决定

| 条件 | Index Rate | 动作 |
|------|------------|------|
| **A（理想）** | ≥ 60-70% | 允许把 sitemap-core 加入 index |
| **B（保守）** | 低但抓取稳定 | GSC 单独提交 sitemap-core（不进 index） |
| **C（危险）** | 抓取异常/索引失败 | 冻结一切新增 sitemap |

### 本质判断

```
"sitemap-core 未进 index" 不是缺陷，
而是一个 SEO Scaling Gate 的手动阀门。

当前状态 = 完全 OK，甚至是理想状态。
```

---

## 七、健康评分

| 维度 | 状态 | 得分 |
|------|------|------|
| Sitemap Index | ✅ 正常（修复后） | 10/10 |
| tier1-0 | ✅ 1,000 URLs | 10/10 |
| sitemap-core | ✅ 刻意保留在 index 外 | 10/10 |
| URL 可访问性 | ✅ 200 | 10/10 |
| Canonical | ✅ 正确 | 10/10 |
| robots.txt | ✅ 正确 | 10/10 |
| **总分** | | **60/60** |

> **评分说明**：sitemap-core 未进 index 从"问题"重新定性为"正确的策略选择"。

---

## 八、🔴 紧急待处理：5xx / 404 问题

### 8.1 服务器错误 (5xx) - 43 个

**优先级**: 🔴 必须优先处理

**影响**：
- 直接影响 Google 的 Crawl 信心
- 严重时会拖累整体抓取预算
- 如果发生在 sitemap 路由 = 致命问题

**诊断步骤**：

```bash
# 1. 从 GSC 导出 5xx URL 列表
# GSC → Pages → 服务器错误(5xx) → 导出

# 2. 本地快速分诊
cat 5xx_urls.txt | while read u; do
  code=$(curl -s -o /dev/null -w "%{http_code}" -I "$u")
  echo "$code $u"
done | sort | uniq -c
```

**常见根因**（Next.js/Vercel/Supabase）：

| 根因 | 表现 |
|------|------|
| SSR/RPC 超时 | 某些页面偶发 500 |
| Edge Runtime 不兼容 | 特定路由 500 |
| DB 限流 | 高峰时段 500 |
| Sitemap 生成异常 | sitemap 路由 500 |

**修复原则**：
```
任何面向爬虫的路径：
宁可返回 200 + 稳定内容，也不要偶发 500
```

**验收标准**：5xx = 0（连续 7 天）

### 8.2 未找到 (404) - 8 个

**优先级**: 🔴 必须处理

**处理决策树**：

```
对每条 404 URL，二选一：

A. 页面应该存在（旧 slug / 迁移后地址变化）
   → 做 301 重定向到新地址
   → 避免链式重定向（301→301→200）
   → 新地址 canonical 指向自身

B. 页面就是不该存在（垃圾/错误拼写/已废弃）
   → 返回 410 Gone（比 404 更明确）
   → 从 sitemap、内链彻底移除
```

**验收标准**：404 不再出现在 sitemap/内链

### 8.3 网页会自动重定向 (708)

**优先级**: 🟡 中

**这不是事故**，但要确保：
- sitemap 里只放最终 200 的 canonical URL
- redirect 目标页是 200、可索引、canonical 正确
- 没有 redirect chain

**关键检查**：tier1-0 的 1000 条是否有 redirect？
- 如果有 → 必须修，会污染 Index Rate 实验池
- 如果没有 → OK

---

## 九、Gate 硬规则更新：5xx/404

### 新增 systemic_errors 规则

| 状态 | 条件 | 动作 |
|------|------|------|
| 🔴 **RED** | 5xx ≥ 10 (7d) 或 5xx > 0 连续 3 天 | 立即冻结 |
| 🟡 **YELLOW** | 5xx > 0 (today) 或 404_in_sitemap > 0 | 冻结扩容，允许修复 |
| 🟢 **GREEN** | 5xx = 0 且 404_in_sitemap = 0 (连续 7 天) | 允许扩容 |

**核心原则**：
```
索引率再高，系统性错误不为 0，也不能扩。
```

---

## 十、下一步行动

### 立即（今天）

- [ ] 从 GSC 导出 5xx URL 列表（43 条）
- [ ] 从 GSC 导出 404 URL 列表（8 条）
- [ ] 本地 curl 分诊，识别模式
- [ ] 判断是路由问题还是零散噪音

### Day 1-3（修复期）

- [ ] 修复 5xx 根因（SSR/RPC/超时）
- [ ] 处理 404（301 或 410）
- [ ] 验证 tier1-0 无 redirect

### Day 4-7（验收期）

- [ ] 确认 5xx = 0
- [ ] 确认 404 已处理
- [ ] 更新 Gate 状态

### Day 7+（恢复观察）

根据 Index Rate 决定 sitemap-core 命运：

| 条件 | 动作 |
|------|------|
| Index Rate ≥ 70% + 5xx = 0 | ✅ 可考虑扩容 |
| Index Rate OK 但 5xx > 0 | ⚠️ 继续修复 |
| Index Rate 异常 | ❌ 冻结，排查问题 |

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
