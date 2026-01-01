# 快速 SQL 修复指南

> **问题**：SQL 查询报错，因为表结构不匹配  
> **解决方案**：根据实际表结构调整 SQL

---

## ✅ 修正后的 SQL（可直接使用）

### 为 use_cases 创建 page_meta 记录

```sql
-- 为所有 use_cases 创建 page_meta 记录
-- 注意：use_cases 表使用 is_published (BOOLEAN)，不是 status
INSERT INTO page_meta (page_type, page_id, page_slug, status)
SELECT 
  'use_case' as page_type,
  id as page_id,
  slug as page_slug,
  CASE 
    WHEN is_published = TRUE THEN 'published'
    ELSE 'draft'
  END as status
FROM use_cases
ON CONFLICT (page_type, page_id) DO NOTHING;
```

---

### 为 long_tail_keywords 创建 page_meta 记录

```sql
-- 为所有 long_tail_keywords 创建 page_meta 记录
-- 注意：long_tail_keywords 表使用 status (TEXT: 'draft' | 'published')
INSERT INTO page_meta (page_type, page_id, page_slug, status)
SELECT 
  'keyword' as page_type,
  id as page_id,
  page_slug as page_slug,
  status  -- long_tail_keywords 已经有 status 字段
FROM long_tail_keywords
WHERE status = 'published'
ON CONFLICT (page_type, page_id) DO NOTHING;
```

---

## 📊 表结构对比

| 表名 | 发布状态字段 | 字段类型 | 值 |
|------|-------------|---------|-----|
| `use_cases` | `is_published` | BOOLEAN | `TRUE` / `FALSE` |
| `long_tail_keywords` | `status` | TEXT | `'published'` / `'draft'` |
| `page_meta` | `status` | TEXT | `'published'` / `'draft'` / `'paused'` |

---

## 🔍 字段名对比

| 表名 | ID 字段 | Slug 字段 |
|------|--------|-----------|
| `use_cases` | `id` | `slug` |
| `long_tail_keywords` | `id` | `page_slug` |

---

## ✅ 完整 SQL（一次性执行）

```sql
-- ============================================
-- 为现有页面创建 page_meta 记录（完整版）
-- ============================================

-- 1. 为 use_cases 创建 page_meta 记录
INSERT INTO page_meta (page_type, page_id, page_slug, status)
SELECT 
  'use_case' as page_type,
  id as page_id,
  slug as page_slug,
  CASE 
    WHEN is_published = TRUE THEN 'published'
    ELSE 'draft'
  END as status
FROM use_cases
ON CONFLICT (page_type, page_id) DO NOTHING;

-- 2. 为 long_tail_keywords 创建 page_meta 记录
INSERT INTO page_meta (page_type, page_id, page_slug, status)
SELECT 
  'keyword' as page_type,
  id as page_id,
  page_slug as page_slug,
  status
FROM long_tail_keywords
WHERE status = 'published'
ON CONFLICT (page_type, page_id) DO NOTHING;

-- 3. 查看创建结果
SELECT 
  page_type,
  status,
  COUNT(*) as count
FROM page_meta
GROUP BY page_type, status
ORDER BY page_type, status;
```

---

## 🎯 执行步骤

1. **复制上面的完整 SQL**
2. **在 Supabase Dashboard 的 SQL Editor 中粘贴**
3. **点击 Run 执行**
4. **查看结果统计**

---

## 📝 预期结果

执行成功后，你应该看到类似这样的统计：

| page_type | status | count |
|-----------|--------|-------|
| keyword | published | X |
| use_case | published | Y |
| use_case | draft | Z |

---

**现在可以直接使用修正后的 SQL 了！** ✅

