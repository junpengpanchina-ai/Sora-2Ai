# 最终批量更新方案

## 🎯 问题总结

- 还有 63,083 条未更新
- 之前的 UPDATE 语句执行成功但没有更新任何行
- CTE 方法可能有问题

## ✅ 最终解决方案：直接 UPDATE（最简单）

### 执行步骤

1. **在 Dashboard SQL Editor 中执行这个 SQL**：

```sql
UPDATE page_meta
SET 
  purchase_intent = COALESCE((
    SELECT CASE
      WHEN uc.use_case_type IN ('product-demo-showcase', 'advertising-promotion') THEN 3
      WHEN uc.use_case_type IN ('education-explainer', 'ugc-creator-content') THEN 2
      WHEN uc.use_case_type = 'brand-storytelling' THEN 1
      WHEN uc.use_case_type = 'social-media-content' THEN 0
      ELSE 0
    END
    FROM use_cases uc
    WHERE uc.id = page_meta.page_id
    LIMIT 1
  ), 0),
  layer = COALESCE((
    SELECT CASE
      WHEN uc.use_case_type IN ('product-demo-showcase', 'advertising-promotion') THEN 'conversion'
      WHEN uc.use_case_type IN ('education-explainer', 'ugc-creator-content') THEN 'conversion'
      ELSE 'asset'
    END
    FROM use_cases uc
    WHERE uc.id = page_meta.page_id
    LIMIT 1
  ), 'asset')
WHERE page_type = 'use_case'
  AND status = 'published'
  AND purchase_intent = 0
  AND page_id IN (
    SELECT id
    FROM page_meta
    WHERE page_type = 'use_case'
      AND status = 'published'
      AND purchase_intent = 0
    LIMIT 2000
  );
```

2. **查看结果**：应该显示 "UPDATE 2000" 或更少

3. **检查进度**：
```sql
SELECT COUNT(*) as remaining
FROM page_meta
WHERE page_type = 'use_case'
  AND status = 'published'
  AND purchase_intent = 0;
```

4. **重复执行**：如果 `remaining > 0`，再次执行步骤 1 的 SQL

---

## 📊 预计执行次数

- 剩余：63,083 条
- 每批：2,000 条
- 预计：约 32 次

---

## ⚡ 快速执行技巧

1. **使用快捷键**：`Cmd+Enter` (Mac) 或 `Ctrl+Enter` (Windows)
2. **连续执行**：执行后立即按快捷键再次执行
3. **批量执行**：可以连续按快捷键多次

---

## 🔍 如果还是 "No rows returned"

检查这些记录的实际情况：

```sql
-- 检查前 10 条记录的详细信息
SELECT 
  pm.page_id,
  pm.purchase_intent,
  uc.id as use_case_id,
  uc.use_case_type,
  uc.is_published
FROM page_meta pm
LEFT JOIN use_cases uc ON pm.page_id = uc.id
WHERE pm.page_type = 'use_case'
  AND pm.status = 'published'
  AND pm.purchase_intent = 0
LIMIT 10;
```

---

## ✅ 总结

**最简单可靠的方法**：
- 直接 UPDATE，不使用 CTE
- 使用子查询获取 use_case_type
- 使用 `IN` 子查询限制批次
- 每次 2,000 条，重复执行

**文件位置**：`database/migrations/batch_update_simple_direct.sql`

