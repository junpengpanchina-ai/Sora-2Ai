# Sitemap 分层架构规范

> **版本**: 1.0
> **适用规模**: 10,000 - 100,000+ 页面
> **核心原则**: 分层优先级 + 防御式设计

---

## 总体架构

```
sitemap.xml (唯一入口 - Google 抓取起点)
│
├── /sitemaps/tier1-0.xml     ← 高价值核心页（1k URLs）
├── /sitemaps/tier1-1.xml     ← 高价值扩展（1k URLs）
├── /sitemaps/tier1-2.xml     ← ...
│
├── /sitemaps/tier2-0.xml     ← 长尾扩容页（2-5k URLs）
├── /sitemaps/tier2-1.xml     ← ...
│
└── /sitemap-core.xml         ← 品牌/信任页（<500 URLs）
```

---

## Tier 定义

### Tier 1：索引核心层（必须 100% 索引）

| 维度 | 规则 |
|------|------|
| **URL 数量** | 1,000 / chunk |
| **数据源** | RPC 函数（已过滤、去重、验证） |
| **收录目标** | 100% 索引 |
| **Canonical** | 必须指向自己 |
| **更新频率** | 低（内容稳定后不频繁更新 lastmod） |
| **内链要求** | 从首页/导航可达 |

**典型内容**：
- `/use-cases/*` - 核心用例页
- `/templates/*` - 模板详情页
- `/tools/*` - 工具页
- `/industries/*` - 行业页

**代码路由**：`app/sitemaps/[name]/route.ts`
**数据源**：`get_tier1_sitemap_chunk` RPC

### Tier 2：长尾扩容层（允许部分不索引）

| 维度 | 规则 |
|------|------|
| **URL 数量** | 2,000 - 5,000 / chunk |
| **数据源** | 表查询（批量生成） |
| **收录目标** | 30% - 70% 索引 |
| **Canonical** | 可指向 Tier1 同类页 |
| **更新频率** | 高（持续生成新页面） |
| **内链要求** | 从 Tier1 页面链入 |

**典型内容**：
- `/country/{cc}/{slug}` - 国家变体页
- `/scenes/{slug}` - 场景长尾页
- `/keywords/{slug}` - 关键词长尾页

**代码路由**：`app/sitemaps/tier2-[...n]/route.ts`（待建）

### Core：品牌信任层（手动维护）

| 维度 | 规则 |
|------|------|
| **URL 数量** | < 500 |
| **数据源** | 静态配置 / 手动维护 |
| **收录目标** | 100% 索引 + 高排名 |
| **Canonical** | 必须指向自己 |
| **更新频率** | 手动控制 |
| **内链要求** | 全站导航可达 |

**典型内容**：
- `/` - 首页
- `/pricing` - 定价页
- `/about` - 关于我们
- `/blog/*` - 博客文章（精选）
- `/docs/*` - 文档

**代码路由**：`app/sitemap-core.xml/route.ts`

---

## 三条铁律

### 1. Tier1 永远不指向 Tier2

```
✅ 正确：Tier2 页面 canonical → Tier1 同类页
❌ 错误：Tier1 页面 canonical → Tier2 页面
```

**原因**：Google 会把 canonical 目标页视为"主页"，如果 Tier1 指向 Tier2，会稀释 Tier1 的权重。

### 2. Tier2 可以 canonical → Tier1

```html
<!-- /country/us/video-generator 可以指向 -->
<link rel="canonical" href="https://sora2aivideos.com/use-cases/video-generator" />
```

**适用场景**：
- 国家/语言变体页 → 主页
- 参数变体页 → 干净 URL
- 相似内容页 → 最佳版本

### 3. Index Sitemap 只做导航，不做筛选

```
✅ sitemap.xml 的职责：告诉 Google 去哪里拿 URL
❌ sitemap.xml 不应该：过滤/排序/判断优先级
```

**原因**：Google 的 sitemap 处理器会自己决定抓取顺序，你的 sitemap 只需要提供完整的 URL 列表。

---

## Chunk 大小指南

| Tier | 推荐大小 | 最大大小 | 原因 |
|------|----------|----------|------|
| Tier1 | 1,000 | 5,000 | 确保高频抓取 |
| Tier2 | 2,000-5,000 | 10,000 | 平衡覆盖与效率 |
| Core | 200-500 | 1,000 | 手动维护 |

**Google 官方限制**：
- 单个 sitemap 最多 50,000 URLs
- 单个 sitemap 最大 50MB（未压缩）

**我们的保守策略**：
- 远低于限制，确保快速解析
- 小 chunk = 更容易监控和调试

---

## 索引起始值约定

> **重要**：这是 2026-01-24 事故的核心教训

```typescript
// ✅ 正确：统一从 0 开始
const TIER_START_INDEX = 0

// sitemap index 生成
Array.from({ length: chunkCount }, (_, i) => ({
  loc: `${baseUrl}/sitemaps/tier1-${i}.xml`,  // tier1-0, tier1-1, tier1-2...
}))

// ❌ 错误：从 1 开始（会导致 tier1-0 被跳过）
loc: `${baseUrl}/sitemaps/tier1-${i + 1}.xml`  // tier1-1, tier1-2...
```

**约定**：
- 所有 tier chunk 索引从 **0** 开始
- `tier1-0.xml` 是第一个 Tier1 chunk
- `tier2-0.xml` 是第一个 Tier2 chunk

---

## 放量节奏（冷启动）

### Day 0-3：核心启动

```
提交：
- /sitemap.xml
- /sitemaps/tier1-0.xml（单独提交）
- /sitemap-core.xml
```

### Day 4-7：扩展 Tier1

```
每 2 天新增 1 个 Tier1 chunk：
- Day 4: tier1-1.xml
- Day 6: tier1-2.xml
```

### Day 8-14：启动 Tier2

```
每天新增 1-3 个 Tier2 chunk：
- Day 8: tier2-0.xml
- Day 9: tier2-1.xml, tier2-2.xml
- ...
```

### Day 15+：稳定期

```
根据 GSC "已发现/已抓取" 数据调整：
- 增长正常 → 继续添加 chunk
- 增长停滞 → 减小 chunk 大小 / 增加内链
- 出现问题 → 暂停并诊断
```

---

## 监控指标

### 每日检查

| 指标 | 来源 | 正常值 |
|------|------|--------|
| Tier1 chunk URL 数 | `sitemap_health_check` | > 100 |
| sitemap.xml 引用 tier1-0 | curl 检查 | 是 |
| 抽样 URL 200 | curl 检查 | 是 |

### 每周检查

| 指标 | 来源 | 关注点 |
|------|------|--------|
| 已发现-尚未编入索引 | GSC Pages | 应持续增长 |
| 已抓取-尚未编入索引 | GSC Pages | 不应过高（内容问题） |
| 重复网页 | GSC Pages | 不应过高（canonical 问题） |

### 告警规则

```
🚨 CRITICAL（立即处理）：
- Tier1 任何 chunk URL 数 = 0
- sitemap.xml 未引用 tier1-0

⚠️ WARNING（24h 内处理）：
- Tier1 chunk URL 数 < 100
- Core sitemap URL 数 = 0

ℹ️ INFO（关注）：
- Tier2 chunk URL 数 = 0（可能是正常的空 chunk）
```

---

## 文件结构

```
app/
├── sitemap.xml/
│   └── route.ts          # 主 sitemap index
├── sitemap-index.xml/
│   └── route.ts          # 备用 index
├── sitemap-core.xml/
│   └── route.ts          # Core sitemap
└── sitemaps/
    ├── [name]/
    │   └── route.ts      # tier1-0, tier1-1... (RPC)
    └── tier1-[...n]/
        └── route.ts      # tier1-1+... (表查询，备用)

scripts/
├── sitemap_health_check.ts   # 健康检查脚本
├── gsc_sitemap_check.sh      # GSC 验证脚本
└── verify_sitemap_fix.sh     # 部署验证脚本

supabase/migrations/
└── 112_sitemap_health_check.sql  # 健康检查表和函数
```

---

## 相关文档

- [Sitemap 修复记录 2026-01-24](./SITEMAP_FIX_2026_01_24.md)
- [GSC 14 天行动手册](./GSC_SITEMAP_14DAY_PLAYBOOK.md)
- [Google Sitemap 官方文档](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview)

---

*文档版本: 1.0 | 创建时间: 2026-01-24*
