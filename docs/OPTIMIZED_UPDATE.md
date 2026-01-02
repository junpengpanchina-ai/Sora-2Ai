# 优化批量更新方案

## 🚨 问题

存储过程执行超时（statement timeout）。

## ✅ 解决方案：优化存储过程

### 步骤 1：执行优化后的存储过程

在 Supabase Dashboard SQL Editor 中执行：

```sql
-- 文件：database/migrations/optimized_batch_update_function.sql
```

**优化点**：
- 使用子查询代替 JOIN（更高效）
- 使用 `IN` 子查询限制批次大小
- 避免复杂的 CTE 操作

### 步骤 2：重新运行脚本

```bash
npm run batch-update-intent-final
```

---

## 🔄 如果还是超时

### 方案 A：减小批次大小

修改脚本中的 `batchSize`：

```typescript
const batchSize = 500  // 改为 500
```

### 方案 B：使用手动分段执行

如果存储过程总是超时，使用手动分段执行：

```sql
-- 每次执行更新 2,000 条
WITH batch AS (
  SELECT pm.page_id
  FROM page_meta pm
  WHERE pm.page_type = 'use_case'
    AND pm.status = 'published'
    AND pm.purchase_intent = 0
  LIMIT 2000
),
updates AS (
  SELECT 
    b.page_id,
    CASE
      WHEN uc.use_case_type IN ('product-demo-showcase', 'advertising-promotion') THEN 3
      WHEN uc.use_case_type IN ('education-explainer', 'ugc-creator-content') THEN 2
      WHEN uc.use_case_type = 'brand-storytelling' THEN 1
      WHEN uc.use_case_type = 'social-media-content' THEN 0
      ELSE 0
    END as purchase_intent,
    CASE
      WHEN uc.use_case_type IN ('product-demo-showcase', 'advertising-promotion') THEN 'conversion'
      WHEN uc.use_case_type IN ('education-explainer', 'ugc-creator-content') THEN 'conversion'
      ELSE 'asset'
    END as layer
  FROM batch b
  INNER JOIN use_cases uc ON b.page_id = uc.id
)
UPDATE page_meta pm
SET 
  purchase_intent = u.purchase_intent,
  layer = u.layer
FROM updates u
WHERE pm.page_id = u.page_id
  AND pm.purchase_intent = 0;

-- 检查进度
SELECT COUNT(*) as remaining
FROM page_meta
WHERE page_type = 'use_case'
  AND status = 'published'
  AND purchase_intent = 0;

-- 重复执行，直到 remaining = 0
```

---

## 📊 推荐方案

1. **先试**：优化后的存储过程 + 脚本
2. **如果超时**：使用手动分段执行（每次 2,000 条）

