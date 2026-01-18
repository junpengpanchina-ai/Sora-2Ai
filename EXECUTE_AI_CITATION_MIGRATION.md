# 🚀 执行 AI Citation Score 迁移指南

## 📋 执行步骤

### 步骤 1: 执行 SQL 迁移文件（必须在 Supabase Dashboard 中执行）

1. **打开 Supabase Dashboard**
   - 访问 https://supabase.com/dashboard
   - 选择你的项目

2. **进入 SQL Editor**
   - 点击左侧菜单的 **SQL Editor**
   - 点击 **New query**

3. **依次执行以下迁移文件**（按顺序执行）：

   #### 1.1 执行 072_ai_citation_score_weights.sql
   - 打开文件：`supabase/migrations/072_ai_citation_score_weights.sql`
   - 复制全部内容
   - 粘贴到 SQL Editor
   - 点击 **Run** 或按 `Cmd+Enter`

   #### 1.2 执行 073_ai_citation_score_fn.sql
   - 打开文件：`supabase/migrations/073_ai_citation_score_fn.sql`
   - 复制全部内容
   - 粘贴到 SQL Editor
   - 点击 **Run**

   #### 1.3 执行 074_ai_citation_score_refresh.sql
   - 打开文件：`supabase/migrations/074_ai_citation_score_refresh.sql`
   - 复制全部内容
   - 粘贴到 SQL Editor
   - 点击 **Run**

   #### 1.4 执行 076_sitemap_tier1_fn.sql
   - 打开文件：`supabase/migrations/076_sitemap_tier1_fn.sql`
   - 复制全部内容
   - 粘贴到 SQL Editor
   - 点击 **Run**

   #### 1.5 执行 077_keyword_classification_fields.sql
   - 打开文件：`supabase/migrations/077_keyword_classification_fields.sql`
   - 复制全部内容
   - 粘贴到 SQL Editor
   - 点击 **Run**

   **注意**：075_set_tier1_in_sitemap.sql 会在步骤 3 中通过脚本自动执行，也可以手动执行。

4. **验证迁移成功**

   在 SQL Editor 中执行以下验证查询：

   ```sql
   -- 检查权重表
   SELECT * FROM public.ai_score_weights ORDER BY key;

   -- 检查函数是否存在
   SELECT routine_name 
   FROM information_schema.routines 
   WHERE routine_schema = 'public' 
     AND routine_name IN ('compute_ai_citation_score', 'refresh_ai_citation_scores', 'get_tier1_sitemap_chunk', 'get_tier1_sitemap_count')
   ORDER BY routine_name;

   -- 检查字段是否存在
   SELECT column_name 
   FROM information_schema.columns 
   WHERE table_schema = 'public' 
     AND table_name = 'use_cases'
     AND column_name IN ('keyword_status', 'merge_into_scene_id')
   ORDER BY column_name;
   ```

---

### 步骤 2: 批量刷新 AI 分数

执行以下 SQL 查询（分批执行，避免超时）：

```sql
-- 批次 1
SELECT public.refresh_ai_citation_scores(50000, 0);

-- 批次 2
SELECT public.refresh_ai_citation_scores(50000, 50000);

-- 批次 3
SELECT public.refresh_ai_citation_scores(50000, 100000);

-- 批次 4
SELECT public.refresh_ai_citation_scores(50000, 150000);

-- 批次 5
SELECT public.refresh_ai_citation_scores(50000, 200000);
```

**或者**运行自动化脚本：

```bash
npm run execute:ai-citation-migration
```

---

### 步骤 3: 设置 in_sitemap（Top 20k）

**选项 A：通过脚本自动执行**

```bash
npm run execute:ai-citation-migration
```

**选项 B：手动执行 SQL**

在 Supabase SQL Editor 中执行：

```sql
-- 先重置所有
UPDATE public.use_cases
SET in_sitemap = false
WHERE true;

-- 设置 Top 20k
UPDATE public.use_cases
SET in_sitemap = true
WHERE id IN (
  SELECT id
  FROM public.use_cases
  WHERE noindex = false
    AND tier = 1
  ORDER BY ai_citation_score DESC NULLS LAST, updated_at DESC NULLS LAST
  LIMIT 20000
);
```

---

### 步骤 4: 运行关键词分类脚本

```bash
npm run classify-keywords
```

或

```bash
tsx scripts/classify-keywords.ts
```

这个脚本会自动将 21 万场景词分类为 KEEP / MERGE / STOP。

---

### 步骤 5: 验证结果

#### 5.1 检查 AI 分数分布

```sql
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE ai_citation_score IS NOT NULL) as has_score,
  COUNT(*) FILTER (WHERE ai_citation_score >= 0.5) as score_above_05,
  COUNT(*) FILTER (WHERE ai_citation_score >= 0.7) as score_above_07,
  AVG(ai_citation_score) as avg_score
FROM public.use_cases
WHERE noindex = false;
```

#### 5.2 检查 in_sitemap 设置

```sql
SELECT 
  COUNT(*) FILTER (WHERE in_sitemap = true) as in_sitemap_count,
  COUNT(*) FILTER (WHERE in_sitemap = false) as not_in_sitemap_count
FROM public.use_cases
WHERE noindex = false AND tier = 1;
```

#### 5.3 检查分类结果

```sql
SELECT 
  keyword_status,
  COUNT(*) as count
FROM public.use_cases
GROUP BY keyword_status
ORDER BY count DESC;
```

#### 5.4 测试 Sitemap 函数

```sql
-- 测试总数
SELECT public.get_tier1_sitemap_count();

-- 测试分片（第一片）
SELECT * FROM public.get_tier1_sitemap_chunk(10, 0);
```

---

### 步骤 6: 在 Search Console 提交新 Sitemap

1. 访问 Google Search Console
2. 进入 **Sitemaps** 部分
3. 提交新的 sitemap URL：`https://sora2aivideos.com/sitemap.xml`
4. **重要**：不要再提交旧的 27k sitemap，避免 crawl budget 被冲散

---

## ✅ 完成检查清单

- [ ] 所有 SQL 迁移文件已执行（072-077）
- [ ] AI 分数已批量刷新完成
- [ ] in_sitemap 已设置为 Top 20k
- [ ] 关键词分类脚本已运行
- [ ] 验证查询全部通过
- [ ] 新 sitemap 已提交到 Search Console

---

## 🐛 故障排除

### 问题 1: 刷新分数时超时

**解决方案**：减少每批次的 limit，例如：

```sql
SELECT public.refresh_ai_citation_scores(10000, 0);
SELECT public.refresh_ai_citation_scores(10000, 10000);
-- ... 继续分批
```

### 问题 2: 函数不存在错误

**解决方案**：确保已执行 073_ai_citation_score_fn.sql 和 074_ai_citation_score_refresh.sql

### 问题 3: 字段不存在错误

**解决方案**：确保已执行 077_keyword_classification_fields.sql

---

## 📊 预期结果

执行完成后，你应该看到：

- ✅ `ai_score_weights` 表有 6 条权重配置
- ✅ `compute_ai_citation_score()` 函数可用
- ✅ `refresh_ai_citation_scores()` 函数可用
- ✅ `get_tier1_sitemap_chunk()` 和 `get_tier1_sitemap_count()` 函数可用
- ✅ 大部分 use_cases 有 ai_citation_score 值（0-1 之间）
- ✅ 约 20,000 条记录的 in_sitemap = true
- ✅ 关键词分类状态（KEEP/MERGE/STOP）已设置
