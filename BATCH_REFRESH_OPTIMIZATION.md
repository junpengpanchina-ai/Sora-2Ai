# 🔧 批量刷新 AI 分数优化方案

## ⚠️ 当前问题

批量刷新 AI 分数时遇到超时问题，即使使用 10k 的小批次也会超时。

## ✅ 解决方案

### 方案 1: 在 Supabase Dashboard 中直接执行（推荐）

由于数据量太大（21万条），建议在 Supabase Dashboard 的 SQL Editor 中直接执行，这样可以：
- 避免网络超时
- 利用数据库的直接连接
- 更好的错误处理和进度监控

#### 步骤：

1. **访问 Supabase Dashboard**
   - https://supabase.com/dashboard → SQL Editor

2. **执行批量刷新（使用更小的批次）**

```sql
-- 批次 1: 0-5000
SELECT public.refresh_ai_citation_scores(5000, 0);

-- 批次 2: 5000-10000
SELECT public.refresh_ai_citation_scores(5000, 5000);

-- 批次 3: 10000-15000
SELECT public.refresh_ai_citation_scores(5000, 10000);

-- 继续执行，每次增加 5000
-- 直到返回 0（表示没有更多数据需要处理）
```

3. **监控进度**

每次执行后，检查更新了多少条记录：
```sql
SELECT COUNT(*) 
FROM public.use_cases 
WHERE ai_citation_score IS NOT NULL;
```

4. **设置 in_sitemap（Top 20k）**

```sql
-- 先重置所有
UPDATE public.use_cases 
SET in_sitemap = false 
WHERE in_sitemap = true;

-- 设置 Top 20k
UPDATE public.use_cases
SET in_sitemap = true
WHERE id IN (
  SELECT id
  FROM public.use_cases
  WHERE noindex = false
    AND tier = 1
    AND ai_citation_score IS NOT NULL
  ORDER BY ai_citation_score DESC, updated_at DESC
  LIMIT 20000
);
```

### 方案 2: 优化函数性能

如果仍然超时，可以优化 `refresh_ai_citation_scores` 函数，添加索引或优化查询：

```sql
-- 确保有必要的索引
CREATE INDEX IF NOT EXISTS idx_use_cases_tier_noindex 
ON public.use_cases(tier, noindex) 
WHERE noindex = false;

CREATE INDEX IF NOT EXISTS idx_use_cases_updated_at 
ON public.use_cases(updated_at DESC);

-- 检查 scene_prompt_bindings 表的索引
CREATE INDEX IF NOT EXISTS idx_scene_prompt_bindings_scene_id 
ON public.scene_prompt_bindings(scene_id);
```

### 方案 3: 分批执行脚本（后台运行）

如果要在本地运行，可以修改脚本使用更小的批次（1000-2000），并在后台运行：

```bash
# 后台运行，输出到日志文件
nohup npm run execute:ai-citation-migration > migration.log 2>&1 &

# 查看进度
tail -f migration.log
```

## 📊 验证结果

执行完成后，验证结果：

```sql
-- 检查 AI 分数分布
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE ai_citation_score IS NOT NULL) as has_score,
  COUNT(*) FILTER (WHERE ai_citation_score >= 0.5) as score_above_05,
  COUNT(*) FILTER (WHERE ai_citation_score >= 0.7) as score_above_07,
  AVG(ai_citation_score) as avg_score,
  MIN(ai_citation_score) as min_score,
  MAX(ai_citation_score) as max_score
FROM public.use_cases
WHERE noindex = false;

-- 检查 in_sitemap 设置
SELECT 
  COUNT(*) FILTER (WHERE in_sitemap = true) as in_sitemap_count,
  COUNT(*) FILTER (WHERE in_sitemap = false) as not_in_sitemap_count
FROM public.use_cases
WHERE noindex = false AND tier = 1;
```

## 🎯 推荐执行顺序

1. **在 Supabase Dashboard 执行批量刷新**（方案 1）
2. **设置 in_sitemap**（在 Dashboard 中执行 SQL）
3. **运行分类脚本**（本地运行，可以后台执行）

分类脚本可以独立运行，不依赖 AI 分数刷新完成。
