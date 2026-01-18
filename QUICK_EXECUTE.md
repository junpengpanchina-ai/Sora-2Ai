# ⚡ 快速执行指南

## 🎯 执行顺序

### 1️⃣ 执行 SQL 迁移（必须在 Supabase Dashboard 中执行）

访问：https://supabase.com/dashboard → SQL Editor

按顺序执行以下文件：

1. `supabase/migrations/072_ai_citation_score_weights.sql`
2. `supabase/migrations/073_ai_citation_score_fn.sql`
3. `supabase/migrations/074_ai_citation_score_refresh.sql`
4. `supabase/migrations/076_sitemap_tier1_fn.sql`
5. `supabase/migrations/077_keyword_classification_fields.sql`

### 2️⃣ 批量刷新 AI 分数

在 Supabase SQL Editor 中执行：

```sql
SELECT public.refresh_ai_citation_scores(50000, 0);
SELECT public.refresh_ai_citation_scores(50000, 50000);
SELECT public.refresh_ai_citation_scores(50000, 100000);
SELECT public.refresh_ai_citation_scores(50000, 150000);
SELECT public.refresh_ai_citation_scores(50000, 200000);
```

### 3️⃣ 设置 in_sitemap

在 Supabase SQL Editor 中执行：

```sql
UPDATE public.use_cases SET in_sitemap = false WHERE true;

UPDATE public.use_cases
SET in_sitemap = true
WHERE id IN (
  SELECT id
  FROM public.use_cases
  WHERE noindex = false AND tier = 1
  ORDER BY ai_citation_score DESC NULLS LAST, updated_at DESC NULLS LAST
  LIMIT 20000
);
```

### 4️⃣ 运行分类脚本

```bash
npm run classify-keywords
```

---

## ✅ 完成！

详细说明请查看：`EXECUTE_AI_CITATION_MIGRATION.md`
