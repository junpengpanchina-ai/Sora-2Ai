# GSC URL 自动标签工具使用指南

> **功能**：自动将 GSC 导出的 1,126 个未收录 URL 分类为 delete / keep / enhance  
> **包含**：数据库表、自动标签 SQL、Node.js 抓取脚本

---

## 📋 一、快速开始

### 步骤 1：创建数据库表

```bash
# 在 Supabase SQL Editor 中执行
# 文件：supabase/migrations/108_seo_gsc_urls_table.sql
```

或直接运行：
```sql
create table if not exists seo_gsc_urls (
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

### 步骤 2：从 GSC 导出未收录 URL

1. 打开 Google Search Console
2. 进入 **Pages** → **未编入索引**
3. 点击 **导出**，下载 CSV 文件
4. CSV 应包含至少两列：`url`、`reason`

**CSV 格式示例**：
```csv
url,reason
https://sora2aivideos.com/use-cases/xxx,已发现 - 尚未编入索引
https://sora2aivideos.com/use-cases/yyy,重复网页，Google 选择了不同的规范网页
```

---

### 步骤 3：导入 CSV 到数据库

**方法 A：使用 Supabase Table Editor**
1. 打开 Supabase Dashboard
2. 进入 **Table Editor** → **seo_gsc_urls**
3. 点击 **Import**，上传 CSV 文件
4. 确保列名匹配：`url`、`reason`

**方法 B：使用 psql（本地）**
```bash
psql $DATABASE_URL -c "\copy seo_gsc_urls(url, reason) from 'gsc_not_indexed.csv' csv header;"
```

---

### 步骤 4：运行自动标签 SQL（第一版）

```sql
-- 文件：supabase/migrations/109_auto_label_gsc_urls.sql
-- 在 Supabase SQL Editor 中执行
```

这会基于 `reason` 和 URL 形态自动打标签（能覆盖 70% 决策）。

---

### 步骤 5：运行 Node.js 脚本（增强版，可选）

**安装依赖**（如果需要）：
```bash
# Node.js 脚本使用原生 fetch，Node 18+ 无需安装依赖
```

**运行脚本**：
```bash
node scripts/gsc_label_urls.mjs gsc_not_indexed.csv labeled.csv
```

**环境变量**：
```bash
CONCURRENCY=20 TIMEOUT_MS=15000 node scripts/gsc_label_urls.mjs gsc_not_indexed.csv labeled.csv
```

**输出**：
- `labeled.csv`：包含 HTTP 状态、canonical、内容长度、字数、标签

---

### 步骤 6：导入增强数据到数据库

**方法 A：使用 Supabase Table Editor**
1. 创建临时表 `seo_gsc_urls_stage`
2. 导入 `labeled.csv` 到临时表
3. 运行更新 SQL：

```sql
UPDATE seo_gsc_urls u
SET
  http_status = s.http_status,
  canonical_url = nullif(s.canonical_url, ''),
  content_length = s.content_length,
  word_count = s.word_count,
  tag = s.tag,
  tag_reason = s.tag_reason,
  last_seen_at = now()
FROM seo_gsc_urls_stage s
WHERE u.url = s.url;
```

**方法 B：直接更新**
```sql
-- 如果有 labeled.csv，可以手动更新
UPDATE seo_gsc_urls
SET 
  tag = 'delete',
  tag_reason = 'too_thin'
WHERE url = 'https://...'
  AND word_count < 120;
```

---

## 📊 二、查看标签分布

```sql
-- 统计标签分布
SELECT 
  tag,
  count(*) as count,
  round(100.0 * count(*) / (SELECT count(*) FROM seo_gsc_urls), 2) as percentage
FROM seo_gsc_urls
GROUP BY tag
ORDER BY count DESC;
```

---

## 🛠️ 三、批量处理

### 处理"该删"页面

```sql
-- 1. 查找 use_cases 表中对应的记录
UPDATE use_cases
SET 
  noindex = true,
  in_sitemap = false,
  index_health_status = 'deleted',
  updated_at = NOW()
WHERE slug IN (
  SELECT 
    REPLACE(REPLACE(url, 'https://sora2aivideos.com/use-cases/', ''), '/', '') as slug
  FROM seo_gsc_urls
  WHERE tag = 'delete'
    AND url LIKE '%/use-cases/%'
);
```

---

### 处理"该增强"页面

```sql
-- 1. 标记需要增强的页面
UPDATE use_cases
SET 
  index_health_status = 'needs_enhancement',
  updated_at = NOW()
WHERE slug IN (
  SELECT 
    REPLACE(REPLACE(url, 'https://sora2aivideos.com/use-cases/', ''), '/', '') as slug
  FROM seo_gsc_urls
  WHERE tag = 'enhance'
    AND url LIKE '%/use-cases/%'
);
```

---

### 处理"该留"页面

```sql
-- 1. 标记为正常（无需处理）
UPDATE use_cases
SET 
  index_health_status = 'keep_monitoring',
  updated_at = NOW()
WHERE slug IN (
  SELECT 
    REPLACE(REPLACE(url, 'https://sora2aivideos.com/use-cases/', ''), '/', '') as slug
  FROM seo_gsc_urls
  WHERE tag = 'keep'
    AND url LIKE '%/use-cases/%'
);
```

---

## 📝 四、标签分类说明

### delete（该删）

**标准**：
- 内容过薄（< 120 字）
- 重复内容（已有更好的 canonical）
- 测试/占位页面
- 明显错误页面（404、Soft 404）
- 带查询参数的 URL

**处理方式**：
- 设置 `noindex = true`
- 设置 `in_sitemap = false`
- （可选）设置 `canonical_url` 指向主页面

---

### keep（该留）

**标准**：
- 内容完整（≥ 250 字）
- 结构合理
- 只是暂时未收录（"已发现未编入"、"已抓取未编入"）
- 符合 SEO 标准

**处理方式**：
- 无需处理，等待 Google 自然收录
- 持续监控状态

---

### enhance（该增强）

**标准**：
- 内容基本完整但可能触发 Soft 404
- 缺少差异化元素（导致 canonical 问题）
- 缺少关键 SEO 元素（FAQ、结构化数据等）
- 内容质量可提升（120-250 字）

**处理方式**：
- 增强内容差异化
- 添加行业特定内容
- 优化 FAQ 部分
- 增加示例和用例

---

## 🔍 五、常见问题

### Q1: CSV 导入失败？

**检查**：
- CSV 文件编码是否为 UTF-8
- 列名是否匹配：`url`、`reason`
- URL 格式是否正确（完整 URL）

---

### Q2: 脚本运行很慢？

**优化**：
- 降低并发数：`CONCURRENCY=10`
- 增加超时时间：`TIMEOUT_MS=30000`
- 分批处理（每次 500 个 URL）

---

### Q3: 标签不准确？

**纠偏**：
- 运行增强版脚本（抓取 HTTP 状态、canonical、内容长度）
- 手动检查部分 URL
- 调整分类逻辑（修改 SQL）

---

## 📚 六、相关文档

- [未收录 URL 分类工具](./UNINDEXED_URL_CLASSIFICATION.md)
- [AI 页面模板增强清单](./AI_PAGE_TEMPLATE_ENHANCEMENT.md)
- [安全增长蓝图](./SAFE_SCALE_TO_100K_BLUEPRINT.md)

---

**最后更新**：2026-01-22
