# GEO/SEO 完整实施方案

## 🎯 概述

本指南包含完整的 GEO/SEO 实施，包括：
1. OAuth 登录紧急修复
2. AI Citation Score 实现
3. Index Health 周报（Notion/Sheet 自动版）
4. 5000 页筛选逻辑
5. Tier1 内链"随机但可控"算法

---

## Part A: OAuth 登录紧急修复

### ⚡ 10 分钟让客户立刻能登录

**文件**: `./OAUTH_QUICK_FIX_URGENT.md`

**步骤**:
1. 把客户邮箱加进 Test users（立即生效）
2. Google Search Console 域名验证（Cloudflare TXT 记录）
3. 确保 3 个 URL 可公开访问
4. 检查 Redirect URIs 配置

**详细步骤见**: `./OAUTH_QUICK_FIX_URGENT.md`

---

## Part B: AI Citation Score 实现

### 📊 评分维度（总分 100）

- **内容结构（50分）**
  - Answer-first 120-220 词（15分）
  - 可引用列表（10分）
  - Steps（10分）
  - FAQ ≥3（10分）
  - Industry Constraints（5分）

- **去重与质量（20分）**
  - 字数 ≥900（10分）
  - 相似度惩罚（10分）

- **权威锚点与内链（20分）**
  - KB 锚点（5分）
  - 内链 3-8（10分）
  - 行业聚类（5分）

- **可抓取性（10分）**
  - indexable（10分）

### 💻 代码实现

**文件**: `./lib/utils/ai-citation-scorer-v2.ts`

```typescript
import { computeAiCitationScore, extractCitationSignals } from '@/lib/utils/ai-citation-scorer-v2'

const signals = extractCitationSignals(page)
const score = computeAiCitationScore(signals)
```

### 📊 数据库存储

**表**: `page_scores`

```sql
CREATE TABLE page_scores (
  url TEXT PRIMARY KEY,
  tier INTEGER,
  ai_citation_score INTEGER,
  recalc_at TIMESTAMPTZ,
  signals JSONB
);
```

**迁移文件**: `./supabase/migrations/060_create_page_scores_table.sql`

---

## Part C: Index Health 周报（Notion/Sheet 自动版）

### 📋 周报内容

1. **核心总览（4 个关键指标）**
   - Indexed Pages (Tier1)
   - Avg Position (Tier1)
   - Impressions (Tier1)
   - AI-Style Queries 占比

2. **Tier 分层健康度**
   - Tier1/2/3 的索引率

3. **查询信号分析**
   - AI 偏好型
   - SEO 偏好型

4. **决策表**
   - 是否允许"动内容"

### 💻 使用方法

```bash
# 生成周报（Markdown + CSV）
npm run report:index-health:v2
```

**输出**:
- `reports/index-health-YYYY-MM-DD.md` (可导入 Notion)
- `reports/index-health-YYYY-MM-DD.csv` (可导入 Google Sheets)

### 📊 数据来源

**当前**: 使用 `data/index-health-data.json`（手动填写）

**未来**: 可集成 Google Search Console API

---

## Part D: 5000 页筛选逻辑

### 🎯 筛选流程

1. **硬过滤**
   - indexable=true
   - wordCount≥600
   - nearDuplicateScore≤0.35
   - 不在黑名单行业

2. **计算 AI Citation Score**
   - 使用 `computeAiCitationScore()`

3. **排序**
   - 按 `ai_citation_score DESC`

4. **行业配额**
   - 每个 Industry 最多 50
   - 每个 Platform 最多 1000

5. **多样性抽样**
   - 从 8000 取 5000（按行业比例）

### 💻 使用方法

```bash
# 计算 Top 5000
npm run calculate:ai-citation:v2
```

**输出**:
- `data/ai-citation-lists/ai-citation-top5000-v2-YYYY-MM-DD.json`
  - `listA`: Top 1000（绝对核心）
  - `listB`: Next 2000（潜力池）
  - `listC`: Long-tail 2000（缓冲）

---

## Part E: Tier1 内链"随机但可控"算法

### 🎯 目标

- 每页 4-6 个相关链接
- 不要每页都一样
- 可复现（方便缓存、排查）

### 💻 实现

**文件**: `./lib/utils/tier1-internal-links.ts`

```typescript
import { pickLinks, generateLinkPools } from '@/lib/utils/tier1-internal-links'

// 生成候选池
const pools = await generateLinkPools(page, allPages)

// 选择链接（每周自动换一批）
const links = pickLinks({
  pageId: page.id,
  pools,
  minLinks: 4,
  maxLinks: 6,
})
```

### 🔑 核心特性

- **可复现**: 使用 `hash(pageId + weekNumber)` 作为种子
- **每周自动换**: 基于周数，每周自动换一批链接
- **分层采样**: 60% 同行业 + 30% 相近行业 + 10% 平台页

---

## 📋 完整工作流

### 每周执行

1. **生成 Index Health 周报**
   ```bash
   npm run report:index-health:v2
   ```

2. **查看决策表**
   - Index Rate ≥60% → 继续发布 Tier1
   - Index Rate 40-59% → 暂停新增
   - Index Rate <40% → 立刻停发

3. **计算 Top 5000**（如果需要更新）
   ```bash
   npm run calculate:ai-citation:v2
   ```

4. **使用 List A（Top 1000）**
   - 放进 Tier1 sitemap
   - 优先内链
   - 不准改结构

---

## 🚨 重要提醒

### ❌ 千万不要做的 3 件事

1. ❌ **不要把 Tier1 再扩大到 5 万**
2. ❌ **不要因为"没流量"改结构**
3. ❌ **不要删 Tier2 / Tier3 页面**

### ✅ 核心认知

**你现在的问题不是"没流量"，而是：**

Google 还在判断：
你是"模板站"，还是"可引用知识库"。

**Index Health 是信任指标，不是流量指标。**

---

## 📚 相关文档

- [OAuth 快速修复](./OAUTH_QUICK_FIX_URGENT.md)
- [Tier 1 Sitemap 指南](./TIER1_SITEMAP_GUIDE.md)
- [Index Health 快速开始](../INDEX_HEALTH_QUICK_START.md)
- [GEO 和 SEO 统一策略](../GEO_AND_SEO_UNIFIED.md)
