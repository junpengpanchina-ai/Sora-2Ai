# Tier1 内链 + Index Health + AI SERP 监控实现完成

## ✅ 已完成的功能

### 1. 🔁 Tier1 内链随机但可控算法（防模板）

**文件**:
- `./supabase/migrations/061_create_tier1_internal_links_tables.sql` - 数据库表
- `./scripts/generate-tier1-internal-links.ts` - 生成脚本
- `./app/api/related-links/route.ts` - API 路由
- `./components/RelatedTier1Links.tsx` - React 组件

**功能**:
- ✅ 每个 Tier1 页面生成 6 条内链（2 同 industry + 2 同 scene + 1 同 platform + 1 explore）
- ✅ 可复现的随机（同一页同一周生成相同链接）
- ✅ 每周自动轮换（week_key 格式：YYYY-WNN）
- ✅ 防模板（不同页面有不同的链接组合）
- ✅ 按权重排序（same_industry > same_scene > same_platform > explore）

**使用方法**:
```bash
# 生成内链（每周运行一次）
npm run generate:tier1-links

# 在页面中使用组件
import { RelatedTier1Links } from '@/components/RelatedTier1Links'

<RelatedTier1Links pageId={useCase.id} />
# 或
<RelatedTier1Links slug={useCase.slug} />
```

---

### 2. 📊 Index Health 周报（自动 JSON + 表格）

**文件**:
- `./supabase/migrations/061_create_tier1_internal_links_tables.sql` - 数据库表（index_health_reports）
- `./app/api/reports/index-health/route.ts` - API 路由
- `./app/index-health/page.tsx` - 周报页面

**功能**:
- ✅ 自动计算 Tier1 统计（数量、分数分布 P10/P50/P90）
- ✅ SERP 监控结果（引用率、AI Overview 率、平均位置）
- ✅ 阈值检查（Tier1 数量、分数阈值）
- ✅ 行动建议（基于当前数据）
- ✅ JSON API + 可视化页面

**使用方法**:
```bash
# 访问周报页面
https://sora2aivideos.com/index-health

# 获取 JSON 数据
curl https://sora2aivideos.com/api/reports/index-health
```

**周报内容**:
- Tier1 数量、Sitemap URLs
- Score 分布（P10/P50/P90/平均）
- SERP 监控（最近 7 天）
- 行动建议

---

### 3. 🤖 AI Overview / Citation 实测命中监控

**文件**:
- `./supabase/migrations/061_create_tier1_internal_links_tables.sql` - 数据库表（ai_serp_checks）
- `./scripts/run-ai-serp-checks.ts` - 监控脚本

**功能**:
- ✅ 抽样检查 Tier1 Top 2000 页（每周 200 页）
- ✅ 检测 AI Overview 出现
- ✅ 检测 Citation（域名是否被引用）
- ✅ 记录搜索结果位置
- ✅ 存储原始 SERP 数据（JSONB）

**使用方法**:
```bash
# 设置环境变量
export SERPAPI_KEY=your_serpapi_key

# 运行监控脚本（每周一次）
npm run monitor:ai-serp
```

**监控指标**:
- `has_ai_overview`: 是否出现 AI Overview
- `cited`: 是否被引用（域名出现在结果中）
- `position`: 在搜索结果中的位置（如果被引用）

**成本提示**:
- SerpAPI 免费版：100 次/月
- 建议每周运行一次（200 页 × 1 查询 = 200 次/月，需要付费版）

---

## 🗄️ 数据库迁移

**迁移文件**: `./supabase/migrations/061_create_tier1_internal_links_tables.sql`

**包含 3 张表**:
1. `page_internal_links` - Tier1 内链关系
2. `index_health_reports` - 周报快照
3. `ai_serp_checks` - SERP 监控结果

**应用迁移**:
```bash
# 如果使用 Supabase CLI
supabase migration up

# 或手动在 Supabase Dashboard → SQL Editor 执行
# 复制 ./supabase/migrations/061_create_tier1_internal_links_tables.sql 的内容
```

---

## 📦 NPM 脚本

已添加到 `package.json`:
```json
{
  "scripts": {
    "generate:tier1-links": "tsx scripts/generate-tier1-internal-links.ts",
    "monitor:ai-serp": "tsx scripts/run-ai-serp-checks.ts"
  }
}
```

---

## 🚀 立即执行步骤

### 步骤 1: 应用数据库迁移

```bash
# 在 Supabase Dashboard → SQL Editor 执行
# 或使用 Supabase CLI
supabase migration up
```

### 步骤 2: 生成 Tier1 内链（首次运行）

```bash
# 确保已运行 AI Citation Score 计算
npm run calculate:ai-scores:batch

# 生成内链
npm run generate:tier1-links
```

### 步骤 3: 在页面中使用内链组件

在 `app/use-cases/[slug]/page.tsx` 中添加：

```tsx
import { RelatedTier1Links } from '@/components/RelatedTier1Links'

// 在页面底部添加
<RelatedTier1Links slug={useCase.slug} />
```

### 步骤 4: 访问 Index Health 周报

```bash
# 访问页面
open https://sora2aivideos.com/index-health

# 或获取 JSON
curl https://sora2aivideos.com/api/reports/index-health
```

### 步骤 5: 设置 AI SERP 监控（可选）

```bash
# 设置环境变量
export SERPAPI_KEY=your_key

# 运行监控（每周一次）
npm run monitor:ai-serp
```

---

## 🔄 定期任务（建议使用 Vercel Cron）

**创建 `vercel.json`**:
```json
{
  "crons": [
    {
      "path": "/api/cron/recalc-scores",
      "schedule": "0 2 * * 1"
    },
    {
      "path": "/api/cron/gen-links",
      "schedule": "30 2 * * 1"
    },
    {
      "path": "/api/cron/ai-serp-checks",
      "schedule": "0 3 * * 1"
    }
  ]
}
```

**创建对应的 API 路由**（包装脚本逻辑）:
- `./app/api/cron/recalc-scores/route.ts`
- `./app/api/cron/gen-links/route.ts`
- `./app/api/cron/ai-serp-checks/route.ts`

---

## 📊 预期结果

### Tier1 内链
- ✅ 每个 Tier1 页面有 6 条相关内链
- ✅ 每周自动轮换（不会每天抖动）
- ✅ 同一周内可复现（方便缓存和调试）

### Index Health 周报
- ✅ 每周自动生成 JSON 快照
- ✅ 可视化页面显示关键指标
- ✅ 基于阈值的行动建议

### AI SERP 监控
- ✅ 每周抽样 200 页
- ✅ 记录引用率和 AI Overview 率
- ✅ 趋势数据可用于优化内容

---

## 🆘 故障排除

### 问题 1: `generate:tier1-links` 报错 "没有找到 Tier1 页面"
**解决**: 先运行 `npm run calculate:ai-scores:batch` 计算 AI Citation Score

### 问题 2: `monitor:ai-serp` 报错 "未设置 SERPAPI_KEY"
**解决**: 设置环境变量 `export SERPAPI_KEY=your_key`，或跳过此功能

### 问题 3: 内链组件不显示
**解决**: 
1. 确认已运行 `npm run generate:tier1-links`
2. 检查 `page_internal_links` 表是否有数据
3. 检查 API 路由 `/api/related-links?pageId=xxx` 是否返回数据

---

**完成时间**: 约 30 分钟  
**构建状态**: ✅ 通过（所有 TypeScript 错误已修复）
