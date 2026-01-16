# GEO/SEO 功能快速开始

## 🚀 5 分钟快速开始

### 1️⃣ OAuth 登录紧急修复（10 分钟）

**立即执行**（让客户马上能登录）：

1. **Google Cloud Console → OAuth consent screen → Test users**
   - 添加所有客户的 Google 邮箱
   - ✅ 立即生效

2. **Google Search Console → 添加 Domain 资源**
   - 选择 Domain（不是 URL-prefix）
   - 输入：`sora2aivideos.com`
   - 获取 TXT 记录

3. **Cloudflare → DNS → Add record**
   - Type: `TXT`
   - Name: `@`
   - Content: 粘贴 TXT 记录
   - Proxy: DNS only（灰云）

4. **回到 Search Console 验证**

**详细步骤**: 见 `./OAUTH_QUICK_FIX_URGENT.md`

---

### 2️⃣ 生成 Index Health 周报

```bash
npm run report:index-health:v2
```

**输出**:
- `reports/index-health-YYYY-MM-DD.md` (可导入 Notion)
- `reports/index-health-YYYY-MM-DD.csv` (可导入 Google Sheets)

**自定义数据**:
编辑 `data/index-health-data.json`

---

### 3️⃣ 计算 AI Citation Top 5000

```bash
npm run calculate:ai-citation:v2
```

**输出**:
- `data/ai-citation-lists/ai-citation-top5000-v2-YYYY-MM-DD.json`
  - `listA`: Top 1000（绝对核心）
  - `listB`: Next 2000（潜力池）
  - `listC`: Long-tail 2000（缓冲）

---

### 4️⃣ 使用 Tier1 内链算法

```typescript
import { pickLinks, generateLinkPools } from '@/lib/utils/tier1-internal-links'

// 在页面组件中使用
const pools = await generateLinkPools(page, allPages)
const links = pickLinks({
  pageId: page.id,
  pools,
  minLinks: 4,
  maxLinks: 6,
})
```

**特性**:
- ✅ 每周自动换一批链接（基于周数）
- ✅ 可复现（相同 pageId + 周数 = 相同链接）
- ✅ 分层采样（60% 同行业 + 30% 相近行业 + 10% 平台页）

---

## 📋 每周工作流

1. **周一/周二**: 生成 Index Health 周报
   ```bash
   npm run report:index-health:v2
   ```

2. **查看决策表**:
   - Index Rate ≥60% → ✅ 继续发布 Tier1
   - Index Rate 40-59% → ⏸ 暂停新增
   - Index Rate <40% → ⛔ 立刻停发

3. **使用 List A（Top 1000）**:
   - 放进 Tier1 sitemap
   - 优先内链
   - ❌ 不准改结构

---

## 🧠 核心认知

**你现在的问题不是"没流量"，而是：**

Google 还在判断：
你是"模板站"，还是"可引用知识库"。

**Index Health 是信任指标，不是流量指标。**

---

## 📚 完整文档

- [完整实施方案](./docs/GEO_SEO_COMPLETE_IMPLEMENTATION.md)
- [OAuth 快速修复](./OAUTH_QUICK_FIX_URGENT.md)
- [Tier 1 Sitemap 指南](./docs/TIER1_SITEMAP_GUIDE.md)
- [Index Health 快速开始](./INDEX_HEALTH_QUICK_START.md)
