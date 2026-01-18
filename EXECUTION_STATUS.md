# 🚀 执行状态

## ✅ 已完成

1. **SQL 迁移文件已创建**（072-077）
2. **Next.js Sitemap 路由已创建**
3. **关键词分类脚本已创建并优化**

## ⚠️ 当前状态

### 批量刷新 AI 分数
- **状态**: 遇到超时问题
- **原因**: 数据量太大（21万条），单批次 50k 会超时
- **解决方案**: 已优化为更小批次（10k），但需要在 Supabase Dashboard 中手动执行 SQL 迁移后，函数才能使用

### 关键词分类脚本
- **状态**: 正在运行中
- **优化**: 
  - 已修复环境变量加载问题
  - 已修复 keyword 字段不存在问题（改用 title/slug）
  - 已优化批量更新逻辑
  - 已添加进度显示

## 📋 下一步操作

### 1. 在 Supabase Dashboard 执行 SQL 迁移

访问：https://supabase.com/dashboard → SQL Editor

按顺序执行：
- `supabase/migrations/072_ai_citation_score_weights.sql`
- `supabase/migrations/073_ai_citation_score_fn.sql`
- `supabase/migrations/074_ai_citation_score_refresh.sql`
- `supabase/migrations/076_sitemap_tier1_fn.sql`
- `supabase/migrations/077_keyword_classification_fields.sql`

### 2. 执行批量刷新（在 Supabase SQL Editor）

```sql
-- 使用更小的批次避免超时
SELECT public.refresh_ai_citation_scores(10000, 0);
SELECT public.refresh_ai_citation_scores(10000, 10000);
SELECT public.refresh_ai_citation_scores(10000, 20000);
-- ... 继续直到处理完所有数据
```

### 3. 设置 in_sitemap

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

### 4. 运行分类脚本（如果还没完成）

```bash
npm run classify-keywords
```

脚本会自动处理所有有 slug 的记录，并显示进度。

---

## 📊 预期结果

执行完成后：
- ✅ AI 分数已计算并更新
- ✅ Top 20k 记录的 in_sitemap = true
- ✅ 所有记录已分类为 KEEP/MERGE/STOP
- ✅ Sitemap 路由可用（/sitemap.xml）
