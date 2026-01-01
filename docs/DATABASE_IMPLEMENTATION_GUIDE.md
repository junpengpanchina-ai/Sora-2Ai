# 数据库实现指南（GEO & SEO 运营字段）

> **目标**：把 GEO & SEO 逻辑落到数据库字段 + SQL/Prisma + 自动挑选算法  
> **策略**：方案 A - 使用 `page_meta` 表，不修改原表（零风险、上线快）

---

## 📋 文件清单

### 1. 数据库迁移
- `database/migrations/add_page_meta.sql` - SQL 迁移文件（方案 A：page_meta 表）

### 2. Prisma Schema
- `prisma/schema-page-meta.prisma` - Prisma schema（方案 A：page_meta 表）

### 3. 核心算法
- `lib/page-priority-picker.ts` - 自动挑选高转化页面算法
- `lib/page-priority-queue.ts` - 队列管理
- `lib/index-health.ts` - Index Health 管理
- `lib/page-meta-helper.ts` - Page Meta 辅助函数

### 4. 脚本
- `scripts/daily-page-picker.ts` - 每日页面挑选脚本

---

## 🚀 实施步骤

### Step 1：执行数据库迁移

```bash
# 连接到你的数据库（Supabase / Postgres）
psql -h your-host -U your-user -d your-database -f database/migrations/add_page_meta.sql
```

**或者使用 Supabase Dashboard**：
1. 打开 Supabase Dashboard
2. 进入 SQL Editor
3. 复制 `add_geo_seo_fields.sql` 内容
4. 执行

---

### Step 2：更新 Prisma Schema

**将 `prisma/schema-page-meta.prisma` 中的内容添加到你的现有 schema**：

1. 复制 Enums 到你的 `schema.prisma`
2. 复制 `PageMeta`、`IndexHealthDaily` 和 `PagePriorityQueue` models

**不需要修改现有的 `UseCase` 和 `LongTailKeyword` models！**

**方案 A 的优势**：
- ✅ 不修改原表，零风险
- ✅ 所有运营字段统一在 `page_meta` 表
- ✅ 通过 `page_type` + `page_id` 关联原表
- ✅ 上线快，后续想合并再合并

**然后运行**：
```bash
npx prisma generate
npx prisma db push
```

---

### Step 3：配置数据库客户端

**在 `lib/page-priority-picker.ts` 和 `lib/page-priority-queue.ts` 中**：

替换 `db` 参数为你的实际数据库客户端：

```typescript
// 如果使用 Supabase
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!)

// 如果使用 Prisma
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
```

---

### Step 4：运行每日挑选脚本

**设置定时任务（cron）**：

```bash
# 每天上午 9 点运行
0 9 * * * cd /path/to/project && npm run pick-pages
```

**或手动运行**：
```bash
npm run pick-pages
```

**需要在 `package.json` 中添加**：
```json
{
  "scripts": {
    "pick-pages": "tsx scripts/daily-page-picker.ts"
  }
}
```

---

## 📊 数据库字段说明

### 核心运营字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `page_type` | TEXT | 'use_case' \| 'keyword' \| 'industry' \| 'core_sample' |
| `variant_id` | TEXT | 例如：H1A_AF_B_PP_scale |
| `geo_score` | INTEGER | 0-100 |
| `geo_level` | TEXT | 'G-A' \| 'G-B' \| 'G-C' \| 'G-None' |
| `purchase_intent` | SMALLINT | 0-3 |
| `trend_pressure` | SMALLINT | 0-4 |
| `layer` | TEXT | 'asset' \| 'conversion' \| 'core_sample' |

### 转化模块字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `prompt_preview_enabled` | BOOLEAN | 是否启用 Prompt Preview |
| `prompt_preview_text` | TEXT | Prompt 预览文本 |
| `cta_variant` | TEXT | 'continue' \| 'generate' \| 'turn_into_video' |
| `paywall_variant` | TEXT | 'export_lock' \| 'style_lock' \| 'full_lock' |

### 索引/发布节奏字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `publish_batch` | INTEGER | 每次排产批次号 |
| `publish_date` | TIMESTAMPTZ | 发布日期 |
| `index_state` | TEXT | 'unknown' \| 'discovered' \| 'crawled' \| 'indexed' \| 'excluded' |
| `last_index_check_at` | TIMESTAMPTZ | 最后索引检查时间 |

### 质量/同构风险字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `dup_hash` | TEXT | 内容指纹 hash，防重复 |
| `dup_cluster` | INTEGER | 聚类 id |
| `content_len` | INTEGER | 字符数或词数 |
| `last_generated_at` | TIMESTAMPTZ | 最后生成时间 |

---

## 🎯 自动挑选算法说明

### 评分公式

```
TotalScore = Geo + Intent + Index + Freshness - Risk
```

**各部分权重**：
- **Geo Score Part**（0-30）：根据 geo_score
- **Intent Score Part**（0-40）：根据 purchase_intent
- **Index Capacity Part**（0-20）：根据 Index Health
- **Freshness Part**（0-10）：根据最后生成时间
- **Risk Penalty**（0-50）：根据同构风险、内容长度、趋势压力

### 每日上限

| Index Health | 每日上限 |
|--------------|----------|
| ≥ 65% | 60-80 页 |
| 45-64% | 20-40 页 |
| 35-44% | 5-10 页 |
| < 35% | 0 页 |

---

## 📝 使用示例

### 1. 更新 Index Health 快照

```typescript
import { updateIndexHealthSnapshot } from '@/lib/index-health'

await updateIndexHealthSnapshot(db, {
  day: new Date(),
  discovered: 25000,
  crawled: 18000,
  indexed: 14000,
  crawlRequestsPerDay: 5000,
  sitemapSuccess: true,
})
```

### 2. 运行页面挑选

```typescript
import { pickHighConversionPages } from '@/lib/page-priority-picker'
import { getCurrentIndexHealth } from '@/lib/index-health'

const indexHealth = await getCurrentIndexHealth(db)
const candidates = await queryCandidatePages(db)
const result = pickHighConversionPages(candidates, indexHealth)
```

### 3. 写入队列

```typescript
import { writeToQueue } from '@/lib/page-priority-queue'

await writeToQueue(db, result)
```

### 4. 从队列读取待发布页面

```typescript
import { readFromQueue } from '@/lib/page-priority-queue'

const pages = await readFromQueue(db, 50)
// 发布这些页面
```

---

## 🔧 配置检查清单

- [ ] 执行 SQL 迁移文件
- [ ] 更新 Prisma schema
- [ ] 运行 `npx prisma generate`
- [ ] 配置数据库客户端
- [ ] 设置定时任务（cron）
- [ ] 测试页面挑选算法
- [ ] 验证队列写入/读取

---

## 📚 相关文档

- `docs/EXECUTION_TEMPLATES.md` - 执行模板
- `docs/RHYTHM_CONTROLLER.md` - 节奏控制器
- `docs/COMPLETE_GEO_SEO_GUIDE.md` - 完整 GEO & SEO 指南

---

**最后更新**：2025-12-30

