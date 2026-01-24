# GSC URL 自动标签工具 - 完整使用指南

> **功能**：一键将 GSC 导出的 1,126 个未收录 URL 自动分类为 delete / keep / enhance，并生成 Supabase 可直接执行的 SQL  
> **零手工版**：自动识别列名、并发抓取、自动生成 upsert SQL

---

## 📋 目录

1. [工具概述](#工具概述)
2. [快速开始（5 分钟）](#快速开始5-分钟)
3. [详细步骤](#详细步骤)
4. [脚本说明](#脚本说明)
5. [SQL 说明](#sql-说明)
6. [批量处理 use_cases](#批量处理-use_cases)
7. [常见问题](#常见问题)
8. [完整示例](#完整示例)

---

## 🎯 工具概述

### ⚠️ 重要说明

**表结构以 `supabase/migrations/108_seo_gsc_urls_table.sql` 为准**  
脚本生成的 SQL 必须与该表字段严格一致。请先执行 migration 108 创建表，脚本只负责 upsert 数据，不负责建表。

### 功能列表

✅ **自动识别 GSC CSV 列名**（支持多种变体）  
✅ **并发抓取页面元数据**（HTTP 状态、canonical、内容长度、字数）  
✅ **自动分类**（delete / keep / enhance）  
✅ **生成 Supabase upsert SQL**（可直接执行）  
✅ **零手工操作**（全自动流程）  
✅ **抓取安全模式**（只抓本站域名、429/403 重试、限速）

---

### 工具文件

| 文件 | 说明 |
|------|------|
| `scripts/gsc_label_urls_auto.mjs` | 主脚本（自动识别列名、并发抓取、生成 SQL） |
| `supabase/migrations/108_seo_gsc_urls_table.sql` | 数据库表结构 |
| `supabase/migrations/109_auto_label_gsc_urls.sql` | 自动标签 SQL（基于 reason） |
| `docs/GSC_URL_LABELING_GUIDE.md` | 基础使用指南 |

---

## ⚡ 快速开始（5 分钟）

### 步骤 1：从 GSC 导出未收录 URL

1. 打开 [Google Search Console](https://search.google.com/search-console)
2. 进入 **Pages** → **未编入索引**
3. 点击右上角 **导出** 按钮
4. 下载 CSV 文件（例如：`gsc_not_indexed.csv`）

**CSV 格式要求**：
- 至少包含 `url` 列（或类似列名：`page`, `网址`, `链接`）
- 最好包含 `reason` 列（或类似列名：`原因`, `status`, `问题`）
- 如果只有 URL，reason 可以为空

---

### 步骤 2：运行自动标签脚本

```bash
# 进入项目目录
cd /Users/p/Documents/GitHub/Sora-2Ai

# 运行脚本（自动识别列名、并发抓取、生成 SQL）
node scripts/gsc_label_urls_auto.mjs gsc_not_indexed.csv gsc_labeled.sql
```

**输出**：
- `gsc_labeled.sql`：可直接在 Supabase SQL Editor 执行的 SQL 文件

---

### 步骤 3：在 Supabase 执行 SQL

1. 打开 [Supabase Dashboard](https://app.supabase.com)
2. 进入项目 → **SQL Editor**
3. 复制 `gsc_labeled.sql` 的内容
4. 粘贴到 SQL Editor
5. 点击 **Run** 执行

**结果**：
- 自动创建 `seo_gsc_urls` 表（如果不存在）
- 插入/更新所有 URL 数据
- 自动打标签（delete / keep / enhance）
- 显示标签分布统计

---

### 步骤 4：查看标签分布

```sql
-- 在 Supabase SQL Editor 执行
SELECT 
  tag,
  count(*) as count,
  round(100.0 * count(*) / (SELECT count(*) FROM seo_gsc_urls), 2) as percentage
FROM seo_gsc_urls
GROUP BY tag
ORDER BY count DESC;
```

---

### 步骤 5：批量处理 use_cases

```sql
-- 处理"该删"页面（noindex + 出 sitemap）
-- 见下方"批量处理 use_cases"章节
```

---

## 📝 详细步骤

### 步骤 1：准备 GSC CSV 文件

#### 从 GSC 导出

1. **打开 Google Search Console**
   - 访问：https://search.google.com/search-console
   - 选择你的网站属性

2. **进入未编入索引页面**
   - 左侧菜单：**Pages** → **未编入索引**
   - 或直接访问：`https://search.google.com/search-console/index?resource_id=sc-domain:yourdomain.com&page=indexing-issues`

3. **导出 CSV**
   - 点击右上角 **导出** 按钮
   - 选择 **CSV** 格式
   - 下载文件（例如：`gsc_not_indexed.csv`）

#### CSV 格式示例

**标准格式**：
```csv
url,reason
https://sora2aivideos.com/use-cases/xxx,已发现 - 尚未编入索引
https://sora2aivideos.com/use-cases/yyy,重复网页，Google 选择了不同的规范网页
https://sora2aivideos.com/use-cases/zzz,已抓取 - 尚未编入索引
```

**只有 URL（也可以）**：
```csv
url
https://sora2aivideos.com/use-cases/xxx
https://sora2aivideos.com/use-cases/yyy
```

**脚本会自动识别以下列名变体**：
- URL 列：`url`, `page`, `网址`, `链接`, `address`, `loc`
- Reason 列：`reason`, `原因`, `status`, `问题`, `issue`, `why`, `why_not_indexed`

---

### 步骤 2：运行自动标签脚本

#### 基本用法

```bash
node scripts/gsc_label_urls_auto.mjs gsc_not_indexed.csv gsc_labeled.sql
```

#### 参数说明

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `gsc_not_indexed.csv` | 输入的 GSC CSV 文件 | `gsc_export.csv` |
| `gsc_labeled.sql` | 输出的 SQL 文件 | `gsc_labeled.sql` |

#### 环境变量

```bash
# 设置并发数（默认 20）
CONCURRENCY=30 node scripts/gsc_label_urls_auto.mjs gsc_not_indexed.csv gsc_labeled.sql

# 设置超时时间（默认 15 秒）
TIMEOUT_MS=30000 node scripts/gsc_label_urls_auto.mjs gsc_not_indexed.csv gsc_labeled.sql

# 设置允许的域名（默认 sora2aivideos.com，防止抓取外站）
ALLOW_HOSTS="sora2aivideos.com,www.sora2aivideos.com" node scripts/gsc_label_urls_auto.mjs gsc_not_indexed.csv gsc_labeled.sql

# 设置限速（默认 100ms，每个 worker 之间的延迟）
RATE_LIMIT_MS=150 node scripts/gsc_label_urls_auto.mjs gsc_not_indexed.csv gsc_labeled.sql

# 同时设置
CONCURRENCY=30 TIMEOUT_MS=30000 ALLOW_HOSTS="sora2aivideos.com" RATE_LIMIT_MS=150 node scripts/gsc_label_urls_auto.mjs gsc_not_indexed.csv gsc_labeled.sql
```

#### 抓取安全模式

脚本包含以下安全机制：

1. **只抓本站域名**：通过 `ALLOW_HOSTS` 环境变量控制，非允许域名直接跳过
2. **429/403 重试**：最多重试 3 次，指数退避（0.5s / 1s / 2s）
3. **限速**：每个 worker 之间延迟（默认 100ms），避免打爆站点
4. **5xx 错误**：标记为 `keep`（server_error_retry），可能是临时问题

#### 运行过程

**推荐命令**（包含安全设置）：
```bash
ALLOW_HOSTS="sora2aivideos.com,www.sora2aivideos.com" \
CONCURRENCY=20 TIMEOUT_MS=15000 \
node scripts/gsc_label_urls_auto.mjs gsc_not_indexed.csv gsc_labeled.sql
```

脚本会显示：
```
✅ Detected columns:
   URL: url (index 0)
   Reason: reason (index 1)
✅ Loaded 1126 URLs

🚀 Starting 20 workers...

Progress: 50/1126 (4%)
Progress: 100/1126 (9%)
...

✅ Done! SQL saved to: gsc_labeled.sql
📊 Tag distribution (local run): delete=156, keep=678, enhance=292
```

**输出文件**：
- `gsc_labeled.sql`：包含 BEGIN/COMMIT 事务，可直接在 Supabase 执行

---

### 步骤 3：在 Supabase 执行 SQL

#### ⚠️ 重要：执行顺序

**必须按以下顺序执行**：

1. **先执行 migration 108（建表）**
   - 在 Supabase SQL Editor 执行 `supabase/migrations/108_seo_gsc_urls_table.sql`
   - 确认表 `seo_gsc_urls` 已创建

2. **再跑脚本生成 SQL**
   - 运行脚本生成 `gsc_labeled.sql`

3. **最后在 Supabase 执行 SQL**
   - 在 Supabase SQL Editor 执行 `gsc_labeled.sql`

**重要说明**：
- 脚本不负责建表，输出 SQL 与 108 表结构严格一致
- 如修改表字段，需同步更新脚本 upsert 字段

#### 方法 A：使用 SQL Editor（推荐）

1. **打开 Supabase Dashboard**
   - 访问：https://app.supabase.com
   - 选择你的项目

2. **先执行 migration 108**
   - 打开 `supabase/migrations/108_seo_gsc_urls_table.sql`
   - 复制内容到 SQL Editor
   - 执行创建表

3. **进入 SQL Editor**
   - 左侧菜单：**SQL Editor**
   - 点击 **New query**

4. **粘贴脚本生成的 SQL 内容**
   - 打开 `gsc_labeled.sql` 文件
   - 复制全部内容
   - 粘贴到 SQL Editor

5. **执行 SQL**
   - 点击 **Run** 按钮（或按 `Cmd+Enter` / `Ctrl+Enter`）
   - 等待执行完成

6. **查看结果**
   - SQL 末尾会自动执行统计查询
   - 查看标签分布结果

#### 方法 B：使用 psql（命令行）

```bash
# 设置环境变量
export DATABASE_URL="postgresql://user:password@host:port/database"

# 执行 SQL
psql $DATABASE_URL -f gsc_labeled.sql
```

---

### 步骤 4：查看标签分布

```sql
-- 标签分布统计
SELECT 
  tag,
  count(*) as count,
  round(100.0 * count(*) / (SELECT count(*) FROM seo_gsc_urls), 2) as percentage
FROM seo_gsc_urls
GROUP BY tag
ORDER BY count DESC;
```

**输出示例**：
```
tag     | count | percentage
--------|-------|------------
keep    |   678 |      60.21
enhance |   292 |      25.93
delete  |   156 |      13.86
```

---

### 步骤 5：查看详细信息

```sql
-- 查看"该删"的 URL
SELECT url, reason, tag_reason
FROM seo_gsc_urls
WHERE tag = 'delete'
ORDER BY url
LIMIT 50;

-- 查看"该增强"的 URL
SELECT url, reason, tag_reason, word_count
FROM seo_gsc_urls
WHERE tag = 'enhance'
ORDER BY word_count ASC
LIMIT 50;

-- 查看"该留"的 URL
SELECT url, reason, tag_reason
FROM seo_gsc_urls
WHERE tag = 'keep'
ORDER BY url
LIMIT 50;
```

---

## 🔧 脚本说明

### 脚本功能

`scripts/gsc_label_urls_auto.mjs` 包含以下功能：

1. **自动列名识别**
   - 支持多种列名变体
   - 自动检测 URL 和 Reason 列

2. **并发抓取**
   - 默认 20 并发
   - 可配置并发数
   - 自动重试和错误处理

3. **自动分类**
   - 基于 reason + URL 形态
   - 基于 HTTP 状态码
   - 基于内容长度
   - 基于 canonical URL

4. **生成 SQL**
   - 自动创建表结构
   - 生成 upsert SQL
   - 包含统计查询

---

### 分类逻辑

#### delete（该删）

**触发条件**：
- URL 包含查询参数（`?`）
- Reason 包含 "soft 404"
- Reason 包含 "not found" 或 "404"
- HTTP 状态码 404 或 410
- 内容字数 < 120

**处理方式**：
- 设置 `noindex = true`
- 设置 `in_sitemap = false`

---

#### keep（该留）

**触发条件**：
- Reason 包含 "discovered"（已发现未编入）
- Reason 包含 "crawled"（已抓取未编入）
- HTTP 状态码 >= 500（服务器错误，可能是临时问题）

**处理方式**：
- 无需处理，等待 Google 自然收录
- 持续监控状态

---

#### enhance（该增强）

**触发条件**：
- Reason 包含 "duplicate" 或 "canonical"（重复/规范问题）
- Reason 包含 "alternate page"（替代页面）
- 内容字数 120-250（过薄）
- Canonical URL 指向其他页面

**处理方式**：
- 增强内容差异化
- 添加行业特定内容
- 优化 FAQ 部分

---

## 📊 SQL 说明

### 数据库表结构

```sql
CREATE TABLE IF NOT EXISTS seo_gsc_urls (
  id bigserial primary key,
  url text not null unique,
  reason text,
  source text default 'gsc_export',
  first_seen_at timestamptz default now(),
  last_seen_at timestamptz default now(),
  http_status int,
  canonical_url text,
  content_length int,
  word_count int,
  in_sitemap boolean,
  has_query_params boolean,
  tag text check (tag in ('delete','keep','enhance')) default null,
  tag_reason text,
  notes text
);
```

---

### 自动标签 SQL

`supabase/migrations/109_auto_label_gsc_urls.sql` 包含：

1. **标记 URL 特征**（has_query_params）
2. **基于 reason 打标签**（第一版，覆盖 70% 决策）
3. **基于 HTTP 状态码纠偏**
4. **基于内容长度纠偏**
5. **基于 canonical 纠偏**

---

## 🛠️ 批量处理 use_cases（多路径支持）

### ⚠️ 重要：路径限定说明

**推荐使用 migration 110**：`supabase/migrations/110_apply_gsc_tags_to_pages.sql`

这个 SQL 支持：
- ✅ 自动识别多路径（`/use-cases/`、`/blog/`、`/keywords/` 等）
- ✅ 自动提取 slug（单级和多级路径）
- ✅ 只更新允许的域名（安全过滤）
- ✅ 按 tag 分流更新（delete/enhance/keep）

### 使用 migration 110（推荐）

**步骤**：

1. **先执行路径前缀统计**（了解 URL 分布）：
   ```sql
   -- 在 Supabase SQL Editor 执行
   -- supabase/migrations/111_gsc_path_prefix_stats.sql
   ```
   这会显示 Top 50 路径前缀及其数量，帮你了解 GSC 中 URL 的分布情况。

2. **执行批量更新 SQL**：
   ```sql
   -- 在 Supabase SQL Editor 执行
   -- supabase/migrations/110_apply_gsc_tags_to_pages.sql
   ```

3. **SQL 会自动**：
   - 解析所有 URL 的路径类型
   - 提取 slug
   - 按 tag 批量更新 `use_cases` 表
   - 其他路径类型默认注释（需要手动启用）

**支持的路径类型**：
- `/use-cases/{slug}` → `use_cases` 表（已启用）
- `/blog/{slug}` → 需要取消注释并确认表名
- `/keywords/{slug}` → 需要取消注释并确认表名
- `/industries/{slug}` → 需要取消注释并确认表名
- `/compare/{slug}` → 需要取消注释并确认表名
- `/country/{cc}/{slug}` → 需要取消注释并确认表名

**安全特性**：
- 只处理允许的域名（`sora2aivideos.com`、`www.sora2aivideos.com`）
- 只更新命中的 slug（不会整表扫描）
- 其他路径类型默认注释（避免误更新）

**下一步优化**：
- 如果你提供 3 个真实 URL 样例（use-cases / country / blog 各 1 个），我可以把 path_type/slug 规则优化到 100% 命中你的项目

---

### 手动处理（仅 use_cases，旧方法）

**以下 SQL 仅适用于 URL 路径为 `/use-cases/` 的情况**。

如果 GSC 导出中包含其他路径，建议使用 migration 110。

---

### 处理"该删"页面

```sql
-- 先预览会被影响的 slug（可选）
WITH gsc AS (
  SELECT
    url,
    tag,
    regexp_replace(url, '.*/use-cases/([^/?#]+).*', '\1') AS slug
  FROM seo_gsc_urls
  WHERE tag = 'delete'
    AND url LIKE '%/use-cases/%'
)
SELECT slug, url, tag
FROM gsc
ORDER BY slug
LIMIT 100;

-- 真正更新 use_cases（批量下线）
WITH gsc AS (
  SELECT
    regexp_replace(url, '.*/use-cases/([^/?#]+).*', '\1') AS slug
  FROM seo_gsc_urls
  WHERE tag = 'delete'
    AND url LIKE '%/use-cases/%'
)
UPDATE use_cases uc
SET
  noindex            = TRUE,
  in_sitemap         = FALSE,
  index_health_status= COALESCE(index_health_status, 'deleted'),
  updated_at         = NOW()
WHERE uc.slug IN (SELECT slug FROM gsc);
```

---

### 处理"该增强"页面

```sql
-- 先预览（可选）
WITH gsc AS (
  SELECT
    url,
    tag,
    regexp_replace(url, '.*/use-cases/([^/?#]+).*', '\1') AS slug
  FROM seo_gsc_urls
  WHERE tag = 'enhance'
    AND url LIKE '%/use-cases/%'
)
SELECT slug, url, tag
FROM gsc
ORDER BY slug
LIMIT 100;

-- 真正更新 use_cases（标记为需要增强）
WITH gsc AS (
  SELECT
    regexp_replace(url, '.*/use-cases/([^/?#]+).*', '\1') AS slug
  FROM seo_gsc_urls
  WHERE tag = 'enhance'
    AND url LIKE '%/use-cases/%'
)
UPDATE use_cases uc
SET
  index_health_status = 'needs_enhancement',
  updated_at          = NOW()
WHERE uc.slug IN (SELECT slug FROM gsc)
  AND COALESCE(index_health_status, '') NOT IN ('deleted');
```

---

### 处理"该留"页面

```sql
-- 标记为正常（无需处理）
WITH gsc AS (
  SELECT
    regexp_replace(url, '.*/use-cases/([^/?#]+).*', '\1') AS slug
  FROM seo_gsc_urls
  WHERE tag = 'keep'
    AND url LIKE '%/use-cases/%'
)
UPDATE use_cases uc
SET
  index_health_status = 'keep_monitoring',
  updated_at          = NOW()
WHERE uc.slug IN (SELECT slug FROM gsc)
  AND COALESCE(index_health_status, '') NOT IN ('deleted', 'needs_enhancement');
```

---

## ❓ 常见问题

### Q1: CSV 导入失败？

**可能原因**：
- CSV 文件编码不是 UTF-8
- 列名不匹配
- URL 格式不正确

**解决方案**：
1. 检查 CSV 文件编码（确保是 UTF-8）
2. 检查列名（脚本会自动识别多种变体）
3. 检查 URL 格式（确保是完整 URL）

---

### Q2: 脚本运行很慢？

**优化方法**：
```bash
# 降低并发数
CONCURRENCY=10 node scripts/gsc_label_urls_auto.mjs gsc_not_indexed.csv gsc_labeled.sql

# 增加超时时间
TIMEOUT_MS=30000 node scripts/gsc_label_urls_auto.mjs gsc_not_indexed.csv gsc_labeled.sql

# 分批处理（手动分割 CSV）
# 每次处理 500 个 URL
```

---

### Q3: 标签不准确？

**纠偏方法**：
1. 运行增强版脚本（抓取 HTTP 状态、canonical、内容长度）
2. 手动检查部分 URL
3. 调整分类逻辑（修改脚本中的 `classify` 函数）

---

### Q4: 如何重新运行？

**方法**：
```sql
-- 清空表（如果需要）
TRUNCATE TABLE seo_gsc_urls;

-- 重新运行脚本
node scripts/gsc_label_urls_auto.mjs gsc_not_indexed.csv gsc_labeled.sql

-- 重新执行 SQL
-- 在 Supabase SQL Editor 执行 gsc_labeled.sql
```

---

### Q5: 如何只处理部分 URL？

**方法**：
```bash
# 手动编辑 CSV，只保留需要处理的 URL
# 然后运行脚本
node scripts/gsc_label_urls_auto.mjs gsc_partial.csv gsc_labeled.sql
```

---

## 📋 完整示例

### 示例 1：完整流程

```bash
# 1. 从 GSC 导出 CSV（手动操作）
# 下载：gsc_not_indexed.csv

# 2. 运行脚本
node scripts/gsc_label_urls_auto.mjs gsc_not_indexed.csv gsc_labeled.sql

# 3. 在 Supabase SQL Editor 执行 gsc_labeled.sql

# 4. 查看标签分布
SELECT tag, count(*) FROM seo_gsc_urls GROUP BY tag;

# 5. 批量处理 use_cases
# 执行"批量处理 use_cases"章节的 SQL
```

---

### 示例 2：只处理特定类型的 URL

```sql
-- 只处理"该删"的 URL
WITH gsc AS (
  SELECT
    regexp_replace(url, '.*/use-cases/([^/?#]+).*', '\1') AS slug
  FROM seo_gsc_urls
  WHERE tag = 'delete'
    AND url LIKE '%/use-cases/%'
    AND tag_reason = 'too_thin'  -- 只处理内容过薄的
)
UPDATE use_cases uc
SET
  noindex = TRUE,
  in_sitemap = FALSE,
  index_health_status = 'deleted',
  updated_at = NOW()
WHERE uc.slug IN (SELECT slug FROM gsc);
```

---

### 示例 3：导出处理结果

```sql
-- 导出"该删"的 URL 列表
COPY (
  SELECT url, reason, tag_reason
  FROM seo_gsc_urls
  WHERE tag = 'delete'
  ORDER BY url
) TO '/tmp/gsc_delete_urls.csv' WITH CSV HEADER;

-- 导出"该增强"的 URL 列表
COPY (
  SELECT url, reason, tag_reason, word_count
  FROM seo_gsc_urls
  WHERE tag = 'enhance'
  ORDER BY word_count ASC
) TO '/tmp/gsc_enhance_urls.csv' WITH CSV HEADER;
```

---

## 📚 相关文档

- [GSC URL 标签工具使用指南](./GSC_URL_LABELING_GUIDE.md)
- [未收录 URL 分类工具](./UNINDEXED_URL_CLASSIFICATION.md)
- [AI 页面模板增强清单](./AI_PAGE_TEMPLATE_ENHANCEMENT.md)
- [安全增长蓝图](./SAFE_SCALE_TO_100K_BLUEPRINT.md)

---

## 🎯 下一步

1. ✅ **运行脚本**：处理 1,126 个未收录 URL
2. ✅ **工程验收**：执行 [工程验收 Checklist](./GSC_ENGINEERING_CHECKLIST.md) 的 5 条 SQL
3. ✅ **批量处理**：执行 `supabase/migrations/110_apply_gsc_tags_to_pages.sql`（推荐）
4. ✅ **增强内容**：使用 [Tier Page 模板 V2](./TIER_PAGE_TEMPLATE_V2.md) 增强页面
5. ✅ **监控效果**：持续监控 GSC 健康指标

---

## 📚 相关文档

- [工程验收 Checklist](./GSC_ENGINEERING_CHECKLIST.md) - **必读**：脚本运行后的验收步骤
- [Tier Page 模板 V2](./TIER_PAGE_TEMPLATE_V2.md) - 增强页面内容
- [安全增长蓝图](./SAFE_SCALE_TO_100K_BLUEPRINT.md) - 扩张策略

---

**最后更新**：2026-01-24  
**版本**：v1.1（修复版：表结构一致性、抓取风控、路径限定）
